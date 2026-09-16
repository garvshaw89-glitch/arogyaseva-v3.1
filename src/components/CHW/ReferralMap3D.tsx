import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { HealthcareFacility, RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { DEFAULT_REGION_COORDS } from "../../utils/useLiveLocation";
import { fetchNearbyHospitalsOverpass, OverpassQueryResult } from "../../utils/overpassService";
import { ReactLeafletHospitalMap } from "./ReactLeafletHospitalMap";
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
  ArrowRight,
  Activity,
  Layers,
  Map as MapIcon,
  Compass,
  Sparkles,
  Radio,
  RefreshCw,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface ReferralMap3DProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onSelectFacilityAndGenerateSlip: (facility: HealthcareFacility) => void;
  onBack: () => void;
  language: SupportedLanguage;
}

export const ReferralMap3D: React.FC<ReferralMap3DProps> = ({
  assessment,
  patientData,
  onSelectFacilityAndGenerateSlip,
  onBack,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Real-time geolocation coordinates state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: DEFAULT_REGION_COORDS.latitude,
    longitude: DEFAULT_REGION_COORDS.longitude,
  });
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Overpass API facilities state
  const [facilityList, setFacilityList] = useState<HealthcareFacility[]>(MOCK_FACILITIES);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);
  const [overpassStatus, setOverpassStatus] = useState<string>("Initializing Overpass API...");

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    assessment.requiredFacilityLevel.includes("District")
      ? "DH-01"
      : assessment.requiredFacilityLevel.includes("Community") || patientData.isPregnant
      ? "CHC-01"
      : "PHC-01"
  );

  // Fetch nearby hospitals using the Overpass API based on real-time coordinates
  const fetchHospitals = useCallback(
    async (lat: number, lon: number) => {
      setIsLoadingHospitals(true);
      setOverpassStatus("Querying OpenStreetMap Overpass API...");
      try {
        const res: OverpassQueryResult = await fetchNearbyHospitalsOverpass(lat, lon, 40);
        if (res.facilities && res.facilities.length > 0) {
          setFacilityList(res.facilities);
          setOverpassStatus(
            `${res.source === "overpass_direct" ? "Live Overpass API" : "OSM Healthcare Registry"} (${res.count} facilities near GPS)`
          );

          // If current selection is not in list, auto-select the best match
          const hasCurrent = res.facilities.some((f) => f.id === selectedFacilityId);
          if (!hasCurrent) {
            const best =
              res.facilities.find((f) =>
                f.type.toLowerCase().includes(assessment.requiredFacilityLevel.toLowerCase().slice(0, 5))
              ) || res.facilities[0];
            setSelectedFacilityId(best.id);
          }
        }
      } catch (err) {
        console.error("Failed to load Overpass hospitals in ReferralMap3D:", err);
        setOverpassStatus("Regional Healthcare Fallback Grid");
      } finally {
        setIsLoadingHospitals(false);
      }
    },
    [assessment.requiredFacilityLevel, selectedFacilityId]
  );

  // Detect real-time device geolocation coordinates
  const handleDetectRealTimeGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Browser does not support geolocation");
      return;
    }

    setIsLocating(true);
    setGpsError(null);
    playHapticSound("click");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCoords({ latitude, longitude });
        setAccuracyMeters(Math.round(accuracy));
        setIsLocating(false);
        playHapticSound("success");

        // Immediately query Overpass API based on real-time geolocation
        fetchHospitals(latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        let msg = "Could not acquire real-time GPS coordinates";
        if (error.code === 1) msg = "Location permission denied. Showing district cluster.";
        else if (error.code === 2) msg = "GPS signal unavailable. Showing district cluster.";
        else if (error.code === 3) msg = "GPS timed out. Showing district cluster.";
        setGpsError(msg);
        fetchHospitals(DEFAULT_REGION_COORDS.latitude, DEFAULT_REGION_COORDS.longitude);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchHospitals]);

  // Initial load
  useEffect(() => {
    handleDetectRealTimeGps();
  }, [handleDetectRealTimeGps]);

  const selectedFacility = useMemo(() => {
    return facilityList.find((f) => f.id === selectedFacilityId) || facilityList[0] || MOCK_FACILITIES[0];
  }, [facilityList, selectedFacilityId]);

  return (
    <div id="referral-map-view" className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-red-500/20 text-red-300 text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider border border-red-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              REACT-LEAFLET TRAJECTORY MAP
            </span>
            <span className="text-xs text-blue-200 font-semibold bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              {overpassStatus}
            </span>
          </div>

          <h2 className="text-2xl font-black mt-2 tracking-tight text-white flex items-center gap-2">
            <span>Live OpenStreetMap Referral Trajectory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real OpenStreetMap tiles and Overpass API hospital discovery matching for{" "}
            <strong>{patientData.patientName || "Emergency Patient"}</strong> from{" "}
            <strong>{patientData.village || "Rampur Village"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = "tel:108";
            }}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold text-sm shadow-lg shadow-red-900/40 flex items-center gap-2 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-bounce" />
            <span>Call 108 Ambulance</span>
          </button>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 text-white p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-xl font-mono font-bold">
            <Navigation className="w-3 h-3 text-emerald-400" />
            Live GPS: {coords.latitude.toFixed(4)}°N, {coords.longitude.toFixed(4)}°E
          </span>

          {accuracyMeters && (
            <span className="text-[11px] text-slate-400 font-mono">
              (Accuracy: ±{accuracyMeters}m)
            </span>
          )}

          <span className="text-slate-400">|</span>

          <span className="text-xs text-slate-300">
            Selected Target: <strong className="text-white">{selectedFacility.name}</strong> ({selectedFacility.distanceKm} km • ~{selectedFacility.travelTimeMins} mins)
          </span>
        </div>

        <button
          onClick={handleDetectRealTimeGps}
          disabled={isLocating}
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Acquiring GPS..." : "Refresh Real GPS Coordinates"}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* 3. React-Leaflet Interactive OpenStreetMap Map */}
      <ReactLeafletHospitalMap
        userCoords={coords}
        accuracyMeters={accuracyMeters}
        facilities={facilityList}
        selectedFacilityId={selectedFacilityId}
        onSelectFacility={(fac) => {
          setSelectedFacilityId(fac.id);
          setFacilityList((prev) => {
            if (!prev.some((item) => item.id === fac.id)) {
              return [fac, ...prev];
            }
            return prev;
          });
        }}
        onConfirmFacility={onSelectFacilityAndGenerateSlip}
        requiredFacilityLevel={assessment.requiredFacilityLevel}
        patientVillage={patientData.village || "Rampur Village"}
        patientName={patientData.patientName || "Emergency Patient"}
        className="w-full"
        heightClass="h-[340px] sm:h-[440px] md:h-[520px]"
        onRefreshGps={handleDetectRealTimeGps}
        isLocating={isLocating}
        overpassSource={overpassStatus}
      />

      {/* 4. Action / Dispatch Footer Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Selected Target Destination:
          </span>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5 flex-wrap">
            <Hospital className="w-5 h-5 text-blue-600" />
            <span>{selectedFacility.name}</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded font-mono font-semibold">
              {selectedFacility.distanceKm} km • ~{selectedFacility.travelTimeMins} mins driving
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Emergency Desk: <strong className="text-slate-800">{selectedFacility.contactNumber}</strong> • {selectedFacility.address}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessment</span>
          </button>

          <button
            id="btn-confirm-facility-and-slip"
            onClick={() => {
              playHapticSound("success");
              onSelectFacilityAndGenerateSlip(selectedFacility);
            }}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Confirm Target Hospital & Generate Slip</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
