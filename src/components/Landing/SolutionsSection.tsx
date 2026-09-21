import React from "react";
import {
  WifiOff,
  BrainCircuit,
  Mic,
  PhoneCall,
  Stethoscope,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

interface SolutionsSectionProps {
  onStartIntake: () => void;
  onOpenDoctorPortal: () => void;
  onOpenEmergency: () => void;
}

export const SolutionsSection: React.FC<SolutionsSectionProps> = ({
  onStartIntake,
  onOpenDoctorPortal,
  onOpenEmergency,
}) => {
  const solutions = [
    {
      id: "triage",
      title: "Offline Clinical Triage",
      description:
        "Deterministic WHO Integrated Management of Childhood & Adult Illness (IMCI) algorithmic trees executed directly on the frontline worker's handset without data latency.",
      icon: WifiOff,
      badge: "Zero-Latency",
      actionText: "Launch Triage Engine",
      action: onStartIntake,
    },
    {
      id: "ai-diagnosis",
      title: "AI-Assisted SBAR Diagnosis",
      description:
        "Standardized Situation, Background, Assessment, and Recommendation clinical summaries synthesized automatically from symptoms, duration, and biometric vitals.",
      icon: BrainCircuit,
      badge: "ICMR Standard",
      actionText: "Explore SBAR Logic",
      action: onStartIntake,
    },
    {
      id: "voice-intake",
      title: "Voice-Based Patient Intake",
      description:
        "Hands-free voice transcription supporting 22 Indian constitutional languages with dialect normalization, noise reduction, and visual audio waveforms.",
      icon: Mic,
      badge: "22 Languages",
      actionText: "Test Speech Intake",
      action: onStartIntake,
    },
    {
      id: "emergency-referral",
      title: "108 Emergency Referral Routing",
      description:
        "One-touch emergency ambulance dispatch with priority categorization, real-time GPS hospital matching, distance calculation, and emergency bed confirmation.",
      icon: PhoneCall,
      badge: "Live Dispatch",
      actionText: "108 Emergency View",
      action: onOpenEmergency,
    },
    {
      id: "doctor-consult",
      title: "Doctor Tele-Consultation",
      description:
        "Medical Officer command center for triage queue management, clinical note authoring, prescription dispatch, and printable clinical referral slips with secure QR codes.",
      icon: Stethoscope,
      badge: "District Portal",
      actionText: "Open Doctor Queue",
      action: onOpenDoctorPortal,
    },
    {
      id: "patient-records",
      title: "Longitudinal Patient Records",
      description:
        "Encrypted local-first case storage with background automatic synchronization when cellular 4G/5G signal is restored, ensuring complete auditability.",
      icon: ClipboardList,
      badge: "ABDM Aligned",
      actionText: "View Case Storage",
      action: onOpenDoctorPortal,
    },
  ];

  return (
    <section id="solutions" className="w-full py-16 lg:py-24 bg-[#F4FAFC] border-b border-[rgba(11,31,58,0.08)] relative">
      <div className="container-constrained">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <span className="glass-badge-cyan inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            Integrated Platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight mb-4">
            Healthcare Intelligence at the Point of Care
          </h2>
          <p className="text-base text-[#527086] leading-relaxed">
            A comprehensive, modular clinical stack bridging the critical gap between remote rural sub-centers and district medical facilities.
          </p>
        </div>

        {/* 6 Solutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="glass-card group relative rounded-2xl p-7 border border-[rgba(11,31,58,0.08)] shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F6FA] text-[#164E78] border border-[rgba(0,194,215,0.25)] flex items-center justify-center group-hover:bg-[#0B1F3A] group-hover:text-[#00C2D7] transition-all duration-300 shadow-2xs">
                      <Icon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="glass-pill text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-[#527086] font-mono shadow-2xs">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0B1F3A] mb-2.5 group-hover:text-[#164E78] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#527086] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[rgba(11,31,58,0.06)]">
                  <button
                    type="button"
                    onClick={item.action}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] group-hover:text-[#00C2D7] cursor-pointer transition-colors"
                  >
                    <span>{item.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
