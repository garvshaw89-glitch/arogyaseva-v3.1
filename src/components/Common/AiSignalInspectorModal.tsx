import React, { useState, useEffect } from "react";
import { TriagePayload, TriageSignalResult } from "../../types";
import { callTriageApi } from "../../utils/triageSignal";
import { AiTriageSignalBadge } from "./AiTriageSignalBadge";
import {
  X,
  Zap,
  Activity,
  Send,
  Sparkles,
  RotateCcw,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface AiSignalInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPayload?: Partial<TriagePayload>;
}

const SAMPLE_SIGNAL_CASES: { name: string; desc: string; payload: TriagePayload }[] = [
  {
    name: "Acute Coronary Syndrome",
    desc: "45Y Female with chest pain & diaphoresis (user specification)",
    payload: {
      age: 45,
      sex: "female",
      symptoms: "chest pain and sweating",
      vitals: { temp: 37.0, hr: 110, bp_systolic: 110, bp_diastolic: 70, rr: 18, spo2: 96 },
      comorbidities: ["diabetes"],
      onset: "sudden",
      duration_minutes: 30,
    },
  },
  {
    name: "Severe Hypoxic Respiratory Distress",
    desc: "68Y Male with dyspnea & SpO2 88%",
    payload: {
      age: 68,
      sex: "male",
      symptoms: "severe difficulty breathing, inability to finish sentence",
      vitals: { temp: 38.8, hr: 122, bp_systolic: 135, bp_diastolic: 85, rr: 32, spo2: 88 },
      comorbidities: ["COPD", "hypertension"],
      onset: "worsening over 4 hours",
      duration_minutes: 240,
    },
  },
  {
    name: "Maternal Impending Eclampsia",
    desc: "24Y Primigravida 34 weeks, sudden severe headache, BP 165/105",
    payload: {
      age: 24,
      sex: "female",
      symptoms: "sudden severe headache and blurred vision, pregnancy bleeding",
      vitals: { temp: 36.8, hr: 98, bp_systolic: 165, bp_diastolic: 105, rr: 20, spo2: 98 },
      comorbidities: ["gestational_hypertension"],
      onset: "sudden",
      duration_minutes: 60,
    },
  },
  {
    name: "Routine Non-Urgent Presentation",
    desc: "28Y Male with mild cough for 3 days, stable vitals",
    payload: {
      age: 28,
      sex: "male",
      symptoms: "mild dry cough, runny nose, slight fatigue",
      vitals: { temp: 37.1, hr: 74, bp_systolic: 118, bp_diastolic: 76, rr: 16, spo2: 99 },
      comorbidities: [],
      onset: "gradual",
      duration_minutes: 4320,
    },
  },
];

export const AiSignalInspectorModal: React.FC<AiSignalInspectorModalProps> = ({
  isOpen,
  onClose,
  initialPayload,
}) => {
  const [formData, setFormData] = useState<TriagePayload>(
    initialPayload || SAMPLE_SIGNAL_CASES[0].payload
  );
  const [triageResult, setTriageResult] = useState<TriageSignalResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comorbidityInput, setComorbidityInput] = useState(
    (formData.comorbidities || []).join(", ")
  );

  useEffect(() => {
    if (isOpen) {
      handleEvaluate(formData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEvaluate = async (payloadToTest = formData) => {
    setIsLoading(true);
    playHapticSound("step");
    try {
      const res = await callTriageApi(payloadToTest);
      setTriageResult(res);
      playHapticSound("success");
    } catch {
      playHapticSound("alert");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (preset: typeof SAMPLE_SIGNAL_CASES[0]) => {
    setFormData(preset.payload);
    setComorbidityInput((preset.payload.comorbidities || []).join(", "));
    handleEvaluate(preset.payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Signal Triage Engine</h3>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  POST /api/triage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Universal clinical decision signal evaluating symptoms, vital cutoffs, red flags & LLM assist
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Presets Quick Bar */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-2">
              QUICK SIGNAL SCENARIO PRESETS:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {SAMPLE_SIGNAL_CASES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(item)}
                  className="p-2.5 rounded-xl text-left bg-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all text-xs cursor-pointer group"
                >
                  <span className="font-bold text-white block group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 line-clamp-1 block mt-0.5">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form & Live Result Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Input Controls (Left 6 cols) */}
            <div className="lg:col-span-6 space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                SIGNAL PAYLOAD BUILDER
              </span>

              {/* Symptoms */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Symptoms String:
                </label>
                <textarea
                  rows={2}
                  value={formData.symptoms || ""}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="e.g. chest pain and sweating, severe breathlessness..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Age, Sex, Onset */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Age (Years):
                  </label>
                  <input
                    type="number"
                    value={formData.age || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sex:</label>
                  <select
                    value={formData.sex || "unknown"}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="female">female</option>
                    <option value="male">male</option>
                    <option value="other">other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Onset:</label>
                  <input
                    type="text"
                    value={formData.onset || ""}
                    onChange={(e) => setFormData({ ...formData, onset: e.target.value })}
                    placeholder="e.g. sudden"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Vitals Grid */}
              <div>
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Vitals Object:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[9px] text-slate-400 block">SpO2 % (&lt;92)</label>
                    <input
                      type="number"
                      value={formData.vitals?.spo2 ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, spo2: Number(e.target.value) },
                        })
                      }
                      className={`w-full bg-slate-900 border rounded-lg p-1.5 text-center text-white ${
                        (formData.vitals?.spo2 ?? 100) < 92
                          ? "border-red-500 text-red-400 font-bold"
                          : "border-slate-700"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">BP Sys (&lt;90)</label>
                    <input
                      type="number"
                      value={formData.vitals?.bp_systolic ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, bp_systolic: Number(e.target.value) },
                        })
                      }
                      className={`w-full bg-slate-900 border rounded-lg p-1.5 text-center text-white ${
                        (formData.vitals?.bp_systolic ?? 120) < 90
                          ? "border-red-500 text-red-400 font-bold"
                          : "border-slate-700"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">BP Dia</label>
                    <input
                      type="number"
                      value={formData.vitals?.bp_diastolic ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, bp_diastolic: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">HR (&gt;130/&lt;40)</label>
                    <input
                      type="number"
                      value={formData.vitals?.hr ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, hr: Number(e.target.value) },
                        })
                      }
                      className={`w-full bg-slate-900 border rounded-lg p-1.5 text-center text-white ${
                        (formData.vitals?.hr ?? 80) > 130 || (formData.vitals?.hr ?? 80) < 40
                          ? "border-red-500 text-red-400 font-bold"
                          : "border-slate-700"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">RR (&gt;30)</label>
                    <input
                      type="number"
                      value={formData.vitals?.rr ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, rr: Number(e.target.value) },
                        })
                      }
                      className={`w-full bg-slate-900 border rounded-lg p-1.5 text-center text-white ${
                        (formData.vitals?.rr ?? 18) > 30
                          ? "border-red-500 text-red-400 font-bold"
                          : "border-slate-700"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Temp °C</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.vitals?.temp ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vitals: { ...formData.vitals, temp: Number(e.target.value) },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-center text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Comorbidities */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Comorbidities (comma separated):
                </label>
                <input
                  type="text"
                  value={comorbidityInput}
                  onChange={(e) => {
                    setComorbidityInput(e.target.value);
                    const list = e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setFormData({ ...formData, comorbidities: list });
                  }}
                  placeholder="diabetes, hypertension..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={() => handleEvaluate()}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
              >
                {isLoading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Evaluating AI Triage Signal...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send POST /api/triage Signal</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Response Result (Right 6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                LIVE API SIGNAL RESPONSE
              </span>

              {triageResult ? (
                <AiTriageSignalBadge
                  triageSignal={triageResult}
                  payload={formData}
                  onRefresh={() => handleEvaluate()}
                  isLoading={isLoading}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-2xl">
                  Press Send or choose a Preset to test the API signal.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
