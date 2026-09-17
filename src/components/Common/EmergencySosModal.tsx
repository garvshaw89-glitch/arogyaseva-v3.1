import React, { useState, useEffect } from "react";
import { playHapticSound } from "../../utils/audioFeedback";
import { PatientCase } from "../../types";
import {
  Siren,
  PhoneCall,
  MapPin,
  Clock,
  Radio,
  X,
  CheckCircle2,
  AlertTriangle,
  Hospital,
  Printer,
  ShieldAlert,
  Volume2,
  VolumeX,
} from "lucide-react";

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation?: {
    village: string;
    latitude?: number;
    longitude?: number;
  };
  onGenerateReport?: (sosCase: PatientCase) => void;
  onOpenMapTracker?: () => void;
}

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onGenerateReport,
  onOpenMapTracker,
}) => {
  const [etaSeconds, setEtaSeconds] = useState(480); // 8 minutes
  const [selectedEmergencyCondition, setSelectedEmergencyCondition] = useState<string>("Acute Life Threatening Emergency");
  const [beaconActive, setBeaconActive] = useState(true);
  const [dispatchConfirmed, setDispatchConfirmed] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    playHapticSound("alert");

    const timer = setInterval(() => {
      setEtaSeconds((prev) => (prev > 30 ? prev - 1 : 30));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(etaSeconds / 60);
  const seconds = etaSeconds % 60;
  const etaFormatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  const emergencyConditions = [
    "Acute Respiratory Failure",
    "Unconscious / Unresponsive",
    "Severe Hemorrhage / Bleeding",
    "Precipitous Labour / Eclampsia",
    "Acute Chest Pain / Cardiac",
    "Severe Trauma / Accident",
    "Snakebite / Poisoning",
  ];

  const handleSelectCondition = (cond: string) => {
    setSelectedEmergencyCondition(cond);
    playHapticSound("step");
  };

  const handleCreateSosReport = () => {
    playHapticSound("click");
    const sosCase: PatientCase = {
      id: `SOS-${Date.now().toString().slice(-6)}`,
      patientName: `Emergency Patient (${selectedEmergencyCondition})`,
      age: 40,
      gender: "Other",
      village: currentLocation?.village || "Rampur Village (GPS Auto-Located)",
      villageLatitude: currentLocation?.latitude || 22.8115,
      villageLongitude: currentLocation?.longitude || 77.7845,
      contactNumber: "108 Emergency Dispatch",
      chwName: "Anjali Devi (ASHA - Rapid SOS)",
      symptoms: [selectedEmergencyCondition, "Rapid 1-Tap SOS Triggered"],
      symptomDuration: "Immediate / Acute",
      rawVoiceInput: "Rapid one-tap 108 Emergency Ambulance dispatch triggered from header SOS button, bypassing standard intake workflow.",
      vitals: {
        temperature: 98.6,
        heartRate: 120,
        spo2: 85,
        bpSystolic: 150,
        bpDiastolic: 95,
        respiratoryRate: 30,
      },
      isPregnant: selectedEmergencyCondition.includes("Labour"),
      riskLevel: "URGENT",
      riskScore: 99,
      dangerSigns: [
        "One-tap rapid SOS alert triggered",
        selectedEmergencyCondition,
        "Critical emergency transit required",
      ],
      clinicalImpression: `Critical Emergency Presentation: ${selectedEmergencyCondition}. Immediate ALS 108 Ambulance En Route.`,
      recommendedAction: "Emergency ALS Ambulance transport with active oxygenation to nearest District Emergency Trauma Center.",
      sbarSummary: {
        situation: `ONE-TAP EMERGENCY SOS: ${selectedEmergencyCondition} detected at ${currentLocation?.village || "Rampur"}. Ambulance unit 108 dispatched.`,
        background: "Frontline health worker bypassed standard triage workflow for rapid immediate resuscitation transport.",
        assessment: "Unstable / Acute Life Threatening Emergency requiring advanced airway and emergency room resuscitation.",
        recommendation: "Emergency Department alert: Prepare trauma resuscitation bay, ALS stretcher, and on-call Emergency Medical Officer.",
      },
      fieldStabilizingActions: [
        "High-flow 100% Oxygen support via non-rebreather mask",
        "Keep patient in recovery position with airway clear",
        "Continuous vital signs and pulse oximetry monitoring",
      ],
      followUpAnswers: {
        emergency_sos_condition: selectedEmergencyCondition,
      },
      referredFacility: {
        id: "dh-district-emergency",
        name: "District Emergency Trauma & Resuscitation Center",
        type: "District Hospital (DH)",
        distanceKm: 8.5,
      },
      status: "DISPATCHED",
      createdAt: new Date().toISOString(),
    };

    if (onGenerateReport) {
      onGenerateReport(sosCase);
    }
  };

  return (
    <div
      id="emergency-sos-modal-overlay"
      className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-slate-900 border-2 border-red-500 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto text-white space-y-0">
        {/* Top Emergency Beacon Bar */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center font-bold shadow-lg animate-bounce">
              <Siren className="w-6 h-6 animate-spin" style={{ animationDuration: "3s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
                  1-TAP WORKFLOW BYPASS
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight uppercase mt-0.5">
                108 Emergency Ambulance Dispatched
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Live ETA and Unit Telemetry Banner */}
          <div className="bg-slate-950 border border-red-500/40 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/40 flex flex-col items-center justify-center font-mono">
                <span className="text-[10px] text-red-400 font-bold uppercase">ETA</span>
                <span className="text-xl font-black text-white">{etaFormatted}</span>
                <span className="text-[8px] text-slate-400">MINS</span>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                  ALS UNIT EN ROUTE (GPS TRACKING)
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Vehicle ID: <span className="font-mono text-cyan-300">UP-70-EM-108 (ALS)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pilot: <strong>Ramesh Yadav</strong> • EMT: <strong>Pooja Sharma (Medic)</strong>
                </p>
              </div>
            </div>

            {/* Direct Calling Hotline Button */}
            <div className="flex items-center gap-2">
              <a
                href="tel:108"
                id="btn-direct-call-108"
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Call 108 Dispatch</span>
              </a>
            </div>
          </div>

          {/* Location Broadcast Notice */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-slate-200 block">
                Live Field Location Transmitted to Emergency CAD:
              </span>
              <p className="text-slate-300 font-mono text-[11px]">
                {currentLocation?.village || "Rampur Village, Primary Sub-Center"}
                {currentLocation?.latitude ? ` (GPS: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude?.toFixed(4)})` : " (GPS Locked via Cellular Triangulation)"}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold pt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Emergency Resuscitation Bay Alerted at District Hospital
              </p>
            </div>
          </div>

          {/* Quick Condition Tagging (1-Tap Clinical Annotation) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Critical Presentation (For Incoming EMT):</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">1-tap update</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {emergencyConditions.map((cond, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCondition(cond)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                    selectedEmergencyCondition === cond
                      ? "bg-red-600 text-white border-red-500 font-bold shadow-md shadow-red-500/20"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Protocols Checklist */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
              IMMEDIATE FIELD STABILIZATION BEFORE AMBULANCE ARRIVAL:
            </span>
            <ul className="space-y-1.5 text-slate-300 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Ensure patent airway; position patient in left lateral recovery if unconscious.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Keep patient calm, warm, and elevated at 45° if experiencing severe shortness of breath.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 font-bold">•</span>
                <span>Assign a village volunteer to stand at the village main road intersection to guide the ambulance driver.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenMapTracker && (
              <button
                type="button"
                id="btn-sos-open-map"
                onClick={() => {
                  onClose();
                  onOpenMapTracker();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Track Live Ambulance on Map</span>
              </button>
            )}

            <button
              type="button"
              id="btn-sos-generate-report"
              onClick={handleCreateSosReport}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Generate Emergency Referral Slip</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer transition-all shadow-md shadow-red-600/30"
          >
            Acknowledge & Stand By
          </button>
        </div>
      </div>
    </div>
  );
};
