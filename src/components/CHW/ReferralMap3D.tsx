import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { HealthcareFacility, RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { OsmOfflineMap } from "./OsmOfflineMap";
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
  Box,
  Compass,
  Sparkles,
  Radio,
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
  const [activeMapTab, setActiveMapTab] = useState<"osm" | "3d">("osm");
  const [facilityList, setFacilityList] = useState<HealthcareFacility[]>(MOCK_FACILITIES);
  const [isLocatingNearby, setIsLocatingNearby] = useState(false);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    assessment.requiredFacilityLevel.includes("District")
      ? "DH-01"
      : assessment.requiredFacilityLevel.includes("Community") || patientData.isPregnant
      ? "CHC-01"
      : "PHC-01"
  );

  const selectedFacility =
    facilityList.find((f) => f.id === selectedFacilityId) || facilityList[1] || MOCK_FACILITIES[1];

  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Nearby Hospitals from API based on Patient Coordinates
  const fetchNearbyHospitals = async (lat = 22.7533, lon = 77.7291) => {
    setIsLocatingNearby(true);
    try {
      const res = await fetch(`/api/nearby-hospitals?lat=${lat}&lon=${lon}&radius=60`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.facilities) && data.facilities.length > 0) {
        setFacilityList(data.facilities);
        playHapticSound("success");
      }
    } catch (err) {
      console.warn("Using local facility fallback:", err);
    } finally {
      setIsLocatingNearby(false);
    }
  };

  // 3D Three.js Terrain Map & Dynamic Route Trajectory
  useEffect(() => {
    if (activeMapTab !== "3d") return;
    const container = mapContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 1. Terrain Grid plane
    const gridHelper = new THREE.GridHelper(26, 26, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Village node (Patient origin) at (-6, 0, 3)
    const villagePos = new THREE.Vector3(-7, 0, 4);
    const villageGeo = new THREE.CylinderGeometry(0.7, 0.9, 0.4, 8);
    const villageMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
    const villageMesh = new THREE.Mesh(villageGeo, villageMat);
    villageMesh.position.copy(villagePos);
    villageMesh.position.y = 0.2;
    scene.add(villageMesh);

    // Facility locations on 3D map
    const facilityCoords: Record<string, THREE.Vector3> = {
      "HWC-01": new THREE.Vector3(-4, 0, 1),
      "PHC-01": new THREE.Vector3(-1, 0, -2),
      "CHC-01": new THREE.Vector3(3, 0, 1),
      "SDH-01": new THREE.Vector3(5, 0, -1),
      "DH-01": new THREE.Vector3(7, 0, -3),
    };

    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    const markerMeshes: Record<string, THREE.Mesh> = {};

    facilityList.forEach((fac) => {
      const pos = facilityCoords[fac.id] || new THREE.Vector3(0, 0, 0);
      const isCurSelected = fac.id === selectedFacilityId;
      const isDistrict = fac.id === "DH-01";

      const height = isDistrict ? 2.4 : fac.id === "CHC-01" ? 1.8 : 1.2;
      const geo = new THREE.BoxGeometry(1.1, height, 1.1);
      const mat = new THREE.MeshStandardMaterial({
        color: isCurSelected ? 0xef4444 : 0x0284c7,
        metalness: 0.6,
        roughness: 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.position.y = height / 2;
      markerGroup.add(mesh);
      markerMeshes[fac.id] = mesh;

      // Roof Beacon / Cross
      const beaconGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: isCurSelected ? 0xffffff : 0x38bdf8,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.copy(pos);
      beacon.position.y = height + 0.3;
      markerGroup.add(beacon);
    });

    // Dynamic Route Line from Village to Selected Facility
    const targetPos = facilityCoords[selectedFacilityId] || new THREE.Vector3(0, 0, 0);
    const midPoint = new THREE.Vector3(
      (villagePos.x + targetPos.x) / 2,
      2.8, // arc height
      (villagePos.z + targetPos.z) / 2
    );

    const routeCurve = new THREE.QuadraticBezierCurve3(villagePos, midPoint, targetPos);
    const routePoints = routeCurve.getPoints(50);
    const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints);
    const routeMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      linewidth: 3,
    });
    const routeLine = new THREE.Line(routeGeo, routeMat);
    scene.add(routeLine);

    // Glowing energy pulse along route
    const pulseGeo = new THREE.SphereGeometry(0.3, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    scene.add(pulseMesh);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = (clock.getElapsedTime() * 0.4) % 1;
      const currentPoint = routeCurve.getPointAt(t);
      pulseMesh.position.copy(currentPoint);

      // Elevate and rotate selected marker
      const selMesh = markerMeshes[selectedFacilityId];
      if (selMesh) {
        selMesh.rotation.y = clock.getElapsedTime() * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      if (w > 0) {
        camera.aspect = w / height;
        camera.updateProjectionMatrix();
        renderer.setSize(w, height);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedFacilityId, activeMapTab, facilityList]);

  const handleCallAmbulance = () => {
    playHapticSound("alert");
    window.location.href = "tel:108";
  };

  return (
    <div id="referral-map-3d-step" className="space-y-6">
      {/* 1. Header & Emergency Hotline Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-950/80 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full tracking-wider border border-red-400/40">
              OFFLINE-CAPABLE REFERRAL NETWORK
            </span>
            <span className="text-xs text-red-100 font-mono">
              TARGET TIER: <strong>{assessment.requiredFacilityLevel}</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display mt-1.5">
            Geographic Hospital Matching & Route Optimization
          </h2>
          <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
            Ranked by specialized clinical capability (Oxygen beds, Blood Storage, Obstetric OT, Pediatric ICU) and live travel time from Rampur Hamlet.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            id="btn-find-nearest-hospitals"
            onClick={() => {
              playHapticSound("click");
              fetchNearbyHospitals();
            }}
            disabled={isLocatingNearby}
            className="bg-red-800/80 hover:bg-red-800 text-white font-bold text-xs px-4 py-3 rounded-2xl border border-red-400/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Compass className={`w-4 h-4 ${isLocatingNearby ? "animate-spin" : ""}`} />
            <span>{isLocatingNearby ? "Scanning District..." : "Find Nearest Hospitals"}</span>
          </button>

          {/* 108 Emergency Ambulance Button */}
          <button
            id="btn-call-108-emergency"
            onClick={handleCallAmbulance}
            className="bg-white text-red-700 hover:bg-red-50 font-extrabold text-sm px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-red-600 animate-bounce" />
            <span>Call 108 Ambulance Now</span>
          </button>
        </div>
      </div>

      {/* 2. Visual View Mode Tabs (OSM Offline Map vs 3D Isometric Terrain) */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            id="btn-tab-osm-map"
            onClick={() => {
              playHapticSound("click");
              setActiveMapTab("osm");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMapTab === "osm"
                ? "bg-cyan-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>Live Location Tracker & OSM Map</span>
          </button>

          <button
            id="btn-tab-3d-terrain"
            onClick={() => {
              playHapticSound("click");
              setActiveMapTab("3d");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeMapTab === "3d"
                ? "bg-red-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D Isometric District Terrain</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
          <span>Active Target:</span>
          <strong className="text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {selectedFacility.name}
          </strong>
        </div>
      </div>

      {/* 3. Map Display Container */}
      {activeMapTab === "osm" ? (
        <OsmOfflineMap
          facilities={facilityList}
          selectedFacility={selectedFacility}
          onSelectFacility={(fac) => setSelectedFacilityId(fac.id)}
          patientVillage={patientData.village || "Rampur Hamlet"}
          villageCoords={[22.7533, 77.7291]}
        />
      ) : (
        <div className="bg-slate-950/95 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800/80 pb-3 mb-3 text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider">
                3D ISOMETRIC DISTRICT TERRAIN VISUALIZER
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">📍 VILLAGE: {patientData.village || "RAMPUR"}</span>
              <span className="text-slate-600">→</span>
              <span className="text-red-400 font-bold">🏥 DESTINATION: {selectedFacility.name}</span>
            </div>
          </div>

          {/* 3D Map Container */}
          <div ref={mapContainerRef} className="w-full h-[320px] rounded-2xl bg-slate-950/70 border border-slate-900 cursor-grab relative" />

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Patient Village
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" /> Nearby Facilities
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-red-500 inline-block" /> Target Referral Hospital
              </span>
            </div>
            <span className="text-cyan-400 font-bold">ROTATING 3D MARKER = ACTIVE DISPATCH TARGET</span>
          </div>
        </div>
      )}

      {/* 4. Facility Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {facilityList.map((fac) => {
          const isSelected = selectedFacilityId === fac.id;
          const isRecommended =
            fac.type.toLowerCase().includes(assessment.requiredFacilityLevel.toLowerCase().slice(0, 5));

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
                  ? "bg-slate-900 border-red-500 text-white shadow-xl ring-2 ring-red-500/30"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md text-slate-900"
              }`}
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-red-950 text-red-300 border border-red-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {fac.type}
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> MATCH
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm leading-tight">{fac.name}</h4>
                <p className={`text-xs mt-1 ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                  {fac.address}
                </p>

                {/* Distance and Travel Time */}
                <div className="flex items-center gap-3 my-3 text-xs font-mono">
                  <span className="flex items-center gap-1 font-bold text-cyan-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {fac.distanceKm} km
                  </span>
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Clock className="w-3.5 h-3.5" />
                    ~{fac.travelTimeMins} min
                  </span>
                </div>

                {/* Capability Pills */}
                <div className="flex flex-wrap gap-1.5 my-2">
                  {fac.hasOxygen && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                      <Wind className="w-3 h-3" /> O₂
                    </span>
                  )}
                  {fac.hasBloodBank && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                      <Droplet className="w-3 h-3" /> Blood
                    </span>
                  )}
                  {fac.hasNICU && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
                      <Baby className="w-3 h-3" /> NICU
                    </span>
                  )}
                  {fac.hasAmbulance24x7 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      108 24x7
                    </span>
                  )}
                </div>
              </div>

              {/* Beds Status */}
              <div className={`pt-3 border-t text-xs flex items-center justify-between ${isSelected ? "border-slate-800 text-slate-300" : "border-slate-100 text-slate-600"}`}>
                <span>Available Beds:</span>
                <strong className={isSelected ? "text-cyan-300 font-mono" : "text-slate-900 font-mono"}>
                  {fac.availableBeds} (ICU: {fac.icuBedsAvailable})
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Action Footer & Dispatch Confirmation */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-slate-200">
        <button
          id="btn-back-to-risk-engine"
          onClick={() => {
            playHapticSound("click");
            onBack();
          }}
          className="px-5 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Risk Engine</span>
        </button>

        <button
          id="btn-generate-sbar-referral"
          onClick={() => {
            playHapticSound("success");
            onSelectFacilityAndGenerateSlip(selectedFacility);
          }}
          className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center gap-3 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          <span>Generate SBAR Referral Slip for {selectedFacility.name}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
