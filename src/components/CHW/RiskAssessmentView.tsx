import React, { useState, useEffect } from "react";
import { RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Hospital,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap
} from "lucide-react";
import { BioMatrix3D } from "../Common/BioMatrix3D";
import { Card3DTilt } from "../Common/Card3DTilt";
import { playHapticSound } from "../../utils/audioFeedback";

interface RiskAssessmentViewProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onProceedToFacilities: () => void;
  onSaveRoutineCase: () => void;
  onBack: () => void;
  language: SupportedLanguage;
  isOffline: boolean;
}

export const RiskAssessmentView: React.FC<RiskAssessmentViewProps> = ({
  assessment,
  patientData,
  onProceedToFacilities,
  onSaveRoutineCase,
  onBack,
  language,
  isOffline,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUrgent = assessment.riskLevel === "URGENT";
  const isConsultation = assessment.riskLevel === "CONSULTATION";
  const isRoutine = assessment.riskLevel === "ROUTINE";

  useEffect(() => {
    if (isUrgent) {
      playHapticSound("alert");
    } else {
      playHapticSound("success");
    }
  }, [assessment.riskLevel]);

  const speakAssessment = () => {
    playHapticSound("click");
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `${
      isUrgent
        ? "चेतावनी: मरीज की हालत गंभीर है। तत्काल उच्च स्वास्थ्य केंद्र रेफर करें।"
        : isConsultation
        ? "मरीज को डॉक्टर से परामर्श की आवश्यकता है।"
        : "मरीज की स्थिति सामान्य है, स्थानीय स्तर पर देखभाल करें।"
    } मुख्य लक्षण: ${assessment.clinicalImpression}. अनुशंसित कार्रवाई: ${assessment.recommendedAction}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === "en" ? "en-IN" : "hi-IN";
    utterance.rate = 0.9;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div id="risk-assessment-view" className="space-y-6">
      {/* 1. Main Triage Outcome Card with Integrated 3D Bio-Matrix */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border shadow-xl transition-all relative overflow-hidden ${
          isUrgent
            ? "bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 border-red-500/40 text-white"
            : isConsultation
            ? "bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-500/40 text-white"
            : "bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 border-emerald-500/40 text-white"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left details */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full tracking-widest shadow-md ${
                  isUrgent
                    ? "bg-red-600 text-white ring-2 ring-red-400/40 animate-pulse"
                    : isConsultation
                    ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/40"
                    : "bg-emerald-600 text-white ring-2 ring-emerald-400/40"
                }`}
              >
                {isUrgent
                  ? "EMERGENCY: RED TRIAGE"
                  : isConsultation
                  ? "CONSULTATION: YELLOW TRIAGE"
                  : "STABLE: GREEN TRIAGE"}
              </span>

              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded border border-slate-700">
                SCORE: <strong className="text-white">{assessment.riskScore}/100</strong>
              </span>

              {isOffline && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono">
                  LOCAL ETAT
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
              {isUrgent
                ? "Immediate Emergency Referral Required"
                : isConsultation
                ? "Medical Officer Tele-Consultation Required"
                : "Routine Local Primary Healthcare"}
            </h2>

            {/* Clinical Impression Callout */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block font-bold">
                  Clinical Impression:
                </span>
                <p className="text-sm font-semibold text-slate-200">
                  {assessment.clinicalImpression}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Protocol Action Directive:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {assessment.recommendedAction}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                id="btn-voice-readout"
                onClick={speakAssessment}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  isPlayingAudio
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse shadow-md"
                    : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-sm"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-950" />
                    <span>Stop Voice Guidance</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Audio Readout (Vernacular)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right 3D Bio-Matrix Interactive Hologram */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="w-full h-52 sm:h-56 rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden relative shadow-inner">
              <BioMatrix3D riskLevel={assessment.riskLevel} className="w-full h-full" interactive={true} />
              <div className="absolute top-2.5 right-3 text-right">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                  TRIAGE VECTOR
                </span>
                <span className={`text-[10px] font-bold ${isUrgent ? "text-red-400" : isConsultation ? "text-amber-400" : "text-cyan-400"}`}>
                  {assessment.riskLevel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Signs Red Flags Grid */}
        {assessment.dangerSigns && assessment.dangerSigns.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-2 font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
              <span>Critical Red Flags Triggered ({assessment.dangerSigns.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {assessment.dangerSigns.map((ds, idx) => (
                <div key={idx} className="bg-red-950/40 border border-red-500/30 rounded-xl p-2.5 text-xs text-red-200 font-medium flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <span>{ds}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Immediate Field Stabilizing Protocols */}
        {assessment.fieldStabilizingActions && assessment.fieldStabilizingActions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2 mb-3 font-mono uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Immediate Pre-Transport Stabilizing Protocol</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.fieldStabilizingActions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs text-slate-200 flex items-start gap-2.5 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SBAR Handover Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Structured SBAR Clinical Summary for Receiving Hospital
            </h3>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
            Standard WHO Handover
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <Card3DTilt maxTilt={4}>
            <div className="p-4 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 transition-all h-full">
              <span className="font-bold text-slate-900 block mb-1 text-xs">Situation (S):</span>
              <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.situation}</p>
            </div>
          </Card3DTilt>

          <Card3DTilt maxTilt={4}>
            <div className="p-4 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 transition-all h-full">
              <span className="font-bold text-slate-900 block mb-1 text-xs">Background (B):</span>
              <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.background}</p>
            </div>
          </Card3DTilt>

          <Card3DTilt maxTilt={4}>
            <div className="p-4 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 transition-all h-full">
              <span className="font-bold text-slate-900 block mb-1 text-xs">Assessment (A):</span>
              <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.assessment}</p>
            </div>
          </Card3DTilt>

          <Card3DTilt maxTilt={4}>
            <div className="p-4 bg-slate-50/80 hover:bg-white rounded-xl border border-slate-200 transition-all h-full">
              <span className="font-bold text-slate-900 block mb-1 text-xs">Recommendation (R):</span>
              <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.recommendation}</p>
            </div>
          </Card3DTilt>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <button
          id="btn-back-to-followup"
          onClick={() => {
            playHapticSound("click");
            onBack();
          }}
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clinical Questions</span>
        </button>

        {isUrgent || isConsultation ? (
          <button
            id="btn-find-nearest-facility"
            onClick={() => {
              playHapticSound("step");
              onProceedToFacilities();
            }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-xl shadow-red-600/25 flex items-center gap-2.5 transition-all hover:gap-3.5 cursor-pointer hover:scale-[1.02]"
          >
            <Hospital className="w-4 h-4" />
            <span>Generate Referral & Match Facility</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="btn-save-routine-case"
            onClick={() => {
              playHapticSound("success");
              onSaveRoutineCase();
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Record Local Routine Case & Close</span>
          </button>
        )}
      </div>
    </div>
  );
};
