import React from "react";
import { CLINICAL_PRESETS } from "../../data/clinicalPresets";
import { ClinicalPreset, SupportedLanguage } from "../../types";
import { IndianStateData } from "../../data/indianStates";
import { playHapticSound } from "../../utils/audioFeedback";
import { PlusCircle, RotateCcw, MapPin, Check, Zap } from "lucide-react";

interface TacticalScenariosColumnProps {
  onSelectPreset: (preset: ClinicalPreset) => void;
  selectedPresetId?: string;
  language: SupportedLanguage;
  onNewAssessment: () => void;
  currentState: IndianStateData;
  onOpenStateModal: () => void;
}

export const TacticalScenariosColumn: React.FC<TacticalScenariosColumnProps> = ({
  onSelectPreset,
  selectedPresetId,
  language,
  onNewAssessment,
  currentState,
  onOpenStateModal,
}) => {
  return (
    <aside className="border-b lg:border-b-0 lg:border-r border-black/15 bg-[#F2F2EB] flex flex-col h-full shrink-0">
      {/* Column Header */}
      <div className="p-4 border-b border-black/15 flex items-center justify-between bg-white/50">
        <span className="label-mono text-[#1A1A1A]">
          Clinical Scenarios [{CLINICAL_PRESETS.length}]
        </span>
        <button
          type="button"
          onClick={() => {
            playHapticSound("click");
            onNewAssessment();
          }}
          className="text-[10px] font-mono font-bold text-[#E32E10] hover:underline flex items-center gap-1 cursor-pointer"
          title="Reset to blank intake form"
        >
          <RotateCcw className="w-3 h-3" />
          <span>NEW</span>
        </button>
      </div>

      {/* Scenario List (Variation 12 scen-card) */}
      <div className="overflow-y-auto divide-y divide-black/10 flex-1 max-h-[260px] lg:max-h-none">
        {CLINICAL_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isCritical = preset.targetRisk === "URGENT";

          // Generate concise summary tag like in Variation 12
          const vitals = preset.patientData?.vitals;
          const age = preset.patientData?.age;
          const gender = preset.patientData?.gender?.toUpperCase();
          const vitalsTag = vitals?.spo2 && vitals.spo2 < 90
            ? `SpO2 ${vitals.spo2}% | ${age}Y ${gender}`
            : vitals?.bpSystolic && vitals.bpSystolic > 140
            ? `BP ${vitals.bpSystolic}/${vitals.bpDiastolic} | ${age}Y PREG`
            : age && age < 6
            ? `${age}YO CHILD | LETHARGIC`
            : `${age}YO | ${preset.patientData?.symptoms?.[0]?.toUpperCase() || "MILD SYMPTOMS"}`;

          return (
            <button
              key={preset.id}
              type="button"
              id={`scenario-card-${preset.id}`}
              onClick={() => {
                playHapticSound("click");
                onSelectPreset(preset);
              }}
              className={`w-full text-left scen-card transition-all cursor-pointer relative ${
                isCritical ? "urgent" : ""
              } ${
                isSelected
                  ? "bg-white ring-2 ring-inset ring-[#1A1A1A] shadow-xs"
                  : "hover:bg-white/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="label-mono font-bold"
                  style={{ color: isCritical ? "var(--accent)" : "var(--muted)" }}
                >
                  {isCritical ? "CRITICAL" : "ROUTINE"}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-1.5 py-0.2">
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="font-extrabold text-sm sm:text-base text-[#1A1A1A] my-1 leading-snug">
                {language === "hi" ? preset.titleHi : preset.title}
              </div>

              <span className="label-mono text-[#8E8E85] block truncate">
                {vitalsTag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom State Regional Metadata Card */}
      <div className="p-3.5 border-t border-black/15 bg-white/70">
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-mono text-[#8E8E85]">ACTIVE REGION</span>
          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenStateModal();
            }}
            className="text-[10px] font-mono text-[#E32E10] font-bold hover:underline cursor-pointer"
          >
            CHANGE →
          </button>
        </div>
        <div className="font-bold text-xs text-[#1A1A1A] flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#E32E10] shrink-0" />
          <span className="truncate">{currentState.name} ({currentState.shortCode})</span>
        </div>
        <div className="text-[10px] font-mono text-[#8E8E85] mt-0.5 truncate">
          ASHA: {currentState.ashaWorker}
        </div>
      </div>
    </aside>
  );
};
