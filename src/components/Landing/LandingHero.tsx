import React, { useEffect, useState } from "react";
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initiate subtle staggered entrance transitions
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="arogyaseva-hero relative w-full min-h-[720px] lg:min-h-[820px] flex flex-col items-center justify-center py-14 sm:py-18 lg:py-24 overflow-hidden border-b border-slate-200/80">
      {/* Background Video Layer with Graceful Fallback & Readability Protection */}
      <HeroBackgroundVideo />

      {/* Perfectly Centered Hero Container via Flexbox (z-index: 2 / z-10) */}
      <div className="arogyaseva-hero-content container-constrained relative z-10 w-full flex flex-col items-center justify-center text-center">
        
        {/* Arogya Seva Logo Shifted Above Clinical Intelligence */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 select-none animate-float-slow hero-transition-item hero-delay-logo ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          {/* Animated Heartbeat Clinical Icon Badge */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0B1F3A] via-[#123B63] to-[#164E78] flex items-center justify-center text-white shadow-xl shadow-[#0B1F3A]/20 ring-2 ring-white/90 transition-all">
            <span className="absolute inset-0 rounded-2xl bg-[#00C2D7] opacity-25 blur-md animate-pulse-subtle" />
            <Activity className="w-6 h-6 sm:w-7 sm:h-7 text-[#00C2D7] animate-heartbeat relative z-10 drop-shadow-md" />
          </div>

          {/* Typography: Big Font & High Animation Shimmer */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none font-['Outfit',sans-serif] drop-shadow-xs">
              <span className="text-[#0B1F3A]">Arogya</span><span className="text-[#00C2D7] font-black drop-shadow-sm">Seva</span>
            </div>
            <div className="text-[10px] sm:text-xs font-extrabold tracking-[0.22em] text-[#527086] uppercase mt-1 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#164E78] animate-ping" />
              <span>Clinical Intelligence Network</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2D7] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Big Headline (Section 6: Main heading #0B1F3A, highlight words #00AFC4 / #00C2D7) */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-black text-[#0B1F3A] tracking-tight leading-[1.08] max-w-4xl mx-auto mb-6 hero-headline-contrast hero-transition-item hero-delay-headline ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          Clinical Intelligence at the{" "}
          <span className="text-[#00AFC4] relative inline-block">
            Point of Care.
            <svg
              className="absolute -bottom-2 left-0 w-full h-3 text-[#00C2D7]/60"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="4.5" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Sub-headline / Description (Section 6: Body text #527086) */}
        <p
          className={`text-base sm:text-lg md:text-xl text-[#527086] leading-relaxed max-w-3xl mx-auto mb-8 font-normal hero-subheadline-contrast hero-transition-item hero-delay-subheadline ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          ArogyaSeva is a production-grade clinical decision support and emergency referral network. 
          Empowering frontline ASHA health workers with autonomous 100% offline WHO IMCI protocols, 
          voice anamnesis across Indian languages, and automated SBAR clinical handover.
        </p>

        {/* Primary & Secondary Action CTAs (Centered Flexbox with Individual Staggered Delays) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto mb-9">
          <button
            type="button"
            onClick={onStartIntake}
            className={`glass-btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-bold text-white shadow-lg cursor-pointer group hero-transition-item hero-delay-cta-1 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <UserCheck className="w-5 h-5 text-[#00C2D7] group-hover:scale-110 transition-transform" />
            <span>Launch CHW Intake</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onOpenDoctorPortal}
            className={`glass-btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-sm font-bold text-[#0B1F3A] shadow-md cursor-pointer group hero-transition-item hero-delay-cta-2 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <Stethoscope className="w-4 h-4 text-[#164E78] group-hover:scale-110 transition-transform" />
            <span>Doctor Command Center</span>
          </button>

          <button
            type="button"
            onClick={onTriggerEmergencySos}
            className={`glass-btn-emergency w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-4 rounded-2xl text-sm font-extrabold text-white shadow-lg cursor-pointer group hero-transition-item hero-delay-cta-3 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>108 SOS Dispatch</span>
          </button>
        </div>

        {/* Trust & Protocol Badges (Centered Glass Capsule Pills) */}
        <div
          className={`w-full max-w-4xl mx-auto pt-6 pb-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-bold text-[#527086] mb-12 hero-transition-item hero-delay-badges ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs text-[#0B1F3A]">
            <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            <span>WHO IMCI Clinical Protocols</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs text-[#0B1F3A]">
            <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            <span>100% Offline-First Engine</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs text-[#0B1F3A]">
            <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            <span>Pan-Indian Multilingual Voice</span>
          </div>
          <div className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs text-[#0B1F3A]">
            <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            <span>State Health System Aligned</span>
          </div>
        </div>

        {/* Centered Hero Visual: Live Clinical Intelligence Telemetry Mockup */}
        <div
          className={`relative w-full max-w-xl sm:max-w-2xl mx-auto hero-transition-item hero-delay-mockup ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          {/* Subtle Ambient Backlight Frame */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#00C2D7]/15 via-[#19E6C1]/15 to-[#164E78]/15 rounded-3xl blur-xl opacity-80 pointer-events-none" />

          <div className="glass-panel relative rounded-2xl border border-white/90 shadow-2xl overflow-hidden text-left">
            {/* Telemetry Header */}
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#123B63] to-[#164E78] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C2D7] animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase font-mono">
                  Point-of-Care Clinical Intake
                </span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/15 text-[#22D3EE] border border-white/20 backdrop-blur-xs">
                {currentState.name} Sub-Center
              </span>
            </div>

            {/* Patient Case Snapshot */}
            <div className="p-5 sm:p-6 space-y-4 text-xs bg-white/78 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#0A172A]">
                    Sunita Patil, 29Y Female
                  </div>
                  <div className="text-[#527086] text-xs mt-0.5">
                    {currentState.defaultVillage} • Frontline ASHA: {currentState.ashaWorker}
                  </div>
                </div>
                <span className="glass-badge-amber inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>CONSULTATION</span>
                </span>
              </div>

              {/* Vitals Telemetry Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#527086]">SpO2 Saturation</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0B1F3A] font-mono">94%</span>
                  <span className="text-[10px] text-[#F59E0B] font-semibold">Borderline</span>
                </div>
                <div className="p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#527086]">Pulse Rate</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0B1F3A] font-mono">102 bpm</span>
                  <span className="text-[10px] text-[#F59E0B] font-semibold">Tachycardia</span>
                </div>
                <div className="p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#527086]">BP Diastolic</span>
                  <span className="text-base sm:text-lg font-extrabold text-[#0B1F3A] font-mono">142/92</span>
                  <span className="text-[10px] text-[#F59E0B] font-semibold">Stage 1 HTN</span>
                </div>
              </div>

              {/* SBAR Live Assessment Card - Clinical Glass */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#E8F6FA] border border-[rgba(0,194,215,0.25)] backdrop-blur-xs shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#0B1F3A] font-bold text-xs mb-1">
                  <FileText className="w-4 h-4 text-[#00C2D7]" />
                  <span>WHO IMCI Clinical Impression</span>
                </div>
                <p className="text-xs text-[#527086] leading-relaxed">
                  Persistent maternal fever (3 days) with tachycardia and elevated blood pressure. Recommended priority telemedicine consult or sub-district referral.
                </p>
              </div>

              {/* Recommended Referral Routing */}
              <div className="pt-3 flex items-center justify-between border-t border-[rgba(11,31,58,0.08)]">
                <div className="flex items-center gap-1.5 text-xs text-[#527086]">
                  <Activity className="w-4 h-4 text-[#19E6C1]" />
                  <span>Nearest: <strong className="text-[#0B1F3A]">Sub-District Hospital</strong> (4.2 km • 14 min)</span>
                </div>
                <button
                  type="button"
                  onClick={onStartIntake}
                  className="text-xs font-bold text-[#00C2D7] hover:text-[#0B1F3A] flex items-center gap-1 cursor-pointer transition-colors group"
                >
                  <span>Test Protocol</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Micro-Badge - Elevated Glass Surface */}
          <div className="absolute -bottom-4 -left-4 sm:-left-6 glass-level-3 px-4 py-2.5 rounded-2xl shadow-xl border border-white/90 hidden sm:flex items-center gap-2.5 z-20">
            <div className="w-8 h-8 rounded-xl bg-[#DDFBF5] border border-[rgba(25,230,193,0.3)] flex items-center justify-center text-[#065F53] shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0B1F3A]">Zero Cloud Dependency</div>
              <div className="text-[10px] text-[#527086]">On-Device Inference & Local IndexedDB</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
