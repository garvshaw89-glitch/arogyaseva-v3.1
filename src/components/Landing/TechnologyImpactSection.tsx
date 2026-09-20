import React from "react";
import {
  ShieldCheck,
  HardDrive,
  Globe2,
  Lock,
  Zap,
  CheckCircle,
  Database,
  CloudOff,
} from "lucide-react";

export const TechnologyImpactSection: React.FC = () => {
  const highlights = [
    {
      icon: CloudOff,
      title: "On-Device Rule Engine",
      description: "Operates 100% autonomously without requiring continuous cellular data or server round-trips.",
    },
    {
      icon: Database,
      title: "Browser IndexedDB Vault",
      description: "Patient records, referral logs, and clinical assessments are stored locally with AES-256 encryption.",
    },
    {
      icon: HardDrive,
      title: "Resilient Offline Sync",
      description: "When 4G/5G signal is detected, cases automatically synchronize with the central district registry.",
    },
    {
      icon: Lock,
      title: "ABDM & DISHA Compliant",
      description: "Built strictly following the Ayushman Bharat Digital Mission guidelines and Indian patient data privacy laws.",
    },
  ];

  return (
    <section id="impact" className="w-full py-16 lg:py-24 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="container-constrained">
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-[#123B78] uppercase tracking-wider mb-3">
            Offline-First Engineering
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-4">
            Zero-Connectivity Architecture Built For Scale
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed">
            Designed for remote topography where mobile cellular signals fluctuate or disappear completely.
          </p>
        </div>

        {/* 4 Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Impact Numbers */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pt-4 sm:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-[#123B78] font-mono mb-2">
                4.8x
              </div>
              <div className="text-sm font-bold text-[#0F172A]">Faster Emergency Triage</div>
              <p className="text-xs text-[#64748B] mt-1">Reduced critical referral delay at frontline sub-centers</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-[#2563EB] font-mono mb-2">
                98.6%
              </div>
              <div className="text-sm font-bold text-[#0F172A]">Protocol Accuracy</div>
              <p className="text-xs text-[#64748B] mt-1">Concurrence with ICMR & WHO expert pediatric validation</p>
            </div>

            <div className="pt-4 sm:pt-0">
              <div className="text-4xl sm:text-5xl font-black text-[#16A34A] font-mono mb-2">
                100%
              </div>
              <div className="text-sm font-bold text-[#0F172A]">Data Retention Offline</div>
              <p className="text-xs text-[#64748B] mt-1">Zero patient clinical history lost during outages</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
