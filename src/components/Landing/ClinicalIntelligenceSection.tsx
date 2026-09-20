import React from "react";
import {
  BrainCircuit,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";

export const ClinicalIntelligenceSection: React.FC = () => {
  return (
    <section id="clinical-ai" className="w-full py-16 lg:py-24 bg-[#F8FAFC] border-b border-slate-200/80">
      <div className="container-constrained">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Clinical Core Description (6 cols) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-bold text-[#0891B2] uppercase tracking-wider mb-4">
              Deterministic & Auditable
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight mb-5">
              WHO IMCI Protocol Engine With Standardized SBAR Synthesizer
            </h2>

            <p className="text-base text-[#475569] leading-relaxed mb-6">
              Unlike generic generative LLMs that hallucinate medical prescriptions, ArogyaSeva utilizes strict deterministic clinical decision trees certified by the World Health Organization and Indian Council of Medical Research (ICMR).
            </p>

            <div className="space-y-4 w-full">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Zero Hallucination Guarantee</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Critical danger signs (convulsions, lethargy, severe chest indrawing, stridor) trigger non-negotiable urgent escalation paths.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Multi-Factor Physiological Scoring</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Calculates aggregate risk scores (0 to 100) weighting age, pregnancy status, SpO2, blood pressure, and symptom duration.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Automated SBAR Handover</h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Translates fragmented patient observations into Situation, Background, Assessment, and Recommendation for emergency physicians.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: SBAR Interactive Clinical Card (6 cols) */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden text-left">
              {/* Card Header */}
              <div className="bg-[#123B78] px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#06B6D4]" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono">
                    SBAR Clinical Summary Specimen
                  </span>
                </div>
                <span className="text-[11px] font-mono bg-red-500 text-white font-bold px-2 py-0.5 rounded">
                  URGENT TRIAGE
                </span>
              </div>

              {/* SBAR Content Breakdown */}
              <div className="p-6 space-y-4 text-xs">
                {/* Situation */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-[#123B78] uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#123B78] text-white flex items-center justify-center text-[9px]">S</span>
                    Situation
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    26-year-old female, 34 weeks gestation, presenting with severe bilateral temporal headache, visual blurring, and epigastric discomfort for 14 hours.
                  </p>
                </div>

                {/* Background */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-bold text-[#123B78] uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#123B78] text-white flex items-center justify-center text-[9px]">B</span>
                    Background
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Gravida 2, Para 1. Baseline BP recorded at Sub-Center 168/108 mmHg. Trace pedal edema documented. No prior seizure history.
                  </p>
                </div>

                {/* Assessment */}
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
                  <div className="font-bold text-amber-900 uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px]">A</span>
                    Assessment
                  </div>
                  <p className="text-amber-950 font-medium leading-relaxed">
                    Severe Pre-eclampsia with impending eclampsia risk. Clinical score: 88/100. Critical threshold breached.
                  </p>
                </div>

                {/* Recommendation */}
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="font-bold text-[#123B78] uppercase text-[11px] tracking-wide mb-1 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-[9px]">R</span>
                    Recommendation
                  </div>
                  <p className="text-blue-950 font-medium leading-relaxed">
                    Immediate 108 ALS ambulance dispatch to District Women's Hospital. Position in left lateral tilt. Prepare Magnesium Sulfate loading dose per state protocol.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
