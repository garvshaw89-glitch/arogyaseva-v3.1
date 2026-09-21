import React from "react";
import { WifiOff, Languages, Timer, MapPin } from "lucide-react";

export const PlatformStatistics: React.FC = () => {
  const stats = [
    {
      stat: "100%",
      label: "Offline Ready",
      sublabel: "Autonomous WHO IMCI Engine",
      description: "Operates with zero internet connectivity using local on-device rule evaluation and browser IndexedDB.",
      icon: WifiOff,
      accent: "#2563EB",
      bgLight: "#EFF6FF",
    },
    {
      stat: "22",
      label: "Official Languages",
      sublabel: "Pan-Indian Voice & Anamnesis",
      description: "Frontline ASHA workers can converse naturally via multi-lingual voice transcription and localized terminology.",
      icon: Languages,
      accent: "#06B6D4",
      bgLight: "#ECFEFF",
    },
    {
      stat: "< 90s",
      label: "Clinical Triage",
      sublabel: "Rapid Decision & Risk Scoring",
      description: "Automated danger sign identification, vital sign evaluation, and standardized SBAR handover in under 90 seconds.",
      icon: Timer,
      accent: "#16A34A",
      bgLight: "#F0FDF4",
    },
    {
      stat: "36",
      label: "States & UTs",
      sublabel: "Geo-mapped Referral Hospitals",
      description: "Over 12,000 rural Sub-Centers, Primary Health Centers (PHCs), CHCs, and District Hospitals cataloged with GPS.",
      icon: MapPin,
      accent: "#DC2626",
      bgLight: "#FEF2F2",
    },
  ];

  return (
    <section className="w-full py-12 lg:py-16 bg-gradient-to-b from-white/80 via-slate-50/50 to-white/90 border-b border-slate-200/80 relative">
      <div className="container-constrained">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="glass-badge-blue inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 shadow-2xs">
            Engineered For Bharat's Rural Frontier
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            High-Speed Clinical Telemetry Across Low-Bandwidth Realities
          </p>
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card group relative p-6 rounded-2xl border border-white/90 shadow-sm hover:shadow-lg hover:border-blue-200/80 transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight font-mono">
                      {item.stat}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs border border-white/80"
                      style={{ backgroundColor: item.bgLight, color: item.accent }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                    {item.label}
                  </h3>
                  <div className="text-xs font-semibold text-[#2563EB] mb-2">
                    {item.sublabel}
                  </div>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed mt-2 border-t border-slate-200/50 pt-3">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
