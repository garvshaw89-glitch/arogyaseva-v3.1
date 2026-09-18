import React from "react";
import { CLINICAL_PRESETS } from "../../data/clinicalPresets";
import { ClinicalPreset, SupportedLanguage } from "../../types";
import { Zap, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { Card3DTilt } from "../Common/Card3DTilt";
import { playHapticSound } from "../../utils/audioFeedback";

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
    <div id="quick-scenario-selector" className="bg-[#0c1a2e]/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-5 text-white">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-xs">
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              Verified Clinical Scenarios
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-semibold px-2 py-0.5 rounded-full border border-cyan-800/60 font-sans">
                1-Click Triage Benchmarks
              </span>
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          Select a verified rural case to auto-fill voice audio, telemetry vitals, and danger triggers
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CLINICAL_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const isUrgent = preset.targetRisk === "URGENT";

          return (
            <Card3DTilt
              key={preset.id}
              maxTilt={6}
              className="h-full"
            >
              <button
                type="button"
                id={`preset-btn-${preset.id}`}
                onClick={() => {
                  playHapticSound("click");
                  onSelectPreset(preset);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between h-full cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400"
                    : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider font-mono ${
                        isUrgent
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {preset.targetRisk}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 animate-in zoom-in-50" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-1">
                    {language === "hi" ? preset.titleHi : preset.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-cyan-400 font-semibold font-mono">
                  <Sparkles className="w-3 h-3 text-cyan-300" />
                  <span>Load Preset Data</span>
                </div>
              </button>
            </Card3DTilt>
          );
        })}
      </div>
    </div>
  );
};
