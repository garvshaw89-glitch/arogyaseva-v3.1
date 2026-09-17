import React, { useState, useEffect, useRef } from "react";
import { SupportedLanguage } from "../../types";
import {
  GuidedStepDefinition,
  GuidedVoiceAnswers,
  GUIDED_STEPS,
  parseAgeFromText,
  parseFeverTempFromText,
  parseDurationFromText,
  parseGenderFromText,
  extractSymptomsFromProblemText,
} from "./guidedVoiceData";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Thermometer,
  Calendar,
  User,
  Activity,
  Check,
  Radio,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface GuidedVoiceEngineProps {
  language: SupportedLanguage;
  onComplete: (completedData: {
    age: number;
    gender: "Male" | "Female" | "Other";
    temperature: number;
    symptomDuration: string;
    symptoms: string[];
    rawText: string;
  }) => void;
  onCancel?: () => void;
  isCompact?: boolean;
}

export const GuidedVoiceEngine: React.FC<GuidedVoiceEngineProps> = ({
  language,
  onComplete,
  onCancel,
  isCompact = false,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<GuidedVoiceAnswers>({
    age: null,
    hasFever: null,
    temperature: null,
    duration: "",
    gender: null,
    problemDetails: "",
  });

  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [detectedValueLabel, setDetectedValueLabel] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const currentStep: GuidedStepDefinition = GUIDED_STEPS[currentStepIndex] || GUIDED_STEPS[0];

  // Speak the question prompt using browser Web Speech API
  const speakQuestion = (step: GuidedStepDefinition) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (!ttsEnabled) return;

    try {
      window.speechSynthesis.cancel();
      const textToSpeak = language === "hi" ? step.promptVoiceHi : step.promptVoiceEn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeakingPrompt(true);
      utterance.onend = () => {
        setIsSpeakingPrompt(false);
        // Automatically start listening for patient response after prompt finishes!
        startListeningForCurrentStep();
      };
      utterance.onerror = () => setIsSpeakingPrompt(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis error:", err);
      setIsSpeakingPrompt(false);
    }
  };

  // Trigger prompt when step changes
  useEffect(() => {
    setLiveTranscript("");
    setDetectedValueLabel(null);
    speakQuestion(currentStep);

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    };
  }, [currentStepIndex, language]);

  // Speech Recognition control
  const startListeningForCurrentStep = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === "hi" ? "hi-IN" : "en-IN";

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
        handleAnalyzeSpokenAnswer(transcript, currentStep);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.warn("Recognition start failed:", err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      playHapticSound("click");
    } else {
      startListeningForCurrentStep();
    }
  };

  // Analyze spoken transcript for current step
  const handleAnalyzeSpokenAnswer = (text: string, step: GuidedStepDefinition) => {
    if (!text.trim()) return;

    if (step.id === "age") {
      const age = parseAgeFromText(text);
      if (age !== null) {
        setAnswers((prev) => ({ ...prev, age }));
        setDetectedValueLabel(`Age: ${age} Years Old`);
        playHapticSound("step");
      }
    } else if (step.id === "fever_temp") {
      const feverRes = parseFeverTempFromText(text);
      if (feverRes !== null) {
        setAnswers((prev) => ({
          ...prev,
          hasFever: feverRes.hasFever,
          temperature: feverRes.temperature,
        }));
        setDetectedValueLabel(
          feverRes.hasFever
            ? `Fever: Yes (${feverRes.temperature}°F)`
            : `Fever: No (Normal ${feverRes.temperature}°F)`
        );
        playHapticSound("step");
      }
    } else if (step.id === "duration") {
      const duration = parseDurationFromText(text);
      if (duration !== null) {
        setAnswers((prev) => ({ ...prev, duration }));
        setDetectedValueLabel(`Duration: ${duration}`);
        playHapticSound("step");
      }
    } else if (step.id === "gender") {
      const gender = parseGenderFromText(text);
      if (gender !== null) {
        setAnswers((prev) => ({ ...prev, gender }));
        setDetectedValueLabel(`Gender: ${gender}`);
        playHapticSound("step");
      }
    } else if (step.id === "problem_details") {
      setAnswers((prev) => ({ ...prev, problemDetails: text }));
      const syms = extractSymptomsFromProblemText(text);
      setDetectedValueLabel(`Symptoms: ${syms.slice(0, 3).join(", ")}`);
    }
  };

  // Quick chip click
  const handleSelectChip = (chip: GuidedStepDefinition["chips"][0]) => {
    playHapticSound("click");
    const step = currentStep;

    if (step.id === "age") {
      setAnswers((prev) => ({ ...prev, age: chip.value }));
      setDetectedValueLabel(`Age: ${chip.value} Years`);
    } else if (step.id === "fever_temp") {
      setAnswers((prev) => ({
        ...prev,
        hasFever: chip.value.hasFever,
        temperature: chip.value.temp,
      }));
      setDetectedValueLabel(
        chip.value.hasFever
          ? `Fever: Yes (${chip.value.temp}°F)`
          : `No Fever (${chip.value.temp}°F)`
      );
    } else if (step.id === "duration") {
      setAnswers((prev) => ({ ...prev, duration: chip.value }));
      setDetectedValueLabel(`Duration: ${chip.value}`);
    } else if (step.id === "gender") {
      setAnswers((prev) => ({ ...prev, gender: chip.value }));
      setDetectedValueLabel(`Gender: ${chip.value}`);
    } else if (step.id === "problem_details") {
      setAnswers((prev) => ({
        ...prev,
        problemDetails: prev.problemDetails ? `${prev.problemDetails}, ${chip.value}` : chip.value,
      }));
      setDetectedValueLabel(`Added Complaint: ${chip.label}`);
    }

    if (chip.spokenText) {
      setLiveTranscript(chip.spokenText);
    }
  };

  // Step Navigation
  const handleNextStep = () => {
    stopListening();
    playHapticSound("step");

    if (currentStepIndex < GUIDED_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Finished all 5 steps! Compile structured output
      finalizeGuidedFlow();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      stopListening();
      playHapticSound("step");
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const finalizeGuidedFlow = () => {
    playHapticSound("success");
    stopListening();

    const finalAge = answers.age || 45;
    const finalGender = answers.gender || "Female";
    const finalTemp = answers.temperature || (answers.hasFever ? 102.0 : 98.6);
    const finalDuration = answers.duration || "2 days";
    const finalProblem =
      answers.problemDetails ||
      "Patient reports fever, weakness, and discomfort needing clinical evaluation.";

    const extractedSymptoms = extractSymptomsFromProblemText(finalProblem);
    if (answers.hasFever && !extractedSymptoms.includes("High Fever")) {
      extractedSymptoms.unshift("High Fever");
    }

    // Assemble comprehensive spoken narrative
    const rawNarrative = `Patient is a ${finalAge} year old ${finalGender}. ${
      answers.hasFever
        ? `Has high fever with body temperature recorded at ${finalTemp}°F`
        : `Body temperature is ${finalTemp}°F without high fever`
    }. Symptom duration is ${finalDuration}. Problem details: ${finalProblem}.`;

    onComplete({
      age: finalAge,
      gender: finalGender,
      temperature: finalTemp,
      symptomDuration: finalDuration,
      symptoms: extractedSymptoms,
      rawText: rawNarrative,
    });
  };

  // Current answer status preview
  const isCurrentStepAnswered = () => {
    if (currentStep.id === "age") return answers.age !== null;
    if (currentStep.id === "fever_temp") return answers.temperature !== null;
    if (currentStep.id === "duration") return Boolean(answers.duration);
    if (currentStep.id === "gender") return answers.gender !== null;
    if (currentStep.id === "problem_details") return Boolean(answers.problemDetails.trim());
    return false;
  };

  return (
    <div
      id="guided-voice-intake-card"
      className="bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-md text-white"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar: Step Progress Tracker */}
      <div className="relative z-10 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                GUIDED CLINICAL VOICE ENGINE
              </span>
              <h3 className="text-sm sm:text-base font-black text-white">
                Step {currentStep.stepNumber} of 5: {language === "hi" ? currentStep.labelHi : currentStep.labelEn}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TTS Audio narration toggle */}
            <button
              type="button"
              id="btn-toggle-voice-tts"
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-2 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all border ${
                ttsEnabled
                  ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-xs"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
              title={ttsEnabled ? "Voice prompts active (click to mute)" : "Voice prompts muted (click to unmute)"}
            >
              {ttsEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden sm:inline">{ttsEnabled ? "Voice Prompts ON" : "Muted"}</span>
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Switch to Freeform
              </button>
            )}
          </div>
        </div>

        {/* 5-Step Visual Stepper Bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {GUIDED_STEPS.map((step, idx) => {
            const isPassed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  setCurrentStepIndex(idx);
                }}
                className={`flex flex-col items-center p-1.5 sm:p-2 rounded-xl transition-all text-left border ${
                  isCurrent
                    ? "bg-cyan-950/90 border-cyan-400 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400"
                    : isPassed
                    ? "bg-slate-950/70 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center gap-1 w-full justify-between">
                  <span className="text-[10px] font-mono font-bold">
                    {isPassed ? "✓" : step.stepNumber}
                  </span>
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <span className="text-[10px] font-medium truncate w-full mt-0.5 hidden sm:inline">
                  {step.id === "age" && "Age"}
                  {step.id === "fever_temp" && "Fever/Temp"}
                  {step.id === "duration" && "Duration"}
                  {step.id === "gender" && "Gender"}
                  {step.id === "problem_details" && "Problem"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Voice Interaction Stage */}
      <div className="relative z-10 space-y-4">
        {/* System Question Prompt Card */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-slate-950 to-blue-950/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                <Radio className={`w-3.5 h-3.5 ${isSpeakingPrompt ? "animate-pulse text-amber-400" : ""}`} />
                <span>
                  {isSpeakingPrompt
                    ? "SPEAKING CLINICAL QUESTION..."
                    : "CLINICAL VOICE PROMPT"}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                {language === "hi" ? currentStep.questionHi : currentStep.questionEn}
              </h4>
              {language !== "hi" && (
                <p className="text-xs text-slate-400 italic">
                  {currentStep.questionHi}
                </p>
              )}
              <p className="text-[11px] text-cyan-300/80 mt-1">
                💡 {language === "hi" ? currentStep.instructionHi : currentStep.instructionEn}
              </p>
            </div>

            {/* Repeat Question TTS Button */}
            <button
              type="button"
              id="btn-repeat-step-question"
              onClick={() => {
                playHapticSound("click");
                speakQuestion(currentStep);
              }}
              className="p-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all shrink-0 hover:scale-105"
              title="Repeat question aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Patient Speech Input & Waveform Area */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-emerald-400"}`} />
              {isListening ? "PATIENT LISTENING SENSOR ACTIVE" : "MICROPHONE STANDBY"}
            </span>

            {detectedValueLabel && (
              <span className="bg-cyan-950 border border-cyan-500/50 text-cyan-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 animate-fadeIn">
                <Check className="w-3 h-3 text-cyan-400" />
                {detectedValueLabel}
              </span>
            )}
          </div>

          {/* Spoken Text / Live Transcript Box */}
          <div className="min-h-[50px] p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
              {liveTranscript
                ? `“${liveTranscript}”`
                : isListening
                ? "Listening... Speak your answer now"
                : "Tap the microphone below to speak your answer, or select a quick option."}
            </p>

            {/* Central Mic trigger button */}
            <button
              type="button"
              id={`btn-mic-step-${currentStep.id}`}
              onClick={toggleListening}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-lg cursor-pointer ${
                isListening
                  ? "bg-red-600 text-white ring-4 ring-red-400/40 animate-pulse"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-105"
              }`}
              title={isListening ? "Stop listening" : "Start speaking answer"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick-Response Options (One-Tap Voice Chips) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">
              ⚡ Quick 1-Tap Voice Answer Options:
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {currentStep.chips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectChip(chip)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500 rounded-xl text-xs font-medium transition-all hover:scale-105 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Structured Answer Summary Banner */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className={`p-2 rounded-xl border ${answers.age ? "bg-cyan-950/40 border-cyan-800 text-cyan-300" : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>
            <span className="text-[9px] font-mono block text-slate-400 uppercase">1. Age</span>
            <span className="font-bold">{answers.age ? `${answers.age} Yrs` : "--"}</span>
          </div>

          <div className={`p-2 rounded-xl border ${answers.temperature ? "bg-amber-950/40 border-amber-800 text-amber-300" : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>
            <span className="text-[9px] font-mono block text-slate-400 uppercase">2. Fever / Temp</span>
            <span className="font-bold">
              {answers.temperature ? `${answers.temperature}°F` : "--"}
            </span>
          </div>

          <div className={`p-2 rounded-xl border ${answers.duration ? "bg-blue-950/40 border-blue-800 text-blue-300" : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>
            <span className="text-[9px] font-mono block text-slate-400 uppercase">3. Duration</span>
            <span className="font-bold truncate block">{answers.duration || "--"}</span>
          </div>

          <div className={`p-2 rounded-xl border ${answers.gender ? "bg-indigo-950/40 border-indigo-800 text-indigo-300" : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>
            <span className="text-[9px] font-mono block text-slate-400 uppercase">4. Gender</span>
            <span className="font-bold">{answers.gender || "--"}</span>
          </div>

          <div className={`col-span-2 sm:col-span-1 p-2 rounded-xl border ${answers.problemDetails ? "bg-emerald-950/40 border-emerald-800 text-emerald-300" : "bg-slate-900/60 border-slate-800 text-slate-500"}`}>
            <span className="text-[9px] font-mono block text-slate-400 uppercase">5. Problem</span>
            <span className="font-bold truncate block">{answers.problemDetails ? "Recorded ✓" : "--"}</span>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            id="btn-guided-prev"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-guided-repeat"
              onClick={() => {
                playHapticSound("click");
                speakQuestion(currentStep);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium flex items-center gap-1 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repeat</span>
            </button>

            <button
              type="button"
              id="btn-guided-next"
              onClick={handleNextStep}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                currentStepIndex === GUIDED_STEPS.length - 1
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/30 scale-105"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20"
              }`}
            >
              <span>
                {currentStepIndex === GUIDED_STEPS.length - 1
                  ? "Finish & Extract Structured Data"
                  : "Confirm & Next Question"}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
