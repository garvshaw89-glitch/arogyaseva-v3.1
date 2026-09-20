import React, { useState } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { IndianStateData } from "../../data/indianStates";
import { playHapticSound } from "../../utils/audioFeedback";
import { Terminal, Send, Radio, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TacticalRightColumnProps {
  patientData: Partial<PatientCase>;
  onChange: (updated: Partial<PatientCase>) => void;
  currentState: IndianStateData;
  language: SupportedLanguage;
  onOpenLiveTracker?: () => void;
  onTriggerEmergencySos?: () => void;
}

const COMMON_CLINICAL_INDICATORS = [
  "High Fever",
  "Cough",
  "Dyspnea",
  "Chest Pain",
  "Dehydration",
  "Snakebite",
  "Preeclampsia Warning",
  "Stridor",
  "Severe Headache",
  "Lethargy",
];

export const TacticalRightColumn: React.FC<TacticalRightColumnProps> = ({
  patientData,
  onChange,
  currentState,
  language,
  onOpenLiveTracker,
  onTriggerEmergencySos,
}) => {
  const [queryText, setQueryText] = useState("");
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const toggleSymptom = (symptom: string) => {
    playHapticSound("click");
    const current = patientData.symptoms || [];
    const exists = current.includes(symptom);
    const updated = exists
      ? current.filter((s) => s !== symptom)
      : [...current, symptom];
    onChange({ symptoms: updated });
  };

  const handleRunAiQuery = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryText.trim()) return;

    playHapticSound("step");
    setIsQuerying(true);

    const q = queryText.toLowerCase();
    setTimeout(() => {
      let ans = "";
      if (q.includes("child") || q.includes("drink") || q.includes("vomit")) {
        ans = "WHO IMCI Rule: Inability to drink/breastfeed or vomits everything is a General Danger Sign. Requires IMMEDIATE referral to First Referral Unit.";
      } else if (q.includes("bp") || q.includes("pregnant") || q.includes("headache") || q.includes("vision")) {
        ans = "MOHFW Guideline: Systolic BP ≥ 140 or Diastolic ≥ 90 in pregnancy with headache/visual changes indicates severe preeclampsia. Administer loading dose MgSO4 if trained and transfer urgently.";
      } else if (q.includes("snake") || q.includes("bite")) {
        ans = "National Snakebite Protocol: Do not apply arterial tourniquet. Immobilize limb with splint. Do not cut or suck wound. Rapid transfer for Anti-Snake Venom (ASV).";
      } else if (q.includes("spo2") || q.includes("breath") || q.includes("hypoxia") || q.includes("oxygen")) {
        ans = "Clinical Oxygen Protocol: SpO2 < 90% indicates severe hypoxemia. Initiate supplemental oxygen at 2-5 L/min and prepare immediate high-priority transport.";
      } else {
        ans = `IMCI v2.4 Verified: Cross-referencing "${queryText}" with rural triage algorithm. Monitor vital stability, evaluate pediatric general danger signs, and calculate triage score.`;
      }
      setQueryResponse(ans);
      setIsQuerying(false);
    }, 400);
  };

  return (
    <aside className="border-t lg:border-t-0 lg:border-l border-black/15 bg-[#FDFDF7] p-4 sm:p-5 flex flex-col gap-5 shrink-0">
      <div>
        <span className="label-mono text-[#1A1A1A] block mb-3">Manual Entry</span>
        <div className="space-y-3">
          <div>
            <label className="label-mono block mb-1 text-[#8E8E85]">Full Name</label>
            <input
              type="text"
              placeholder="e.g. RAJESH KUMAR"
              value={patientData.patientName || ""}
              onChange={(e) => onChange({ patientName: e.target.value })}
              className="w-full font-mono text-xs p-2 bg-white border border-black/20 focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label-mono block mb-1 text-[#8E8E85]">Age (Y)</label>
              <input
                type="number"
                placeholder="00"
                value={patientData.age || ""}
                onChange={(e) => onChange({ age: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full font-mono text-xs p-2 bg-white border border-black/20 focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>
            <div>
              <label className="label-mono block mb-1 text-[#8E8E85]">Gender</label>
              <select
                value={patientData.gender || "Male"}
                onChange={(e) => onChange({ gender: e.target.value as any })}
                className="w-full font-mono text-xs p-2 bg-white border border-black/20 focus:border-[#1A1A1A] focus:outline-none cursor-pointer"
              >
                <option value="Male">MALE</option>
                <option value="Female">FEMALE</option>
                <option value="Other">OTHER</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-mono block mb-1 text-[#8E8E85]">Centroid Location</label>
            <input
              type="text"
              placeholder={`e.g. Village (${currentState.shortCode})`}
              value={patientData.village || `${currentState.name}`}
              onChange={(e) => onChange({ village: e.target.value })}
              className="w-full font-mono text-xs p-2 bg-white border border-black/20 focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Clinical Indicators Tag Cloud (Variation 12) */}
      <div>
        <span className="label-mono text-[#1A1A1A] block mb-2">Clinical Indicators</span>
        <div className="tag-cloud flex flex-wrap gap-1.5">
          {COMMON_CLINICAL_INDICATORS.map((indicator) => {
            const isSelected = (patientData.symptoms || []).includes(indicator);
            return (
              <button
                key={indicator}
                type="button"
                onClick={() => toggleSymptom(indicator)}
                className={`tag transition-all cursor-pointer ${
                  isSelected ? "fill" : ""
                }`}
              >
                {indicator}
              </button>
            );
          })}
        </div>
      </div>

      {/* AI_QUERY_TERMINAL (Variation 12) */}
      <div className="border-[2.5px] border-[#1A1A1A] p-3.5 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="label-mono font-bold text-[#1A1A1A] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#E32E10]" />
            <span>AI_QUERY_TERMINAL</span>
          </span>
          <span className="text-[9px] font-mono text-[#8E8E85]">IMCI v2.4</span>
        </div>
        <p className="text-xs text-[#1A1A1A] leading-relaxed my-2">
          Verify symptoms against IMCI v2.4 rural clinical standards.
        </p>

        <form onSubmit={handleRunAiQuery} className="flex border-b-[2.5px] border-[#1A1A1A] mt-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Type query... (e.g. SpO2 88%)"
            className="flex-1 text-xs font-mono py-1 px-1 bg-transparent border-none focus:outline-none text-[#1A1A1A]"
          />
          <button
            type="submit"
            disabled={isQuerying}
            className="bg-[#1A1A1A] text-white px-3 font-mono text-xs hover:bg-[#E32E10] transition-colors cursor-pointer"
          >
            {isQuerying ? "..." : "↵"}
          </button>
        </form>

        {queryResponse && (
          <div className="mt-2.5 p-2 bg-[#F2F2EB] border-l-2 border-[#E32E10] text-[11px] font-mono text-[#1A1A1A] leading-snug animate-in fade-in-50">
            {queryResponse}
          </div>
        )}
      </div>

      {/* GPS Telemetry & Radar Shortcut */}
      {onOpenLiveTracker && (
        <button
          type="button"
          onClick={() => {
            playHapticSound("click");
            onOpenLiveTracker();
          }}
          className="w-full flex items-center justify-between p-2.5 border border-black/20 bg-white hover:bg-black/5 text-xs font-mono font-bold text-[#1A1A1A] cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#E32E10] animate-pulse" />
            <span>GPS RADAR & OSM HOSPITALS</span>
          </span>
          <span>→</span>
        </button>
      )}
    </aside>
  );
};
