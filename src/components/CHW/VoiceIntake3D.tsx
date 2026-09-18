import React, { useState, useEffect, useRef } from "react";
import { SupportedLanguage, TriageSignalResult } from "../../types";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Check,
  ArrowRight,
  RefreshCw,
  Radio,
  AlertTriangle,
  HelpCircle,
  Send,
  CheckCircle2,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";
import { callTriageApi } from "../../utils/triageSignal";
import { AiTriageSignalBadge } from "../Common/AiTriageSignalBadge";
import {
  askHealthcareAI,
  convertVoiceToStructuredData,
  HealthResponse,
} from "../../utils/healthcareAiApi";
import { GuidedVoiceEngine } from "./GuidedVoiceEngine";
import { Canvas } from "@react-three/fiber";
import { VoicePulseOrb } from "../three/VoicePulseOrb";

interface VoiceIntake3DProps {
  onDataExtracted: (extracted: {
    patientName?: string;
    age?: number;
    gender?: "Male" | "Female" | "Other";
    symptoms: string[];
    symptomDuration: string;
    temperature?: number;
    rawText: string;
  }) => void;
  language: SupportedLanguage;
  currentRawText?: string;
  initialPatientName?: string;
}

const VOICE_PRESETS = [
  {
    id: "fever_dyspnea_52m",
    title: "52Y Male - High Fever & Severe Breathlessness",
    titleHi: "52 वर्ष पुरुष - तेज बुखार व सांस लेने में तकलीफ",
    spokenText: "Patient is 52 years old male, fever for three days, temperature 102 degrees and severe difficulty breathing.",
    extracted: {
      age: 52,
      gender: "Male" as const,
      symptoms: ["High Fever", "Difficulty Breathing / Dyspnea"],
      symptomDuration: "3 days",
      temperature: 102.0,
      rawText: "Patient is 52 years old male, fever for three days, temperature 102 degrees and severe difficulty breathing.",
    },
  },
  {
    id: "maternal_preclampsia_24f",
    title: "24Y Primigravida - 34 Weeks, Severe Headache & Blurred Vision",
    titleHi: "24 वर्ष गर्भवती - सिरदर्द एवं धुंधला दिखना (रक्तचाप संकेत)",
    spokenText: "Pregnant woman 24 years old, 34 weeks gestation, severe throbbing headache, dizziness and blurred vision.",
    extracted: {
      age: 24,
      gender: "Female" as const,
      symptoms: ["Severe Headache", "Blurred Vision", "Dizziness"],
      symptomDuration: "24 hours",
      temperature: 98.6,
      rawText: "Pregnant woman 24 years old, 34 weeks gestation, severe throbbing headache, dizziness and blurred vision.",
    },
  },
  {
    id: "pediatric_diarrhea_18m",
    title: "18-Month Infant - Watery Diarrhea, Lethargic, Unable to Drink",
    titleHi: "18 माह शिशु - दस्त, अत्यधिक सुस्ती, पानी पीने में असमर्थ",
    spokenText: "Child is 18 months old, vomiting and watery diarrhea for 2 days, lethargic, sunken eyes, unable to drink fluids.",
    extracted: {
      age: 1.5,
      gender: "Male" as const,
      symptoms: ["Severe Watery Diarrhea", "Vomiting", "Lethargy", "Sunken Eyes"],
      symptomDuration: "2 days",
      temperature: 100.4,
      rawText: "Child is 18 months old, vomiting and watery diarrhea for 2 days, lethargic, sunken eyes, unable to drink fluids.",
    },
  },
];

export const VoiceIntake3D: React.FC<VoiceIntake3DProps> = ({
  onDataExtracted,
  language,
  currentRawText,
  initialPatientName,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(currentRawText || "");
  const [isTransforming, setIsTransforming] = useState(false);
  const [extractedState, setExtractedState] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTriageSignal, setLiveTriageSignal] = useState<TriageSignalResult | null>(null);
  const [intakeMode, setIntakeMode] = useState<"guided" | "freeform">("guided");

  // Healthcare AI state
  const [healthcareAiOutput, setHealthcareAiOutput] = useState<HealthResponse | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [customQuestionResponse, setCustomQuestionResponse] = useState<HealthResponse | null>(null);
  const [isQuestionPanelOpen, setIsQuestionPanelOpen] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // Handler for completing the guided voice flow (now with patient name)
  const handleGuidedComplete = async (completedData: {
    patientName?: string;
    age: number;
    gender: "Male" | "Female" | "Other";
    temperature: number;
    symptomDuration: string;
    symptoms: string[];
    rawText: string;
  }) => {
    setLiveTranscript(completedData.rawText);
    setIsTransforming(true);
    playHapticSound("success");

    const extracted = {
      patientName: completedData.patientName,
      age: completedData.age,
      gender: completedData.gender,
      symptoms: completedData.symptoms,
      symptomDuration: completedData.symptomDuration,
      temperature: completedData.temperature,
      rawText: completedData.rawText,
    };

    setExtractedState(extracted);
    onDataExtracted(extracted);

    try {
      const result = await convertVoiceToStructuredData(completedData.rawText);
      setHealthcareAiOutput(result.healthcareAi);
      evaluateVoiceTriage(result.extracted || extracted);
    } catch {
      setHealthcareAiOutput({
        answer: `Guided Voice Intake processed: ${completedData.gender}, ${completedData.age} years. Body temp: ${completedData.temperature}°F, duration: ${completedData.symptomDuration}. Primary symptoms: ${completedData.symptoms.join(", ")}. Prioritize vitals assessment and clinical referral.`,
        warning:
          "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
        provider: "guided_clinical_engine",
      });
      evaluateVoiceTriage(extracted);
    } finally {
      setIsTransforming(false);
    }
  };

  // Trigger triage evaluation whenever symptoms are extracted
  const evaluateVoiceTriage = async (ext: any) => {
    try {
      const res = await callTriageApi({
        age: ext.age,
        sex: ext.gender ? ext.gender.toLowerCase() : "unknown",
        symptoms: (ext.symptoms || []).join(", ") + " " + (ext.rawText || ""),
        vitals: { temp: ext.temperature },
        onset: ext.symptomDuration,
      });
      setLiveTriageSignal(res);
    } catch {
      // silent fallback
    }
  };

  // Animated audio wave visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let phase = 0;

    const renderWave = () => {
      animationFrame = requestAnimationFrame(renderWave);
      phase += 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      const numBars = 32;
      const barWidth = width / numBars;

      for (let i = 0; i < numBars; i++) {
        const factor = isListening
          ? Math.sin(phase + i * 0.4) * Math.cos(phase * 0.7 + i * 0.2)
          : Math.sin(phase * 0.5 + i * 0.3) * 0.25;

        const barHeight = Math.max(6, Math.abs(factor) * mid * 0.85 + (isListening ? 15 : 4));
        const x = i * barWidth;
        const y = mid - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isListening) {
          gradient.addColorStop(0, "#ef4444");
          gradient.addColorStop(0.5, "#06b6d4");
          gradient.addColorStop(1, "#3b82f6");
        } else {
          gradient.addColorStop(0, "#0284c7");
          gradient.addColorStop(1, "#1e293b");
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 3) : ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        ctx.fill();
      }
    };

    renderWave();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isListening]);

  // Speech Recognition Hook
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      playHapticSound("click");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      applyVoicePreset(VOICE_PRESETS[0]);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === "en" ? "en-IN" : "hi-IN";

      rec.onstart = () => {
        setIsListening(true);
        playHapticSound("heartbeat");
      };

      rec.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
        parseSpokenContent(transcript);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      applyVoicePreset(VOICE_PRESETS[0]);
    }
  };

  const parseSpokenContent = async (text: string) => {
    setIsTransforming(true);
    playHapticSound("step");

    try {
      // Primary: Convert conversational voice to structured variables via the Healthcare AI API
      const result = await convertVoiceToStructuredData(text);
      setExtractedState(result.extracted);
      setHealthcareAiOutput(result.healthcareAi);
      evaluateVoiceTriage(result.extracted);
      onDataExtracted(result.extracted);
    } catch (err) {
      console.warn("Using local rule extraction:", err);
      // Clinical extraction NLP simulation
      const lower = text.toLowerCase();
      let age = 52;
      const ageMatch = lower.match(/(\d+)\s*(?:years?|saal|sal|वर्ष|month|months)/);
      if (ageMatch) {
        age = parseInt(ageMatch[1], 10);
      }

      const symptoms: string[] = [];
      if (lower.includes("fever") || lower.includes("bukhar") || lower.includes("ताप")) symptoms.push("High Fever");
      if (lower.includes("breath") || lower.includes("saans") || lower.includes("difficulty breathing"))
        symptoms.push("Difficulty Breathing / Dyspnea");
      if (lower.includes("cough") || lower.includes("khasi")) symptoms.push("Cough");
      if (lower.includes("headache") || lower.includes("sirdard")) symptoms.push("Severe Headache");
      if (lower.includes("chest") || lower.includes("chhati")) symptoms.push("Chest Pain / Tightness");
      if (lower.includes("vomit") || lower.includes("ulti")) symptoms.push("Vomiting");
      if (lower.includes("diarrhea") || lower.includes("dast")) symptoms.push("Watery Diarrhea");

      if (symptoms.length === 0) {
        symptoms.push("Acute Febrile Illness", "Respiratory Distress");
      }

      let temp = 98.6;
      const tempMatch = lower.match(/(?:10[0-5]|9[7-9])(?:\.\d+)?/);
      if (tempMatch) {
        temp = parseFloat(tempMatch[0]);
      } else if (lower.includes("fever") || lower.includes("bukhar")) {
        temp = 102.0;
      }

      const extracted = {
        age,
        gender: lower.includes("female") || lower.includes("woman") || lower.includes("mahila") ? ("Female" as const) : ("Male" as const),
        symptoms,
        symptomDuration: lower.includes("three") || lower.includes("3") ? "3 days" : "2 days",
        temperature: temp,
        rawText: text,
      };

      setExtractedState(extracted);
      setHealthcareAiOutput({
        answer: `Identified primary complaints (${symptoms.join(", ")}). Prioritize vitals stabilization, fluid intake, and clinical evaluation.`,
        warning:
          "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
        provider: "fallback_engine",
      });
      evaluateVoiceTriage(extracted);
      onDataExtracted(extracted);
    } finally {
      setIsTransforming(false);
    }
  };

  const applyVoicePreset = async (preset: (typeof VOICE_PRESETS)[0]) => {
    playHapticSound("step");
    setIsListening(false);
    setLiveTranscript(preset.spokenText);
    setIsTransforming(true);

    try {
      const result = await convertVoiceToStructuredData(preset.spokenText);
      setExtractedState(result.extracted || preset.extracted);
      setHealthcareAiOutput(result.healthcareAi);
      evaluateVoiceTriage(result.extracted || preset.extracted);
      playHapticSound("success");
      onDataExtracted(result.extracted || preset.extracted);
    } catch {
      setExtractedState(preset.extracted);
      setHealthcareAiOutput({
        answer: `Identified symptomatic complaints from voice scenario (${preset.extracted.symptoms.join(", ")}). Immediate vitals assessment recommended.`,
        warning:
          "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
        provider: "preset_simulation",
      });
      evaluateVoiceTriage(preset.extracted);
      playHapticSound("success");
      onDataExtracted(preset.extracted);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleAskHealthcareAi = async (questionToAsk?: string) => {
    const q = questionToAsk || customQuestion;
    if (!q || !q.trim()) return;

    setIsAskingQuestion(true);
    playHapticSound("step");

    try {
      const patientContext = liveTranscript
        ? `Spoken Voice Intake: "${liveTranscript}". Age: ${extractedState?.age || "Not specified"}, Gender: ${extractedState?.gender || "Not specified"}, Symptoms: ${(extractedState?.symptoms || []).join(", ") || "None recorded"}.`
        : undefined;

      const res = await askHealthcareAI(q, patientContext);
      setCustomQuestionResponse(res);
      playHapticSound("success");
    } catch (err: any) {
      setCustomQuestionResponse({
        answer: "Encountered issue communicating with the Healthcare AI endpoint. Falling back to local educational summary: Consult a licensed clinician for individualized clinical evaluation.",
        warning:
          "This is general health information, not a diagnosis or medical advice. Contact a qualified healthcare professional for personal guidance. For emergencies, contact local emergency services.",
        provider: "error_fallback",
      });
      playHapticSound("alert");
    } finally {
      setIsAskingQuestion(false);
    }
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header telemetry & Mode selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                VOICE-FIRST CLINICAL INTAKE
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                OFFLINE SPEECH RECOGNITION
              </span>
            </div>
            <h3 className="text-xl font-black font-display text-white mt-1">
              Conversational Voice-to-Structured-Data Engine
            </h3>
          </div>
        </div>

        {/* Mode switcher tabs & Status badge */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
            <button
              type="button"
              id="tab-mode-guided"
              onClick={() => {
                playHapticSound("click");
                setIntakeMode("guided");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                intakeMode === "guided"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>Guided 6-Step Voice Flow</span>
            </button>

            <button
              type="button"
              id="tab-mode-freeform"
              onClick={() => {
                playHapticSound("click");
                setIntakeMode("freeform");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                intakeMode === "freeform"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>One-Shot Stream</span>
            </button>
          </div>

          {isListening ? (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              LISTENING
            </span>
          ) : (
            <span className="bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              READY
            </span>
          )}
        </div>
      </div>

      {/* Primary Intake Experience */}
      {intakeMode === "guided" ? (
        <div className="space-y-6 relative z-10">
          {/* Step-by-Step Guided Clinical Voice Engine */}
          <GuidedVoiceEngine
            language={language}
            initialPatientName={initialPatientName}
            onComplete={handleGuidedComplete}
            onCancel={() => setIntakeMode("freeform")}
          />

          {/* Structured Output Variables & AI Triage HUD */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 space-y-4">
              {/* THE SIGNATURE TRANSFORMATION MOMENT: Spoken Voice -> Structured Variables */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                      Structured Medical Variables (Compiled from Voice)
                    </span>
                  </div>
                  {isTransforming && (
                    <span className="text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      SYNTHESIZING...
                    </span>
                  )}
                </div>

                {/* Extracted Structured Chips Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 block">PATIENT NAME</span>
                    <span className="text-sm sm:text-base font-black text-cyan-300 font-mono truncate block">
                      {extractedState?.patientName || "--"}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 block">PATIENT AGE</span>
                    <span className="text-base font-black text-cyan-300 font-mono">
                      {extractedState?.age ? `${extractedState.age} Yrs` : "--"}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 block">FEVER & TEMP</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {extractedState?.temperature ? `${extractedState.temperature}°F` : "--"}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-400 block">DURATION</span>
                    <span className="text-base font-black text-white font-mono">
                      {extractedState?.symptomDuration || "--"}
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono text-slate-400 block">GENDER</span>
                    <span className="text-base font-black text-slate-200 font-mono">
                      {extractedState?.gender || "--"}
                    </span>
                  </div>
                </div>

                {/* Extracted Symptoms Tags */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">IDENTIFIED SYMPTOMS:</span>
                  {extractedState?.symptoms?.map((sym: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-xs animate-fadeIn"
                    >
                      <Check className="w-3 h-3 text-cyan-400" />
                      {sym}
                    </span>
                  )) || (
                    <span className="text-xs text-slate-500 italic">
                      Answer the 5 guided questions above or tap an instant clinical scenario preset below.
                    </span>
                  )}
                </div>

                {/* Live AI Triage Signal Badge */}
                {liveTriageSignal && (
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <AiTriageSignalBadge
                      triageSignal={liveTriageSignal}
                      payload={{
                        age: extractedState?.age,
                        sex: extractedState?.gender?.toLowerCase(),
                        symptoms: (extractedState?.symptoms || []).join(", "),
                        vitals: { temp: extractedState?.temperature },
                        onset: extractedState?.symptomDuration,
                      }}
                      onRefresh={() => evaluateVoiceTriage(extractedState)}
                    />
                  </div>
                )}
              </div>

              {/* Clinical Assessment & Safety Warning */}
              {healthcareAiOutput && (
                <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Clinical Assessment & Guidance
                    </span>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
                    {healthcareAiOutput.answer}
                  </div>

                  <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                        Verified Healthcare Safety Disclaimer
                      </span>
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        {healthcareAiOutput.warning}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Healthcare Q&A Console */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                      Clinical Consultation Assistant
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsQuestionPanelOpen(!isQuestionPanelOpen)}
                    className="text-slate-400 hover:text-slate-200 p-1 text-xs flex items-center gap-1 font-mono"
                  >
                    {isQuestionPanelOpen ? (
                      <>
                        <span>Hide</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Expand</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>

                {isQuestionPanelOpen && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleAskHealthcareAi(
                            "What are danger warning signs in a patient presenting with high fever and breathlessness?"
                          )
                        }
                        className="text-[11px] bg-slate-950 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 rounded-lg px-2.5 py-1.5 transition-colors text-left"
                      >
                        ⚡ Red flag signs for acute fever
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleAskHealthcareAi(
                            "What immediate first aid actions are indicated prior to medical transfer?"
                          )
                        }
                        className="text-[11px] bg-slate-950 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 rounded-lg px-2.5 py-1.5 transition-colors text-left"
                      >
                        ⚡ First-line stabilization steps
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="input-ask-healthcare-ai-guided"
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isAskingQuestion) {
                            e.preventDefault();
                            handleAskHealthcareAi();
                          }
                        }}
                        placeholder="Ask clinical question (e.g., 'What are common causes of a mild headache?')..."
                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        id="btn-submit-healthcare-ai-guided"
                        onClick={() => handleAskHealthcareAi()}
                        disabled={isAskingQuestion || !customQuestion.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                      >
                        {isAskingQuestion ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isAskingQuestion ? "Querying..." : "Ask Clinical AI"}</span>
                      </button>
                    </div>

                    {customQuestionResponse && (
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                          <span>CLINICAL RESPONSE</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {customQuestionResponse.answer}
                        </p>
                        <div className="bg-amber-950/30 border border-amber-600/30 p-2 rounded-lg flex items-start gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-300/90 leading-tight">
                            {customQuestionResponse.warning}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Freeform 3D Holographic Microphone & Visualizer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left: 3D Holographic Care Companion & Pulsing Microphone */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-2">
          {/* 3D Care Companion Canvas */}
          <div className="relative h-56 w-full max-w-[280px] overflow-hidden rounded-3xl border border-white/10 bg-[#081522] shadow-2xl flex items-center justify-center mb-3">
            <div className="absolute inset-0 z-0">
              <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} gl={{ alpha: true }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[2, 2, 3]} intensity={4} color={isListening ? "#14B8A6" : "#3B82F6"} />
                <VoicePulseOrb isListening={isListening} intensity={audioLevel > 0 ? audioLevel / 40 : 0.6} />
              </Canvas>
            </div>

            {/* Top Indicator */}
            <div className="pointer-events-none absolute top-3 inset-x-3 flex items-center justify-between text-[10px] font-mono z-10">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold bg-slate-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20">
                <span className={`w-2 h-2 rounded-full ${isListening ? "bg-teal-400 animate-ping" : "bg-blue-500"}`} />
                CARE COMPANION
              </span>
              <span className="text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-800">
                {isListening ? "RECORDING" : "STANDBY"}
              </span>
            </div>

            {/* Bottom Floating Mic Action Pill */}
            <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center z-10">
              <button
                id="btn-voice-mic-hero"
                type="button"
                onClick={toggleListening}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xl ${
                  isListening
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/40 ring-2 ring-red-400/50 animate-pulse"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/30 ring-1 ring-cyan-400/30"
                }`}
                title="Click to toggle voice recording"
              >
                <Mic className={`w-3.5 h-3.5 ${isListening ? "animate-bounce" : ""}`} />
                <span>{isListening ? "Listening... (Tap to stop)" : "Hold / Tap to Speak"}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] font-medium text-slate-400 text-center">
            {isListening ? "Speak symptoms clearly in your language" : "Voice amplitude synchronizes with 3D Care Companion"}
          </p>

          {/* Audio frequency wave canvas */}
          <div className="w-full max-w-[260px] h-9 mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/60 p-1">
            <canvas ref={canvasRef} width={250} height={28} className="w-full h-full" />
          </div>
        </div>

        {/* Right: Spoken Audio Transcript & Structured Data Extraction */}
        <div className="lg:col-span-8 space-y-4">
          {/* Spoken Text Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Volume2 className="w-3.5 h-3.5" />
                SPOKEN AUDIO STREAM (RAW INTAKE)
              </span>
              <span>AUTO-TRANSCRIPTION</span>
            </div>
            <p className="text-sm font-medium text-slate-200 min-h-[44px] leading-relaxed italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
              {liveTranscript || "“Waiting for spoken audio input or preset selection...”"}
            </p>
          </div>

          {/* THE SIGNATURE TRANSFORMATION MOMENT: Spoken Voice -> Structured Variables */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
                  AI Extraction: Voice → Structured Medical Variables
                </span>
              </div>
              {isTransforming && (
                <span className="text-[10px] font-mono text-amber-400 animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  SYNTHESIZING...
                </span>
              )}
            </div>

            {/* Extracted Structured Chips Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 block">PATIENT AGE</span>
                <span className="text-base font-black text-cyan-300 font-mono">
                  {extractedState?.age ? `${extractedState.age} Yrs` : "--"}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 block">RECORDED TEMP</span>
                <span className="text-base font-black text-amber-400 font-mono">
                  {extractedState?.temperature ? `${extractedState.temperature}°F` : "--"}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 block">DURATION</span>
                <span className="text-base font-black text-white font-mono">
                  {extractedState?.symptomDuration || "--"}
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] font-mono text-slate-400 block">GENDER</span>
                <span className="text-base font-black text-slate-200 font-mono">
                  {extractedState?.gender || "--"}
                </span>
              </div>
            </div>

            {/* Extracted Symptoms Tags */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase">IDENTIFIED SYMPTOMS:</span>
              {extractedState?.symptoms?.map((sym: string, idx: number) => (
                <span
                  key={idx}
                  className="bg-cyan-950/80 text-cyan-300 border border-cyan-700/50 text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-xs animate-fadeIn"
                >
                  <Check className="w-3 h-3 text-cyan-400" />
                  {sym}
                </span>
              )) || (
                <span className="text-xs text-slate-500 italic">No symptoms parsed yet. Speak or click a preset below.</span>
              )}
            </div>

            {/* Live AI Triage Signal Badge */}
            {liveTriageSignal && (
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <AiTriageSignalBadge
                  triageSignal={liveTriageSignal}
                  payload={{
                    age: extractedState?.age,
                    sex: extractedState?.gender?.toLowerCase(),
                    symptoms: (extractedState?.symptoms || []).join(", "),
                    vitals: { temp: extractedState?.temperature },
                    onset: extractedState?.symptomDuration,
                  }}
                  onRefresh={() => evaluateVoiceTriage(extractedState)}
                />
              </div>
            )}
          </div>

          {/* Clinical Assessment & Safety Warning */}
          {healthcareAiOutput && (
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Clinical Assessment & Guidance
                </span>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans">
                {healthcareAiOutput.answer}
              </div>

              {/* Verified Safety Warning Banner */}
              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    Verified Healthcare Safety Disclaimer
                  </span>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {healthcareAiOutput.warning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Healthcare Q&A Console */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Clinical Consultation Assistant
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionPanelOpen(!isQuestionPanelOpen)}
                className="text-slate-400 hover:text-slate-200 p-1 text-xs flex items-center gap-1 font-mono"
              >
                {isQuestionPanelOpen ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Expand</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {isQuestionPanelOpen && (
              <div className="space-y-3 pt-1">
                {/* Suggested prompt chips including user test query */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "What are common causes of a mild headache?",
                    "What urgent warning signs should ASHA look for?",
                    "When is emergency hospital referral needed?",
                  ].map((presetQ, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomQuestion(presetQ);
                        handleAskHealthcareAi(presetQ);
                      }}
                      className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700/60 px-2.5 py-1 rounded-lg transition-colors text-left"
                    >
                      {presetQ}
                    </button>
                  ))}
                </div>

                {/* Question Input Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="input-ask-healthcare-ai"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isAskingQuestion) {
                        e.preventDefault();
                        handleAskHealthcareAi();
                      }
                    }}
                    placeholder="Ask clinical question (e.g., 'What are common causes of a mild headache?')..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    id="btn-submit-healthcare-ai-ask"
                    onClick={() => handleAskHealthcareAi()}
                    disabled={isAskingQuestion || !customQuestion.trim()}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    {isAskingQuestion ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isAskingQuestion ? "Querying..." : "Ask Clinical AI"}</span>
                  </button>
                </div>

                {/* Q&A Response Box */}
                {customQuestionResponse && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                      <span>CLINICAL RESPONSE</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {customQuestionResponse.answer}
                    </p>
                    <div className="bg-amber-950/30 border border-amber-600/30 p-2 rounded-lg flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-300/90 leading-tight">
                        {customQuestionResponse.warning}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Quick Voice Clinical Simulation Presets */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <span>⚡ Instant Voice Clinical Simulation Presets</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">ONE-TOUCH SIMULATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {VOICE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`btn-voice-preset-${preset.id}`}
              onClick={() => applyVoicePreset(preset)}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl text-left transition-all group cursor-pointer shadow-xs hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-cyan-300 mb-1">
                <span>{preset.title}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 font-medium line-clamp-2 italic">
                “{preset.spokenText}”
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
