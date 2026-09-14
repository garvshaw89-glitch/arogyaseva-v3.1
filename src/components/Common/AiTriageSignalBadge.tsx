import React, { useState } from "react";
import { TriageSignalResult, TriagePayload } from "../../types";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from "lucide-react";

interface AiTriageSignalBadgeProps {
  triageSignal?: TriageSignalResult | null;
  payload?: TriagePayload;
  compact?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AiTriageSignalBadge: React.FC<AiTriageSignalBadgeProps> = ({
  triageSignal,
  payload,
  compact = false,
  onRefresh,
  isLoading = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!triageSignal) {
    return null;
  }

  const isEmergency = triageSignal.level === "emergency" || triageSignal.danger;
  const isUrgent = triageSignal.level === "urgent";

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase tracking-wide border ${
          isEmergency
            ? "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse"
            : isUrgent
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isEmergency
              ? "bg-red-500 animate-ping"
              : isUrgent
              ? "bg-amber-500"
              : "bg-emerald-500"
          }`}
        />
        <span>AI SIGNAL: {triageSignal.level}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        isEmergency
          ? "bg-red-950/40 border-red-500/50 text-red-100 shadow-lg shadow-red-950/50"
          : isUrgent
          ? "bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-lg shadow-amber-950/40"
          : "bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-lg shadow-emerald-950/30"
      }`}
    >
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isEmergency
                ? "bg-red-600 text-white shadow-md animate-bounce"
                : isUrgent
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "bg-emerald-600 text-white shadow-md"
            }`}
          >
            {isEmergency ? (
              <ShieldAlert className="w-5 h-5" />
            ) : isUrgent ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                POST /api/triage AI SIGNAL
              </span>
              {triageSignal.danger && (
                <span className="bg-red-600 text-white text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                  DANGER FLAG TRUE
                </span>
              )}
            </div>
            <h4
              className={`text-base font-black uppercase tracking-wide flex items-center gap-2 ${
                isEmergency
                  ? "text-red-300"
                  : isUrgent
                  ? "text-amber-300"
                  : "text-emerald-300"
              }`}
            >
              {triageSignal.level.toUpperCase()} TRIAGE LEVEL
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer flex items-center gap-1"
            >
              <Activity className={`w-3 h-3 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
              <span>{isLoading ? "Evaluating..." : "Re-evaluate"}</span>
            </button>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
          >
            <span>{showDetails ? "Hide Audit" : "Show Audit"}</span>
            {showDetails ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Advice banner */}
      <div className="px-4 pb-3">
        <p className="text-xs leading-relaxed font-medium bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
          <strong className="text-white block mb-0.5 font-bold">Recommended Clinical Action:</strong>
          {triageSignal.advice}
        </p>
      </div>

      {/* Reasons Tags */}
      {triageSignal.reasons && triageSignal.reasons.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold mr-1">
            Triggered Flags:
          </span>
          {triageSignal.reasons.map((r, i) => (
            <span
              key={i}
              className={`text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold border ${
                r.startsWith("low_") || r.startsWith("abnormal_") || r.startsWith("high_")
                  ? "bg-red-950 text-red-300 border-red-800"
                  : "bg-slate-900 text-slate-200 border-slate-700"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      )}

      {/* LLM Assist explanation */}
      {triageSignal.llm_assist && (
        <div className="mx-4 mb-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>LLM Triage Assist (Gemini / GPT):</span>
          </div>
          {typeof triageSignal.llm_assist === "object" ? (
            <div className="space-y-1 text-[11px] text-slate-300">
              {triageSignal.llm_assist.recommendation && (
                <p>
                  <strong className="text-cyan-300">Recommendation:</strong>{" "}
                  {triageSignal.llm_assist.recommendation}
                </p>
              )}
              {triageSignal.llm_assist.reasons && (
                <p>
                  <strong className="text-cyan-300">Top Reasons:</strong>{" "}
                  {triageSignal.llm_assist.reasons}
                </p>
              )}
              {triageSignal.llm_assist.safety_instruction && (
                <p>
                  <strong className="text-amber-300">Safety Instruction:</strong>{" "}
                  {triageSignal.llm_assist.safety_instruction}
                </p>
              )}
              {triageSignal.llm_assist.raw && (
                <p className="italic">{triageSignal.llm_assist.raw}</p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-300">{String(triageSignal.llm_assist)}</p>
          )}
        </div>
      )}

      {/* Collapsible Audit / JSON preview */}
      {showDetails && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800 bg-slate-950/80 font-mono text-[10px] space-y-2">
          {payload && (
            <div>
              <span className="text-slate-400 uppercase font-bold block mb-1">
                API Request Payload:
              </span>
              <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-cyan-300 overflow-x-auto max-h-36">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
          <div>
            <span className="text-slate-400 uppercase font-bold block mb-1">
              POST /api/triage Raw Response:
            </span>
            <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-300 overflow-x-auto max-h-36">
              {JSON.stringify(triageSignal, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
