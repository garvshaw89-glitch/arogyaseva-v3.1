import React, { useEffect, useState, useRef } from "react";
import {
  FastForward,
  UserCheck,
  ClipboardList,
  Stethoscope,
  Building2,
  Pill,
  AlertTriangle,
} from "lucide-react";

interface CinematicIntroSequenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CinematicIntroSequence: React.FC<CinematicIntroSequenceProps> = ({
  isOpen,
  onClose,
}) => {
  const [streamsActive, setStreamsActive] = useState(false);
  const [coreActive, setCoreActive] = useState(false);
  const [activeNodes, setActiveNodes] = useState<number[]>([]);
  const [sheenActive, setSheenActive] = useState(false);
  const [brandTitleActive, setBrandTitleActive] = useState(false);
  const [brandTaglineActive, setBrandTaglineActive] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  const finishIntro = () => {
    clearAllTimers();
    setIsFadingOut(true);
    const exitTimer = setTimeout(() => {
      onClose();
    }, 900);
    timersRef.current.push(exitTimer);
  };

  useEffect(() => {
    if (!isOpen) {
      clearAllTimers();
      setIsFadingOut(false);
      setStreamsActive(false);
      setCoreActive(false);
      setActiveNodes([]);
      setSheenActive(false);
      setBrandTitleActive(false);
      setBrandTaglineActive(false);
      return;
    }

    clearAllTimers();
    setIsFadingOut(false);
    setStreamsActive(false);
    setCoreActive(false);
    setActiveNodes([]);
    setSheenActive(false);
    setBrandTitleActive(false);
    setBrandTaglineActive(false);

    // Step 1: 0.5s - Data Streams enter
    timersRef.current.push(
      setTimeout(() => {
        setStreamsActive(true);
      }, 500)
    );

    // Step 2: 1.2s - Central Core emerges
    timersRef.current.push(
      setTimeout(() => {
        setCoreActive(true);
      }, 1200)
    );

    // Step 3: 2.0s - Sequential Materialization of 6 Nodes
    [0, 1, 2, 3, 4, 5].forEach((idx) => {
      timersRef.current.push(
        setTimeout(() => {
          setActiveNodes((prev) => [...prev, idx]);
        }, 2000 + idx * 180)
      );
    });

    // Step 4: 3.2s - Convergence & Sheen Swipe
    timersRef.current.push(
      setTimeout(() => {
        setSheenActive(true);
      }, 3200)
    );

    // Step 5: 3.8s - Typography Reveal (Brand title at 3.8s, Tagline & badge at 4.05s)
    timersRef.current.push(
      setTimeout(() => {
        setBrandTitleActive(true);
      }, 3800)
    );

    timersRef.current.push(
      setTimeout(() => {
        setBrandTaglineActive(true);
      }, 4050)
    );

    // Step 6: 5.2s - Dissolve & Transition to Live Page
    timersRef.current.push(
      setTimeout(() => {
        finishIntro();
      }, 5200)
    );

    return () => clearAllTimers();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="arogyaIntroContainer"
      role="dialog"
      aria-label="ArogyaSeva Clinical Grid Cinematic Opening"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#091C35] overflow-hidden select-none transition-all duration-1000 ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Atmospheric Ambient Glow Spheres (Radial Blue Gradients) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#0055C7] opacity-30 blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#8DCDFF] opacity-25 blur-[90px]" />
        {/* Subtle Grid Matrix Backdrop */}
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#49B9FF_1px,transparent_1px)] [background-size:32px_32px]" />
      </div>

      {/* Skip Cinematic Controls */}
      <div className="absolute top-5 right-6 sm:top-6 sm:right-8 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={finishIntro}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B2548]/80 hover:bg-[#0B2548] border border-[#8DCDFF]/30 text-[#8DCDFF] hover:text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-95 focus-visible:ring-2 focus-visible:ring-[#8DCDFF] focus-visible:outline-none"
          title="Skip cinematic intro"
          aria-label="Skip cinematic opening sequence"
        >
          <span>Skip Sequence</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Telemetry Pulse Layer & SVG Data Streams (0.5s - 3.8s) */}
      <div className="relative w-full max-w-4xl h-[460px] flex items-center justify-center transform scale-[0.72] xs:scale-[0.82] sm:scale-95 md:scale-100 transition-transform">
        {/* SVG Neural & Diagnostic Telemetry Connections */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          fill="none"
          viewBox="0 0 896 460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="streamGrad1" x1="0%" x2="100%" y1="50%" y2="50%">
              <stop offset="0%" stopColor="#49B9FF" stopOpacity="0" />
              <stop offset="50%" stopColor="#49B9FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0B5ED7" stopOpacity="0.2" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Dynamic Incoming Telemetry Streams from Left Edge */}
          <path
            className={`transition-opacity duration-700 ${streamsActive ? "opacity-80" : "opacity-0"}`}
            d="M 0,160 C 180,160 260,230 448,230"
            stroke="url(#streamGrad1)"
            strokeDasharray="8 6"
            strokeWidth="1.8"
          />
          <path
            className={`transition-opacity duration-700 ${streamsActive ? "opacity-80" : "opacity-0"}`}
            d="M 0,230 C 140,230 280,230 448,230"
            stroke="#49B9FF"
            strokeDasharray="400"
            strokeDashoffset={streamsActive ? 0 : 400}
            strokeWidth="2"
            style={{ transition: "stroke-dashoffset 1.6s ease-in-out, opacity 0.7s" }}
          />
          <path
            className={`transition-opacity duration-700 ${streamsActive ? "opacity-80" : "opacity-0"}`}
            d="M 0,300 C 160,300 290,230 448,230"
            stroke="url(#streamGrad1)"
            strokeDasharray="10 8"
            strokeWidth="1.8"
          />

          {/* Radial Convergence Beams (Core to 6 Specialized Nodes) */}
          {/* 1. Patient Node (Top-Left) */}
          <line
            x1="448"
            y1="230"
            x2="260"
            y2="100"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(0) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
          {/* 2. Community Health Worker (Top-Center) */}
          <line
            x1="448"
            y1="230"
            x2="448"
            y2="60"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(1) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
          {/* 3. Doctor Node (Top-Right) */}
          <line
            x1="448"
            y1="230"
            x2="636"
            y2="100"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(2) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
          {/* 4. Hospital Node (Bottom-Right) */}
          <line
            x1="448"
            y1="230"
            x2="656"
            y2="350"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(3) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
          {/* 5. Pharmacy Node (Bottom-Center) */}
          <line
            x1="448"
            y1="230"
            x2="448"
            y2="390"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(4) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
          {/* 6. Emergency Drone Node (Bottom-Left) */}
          <line
            x1="448"
            y1="230"
            x2="240"
            y2="350"
            stroke="#49B9FF"
            strokeDasharray="6 4"
            strokeOpacity={activeNodes.includes(5) ? "0.6" : "0.08"}
            strokeWidth="1.5"
            className="transition-all duration-700"
          />
        </svg>

        {/* Surrounding Specialized Clinical Ecosystem Nodes */}
        {/* Node 1: Patient Node */}
        <div
          id="intro-node-1"
          className={`absolute top-[70px] left-[220px] -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(0) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#8DCDFF] animate-ping" />
          <UserCheck className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            Patient ABHA
          </span>
        </div>

        {/* Node 2: CHW / ASHA Worker Node */}
        <div
          id="intro-node-2"
          className={`absolute top-[30px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(1) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <ClipboardList className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            Community Grid (CHW)
          </span>
        </div>

        {/* Node 3: Doctor Specialist Node */}
        <div
          id="intro-node-3"
          className={`absolute top-[70px] right-[180px] translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(2) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Stethoscope className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            Verified Doctor
          </span>
        </div>

        {/* Node 4: Hospital / ICU Grid */}
        <div
          id="intro-node-4"
          className={`absolute bottom-[70px] right-[160px] translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(3) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Building2 className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            Hospital ICU
          </span>
        </div>

        {/* Node 5: Pharmacy & Supplies */}
        <div
          id="intro-node-5"
          className={`absolute bottom-[25px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(4) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Pill className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            E-Pharmacy Supply
          </span>
        </div>

        {/* Node 6: Emergency Dispatch Unit */}
        <div
          id="intro-node-6"
          className={`absolute bottom-[70px] left-[200px] -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B2548]/90 border border-[#8DCDFF]/30 backdrop-blur-md shadow-lg transition-all duration-700 ${
            activeNodes.includes(5) ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-[#8DCDFF]" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">
            Emergency SOS
          </span>
        </div>

        {/* Central Glassmorphic Core & Concentric Orbits (1.2s - 4.4s) */}
        <div
          id="centralCore"
          className="relative z-10 flex flex-col items-center justify-center transition-all duration-700"
        >
          {/* Concentric Glass Circles with Soft Rotation */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Outer Orbital Pulse Ring */}
            <div className="absolute inset-0 rounded-full bg-[#2C6EE8]/20 blur-sm animate-ping" />

            {/* Outer Rotating Glyphs Ring */}
            <div className="absolute inset-0 rounded-full border border-[#B6C7E8]/20 animate-[spin_24s_linear_infinite] flex items-center justify-between p-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8DCDFF] shadow-[0_0_8px_#49B9FF]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0055C7]" />
            </div>

            {/* Middle Frosted Halo */}
            <div className="absolute inset-3 rounded-full border border-white/10 bg-[#EFF4FF]/5 backdrop-blur-xl animate-[spin_12s_linear_infinite_reverse]" />

            {/* Central Core Emblem Container */}
            <div
              id="emblemContainer"
              className={`relative w-28 h-28 rounded-full bg-[#091C35]/95 border border-[#8DCDFF]/40 backdrop-blur-2xl flex items-center justify-center shadow-[0_12px_40px_rgba(7,26,51,0.7)] transition-all duration-700 overflow-hidden ${
                coreActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            >
              {/* Diagonal Glass Sheen Swipe */}
              <div
                id="sheenLayer"
                className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent transition-transform duration-1000 ease-out pointer-events-none ${
                  sheenActive ? "translate-x-full" : "-translate-x-full"
                }`}
              />

              {/* Sacred Health Core and Connected Intelligence Emblem */}
              <img
                alt="ArogyaSeva Connected Blue Emblem"
                className="w-16 h-16 sm:w-18 sm:h-18 object-contain drop-shadow-[0_0_20px_rgba(73,185,255,0.75)]"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WNVg3yeammv8y48YEwgzNuSB5CfUtQxh1p3jksm1Rs8qJgNBPZam2ILgbb5IHe3Q8yHWeIMXAaHANipU9tP_81a4Jxqqb_kQkIfgDy4H5iSQaO1RBzOcumGs2SexAEd2RGR6Dlf6J6KivC2Kz3zX14yg_K0GTRlReWfMRlLHquc4XPFsAjWllmoJRpps1q9rA-NLyNJbQcVghmh-wQ0YphVXijZ-hhptxvHIYTRweeEmZlc9d1BCGf8w"
                onError={(e) => {
                  // Fallback in case network blocks external Google image
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = document.getElementById("emblem-fallback-icon");
                  if (fallback) fallback.style.display = "block";
                }}
              />
              <div id="emblem-fallback-icon" className="hidden">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0055C7] to-[#00C2D7] flex items-center justify-center text-white font-bold text-xl">
                  AS
                </div>
              </div>
            </div>
          </div>

          {/* Cascading Typography: Brand & Tagline */}
          <div className="mt-4 flex flex-col items-center text-center">
            <div
              id="brandTitleIntro"
              className={`transition-all duration-700 ${
                brandTitleActive
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
            >
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md font-['Outfit',sans-serif]">
                Arogya<span className="text-[#49B9FF]">Seva</span>
              </span>
            </div>

            <div
              id="brandTaglineIntro"
              className={`transition-all duration-700 mt-1.5 ${
                brandTaglineActive
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <span className="text-sm sm:text-base text-[#8DCDFF] tracking-wide font-medium">
                Connecting Care. Improving Lives.
              </span>
            </div>

            <div
              id="telemetryBadgeIntro"
              className={`transition-opacity duration-700 mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B2548]/70 border border-[#8DCDFF]/25 backdrop-blur-sm ${
                brandTaglineActive ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#49B9FF] animate-pulse" />
              <span className="text-[10px] font-bold text-[#B6C7E8] uppercase tracking-wider font-mono">
                Syncing National Bio-Telemetry Grid...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Intro Bottom Live Grid Status Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 text-[#B6C7E8]/70 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-center px-4">
        <span>AIIMS Central Hub</span>
        <span>•</span>
        <span>ABDM Gateway 2.0</span>
        <span>•</span>
        <span>Zero Red Undivided Clinical Safety</span>
      </div>
    </div>
  );
};
