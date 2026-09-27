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
  Dna,
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
  onReplayIntro?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartIntake,
  onOpenDoctorPortal,
  onTriggerEmergencySos,
  onScrollToSolutions,
  onOpenVideoModal,
  currentState,
  onReplayIntro,
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
        
        {/* Arogya Seva Logo & Clinical Readiness Heart-Rate Telemetry */}
        <div
          className={`flex flex-col md:flex-row items-center justify-center gap-3.5 sm:gap-6 mb-6 select-none animate-float-slow hero-transition-item hero-delay-logo ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          {/* Logo & Brand Typography */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {/* Animated Heartbeat Clinical Icon Badge */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0B1F3A] via-[#123B63] to-[#164E78] flex items-center justify-center text-white shadow-xl shadow-[#0B1F3A]/20 ring-2 ring-white/90 transition-all shrink-0">
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

          {/* Integrated Clinical Readiness Visualizer (using .heart-rate animation system from index.css) */}
          <div
            className="flex items-center gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-md shadow-[#0B1F3A]/5 transition-all hover:shadow-lg"
            title="ArogyaSeva Clinical Grid Readiness: 72 BPM Normal Sinus Rhythm"
            role="status"
            aria-label="Clinical Readiness: Active 72 BPM Telemetry Waveform"
          >
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-[#065F53] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#19E6C1] animate-ping" />
                <span>Clinical Readiness</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-[#0B1F3A] font-mono flex items-center gap-1.5 mt-0.5">
                <span className="text-[#00C2D7]">72</span>
                <span className="text-[10px] font-semibold text-[#527086]">BPM</span>
                <span className="text-[9px] text-[#059669] font-bold px-1.5 py-0.2 rounded-full bg-[#DDFBF5] border border-[#19E6C1]/30">
                  READY
                </span>
              </div>
            </div>

            {/* .heart-rate container with .fade-in and .fade-out from index.css */}
            <div
              className="heart-rate overflow-hidden !m-0 !w-[110px] sm:!w-[130px] !h-[38px] sm:!h-[42px] relative rounded-lg bg-white border border-slate-200/80 shadow-inner"
              style={{ "--heart-rate-bg": "#ffffff" } as React.CSSProperties}
            >
              <svg
                version="1.0"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 150 73"
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <defs>
                  {/* High-Definition Clinical Cyan to Emerald Gradient */}
                  <linearGradient id="heroEkgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00A7BD" />
                    <stop offset="35%" stopColor="#00C2D7" />
                    <stop offset="70%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#00C2D7" />
                  </linearGradient>
                  {/* Subtle EKG Grid Pattern */}
                  <pattern id="ekgGridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#00C2D7" strokeWidth="0.5" strokeOpacity="0.08" />
                  </pattern>
                </defs>

                {/* Telemetry Grid Background */}
                <rect width="100%" height="100%" fill="url(#ekgGridPattern)" />

                {/* Isoelectric Baseline Guide (faint) */}
                <line x1="0" y1="45" x2="150" y2="45" stroke="#00C2D7" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.18" />

                {/* Soft Ambient Phosphor Glow Layer behind EKG stroke */}
                <path
                  d="M 0,45 L 18,45 Q 22,45 24,42 Q 27,39 30,45 L 35,45 L 38,49 L 45,9 L 51,64 L 55,45 L 60,45 Q 64,45 67,37 Q 71,37 75,45 L 92,45 Q 96,45 98,42 Q 101,39 104,45 L 109,45 L 112,49 L 119,10 L 125,63 L 129,45 L 134,45 Q 138,45 141,37 Q 145,37 148,45 L 150,45"
                  fill="none"
                  stroke="#00C2D7"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity="0.22"
                />

                {/* Primary Crisp High-Contrast EKG Waveform Path */}
                <path
                  d="M 0,45 L 18,45 Q 22,45 24,42 Q 27,39 30,45 L 35,45 L 38,49 L 45,9 L 51,64 L 55,45 L 60,45 Q 64,45 67,37 Q 71,37 75,45 L 92,45 Q 96,45 98,42 Q 101,39 104,45 L 109,45 L 112,49 L 119,10 L 125,63 L 129,45 L 134,45 Q 138,45 141,37 Q 145,37 148,45 L 150,45"
                  fill="none"
                  stroke="url(#heroEkgGradient)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeMiterlimit="10"
                />
              </svg>
              <div className="fade-in" />
              <div className="fade-out" />
            </div>
          </div>
        </div>

        {/* Big Headline (Section 6: Main heading #0B1F3A, highlight words #00AFC4 / #00C2D7) */}
        <h1
          style={{ fontSize: "clamp(2.15rem, 5vw + 0.75rem, 4.75rem)" }}
          className={`font-black text-[#0B1F3A] tracking-tight leading-[1.08] max-w-4xl mx-auto mb-5 sm:mb-6 hero-headline-contrast hero-transition-item hero-delay-headline px-1 ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          Clinical Intelligence at the{" "}
          <span className="text-[#00AFC4] relative inline-block">
            Point of Care.
            <svg
              className="absolute -bottom-2 left-0 w-full h-2.5 sm:h-3 text-[#00C2D7]/60"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="4.5" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Sub-headline / Description (Section 6: Body text #527086) */}
        <p
          className={`text-sm sm:text-base md:text-lg lg:text-xl text-[#527086] leading-relaxed max-w-3xl mx-auto mb-7 sm:mb-8 font-normal hero-subheadline-contrast hero-transition-item hero-delay-subheadline px-2 sm:px-0 ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          ArogyaSeva is a production-grade clinical decision support and emergency referral network. 
          Empowering frontline ASHA health workers with autonomous 100% offline WHO IMCI protocols, 
          voice anamnesis across Indian languages, and automated SBAR clinical handover.
        </p>

        {/* Primary & Secondary Action CTAs (Using outer-cont glowing conic gradient button design) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-8 sm:mb-9 px-3 sm:px-0">
          <button
            type="button"
            onClick={onStartIntake}
            className={`outer-cont hero-transition-item hero-delay-cta-1 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <div className="flex">
              <UserCheck className="w-5 h-5 text-[#5bfcc4]" />
              <span className="font-bold">Launch CHW Intake</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenDoctorPortal}
            className={`outer-cont hero-transition-item hero-delay-cta-2 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <div className="flex">
              <Stethoscope className="w-5 h-5 text-[#71a4f0]" />
              <span className="font-bold">Doctor Command Center</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onTriggerEmergencySos}
            className={`outer-cont outer-cont-sos hero-transition-item hero-delay-cta-3 ${
              isLoaded ? "hero-enter-active" : "hero-enter-initial"
            }`}
          >
            <div className="flex">
              <PhoneCall className="w-5 h-5 text-[#ff5e62] animate-pulse" />
              <span className="font-bold">108 SOS Dispatch</span>
            </div>
          </button>
        </div>

        {/* Trust & Protocol Badges (Centered Glass Capsule Pills) */}
        <div
          className={`w-full max-w-4xl mx-auto pt-4 sm:pt-6 pb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold text-[#527086] mb-8 sm:mb-12 hero-transition-item hero-delay-badges px-2 ${
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

          {onReplayIntro && (
            <button
              type="button"
              onClick={onReplayIntro}
              className="glass-pill px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs text-[#0055C7] hover:text-[#091C35] hover:bg-white transition-all cursor-pointer font-bold active:scale-95 border border-[#49B9FF]/40 bg-white/70"
              title="Watch full cinematic grid sequence"
              aria-label="Replay Cinematic Grid Intro Sequence"
            >
              <Play className="w-3.5 h-3.5 text-[#0055C7] fill-[#0055C7]" />
              <span>Replay Cinematic Intro</span>
            </button>
          )}
        </div>

        {/* Centered Hero Visual: Live Clinical Intelligence Telemetry Mockup */}
        <div
          className={`relative w-full max-w-xl sm:max-w-2xl mx-auto hero-transition-item hero-delay-mockup px-1 sm:px-0 ${
            isLoaded ? "hero-enter-active" : "hero-enter-initial"
          }`}
        >
          {/* Subtle Ambient Backlight Frame */}
          <div className="absolute -inset-2 bg-gradient-to-r from-[#00C2D7]/15 via-[#19E6C1]/15 to-[#164E78]/15 rounded-3xl blur-xl opacity-80 pointer-events-none" />

          <div className="glass-panel relative rounded-2xl sm:rounded-3xl border border-white/90 shadow-2xl overflow-hidden text-left">
            {/* Telemetry Header */}
            <div className="bg-gradient-to-r from-[#0B1F3A] via-[#123B63] to-[#164E78] text-white px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-white/20">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C2D7] animate-pulse" />
                <span className="text-[11px] sm:text-xs font-bold tracking-wide uppercase font-mono">
                  Point-of-Care Clinical Intake
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono px-2 sm:px-2.5 py-0.5 rounded-full bg-white/15 text-[#22D3EE] border border-white/20 backdrop-blur-xs truncate max-w-[120px] sm:max-w-none">
                {currentState.name} Sub-Center
              </span>
            </div>

            {/* Patient Case Snapshot */}
            <div className="p-3.5 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 text-xs bg-white/78 backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs sm:text-base font-bold text-[#0A172A] truncate">
                    Sunita Patil, 29Y Female
                  </div>
                  <div className="text-[#527086] text-[11px] sm:text-xs mt-0.5 truncate">
                    {currentState.defaultVillage} • Frontline ASHA: {currentState.ashaWorker}
                  </div>
                </div>
                <span className="glass-badge-amber inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-2xs shrink-0">
                  <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#F59E0B]" />
                  <span>CONSULTATION</span>
                </span>
              </div>

              {/* Vitals Telemetry Grid */}
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#527086] truncate">SpO2 Saturation</span>
                  <span className="text-xs xs:text-sm sm:text-lg font-extrabold text-[#0B1F3A] font-mono my-0.5">94%</span>
                  <span className="text-[9px] sm:text-[10px] text-[#F59E0B] font-semibold truncate">Borderline</span>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#527086] truncate">Pulse Rate</span>
                  <span className="text-xs xs:text-sm sm:text-lg font-extrabold text-[#0B1F3A] font-mono my-0.5">102 bpm</span>
                  <span className="text-[9px] sm:text-[10px] text-[#F59E0B] font-semibold truncate">Tachycardia</span>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-white/90 border border-[rgba(11,31,58,0.08)] shadow-2xs flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#527086] truncate">BP Diastolic</span>
                  <span className="text-xs xs:text-sm sm:text-lg font-extrabold text-[#0B1F3A] font-mono my-0.5">142/92</span>
                  <span className="text-[9px] sm:text-[10px] text-[#F59E0B] font-semibold truncate">Stage 1 HTN</span>
                </div>
              </div>

              {/* SBAR Live Assessment Card - Clinical Glass */}
              <div className="p-3 sm:p-4 rounded-xl bg-[#E8F6FA] border border-[rgba(0,194,215,0.25)] backdrop-blur-xs shadow-2xs">
                <div className="flex items-center gap-1.5 text-[#0B1F3A] font-bold text-xs mb-1">
                  <FileText className="w-4 h-4 text-[#00C2D7]" />
                  <span>WHO IMCI Clinical Impression</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#527086] leading-relaxed">
                  Persistent maternal fever (3 days) with tachycardia and elevated blood pressure. Recommended priority telemedicine consult or sub-district referral.
                </p>
              </div>

              {/* Recommended Referral Routing */}
              <div className="pt-2.5 sm:pt-3 flex flex-col xs:flex-row xs:items-center justify-between border-t border-[rgba(11,31,58,0.08)] gap-2">
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#527086] truncate">
                  <Activity className="w-4 h-4 text-[#19E6C1] shrink-0" />
                  <span className="truncate">Nearest: <strong className="text-[#0B1F3A]">Sub-District Hospital</strong> (4.2 km • 14 min)</span>
                </div>
                <button
                  type="button"
                  onClick={onStartIntake}
                  className="text-xs font-bold text-[#00C2D7] hover:text-[#0B1F3A] flex items-center gap-1 cursor-pointer transition-colors group shrink-0 self-end xs:self-auto"
                >
                  <span>Test Protocol</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Micro-Badge - Elevated Glass Surface */}
          <div className="absolute -bottom-3 left-2 sm:-left-4 lg:-left-6 glass-level-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-white/90 hidden sm:flex items-center gap-2.5 z-20">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#DDFBF5] border border-[rgba(25,230,193,0.3)] flex items-center justify-center text-[#065F53] shadow-2xs shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#19E6C1]" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0B1F3A]">Zero Cloud Dependency</div>
              <div className="text-[10px] text-[#527086]">On-Device Inference & Local IndexedDB</div>
            </div>
          </div>

          {/* Dynamic DNA Helix Background Indicator Badge */}
          <div className="absolute -bottom-3 right-2 sm:-right-4 lg:-right-6 glass-level-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-white/90 hidden sm:flex items-center gap-2.5 z-20">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-50/90 border border-cyan-300/40 flex items-center justify-center text-[#00C2D7] shadow-2xs shrink-0">
              <Dna className="w-4 h-4 text-[#00C2D7] animate-pulse" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                <span>Moving DNA Helix</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#19E6C1] animate-ping" />
              </div>
              <div className="text-[10px] text-[#527086]">Live Interactive 3D Genome Mesh</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
