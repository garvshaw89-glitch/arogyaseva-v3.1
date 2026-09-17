/**
 * Geolocation & Reverse Geocoding Helper for Pan-India CHW Healthcare Delivery
 * Supports instant live GPS detection, reverse-geocoded village/sub-centre naming,
 * and autocomplete search for Indian villages, sub-centres, and districts.
 */

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  villageName: string;
  subCentre?: string;
  district?: string;
  state?: string;
  fullAddress: string;
  timestamp: string;
}

export interface LocationSearchResult {
  placeId: string | number;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  category?: "village" | "sub_centre" | "phc" | "chc" | "district" | "city" | "location";
}

// In-memory cache for the session
let cachedLiveLocation: DetectedLocation | null = null;
const listeners = new Set<(loc: DetectedLocation) => void>();

export function getCachedLiveLocation(): DetectedLocation | null {
  if (cachedLiveLocation) return cachedLiveLocation;
  try {
    const stored = sessionStorage.getItem("arogya_live_location");
    if (stored) {
      cachedLiveLocation = JSON.parse(stored);
      return cachedLiveLocation;
    }
  } catch {
    // ignore
  }
  return null;
}

export function subscribeToLiveLocation(listener: (loc: DetectedLocation) => void): () => void {
  listeners.add(listener);
  if (cachedLiveLocation) {
    listener(cachedLiveLocation);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Parses reverse geocoding address object to format an Indian village or sub-centre label
 */
export function formatIndianVillageName(address: any, defaultCoordsText?: string): string {
  if (!address) return defaultCoordsText || "Live Location";

  // Village / Hamlet / Suburb / Neighbourhood
  const localName =
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.neighbourhood ||
    address.residential ||
    address.isolated_dwelling ||
    address.road ||
    address.town ||
    address.city_district ||
    address.subdistrict;

  // District / Tehsil / City
  const district =
    address.state_district ||
    address.district ||
    address.county ||
    address.city ||
    address.town;

  const state = address.state;

  if (localName && district) {
    return `${localName} (${district}${state ? `, ${state}` : ""})`;
  } else if (localName) {
    return `${localName}${state ? `, ${state}` : ""}`;
  } else if (district) {
    return `${district}${state ? `, ${state}` : ""}`;
  }

  return address.display_name?.split(",").slice(0, 2).join(",") || defaultCoordsText || "Live Location";
}

/**
 * Reverse-geocode latitude & longitude to Indian village / sub-centre & district
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<{
  villageName: string;
  subCentre?: string;
  district?: string;
  state?: string;
  fullAddress: string;
}> {
  try {
    const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const villageName = formatIndianVillageName(addr, `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
      const district = addr.state_district || addr.district || addr.county || addr.city;
      const state = addr.state;

      return {
        villageName,
        district,
        state,
        fullAddress: data.display_name || villageName,
      };
    }
  } catch (err) {
    console.warn("Reverse geocode request failed:", err);
  }

  return {
    villageName: `Live Coordinates (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
    fullAddress: `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
  };
}

/**
 * Acquires the user's real-time device location with high accuracy
 * and reverse geocodes to get real village/town across India.
 */
export async function acquireLiveLocation(forceRefresh = false): Promise<DetectedLocation> {
  if (!forceRefresh && cachedLiveLocation) {
    const ageSeconds = (Date.now() - new Date(cachedLiveLocation.timestamp).getTime()) / 1000;
    if (ageSeconds < 300) {
      return cachedLiveLocation;
    }
  }

  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        try {
          const rev = await reverseGeocodeCoordinates(latitude, longitude);
          const detected: DetectedLocation = {
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            villageName: rev.villageName,
            subCentre: rev.subCentre,
            district: rev.district,
            state: rev.state,
            fullAddress: rev.fullAddress,
            timestamp: new Date().toISOString(),
          };

          cachedLiveLocation = detected;
          try {
            sessionStorage.setItem("arogya_live_location", JSON.stringify(detected));
          } catch {
            // ignore
          }

          listeners.forEach((fn) => fn(detected));
          resolve(detected);
        } catch {
          const fallback: DetectedLocation = {
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            villageName: `Live GPS (${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E)`,
            fullAddress: `GPS Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            timestamp: new Date().toISOString(),
          };
          cachedLiveLocation = fallback;
          listeners.forEach((fn) => fn(fallback));
          resolve(fallback);
        }
      },
      (error) => {
        let msg = "Could not access GPS coordinates";
        if (error.code === 1) msg = "Location permission denied. Please allow GPS access in your browser.";
        else if (error.code === 2) msg = "GPS signal is currently unavailable.";
        else if (error.code === 3) msg = "GPS request timed out.";
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );
  });
}

/**
 * Searches Indian villages, sub-centres, health facilities, and districts
 */
export async function searchIndianLocations(query: string): Promise<LocationSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await fetch(`/api/search-location?q=${encodeURIComponent(trimmed)}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data && data.success && Array.isArray(data.results)) {
      return data.results.map((r: any) => {
        const lowerName = (r.name || r.displayName || "").toLowerCase();
        let category: LocationSearchResult["category"] = "location";

        if (lowerName.includes("sub centre") || lowerName.includes("subcenter") || lowerName.includes("sub-centre") || lowerName.includes("arogya mandir") || lowerName.includes("hwc")) {
          category = "sub_centre";
        } else if (lowerName.includes("phc") || lowerName.includes("primary health")) {
          category = "phc";
        } else if (lowerName.includes("chc") || lowerName.includes("community health")) {
          category = "chc";
        } else if (r.type === "village" || lowerName.includes("village") || lowerName.includes("gao") || lowerName.includes("kalan") || lowerName.includes("khurd")) {
          category = "village";
        } else if (r.type === "administrative" || lowerName.includes("district") || lowerName.includes("tehsil")) {
          category = "district";
        } else if (r.type === "city" || r.type === "town") {
          category = "city";
        }

        return {
          placeId: r.placeId,
          name: r.name,
          displayName: r.displayName,
          latitude: r.latitude,
          longitude: r.longitude,
          type: r.type,
          category,
        };
      });
    }
  } catch (err) {
    console.warn("Search location request failed:", err);
  }

  return [];
}
