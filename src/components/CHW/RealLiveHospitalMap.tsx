import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import { HealthcareFacility, LiveLocationData } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  Hospital,
  MapPin,
  Clock,
  PhoneCall,
  Wind,
  Droplet,
  Baby,
  ShieldCheck,
  Navigation,
  CheckCircle,
  AlertCircle,
  Crosshair,
  Search,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  ArrowRight,
  ExternalLink,
  Phone,
  Bed,
  Route,
} from "lucide-react";

interface RealLiveHospitalMapProps {
  initialCoords?: { latitude: number; longitude: number };
  selectedFacilityId?: string;
  onSelectFacility?: (facility: HealthcareFacility) => void;
  requiredFacilityLevel?: string;
  patientVillage?: string;
  patientName?: string;
  onProceedWithFacility?: (facility: HealthcareFacility) => void;
  className?: string;
  compact?: boolean;
}

type TileLayerType = "street" | "satellite";

const TILE_LAYERS: Record<TileLayerType, { url: string; attribution: string; name: string }> = {
  street: {
    name: "Street Map (OSM)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: "Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

export const RealLiveHospitalMap: React.FC<RealLiveHospitalMapProps> = ({
  initialCoords,
  selectedFacilityId: externalSelectedId,
  onSelectFacility,
  requiredFacilityLevel = "District Hospital",
  patientVillage = "Rampur Hamlet",
  patientName = "Emergency Patient",
  onProceedWithFacility,
  className = "",
  compact = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const facilityMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // User location state
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: initialCoords?.latitude || 22.7533,
    longitude: initialCoords?.longitude || 77.7291,
  });
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("Detecting address...");
  const [areaName, setAreaName] = useState<string>("Local Region");

  // Tile layer state
  const [activeTileLayer, setActiveTileLayer] = useState<TileLayerType>("street");

  // Facilities state
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(30);
  const [internalSelectedId, setInternalSelectedId] = useState<string>("");

  const activeSelectedId = externalSelectedId || internalSelectedId;

  // Search & Geocoding state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationResults, setLocationResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected Facility object
  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === activeSelectedId) || facilities[0] || null;
  }, [facilities, activeSelectedId]);

  // Fetch real hospitals from server endpoint
  const fetchHospitals = useCallback(
    async (lat: number, lon: number, radius = searchRadiusKm, customSearch = "") => {
      setIsLoadingFacilities(true);
      try {
        const queryParams = new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString(),
          radius: radius.toString(),
        });
        if (customSearch) {
          queryParams.append("query", customSearch);
        }

        const res = await fetch(`/api/nearby-hospitals?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data && data.success && Array.isArray(data.facilities)) {
          setFacilities(data.facilities);
          if (data.origin?.areaName) setAreaName(data.origin.areaName);
          if (data.origin?.displayName) setResolvedAddress(data.origin.displayName);

          // If no facility is selected or selected not in list, auto-select the best match
          if (data.facilities.length > 0) {
            const hasCurrentSelected = data.facilities.some((f: any) => f.id === activeSelectedId);
            if (!hasCurrentSelected) {
              const matched =
                data.facilities.find((f: any) =>
                  f.type.toLowerCase().includes(requiredFacilityLevel.toLowerCase().slice(0, 5))
                ) || data.facilities[0];
              setInternalSelectedId(matched.id);
              if (onSelectFacility) onSelectFacility(matched);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load real hospitals:", err);
      } finally {
        setIsLoadingFacilities(false);
      }
    },
    [searchRadiusKm, activeSelectedId, requiredFacilityLevel, onSelectFacility]
  );

  // Live GPS locator
  const handleDetectLiveGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);
    playHapticSound("click");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentCoords({ latitude, longitude });
        setAccuracyMeters(Math.round(accuracy));
        setIsDetectingGps(false);
        playHapticSound("success");

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }

        fetchHospitals(latitude, longitude, searchRadiusKm);
      },
      (error) => {
        setIsDetectingGps(false);
        let msg = "Could not access GPS coordinates";
        if (error.code === 1) msg = "Location permission denied. Please allow GPS access in your browser.";
        else if (error.code === 2) msg = "GPS signal unavailable.";
        else if (error.code === 3) msg = "GPS location request timed out.";
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchHospitals, searchRadiusKm]);

  // Handle Location Search Input
  const handleSearchLocation = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setLocationResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const res = await fetch(`/api/search-location?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.results)) {
          setLocationResults(data.results);
          setShowSearchResults(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Select a search result
  const handleSelectSearchResult = (result: any) => {
    playHapticSound("click");
    const lat = result.latitude;
    const lon = result.longitude;
    setCurrentCoords({ latitude: lat, longitude: lon });
    setResolvedAddress(result.displayName);
    setAreaName(result.name || "Selected Region");
    setSearchQuery(result.name || "");
    setShowSearchResults(false);

    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 13, { duration: 1.2 });
    }

    fetchHospitals(lat, lon, searchRadiusKm);
  };

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(container, {
      center: [currentCoords.latitude, currentCoords.longitude],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial Tile Layer
    const currentLayerConfig = TILE_LAYERS[activeTileLayer];
    const tileLayer = L.tileLayer(currentLayerConfig.url, {
      maxZoom: 19,
      attribution: currentLayerConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    facilityMarkersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Initial fetch of hospitals around starting location
    fetchHospitals(currentCoords.latitude, currentCoords.longitude, searchRadiusKm);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // Update Tile Layer when layer type changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerConfig = TILE_LAYERS[activeTileLayer];
    const newLayer = L.tileLayer(layerConfig.url, {
      maxZoom: 19,
      attribution: layerConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [activeTileLayer]);

  // Update Patient Marker & Accuracy Circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (patientMarkerRef.current) {
      map.removeLayer(patientMarkerRef.current);
      patientMarkerRef.current = null;
    }
    if (accuracyCircleRef.current) {
      map.removeLayer(accuracyCircleRef.current);
      accuracyCircleRef.current = null;
    }

    // Patient marker custom HTML
    const markerHtml = `
      <div class="relative flex items-center justify-center">
        <span class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></span>
        <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
          🚨
        </div>
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap border border-blue-400/40">
          Patient Live Location
        </div>
      </div>
    `;

    const patientIcon = L.divIcon({
      html: markerHtml,
      className: "patient-pulse-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([currentCoords.latitude, currentCoords.longitude], {
      icon: patientIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: sans-serif; min-width: 180px;">
        <div style="font-weight: 700; color: #1e3a8a; font-size: 13px; margin-bottom: 2px;">📍 ${patientName}</div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${resolvedAddress || patientVillage}</div>
        <div style="font-size: 10px; color: #0284c7; background: #f0f9ff; padding: 4px 6px; border-radius: 4px; border: 1px solid #bae6fd;">
          Lat: ${currentCoords.latitude.toFixed(4)}, Lon: ${currentCoords.longitude.toFixed(4)}
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Drag pin to adjust patient emergency origin</div>
      </div>
    `);

    marker.on("dragend", (e: any) => {
      const newPos = e.target.getLatLng();
      setCurrentCoords({ latitude: newPos.lat, longitude: newPos.lng });
      fetchHospitals(newPos.lat, newPos.lng, searchRadiusKm);
    });

    patientMarkerRef.current = marker;

    if (accuracyMeters && accuracyMeters > 0) {
      const circle = L.circle([currentCoords.latitude, currentCoords.longitude], {
        radius: accuracyMeters,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map);
      accuracyCircleRef.current = circle;
    }
  }, [currentCoords, accuracyMeters, patientName, resolvedAddress, patientVillage, fetchHospitals, searchRadiusKm]);

  // Render Facility Markers & Route on Map
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = facilityMarkersLayerRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !markersLayer || !routeLayer) return;

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    if (facilities.length === 0) return;

    facilities.forEach((fac) => {
      const isSelected = fac.id === activeSelectedId;
      const isDistrict = fac.type.includes("District");
      const isCHC = fac.type.includes("CHC");

      const pinColor = isSelected
        ? "bg-red-600 ring-4 ring-red-400/40 text-white"
        : isDistrict
        ? "bg-rose-700 text-white"
        : isCHC
        ? "bg-indigo-600 text-white"
        : "bg-teal-600 text-white";

      const markerHtml = `
        <div class="cursor-pointer transition-transform duration-200 hover:scale-110 flex items-center gap-1.5 ${pinColor} text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl border-2 border-white whitespace-nowrap">
          <span>${isDistrict ? "🏥" : "⚕️"}</span>
          <span class="max-w-[130px] truncate">${fac.name.split(",")[0]}</span>
          <span class="bg-black/20 text-[10px] px-1 py-0.2 rounded">${fac.distanceKm}km</span>
        </div>
      `;

      const facIcon = L.divIcon({
        html: markerHtml,
        className: "custom-hospital-marker",
        iconSize: [160, 30],
        iconAnchor: [80, 15],
      });

      const m = L.marker([fac.latitude, fac.longitude], { icon: facIcon }).addTo(markersLayer);

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
              ${fac.type}
            </span>
            <span style="font-size: 11px; font-weight: bold; color: #dc2626;">
              ${fac.distanceKm} km (~${fac.travelTimeMins}m)
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">
            ${fac.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            📍 ${fac.address}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; font-size: 10px;">
            <span style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px;">🛏️ Beds: ${fac.availableBeds}</span>
            <span style="background: #f1f5f9; padding: 2px 5px; border-radius: 4px;">🩺 ICU: ${fac.icuBedsAvailable}</span>
            ${fac.hasOxygen ? '<span style="background: #ecfdf5; color: #047857; padding: 2px 5px; border-radius: 4px;">💨 Oxygen</span>' : ''}
            ${fac.hasBloodBank ? '<span style="background: #fef2f2; color: #b91c1c; padding: 2px 5px; border-radius: 4px;">🩸 Blood Bank</span>' : ''}
            ${fac.hasCSection ? '<span style="background: #faf5ff; color: #6b21a8; padding: 2px 5px; border-radius: 4px;">👶 C-Section OT</span>' : ''}
          </div>
          <button id="btn-select-marker-${fac.id}" style="width: 100%; background: #2563eb; color: white; border: none; padding: 6px 10px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
            Select This Hospital for Referral
          </button>
        </div>
      `;

      m.bindPopup(popupHtml);

      m.on("popupopen", () => {
        const btn = document.getElementById(`btn-select-marker-${fac.id}`);
        if (btn) {
          btn.onclick = () => {
            playHapticSound("click");
            setInternalSelectedId(fac.id);
            if (onSelectFacility) onSelectFacility(fac);
            m.closePopup();
          };
        }
      });

      m.on("click", () => {
        playHapticSound("click");
        setInternalSelectedId(fac.id);
        if (onSelectFacility) onSelectFacility(fac);
      });
    });

    // Draw Route from Patient to Selected Facility
    if (selectedFacility) {
      const patientPoint: [number, number] = [currentCoords.latitude, currentCoords.longitude];
      const targetPoint: [number, number] = [selectedFacility.latitude, selectedFacility.longitude];

      // Draw dashed route line
      const routeLine = L.polyline([patientPoint, targetPoint], {
        color: "#dc2626",
        weight: 4,
        dashArray: "8, 8",
        opacity: 0.9,
      }).addTo(routeLayer);

      // Route midpoint marker showing distance & driving ETA
      const midLat = (patientPoint[0] + targetPoint[0]) / 2;
      const midLon = (patientPoint[1] + targetPoint[1]) / 2;

      const etaHtml = `
        <div class="bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-red-400/50 shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <span class="text-red-400">⚡</span>
          <span>${selectedFacility.distanceKm} km</span>
          <span class="text-slate-400">•</span>
          <span>~${selectedFacility.travelTimeMins} mins</span>
        </div>
      `;

      const etaIcon = L.divIcon({
        html: etaHtml,
        className: "route-eta-badge",
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      L.marker([midLat, midLon], { icon: etaIcon }).addTo(routeLayer);
    }
  }, [facilities, activeSelectedId, selectedFacility, currentCoords, onSelectFacility]);

  // Fit all markers in map view
  const handleFitAllMarkers = () => {
    const map = mapRef.current;
    if (!map || facilities.length === 0) return;

    playHapticSound("click");
    const latLngs: [number, number][] = [
      [currentCoords.latitude, currentCoords.longitude],
      ...facilities.map((f) => [f.latitude, f.longitude] as [number, number]),
    ];

    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  // Center on Patient GPS
  const handleCenterOnGps = () => {
    const map = mapRef.current;
    if (!map) return;
    playHapticSound("click");
    map.flyTo([currentCoords.latitude, currentCoords.longitude], 14, { duration: 0.8 });
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-2 z-50 shadow-2xl" : className
      }`}
    >
      {/* 1. Header Controls Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Hospital className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-white">
                Live Interactive Hospital Map
              </h2>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE OSM
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate max-w-xs md:max-w-md">
              {resolvedAddress}
            </p>
          </div>
        </div>

        {/* Live GPS & Search Actions */}
        <div className="flex items-center gap-2">
          {/* Detect GPS Button */}
          <button
            onClick={handleDetectLiveGps}
            disabled={isDetectingGps}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            title="Detect real live GPS location from your browser"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDetectingGps ? "animate-spin" : ""}`} />
            <span>{isDetectingGps ? "Acquiring GPS..." : "Detect My Live GPS"}</span>
          </button>

          {/* Fit all markers */}
          <button
            onClick={handleFitAllMarkers}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
            title="Fit all hospitals and route on map"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Center GPS */}
          <button
            onClick={handleCenterOnGps}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
            title="Center map on Patient GPS"
          >
            <Navigation className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              playHapticSound("click");
              setIsFullscreen(!isFullscreen);
              setTimeout(() => {
                if (mapRef.current) mapRef.current.invalidateSize();
              }, 200);
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Secondary Toolbar: City Search & Map Style Selector & Radius */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        {/* Real Geocoding Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchLocation(e.target.value)}
              placeholder="Search any city, district or hospital (e.g. Bhopal, Delhi, AIIMS)..."
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
            />
            {isSearchingLocation && (
              <RefreshCw className="w-3.5 h-3.5 text-blue-500 absolute right-3 animate-spin" />
            )}
          </div>

          {/* Autocomplete suggestions dropdown */}
          {showSearchResults && locationResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto">
              {locationResults.map((item) => (
                <button
                  key={item.placeId}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 flex items-start gap-2 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-sm">{item.displayName}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Tile Layer Selector */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
          {(["street", "satellite"] as TileLayerType[]).map((layer) => (
            <button
              key={layer}
              onClick={() => {
                playHapticSound("click");
                setActiveTileLayer(layer);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                activeTileLayer === layer
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {layer === "street" ? "🗺️ OSM" : "🛰️ Satellite"}
            </button>
          ))}
        </div>

        {/* Radius Filter */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="text-[11px] font-medium text-slate-500">Radius:</span>
          {[15, 30, 60].map((r) => (
            <button
              key={r}
              onClick={() => {
                playHapticSound("click");
                setSearchRadiusKm(r);
                fetchHospitals(currentCoords.latitude, currentCoords.longitude, r);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                searchRadiusKm === r
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {/* GPS Error notification if any */}
      {gpsError && (
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{gpsError}</span>
          </span>
          <button
            onClick={() => setGpsError(null)}
            className="text-[10px] font-bold text-amber-700 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. The Map Canvas */}
      <div className="relative w-full flex-1 min-h-[380px] md:min-h-[460px]">
        <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: isFullscreen ? "calc(100vh - 170px)" : "420px" }} />

        {/* Loading Spinner Overlay */}
        {isLoadingFacilities && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-blue-700 z-[1000]">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Fetching live OSM hospitals...</span>
          </div>
        )}

        {/* Legend Overlay in Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200 z-[1000] text-[10px] space-y-1 hidden sm:block">
          <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Facility Types & Key:
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            <span>District Hospital (ICU/OT/Blood Bank)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            <span>CHC (Community Health Centre)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>PHC (Primary Health Centre)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span>Live Patient GPS Pin (Draggable)</span>
          </div>
        </div>
      </div>

      {/* 4. Active Referral Target Footer Banner */}
      {selectedFacility && (
        <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-400/30">
                  Target Facility
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  ⚡ {selectedFacility.distanceKm} km • ~{selectedFacility.travelTimeMins} mins travel time
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 line-clamp-1">
                {selectedFacility.name}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-1">
                📍 {selectedFacility.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${selectedFacility.contactNumber}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Facility</span>
            </a>

            {onProceedWithFacility && (
              <button
                onClick={() => {
                  playHapticSound("success");
                  onProceedWithFacility(selectedFacility);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Confirm Facility & Generate Slip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
