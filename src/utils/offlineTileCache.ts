// Client-Side Offline Tile Caching Mechanism for ReferralMap3D & OpenStreetMap
// Uses Browser CacheStorage API with procedural grid fallback for zero-network conditions

const CACHE_NAME = "arogyaseva-osm-tiles-v1";

// Convert latitude/longitude to OpenStreetMap Slippy Map tile coordinates
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

export function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export function tile2lon(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

export function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Procedural fallback tile generator when completely offline and tile is not yet pre-cached.
 * Generates an SVG/Canvas data URL representing topographic grid coordinates.
 */
export function createOfflineFallbackTileDataUrl(
  z: number,
  x: number,
  y: number
): string {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Base earthy terrain tint (rural district grid)
  ctx.fillStyle = "#1e293b"; // dark slate
  ctx.fillRect(0, 0, 256, 256);

  // Grid lines
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, 256, 256);

  // Watermark text
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 10px monospace";
  ctx.fillText(`OFFLINE TERRAIN [Z:${z}]`, 14, 24);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "9px monospace";
  ctx.fillText(`X:${x} Y:${y}`, 14, 40);

  const approxLat = tile2lat(y, z).toFixed(3);
  const approxLon = tile2lon(x, z).toFixed(3);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText(`~${approxLat}°, ${approxLon}°`, 14, 56);

  ctx.fillStyle = "#10b981";
  ctx.font = "8px sans-serif";
  ctx.fillText(`✓ Facility Overlay Active`, 14, 240);

  return canvas.toDataURL("image/png");
}

/**
 * Check if the browser supports CacheStorage
 */
function hasCacheSupport(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/**
 * Get count and estimated storage size of cached map tiles
 */
export async function getOfflineTileStats(): Promise<{
  count: number;
  estimatedSizeMb: string;
}> {
  if (!hasCacheSupport()) return { count: 0, estimatedSizeMb: "0.0" };
  try {
    const cache = await window.caches.open(CACHE_NAME);
    const keys = await cache.keys();
    // Typical OSM png tile is ~18KB to 26KB
    const approxBytes = keys.length * 22 * 1024;
    const mb = (approxBytes / (1024 * 1024)).toFixed(2);
    return {
      count: keys.length,
      estimatedSizeMb: mb,
    };
  } catch (err) {
    console.warn("Error getting tile cache stats:", err);
    return { count: 0, estimatedSizeMb: "0.0" };
  }
}

/**
 * Clear all cached tiles
 */
export async function clearOfflineTileCache(): Promise<boolean> {
  if (!hasCacheSupport()) return false;
  try {
    return await window.caches.delete(CACHE_NAME);
  } catch (err) {
    console.warn("Failed to clear offline tile cache:", err);
    return false;
  }
}

/**
 * Pre-cache tiles around the rural district center (e.g. Rampur/Bhimnagar district)
 * for immediate zero-internet access.
 */
export async function preCacheDistrictHospitalTiles(
  centerLat = 22.76,
  centerLon = 77.78,
  zooms: number[] = [10, 11, 12, 13],
  onProgress?: (cached: number, total: number, currentZoom: number) => void
): Promise<{ success: boolean; totalCached: number }> {
  if (!hasCacheSupport()) return { success: false, totalCached: 0 };

  try {
    const cache = await window.caches.open(CACHE_NAME);

    // Calculate tile bounding box around the district (+/- 0.25 deg)
    const deltaLat = 0.22;
    const deltaLon = 0.28;

    const tileRequests: { z: number; x: number; y: number; url: string }[] = [];

    zooms.forEach((zoom) => {
      const minX = lon2tile(centerLon - deltaLon, zoom);
      const maxX = lon2tile(centerLon + deltaLon, zoom);
      const minY = lat2tile(centerLat + deltaLat, zoom);
      const maxY = lat2tile(centerLat - deltaLat, zoom);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tileRequests.push({
            z: zoom,
            x,
            y,
            url: `/api/tile/${zoom}/${x}/${y}`,
          });
        }
      }
    });

    let completed = 0;
    const batchSize = 6;

    for (let i = 0; i < tileRequests.length; i += batchSize) {
      const batch = tileRequests.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item) => {
          try {
            const cachedRes = await cache.match(item.url);
            if (!cachedRes) {
              // Fetch through our API or fallback to direct tile
              const res = await fetch(item.url);
              if (res.ok) {
                await cache.put(item.url, res.clone());
              }
            }
          } catch {
            // If offline, ignore network failures during pre-caching
          } finally {
            completed++;
            if (onProgress) {
              onProgress(completed, tileRequests.length, item.z);
            }
          }
        })
      );
    }

    return { success: true, totalCached: completed };
  } catch (err) {
    console.error("Failed to pre-cache district tiles:", err);
    return { success: false, totalCached: 0 };
  }
}

/**
 * Fetch a single tile with offline CacheStorage check first, then network, then fallback canvas
 */
export async function getTileUrlOrFallback(
  z: number,
  x: number,
  y: number,
  forceOffline = false
): Promise<string> {
  const tileUrl = `/api/tile/${z}/${x}/${y}`;

  if (hasCacheSupport()) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const cached = await cache.match(tileUrl);
      if (cached) {
        const blob = await cached.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // cache lookup fail, proceed
    }
  }

  // If forceOffline simulation or strictly offline
  if (forceOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return createOfflineFallbackTileDataUrl(z, x, y);
  }

  try {
    const res = await fetch(tileUrl);
    if (res.ok) {
      const clone = res.clone();
      if (hasCacheSupport()) {
        const cache = await window.caches.open(CACHE_NAME);
        cache.put(tileUrl, clone).catch(() => {});
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
    // Network failed -> return procedural offline fallback
  }

  return createOfflineFallbackTileDataUrl(z, x, y);
}
