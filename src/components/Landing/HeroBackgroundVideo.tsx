import React, { useEffect, useRef, useState } from "react";

interface HeroBackgroundVideoProps {
  className?: string;
}

/**
 * HeroBackgroundVideo
 *
 * Dedicated component for the ArogyaSeva Hero section background video.
 * - Stacks at z-index: 0 with pointer-events: none (strictly behind all content).
 * - Autoplay, muted, loop, playsInline, preload="auto", aria-hidden="true".
 * - Fallback: White/light-blue gradient with subtle dotted pattern if video fails or reduced motion is active.
 * - Subtle overlay (z-index: 1) maintains high clinical contrast while leaving perimeter network animation vivid.
 */
export const HeroBackgroundVideo: React.FC<HeroBackgroundVideoProps> = ({ className = "" }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
          STEP 11 — STATIC FALLBACK SYSTEM
          Cool white / soft blue gradient + subtle dotted pattern
          Always present underneath (z-index -1 relative to video)
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
          STEP 5 & 6 — HERO VIDEO ELEMENT (z-index: 0)
          No display:none, no visibility:hidden, no opacity:0 under normal conditions
          ===================================================================== */}
      {!prefersReducedMotion && !hasError && (
        <video
          ref={videoRef}
          className={`arogyaseva-hero-video ${className}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          poster="/assets/arogyaseva-network-poster.webp"
        >
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
          STEP 10 — SUBTLE OVERLAY (z-index: 1)
          Maintains pristine text contrast while leaving the network animation
          vivid along the perimeter.
          ===================================================================== */}
      <div className="arogyaseva-hero-overlay" />

      {/* Central soft vignette protecting headline & logo */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 36%, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.40) 50%, transparent 100%)",
        }}
      />
    </>
  );
};
