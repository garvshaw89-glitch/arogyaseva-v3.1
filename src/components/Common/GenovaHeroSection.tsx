import React, { useState } from "react";
import {
  Dna,
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  Languages,
  Activity,
  Radio,
  MapPin,
  Clock,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";
import { IndianStateData } from "../../data/indianStates";

interface GenovaHeroSectionProps {
  onStartIntake: () => void;
  onOpenDoctorPortal: () => void;
  onOpenStateModal: () => void;
  currentState: IndianStateData;
  isOffline: boolean;
  onTriggerEmergencySos?: () => void;
}

export const GenovaHeroSection: React.FC<GenovaHeroSectionProps> = ({
  onStartIntake,
  onOpenDoctorPortal,
  onOpenStateModal,
  currentState,
  isOffline,
  onTriggerEmergencySos,
}) => {
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <section className="relative w-full overflow-hidden bg-[#f8fafc] border-b border-[rgba(0,0,0,0.08)] mb-6">
      {/* Background Video (Specification: Absolute-positioned covering screen, object-fit: cover, z-index: -2) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          muted={isMuted}
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-opacity duration-1000"
          style={{ minHeight: "100%", minWidth: "100%" }}
        >
          <source
            src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dna_video.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>

        {/* Video Overlay (Specification: Linear gradient 90deg, 0% rgba(240,248,255,1), 40% rgba(240,248,255,0.85), 100% rgba(240,248,255,0)) */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.92) 42%, rgba(248, 250, 252, 0.4) 75%, rgba(248, 250, 252, 0.15) 100%)",
          }}
        />

        {/* Subtle grid pattern overlay for precision scientific feel */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#0a192f 1px, transparent 1px), linear-gradient(90deg, #0a192f 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Hero Content Container (Specification: Max-width 800px, padding 0 4rem, margin-top 2rem) */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-16 pt-8 pb-10 sm:pt-12 sm:pb-14 flex flex-col justify-between min-h-[500px] lg:min-h-[560px]">
        {/* Upper Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[rgba(0,0,0,0.06)] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#0369a1]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#1a56db]" />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              ArogyaSeva Clinical Decision Mesh
            </span>
            <span className="text-[#8E8E85]">•</span>
            <button
              type="button"
              onClick={onOpenStateModal}
              className="text-[#0a192f] hover:text-[#1a56db] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-[#1a56db]" />
              <span>{currentState.name} ({currentState.shortCode})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[#475569]">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-medium text-[#0a192f]">
                {isOffline ? "OFFLINE AUTONOMOUS CACHE" : "HEALTHCARE PROTOCOL: ONLINE"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#475569] transition-colors cursor-pointer"
              title={isMuted ? "Unmute Background Sound" : "Mute Background Sound"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#1a56db]" />}
            </button>
          </div>
        </div>

        {/* Hero Main Content (Left-Aligned) */}
        <div className="max-w-[820px] my-auto">
          {/* Chip/Badge (Specification: "INNOVATING LIFE SCIENCES" with a small blue dot indicator 6px by 6px) */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 shadow-xs border border-[#bae6fd]/50 transition-transform duration-300 hover:scale-[1.02]"
            style={{
              backgroundColor: "#e0f2fe",
              color: "#0369a1",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            <span
              className="w-[6px] h-[6px] rounded-full bg-[#1a56db] shrink-0"
              style={{
                boxShadow: "0 0 8px #1a56db",
              }}
            />
            <span>INNOVATING FRONTLINE HEALTHCARE</span>
          </div>

          {/* Headline (Specification: "Advancing science.\nTransforming lives." with "Transforming" in #1a56db) */}
          <h1
            className="font-bold tracking-tight text-[#0a192f] mb-6"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            Advancing science.
            <br />
            <span
              style={{
                color: "#1a56db",
                position: "relative",
              }}
            >
              Transforming
            </span>{" "}
            lives.
          </h1>

          {/* Hero Description (Specification: 1.15rem (18.4px), Font Weight: 400, Line Height: 1.6, Color: Text Secondary #475569) */}
          <p
            className="max-w-[680px] mb-9 text-[#475569] font-normal leading-relaxed"
            style={{
              fontSize: "clamp(1rem, 1.2vw, 1.15rem)",
              lineHeight: 1.6,
            }}
          >
            ArogyaSeva is at the forefront of frontline biotechnology and clinical intelligence, developing innovative offline-first triage, WHO IMCI diagnostic decision support, and instant 108 emergency referral networks for a healthier tomorrow across all Indian states.
          </p>

          {/* Hero Actions (Specification: Explore Our Solutions primary button, Watch Our Story secondary glassmorphism button) */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            {/* Primary Button */}
            <button
              id="hero-explore-solutions-btn"
              type="button"
              onClick={() => {
                playHapticSound("success");
                onStartIntake();
                const el = document.getElementById("chw-workflow-stepper");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              style={{
                backgroundColor: "#0c2b64",
                color: "#ffffff",
                padding: "0.75rem 1.6rem",
                borderRadius: "9999px",
                fontSize: "0.95rem",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#133a80";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0c2b64";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Explore Our Solutions</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary Button (Specification: Glassmorphism with rgba(255,255,255,0.4), backdrop blur 8px, border rgba(0,0,0,0.1), circled play icon) */}
            <button
              id="hero-watch-story-btn"
              type="button"
              onClick={() => {
                playHapticSound("click");
                setVideoModalOpen(true);
              }}
              className="group inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.65)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(0, 0, 0, 0.12)",
                color: "#0a192f",
                padding: "0.75rem 1.6rem",
                borderRadius: "9999px",
                fontSize: "0.95rem",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                e.currentTarget.style.borderColor = "rgba(26, 86, 219, 0.3)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.65)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="w-5 h-5 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] transition-transform group-hover:scale-110">
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              </div>
              <span>Watch Our Story</span>
            </button>

            {/* Quick Emergency SOS shortcut */}
            {onTriggerEmergencySos && (
              <button
                type="button"
                onClick={() => {
                  playHapticSound("alert");
                  onTriggerEmergencySos();
                }}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer ml-auto sm:ml-0"
                style={{
                  backgroundColor: "#fee2e2",
                  border: "1px solid #fca5a5",
                  color: "#b91c1c",
                  padding: "0.75rem 1.3rem",
                  borderRadius: "9999px",
                  fontSize: "0.85rem",
                  gap: "0.4rem",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span className="font-bold">108 SOS Dispatch</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Trust & Capability Badges Bar */}
        <div className="pt-6 border-t border-[rgba(0,0,0,0.08)] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-[#475569]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-[#0a192f] text-[13px]">100% Offline Ready</span>
              <span className="text-[11px] text-[#475569]">Autonomous WHO IMCI Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-[#0a192f] text-[13px]">22 Official Languages</span>
              <span className="text-[11px] text-[#475569]">Pan-Indian Voice & Anamnesis</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-[#0a192f] text-[13px]">&lt; 90s Clinical Triage</span>
              <span className="text-[11px] text-[#475569]">Rapid Decision & Risk Scoring</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#1a56db] shrink-0">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <span className="block font-bold text-[#0a192f] text-[13px]">All 36 States & UTs</span>
              <span className="text-[11px] text-[#475569]">Geo-mapped Referral Hospitals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal ("Watch Our Story") */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0a192f] rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#07111F] text-white">
              <div className="flex items-center gap-2">
                <Dna className="w-5 h-5 text-[#1a56db]" />
                <span className="font-bold text-sm tracking-wide">
                  Genova Biosciences & ArogyaSeva Clinical Architecture
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black">
              <video
                autoPlay
                controls
                playsInline
                className="w-full h-full object-contain"
              >
                <source
                  src="https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dna_video.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#0a192f] text-slate-300 text-xs flex flex-wrap items-center justify-between gap-2">
              <p>
                Demonstrating next-generation molecular and clinical decision intelligence for rural frontline primary care.
              </p>
              <button
                type="button"
                onClick={() => {
                  setVideoModalOpen(false);
                  onStartIntake();
                }}
                className="px-4 py-2 rounded-full bg-[#1a56db] hover:bg-blue-600 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Launch Triage Workstation →
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
