import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { HealthcareFacility, LiveLocationData } from "../../types";
import {
  getOfflineTileStats,
  preCacheDistrictHospitalTiles,
  clearOfflineTileCache,
  getTileUrlOrFallback,
  createOfflineFallbackTileDataUrl,
} from "../../utils/offlineTileCache";
import {
  MapPin,
  Search,
  Wifi,
  WifiOff,
  Download,
  Trash2,
  Navigation,
  CheckCircle,
  Clock,
  Compass,
  Layers,
  Sparkles,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Radio,
  Crosshair,
  Share2,
  Activity,
  Send,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface OsmOfflineMapProps {
  facilities: HealthcareFacility[];
  selectedFacility: HealthcareFacility;
  onSelectFacility: (facility: HealthcareFacility) => void;
  patientVillage?: string;
  villageCoords?: [number, number]; // [lat, lon]
}

export const OsmOfflineMap: React.FC<OsmOfflineMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  patientVillage = "Rampur Hamlet",
  villageCoords = [22.7533, 77.7291],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const liveTrackingLayerRef = useRef<L.LayerGroup | null>(null);

  // Markers refs for live updates
  const liveGpsMarkerRef = useRef<L.Marker | null>(null);
  const liveGpsCircleRef = useRef<L.Circle | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const breadcrumbTrailRef = useRef<L.Polyline | null>(null);

  // Offline Caching states
  const [isSimulateOffline, setIsSimulateOffline] = useState(false);
  const [cacheStats, setCacheStats] = useState({ count: 0, estimatedSizeMb: "0.0" });
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState<{ done: number; total: number; z: number } | null>(null);
  const [cacheSuccessMsg, setCacheSuccessMsg] = useState<string | null>(null);

  // Geocoding search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Routing info & waypoints
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMins: number; source: string } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // LIVE LOCATION TRACKER STATES:
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LiveLocationData | null>(null);
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [followVehicle, setFollowVehicle] = useState(true);

  // AMBULANCE TRANSIT SIMULATION:
  const [isSimulatingTransit, setIsSimulatingTransit] = useState(false);
  const [transitIndex, setTransitIndex] = useState(0);
  const [transitSpeedMultiplier, setTransitSpeedMultiplier] = useState<1 | 2 | 4>(2);
  const [simulatedSpeedKmH, setSimulatedSpeedKmH] = useState(45);
  const [transitCompleted, setTransitCompleted] = useState(false);

  // DOCTOR TELEMETRY BROADCAST:
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  // Refresh cache stats
  const refreshCacheStats = async () => {
    const stats = await getOfflineTileStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    refreshCacheStats();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(container, {
      center: [villageCoords[0], villageCoords[1]],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    leafletMapRef.current = map;

    // Custom offline-first tile layer with CacheStorage
    const CustomOfflineTileLayer = (L.TileLayer as any).extend({
      createTile: function (
        coords: { z: number; x: number; y: number },
        done: (err: any, tile: HTMLImageElement) => void
      ) {
        const tile = document.createElement("img");
        tile.setAttribute("role", "presentation");
        tile.alt = "";

        getTileUrlOrFallback(coords.z, coords.x, coords.y, isSimulateOffline)
          .then((url) => {
            tile.src = url;
            tile.onload = () => done(null, tile);
            tile.onerror = () => {
              tile.src = createOfflineFallbackTileDataUrl(coords.z, coords.x, coords.y);
              done(null, tile);
            };
          })
          .catch(() => {
            tile.src = createOfflineFallbackTileDataUrl(coords.z, coords.x, coords.y);
            done(null, tile);
          });

        return tile;
      },
    });

    const tileLayer = new CustomOfflineTileLayer("/api/tile/{z}/{x}/{y}", {
      maxZoom: 18,
      minZoom: 9,
      attribution: '&copy; OpenStreetMap | ArogyaSeva Offline Cache',
    });
    tileLayer.addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    liveTrackingLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, [isSimulateOffline]);

  // Render Markers and Route when selectedFacility or facilities change
  useEffect(() => {
    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    // 1. Patient Village Marker
    const villageHtml = `
      <div class="flex items-center gap-1.5 bg-[#0B1F3A] text-white font-bold text-[11px] px-2.5 py-1 rounded-full shadow-lg border-2 border-[#19E6C1] whitespace-nowrap">
        <span class="w-2 h-2 rounded-full bg-[#19E6C1] animate-ping"></span>
        <span>📍 ${patientVillage}</span>
      </div>
    `;
    const villageIcon = L.divIcon({
      html: villageHtml,
      className: "custom-leaflet-marker",
      iconSize: [120, 28],
      iconAnchor: [60, 14],
    });

    L.marker([villageCoords[0], villageCoords[1]], { icon: villageIcon })
      .addTo(markersLayer)
      .bindPopup(`<b>Patient Origin:</b> ${patientVillage}<br/><small>ASHA Subcentre Sector</small>`);

    // 2. Healthcare Facility Markers
    facilities.forEach((fac) => {
      const isTarget = fac.id === selectedFacility.id;
      const isDistrict = fac.type.includes("District");
      const bgColor = isTarget
        ? "bg-[#00C2D7] ring-4 ring-[rgba(0,194,215,0.35)] text-[#0B1F3A]"
        : isDistrict
        ? "bg-[#0B1F3A] text-white border border-[#22D3EE]/50"
        : "bg-[#164E78] text-white";

      const markerHtml = `
        <div class="cursor-pointer transition-transform hover:scale-110 flex items-center gap-1 ${bgColor} text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-xl border border-white/80 whitespace-nowrap">
          <span>${isDistrict ? "🏥" : "⚕️"}</span>
          <span>${fac.name.split(" ")[0]} (${fac.distanceKm}km)</span>
        </div>
      `;

      const facIcon = L.divIcon({
        html: markerHtml,
        className: "custom-facility-marker",
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      const m = L.marker([fac.latitude, fac.longitude], { icon: facIcon }).addTo(markersLayer);

      m.on("click", () => {
        playHapticSound("click");
        onSelectFacility(fac);
      });

      m.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; color: #0A172A;">
          <b style="color: #0B1F3A; font-size: 13px;">${fac.name}</b><br/>
          <span style="color: #527086; font-size: 11px;">${fac.type}</span><br/>
          <div style="margin-top: 6px; font-size: 11px; line-height: 1.4;">
            <b>Distance:</b> ${fac.distanceKm} km (~${fac.travelTimeMins} mins)<br/>
            <b>Available Beds:</b> ${fac.availableBeds} (ICU: ${fac.icuBedsAvailable})<br/>
            <b>Oxygen Support:</b> ${fac.hasOxygen ? "✅ 24x7 Pipeline" : "❌ No"}<br/>
            <b>Emergency:</b> <span style="color: #DC2626; font-weight: bold;">${fac.emergencyHotline}</span>
          </div>
        </div>
      `);
    });

    // 3. Fetch Road Route or Render Fallback Path
    const fetchRoute = async () => {
      const startParam = `${villageCoords[0]},${villageCoords[1]}`;
      const endParam = `${selectedFacility.latitude},${selectedFacility.longitude}`;

      try {
        const res = await fetch(`/api/route?start=${startParam}&end=${endParam}`);
        const data = await res.json();

        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationMins = Math.round(route.duration / 60);

          setRouteInfo({
            distanceKm: parseFloat(distanceKm),
            durationMins,
            source: isSimulateOffline ? "Offline Route Cache" : "Live OSRM Routing Engine",
          });

          // Draw road polyline on Leaflet
          const coords = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]) as [number, number][];
          setRouteCoordinates(coords);
          setTransitIndex(0);
          setTransitCompleted(false);

          const polyline = L.polyline(coords, {
            color: "#00C2D7",
            weight: 5,
            opacity: 0.9,
            dashArray: "6, 8",
          }).addTo(routeLayer);

          map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        }
      } catch (err) {
        console.warn("Routing fetch error, drawing direct corridor:", err);
        const coords: [number, number][] = [
          [villageCoords[0], villageCoords[1]],
          [selectedFacility.latitude, selectedFacility.longitude],
        ];
        setRouteCoordinates(coords);
        L.polyline(coords, { color: "#F59E0B", weight: 4, dashArray: "5, 5" }).addTo(routeLayer);
      }
    };

    fetchRoute();
  }, [selectedFacility, facilities, villageCoords, isSimulateOffline]);

  // --- LIVE GPS TRACKING LOGIC ---
  const toggleLiveGpsTracking = () => {
    playHapticSound("click");

    if (isLiveGpsActive) {
      // Stop tracking
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        setGpsWatchId(null);
      }
      setIsLiveGpsActive(false);

      if (liveGpsMarkerRef.current && liveTrackingLayerRef.current) {
        liveTrackingLayerRef.current.removeLayer(liveGpsMarkerRef.current);
        liveGpsMarkerRef.current = null;
      }
      if (liveGpsCircleRef.current && liveTrackingLayerRef.current) {
        liveTrackingLayerRef.current.removeLayer(liveGpsCircleRef.current);
        liveGpsCircleRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setGpsError(null);
    setIsLiveGpsActive(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        const speed = pos.coords.speed !== null ? pos.coords.speed * 3.6 : null; // km/h
        const heading = pos.coords.heading;

        const locData: LiveLocationData = {
          latitude: lat,
          longitude: lon,
          accuracyMeters: accuracy,
          speedKmH: speed,
          headingDegrees: heading,
          timestamp: new Date().toISOString(),
          isSimulated: false,
        };
        setLiveLocation(locData);

        const map = leafletMapRef.current;
        const layer = liveTrackingLayerRef.current;
        if (!map || !layer) return;

        // Update or create live GPS marker
        const liveHtml = `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>
            <div class="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-bold">
              📡
            </div>
          </div>
        `;
        const liveIcon = L.divIcon({
          html: liveHtml,
          className: "custom-live-gps-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        if (!liveGpsMarkerRef.current) {
          liveGpsMarkerRef.current = L.marker([lat, lon], { icon: liveIcon }).addTo(layer);
          liveGpsCircleRef.current = L.circle([lat, lon], {
            radius: Math.min(accuracy, 250),
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(layer);
        } else {
          liveGpsMarkerRef.current.setLatLng([lat, lon]);
          if (liveGpsCircleRef.current) {
            liveGpsCircleRef.current.setLatLng([lat, lon]);
            liveGpsCircleRef.current.setRadius(Math.min(accuracy, 250));
          }
        }

        if (followVehicle) {
          map.panTo([lat, lon], { animate: true });
        }
      },
      (err) => {
        console.warn("Live GPS error:", err.message);
        setGpsError(err.message || "Unable to acquire real GPS location.");
        setIsLiveGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 3000,
      }
    );

    setGpsWatchId(watchId);
  };

  // Center on Live Location or Village
  const handleCenterOnLocation = () => {
    playHapticSound("click");
    const map = leafletMapRef.current;
    if (!map) return;

    if (liveLocation) {
      map.setView([liveLocation.latitude, liveLocation.longitude], 14, { animate: true });
    } else {
      map.setView([villageCoords[0], villageCoords[1]], 13, { animate: true });
    }
  };

  // --- AMBULANCE TRANSIT SIMULATION ENGINE ---
  useEffect(() => {
    if (!isSimulatingTransit || routeCoordinates.length === 0) return;

    const intervalMs = Math.round(750 / transitSpeedMultiplier);
    const timer = setInterval(() => {
      setTransitIndex((prev) => {
        if (prev >= routeCoordinates.length - 1) {
          setIsSimulatingTransit(false);
          setTransitCompleted(true);
          playHapticSound("success");
          return prev;
        }

        const next = prev + 1;
        const currentCoord = routeCoordinates[next];
        const nextCoord = routeCoordinates[Math.min(next + 1, routeCoordinates.length - 1)];

        // Compute heading angle
        const dLon = nextCoord[1] - currentCoord[1];
        const dLat = nextCoord[0] - currentCoord[0];
        const headingDeg = (Math.atan2(dLon, dLat) * 180) / Math.PI;

        const currentSpeed = Math.round(38 + Math.sin(next * 0.4) * 8);
        setSimulatedSpeedKmH(currentSpeed);

        const simulatedData: LiveLocationData = {
          latitude: currentCoord[0],
          longitude: currentCoord[1],
          speedKmH: currentSpeed,
          headingDegrees: headingDeg,
          timestamp: new Date().toISOString(),
          isSimulated: true,
        };
        setLiveLocation(simulatedData);

        // Update Ambulance Marker on Leaflet
        const map = leafletMapRef.current;
        const layer = liveTrackingLayerRef.current;
        if (map && layer) {
          const ambulanceHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute w-8 h-8 rounded-full bg-red-500/40 animate-ping"></div>
              <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-white shadow-2xl flex items-center justify-center text-white text-xs font-black ring-2 ring-red-400">
                🚑
              </div>
            </div>
          `;
          const ambIcon = L.divIcon({
            html: ambulanceHtml,
            className: "custom-ambulance-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });

          if (!ambulanceMarkerRef.current) {
            ambulanceMarkerRef.current = L.marker([currentCoord[0], currentCoord[1]], { icon: ambIcon }).addTo(layer);
          } else {
            ambulanceMarkerRef.current.setLatLng([currentCoord[0], currentCoord[1]]);
          }

          // Traversed breadcrumb trail
          const breadcrumbs = routeCoordinates.slice(0, next + 1);
          if (!breadcrumbTrailRef.current) {
            breadcrumbTrailRef.current = L.polyline(breadcrumbs, {
              color: "#10b981",
              weight: 5,
              opacity: 0.95,
            }).addTo(layer);
          } else {
            breadcrumbTrailRef.current.setLatLngs(breadcrumbs);
          }

          if (followVehicle) {
            map.panTo([currentCoord[0], currentCoord[1]], { animate: true });
          }
        }

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulatingTransit, routeCoordinates, transitSpeedMultiplier, followVehicle]);

  // Simulation controls
  const handleToggleSimulation = () => {
    playHapticSound("click");
    if (transitCompleted) {
      setTransitIndex(0);
      setTransitCompleted(false);
      if (breadcrumbTrailRef.current) {
        breadcrumbTrailRef.current.setLatLngs([]);
      }
    }
    setIsSimulatingTransit((prev) => !prev);
  };

  const handleResetSimulation = () => {
    playHapticSound("click");
    setIsSimulatingTransit(false);
    setTransitIndex(0);
    setTransitCompleted(false);
    if (breadcrumbTrailRef.current && liveTrackingLayerRef.current) {
      liveTrackingLayerRef.current.removeLayer(breadcrumbTrailRef.current);
      breadcrumbTrailRef.current = null;
    }
    if (ambulanceMarkerRef.current && liveTrackingLayerRef.current) {
      liveTrackingLayerRef.current.removeLayer(ambulanceMarkerRef.current);
      ambulanceMarkerRef.current = null;
    }
    if (leafletMapRef.current && routeCoordinates.length > 0) {
      leafletMapRef.current.setView([villageCoords[0], villageCoords[1]], 12);
    }
  };

  // Broadcast Live Telemetry to Receiving Doctor
  const handleBroadcastTelemetry = async () => {
    playHapticSound("alert");
    setIsBroadcasting(true);

    const lat = liveLocation?.latitude || villageCoords[0];
    const lon = liveLocation?.longitude || villageCoords[1];

    try {
      const res = await fetch("/api/telemetry/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: `CASE-REF-${selectedFacility.id}`,
          latitude: lat,
          longitude: lon,
          speedKmH: liveLocation?.speedKmH || simulatedSpeedKmH,
          heading: liveLocation?.headingDegrees || 0,
          status: "IN_TRANSIT",
          patientName: "Emergency Referral Patient",
          targetFacilityName: selectedFacility.name,
        }),
      });

      if (res.ok) {
        playHapticSound("success");
        setBroadcastStatus(`Live Telemetry streamed to ${selectedFacility.name} Doctor Console!`);
        setTimeout(() => setBroadcastStatus(null), 4500);
      }
    } catch (err) {
      console.warn("Failed to broadcast telemetry:", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Pre-cache tiles for rural district
  const handlePreCacheTiles = async () => {
    playHapticSound("click");
    setIsCaching(true);
    setCacheProgress({ done: 0, total: 48, z: 11 });

    const res = await preCacheDistrictHospitalTiles(
      villageCoords[0],
      villageCoords[1],
      [10, 11, 12, 13],
      (done, total, z) => {
        setCacheProgress({ done, total, z });
      }
    );

    setIsCaching(false);
    setCacheProgress(null);
    if (res.success) {
      playHapticSound("success");
      setCacheSuccessMsg(`District tiles successfully saved for offline use! (${res.totalCached} tiles)`);
      setTimeout(() => setCacheSuccessMsg(null), 4000);
      refreshCacheStats();
    }
  };

  // Clear offline cache
  const handleClearCache = async () => {
    playHapticSound("click");
    await clearOfflineTileCache();
    await refreshCacheStats();
  };

  // Geocoding Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && leafletMapRef.current) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        leafletMapRef.current.setView([lat, lon], 13);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Remaining Distance and ETA calculation
  const progressRatio = routeCoordinates.length > 0 ? transitIndex / (routeCoordinates.length - 1) : 0;
  const totalKm = routeInfo?.distanceKm || selectedFacility.distanceKm;
  const remainingKm = Math.max(0, parseFloat((totalKm * (1 - progressRatio)).toFixed(1)));
  const remainingMins = Math.max(1, Math.round(remainingKm / ((simulatedSpeedKmH || 40) / 60)));

  return (
    <div id="osm-offline-map-container" className="space-y-3">
      {/* 1. Primary Live Location & Transit Command Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                LIVE LOCATION & AMBULANCE TRACKER
              </span>
              <span className={`w-2 h-2 rounded-full ${isLiveGpsActive || isSimulatingTransit ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {isSimulatingTransit
                ? `108 Ambulance En Route • ${simulatedSpeedKmH} km/h • ${remainingKm} km to ${selectedFacility.name.split(" ")[0]}`
                : isLiveGpsActive
                ? `GPS Active: ${liveLocation ? `${liveLocation.latitude.toFixed(4)}°N, ${liveLocation.longitude.toFixed(4)}°E` : "Acquiring satellite lock..."}`
                : "Tracking standby • Toggle real GPS or start 108 transit simulation"}
            </p>
          </div>
        </div>

        {/* Live Location Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Real Device GPS Tracker */}
          <button
            id="btn-toggle-live-gps"
            onClick={toggleLiveGpsTracking}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiveGpsActive
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30"
                : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveGpsActive ? "animate-spin" : ""}`} />
            <span>{isLiveGpsActive ? "Stop GPS" : "Track My GPS"}</span>
          </button>

          {/* 108 Ambulance Simulation */}
          <button
            id="btn-simulate-ambulance-run"
            onClick={handleToggleSimulation}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              isSimulatingTransit
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30"
                : "bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-md"
            }`}
          >
            {isSimulatingTransit ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>
              {isSimulatingTransit ? "Pause Ambulance" : transitCompleted ? "Replay Ambulance" : "Simulate 108 Run"}
            </span>
          </button>

          {/* Reset button */}
          {(transitIndex > 0 || isSimulatingTransit) && (
            <button
              id="btn-reset-ambulance-sim"
              onClick={handleResetSimulation}
              title="Reset Ambulance to Village"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Speed multiplier */}
          {isSimulatingTransit && (
            <div className="flex bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-[10px] font-mono">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setTransitSpeedMultiplier(s)}
                  className={`px-2 py-1 rounded-lg font-bold cursor-pointer ${
                    transitSpeedMultiplier === s ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          {/* Center / Follow Toggle */}
          <button
            id="btn-follow-vehicle"
            onClick={() => {
              playHapticSound("click");
              setFollowVehicle((prev) => !prev);
              handleCenterOnLocation();
            }}
            title={followVehicle ? "Following Vehicle (Click to free pan)" : "Free Pan (Click to follow)"}
            className={`p-1.5 rounded-xl border cursor-pointer ${
              followVehicle
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Broadcast to Doctor */}
          <button
            id="btn-broadcast-telemetry"
            onClick={handleBroadcastTelemetry}
            disabled={isBroadcasting}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${isBroadcasting ? "animate-ping" : ""}`} />
            <span>{isBroadcasting ? "Sending..." : "Beam to Doctor"}</span>
          </button>
        </div>
      </div>

      {/* Broadcast confirmation pill */}
      {broadcastStatus && (
        <div className="bg-purple-950/90 border border-purple-500/50 rounded-xl p-2.5 text-purple-200 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span>{broadcastStatus}</span>
          </div>
          <span className="text-[10px] bg-purple-900 px-2 py-0.5 rounded-full text-purple-300">
            DISPATCH SYNCED
          </span>
        </div>
      )}

      {/* GPS Error fallback banner */}
      {gpsError && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl p-2.5 text-amber-200 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{gpsError} — You can use the "Simulate 108 Run" button to test dynamic tracking without physical movement.</span>
        </div>
      )}

      {/* 2. Secondary Tile Cache & Offline Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 font-mono">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulateOffline ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
              }`}
            />
            <span className="text-slate-300">
              {isSimulateOffline ? "Offline Mode Active" : "Online Mode (Tile Cache Active)"}
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            District Cache: <strong className="text-cyan-400">{cacheStats.count} tiles ({cacheStats.estimatedSizeMb} MB)</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-simulate-offline-mode"
            onClick={() => {
              playHapticSound("click");
              setIsSimulateOffline((prev) => !prev);
            }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
              isSimulateOffline
                ? "bg-amber-500/20 border-amber-400 text-amber-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
            }`}
          >
            {isSimulateOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>{isSimulateOffline ? "Disable Offline Mode" : "Simulate Offline"}</span>
          </button>

          <button
            id="btn-precache-tiles-quick"
            onClick={handlePreCacheTiles}
            disabled={isCaching}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            <span>{isCaching ? "Downloading..." : "Pre-cache Tiles"}</span>
          </button>

          {cacheStats.count > 0 && (
            <button
              id="btn-clear-tiles-quick"
              onClick={handleClearCache}
              title="Clear Cache"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Progress notification */}
      {isCaching && cacheProgress && (
        <div className="bg-cyan-950/80 border border-cyan-500/50 rounded-xl p-3 text-cyan-200 text-xs font-mono flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Pre-caching district tiles (Zoom {cacheProgress.z}): {cacheProgress.done} / {cacheProgress.total}</span>
          </div>
          <span className="font-bold text-cyan-300">{Math.round((cacheProgress.done / cacheProgress.total) * 100)}%</span>
        </div>
      )}

      {cacheSuccessMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-2.5 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{cacheSuccessMsg}</span>
        </div>
      )}

      {/* 3. Address & Hospital Geocoding Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            id="input-osm-geocode-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, village, or hospital name (e.g. Rampur, Civil Hospital, Bhimnagar)..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
        >
          {isSearching ? "Searching..." : "Geocode"}
        </button>
      </form>

      {/* Search results dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
          {searchResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (leafletMapRef.current) {
                  leafletMapRef.current.setView([parseFloat(r.lat), parseFloat(r.lon)], 14);
                  setSearchResults([]);
                }
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
            >
              <span className="truncate pr-2">{r.display_name}</span>
              <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                {parseFloat(r.lat).toFixed(2)}, {parseFloat(r.lon).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 4. Leaflet Map Canvas with Live Telemetry Overlay */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <div
          ref={mapContainerRef}
          className="w-full h-[380px] relative z-0"
          style={{ background: "#0f172a" }}
        />

        {/* Top-Right Speedometer & Navigation Telemetry HUD */}
        {(isSimulatingTransit || isLiveGpsActive) && (
          <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 text-white shadow-2xl z-[400] text-xs font-mono space-y-2 min-w-[200px]">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" /> LIVE TELEMETRY
              </span>
              <span className="text-[9px] bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.2 rounded-md font-bold">
                108 DISPATCH
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block">SPEED</span>
                <span className="text-base font-black text-cyan-300 font-display">
                  {liveLocation?.speedKmH || simulatedSpeedKmH} <span className="text-[10px] font-normal text-slate-400 font-mono">km/h</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ETA</span>
                <span className="text-base font-black text-amber-300 font-display">
                  ~{remainingMins} <span className="text-[10px] font-normal text-slate-400 font-mono">mins</span>
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>REMAINING</span>
                <strong className="text-white">{remainingKm} km</strong>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.round(progressRatio * 100))}%` }}
                />
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
              <span>TARGET:</span>
              <span className="text-red-400 font-bold truncate max-w-[120px]">{selectedFacility.name.split(" ")[0]}</span>
            </div>
          </div>
        )}

        {/* Bottom-Left Route Distance Telemetry Overlay */}
        {routeInfo && (
          <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-2.5 text-white shadow-xl z-[400] text-[11px] font-mono flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Navigation className="w-3.5 h-3.5" />
              <span>
                Road Distance: <strong>{routeInfo.distanceKm} km</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Standard ETA: <strong>~{routeInfo.durationMins} mins</strong>
              </span>
            </div>
            <span className="text-slate-400 text-[10px] border-l border-slate-700 pl-2">
              {routeInfo.source}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
