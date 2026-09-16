import React from "react";
import { BioMatrix3D } from "./BioMatrix3D";
import { RiskLevel, SupportedLanguage } from "../../types";
import {
  Activity,
  ShieldCheck,
  Radio,
  Wifi,
  Sparkles,
  Zap,
  ArrowRight,
  HeartPulse,
  Globe2,
  Stethoscope
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface CinematicHeroProps {
  currentRisk?: RiskLevel;
  onQuickStart: () => void;
  onExploreDoctorPortal: () => void;
  language: SupportedLanguage;
  isOffline: boolean;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  currentRisk = "ROUTINE",
  onQuickStart,
  onExploreDoctorPortal,
  language,
  isOffline,
}) => {
  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl">
      {/* Background Cyber Grid & Ambient Radial Glows */}
      <div className="absolute inset-0 bg-cyber-grid-dark opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 radial-glow-cyan pointer-events-none opacity-60" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 radial-glow-blue pointer-events-none opacity-50" />

      {/* Top HUD Telemetry Ribbon */}
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Radio className="w-3.5 h-3.5 animate-pulse shrink-0" />
            <span className="font-semibold uppercase tracking-wider truncate">ArogyaSeva Telemetry</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">
            NODE: <span className="text-white font-semibold">ASHA-RAMPUR-04</span>
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-slate-300 font-medium text-[10px] sm:text-xs">
              {isOffline ? "OFFLINE CACHE" : "CLINICAL PROTOCOL: ACTIVE"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400 hidden xs:flex">
            <Globe2 className="w-3 h-3 text-cyan-400 shrink-0" />
            <span>24ms</span>
          </div>
        </div>
      </div>

      {/* Main Hero Content & 3D Interactive Centerpiece */}
      <div className="relative p-4 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
        {/* Left Column: Vision, Headline & Action */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[11px] sm:text-xs font-semibold backdrop-blur-xs shadow-xs max-w-full truncate">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
            <span className="truncate">AI-Powered Frontline Triage & Referral Mesh</span>
            <span className="bg-cyan-500/20 text-cyan-200 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0">
              v2.5
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
            Bridging Rural Villages to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Critical Medical Care.
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-xl font-normal">
            Equipping Community Health Workers with voice-guided triage, WHO ETAT emergency protocols, and instant digital SBAR referral handovers to District Hospitals.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <button
              id="hero-quick-start-btn"
              onClick={() => {
                playHapticSound("click");
                onQuickStart();
              }}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-white shrink-0" />
              <span>Start Patient Intake</span>
              <ArrowRight className="w-4 h-4 text-cyan-100 shrink-0" />
            </button>

            <button
              id="hero-doctor-portal-btn"
              onClick={() => {
                playHapticSound("click");
                onExploreDoctorPortal();
              }}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs sm:text-sm border border-slate-700 backdrop-blur-xs flex items-center justify-center gap-2 transition-all hover:border-slate-500 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Doctor Command Center</span>
            </button>
          </div>

          {/* Micro Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 sm:pt-3 border-t border-slate-800/80 text-[11px] sm:text-xs">
            <div>
              <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-mono block">Zero Signal</span>
              <span className="font-bold text-white text-xs sm:text-sm">100% Offline</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-mono block">Dialect AI</span>
              <span className="font-bold text-white text-xs sm:text-sm">6 Languages</span>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] sm:text-[10px] uppercase font-mono block">Triage Speed</span>
              <span className="font-bold text-white text-xs sm:text-sm">&lt; 90 Sec</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Holographic Bio-Matrix */}
        <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
          <div className="w-full h-52 sm:h-72 lg:h-80 relative rounded-2xl border border-slate-800/80 bg-slate-950/60 backdrop-blur-sm overflow-hidden shadow-inner">
            <BioMatrix3D riskLevel={currentRisk} className="w-full h-full" interactive={true} />
            <div className="absolute top-3 right-3 text-right pointer-events-none">
              <span className="text-[10px] font-mono text-cyan-400/80 block uppercase tracking-widest">
                INTERACTIVE BIO-CORE
              </span>
              <span className="text-[9px] text-slate-500">Drag / Hover to Rotate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
