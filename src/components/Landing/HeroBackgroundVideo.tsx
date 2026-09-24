import React, { useEffect, useRef, useState } from "react";
import { MovingDnaCanvas } from "../Common/MovingDnaCanvas";
import { Dna, Sparkles, Sliders } from "lucide-react";

interface HeroBackgroundVideoProps {
  className?: string;
  speed?: number;
  interactive?: boolean;
}

/**
 * HeroBackgroundVideo
 *
 * Dedicated component for the ArogyaSeva Hero section background effect.
 * Incorporates:
 * 1. Interactive 3D Canvas Moving DNA Double Helix with glowing nucleotides & base-pair rungs.
 * 2. DNA motion background video with graceful multi-source fallback.
 * 3. Clinical glassmorphic gradient overlays ensuring optimal text readability.
 * 4. Ambient molecular particles drifting with physics-based Brownian motion.
 */
export const HeroBackgroundVideo: React.FC<HeroBackgroundVideoProps> = ({
  className = "",
  speed = 1,
  interactive = true,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dnaSpeedMultiplier, setDnaSpeedMultiplier] = useState(speed);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    // Accessibility check: prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
    }
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    motionQuery.addEventListener?.("change", handleMotionChange);

    return () => {
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion) return;

    // Explicit DOM properties required by modern browsers to satisfy autoplay policy
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const attemptPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy prevented playback, poster/fallback remains visible
        });
      }
    };

    attemptPlay();

    const handleCanPlay = () => attemptPlay();
    const handleError = () => {
      setHasError(true);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("error", handleError);
    };
  }, [prefersReducedMotion]);

  return (
    <>
      {/* =====================================================================
          1. STATIC FALLBACK & AMBIENT CLINICAL GRADIENT
          Always present underneath (z-index -1 relative to canvas/video)
          ===================================================================== */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background: "linear-gradient(180deg, #F4FAFC 0%, #E8F6FA 40%, #F4FAFC 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none -z-10"
        style={{
          backgroundImage: `radial-gradient(#78909C 1px, transparent 1px), radial-gradient(#78909C 1px, #F4FAFC 1px)`,
          backgroundSize: "36px 36px",
          backgroundPosition: "0 0, 18px 18px",
        }}
      />

      {/* =====================================================================
          2. HERO VIDEO ELEMENT (z-index: 0)
          Plays DNA motion video stream or clinical network loop
          ===================================================================== */}
      {!prefersReducedMotion && !hasError && (
        <video
          ref={videoRef}
          className={`arogyaseva-hero-video opacity-40 mix-blend-multiply ${className}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          poster="/assets/arogyaseva-network-poster.webp"
        >
          <source
            src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dna_video.mp4"
            type="video/mp4"
          />
          <source
            src="/assets/arogyaseva-clinical-network.mp4"
            type="video/mp4"
          />
          <source
            src="/Healthcare_technology_network_background.mp4"
            type="video/mp4"
          />
          <source
            src="/assets/Healthcare_technology_network_background.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* =====================================================================
          3. REAL-TIME 3D MOVING DNA DOUBLE HELIX CANVAS (z-index: 1)
          Interactive 60fps moving DNA with base-pair rungs & floating particles
          ===================================================================== */}
      <MovingDnaCanvas
        className="z-[1]"
        speed={dnaSpeedMultiplier}
        interactive={interactive}
        density="normal"
        colorScheme="clinical"
        showParticles={true}
        showSecondaryHelix={true}
        glowIntensity={1.35}
        opacity={0.92}
      />

      {/* =====================================================================
          4. SUBTLE OVERLAY & VIGNETTE (z-index: 2)
          Maintains pristine clinical text contrast for headline & buttons
          ===================================================================== */}
      <div className="arogyaseva-hero-overlay z-[2]" />

      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 36%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.38) 50%, transparent 100%)",
        }}
      />
    </>
  );
};
