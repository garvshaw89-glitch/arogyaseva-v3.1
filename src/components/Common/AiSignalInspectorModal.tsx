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
  const [activeEndpoint, setActiveEndpoint] = useState<string>("/api/triage.js");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [comorbidityInput, setComorbidityInput] = useState(
    (formData.comorbidities || []).join(", ")
  );

  useEffect(() => {
    if (isOpen) {
      handleEvaluate(formData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEvaluate = async (payloadToTest = formData, endpointToUse = activeEndpoint) => {
    setIsLoading(true);
    playHapticSound("step");
    const startTime = performance.now();
    try {
      const res = await callTriageApi(payloadToTest, endpointToUse);
      const elapsed = Math.round(performance.now() - startTime);
      setLatencyMs(elapsed);
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

  const copyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Signal Triage Engine Inspector</h3>
                {/* Active Endpoint Pill */}
                <div className="flex items-center gap-1 bg-slate-900 border border-cyan-800/80 rounded-lg px-2 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">
                    POST {activeEndpoint}
                  </span>
                </div>
                {latencyMs !== null && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                    {latencyMs}ms
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Direct integration with triage.js API endpoint evaluating symptoms, vital thresholds, red flags & clinical advice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Endpoint Selector Tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
              <button
                onClick={() => {
                  setActiveEndpoint("/api/triage.js");
                  handleEvaluate(formData, "/api/triage.js");
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  activeEndpoint === "/api/triage.js"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                /api/triage.js
              </button>
              <button
                onClick={() => {
                  setActiveEndpoint("/api/triage");
                  handleEvaluate(formData, "/api/triage");
                }}
                className={`px-2 py-1 rounded-lg transition-all ${
                  activeEndpoint === "/api/triage"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                /api/triage
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEvaluate(formData, activeEndpoint)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Evaluating {activeEndpoint}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Evaluate via {activeEndpoint}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={copyPayload}
                  title="Copy Request Payload"
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                >
                  {copied ? "Copied!" : "Copy JSON"}
                </button>
              </div>
            </div>

            {/* Live Response Result (Right 6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  LIVE CLINICAL SIGNAL & ADVICE STREAM
                </span>
                {triageResult && (
                  <span className="text-[10px] font-mono text-slate-400">
                    Endpoint: <strong className="text-cyan-400">{activeEndpoint}</strong>
                  </span>
                )}
              </div>

              {triageResult ? (
                <div className="space-y-3">
                  <AiTriageSignalBadge
                    triageSignal={triageResult}
                    payload={formData}
                    onRefresh={() => handleEvaluate(formData, activeEndpoint)}
                    isLoading={isLoading}
                  />

                  {/* Direct Clinical Advice Highlight Box */}
                  <div className={`p-4 rounded-2xl border ${
                    triageResult.danger
                      ? "bg-red-950/40 border-red-500/40 text-red-100"
                      : triageResult.level === "urgent"
                      ? "bg-amber-950/30 border-amber-500/40 text-amber-100"
                      : "bg-emerald-950/30 border-emerald-500/40 text-emerald-100"
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                        Direct Frontline Clinical Advice:
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-900/80 text-white border border-slate-700">
                        Priority: {triageResult.level.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed">
                      {triageResult.advice}
                    </p>
                  </div>
                </div>
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
