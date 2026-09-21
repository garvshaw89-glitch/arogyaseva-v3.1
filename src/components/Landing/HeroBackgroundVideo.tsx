import React, { useEffect, useRef, useState } from "react";

interface HeroBackgroundVideoProps {
  className?: string;
}

/**
 * HeroBackgroundVideo
 * 
 * Production-grade background video component for the ArogyaSeva Hero section.
 * - Sits strictly BEHIND hero content (z-0 / z-1) with pointer-events: none.
 * - Autoplays, loops continuously, remains muted, plays inline without controls.
 * - Features center content protection overlays to guarantee 100% text contrast.
 * - Graceful fallback to static gradient/dot-grid & poster on failure, slow data, or reduced-motion.
 */
export const HeroBackgroundVideo: React.FC<HeroBackgroundVideoProps> = ({ className = "" }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dataSaverActive, setDataSaverActive] = useState(false);

  useEffect(() => {
    // 1. Respect accessibility: prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
    }
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener?.("change", handleMotionChange);

    // 2. Detect Save-Data / low-data mode
    const nav = navigator as any;
    if (nav.connection?.saveData) {
      setDataSaverActive(true);
    }

    return () => {
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  // Attempt autoplay when video is ready
  useEffect(() => {
    if (prefersReducedMotion || dataSaverActive || hasError) return;

    const video = videoRef.current;
    if (video) {
      // Ensure muted property is applied at DOM level for strict browser policies
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy prevented playback, keep poster visible gracefully
        });
      }
    }
  }, [prefersReducedMotion, dataSaverActive, hasError]);

  const shouldRenderVideo = !prefersReducedMotion && !dataSaverActive && !hasError;

  return (
    <div
      className={`hero-video-container absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* =====================================================================
          1. STATIC FALLBACK BACKGROUND (Always present underneath)
          White -> very light blue gradient with subtle dotted-grid styling
          ===================================================================== */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EDF4FA] via-[#F8FAFC] to-white" />

      {/* Subtle Clinical Dotted Grid Texture */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(#94A3B8 1px, transparent 1px), radial-gradient(#94A3B8 1px, #F8FAFC 1px)`,
          backgroundSize: "36px 36px",
          backgroundPosition: "0 0, 18px 18px",
        }}
      />

      {/* Diffused Ambient Soft Glows */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[760px] max-w-full h-80 bg-gradient-to-b from-blue-200/30 via-cyan-100/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[920px] max-w-full h-96 bg-gradient-to-t from-blue-100/25 via-slate-100/20 to-transparent rounded-full blur-3xl" />

      {/* =====================================================================
          2. BACKGROUND VIDEO ELEMENT
          Autoplay, loop, muted, playsInline, preload="metadata"
          ===================================================================== */}
      {shouldRenderVideo && (
        <video
          ref={videoRef}
          className={`hero-video absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-out ${
            videoLoaded ? "opacity-65 sm:opacity-75 md:opacity-80" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/assets/arogyaseva-network-poster.webp"
          onCanPlay={() => setVideoLoaded(true)}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => {
            setHasError(true);
            setVideoLoaded(false);
          }}
          tabIndex={-1}
        >
          <source src="/assets/arogyaseva-clinical-network.mp4" type="video/mp4" />
          <source src="/Healthcare_technology_network_background.mp4" type="video/mp4" />
          <source src="/assets/Healthcare_technology_network_background.mp4" type="video/mp4" />
        </video>
      )}

      {/* =====================================================================
          3. CENTER CONTENT PROTECTION & READABILITY OVERLAYS (z-[1])
          Protects "ArogyaSeva" logo, headline, and CTA buttons from high contrast.
          ===================================================================== */}
      {/* 3a. Central Soft Radial Protection Mask directly under text */}
      <div
        className="hero-overlay absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 36%, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.65) 45%, rgba(248, 250, 252, 0.40) 75%, transparent 100%)",
        }}
      />

      {/* 3b. Linear atmospheric gradient recommended by design spec */}
      <div
        className="hero-overlay absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(248,251,255,0.48) 55%, rgba(255,255,255,0.85) 100%)",
        }}
      />

      {/* 3c. Bottom Fade to blend seamlessly into next section */}
      <div className="hero-overlay absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/70 to-transparent" />
    </div>
  );
};
