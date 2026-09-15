import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { HealthcareFacility } from "../../types";
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
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  RefreshCw,
  Phone,
  ArrowRight,
  Route,
} from "lucide-react";

export type TileStyleKey = "osm_standard" | "carto_light" | "satellite";

export const TILE_STYLES: Record<
  TileStyleKey,
  { name: string; url: string; attribution: string; maxZoom?: number }
> = {
  osm_standard: {
    name: "OpenStreetMap (Standard)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  carto_light: {
    name: "CartoDB Voyager (Clean)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    name: "Esri Satellite Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
};

// Helper component to adjust map viewport dynamically
function MapViewController({
  center,
  targetCoords,
  isRecenterRequested,
  onRecenterHandled,
}: {
  center: [number, number];
  targetCoords?: [number, number] | null;
  isRecenterRequested: boolean;
  onRecenterHandled: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate map size after mount / resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (isRecenterRequested) {
      if (targetCoords) {
        const bounds = L.latLngBounds([center, targetCoords]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      } else {
        map.flyTo(center, 13, { duration: 1 });
      }
      onRecenterHandled();
    }
  }, [isRecenterRequested, center, targetCoords, map, onRecenterHandled]);

  return null;
}

// Create custom DOM icons
function createPatientPinIcon(label: string = "Patient GPS") {
  return L.divIcon({
    className: "patient-pin-container",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="width:36px;height:36px;background:#0284c7;border:3px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 25px rgba(2,132,199,0.5);animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
        <div style="background:#0f172a;color:#ffffff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;margin-top:4px;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);">
          ${label}
        </div>
        <div style="width:2px;height:8px;background:#0284c7;"></div>
        <div style="width:8px;height:4px;background:#000000;border-radius:50%;opacity:0.3;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createHospitalPinIcon(
  facility: HealthcareFacility,
  isSelected: boolean,
  isRecommended: boolean
) {
  const isDistrict = facility.type.includes("District") || facility.type.includes("Tertiary");
  const isChc = facility.type.includes("CHC") || facility.type.includes("Community");

  const bgColor = isSelected ? "#dc2626" : isDistrict ? "#e11d48" : isChc ? "#d97706" : "#2563eb";
  const ringStyle = isSelected
    ? "outline: 3px solid #f87171; outline-offset: 3px; transform: scale(1.15);"
    : "";

  return L.divIcon({
    className: "hospital-pin-container",
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;${ringStyle}transition:all 0.2s;">
        <div style="width:${isSelected ? "40px" : "32px"};height:${isSelected ? "40px" : "32px"};background:${bgColor};border:2.5px solid #ffffff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.35);">
          <svg width="${isSelected ? "22" : "18"}" height="${isSelected ? "22" : "18"}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 6v12m-6-6h12"></path>
          </svg>
        </div>
        <div style="background:${isSelected ? "#991b1b" : "#1e293b"};color:#ffffff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:5px;margin-top:3px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.15);max-width:130px;overflow:hidden;text-overflow:ellipsis;">
          ${facility.name.split(" ")[0]} (${facility.distanceKm}km)
        </div>
        ${
          isRecommended
            ? `<div style="background:#fbbf24;color:#78350f;font-size:8px;font-weight:800;padding:1px 4px;border-radius:3px;margin-top:1px;">RECOMMENDED</div>`
            : ""
        }
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export interface ReactLeafletHospitalMapProps {
  userCoords: { latitude: number; longitude: number };
  accuracyMeters?: number | null;
  facilities: HealthcareFacility[];
  selectedFacilityId: string;
  onSelectFacility: (facility: HealthcareFacility) => void;
  onConfirmFacility?: (facility: HealthcareFacility) => void;
  requiredFacilityLevel?: string;
  patientVillage?: string;
  patientName?: string;
  className?: string;
  heightClass?: string;
  showTileSelector?: boolean;
  onRefreshGps?: () => void;
  isLocating?: boolean;
  overpassSource?: string;
}

export const ReactLeafletHospitalMap: React.FC<ReactLeafletHospitalMapProps> = ({
  userCoords,
  accuracyMeters,
  facilities,
  selectedFacilityId,
  onSelectFacility,
  onConfirmFacility,
  requiredFacilityLevel = "District Hospital",
  patientVillage = "Rampur Village",
  patientName = "Patient",
  className = "",
  heightClass = "h-[460px]",
  showTileSelector = true,
  onRefreshGps,
  isLocating = false,
  overpassSource = "Overpass API",
}) => {
  const [activeTileKey, setActiveTileKey] = useState<TileStyleKey>("osm_standard");
  const [isRecenterRequested, setIsRecenterRequested] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0] || null;
  }, [facilities, selectedFacilityId]);

  // Handle manual recenter
  const handleRecenter = useCallback(() => {
    playHapticSound("click");
    setIsRecenterRequested(true);
  }, []);

  // When selected facility changes, request smooth viewport adjust
  useEffect(() => {
    if (selectedFacility) {
      setIsRecenterRequested(true);
    }
  }, [selectedFacility?.id]);

  const mapCenter: [number, number] = [userCoords.latitude, userCoords.longitude];
  const targetCoords: [number, number] | null = selectedFacility
    ? [selectedFacility.latitude, selectedFacility.longitude]
    : null;

  // Active tile metadata
  const currentTile = TILE_STYLES[activeTileKey];

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 transition-all ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen w-screen" : className
      }`}
    >
      {/* 1. Map Top Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Real-time coordinates & Overpass API Badge */}
        <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md text-white rounded-2xl px-3.5 py-2 border border-slate-700/80 shadow-lg flex items-center gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-bold font-mono text-[11px] text-emerald-300">
              {userCoords.latitude.toFixed(4)}°N, {userCoords.longitude.toFixed(4)}°E
            </span>
          </div>

          <span className="text-slate-500 hidden sm:inline">|</span>

          <span className="bg-blue-900/60 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-600/40 hidden sm:flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            OSM Overpass API ({facilities.length} found)
          </span>

          {accuracyMeters && (
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              ±{accuracyMeters}m
            </span>
          )}
        </div>

        {/* Action buttons: Recenter GPS, Tile Switcher, Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-lg">
          {onRefreshGps && (
            <button
              onClick={() => {
                playHapticSound("click");
                onRefreshGps();
                setIsRecenterRequested(true);
              }}
              title="Refresh device GPS coordinates"
              className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh GPS</span>
            </button>
          )}

          <button
            onClick={handleRecenter}
            title="Recenter Map on Patient & Hospital Route"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {showTileSelector && (
            <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
              {(
                [
                  { key: "osm_standard", label: "OSM", icon: Layers },
                  { key: "carto_light", label: "Light", icon: Sparkles },
                  { key: "satellite", label: "Satellite", icon: Sparkles },
                ] as const
              ).map((tile) => (
                <button
                  key={tile.key}
                  onClick={() => {
                    playHapticSound("click");
                    setActiveTileKey(tile.key);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    activeTileKey === tile.key
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {tile.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              playHapticSound("click");
              setIsFullscreen(!isFullscreen);
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer ml-0.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Leaflet React Map Container */}
      <div className={`w-full ${isFullscreen ? "h-full" : heightClass}`}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Map View Controller for smooth recenter / bounds update */}
          <MapViewController
            center={mapCenter}
            targetCoords={targetCoords}
            isRecenterRequested={isRecenterRequested}
            onRecenterHandled={() => setIsRecenterRequested(false)}
          />

          {/* Actual OpenStreetMap / TileLayer */}
          <TileLayer
            key={activeTileKey}
            url={currentTile.url}
            attribution={currentTile.attribution}
            maxZoom={currentTile.maxZoom || 19}
          />

          {/* User / Patient Real-time GPS Accuracy Circle */}
          {accuracyMeters && accuracyMeters > 0 && (
            <Circle
              center={mapCenter}
              radius={Math.min(accuracyMeters, 2000)}
              pathOptions={{
                color: "#0284c7",
                fillColor: "#38bdf8",
                fillOpacity: 0.15,
                weight: 1.5,
              }}
            />
          )}

          {/* User / Patient Real-time Pin */}
          <Marker
            position={mapCenter}
            icon={createPatientPinIcon(patientVillage || "Patient Location")}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[180px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-0.5">
                  Real-time Origin
                </div>
                <div className="font-bold text-slate-900 text-sm">{patientName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{patientVillage}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  GPS: {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Selected Facility Trajectory Polyline */}
          {targetCoords && (
            <Polyline
              positions={[mapCenter, targetCoords]}
              pathOptions={{
                color: "#2563eb",
                weight: 4,
                dashArray: "8, 10",
                opacity: 0.85,
              }}
            />
          )}

          {/* Overpass-Fetched Nearby Hospital Markers */}
          {facilities.map((fac) => {
            const isSelected = fac.id === selectedFacilityId;
            const isRecommended = fac.type
              .toLowerCase()
              .includes(requiredFacilityLevel.toLowerCase().slice(0, 5));

            return (
              <Marker
                key={fac.id}
                position={[fac.latitude, fac.longitude]}
                icon={createHospitalPinIcon(fac, isSelected, isRecommended)}
                eventHandlers={{
                  click: () => {
                    playHapticSound("click");
                    onSelectFacility(fac);
                  },
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="p-1 max-w-[240px]">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {fac.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-600">
                        {fac.distanceKm} km
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs leading-tight mb-1">
                      {fac.name}
                    </h4>

                    <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 mb-2">
                      {fac.address}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-semibold mb-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>~{fac.travelTimeMins} mins driving time</span>
                    </div>

                    {/* Facility Capabilities */}
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {fac.hasOxygen && (
                        <span className="text-[8px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          O₂ Oxygen
                        </span>
                      )}
                      {fac.hasBloodBank && (
                        <span className="text-[8px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          Blood
                        </span>
                      )}
                      {fac.hasCSection && (
                        <span className="text-[8px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          C-Section
                        </span>
                      )}
                      {fac.icuBedsAvailable > 0 && (
                        <span className="text-[8px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                          {fac.icuBedsAvailable} ICU
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={`tel:${fac.contactNumber || "108"}`}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="w-2.5 h-2.5" /> Call {fac.contactNumber || "108"}
                      </a>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playHapticSound("click");
                          onSelectFacility(fac);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select Target"}
                      </button>
                    </div>
                  </div>
                </Popup>

                <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                  <div className="text-[10px] font-bold">
                    {fac.name} • {fac.distanceKm} km
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* 3. Bottom Selected Facility Action Strip */}
      {selectedFacility && (
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Hospital className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedFacility.type}
                </span>
                <span className="text-xs font-bold text-slate-900">{selectedFacility.name}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>
                  Distance: <strong className="text-slate-800">{selectedFacility.distanceKm} km</strong>
                </span>
                <span>•</span>
                <span>
                  Drive Time: ~<strong className="text-slate-800">{selectedFacility.travelTimeMins} mins</strong>
                </span>
                <span>•</span>
                <span>Beds: {selectedFacility.availableBeds}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`tel:${selectedFacility.contactNumber || "108"}`}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-600" />
              <span>Call Emergency</span>
            </a>

            {onConfirmFacility && (
              <button
                onClick={() => {
                  playHapticSound("success");
                  onConfirmFacility(selectedFacility);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-blue-200"
              >
                <span>Confirm & Generate Slip</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
