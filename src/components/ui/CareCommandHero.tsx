import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  Languages,
  Clock,
  Sparkles,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface CareCommandHeroProps {
  onStartNewCase: () => void;
  onOpenDoctorCommand?: () => void;
}

export const CareCommandHero: React.FC<CareCommandHeroProps> = ({
  onStartNewCase,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#07111F] border border-slate-800/90 shadow-2xl p-6 sm:p-8 lg:p-10 mb-8 text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Content & CTA */}
      <div className="relative z-10 text-center max-w-2xl mx-auto space-y-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            RURAL EMERGENCY CLINICAL TRIAGE ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight mt-1">
            CONNECTING EVERY PATIENT TO THE RIGHT CARE
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
            Capture symptoms → Detect risk → Refer faster.
            Empowering ASHA community health workers with 3D decision support and hospital dispatch.
          </p>
        </div>

        {/* Big Start Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            id="btn-care-command-start-case"
            onClick={() => {
              playHapticSound("success");
              onStartNewCase();
            }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-600/30 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer border border-cyan-300/30"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-spin" />
            <span>START A NEW PATIENT CASE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Core Trust Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-slate-300">
          <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% Offline-Ready
          </span>
          <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            All 36 States & 22+ Languages
          </span>
          <span className="bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            &lt;90 Sec Triage Decision
          </span>
        </div>
      </div>
    </div>
  );
};
