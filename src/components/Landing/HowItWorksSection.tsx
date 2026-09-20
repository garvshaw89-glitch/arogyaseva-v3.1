import React from "react";
import { User, Mic, BrainCircuit, Stethoscope, ArrowRight } from "lucide-react";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Patient Arrives",
      subtitle: "Community Health Sub-Center",
      description:
        "The patient presents with acute illness or chronic symptoms. Frontline health worker captures baseline demographics and chief complaints.",
      icon: User,
      color: "#123B78",
      bgColor: "#EFF6FF",
    },
    {
      number: "02",
      title: "Voice / Vitals Intake",
      subtitle: "Hands-Free & Multi-Lingual",
      description:
        "ASHA worker speaks or types in regional language. Pulse, SpO2, blood pressure, temperature, and respiration are recorded into the device.",
      icon: Mic,
      color: "#06B6D4",
      bgColor: "#ECFEFF",
    },
    {
      number: "03",
      title: "Algorithmic Triage",
      subtitle: "WHO IMCI Rules & SBAR",
      description:
        "Deterministic clinical logic stratifies risk (Routine, Consultation, or Urgent), flags WHO danger signs, and synthesizes an SBAR summary.",
      icon: BrainCircuit,
      color: "#2563EB",
      bgColor: "#EFF6FF",
    },
    {
      number: "04",
      title: "Clinical Decision",
      subtitle: "Referral & 108 Emergency",
      description:
        "Immediate referral QR slip generated, nearest capable facility mapped via GPS, and case uploaded to the District Doctor command center.",
      icon: Stethoscope,
      color: "#16A34A",
      bgColor: "#F0FDF4",
    },
  ];

  return (
    <section id="how-it-works" className="w-full py-16 lg:py-24 bg-white border-b border-slate-200/80">
      <div className="container-constrained">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-[#123B78] uppercase tracking-wider mb-3">
            Workflow Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Four Steps from Remote Village to Definitive Care
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed">
            Eliminating delays in emergency obstetric, pediatric, and acute adult triage through standardized clinical handover.
          </p>
        </div>

        {/* Timeline: Horizontal on Desktop, Vertical on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle connecting line across desktop */}
          <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-slate-200 -z-0" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative z-10 flex flex-col items-start text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Step Header with Number & Icon */}
                <div className="flex items-center justify-between w-full mb-5">
                  <span className="text-2xl font-black font-mono tracking-tight text-slate-300">
                    {step.number}
                  </span>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: step.bgColor, color: step.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                  {step.title}
                </h3>
                <div className="text-xs font-semibold text-[#2563EB] mb-3">
                  {step.subtitle}
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
