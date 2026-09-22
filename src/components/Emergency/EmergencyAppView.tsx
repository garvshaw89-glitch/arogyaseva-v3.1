import React, { useState } from "react";
import { IndianStateData } from "../../data/indianStates";
import {
  PhoneCall,
  Ambulance,
  ShieldAlert,
  MapPin,
  Clock,
  Hospital,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Radio,
  FileText,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface EmergencyAppViewProps {
  currentState: IndianStateData;
  onOpenStateModal: () => void;
  onNavigateHome: () => void;
  onNavigateCHW: () => void;
  onNavigateDoctor: () => void;
  onOpenLiveTracker: () => void;
}

export const EmergencyAppView: React.FC<EmergencyAppViewProps> = ({
  currentState,
  onOpenStateModal,
  onNavigateHome,
  onNavigateCHW,
  onNavigateDoctor,
  onOpenLiveTracker,
}) => {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<"IDLE" | "TRANSMITTING" | "DISPATCHED">("IDLE");
  const [callerName, setCallerName] = useState(currentState.ashaWorker);
  const [patientCondition, setPatientCondition] = useState("Severe Pre-eclampsia with impending seizures (BP 170/110)");
  const [selectedFacility, setSelectedFacility] = useState("District Women & Child Hospital (7.4 km)");

  const handleConfirmDispatch = () => {
    playHapticSound("alert");
    setDispatchStatus("TRANSMITTING");
    setConfirmModalOpen(false);

    setTimeout(() => {
      setDispatchStatus("DISPATCHED");
      playHapticSound("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-glass-atmosphere flex flex-col font-sans">
      {/* Emergency Header - Clinical Glass Navbar */}
      <header className="sticky top-0 z-30 min-h-16 py-2 bg-gradient-to-r from-[#0F2347] via-[#123B78] to-[#1E40AF] text-white px-3 sm:px-6 flex items-center justify-between shadow-lg border-b border-white/15 backdrop-blur-xl gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Back to home"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-md shadow-red-900/30 ring-1 ring-white/30 shrink-0">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold tracking-tight leading-tight flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">108 Emergency Response</span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.2 rounded-full bg-red-500/30 text-white font-bold border border-red-400/40 shrink-0">
                  LIVE SOS
                </span>
              </div>
              <div className="text-[10px] text-cyan-200 font-mono truncate">
                State EMRS • {currentState.name}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNavigateCHW}
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer min-h-[38px] flex items-center"
          >
            <span className="hidden sm:inline">CHW Workstation</span>
            <span className="sm:hidden">CHW</span>
          </button>
          <button
            type="button"
            onClick={onNavigateDoctor}
            className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-xs transition-colors cursor-pointer min-h-[38px] flex items-center"
          >
            <span className="hidden sm:inline">Doctor Command</span>
            <span className="sm:hidden">Doctor</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full text-left space-y-6">
        {/* Status Alert Banner - Translucent Emerald Glass */}
        {dispatchStatus === "DISPATCHED" && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 backdrop-blur-md text-emerald-950 flex items-start gap-3 shadow-md animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-900">
                Ambulance Dispatched • Unit #MH-108-ALS-402
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Advanced Life Support (ALS) Ambulance en route to {currentState.defaultVillage}. Estimated arrival in 18 minutes. The District Hospital emergency triage team has been alerted.
              </p>
            </div>
          </div>
        )}

        {/* Emergency Dispatch Form & Review - Clinical Glass Level 3 */}
        <div className="glass-level-3 rounded-2xl border border-white/90 shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
          {/* Subtle Red Emergency Aura */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
            <div>
              <h1 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Immediate 108 ALS Ambulance Dispatch</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Authorized for severe physiological shock, obstetric red flags, and respiratory failure.
              </p>
            </div>
            <span className="glass-badge-rose px-3.5 py-1 rounded-full text-xs font-bold font-mono shadow-2xs">
              PRIORITY-1 RED
            </span>
          </div>

          {/* Key Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <label className="font-bold text-[#123B78] block mb-1">
                Calling Frontline Health Worker
              </label>
              <input
                type="text"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full bg-white/90 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <label className="font-bold text-[#123B78] block mb-1">
                Sub-Center Village & Region
              </label>
              <div className="font-semibold text-slate-800 py-2">
                {currentState.defaultVillage}, {currentState.name}
              </div>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <label className="font-bold text-[#123B78] block mb-1">
                Critical Clinical Condition / Danger Signs
              </label>
              <textarea
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                rows={2}
                className="w-full bg-white/90 border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
              <label className="font-bold text-[#123B78] block mb-1">
                Designated Receiving Facility
              </label>
              <div className="font-bold text-[#0F172A] py-1 text-sm">
                {selectedFacility}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Pre-notified triage bay • 4 ICU Beds open • Obstetrician on-call
              </div>
            </div>
          </div>

          {/* Primary Action with Mandatory Confirmation Dialog */}
          <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>National Dispatch Toll Free: <strong>108 / 102</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setConfirmModalOpen(true)}
              disabled={dispatchStatus === "TRANSMITTING"}
              className="glass-btn-emergency w-full sm:w-auto px-6 py-3 rounded-xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>
                {dispatchStatus === "TRANSMITTING"
                  ? "Transmitting..."
                  : dispatchStatus === "DISPATCHED"
                  ? "Dispatch Again"
                  : "Dispatch Emergency Response"}
              </span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal - Clinical Glass Modal (Level 4) */}
        {confirmModalOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="glass-level-4 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-white/90 text-left animate-scale-up">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">
                Confirm 108 Emergency Ambulance Dispatch
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                You are initiating an official emergency dispatch call to the State 108 Control Room for <strong>{currentState.defaultVillage}</strong>. An Advanced Life Support (ALS) vehicle and emergency medical technician will be dispatched immediately.
              </p>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDispatch}
                  className="glass-btn-emergency px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm & Dispatch
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
