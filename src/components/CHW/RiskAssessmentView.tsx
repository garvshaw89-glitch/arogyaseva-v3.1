import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

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

  const speakAssessment = () => {
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
      {/* 1. Main Triage Outcome Card (Professional Polish Aesthetic) */}
      <div
        className={`rounded-2xl p-6 border shadow-sm transition-all ${
          isUrgent
            ? "bg-red-50 border-red-200"
            : isConsultation
            ? "bg-amber-50 border-amber-200"
            : "bg-emerald-50 border-emerald-200"
        }`}
      >
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                isUrgent
                  ? "bg-red-600"
                  : isConsultation
                  ? "bg-amber-500"
                  : "bg-emerald-600"
              }`}
            >
              {isUrgent ? (
                <span className="text-base font-black">!</span>
              ) : isConsultation ? (
                <Clock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded tracking-wider ${
                    isUrgent
                      ? "bg-red-600 text-white"
                      : isConsultation
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-700 text-white"
                  }`}
                >
                  {isUrgent
                    ? "Urgent Referral"
                    : isConsultation
                    ? "Medical Consultation"
                    : "Routine Local Care"}
                </span>

                <span className="text-xs font-semibold text-slate-600">
                  Risk Score: {assessment.riskScore}/100
                </span>
              </div>

              <h2 className={`text-xl font-bold mt-1.5 ${
                isUrgent ? "text-red-950" : isConsultation ? "text-amber-950" : "text-emerald-950"
              }`}>
                {isUrgent
                  ? "Critical Clinical Risk Detected"
                  : isConsultation
                  ? "Needs Medical Officer Consultation"
                  : "Stable - Routine Subcentre Care"}
              </h2>
            </div>
          </div>

          <button
            id="btn-voice-readout"
            onClick={speakAssessment}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              isPlayingAudio
                ? "bg-slate-900 text-white border-slate-900 animate-pulse"
                : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50 shadow-xs"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>Stop Voice Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Listen Audio Guidance</span>
              </>
            )}
          </button>
        </div>

        {/* Clinical Impression & Rationale */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 mb-4 space-y-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Probable Clinical Impression:
            </span>
            <p className="text-sm font-bold text-slate-900">
              {assessment.clinicalImpression}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Recommended Clinical Action:
            </span>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              {assessment.recommendedAction}
            </p>
          </div>
        </div>

        {/* Danger Signs Identified List */}
        {assessment.dangerSigns && assessment.dangerSigns.length > 0 && (
          <div className="bg-white/80 border border-red-200 rounded-xl p-3.5 mb-4">
            <h4 className="text-xs font-bold text-red-950 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Identified Danger Signs & Red Flags ({assessment.dangerSigns.length})</span>
            </h4>
            <ul className="space-y-1">
              {assessment.dangerSigns.map((ds, idx) => (
                <li key={idx} className="text-xs text-red-900 font-medium flex items-start gap-1.5">
                  <span className="text-red-600 font-bold">•</span>
                  <span>{ds}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Immediate Field Stabilizing Actions for ASHA */}
        {assessment.fieldStabilizingActions && assessment.fieldStabilizingActions.length > 0 && (
          <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Immediate Field First-Aid & Pre-Transport Protocol</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.fieldStabilizingActions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-xs text-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SBAR Summary for Receiving Doctor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Structured SBAR Clinical Summary for Receiving Hospital
            </h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md border border-slate-200">
            Standard Hospital Handover
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Situation (S):</span>
            <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.situation}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Background (B):</span>
            <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.background}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Assessment (A):</span>
            <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.assessment}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">Recommendation (R):</span>
            <p className="text-slate-700 leading-relaxed">{assessment.sbarSummary.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <button
          id="btn-back-to-followup"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {isUrgent || isConsultation ? (
          <button
            id="btn-find-nearest-facility"
            onClick={onProceedToFacilities}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:gap-3"
          >
            <Hospital className="w-4 h-4" />
            <span>Generate Referral & Match Facility</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            id="btn-save-routine-case"
            onClick={onSaveRoutineCase}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Record Local Routine Case & Close</span>
          </button>
        )}
      </div>
    </div>
  );
};
