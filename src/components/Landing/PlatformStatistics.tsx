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
      accent: "#00C2D7",
      bgLight: "#E8F6FA",
    },
    {
      stat: "22",
      label: "Official Languages",
      sublabel: "Pan-Indian Voice & Anamnesis",
      description: "Frontline ASHA workers can converse naturally via multi-lingual voice transcription and localized terminology.",
      icon: Languages,
      accent: "#164E78",
      bgLight: "#E8F6FA",
    },
    {
      stat: "< 90s",
      label: "Clinical Triage",
      sublabel: "Rapid Decision & Risk Scoring",
      description: "Automated danger sign identification, vital sign evaluation, and standardized SBAR handover in under 90 seconds.",
      icon: Timer,
      accent: "#19E6C1",
      bgLight: "#DDFBF5",
    },
    {
      stat: "36",
      label: "States & UTs",
      sublabel: "Geo-mapped Referral Hospitals",
      description: "Over 12,000 rural Sub-Centers, Primary Health Centers (PHCs), CHCs, and District Hospitals cataloged with GPS.",
      icon: MapPin,
      accent: "#123B63",
      bgLight: "#E8F6FA",
    },
  ];

  return (
    <section className="w-full py-12 lg:py-16 bg-[#F4FAFC] border-b border-[rgba(11,31,58,0.08)] relative">
      <div className="container-constrained">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="glass-badge-cyan inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-2xs">
            Engineered For Bharat's Rural Frontier
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
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
                className="glass-card group relative p-6 rounded-2xl border border-[rgba(11,31,58,0.08)] shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between text-left"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-[#0B1F3A] tracking-tight font-mono">
                      {item.stat}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs border border-white/80"
                      style={{ backgroundColor: item.bgLight, color: item.accent }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[#0B1F3A] leading-snug">
                    {item.label}
                  </h3>
                  <div className="text-xs font-semibold text-[#164E78] mb-2">
                    {item.sublabel}
                  </div>
                </div>

                <p className="text-xs text-[#527086] leading-relaxed mt-2 border-t border-[rgba(11,31,58,0.06)] pt-3">
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
