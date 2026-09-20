import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  PatientCase,
  RiskAssessment,
  SupportedLanguage,
  HealthcareFacility,
  ClinicalPreset,
  VitalsData,
} from "../../types";
import { IndianStateData } from "../../data/indianStates";
import { CLINICAL_PRESETS } from "../../data/clinicalPresets";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { evaluateClinicalRiskLocally, getDefaultFollowUpQuestions } from "../../utils/clinicalRules";
import { playHapticSound, speakClinicalPrompt, stopClinicalSpeech } from "../../utils/audioFeedback";
import { CaseAttachmentsManager } from "../Common/CaseAttachmentsManager";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  HeartPulse,
  Thermometer,
  Clock,
  MapPin,
  Phone,
  ShieldAlert,
  FileText,
  Send,
  Wifi,
  WifiOff,
  ChevronRight,
  User,
  Stethoscope,
  Layers,
  Ambulance,
  ArrowRight,
  Check,
  HelpCircle,
  X,
  Zap,
  Info,
  ExternalLink,
} from "lucide-react";

interface ClinicalIntakeWorkspaceProps {
  cases: PatientCase[];
  offlineQueue: PatientCase[];
  isOffline: boolean;
  onToggleOffline: () => void;
  onSyncOffline: () => void;
  isSyncing: boolean;
  currentState: IndianStateData;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onSaveCase: (caseData: PatientCase) => void;
  onSelectCaseForSlip: (caseData: PatientCase) => void;
  onTriggerEmergencySos: () => void;
  onNavigateDoctor: () => void;
}

// Available Languages for CHW Intake
const AVAILABLE_LANGUAGES: { code: SupportedLanguage; label: string; native: string }[] = [
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "en", label: "English", native: "English" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

// Common Clinical Symptoms Chips
const CLINICAL_SYMPTOMS_LIST = [
  { id: "High Fever", label: "High Fever", hi: "तेज बुखार" },
  { id: "Productive Cough", label: "Productive Cough", hi: "खांसी / कफ" },
  { id: "Severe Shortness of Breath", label: "Breathlessness", hi: "सांस फूलना" },
  { id: "Severe Throbbing Headache", label: "Severe Headache", hi: "तेज सिरदर्द" },
  { id: "Chest Tightness", label: "Chest Pain / Tightness", hi: "सीने में जकड़न" },
  { id: "Profuse Watery Diarrhea", label: "Watery Diarrhea", hi: "पतले दस्त" },
  { id: "Persistent Vomiting", label: "Vomiting", hi: "उल्टी" },
  { id: "Active Convulsions / Fits", label: "Convulsions / Fits", hi: "दौरे / झटके" },
  { id: "Vaginal Bleeding", label: "Vaginal Bleeding", hi: "रक्तस्राव" },
  { id: "Leaking Amniotic Fluid", label: "Water Broke / Leaking", hi: "पानी छूटना" },
  { id: "Facial and Ankle Swelling", label: "Face / Ankle Swelling", hi: "सूजन (चेहरा/पैर)" },
  { id: "Severe Abdominal Pain", label: "Abdominal Pain", hi: "पेट में तेज दर्द" },
  { id: "Extreme Lethargy", label: "Extreme Lethargy", hi: "अत्यधिक सुस्ती" },
  { id: "Blurred Vision", label: "Blurred Vision", hi: "धुंधला दिखना" },
  { id: "Fang bite marks on lower leg", label: "Snake / Insect Bite", hi: "सर्पदंश / कीड़े का काटना" },
  { id: "Chills and Rigors", label: "Chills & Shivering", hi: "कंपकंपी के साथ बुखार" },
];

const SYMPTOM_DURATIONS = [
  "1-2 hours",
  "Today (< 12 hrs)",
  "1-2 days",
  "3-5 days",
  "1-2 weeks",
  "> 2 weeks",
];

export const ClinicalIntakeWorkspace: React.FC<ClinicalIntakeWorkspaceProps> = ({
  cases,
  offlineQueue,
  isOffline,
  onToggleOffline,
  onSyncOffline,
  isSyncing,
  currentState,
  language,
  onLanguageChange,
  onSaveCase,
  onSelectCaseForSlip,
  onTriggerEmergencySos,
  onNavigateDoctor,
}) => {
  // Mobile active column tab ("queue" | "intake" | "summary")
  const [mobileTab, setMobileTab] = useState<"queue" | "intake" | "summary">("intake");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Column 1 state: search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "URGENT" | "CONSULTATION" | "ROUTINE">("ALL");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Column 2 state: Voice recording and speech parsing
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [audioWaveLevel, setAudioWaveLevel] = useState(0);
  const [extractBanner, setExtractBanner] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const waveIntervalRef = useRef<any>(null);

  // Active Patient Intake Draft Form State
  const [draftPatient, setDraftPatient] = useState<Partial<PatientCase>>({
    id: `case-${Date.now()}`,
    patientName: "",
    age: 28,
    gender: "Female",
    village: currentState.defaultVillage,
    chwName: currentState.ashaWorker,
    contactNumber: "",
    symptoms: ["High Fever"],
    symptomDuration: "1-2 days",
    rawVoiceInput: "",
    inputLanguage: language,
    vitals: {
      temperature: 98.6,
      heartRate: 78,
      spo2: 98,
      bpSystolic: 120,
      bpDiastolic: 80,
      respiratoryRate: 18,
      bloodSugar: 104,
    },
    isPregnant: false,
    pregnancyWeeks: undefined,
    followUpAnswers: {},
    riskLevel: "ROUTINE",
    riskScore: 15,
    dangerSigns: [],
    clinicalImpression: "Normal community baseline",
    recommendedAction: "Routine village follow-up and hygiene counseling",
    fieldStabilizingActions: [],
    status: "PENDING_REVIEW",
    createdAt: new Date().toISOString(),
  });

  // Dynamic Risk Evaluation for current draft
  const currentRiskAssessment: RiskAssessment = useMemo(() => {
    return evaluateClinicalRiskLocally(draftPatient);
  }, [draftPatient]);

  // Keep draftPatient risk in sync with local assessment
  useEffect(() => {
    setDraftPatient((prev) => {
      if (
        prev.riskLevel === currentRiskAssessment.riskLevel &&
        prev.riskScore === currentRiskAssessment.riskScore &&
        prev.dangerSigns?.length === currentRiskAssessment.dangerSigns.length
      ) {
        return prev;
      }
      return {
        ...prev,
        riskLevel: currentRiskAssessment.riskLevel,
        riskScore: currentRiskAssessment.riskScore,
        dangerSigns: currentRiskAssessment.dangerSigns,
        clinicalImpression: currentRiskAssessment.clinicalImpression,
        recommendedAction: currentRiskAssessment.recommendedAction,
        fieldStabilizingActions: currentRiskAssessment.fieldStabilizingActions,
        sbarSummary: currentRiskAssessment.sbarSummary,
      };
    });
  }, [currentRiskAssessment]);

  // Nearest Facility matching required level
  const nearestFacility = useMemo(() => {
    const facilities = MOCK_FACILITIES;
    if (facilities.length === 0) return null;
    const requiredType = currentRiskAssessment.requiredFacilityLevel;

    // First try exact match or higher acuity
    const exactMatch = facilities.find((f) => f.type === requiredType);
    if (exactMatch) return exactMatch;

    // Fallback to closest
    return [...facilities].sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [currentRiskAssessment.requiredFacilityLevel]);

  // Follow-up dynamic questions based on current symptoms & pregnancy
  const dynamicQuestions = useMemo(() => {
    return getDefaultFollowUpQuestions(draftPatient);
  }, [draftPatient.symptoms, draftPatient.isPregnant, draftPatient.age]);

  // -------------------------------------------------------------
  // Web Speech API / Voice Recording Engine
  // -------------------------------------------------------------
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === "hi" ? "hi-IN" : "en-IN";

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText.trim()) {
            setVoiceTranscript(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsRecording(false);
          clearInterval(waveIntervalRef.current);
        };

        recognition.onend = () => {
          setIsRecording(false);
          clearInterval(waveIntervalRef.current);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn("Speech recognition not supported in this environment");
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      clearInterval(waveIntervalRef.current);
    };
  }, [language]);

  const toggleRecording = () => {
    playHapticSound("click");
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsRecording(false);
      clearInterval(waveIntervalRef.current);
      if (voiceTranscript.trim()) {
        setTranscriptHistory((prev) => [voiceTranscript.trim(), ...prev.slice(0, 4)]);
      }
    } else {
      // Start recording
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // If already started or browser blocked, fallback simulation wave
        }
      }
      // Animate wave level
      waveIntervalRef.current = setInterval(() => {
        setAudioWaveLevel(Math.floor(Math.random() * 85) + 15);
      }, 120);
    }
  };

  // Sample voice prompts for testing/demonstration in rural contexts
  const handleLoadSampleVoice = (preset: ClinicalPreset) => {
    playHapticSound("click");
    setVoiceTranscript(preset.voiceSampleText);
    setTranscriptHistory((prev) => [preset.voiceSampleText, ...prev.slice(0, 4)]);
    handleExtractFromText(preset.voiceSampleText, preset.patientData);
  };

  // -------------------------------------------------------------
  // Speech to Structured Clinical Data Extractor
  // -------------------------------------------------------------
  const handleExtractFromText = (textToParse: string, presetFallback?: Partial<PatientCase>) => {
    playHapticSound("success");
    const text = (textToParse || voiceTranscript).toLowerCase();
    const updates: Partial<PatientCase> = {};
    const extractedItems: string[] = [];

    // 1. Age
    const ageMatch = text.match(/(?:age|उम्र|aged|years old|साल|वर्ष)\s*[:=]?\s*(\d{1,3})/i) ||
                     text.match(/(\d{1,3})\s*(?:years old|साल|वर्ष|yo\b)/i);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1], 10);
      if (parsedAge > 0 && parsedAge <= 110) {
        updates.age = parsedAge;
        extractedItems.push(`Age: ${parsedAge}Y`);
      }
    } else if (presetFallback?.age) {
      updates.age = presetFallback.age;
      extractedItems.push(`Age: ${presetFallback.age}Y`);
    }

    // 2. Gender
    if (text.includes("female") || text.includes("woman") || text.includes("महिला") || text.includes("लड़की") || text.includes("माता")) {
      updates.gender = "Female";
      extractedItems.push("Gender: Female");
    } else if (text.includes("male") || text.includes("man") || text.includes("पुरुष") || text.includes("लड़का") || text.includes("किसान")) {
      updates.gender = "Male";
      extractedItems.push("Gender: Male");
    } else if (presetFallback?.gender) {
      updates.gender = presetFallback.gender;
    }

    // 3. Pregnancy
    if (text.includes("pregnant") || text.includes("गर्भवती") || text.includes("गर्भ") || text.includes("primigravida")) {
      updates.isPregnant = true;
      updates.gender = "Female";
      const weeksMatch = text.match(/(\d{1,2})\s*(?:weeks|हफ्ते|सप्ताह)/i);
      if (weeksMatch) {
        updates.pregnancyWeeks = parseInt(weeksMatch[1], 10);
        extractedItems.push(`Pregnancy: ${weeksMatch[1]} weeks`);
      } else {
        updates.pregnancyWeeks = 28;
        extractedItems.push("Pregnancy: Active");
      }
    }

    // 4. Vitals Parsing (Temperature, SpO2, BP, Heart Rate)
    const newVitals: VitalsData = { ...(draftPatient.vitals || {
      temperature: 98.6,
      heartRate: 78,
      spo2: 98,
      bpSystolic: 120,
      bpDiastolic: 80,
    }) };

    // Temperature
    const tempMatch = text.match(/(\d{2,3}(?:\.\d)?)\s*(?:degrees?|deg|°f|f\b|डिग्री)/i) ||
                      text.match(/(?:temperature|बुखार|तापमान)\s*[:=]?\s*(\d{2,3}(?:\.\d)?)/i);
    if (tempMatch) {
      const t = parseFloat(tempMatch[1]);
      if (t >= 95 && t <= 108) {
        newVitals.temperature = t;
        extractedItems.push(`Temp: ${t}°F`);
      }
    } else if (presetFallback?.vitals?.temperature) {
      newVitals.temperature = presetFallback.vitals.temperature;
      extractedItems.push(`Temp: ${presetFallback.vitals.temperature}°F`);
    }

    // SpO2
    const spo2Match = text.match(/(?:spo2|oxygen|ऑक्सीजन)\s*[:=]?\s*(\d{2,3})/i) ||
                      text.match(/(\d{2,3})\s*%(?:\s*spo2|\s*oxygen)?/i);
    if (spo2Match) {
      const s = parseInt(spo2Match[1], 10);
      if (s >= 50 && s <= 100) {
        newVitals.spo2 = s;
        extractedItems.push(`SpO2: ${s}%`);
      }
    } else if (presetFallback?.vitals?.spo2) {
      newVitals.spo2 = presetFallback.vitals.spo2;
      extractedItems.push(`SpO2: ${presetFallback.vitals.spo2}%`);
    }

    // Blood Pressure (e.g. 164/106 or 164 over 106)
    const bpMatch = text.match(/(?:bp|blood pressure|रक्तचाप)?\s*(\d{2,3})\s*(?:\/|over|by)\s*(\d{2,3})/i);
    if (bpMatch) {
      const sys = parseInt(bpMatch[1], 10);
      const dia = parseInt(bpMatch[2], 10);
      if (sys > 60 && sys < 260 && dia > 40 && dia < 160) {
        newVitals.bpSystolic = sys;
        newVitals.bpDiastolic = dia;
        extractedItems.push(`BP: ${sys}/${dia}`);
      }
    } else if (presetFallback?.vitals?.bpSystolic) {
      newVitals.bpSystolic = presetFallback.vitals.bpSystolic;
      newVitals.bpDiastolic = presetFallback.vitals.bpDiastolic;
      extractedItems.push(`BP: ${presetFallback.vitals.bpSystolic}/${presetFallback.vitals.bpDiastolic}`);
    }

    // Heart Rate
    const hrMatch = text.match(/(?:pulse|heart rate|धड़कन)\s*[:=]?\s*(\d{2,3})/i);
    if (hrMatch) {
      const hr = parseInt(hrMatch[1], 10);
      if (hr >= 40 && hr <= 220) {
        newVitals.heartRate = hr;
        extractedItems.push(`HR: ${hr} bpm`);
      }
    } else if (presetFallback?.vitals?.heartRate) {
      newVitals.heartRate = presetFallback.vitals.heartRate;
    }

    // Respiratory Rate
    if (presetFallback?.vitals?.respiratoryRate) {
      newVitals.respiratoryRate = presetFallback.vitals.respiratoryRate;
    }

    updates.vitals = newVitals;

    // 5. Symptoms Extraction
    const detectedSymptoms: string[] = [];
    if (text.includes("fever") || text.includes("बुखार") || text.includes("ताप")) {
      detectedSymptoms.push("High Fever");
    }
    if (text.includes("breath") || text.includes("सांस") || text.includes("gasping") || text.includes("chest indrawing")) {
      detectedSymptoms.push("Severe Shortness of Breath");
    }
    if (text.includes("cough") || text.includes("खांसी") || text.includes("कफ")) {
      detectedSymptoms.push("Productive Cough");
    }
    if (text.includes("headache") || text.includes("सिरदर्द") || text.includes("सिर दर्द")) {
      detectedSymptoms.push("Severe Throbbing Headache");
    }
    if (text.includes("chest") || text.includes("सीने में दर्द") || text.includes("जकड़न")) {
      detectedSymptoms.push("Chest Tightness");
    }
    if (text.includes("diarrhea") || text.includes("दस्त") || text.includes("loose")) {
      detectedSymptoms.push("Profuse Watery Diarrhea");
    }
    if (text.includes("vomit") || text.includes("उल्टी")) {
      detectedSymptoms.push("Persistent Vomiting");
    }
    if (text.includes("convulsion") || text.includes("fit") || text.includes("seizure") || text.includes("दौरा")) {
      detectedSymptoms.push("Active Convulsions / Fits");
    }
    if (text.includes("bleeding") || text.includes("खून") || text.includes("रक्तस्राव")) {
      detectedSymptoms.push("Vaginal Bleeding");
    }
    if (text.includes("swelling") || text.includes("सूजन") || text.includes("puffy") || text.includes("edema")) {
      detectedSymptoms.push("Facial and Ankle Swelling");
    }
    if (text.includes("snake") || text.includes("सांप") || text.includes("डस") || text.includes("काट")) {
      detectedSymptoms.push("Fang bite marks on lower leg");
    }
    if (text.includes("blurred") || text.includes("धुंधला")) {
      detectedSymptoms.push("Blurred Vision");
    }
    if (text.includes("letharg") || text.includes("सुस्त") || text.includes("unconscious") || text.includes("बेहोश")) {
      detectedSymptoms.push("Extreme Lethargy");
    }

    if (detectedSymptoms.length > 0) {
      updates.symptoms = Array.from(new Set([...(draftPatient.symptoms || []), ...detectedSymptoms]));
      extractedItems.push(`Symptoms: ${detectedSymptoms.join(", ")}`);
    } else if (presetFallback?.symptoms) {
      updates.symptoms = presetFallback.symptoms;
      extractedItems.push(`Symptoms: ${presetFallback.symptoms.join(", ")}`);
    }

    // Name fallback or preset
    if (presetFallback?.patientName) {
      updates.patientName = presetFallback.patientName;
      extractedItems.push(`Name: ${presetFallback.patientName}`);
    } else if (!draftPatient.patientName) {
      // Try to parse name
      const nameMatch = text.match(/(?:patient name|नाम|मरीज का नाम|patient is)\s*(?:is)?\s*([a-zA-Z\u0900-\u097F\s]{2,25})/i);
      if (nameMatch && nameMatch[1].trim().length > 2) {
        updates.patientName = nameMatch[1].trim();
        extractedItems.push(`Name: ${nameMatch[1].trim()}`);
      }
    }

    if (presetFallback?.symptomDuration) {
      updates.symptomDuration = presetFallback.symptomDuration;
    }
    if (presetFallback?.followUpAnswers) {
      updates.followUpAnswers = presetFallback.followUpAnswers;
    }

    // Apply updates
    setDraftPatient((prev) => ({
      ...prev,
      ...updates,
      rawVoiceInput: textToParse || voiceTranscript,
    }));

    setExtractBanner(`Extracted ${extractedItems.length} clinical parameters: ${extractedItems.slice(0, 3).join(" • ")}`);
    setTimeout(() => setExtractBanner(null), 5000);
  };

  // -------------------------------------------------------------
  // Preset Selection & Reset Handlers
  // -------------------------------------------------------------
  const handleSelectPreset = (preset: ClinicalPreset) => {
    playHapticSound("click");
    setSelectedPresetId(preset.id);
    const evalResult = evaluateClinicalRiskLocally(preset.patientData);

    setDraftPatient({
      id: `case-${Date.now()}`,
      ...preset.patientData,
      chwName: currentState.ashaWorker,
      village: preset.patientData.village || currentState.defaultVillage,
      riskLevel: evalResult.riskLevel,
      riskScore: evalResult.riskScore,
      dangerSigns: evalResult.dangerSigns,
      clinicalImpression: evalResult.clinicalImpression,
      recommendedAction: evalResult.recommendedAction,
      fieldStabilizingActions: evalResult.fieldStabilizingActions,
      sbarSummary: evalResult.sbarSummary,
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    });

    setVoiceTranscript(preset.voiceSampleText);
    setMobileTab("intake");
  };

  const handleSelectExistingCase = (c: PatientCase) => {
    playHapticSound("click");
    setSelectedPresetId(null);
    setDraftPatient({ ...c });
    setVoiceTranscript(c.rawVoiceInput || "");
    setMobileTab("intake");
    setMobileDrawerOpen(false);
  };

  const handleNewPatientIntake = () => {
    playHapticSound("click");
    setSelectedPresetId(null);
    setVoiceTranscript("");
    setDraftPatient({
      id: `case-${Date.now()}`,
      patientName: "",
      age: 28,
      gender: "Female",
      village: currentState.defaultVillage,
      chwName: currentState.ashaWorker,
      contactNumber: "",
      symptoms: ["High Fever"],
      symptomDuration: "1-2 days",
      rawVoiceInput: "",
      inputLanguage: language,
      vitals: {
        temperature: 98.6,
        heartRate: 76,
        spo2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
        respiratoryRate: 18,
        bloodSugar: 102,
      },
      isPregnant: false,
      pregnancyWeeks: undefined,
      followUpAnswers: {},
      riskLevel: "ROUTINE",
      riskScore: 15,
      dangerSigns: [],
      clinicalImpression: "Normal baseline community screening",
      recommendedAction: "Continue routine monitoring and hygiene counseling",
      fieldStabilizingActions: [],
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    });
    setMobileTab("intake");
    setMobileDrawerOpen(false);
  };

  const handleToggleSymptom = (symptomId: string) => {
    playHapticSound("click");
    setDraftPatient((prev) => {
      const current = prev.symptoms || [];
      const updated = current.includes(symptomId)
        ? current.filter((s) => s !== symptomId)
        : [...current, symptomId];
      return { ...prev, symptoms: updated };
    });
  };

  const handleSaveAndQueue = (status: "RESOLVED" | "PENDING_REVIEW" = "PENDING_REVIEW") => {
    playHapticSound("success");
    const name = draftPatient.patientName?.trim() || `Patient #${draftPatient.id?.slice(-4) || "101"}`;
    const fullCase: PatientCase = {
      ...(draftPatient as PatientCase),
      patientName: name,
      id: draftPatient.id || `case-${Date.now()}`,
      status,
      createdAt: draftPatient.createdAt || new Date().toISOString(),
    };
    onSaveCase(fullCase);
    setExtractBanner(`Saved case for ${name} to ${isOffline ? "offline local queue" : "central register"}`);
    setTimeout(() => setExtractBanner(null), 4000);
  };

  // Filtered cases for Column 1
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.symptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      return c.riskLevel === statusFilter;
    });
  }, [cases, searchQuery, statusFilter]);

  // Vitals Normal/Abnormal Evaluator
  const getVitalStatus = (name: string, value: number, patient?: Partial<PatientCase>) => {
    switch (name) {
      case "temp":
        if (value >= 101) return { status: "DANGER", label: "High Fever" };
        if (value >= 99.6) return { status: "WARNING", label: "Mild Fever" };
        return { status: "NORMAL", label: "Normal (98.6°F)" };
      case "spo2":
        if (value < 90) return { status: "DANGER", label: "CRITICAL (<90%)" };
        if (value < 95) return { status: "WARNING", label: "Sub-optimal (<95%)" };
        return { status: "NORMAL", label: "Optimal (≥95%)" };
      case "bp": {
        const sys = patient?.vitals?.bpSystolic || 120;
        const dia = patient?.vitals?.bpDiastolic || 80;
        const isPreg = patient?.isPregnant;
        if (isPreg && (sys >= 160 || dia >= 105)) return { status: "DANGER", label: "ECLAMPSIA ALERT" };
        if (isPreg && (sys >= 140 || dia >= 90)) return { status: "WARNING", label: "Gestational HTN" };
        if (sys >= 180 || dia >= 110) return { status: "DANGER", label: "Hypertensive Crisis" };
        if (sys >= 140 || dia >= 90) return { status: "WARNING", label: "Stage 2 HTN" };
        if (sys < 90) return { status: "DANGER", label: "Hypotension / Shock" };
        return { status: "NORMAL", label: "Normal BP" };
      }
      case "hr": {
        const isPediatric = (patient?.age ?? 25) < 5;
        if (isPediatric) {
          if (value > 150) return { status: "DANGER", label: "Pediatric High" };
          if (value < 80) return { status: "DANGER", label: "Pediatric Low" };
          return { status: "NORMAL", label: "Normal (Pediatric)" };
        }
        if (value > 115) return { status: "DANGER", label: "Tachycardia" };
        if (value > 100) return { status: "WARNING", label: "Elevated" };
        if (value < 50) return { status: "DANGER", label: "Bradycardia" };
        return { status: "NORMAL", label: "Normal (60-100)" };
      }
      case "rr":
        if (value > 28) return { status: "DANGER", label: "Tachypnea (Severe)" };
        if (value > 22) return { status: "WARNING", label: "Elevated" };
        return { status: "NORMAL", label: "Normal (12-20)" };
      case "sugar":
        if (value >= 200) return { status: "DANGER", label: "Hyperglycemia" };
        if (value < 70) return { status: "DANGER", label: "Hypoglycemia" };
        if (value >= 140) return { status: "WARNING", label: "Elevated" };
        return { status: "NORMAL", label: "Normal (70-140)" };
      default:
        return { status: "NORMAL", label: "Normal" };
    }
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-[calc(100vh-4rem)] flex flex-col font-sans">
      {/* -------------------------------------------------------------
          CLINICAL INTAKE TOPBAR
          ------------------------------------------------------------- */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#123B78] flex items-center justify-center text-white shadow-xs">
            <HeartPulse className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                ASHA Clinical Intake Workspace
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                Voice-First AI
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>{currentState.stateNameOnly || currentState.name} Sub-Center</span>
              <span>•</span>
              <span className="font-medium text-slate-700">{currentState.ashaWorker}</span>
              <span>•</span>
              <span>Village: {currentState.defaultVillage}</span>
            </div>
          </div>
        </div>

        {/* Global Controls: Sync & Offline Status, Language, New Intake Button */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
          {/* Offline / Online indicator */}
          <div
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
              isOffline
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
            title="Click to toggle offline simulation mode"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline Mode ({offlineQueue.length} queued)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Online Connected</span>
              </>
            )}
          </div>

          {/* Offline Sync Button */}
          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={onSyncOffline}
              disabled={isSyncing || isOffline}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSyncing ? "Syncing..." : `Sync (${offlineQueue.length})`}</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              aria-label="Select Intake Language"
            >
              {AVAILABLE_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Quick SOS Trigger */}
          <button
            type="button"
            onClick={onTriggerEmergencySos}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">108 SOS</span>
          </button>
        </div>
      </div>

      {/* Notification Banner when Clinical Data is extracted */}
      {extractBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{extractBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setExtractBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          MOBILE SUB-NAVIGATION (Tab Switcher for 3 Columns)
          ------------------------------------------------------------- */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between sticky top-16 z-20">
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => setMobileTab("queue")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center ${
              mobileTab === "queue"
                ? "bg-[#123B78] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Cases & Presets ({filteredCases.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("intake")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
              mobileTab === "intake"
                ? "bg-[#123B78] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Voice Intake</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("summary")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
              mobileTab === "summary"
                ? "bg-[#123B78] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            <span>Decision</span>
            <span
              className={`w-2 h-2 rounded-full ${
                currentRiskAssessment.riskLevel === "URGENT"
                  ? "bg-red-500"
                  : currentRiskAssessment.riskLevel === "CONSULTATION"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          DESKTOP 3-COLUMN CLINICAL WORKSPACE
          Column 1 (25% / lg:col-span-3): Case Queue & Triage Presets
          Column 2 (50% / lg:col-span-6): Voice Clinical Intake & Form
          Column 3 (25% / lg:col-span-3): Patient Summary & Decision Support
          ------------------------------------------------------------- */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* =========================================================
              COLUMN 1: CASE QUEUE & TRIAGE (25% - lg:col-span-3)
              ========================================================= */}
          <div
            className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden ${
              mobileTab !== "queue" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Header + New Intake Button */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#123B78]" />
                  <h2 className="text-sm font-extrabold text-[#0F172A]">Case Queue</h2>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {filteredCases.length} total
                </span>
              </div>

              {/* + New Patient Intake Button */}
              <button
                type="button"
                onClick={handleNewPatientIntake}
                className="w-full py-2.5 px-3 rounded-xl bg-[#123B78] hover:bg-[#0c2b64] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Patient Intake</span>
              </button>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, village, symptom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[11px] font-bold">
                {(["ALL", "URGENT", "CONSULTATION", "ROUTINE"] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setStatusFilter(filterKey)}
                    className={`flex-1 py-1 rounded-md transition-all text-center cursor-pointer ${
                      statusFilter === filterKey
                        ? filterKey === "URGENT"
                          ? "bg-red-100 text-red-800"
                          : filterKey === "CONSULTATION"
                          ? "bg-amber-100 text-amber-800"
                          : filterKey === "ROUTINE"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-800 text-white"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {filterKey === "ALL" ? "All" : filterKey.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Existing Cases */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2">
              {filteredCases.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No matching patients found.
                </div>
              ) : (
                filteredCases.map((c) => {
                  const isSelected = draftPatient.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectExistingCase(c)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all text-xs space-y-1 ${
                        isSelected
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F172A] truncate max-w-[140px]">
                          {c.patientName}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.riskLevel === "URGENT"
                              ? "bg-red-100 text-red-800"
                              : c.riskLevel === "CONSULTATION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {c.riskLevel}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {c.age}Y • {c.gender}
                        </span>
                        <span className="truncate max-w-[110px]">{c.village}</span>
                      </div>

                      <div className="text-[11px] text-slate-600 line-clamp-1">
                        {c.symptoms.slice(0, 2).join(", ") || "Routine Intake"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Clinical Scenario Presets Section */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Clinical Scenario Presets</span>
                </div>
                <span className="text-[10px] text-slate-400">1-click test</span>
              </div>

              <div className="space-y-1.5">
                {CLINICAL_PRESETS.map((preset) => {
                  const isCurrent = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-2 border ${
                        isCurrent
                          ? "bg-white border-[#2563EB] shadow-xs ring-1 ring-[#2563EB]"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          preset.targetRisk === "URGENT"
                            ? "bg-red-500"
                            : preset.targetRisk === "CONSULTATION"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#0F172A] truncate">
                          {preset.title}
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* =========================================================
              COLUMN 2: VOICE CLINICAL INTAKE & LIVE FORM (50% - lg:col-span-6)
              ========================================================= */}
          <div
            className={`lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col p-5 sm:p-6 space-y-6 ${
              mobileTab !== "intake" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* ---------------------------------------------------------
                2.1 VOICE-FIRST GUIDED INTAKE PANEL
                --------------------------------------------------------- */}
            <div className="rounded-2xl bg-gradient-to-b from-blue-50/70 to-cyan-50/40 p-4 sm:p-5 border border-blue-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A]">
                      Conversational Voice Intake
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Speak in Hindi, English, or regional languages. AI structures fields automatically.
                    </p>
                  </div>
                </div>

                {/* Audio readout toggle */}
                <button
                  type="button"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer ${
                    ttsEnabled
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Toggle Voice Prompts Readout"
                >
                  {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">Voice TTS</span>
                </button>
              </div>

              {/* Center Mic Button with Pulsing Wave */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="relative flex items-center justify-center">
                  {/* Outer pulse wave */}
                  {isRecording && (
                    <span className="absolute w-20 h-20 rounded-full bg-red-400 opacity-40 animate-ping" />
                  )}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-md transition-all transform active:scale-95 cursor-pointer ${
                      isRecording
                        ? "bg-red-600 hover:bg-red-700 ring-4 ring-red-200"
                        : "bg-[#123B78] hover:bg-[#0c2b64] ring-4 ring-blue-100"
                    }`}
                    aria-label={isRecording ? "Stop voice intake" : "Start voice intake"}
                  >
                    {isRecording ? (
                      <MicOff className="w-7 h-7 animate-pulse" />
                    ) : (
                      <Mic className="w-7 h-7 text-[#06B6D4]" />
                    )}
                  </button>
                </div>

                <div className="flex-1 w-full text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold text-[#0F172A]">
                      {isRecording ? "Listening to Patient / CHW..." : "Click Mic to Begin Speaking"}
                    </span>
                    {isRecording && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        LIVE MIC
                      </span>
                    )}
                  </div>

                  {/* Sound wave visualizer */}
                  {isRecording ? (
                    <div className="flex items-center justify-center sm:justify-start gap-1 h-5 py-1">
                      {[15, 35, 60, 85, 45, 20, 75, 90, 50, 30].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#2563EB] rounded-full transition-all duration-100"
                          style={{
                            height: `${Math.max(4, (audioWaveLevel * (i % 2 === 0 ? 1 : 0.6)) / 3)}px`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Example: <em>"23 वर्ष की गर्भवती महिला, सिरदर्द, बीपी 164/106 और आंखों में धुंधलापन है"</em>
                    </p>
                  )}
                </div>
              </div>

              {/* Real-Time Transcript Display Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Voice Speech Transcript:</span>
                  <span className="text-[10px] text-slate-500">
                    Language: {language.toUpperCase()}
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={voiceTranscript}
                  onChange={(e) => setVoiceTranscript(e.target.value)}
                  placeholder="Speech transcript will appear here in real time... or you can edit/type directly."
                  className="w-full text-xs text-[#0F172A] font-medium bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder-slate-400"
                />

                {/* Trigger: Extract & Auto-Fill Clinical Data */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleExtractFromText(voiceTranscript)}
                      disabled={!voiceTranscript.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Extract & Auto-Fill Clinical Data</span>
                    </button>

                    {voiceTranscript && (
                      <button
                        type="button"
                        onClick={() => setVoiceTranscript("")}
                        className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Sample Voice Quick Injectors */}
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>Quick test:</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleVoice(CLINICAL_PRESETS[0])}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      SpO2 88%
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleVoice(CLINICAL_PRESETS[1])}
                      className="text-[#2563EB] font-bold hover:underline cursor-pointer"
                    >
                      BP 164/106
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------
                2.2 PATIENT DEMOGRAPHICS (Manual Entry Fallback)
                --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#0F172A] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2563EB]" />
                  <span>1. Patient Demographics</span>
                </h4>
                <span className="text-[11px] text-slate-400">Structured Data</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={draftPatient.patientName || ""}
                    onChange={(e) => setDraftPatient({ ...draftPatient, patientName: e.target.value })}
                    placeholder="e.g. Pooja Meena"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={draftPatient.age ?? ""}
                    onChange={(e) => setDraftPatient({ ...draftPatient, age: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Gender *</label>
                  <select
                    value={draftPatient.gender || "Female"}
                    onChange={(e) => setDraftPatient({ ...draftPatient, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-white"
                  >
                    <option value="Female">Female (महिला)</option>
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Other">Other (अन्य)</option>
                  </select>
                </div>

                {/* Village / Location */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Village / Hamlet</label>
                  <input
                    type="text"
                    value={draftPatient.village || ""}
                    onChange={(e) => setDraftPatient({ ...draftPatient, village: e.target.value })}
                    placeholder={currentState.defaultVillage}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Phone / Mobile</label>
                  <input
                    type="text"
                    value={draftPatient.contactNumber || ""}
                    onChange={(e) => setDraftPatient({ ...draftPatient, contactNumber: e.target.value })}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Pregnancy Status + Gestational Weeks */}
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold block">Pregnancy Status</label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        checked={draftPatient.isPregnant || false}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            isPregnant: e.target.checked,
                            gender: "Female",
                            pregnancyWeeks: e.target.checked ? draftPatient.pregnancyWeeks || 24 : undefined,
                          })
                        }
                        className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Pregnant</span>
                    </label>

                    {draftPatient.isPregnant && (
                      <input
                        type="number"
                        min={1}
                        max={42}
                        placeholder="Weeks"
                        value={draftPatient.pregnancyWeeks || ""}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            pregnancyWeeks: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 font-semibold"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------
                2.3 CHIEF COMPLAINTS & SYMPTOMS CHIPS
                --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  <span>2. Chief Symptoms & Duration</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Duration:</span>
                  <select
                    value={draftPatient.symptomDuration || "1-2 days"}
                    onChange={(e) => setDraftPatient({ ...draftPatient, symptomDuration: e.target.value })}
                    className="bg-slate-100 rounded-lg text-xs font-semibold px-2 py-1 border border-slate-200"
                  >
                    {SYMPTOM_DURATIONS.map((dur) => (
                      <option key={dur} value={dur}>
                        {dur}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Symptom selector chips */}
              <div className="flex flex-wrap gap-2">
                {CLINICAL_SYMPTOMS_LIST.map((sym) => {
                  const isSelected = (draftPatient.symptoms || []).includes(sym.id);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => handleToggleSymptom(sym.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? "bg-[#123B78] text-white border-[#123B78] shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-[#06B6D4]" />}
                      <span>{sym.label}</span>
                      <span className="text-[10px] opacity-70">({sym.hi})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---------------------------------------------------------
                2.4 VITALS ENTRY GRID WITH INSTANT BADGES
                --------------------------------------------------------- */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-[#2563EB]" />
                  <span>3. Vitals Entry Grid (Live Validation)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Instant WHO IMCI Validation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Temperature */}
                {(() => {
                  const val = draftPatient.vitals?.temperature || 98.6;
                  const vStat = getVitalStatus("temp", val, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Temperature (°F)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={draftPatient.vitals?.temperature ?? 98.6}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            vitals: {
                              ...(draftPatient.vitals as VitalsData),
                              temperature: parseFloat(e.target.value) || 98.6,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                      />
                    </div>
                  );
                })()}

                {/* 2. SpO2 */}
                {(() => {
                  const val = draftPatient.vitals?.spo2 || 98;
                  const vStat = getVitalStatus("spo2", val, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Oxygen SpO2 (%)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <input
                        type="number"
                        min={50}
                        max={100}
                        value={draftPatient.vitals?.spo2 ?? 98}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            vitals: {
                              ...(draftPatient.vitals as VitalsData),
                              spo2: parseInt(e.target.value, 10) || 98,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                      />
                    </div>
                  );
                })()}

                {/* 3. Blood Pressure (Systolic / Diastolic) */}
                {(() => {
                  const vStat = getVitalStatus("bp", draftPatient.vitals?.bpSystolic || 120, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Blood Pressure (BP)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Sys"
                          value={draftPatient.vitals?.bpSystolic ?? 120}
                          onChange={(e) =>
                            setDraftPatient({
                              ...draftPatient,
                              vitals: {
                                ...(draftPatient.vitals as VitalsData),
                                bpSystolic: parseInt(e.target.value, 10) || 120,
                              },
                            })
                          }
                          className="w-1/2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                        />
                        <span className="text-slate-400 font-bold">/</span>
                        <input
                          type="number"
                          placeholder="Dia"
                          value={draftPatient.vitals?.bpDiastolic ?? 80}
                          onChange={(e) =>
                            setDraftPatient({
                              ...draftPatient,
                              vitals: {
                                ...(draftPatient.vitals as VitalsData),
                                bpDiastolic: parseInt(e.target.value, 10) || 80,
                              },
                            })
                          }
                          className="w-1/2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Heart Rate */}
                {(() => {
                  const val = draftPatient.vitals?.heartRate || 78;
                  const vStat = getVitalStatus("hr", val, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Heart Rate (bpm)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={draftPatient.vitals?.heartRate ?? 78}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            vitals: {
                              ...(draftPatient.vitals as VitalsData),
                              heartRate: parseInt(e.target.value, 10) || 78,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                      />
                    </div>
                  );
                })()}

                {/* 5. Respiratory Rate */}
                {(() => {
                  const val = draftPatient.vitals?.respiratoryRate || 18;
                  const vStat = getVitalStatus("rr", val, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Respiratory Rate (/min)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={draftPatient.vitals?.respiratoryRate ?? 18}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            vitals: {
                              ...(draftPatient.vitals as VitalsData),
                              respiratoryRate: parseInt(e.target.value, 10) || 18,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                      />
                    </div>
                  );
                })()}

                {/* 6. Blood Sugar */}
                {(() => {
                  const val = draftPatient.vitals?.bloodSugar || 104;
                  const vStat = getVitalStatus("sugar", val, draftPatient);
                  return (
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Blood Sugar (mg/dL)</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            vStat.status === "DANGER"
                              ? "bg-red-100 text-red-800"
                              : vStat.status === "WARNING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {vStat.label}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={draftPatient.vitals?.bloodSugar ?? 104}
                        onChange={(e) =>
                          setDraftPatient({
                            ...draftPatient,
                            vitals: {
                              ...(draftPatient.vitals as VitalsData),
                              bloodSugar: parseInt(e.target.value, 10) || 104,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-[#0F172A]"
                      />
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ---------------------------------------------------------
                2.5 DYNAMIC CLINICAL FOLLOW-UP QUESTIONS
                --------------------------------------------------------- */}
            {dynamicQuestions.length > 0 && (
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-600" />
                    <span>Dynamic Clinical Follow-ups (Symptom Triggered)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    {dynamicQuestions.length} Questions
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dynamicQuestions.map((q) => {
                    const currentAnswer = (draftPatient.followUpAnswers || {})[q.question];
                    return (
                      <div key={q.id} className="bg-white p-3 rounded-lg border border-amber-100 space-y-2 text-xs">
                        <div className="font-bold text-slate-800">
                          {q.question}
                          {q.hindiTranslation && (
                            <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                              {q.hindiTranslation}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => {
                            const isSelected = currentAnswer === opt;
                            const isDanger = opt === q.dangerSignAnswer;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  playHapticSound("click");
                                  const updatedAnswers = {
                                    ...(draftPatient.followUpAnswers || {}),
                                    [q.question]: opt,
                                  };
                                  setDraftPatient({
                                    ...draftPatient,
                                    followUpAnswers: updatedAnswers,
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  isSelected
                                    ? isDanger
                                      ? "bg-red-600 text-white border-red-600"
                                      : "bg-[#123B78] text-white border-[#123B78]"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------
                2.6 ACTION BUTTONS: EVALUATE, SAVE DRAFT, CLEAR
                --------------------------------------------------------- */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playHapticSound("success");
                    setMobileTab("summary");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Evaluate Clinical Risk & Triage</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndQueue("PENDING_REVIEW")}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  Save Draft
                </button>
              </div>

              <button
                type="button"
                onClick={handleNewPatientIntake}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
            </div>
          </div>

          {/* =========================================================
              COLUMN 3: PATIENT SUMMARY & CLINICAL DECISION SUPPORT (25% - lg:col-span-3)
              ========================================================= */}
          <div
            className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col p-5 space-y-5 ${
              mobileTab !== "summary" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#123B78]" />
                <h3 className="text-sm font-extrabold text-[#0F172A]">
                  Clinical Decision Support
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Autonomous</span>
            </div>

            {/* 3.1 LIVE CLINICAL RISK GAUGE / METER */}
            <div
              className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                currentRiskAssessment.riskLevel === "URGENT"
                  ? "bg-red-50/80 border-red-200 text-red-950"
                  : currentRiskAssessment.riskLevel === "CONSULTATION"
                  ? "bg-amber-50/80 border-amber-200 text-amber-950"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              }`}
            >
              <div className="text-[11px] font-extrabold tracking-wider uppercase opacity-80">
                Risk Score Meter
              </div>

              {/* Numerical score & tier badge */}
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black font-mono tracking-tight">
                  {currentRiskAssessment.riskScore}
                </span>
                <span className="text-xs font-bold opacity-60">/ 100</span>
              </div>

              {/* Progress bar visual gauge */}
              <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    currentRiskAssessment.riskLevel === "URGENT"
                      ? "bg-red-600"
                      : currentRiskAssessment.riskLevel === "CONSULTATION"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, currentRiskAssessment.riskScore))}%` }}
                />
              </div>

              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  currentRiskAssessment.riskLevel === "URGENT"
                    ? "bg-red-600 text-white"
                    : currentRiskAssessment.riskLevel === "CONSULTATION"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {currentRiskAssessment.riskLevel} TIER
              </div>
            </div>

            {/* 3.2 DANGER SIGNS IDENTIFIED */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                  <span>Identified Danger Signs</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {currentRiskAssessment.dangerSigns.length}
                </span>
              </div>

              {currentRiskAssessment.dangerSigns.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 text-center">
                  No acute danger signs detected. Vitals within safe threshold.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {currentRiskAssessment.dangerSigns.map((ds, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{ds}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3.3 CLINICAL IMPRESSION & WHO IMCI GUIDANCE */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Clinical Impression</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-medium">
                {currentRiskAssessment.clinicalImpression}
              </div>
            </div>

            {/* 3.4 IMMEDIATE FIELD ACTIONS */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Immediate Field Actions</span>
              </div>
              <ul className="space-y-1.5">
                {currentRiskAssessment.fieldStabilizingActions.map((action, i) => (
                  <li
                    key={i}
                    className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-emerald-950 font-medium text-[11px] flex items-start gap-1.5"
                  >
                    <span className="font-bold text-emerald-700">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3.5 SBAR CLINICAL REFERRAL SUMMARY */}
            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>SBAR Summary</span>
                <span className="text-[10px] text-slate-400 font-normal">Standardized Protocol</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                <div>
                  <strong className="text-slate-800">S:</strong>{" "}
                  <span className="text-slate-600">{currentRiskAssessment.sbarSummary.situation}</span>
                </div>
                <div>
                  <strong className="text-slate-800">B:</strong>{" "}
                  <span className="text-slate-600">{currentRiskAssessment.sbarSummary.background}</span>
                </div>
                <div>
                  <strong className="text-slate-800">A:</strong>{" "}
                  <span className="text-slate-600">{currentRiskAssessment.sbarSummary.assessment}</span>
                </div>
                <div>
                  <strong className="text-slate-800">R:</strong>{" "}
                  <span className="text-slate-600">{currentRiskAssessment.sbarSummary.recommendation}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic Files, Lab Reports & ECG Traces */}
            {draftPatient.id && (
              <CaseAttachmentsManager
                caseId={draftPatient.id}
                attachments={draftPatient.attachments || []}
              />
            )}

            {/* 3.6 NEAREST FACILITY MATCH & ROUTE PREVIEW */}
            {nearestFacility && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Nearest Matched Facility</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#2563EB]">
                    {nearestFacility.distanceKm} km (~{nearestFacility.travelTimeMins}m)
                  </span>
                </div>

                <div className="font-extrabold text-[#0F172A] text-xs">
                  {nearestFacility.name}
                </div>
                <div className="text-[11px] text-slate-600">
                  Type: {nearestFacility.type}
                </div>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {nearestFacility.hasOxygen && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                      O₂ Supply
                    </span>
                  )}
                  {nearestFacility.hasAmbulance24x7 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      24x7 Ambulance
                    </span>
                  )}
                  {nearestFacility.hasCSection && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                      C-Section / OT
                    </span>
                  )}
                </div>

                {/* Emergency Hotline Button */}
                <a
                  href={`tel:${nearestFacility.emergencyHotline || "108"}`}
                  className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-center block text-[11px] shadow-2xs mt-1"
                >
                  Call Hotline: {nearestFacility.emergencyHotline || "108"}
                </a>
              </div>
            )}

            {/* 3.7 ACTION BUTTONS: REFERRAL SLIP, DOCTOR TELE-CONSULT, SYNC */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              {/* Generate Referral Slip & QR */}
              <button
                type="button"
                onClick={() => {
                  playHapticSound("success");
                  const fullCase: PatientCase = {
                    ...(draftPatient as PatientCase),
                    patientName: draftPatient.patientName?.trim() || "Patient",
                    id: draftPatient.id || `case-${Date.now()}`,
                    status: currentRiskAssessment.riskLevel === "ROUTINE" ? "RESOLVED" : "PENDING_REVIEW",
                    createdAt: draftPatient.createdAt || new Date().toISOString(),
                  };
                  onSaveCase(fullCase);
                  onSelectCaseForSlip(fullCase);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#123B78] hover:bg-[#0c2b64] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#06B6D4]" />
                <span>Generate Referral Slip & QR</span>
              </button>

              {/* Send to Doctor Tele-Consult */}
              <button
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  handleSaveAndQueue("PENDING_REVIEW");
                  onNavigateDoctor();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563EB] border border-blue-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send to Doctor Tele-Consult</span>
              </button>

              {/* Offline Sync Trigger */}
              <button
                type="button"
                onClick={() => handleSaveAndQueue("PENDING_REVIEW")}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isOffline ? "Queue Case Offline" : "Save to Patient Registry"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
