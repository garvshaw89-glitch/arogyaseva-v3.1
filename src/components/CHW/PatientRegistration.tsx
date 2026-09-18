import React, { useState, useEffect } from "react";
import { SupportedLanguage, PatientCase, VitalsData } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  AlertCircle,
  Baby,
  User,
  MapPin,
  Calendar,
  HeartPulse,
  Clock,
  CheckCircle,
  FileText,
  HelpCircle,
  ArrowRight,
  Radio,
  Layers
} from "lucide-react";
import { playHapticSound, speakClinicalPrompt } from "../../utils/audioFeedback";
import { VoiceIntake3D } from "./VoiceIntake3D";
import { LocationSearchInput } from "../Common/LocationSearchInput";

interface PatientRegistrationProps {
  formData: Partial<PatientCase>;
  onChange: (updated: Partial<PatientCase>) => void;
  onProceedToVitals: () => void;
  language: SupportedLanguage;
  isOffline: boolean;
}

export const PatientRegistration: React.FC<PatientRegistrationProps> = ({
  formData,
  onChange,
  onProceedToVitals,
  language,
  isOffline,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState(formData.rawVoiceInput || "");
  const [isExtracting, setIsExtracting] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);
  const [newSymptomInput, setNewSymptomInput] = useState("");

  const commonSymptoms = [
    "High Fever",
    "Severe Cough",
    "Shortness of Breath",
    "Severe Headache",
    "Chest Pain",
    "Watery Diarrhea",
    "Persistent Vomiting",
    "Snakebite",
    "Swelling in Feet",
    "Blurred Vision",
    "Dizziness / Weakness",
    "Abdominal Cramps"
  ];

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langCodeMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        bn: "bn-IN",
        ta: "ta-IN",
        te: "te-IN",
        gu: "gu-IN",
        kn: "kn-IN",
        ml: "ml-IN",
        pa: "pa-IN",
        or: "or-IN",
        as: "as-IN",
        ur: "ur-IN",
        mai: "mai-IN",
        sa: "sa-IN",
        kok: "kok-IN",
        ne: "ne-NP",
        doi: "doi-IN",
        ks: "ks-IN",
        mni: "mni-IN",
        brx: "brx-IN",
        sat: "sat-IN",
        sd: "sd-IN",
      };
      recognition.lang = langCodeMap[language] || "hi-IN";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
    } else {
      setSpeechSupported(false);
    }
  }, [language]);

  useEffect(() => {
    if (formData.rawVoiceInput !== undefined) {
      setVoiceText(formData.rawVoiceInput);
    }
  }, [formData.rawVoiceInput]);

  const toggleListening = () => {
    if (!recognitionInstance) {
      alert("Microphone voice input is simulated or unsupported in this browser sandbox. You can type or use the scenario presets!");
      return;
    }
    if (isListening) {
      recognitionInstance.stop();
      setIsListening(false);
    } else {
      try {
        recognitionInstance.start();
        setIsListening(true);
      } catch (err) {
        console.error("Start speech error:", err);
      }
    }
  };

  const handleExtractFromText = async (textToExtract?: string) => {
    const targetText = textToExtract || voiceText;
    if (!targetText || !targetText.trim()) return;

    setIsExtracting(true);
    try {
      if (isOffline) {
        const localExtracted = extractLocally(targetText);
        applyExtractedData(localExtracted, targetText);
      } else {
        const response = await fetch("/api/extract-symptoms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: targetText, language }),
        });
        const result = await response.json();
        if (result.success && result.data) {
          applyExtractedData(result.data, targetText);
        } else {
          const localExtracted = extractLocally(targetText);
          applyExtractedData(localExtracted, targetText);
        }
      }
    } catch (err) {
      console.warn("Extraction failed, using local parser:", err);
      const localExtracted = extractLocally(targetText);
      applyExtractedData(localExtracted, targetText);
    } finally {
      setIsExtracting(false);
    }
  };

  const extractLocally = (text: string) => {
    const ageMatch = text.match(/([0-9]{1,2})\s*(?:years?|साल|वर्ष|yr)/i);
    const age = ageMatch ? parseInt(ageMatch[1], 10) : (formData.age || 35);
    const isFemale = /female|महिला|woman|girl|गर्भवती|स्त्री/i.test(text);
    const isPregnant = /pregnant|गर्भवती|गर्भ/i.test(text);

    const symptoms: string[] = [];
    if (/fever|बुखार|ताप/i.test(text)) symptoms.push("High Fever");
    if (/breath|सांस|cough|खांसी/i.test(text)) symptoms.push("Severe Shortness of Breath");
    if (/headache|सिरदर्द/i.test(text)) symptoms.push("Severe Headache");
    if (/vomit|उल्टी/i.test(text)) symptoms.push("Persistent Vomiting");
    if (/diarrhea|दस्त/i.test(text)) symptoms.push("Watery Diarrhea");
    if (/snake|सांप/i.test(text)) symptoms.push("Snakebite");
    if (/chest|सीने/i.test(text)) symptoms.push("Chest Pain");

    const spo2Match = text.match(/(?:spo2|oxygen|ऑक्सीजन)[\s:=]*([0-9]{2})/i);
    const tempMatch = text.match(/(?:temp|तापमान)[\s:=]*([0-9]{2,3})/i);
    const bpMatch = text.match(/(?:bp|blood pressure)[\s:=]*([0-9]{2,3})/i);

    return {
      age,
      gender: isFemale ? "Female" : "Male",
      isPregnant,
      symptoms: symptoms.length > 0 ? symptoms : (formData.symptoms || ["General Malaise"]),
      duration: "2-3 days",
      vitalsMentioned: {
        spo2: spo2Match ? parseInt(spo2Match[1], 10) : undefined,
        temperature: tempMatch ? parseFloat(tempMatch[1]) : undefined,
        bpSystolic: bpMatch ? parseInt(bpMatch[1], 10) : undefined,
      }
    };
  };

  const applyExtractedData = (data: any, originalText: string) => {
    const updatedVitals: VitalsData = {
      ...(formData.vitals || {
        temperature: 98.6,
        heartRate: 78,
        spo2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
      }),
      ...(data.vitalsMentioned?.temperature ? { temperature: data.vitalsMentioned.temperature } : {}),
      ...(data.vitalsMentioned?.spo2 ? { spo2: data.vitalsMentioned.spo2 } : {}),
      ...(data.vitalsMentioned?.bpSystolic ? { bpSystolic: data.vitalsMentioned.bpSystolic } : {}),
      ...(data.vitalsMentioned?.heartRate ? { heartRate: data.vitalsMentioned.heartRate } : {}),
      ...(data.vitalsMentioned?.respiratoryRate ? { respiratoryRate: data.vitalsMentioned.respiratoryRate } : {}),
    };

    const combinedSymptoms = Array.from(
      new Set([...(formData.symptoms || []), ...(data.symptoms || [])])
    );

    onChange({
      ...formData,
      age: data.age || formData.age || 35,
      gender: (data.gender as any) || formData.gender || "Male",
      symptoms: combinedSymptoms.length > 0 ? combinedSymptoms : ["General Malaise"],
      symptomDuration: data.duration || formData.symptomDuration || "2 days",
      isPregnant: data.isPregnant ?? formData.isPregnant ?? false,
      pregnancyWeeks: data.pregnancyWeeks || formData.pregnancyWeeks,
      vitals: updatedVitals,
      rawVoiceInput: originalText,
      inputLanguage: language,
    });
  };

  const toggleSymptom = (sym: string) => {
    const current = formData.symptoms || [];
    if (current.includes(sym)) {
      onChange({ symptoms: current.filter((s) => s !== sym) });
    } else {
      onChange({ symptoms: [...current, sym] });
    }
  };

  const addCustomSymptom = () => {
    if (!newSymptomInput.trim()) return;
    const current = formData.symptoms || [];
    if (!current.includes(newSymptomInput.trim())) {
      onChange({ symptoms: [...current, newSymptomInput.trim()] });
    }
    setNewSymptomInput("");
  };

  const handleVoiceExtracted = (extracted: {
    patientName?: string;
    age?: number;
    gender?: "Male" | "Female" | "Other";
    symptoms: string[];
    symptomDuration: string;
    temperature?: number;
    rawText: string;
  }) => {
    const isRespiratory =
      extracted.rawText.toLowerCase().includes("breath") ||
      extracted.rawText.toLowerCase().includes("saans") ||
      extracted.rawText.toLowerCase().includes("shortness");

    onChange({
      patientName: extracted.patientName || formData.patientName,
      age: extracted.age ?? formData.age,
      gender: extracted.gender ?? formData.gender,
      symptoms: extracted.symptoms.length > 0 ? extracted.symptoms : formData.symptoms,
      symptomDuration: extracted.symptomDuration || formData.symptomDuration,
      rawVoiceInput: extracted.rawText,
      vitals: {
        ...(formData.vitals as VitalsData),
        temperature: extracted.temperature ?? formData.vitals?.temperature ?? 102.0,
        spo2: isRespiratory ? 88 : formData.vitals?.spo2 ?? 98,
        heartRate: isRespiratory ? 112 : formData.vitals?.heartRate ?? 76,
        respiratoryRate: isRespiratory ? 28 : formData.vitals?.respiratoryRate ?? 18,
      },
    });
  };

  const handleVoiceEntryPatientName = () => {
    playHapticSound("click");
    const promptText =
      language === "hi"
        ? "कृपया मरीज का पूरा नाम बताएं"
        : "Please speak the patient's full name";
    speakClinicalPrompt(promptText, language);

    // Scroll smoothly to voice engine
    const voiceCard = document.getElementById("guided-voice-intake-card");
    if (voiceCard) {
      voiceCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div id="patient-registration-step" className="space-y-6">
      {/* 1. Signature 3D Voice Intake & Live AI Extraction HUD */}
      <VoiceIntake3D
        onDataExtracted={handleVoiceExtracted}
        language={language}
        currentRawText={formData.rawVoiceInput}
        initialPatientName={formData.patientName}
      />

      {/* 2. Structured Patient Form Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Patient Identity & Demographic Records
          </h3>
          <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full font-bold">
            Syncs with Voice Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Patient Name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                {t.patientName} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                id="btn-patient-name-voice-entry"
                onClick={handleVoiceEntryPatientName}
                className="text-[10px] text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Click to speak patient name prompt"
              >
                <Volume2 className="w-2.5 h-2.5" />
                <span>Voice Entry</span>
              </button>
            </div>
            <input
              id="input-patient-name"
              type="text"
              value={formData.patientName || ""}
              onChange={(e) => onChange({ patientName: e.target.value })}
              placeholder="e.g. Rajesh Kumar"
              className="w-full text-sm font-semibold text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Age */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              {t.age} <span className="text-red-500">*</span>
            </label>
            <input
              id="input-patient-age"
              type="number"
              min={0}
              max={120}
              value={formData.age !== undefined ? formData.age : ""}
              onChange={(e) => onChange({ age: parseInt(e.target.value, 10) || 0 })}
              placeholder="Years (e.g. 52)"
              className="w-full text-sm font-semibold text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              {t.gender}
            </label>
            <select
              id="select-patient-gender"
              value={formData.gender || "Male"}
              onChange={(e) => onChange({ gender: e.target.value as any })}
              className="w-full text-sm font-semibold text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="Male">Male (पुरुष)</option>
              <option value="Female">Female (महिला)</option>
              <option value="Other">Other (अन्य)</option>
            </select>
          </div>

          {/* Village & Sub-Centre Location Autocomplete */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-slate-400 font-bold uppercase">
                {t.village} / Sub-Centre
              </label>
              <span className="text-[10px] text-blue-600 font-medium">
                Live GPS / Search
              </span>
            </div>
            <LocationSearchInput
              id="input-patient-village"
              value={formData.village || ""}
              placeholder="Search village, sub-centre, or tap GPS..."
              showCurrentLocationOption={true}
              onChange={(villageName, coords) => {
                if (coords) {
                  onChange({
                    village: villageName,
                    villageLatitude: coords.latitude,
                    villageLongitude: coords.longitude,
                  });
                } else {
                  onChange({ village: villageName });
                }
              }}
            />
          </div>
        </div>

        {/* Pregnancy Toggle */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Baby className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-xs font-bold text-slate-800">
                {t.pregnantMother}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Enables maternal danger flags (Preeclampsia, severe hypertension, gestational distress)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center cursor-pointer">
              <input
                id="toggle-pregnancy"
                type="checkbox"
                checked={formData.isPregnant || false}
                onChange={(e) => onChange({ isPregnant: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>

            {formData.isPregnant && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Weeks:</span>
                <input
                  id="input-pregnancy-weeks"
                  type="number"
                  min={1}
                  max={42}
                  value={formData.pregnancyWeeks || 28}
                  onChange={(e) => onChange({ pregnancyWeeks: parseInt(e.target.value, 10) || 28 })}
                  className="w-16 text-xs font-bold px-2 py-1 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Symptoms Selection & Chips */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-400 font-bold uppercase">
              Reported Symptoms & Danger Indicators <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-medium">
              Tap chips to toggle
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {commonSymptoms.map((sym) => {
              const active = (formData.symptoms || []).includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => toggleSymptom(sym)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 font-semibold shadow-xs"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {active ? `✓ ${sym}` : `+ ${sym}`}
                </button>
              );
            })}
          </div>

          {/* Custom Symptom Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSymptomInput}
              onChange={(e) => setNewSymptomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSymptom())}
              placeholder="Add other symptom (e.g. skin rash, convulsion)..."
              className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addCustomSymptom}
              className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg font-semibold"
            >
              Add
            </button>
          </div>

          {/* Duration */}
          <div className="pt-2">
            <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
              {t.duration}
            </label>
            <input
              id="input-symptom-duration"
              type="text"
              value={formData.symptomDuration || "2 days"}
              onChange={(e) => onChange({ symptomDuration: e.target.value })}
              placeholder="e.g. 3 days, since yesterday, 2 weeks"
              className="w-full sm:w-1/2 text-sm font-semibold text-slate-800 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Proceed Button */}
      <div className="flex justify-end pt-2">
        <button
          id="btn-proceed-to-vitals"
          onClick={onProceedToVitals}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 transition-all hover:gap-3"
        >
          <span>Next: Record Clinical Vitals</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
