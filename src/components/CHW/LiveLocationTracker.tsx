import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { HealthcareFacility, PatientCase, RiskAssessment } from "../../types";
import { useLiveLocation } from "../../utils/useLiveLocation";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  Navigation,
  Compass,
  MapPin,
  Radio,
  Hospital,
  Clock,
  PhoneCall,
  Activity,
  Wind,
  Droplet,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Volume2,
  VolumeX,
  Share2,
  Crosshair,
} from "lucide-react";

interface MiniMapProps {
  coords: { latitude: number; longitude: number };
  targetHospital: HealthcareFacility | null;
  nearbyHospitals: HealthcareFacility[];
  onSelectHospital?: (h: HealthcareFacility) => void;
}

const MiniLiveLeafletMap: React.FC<MiniMapProps> = ({
  coords,
  targetHospital,
  nearbyHospitals,
  onSelectHospital,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [coords.latitude, coords.longitude],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers and lines
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Patient marker
    const userIcon = L.divIcon({
      className: "custom-user-pin",
      html: `<div style="width:20px;height:20px;background:#06b6d4;border:2px solid #fff;border-radius:50%;box-shadow:0 0 12px #06b6d4;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([coords.latitude, coords.longitude], { icon: userIcon })
      .addTo(map)
      .bindTooltip("Patient / CHW Live GPS", { permanent: false, direction: "top" });

    // Hospital markers
    nearbyHospitals.slice(0, 10).forEach((fac) => {
      const isTarget = targetHospital && targetHospital.id === fac.id;
      const color = isTarget ? "#ef4444" : "#3b82f6";
      const hIcon = L.divIcon({
        className: "custom-hospital-pin",
        html: `<div style="display:flex;align-items:center;justify-content:center;width:${isTarget ? 24 : 18}px;height:${isTarget ? 24 : 18}px;background:${color};border:2px solid #fff;border-radius:50%;color:#fff;font-weight:bold;font-size:10px;box-shadow:0 0 10px ${color};">H</div>`,
        iconSize: [isTarget ? 24 : 18, isTarget ? 24 : 18],
        iconAnchor: [isTarget ? 12 : 9, isTarget ? 12 : 9],
      });

      const marker = L.marker([fac.latitude, fac.longitude], { icon: hIcon })
        .addTo(map)
        .bindTooltip(`${fac.name} (${fac.distanceKm} km)`, { permanent: false, direction: "top" });

      marker.on("click", () => {
        onSelectHospital && onSelectHospital(fac);
      });
    });

    // Polyline to target hospital
    if (targetHospital) {
      const line = L.polyline(
        [
          [coords.latitude, coords.longitude],
          [targetHospital.latitude, targetHospital.longitude],
        ],
        {
          color: "#06b6d4",
          weight: 3,
          dashArray: "6, 8",
          opacity: 0.85,
        }
      ).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([
        [coords.latitude, coords.longitude],
        [targetHospital.latitude, targetHospital.longitude],
      ]);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
    } else {
      map.setView([coords.latitude, coords.longitude], 11);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [coords.latitude, coords.longitude, targetHospital?.id, nearbyHospitals.length]);

  return (
    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute top-2 right-2 z-[400] bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 border border-slate-700">
        CartoDB / OSM Live Tiles
      </div>
      <div className="absolute bottom-2 left-2 z-[400] bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 border border-slate-700 flex items-center gap-2">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> You</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Target</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Hospitals</span>
      </div>
    </div>
  );
};

interface LiveLocationTrackerProps {
  patientData?: Partial<PatientCase>;
  assessment?: RiskAssessment | null;
  selectedFacility?: HealthcareFacility | null;
  onSelectFacility?: (facility: HealthcareFacility) => void;
  isOpen?: boolean;
  onClose?: () => void;
  standalone?: boolean;
}

export const LiveLocationTracker: React.FC<LiveLocationTrackerProps> = ({
  patientData,
  assessment,
  selectedFacility,
  onSelectFacility,
  isOpen = true,
  onClose,
  standalone = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sirenActive, setSirenActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"radar" | "hospitals" | "telemetry">("radar");

  const {
    coords,
    isTracking,
    isLocating,
    error,
    source,
    nearbyHospitals,
    isLoadingHospitals,
    lastUpdated,
    fetchCurrentLocation,
    toggleAmbulanceSimulation,
    getDistanceKm,
  } = useLiveLocation(true, patientData?.id);

  if (!isOpen) return null;

  // Active target hospital
  const targetHospital =
    selectedFacility ||
    (nearbyHospitals.length > 0 ? nearbyHospitals[0] : null);

  const distanceToTarget = targetHospital
    ? getDistanceKm(coords.latitude, coords.longitude, targetHospital.latitude, targetHospital.longitude)
    : 0;

  const etaMinutes = Math.max(2, Math.round((distanceToTarget / 45) * 60));

  const copyTelemetry = () => {
    const text = `🚨 [AROGYASEVA EMERGENCY DISPATCH TELEMETRY]
Case: ${patientData?.patientName || "Emergency Patient"} (${patientData?.age || "35"}yo ${patientData?.gender || "M"})
Condition: ${assessment?.clinicalImpression || "Critical Triage Referral"}
Risk Score: ${assessment?.riskScore || "85"}/100 [${assessment?.riskLevel || "EMERGENCY"}]
Current GPS: ${coords.latitude.toFixed(5)}°N, ${coords.longitude.toFixed(5)}°E
Accuracy: ±${coords.accuracyMeters || 8}m | Speed: ${coords.speedKmH || 0} km/h
Destination: ${targetHospital?.name || "District Hospital"} (~${distanceToTarget}km, ETA: ${etaMinutes}m)
Timestamp: ${coords.timestamp}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    playHapticSound("success");
    setTimeout(() => setCopied(false), 2200);
  };

  // Minimized Floating Pill View
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <button
          onClick={() => {
            playHapticSound("click");
            setIsMinimized(false);
          }}
          className="bg-slate-900/95 hover:bg-slate-850 text-white border border-cyan-500/50 rounded-2xl p-3.5 shadow-2xl shadow-cyan-950/80 backdrop-blur-md flex items-center gap-3 cursor-pointer group transition-all"
        >
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-cyan-400 block" />
            <span className="w-3 h-3 rounded-full bg-cyan-400 absolute inset-0 animate-ping" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                LIVE TELEMETRY
              </span>
              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                {coords.speedKmH ? `${coords.speedKmH} km/h` : "TRACKING"}
              </span>
            </div>
            <p className="text-xs font-mono font-bold text-slate-200">
              {coords.latitude.toFixed(4)}°, {coords.longitude.toFixed(4)}°
            </p>
          </div>
          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${
        standalone
          ? "w-full"
          : "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[460px] max-h-[88vh]"
      } bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-2xl shadow-cyan-950/70 backdrop-blur-xl text-slate-100 flex flex-col overflow-hidden transition-all duration-300`}
    >
      {/* 1. Header with Live Telemetry Pulse & Controls */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold font-mono text-white tracking-wide">
                LIVE LOCATION TRACKER
              </h3>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-black tracking-wider ${
                  source === "gps_live"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                    : source === "simulated_transit"
                    ? "bg-purple-950 text-purple-300 border border-purple-800 animate-pulse"
                    : "bg-blue-950 text-blue-300 border border-blue-800"
                }`}
              >
                {source === "gps_live" ? "GPS LIVE" : source === "simulated_transit" ? "AMB 108 SIM" : "DISTRICT CLUSTER"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Ambulance / CHW Emergency Referral Stream • ±{coords.accuracyMeters || 8}m accuracy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              playHapticSound("click");
              fetchCurrentLocation();
            }}
            disabled={isLocating}
            title="Refresh GPS Fix"
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {!standalone && (
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize to Pill"
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-rose-950 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Tactical Coordinate Strip */}
      <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-800/60 grid grid-cols-4 gap-2 text-center font-mono">
        <div>
          <span className="text-[9px] text-slate-400 block">LATITUDE</span>
          <span className="text-xs font-bold text-cyan-300">{coords.latitude.toFixed(4)}°</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block">LONGITUDE</span>
          <span className="text-xs font-bold text-cyan-300">{coords.longitude.toFixed(4)}°</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block">SPEED</span>
          <span className="text-xs font-bold text-emerald-400">{coords.speedKmH || 0} km/h</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block">EST. ETA</span>
          <span className="text-xs font-bold text-amber-400">~{etaMinutes} min</span>
        </div>
      </div>

      {/* 3. Navigation View Tabs */}
      <div className="flex border-b border-slate-800 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab("radar")}
          className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === "radar"
              ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Live OSM Map ({nearbyHospitals.length})
        </button>
        <button
          onClick={() => setActiveTab("hospitals")}
          className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === "hospitals"
              ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Nearby List
        </button>
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
            activeTab === "telemetry"
              ? "border-cyan-400 text-cyan-300 font-bold bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          OSM Raw Fix
        </button>
      </div>

      {/* 4. Tab Body Content */}
      <div className="p-4 overflow-y-auto max-h-[46vh] space-y-3 font-sans">
        {activeTab === "radar" && (
          <div className="space-y-3">
            {/* Target Destination Card */}
            {targetHospital ? (
              <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-2xl p-3 relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded font-bold">
                      ACTIVE EMERGENCY DESTINATION
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                      <Hospital className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="line-clamp-1">{targetHospital.name}</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {targetHospital.type} • {targetHospital.address}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-mono font-black text-cyan-300">
                      {distanceToTarget} km
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      ETA ~{etaMinutes} min
                    </span>
                  </div>
                </div>

                {/* Capability Pills */}
                <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-cyan-900/50 text-[10px]">
                  {targetHospital.hasOxygen && (
                    <span className="bg-slate-900/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5" /> Oxygen Plant
                    </span>
                  )}
                  {targetHospital.hasBloodBank && (
                    <span className="bg-slate-900/80 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1">
                      <Droplet className="w-2.5 h-2.5" /> Blood Bank
                    </span>
                  )}
                  <span className="bg-slate-900/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/60">
                    ICU: {targetHospital.icuBedsAvailable} beds
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 border border-slate-800 rounded-xl text-slate-500 text-xs">
                Scanning for nearby medical centers...
              </div>
            )}

            {/* Real Live Mini Interactive Leaflet Map */}
            <MiniLiveLeafletMap
              coords={{ latitude: coords.latitude, longitude: coords.longitude }}
              targetHospital={targetHospital}
              nearbyHospitals={nearbyHospitals}
              onSelectHospital={onSelectFacility}
            />
          </div>
        )}

        {activeTab === "hospitals" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>FACILITY ({nearbyHospitals.length} FOUND)</span>
              <span>DISTANCE / ETA</span>
            </div>

            {nearbyHospitals.map((fac) => {
              const isSelected = fac.id === targetHospital?.id;
              const dist = getDistanceKm(coords.latitude, coords.longitude, fac.latitude, fac.longitude);
              const eta = Math.max(3, Math.round((dist / 40) * 60));

              return (
                <div
                  key={fac.id}
                  onClick={() => {
                    playHapticSound("click");
                    onSelectFacility && onSelectFacility(fac);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-500 text-white"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold truncate">{fac.name}</span>
                      {fac.id.startsWith("OSM-") && (
                        <span className="text-[8px] font-mono bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-800 shrink-0">
                          OSM
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {fac.type} • ICU: {fac.icuBedsAvailable}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-cyan-300 block">
                      {dist} km
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ~{eta} min
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider Source:</span>
                <span className="text-cyan-300">{source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latitude / Longitude:</span>
                <span className="text-white">
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GNSS Accuracy:</span>
                <span className="text-emerald-400">±{coords.accuracyMeters} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ground Speed:</span>
                <span className="text-white">{coords.speedKmH || 0} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Heading:</span>
                <span className="text-white">{coords.headingDegrees ?? "N/A"}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Fix Time:</span>
                <span className="text-slate-400">{lastUpdated}</span>
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-800">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 5. Footer Quick Actions (Simulation, SOS 108, Copy Coordinates) */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
        <button
          onClick={toggleAmbulanceSimulation}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            source === "simulated_transit"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/50 animate-pulse"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>{source === "simulated_transit" ? "Stop Transit Sim" : "Simulate 108 Transit"}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={copyTelemetry}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-1 text-xs"
            title="Copy Live Coordinates & SBAR for Radio Dispatch"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy GPS"}</span>
          </button>

          <a
            href="tel:108"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
            <span>Call 108</span>
          </a>
        </div>
      </div>
    </div>
  );
};
