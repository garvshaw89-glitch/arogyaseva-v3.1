import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Does ArogyaSeva work when there is completely zero internet connectivity?",
      a: "Yes. The entire WHO IMCI decision engine, vital sign risk calculation, speech recognition fallback, and case generation run 100% locally on the device. Data is securely persisted in local browser storage (IndexedDB) and queued for automatic transmission when cellular coverage is restored.",
    },
    {
      q: "How are 22 Indian regional languages handled during patient anamnesis?",
      a: "ArogyaSeva includes built-in multilingual terminology dictionaries and speech-to-text models configured for all 22 official languages recognized by the Constitution of India, allowing ASHA workers to communicate with patients in their native mother tongue.",
    },
    {
      q: "How does the Doctor Hospital Command Center receive referral cases?",
      a: "Doctors can review incoming cases in real time, inspect automated SBAR summaries, examine vital sign trends, approve or escalate referrals, write digital prescriptions, and download standardized clinical PDF slips.",
    },
    {
      q: "Can this system integrate with the Government 108 Ambulance Dispatch system?",
      a: "Yes. The Emergency Referral module maps live GPS coordinates, calculates true road travel distances, and formats dispatch messages compatible with State Emergency Medical Response Service (EMRS 108/102) dispatch protocols.",
    },
  ];

  return (
    <section className="w-full py-16 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="container-constrained max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-[#123B78] uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Clinical & Operational Clarity
          </h2>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold text-sm sm:text-base text-[#0F172A] hover:text-[#123B78] bg-white transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#2563EB] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
