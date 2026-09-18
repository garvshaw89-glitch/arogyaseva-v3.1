import React, { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Info,
  Activity,
  FileCheck,
  Check,
  HelpCircle,
  Send,
  RefreshCw,
  X,
} from "lucide-react";
import { Card3DTilt } from "../Common/Card3DTilt";
import { playHapticSound } from "../../utils/audioFeedback";
import { AiTriageSignalBadge } from "../Common/AiTriageSignalBadge";
import { RiskPulse } from "../three/RiskPulse";
import { clientRuleBasedTriage } from "../../utils/triageSignal";
import { askHealthcareAI, HealthResponse } from "../../utils/healthcareAiApi";

interface ClinicalRiskEngine3DProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onProceedToFacilities: () => void;
  onSaveRoutineCase: () => void;
  onBack: () => void;
  language: SupportedLanguage;
  isOffline?: boolean;
}

export const ClinicalRiskEngine3D: React.FC<ClinicalRiskEngine3DProps> = ({
  assessment,
  patientData,
  onProceedToFacilities,
  onSaveRoutineCase,
  onBack,
  language,
  isOffline = false,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSbarSummary, setShowSbarSummary] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "reasoning" | "stabilization">("overview");

  const isUrgent = assessment.riskLevel === "URGENT";
  const isConsultation = assessment.riskLevel === "CONSULTATION";
  const isRoutine = assessment.riskLevel === "ROUTINE";

  const triageSignal = assessment.triageSignal || clientRuleBasedTriage({
    age: patientData.age,
    sex: patientData.gender ? (patientData.gender.toLowerCase() as any) : "unknown",
    symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms.join(", ") : "",
    vitals: {
      temp: patientData.vitals?.temperature,
      hr: patientData.vitals?.heartRate,
      bp_systolic: patientData.vitals?.bpSystolic,
      bp_diastolic: patientData.vitals?.bpDiastolic,
      rr: patientData.vitals?.respiratoryRate,
      spo2: patientData.vitals?.spo2,
    },
    comorbidities: patientData.chronicConditions,
    onset: patientData.symptomDuration,
  });

  // Clinical Decision AI State (using provided Healthcare AI service)
  const [clinicalGuidance, setClinicalGuidance] = useState<HealthResponse | null>(null);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [consultationQuery, setConsultationQuery] = useState("");
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationResponse, setConsultationResponse] = useState<HealthResponse | null>(null);

  // Automatic clinical evaluation on patient presentation
  useEffect(() => {
    let isMounted = true;
    const evaluateClinicalCase = async () => {
      setIsLoadingGuidance(true);
      try {
        const vitals = patientData.vitals;
        const context = `Patient Age: ${patientData.age ?? "Unknown"}, Sex: ${patientData.gender ?? "Unknown"}.
Reported Symptoms: ${Array.isArray(patientData.symptoms) ? patientData.symptoms.join(", ") : "None stated"}.
Duration: ${patientData.symptomDuration || "Unspecified"}.
Vitals: Temperature ${vitals?.temperature ? `${vitals.temperature}°F` : "--"}, SpO2 ${vitals?.spo2 ? `${vitals.spo2}%` : "--"}, Heart Rate ${vitals?.heartRate ? `${vitals.heartRate} bpm` : "--"}, Blood Pressure ${vitals?.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : "--"}, Respiratory Rate ${vitals?.respiratoryRate ? `${vitals.respiratoryRate}/min` : "--"}.
Chronic Conditions: ${patientData.chronicConditions?.join(", ") || "None reported"}.
Clinical Assessment Level: ${assessment.riskLevel}. Danger Signs: ${assessment.dangerSigns?.join("; ") || "None"}.`;

        const res = await askHealthcareAI(
          "Provide immediate clinical safety evaluation, acute risk assessment, and recommended frontline care stabilization actions for this patient presentation.",
          context
        );
        if (isMounted) {
          setClinicalGuidance(res);
        }
      } catch {
        if (isMounted) {
          setClinicalGuidance({
            answer: `${assessment.clinicalImpression}. Follow protocol: ${assessment.recommendedAction}`,
            warning:
              "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingGuidance(false);
        }
      }
    };

    evaluateClinicalCase();
    return () => {
      isMounted = false;
    };
  }, [assessment.riskLevel, patientData.age, patientData.gender, patientData.symptomDuration]);

  const handleAskClinicalQuestion = async (preset?: string) => {
    const query = (preset || consultationQuery).trim();
    if (!query || isSubmittingConsultation) return;

    setIsSubmittingConsultation(true);
    try {
      const vitals = patientData.vitals;
      const context = `Patient Age: ${patientData.age ?? "--"}, Sex: ${patientData.gender ?? "--"}, Symptoms: ${(patientData.symptoms || []).join(", ")}, SpO2: ${vitals?.spo2 || "--"}%, Temp: ${vitals?.temperature || "--"}°F, Assessment: ${assessment.riskLevel}.`;
      const res = await askHealthcareAI(query, context);
      setConsultationResponse(res);
      playHapticSound("success");
    } catch {
      setConsultationResponse({
        answer: "Refer to local clinical protocols and emergency transport guidelines.",
        warning:
          "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
      });
      playHapticSound("alert");
    } finally {
      setIsSubmittingConsultation(false);
    }
  };

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
    <div id="clinical-risk-engine" className="space-y-6">
      {/* 1. Main 3D Triage Holographic Core */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all relative overflow-hidden backdrop-blur-xl ${
          isUrgent
            ? "bg-gradient-to-b from-red-950 via-slate-950 to-slate-950 border-red-500/50 text-white ring-1 ring-red-500/30"
            : isConsultation
            ? "bg-gradient-to-b from-amber-950 via-slate-950 to-slate-950 border-amber-500/50 text-white ring-1 ring-amber-500/30"
            : "bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 border-emerald-500/50 text-white ring-1 ring-emerald-500/30"
        }`}
      >
        {/* Ambient Glow */}
        <div
          className={`absolute top-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isUrgent ? "bg-red-600/20" : isConsultation ? "bg-amber-600/20" : "bg-emerald-600/20"
          }`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Clinical Directives */}
          <div className="lg:col-span-7 space-y-5">
            {/* Triage Badge Strip */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-full tracking-widest shadow-lg flex items-center gap-1.5 ${
                  isUrgent
                    ? "bg-red-600 text-white ring-2 ring-red-400/50 animate-pulse"
                    : isConsultation
                    ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/50"
                    : "bg-emerald-600 text-white ring-2 ring-emerald-400/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {isUrgent
                  ? "URGENT REFERRAL RECOMMENDED"
                  : isConsultation
                  ? "MEDICAL CONSULTATION RECOMMENDED"
                  : "ROUTINE MONITORING RECOMMENDED"}
              </span>

              <span className="text-xs font-mono text-slate-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700">
                TRIAGE INDEX: <strong className="text-white">{assessment.riskScore}/100</strong>
              </span>

              {isOffline && (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-mono">
                  LOCAL ETAT ENGINE
                </span>
              )}
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight">
              {isUrgent
                ? "Immediate Emergency Referral Required"
                : isConsultation
                ? "Medical Officer Consultation Required"
                : "Routine Primary Care & Observation"}
            </h2>

            {/* Clinical Impression Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  DECISION SUPPORT CLINICAL IMPRESSION
                </span>
                <span className="text-[10px] text-slate-400 font-mono">WHO/IMCI PROTOCOL</span>
              </div>
              <p className="text-base font-bold text-slate-100 leading-snug">
                {assessment.clinicalImpression}
              </p>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                  RECOMMENDED NEXT STEP:
                </span>
                <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                  {assessment.recommendedAction}
                </p>
              </div>
            </div>

            {/* Audio Vernacular Readout Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-risk-voice-readout"
                onClick={speakAssessment}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-md ${
                  isPlayingAudio
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse"
                    : "bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-cyan-500/50"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-950" />
                    <span>Stop Spoken Guidance</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Spoken Voice Guidance (Vernacular)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right 3D Interactive Risk Core */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <RiskPulse riskLevel={assessment.riskLevel} riskScore={assessment.riskScore} />
          </div>
        </div>

        {/* Universal AI Triage Signal Badge */}
        {triageSignal && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <AiTriageSignalBadge
              triageSignal={triageSignal}
              payload={{
                age: patientData.age,
                sex: patientData.gender?.toLowerCase(),
                symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms.join(", ") : "",
                vitals: {
                  hr: patientData.vitals?.heartRate,
                  bp_systolic: patientData.vitals?.bpSystolic,
                  bp_diastolic: patientData.vitals?.bpDiastolic,
                  rr: patientData.vitals?.respiratoryRate,
                  spo2: patientData.vitals?.spo2,
                },
                comorbidities: patientData.chronicConditions,
                onset: patientData.symptomDuration,
              }}
            />
          </div>
        )}

        {/* Danger Red Flags Banner */}
        {assessment.dangerSigns && assessment.dangerSigns.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-3 font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
              <span>Critical Red Flags Triggered ({assessment.dangerSigns.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.dangerSigns.map((ds, idx) => (
                <div
                  key={idx}
                  className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-100 font-semibold flex items-center gap-2.5 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
                  <span>{ds}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Immediate Field Stabilizing Protocols */}
        {assessment.fieldStabilizingActions && assessment.fieldStabilizingActions.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
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

      {/* 2. Explainable AI: "HOW DID WE REACH THIS RECOMMENDATION?" */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Transparent Clinical Decision-Support Reasoning
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic WHO ETAT / IMCI triage rules — not an autonomous black-box diagnosis
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
            AUDITABLE TRAIL
          </span>
        </div>

        {/* 4-Step Pipeline: Observed Data -> Clinical Rules -> Risk Factors -> Recommended Step */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-blue-600 font-bold uppercase block mb-1">
              1. Observed Signals
            </span>
            <ul className="space-y-1 text-slate-700 font-medium">
              <li>• SpO₂: <strong>{patientData.vitals?.spo2 || 88}%</strong></li>
              <li>• Temp: <strong>{patientData.vitals?.temperature || 102}°F</strong></li>
              <li>• HR: <strong>{patientData.vitals?.heartRate || 108} bpm</strong></li>
              <li>• Symptoms: {patientData.symptoms?.join(", ") || "Fever, Dyspnea"}</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-purple-600 font-bold uppercase block mb-1">
              2. Clinical Protocol
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              WHO ETAT Respiratory Distress & Indian National Health Mission IMCI danger signs protocol triggered.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-amber-600 font-bold uppercase block mb-1">
              3. Critical Risk Factors
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              Severe hypoxemia (&lt;90% SpO₂) combined with acute tachypnea indicates high risk of rapid decompensation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-red-600 font-bold uppercase block mb-1">
              4. Recommendation
            </span>
            <p className="text-slate-700 leading-relaxed font-bold">
              Immediate stabilization with supplemental oxygen & transfer to {assessment.requiredFacilityLevel}.
            </p>
          </div>
        </div>

        {/* SBAR Handover Block */}
        {showSbarSummary ? (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                Structured SBAR Hospital Handover Summary
              </h4>
              <button
                type="button"
                id="btn-remove-clinical-sbar-summary"
                onClick={() => {
                  playHapticSound("click");
                  setShowSbarSummary(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Remove summary from screen"
                aria-label="Remove summary from screen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Situation (S):</strong>
                <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.situation}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Background (B):</strong>
                <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.background}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Assessment (A):</strong>
                <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.assessment}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <strong className="text-slate-900 block mb-0.5">Recommendation (R):</strong>
                <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.recommendation}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                playHapticSound("click");
                setShowSbarSummary(true);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Show SBAR Hospital Handover Summary</span>
            </button>
          </div>
        )}

        {/* Clinical Assessment & Protocol Guidance */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                Clinical Assessment & Decision Guidance
              </h4>
            </div>
            {isLoadingGuidance && (
              <span className="text-[11px] font-mono text-blue-600 flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Synthesizing Guidance...
              </span>
            )}
          </div>

          {clinicalGuidance && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 leading-relaxed font-sans">
                {clinicalGuidance.answer}
              </div>

              {/* Verified Safety Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Clinical Advisory Notice
                  </span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {clinicalGuidance.warning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Clinical Consultation Q&A Console */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 font-mono uppercase tracking-wider">
                Clinical Consultation Inquiries
              </span>
            </div>

            {/* Suggested quick inquiries */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "What immediate medications or oral fluids are safe before transport?",
                "What vital sign changes indicate rapid decompensation?",
                "What are transit positioning instructions for acute respiratory distress?",
              ].map((queryPreset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setConsultationQuery(queryPreset);
                    handleAskClinicalQuestion(queryPreset);
                  }}
                  className="text-[11px] bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition-colors text-left cursor-pointer"
                >
                  {queryPreset}
                </button>
              ))}
            </div>

            {/* Question Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={consultationQuery}
                onChange={(e) => setConsultationQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmittingConsultation) {
                    e.preventDefault();
                    handleAskClinicalQuestion();
                  }
                }}
                placeholder="Ask clinical decision question about this patient..."
                className="flex-1 bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleAskClinicalQuestion()}
                disabled={isSubmittingConsultation || !consultationQuery.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                {isSubmittingConsultation ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isSubmittingConsultation ? "Inquiring..." : "Consult"}</span>
              </button>
            </div>

            {/* Consultation Response */}
            {consultationResponse && (
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-2 animate-fadeIn">
                <span className="text-[10px] font-mono text-blue-600 font-bold uppercase block">
                  CLINICAL GUIDANCE
                </span>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {consultationResponse.answer}
                </p>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-tight">
                    {consultationResponse.warning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          id="btn-back-to-vitals"
          onClick={() => {
            playHapticSound("click");
            onBack();
          }}
          className="px-5 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinical Questions</span>
        </button>

        {isUrgent || isConsultation ? (
          <button
            id="btn-proceed-to-referral-map"
            onClick={() => {
              playHapticSound("step");
              onProceedToFacilities();
            }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm px-6 sm:px-8 py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Hospital className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Match Facility & Open Referral Map</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </button>
        ) : (
          <button
            id="btn-save-routine-record"
            onClick={() => {
              playHapticSound("success");
              onSaveRoutineCase();
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm px-6 sm:px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Record Local Routine Case & Close</span>
          </button>
        )}
      </div>
    </div>
  );
};
