import React from "react";
import {
  ShieldCheck,
  ArrowRight,
  Activity,
  Play,
  PhoneCall,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Sparkles,
  Zap,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { IndianStateData } from "../../data/indianStates";
import { HeroBackgroundVideo } from "./HeroBackgroundVideo";

interface LandingHeroProps {
  onStartIntake: () => void;
  onOpenDoctorPortal: () => void;
  onTriggerEmergencySos: () => void;
  onScrollToSolutions: () => void;
  onOpenVideoModal: () => void;
  currentState: IndianStateData;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartIntake,
  onOpenDoctorPortal,
  onTriggerEmergencySos,
  onScrollToSolutions,
  onOpenVideoModal,
  currentState,
}) => {
  return (
    <section className="arogyaseva-hero relative w-full min-h-[720px] lg:min-h-[820px] flex flex-col items-center justify-center py-14 sm:py-18 lg:py-24 overflow-hidden border-b border-slate-200/80">
      {/* Background Video Layer with Graceful Fallback & Readability Protection */}
      <HeroBackgroundVideo />

      {/* Perfectly Centered Hero Container via Flexbox (z-index: 2 / z-10) */}
      <div className="arogyaseva-hero-content container-constrained relative z-10 w-full flex flex-col items-center justify-center text-center">
        
        {/* Arogya Seva Logo Shifted Above Clinical Intelligence */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 select-none animate-float-slow">
          {/* Animated Heartbeat Clinical Icon Badge */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0B2545] via-[#123B78] to-[#2563EB] flex items-center justify-center text-white shadow-xl shadow-blue-900/25 ring-2 ring-blue-100/90 group-hover:ring-[#06B6D4] transition-all">
            <span className="absolute inset-0 rounded-2xl bg-[#06B6D4] opacity-25 blur-md animate-pulse-subtle" />
            <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-[#38BDF8] animate-heartbeat relative z-10 drop-shadow-md" />
          </div>

          {/* Typography: Big Font & High Animation Shimmer */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none font-['Outfit',sans-serif] animate-shimmer-text animate-text-glow drop-shadow-xs text-[#0F172A]">
              Arogya<span className="text-[#06B6D4] font-black drop-shadow-sm">Seva</span>
            </div>
            <div className="text-[10px] sm:text-xs font-extrabold tracking-[0.22em] text-slate-500 uppercase mt-1 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
              <span>Clinical Intelligence Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Big Headline (Increased font size for both mobile & desktop) */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-black text-[#0F172A] tracking-tight leading-[1.08] max-w-4xl mx-auto mb-6">
          Clinical Intelligence at the{" "}
          <span className="text-[#2563EB] relative inline-block">
            Point of Care.
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#06B6D4]/60"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="4.5" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Sub-headline / Description */}
        <p className="text-base sm:text-lg md:text-xl text-[#475569] leading-relaxed max-w-3xl mx-auto mb-8 font-normal">
          ArogyaSeva is a production-grade clinical decision support and emergency referral network. 
          Empowering frontline ASHA health workers with autonomous 100% offline WHO IMCI protocols, 
          voice anamnesis across Indian languages, and automated SBAR clinical handover.
        </p>

        {/* Primary & Secondary Action CTAs (Centered Flexbox) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto mb-9">
          <button
            type="button"
            onClick={onStartIntake}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#123B78] to-[#1E40AF] hover:from-[#0E2C5B] hover:to-[#1D4ED8] shadow-md hover:shadow-xl hover:shadow-blue-900/20 transition-all cursor-pointer group"
          >
            <UserCheck className="w-5 h-5 text-[#06B6D4]" />
            <span>Launch CHW Intake</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onOpenDoctorPortal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-bold text-[#123B78] bg-white hover:bg-slate-50 border border-slate-300/90 shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-[#2563EB]" />
            <span>Doctor Command Center</span>
          </button>

          <button
            type="button"
            onClick={onTriggerEmergencySos}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] shadow-md hover:shadow-lg hover:shadow-red-700/20 transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>108 SOS Dispatch</span>
          </button>
        </div>

        {/* Trust & Protocol Badges (Centered) */}
        <div className="w-full max-w-3xl mx-auto pt-6 pb-2 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-6 sm:gap-x-8 text-xs font-bold text-[#64748B] mb-12">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>WHO IMCI Clinical Protocols</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>100% Offline-First Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>Pan-Indian Multilingual Voice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span>State Health System Aligned</span>
          </div>
        </div>

        {/* Centered Hero Visual: Live Clinical Intelligence Telemetry Mockup */}
        <div className="relative w-full max-w-xl sm:max-w-2xl mx-auto">
          {/* Subtle Ambient Backlight Frame */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-3xl blur-lg opacity-70" />

          <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl shadow-blue-900/10 overflow-hidden text-left">
            {/* Telemetry Header */}
            <div className="bg-[#123B78] text-white px-5 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wide uppercase font-mono">
                  Point-of-Care Clinical Intake
                </span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/15 text-cyan-200 border border-white/10">
                {currentState.name} Sub-Center
              </span>
            </div>

            {/* Patient Case Snapshot */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#0F172A]">
                    Sunita Patil, 29Y Female
                  </div>
                  <div className="text-[#64748B] text-xs mt-0.5">
                    {currentState.defaultVillage} • Frontline ASHA: {currentState.ashaWorker}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>CONSULTATION</span>
                </span>
              </div>

              {/* Vitals Telemetry Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">SpO2 Saturation</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0F172A] font-mono">94%</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Borderline</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Pulse Rate</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0F172A] font-mono">102 bpm</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Tachycardia</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">BP Diastolic</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0F172A] font-mono">142/92</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Stage 1 HTN</span>
                </div>
              </div>

              {/* SBAR Live Assessment Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                <div className="flex items-center gap-1.5 text-[#123B78] font-bold text-xs mb-1">
                  <FileText className="w-4 h-4 text-[#2563EB]" />
                  <span>WHO IMCI Clinical Impression</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  Persistent maternal fever (3 days) with tachycardia and elevated blood pressure. Recommended priority telemedicine consult or sub-district referral.
                </p>
              </div>

              {/* Recommended Referral Routing */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-[#475569]">
                  <Activity className="w-4 h-4 text-[#16A34A]" />
                  <span>Nearest: <strong>Sub-District Hospital</strong> (4.2 km • 14 min)</span>
                </div>
                <button
                  type="button"
                  onClick={onStartIntake}
                  className="text-xs font-bold text-[#2563EB] hover:text-[#123B78] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Test Protocol</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Micro-Badge */}
          <div className="absolute -bottom-4 -left-4 sm:-left-6 bg-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-200/90 hidden sm:flex items-center gap-2.5 z-20">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0F172A]">Zero Cloud Dependency</div>
              <div className="text-[10px] text-[#64748B]">On-Device Inference & Local IndexedDB</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
