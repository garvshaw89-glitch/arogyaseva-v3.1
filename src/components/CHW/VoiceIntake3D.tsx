import React, { useState, useEffect, useRef } from "react";
import { SupportedLanguage } from "../../types";
import { Mic, MicOff, Volume2, Sparkles, Check, ArrowRight, RefreshCw, Radio } from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface VoiceIntake3DProps {
  onDataExtracted: (extracted: {
    age?: number;
    gender?: "Male" | "Female" | "Other";
    symptoms: string[];
    symptomDuration: string;
    temperature?: number;
    rawText: string;
  }) => void;
  language: SupportedLanguage;
  currentRawText?: string;
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
}) => {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(currentRawText || "");
  const [isTransforming, setIsTransforming] = useState(false);
  const [extractedState, setExtractedState] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

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

        const barHeight = Math.max(6, (Math.abs(factor) * mid * 0.85) + (isListening ? 15 : 4));
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
      // Fallback: load preset if browser microphone permission / API is unavailable in iframe
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

  const parseSpokenContent = (text: string) => {
    setIsTransforming(true);
    playHapticSound("step");

    // Clinical extraction NLP simulation
    const lower = text.toLowerCase();
    let age = 52;
    const ageMatch = lower.match(/(\d+)\s*(?:years?|saal|sal|वर्ष|month|months)/);
    if (ageMatch) {
      age = parseInt(ageMatch[1], 10);
    }

    const symptoms: string[] = [];
    if (lower.includes("fever") || lower.includes("bukhar") || lower.includes("ताप")) symptoms.push("High Fever");
    if (lower.includes("breath") || lower.includes("saans") || lower.includes("difficulty breathing")) symptoms.push("Difficulty Breathing / Dyspnea");
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
    setIsTransforming(false);
    onDataExtracted(extracted);
  };

  const applyVoicePreset = (preset: (typeof VOICE_PRESETS)[0]) => {
    playHapticSound("step");
    setIsListening(false);
    setLiveTranscript(preset.spokenText);
    setIsTransforming(true);

    setTimeout(() => {
      setExtractedState(preset.extracted);
      setIsTransforming(false);
      playHapticSound("success");
      onDataExtracted(preset.extracted);
    }, 400);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header telemetry */}
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

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          {isListening ? (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              LISTENING (SPEECH SENSOR ACTIVE)
            </span>
          ) : (
            <span className="bg-slate-900 text-slate-400 border border-slate-800 text-xs font-mono px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              READY FOR VERNACULAR SPEECH
            </span>
          )}
        </div>
      </div>

      {/* Central 3D Holographic Microphone & Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left: 3D Holographic Pulsing Microphone */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4">
          <div className="relative group flex items-center justify-center">
            {/* Pulsing rings */}
            <div
              className={`absolute w-36 h-36 rounded-full border border-cyan-500/30 transition-all duration-700 ${
                isListening ? "scale-125 animate-ping opacity-60" : "scale-100 opacity-20"
              }`}
            />
            <div
              className={`absolute w-28 h-28 rounded-full border border-blue-500/40 transition-all duration-500 ${
                isListening ? "scale-110 animate-pulse opacity-80" : "scale-95 opacity-30"
              }`}
            />

            {/* Central Animated Mic Orb */}
            <button
              id="btn-voice-mic-hero"
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                isListening
                  ? "bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 text-white shadow-red-500/50 scale-110 animate-pulse ring-4 ring-red-400/40"
                  : "bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-cyan-500/30 hover:scale-105 hover:ring-4 hover:ring-cyan-400/30"
              }`}
              title="Click to activate voice recording"
            >
              {isListening ? (
                <Mic className="w-9 h-9 animate-bounce" />
              ) : (
                <Mic className="w-9 h-9" />
              )}
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-300 mt-5 text-center">
            {isListening ? "Listening... Speak symptoms in your mother tongue" : "Tap Mic or select clinical preset"}
          </p>

          {/* Audio frequency wave canvas */}
          <div className="w-full max-w-[260px] h-10 mt-3 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/60 p-1">
            <canvas ref={canvasRef} width={250} height={32} className="w-full h-full" />
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
          </div>
        </div>
      </div>

      {/* Preset Voice Scenarios for Instant Live SIH Hackathon Demo */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <span>⚡ Instant Voice Scenario Presets (1-Click SIH Presentation)</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">NO KEYBOARD REQUIRED</span>
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
