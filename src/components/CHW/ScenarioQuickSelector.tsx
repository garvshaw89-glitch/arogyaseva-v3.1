import React from "react";
import { CLINICAL_PRESETS } from "../../data/clinicalPresets";
import { ClinicalPreset, SupportedLanguage } from "../../types";
import { Zap, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";

interface ScenarioQuickSelectorProps {
  onSelectPreset: (preset: ClinicalPreset) => void;
  selectedPresetId?: string;
  language: SupportedLanguage;
}

export const ScenarioQuickSelector: React.FC<ScenarioQuickSelectorProps> = ({
  onSelectPreset,
  selectedPresetId,
  language,
}) => {
  return (
    <div id="quick-scenario-selector" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              Verified Clinical Scenarios
              <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                1-Click Voice & Triage Demo
              </span>
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Select a verified rural case to auto-fill voice audio, vitals, and danger triggers
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {CLINICAL_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isUrgent = preset.targetRisk === "URGENT";

          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "bg-blue-50/50 border-blue-600 shadow-md shadow-blue-100 ring-2 ring-blue-500/20"
                  : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isUrgent
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-slate-200/80 text-slate-700 border border-slate-300"
                    }`}
                  >
                    {preset.targetRisk}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 line-clamp-1">
                  {language === "hi" ? preset.titleHi : preset.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {preset.description}
                </div>
              </div>
              <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-blue-700 font-semibold">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Load Scenario</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
