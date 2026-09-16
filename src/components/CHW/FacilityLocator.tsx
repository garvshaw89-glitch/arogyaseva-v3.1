import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { HealthcareFacility, RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { useLiveLocation, DEFAULT_REGION_COORDS } from "../../utils/useLiveLocation";
import { fetchNearbyHospitalsOverpass, OverpassQueryResult } from "../../utils/overpassService";
import { LiveLocationTracker } from "./LiveLocationTracker";
import { ReactLeafletHospitalMap } from "./ReactLeafletHospitalMap";
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
  FileText,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Crosshair,
  Compass,
  Radio,
  Filter,
  Layers,
  Sparkles,
  Zap,
  Map,
  LayoutGrid,
} from "lucide-react";

interface FacilityLocatorProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onSelectFacilityAndGenerateSlip: (facility: HealthcareFacility) => void;
  onBack: () => void;
  language: SupportedLanguage;
}

export const FacilityLocator: React.FC<FacilityLocatorProps> = ({
  assessment,
  patientData,
  onSelectFacilityAndGenerateSlip,
  onBack,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Real-time geolocation coordinates state
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_REGION_COORDS.latitude,
    longitude: DEFAULT_REGION_COORDS.longitude,
  });
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsSource, setGpsSource] = useState<"real_gps" | "fallback_cluster">("fallback_cluster");

  // Overpass API fetched hospitals state
  const [facilities, setFacilities] = useState<HealthcareFacility[]>(MOCK_FACILITIES);
  const [isLoadingOverpass, setIsLoadingOverpass] = useState<boolean>(false);
  const [overpassInfo, setOverpassInfo] = useState<{
    source: string;
    count: number;
    areaName?: string;
  }>({
    source: "OpenStreetMap Overpass API",
    count: MOCK_FACILITIES.length,
  });

  // Selected facility ID
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>("");

  // Filters & View Modes: split (default), map (full real map), cards (list)
  const [typeFilter, setTypeFilter] = useState<"ALL" | "District Hospital" | "CHC" | "PHC">("ALL");
  const [capabilityFilter, setCapabilityFilter] = useState<string>("ALL");
  const [showLiveTrackerOverlay, setShowLiveTrackerOverlay] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"split" | "map" | "cards">("split");

  // Fetch hospitals using the Overpass API based on coordinates
  const loadHospitalsFromOverpass = useCallback(
    async (lat: number, lon: number) => {
      setIsLoadingOverpass(true);
      try {
        const result: OverpassQueryResult = await fetchNearbyHospitalsOverpass(lat, lon, 35);
        if (result.facilities && result.facilities.length > 0) {
          setFacilities(result.facilities);
          setOverpassInfo({
            source:
              result.source === "overpass_direct"
                ? "Overpass API Direct"
                : result.source === "api_proxy"
                ? "Overpass API + OSM Proxy"
                : "Regional Health Grid",
            count: result.facilities.length,
            areaName: result.areaName,
          });

          // Auto-select best matching facility if none selected
          const bestMatch =
            result.facilities.find((f) =>
              f.type.toLowerCase().includes(assessment.requiredFacilityLevel.toLowerCase().slice(0, 5))
            ) || result.facilities[0];
          setSelectedFacilityId(bestMatch.id);
        }
      } catch (err) {
        console.error("Overpass query error:", err);
      } finally {
        setIsLoadingOverpass(false);
      }
    },
    [assessment.requiredFacilityLevel]
  );

  // Acquire real-time device geolocation coordinates and fetch Overpass hospitals
  const handleDetectRealTimeGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    playHapticSound("click");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserCoords({ latitude, longitude });
        setAccuracyMeters(Math.round(accuracy));
        setGpsSource("real_gps");
        setIsLocating(false);
        playHapticSound("success");

        // Fetch nearby hospitals using Overpass API centered on real-time coordinates
        loadHospitalsFromOverpass(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not access GPS coordinates";
        if (error.code === 1) msg = "Location permission denied. Using district regional coordinates.";
        else if (error.code === 2) msg = "GPS signal unavailable. Using district regional coordinates.";
        else if (error.code === 3) msg = "Location request timed out. Using district regional coordinates.";
        setGpsError(msg);
        // Fallback fetch around regional cluster
        loadHospitalsFromOverpass(DEFAULT_REGION_COORDS.latitude, DEFAULT_REGION_COORDS.longitude);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [loadHospitalsFromOverpass]);

  // Initial mount: trigger real-time geolocation lookup
  useEffect(() => {
    handleDetectRealTimeGeolocation();
  }, [handleDetectRealTimeGeolocation]);

  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || facilities[0] || MOCK_FACILITIES[0];
  }, [facilities, selectedFacilityId]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (typeFilter === "District Hospital" && !f.type.includes("District")) return false;
      if (typeFilter === "CHC" && !f.type.includes("Community") && !f.type.includes("CHC")) return false;
      if (typeFilter === "PHC" && !f.type.includes("Primary") && !f.type.includes("PHC")) return false;

      if (capabilityFilter === "OXYGEN" && !f.hasOxygen) return false;
      if (capabilityFilter === "BLOOD" && !f.hasBloodBank) return false;
      if (capabilityFilter === "CSECTION" && !f.hasCSection) return false;
      if (capabilityFilter === "ICU" && f.icuBedsAvailable <= 0) return false;

      return true;
    });
  }, [facilities, typeFilter, capabilityFilter]);

  const handleCallAmbulance = () => {
    window.location.href = "tel:108";
  };

  return (
    <div id="facility-locator-step" className="space-y-6">
      {/* 1. Header & Direct Ambulance Call Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-red-950/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-800 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-red-400/40 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              EMERGENCY REFERRAL ROUTE
            </span>
            <span className="text-xs text-red-100 font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-lg border border-red-700">
              Required Care Tier: {assessment.requiredFacilityLevel}
            </span>
            <span className="text-xs text-emerald-200 font-bold bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              Real Live OpenStreetMap
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            {t.selectReferralFacility}
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-xl">
            Live interactive GPS navigation connecting rural patient in{" "}
            <strong>{patientData.village || "Rampur Village"}</strong> directly to nearest capable hospital.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-call-108-emergency"
            onClick={handleCallAmbulance}
            className="bg-white text-red-600 hover:bg-red-50 active:scale-95 font-black text-sm px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Call 108 Ambulance</span>
          </button>
        </div>
      </div>

      {/* 2. Mode Selector: Split View (Map + Cards) vs Full Map vs Cards */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            Navigation Display Mode:
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => {
              playHapticSound("click");
              setViewMode("split");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "split"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Split (Real Map + Cards)</span>
          </button>

          <button
            onClick={() => {
              playHapticSound("click");
              setViewMode("map");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Full Real Map</span>
          </button>

          <button
            onClick={() => {
              playHapticSound("click");
              setViewMode("cards");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "cards"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Hospital Cards List</span>
          </button>
        </div>
      </div>

      {/* 3. Real Live Interactive React-Leaflet Hospital Map with OpenStreetMap Tiles */}
      {(viewMode === "split" || viewMode === "map") && (
        <div className="space-y-2">
          {/* Real-time Telemetry & Overpass Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-lg font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                GPS: {userCoords.latitude.toFixed(4)}°N, {userCoords.longitude.toFixed(4)}°E
              </span>

              {accuracyMeters && (
                <span className="text-[11px] text-slate-400 font-mono">
                  (Accuracy: ±{accuracyMeters}m)
                </span>
              )}

              <span className="bg-blue-900/60 text-blue-200 border border-blue-500/40 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-300" />
                {isLoadingOverpass ? "Querying Overpass API..." : `${overpassInfo.source} (${facilities.length} facilities)`}
              </span>
            </div>

            <button
              onClick={handleDetectRealTimeGeolocation}
              disabled={isLocating}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
              <span>{isLocating ? "Acquiring GPS..." : "Refresh Real GPS Coordinates"}</span>
            </button>
          </div>

          {gpsError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{gpsError}</span>
            </div>
          )}

          <ReactLeafletHospitalMap
            userCoords={userCoords}
            accuracyMeters={accuracyMeters}
            facilities={facilities}
            selectedFacilityId={selectedFacilityId}
            onSelectFacility={(fac) => setSelectedFacilityId(fac.id)}
            onConfirmFacility={onSelectFacilityAndGenerateSlip}
            requiredFacilityLevel={assessment.requiredFacilityLevel}
            patientVillage={patientData.village || "Rampur Village"}
            patientName={patientData.patientName || "Emergency Patient"}
            className="w-full"
            heightClass={viewMode === "map" ? "h-[440px] sm:h-[550px] md:h-[620px]" : "h-[320px] sm:h-[420px] md:h-[480px]"}
            onRefreshGps={handleDetectRealTimeGeolocation}
            isLocating={isLocating}
            overpassSource={overpassInfo.source}
          />
        </div>
      )}

      {/* 4. Filter Controls (Visible in Split or Cards Mode) */}
      {(viewMode === "split" || viewMode === "cards") && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200 text-xs">
          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Tier:
            </span>
            {(["ALL", "District Hospital", "CHC", "PHC"] as const).map((tVal) => (
              <button
                key={tVal}
                onClick={() => {
                  playHapticSound("click");
                  setTypeFilter(tVal);
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  typeFilter === tVal
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tVal === "ALL" ? "All Tiers" : tVal}
              </button>
            ))}
          </div>

          {/* Capability Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 mr-1">Capability:</span>
            {[
              { id: "ALL", label: "All" },
              { id: "OXYGEN", label: "Oxygen" },
              { id: "BLOOD", label: "Blood Bank" },
              { id: "CSECTION", label: "C-Section" },
              { id: "ICU", label: "ICU Beds" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  playHapticSound("click");
                  setCapabilityFilter(c.id);
                }}
                className={`px-2 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  capabilityFilter === c.id
                    ? "bg-slate-800 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Facilities Grid (Cards View) */}
      {(viewMode === "split" || viewMode === "cards") && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((fac) => {
            const isSelected = selectedFacilityId === fac.id;
            const isRecommended =
              fac.type.toLowerCase().includes(assessment.requiredFacilityLevel.toLowerCase().slice(0, 5));
            const isOsmLive = fac.id.startsWith("REAL-OSM-") || fac.id.startsWith("OSM-");

            return (
              <div
                key={fac.id}
                id={`facility-card-${fac.id}`}
                onClick={() => {
                  playHapticSound("click");
                  setSelectedFacilityId(fac.id);
                }}
                className={`rounded-2xl p-5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {fac.type}
                        </span>
                        {isOsmLive ? (
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                            Live OSM
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            Verified District
                          </span>
                        )}
                        {isRecommended && (
                          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                            ⭐ Recommended
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                        {fac.name}
                      </h3>
                    </div>

                    <span className="text-xs font-mono font-bold text-blue-600 shrink-0 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                      {fac.distanceKm} km
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {fac.address}
                  </p>

                  <p className="text-[11px] font-medium text-slate-700 mb-3 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Travel Time: ~{fac.travelTimeMins} mins via driving route</span>
                  </p>

                  {/* Badges of Services */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {fac.hasOxygen && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <Wind className="w-2.5 h-2.5 text-blue-600" /> Oxygen
                      </span>
                    )}
                    {fac.hasBloodBank && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <Droplet className="w-2.5 h-2.5 text-red-600" /> Blood Bank
                      </span>
                    )}
                    {fac.hasCSection && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <Baby className="w-2.5 h-2.5 text-purple-600" /> C-Section OT
                      </span>
                    )}
                    {fac.icuBedsAvailable > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-700 font-medium px-2 py-0.5 rounded border border-red-200 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-red-600" /> {fac.icuBedsAvailable} ICU Beds
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Available Beds: <strong>{fac.availableBeds}</strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playHapticSound("click");
                      setSelectedFacilityId(fac.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Selected Target" : "Select Facility"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Selected Facility Action Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Target Destination Facility:
          </span>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5 flex-wrap">
            <Hospital className="w-5 h-5 text-blue-600" />
            <span>{selectedFacility.name}</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono font-semibold">
              {selectedFacility.distanceKm} km (~{selectedFacility.travelTimeMins} mins)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Emergency Desk: <strong className="text-slate-800">{selectedFacility.contactNumber}</strong> • {selectedFacility.address}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              playHapticSound("click");
              setShowLiveTrackerOverlay(true);
            }}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Radio className="w-4 h-4 text-blue-600" />
            <span>Track Live GPS Telemetry</span>
          </button>

          <button
            id="btn-generate-referral-slip"
            onClick={() => onSelectFacilityAndGenerateSlip(selectedFacility)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{t.generateReferralSlip}</span>
          </button>
        </div>
      </div>

      {/* 7. Back button */}
      <div>
        <button
          id="btn-back-to-assessment"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessment</span>
        </button>
      </div>

      {/* 8. Live Location Tracker Overlay Modal */}
      {showLiveTrackerOverlay && (
        <LiveLocationTracker
          patientData={patientData}
          assessment={assessment}
          selectedFacility={selectedFacility}
          onSelectFacility={(fac) => setSelectedFacilityId(fac.id)}
          isOpen={showLiveTrackerOverlay}
          onClose={() => setShowLiveTrackerOverlay(false)}
        />
      )}
    </div>
  );
};
