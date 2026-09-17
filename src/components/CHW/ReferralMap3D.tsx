import React, { useState, useEffect, useMemo, useCallback } from "react";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { HealthcareFacility, RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { DEFAULT_REGION_COORDS } from "../../utils/useLiveLocation";
import { fetchNearbyHospitalsOverpass, OverpassQueryResult } from "../../utils/overpassService";
import { ReactLeafletHospitalMap } from "./ReactLeafletHospitalMap";
import { LocationSearchInput } from "../Common/LocationSearchInput";
import { getCachedLiveLocation } from "../../utils/geolocationHelper";
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
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>(() => {
    if (patientData.villageLatitude && patientData.villageLongitude) {
      return { latitude: patientData.villageLatitude, longitude: patientData.villageLongitude };
    }
    const cached = getCachedLiveLocation();
    if (cached) {
      return { latitude: cached.latitude, longitude: cached.longitude };
    }
    return {
      latitude: DEFAULT_REGION_COORDS.latitude,
      longitude: DEFAULT_REGION_COORDS.longitude,
    };
  });
  const [accuracyMeters, setAccuracyMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentVillageText, setCurrentVillageText] = useState<string>(
    patientData.village || getCachedLiveLocation()?.villageName || "Live Location"
  );

  // Facility discovery state
  const [facilityList, setFacilityList] = useState<HealthcareFacility[]>(MOCK_FACILITIES);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);
  const [facilityStatus, setFacilityStatus] = useState<string>("Locating nearby hospitals...");

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    assessment.requiredFacilityLevel.includes("District")
      ? "DH-01"
      : assessment.requiredFacilityLevel.includes("Community") || patientData.isPregnant
      ? "CHC-01"
      : "PHC-01"
  );

  // Fetch nearby hospitals based on real-time coordinates
  const fetchHospitals = useCallback(
    async (lat: number, lon: number) => {
      setIsLoadingHospitals(true);
      setFacilityStatus("Discovering nearest medical facilities...");
      try {
        const res: OverpassQueryResult = await fetchNearbyHospitalsOverpass(lat, lon, 40);
        if (res.facilities && res.facilities.length > 0) {
          setFacilityList(res.facilities);
          setFacilityStatus(
            `${res.count} facilities found near GPS`
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
        console.error("Failed to load facilities in ReferralMap3D:", err);
        setFacilityStatus("Regional Healthcare Directory");
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
        if (error.code === 1) msg = "Location permission denied. Search village or sub-centre below.";
        else if (error.code === 2) msg = "GPS signal unavailable. Search village or sub-centre below.";
        else if (error.code === 3) msg = "GPS timed out. Search village or sub-centre below.";
        setGpsError(msg);
        fetchHospitals(coords.latitude, coords.longitude);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [coords.latitude, coords.longitude, fetchHospitals]);

  // Initial load
  useEffect(() => {
    if (patientData.villageLatitude && patientData.villageLongitude) {
      fetchHospitals(patientData.villageLatitude, patientData.villageLongitude);
    } else {
      handleDetectRealTimeGps();
    }
  }, [fetchHospitals, handleDetectRealTimeGps, patientData.villageLatitude, patientData.villageLongitude]);

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
              LIVE REFERRAL TRAJECTORY
            </span>
            <span className="text-xs text-blue-200 font-semibold bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300" />
              {facilityStatus}
            </span>
          </div>

          <h2 className="text-2xl font-black mt-2 tracking-tight text-white flex items-center gap-2">
            <span>Live Referral Trajectory & Facility Routing</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live hospital route & facility matching for{" "}
            <strong>{patientData.patientName || "Emergency Patient"}</strong> from{" "}
            <strong>{currentVillageText || patientData.village || "Live Location"}</strong>.
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

      {/* 1b. Village & Sub-Centre Search Bar with GPS Option */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-md space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">
              Change Origin Village / Sub-Centre:
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Type village or sub-centre name anywhere in India, or tap GPS
          </span>
        </div>
        <LocationSearchInput
          id="referral-map-village-search"
          value={currentVillageText}
          placeholder="Type village name, sub-centre, or tap GPS..."
          showCurrentLocationOption={true}
          onChange={(newVillage, newCoords) => {
            setCurrentVillageText(newVillage);
            if (newCoords) {
              setCoords({ latitude: newCoords.latitude, longitude: newCoords.longitude });
              fetchHospitals(newCoords.latitude, newCoords.longitude);
            }
          }}
          onLocationSelected={(loc) => {
            setCurrentVillageText(loc.village);
            setCoords({ latitude: loc.latitude, longitude: loc.longitude });
            fetchHospitals(loc.latitude, loc.longitude);
          }}
        />
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
        patientVillage={currentVillageText || patientData.village || "Current Location"}
        patientName={patientData.patientName || "Emergency Patient"}
        className="w-full"
        heightClass="h-[340px] sm:h-[440px] md:h-[520px]"
        onRefreshGps={handleDetectRealTimeGps}
        isLocating={isLocating}
        overpassSource={facilityStatus}
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
