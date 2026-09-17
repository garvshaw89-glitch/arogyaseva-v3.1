/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  PatientCase,
  SupportedLanguage,
  RiskAssessment,
  VitalsData,
  ClinicalPreset,
  HealthcareFacility
} from "./types";
import { Header } from "./components/Common/Header";
import { ScenarioQuickSelector } from "./components/CHW/ScenarioQuickSelector";
import { PatientRegistration } from "./components/CHW/PatientRegistration";
import { VitalsEntry } from "./components/CHW/VitalsEntry";
import { IntelligentFollowup } from "./components/CHW/IntelligentFollowup";
import { RiskAssessmentView } from "./components/CHW/RiskAssessmentView";
import { FacilityLocator } from "./components/CHW/FacilityLocator";
import { ReferralSlipModal } from "./components/CHW/ReferralSlipModal";
import { DoctorDashboard } from "./components/Doctor/DoctorDashboard";
import { ReferralReportPDFModal } from "./components/Doctor/ReferralReportPDFModal";
import { EmergencySosModal } from "./components/Common/EmergencySosModal";
import { PatientJourney3D } from "./components/Common/PatientJourney3D";
import { ClinicalRiskEngine3D } from "./components/CHW/ClinicalRiskEngine3D";
import { ReferralMap3D } from "./components/CHW/ReferralMap3D";
import { LiveLocationTracker } from "./components/CHW/LiveLocationTracker";
import {
  loadLocalCases,
  saveLocalCases,
  addOrUpdateLocalCase,
  loadOfflineQueue,
  syncOfflineQueueWithServer,
} from "./utils/offlineStorage";
import { evaluateClinicalRiskLocally } from "./utils/clinicalRules";
import { TRANSLATIONS } from "./utils/translations";
import { CinematicHero } from "./components/Common/CinematicHero";
import { playHapticSound } from "./utils/audioFeedback";
import { acquireLiveLocation, getCachedLiveLocation } from "./utils/geolocationHelper";
import { motion, AnimatePresence } from "motion/react";
import {
  UserPlus,
  Activity,
  HelpCircle,
  ShieldAlert,
  Hospital,
  CheckCircle,
  WifiOff,
  RefreshCw,
  Sparkles,
  Compass,
  Radio,
  Printer,
  FileText,
  Siren,
} from "lucide-react";

export default function App() {
  const [role, setRole] = useState<"CHW" | "DOCTOR">("CHW");
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);

  const [patientData, setPatientData] = useState<Partial<PatientCase>>(() => {
    const cached = getCachedLiveLocation();
    return {
      patientName: "",
      age: 35,
      gender: "Male",
      village: cached?.villageName || "",
      villageLatitude: cached?.latitude,
      villageLongitude: cached?.longitude,
      chwName: "Anjali Devi (ASHA)",
      symptoms: ["High Fever", "Severe Shortness of Breath"],
      symptomDuration: "3 days",
      rawVoiceInput: "",
      vitals: {
        temperature: 102.4,
        heartRate: 112,
        spo2: 88,
        bpSystolic: 136,
        bpDiastolic: 88,
        respiratoryRate: 28,
      },
      isPregnant: false,
      followUpAnswers: {},
    };
  });

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [completedCase, setCompletedCase] = useState<PatientCase | null>(null);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showPdfReportModal, setShowPdfReportModal] = useState<boolean>(false);
  const [pdfReportCase, setPdfReportCase] = useState<PatientCase | null>(null);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showCinematicHero, setShowCinematicHero] = useState<boolean>(true);

  const [casesList, setCasesList] = useState<PatientCase[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<PatientCase[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showLiveTracker, setShowLiveTracker] = useState<boolean>(false);
  const [step5ViewMode, setStep5ViewMode] = useState<"locator" | "map">("locator");

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    loadInitialData();

    // Pan-India Automatic Live Location Detection on App Start
    acquireLiveLocation()
      .then((loc) => {
        if (loc && loc.villageName) {
          setPatientData((prev) => {
            // Only populate if village was not manually set by user
            if (!prev.village || prev.village.includes("Rampur")) {
              return {
                ...prev,
                village: loc.villageName,
                villageLatitude: loc.latitude,
                villageLongitude: loc.longitude,
              };
            }
            return {
              ...prev,
              villageLatitude: prev.villageLatitude || loc.latitude,
              villageLongitude: prev.villageLongitude || loc.longitude,
            };
          });
        }
      })
      .catch(() => {
        // Handled silently if browser permission not yet given
      });
  }, []);

  const loadInitialData = async () => {
    const local = loadLocalCases();
    if (local.length > 0) {
      setCasesList(local);
    }

    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.cases)) {
          setCasesList(data.cases);
          saveLocalCases(data.cases);
        }
      }
    } catch {
      console.log("Working in offline mode from local store");
    }

    setOfflineQueue(loadOfflineQueue());
  };

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    try {
      const { syncedCount } = await syncOfflineQueueWithServer();
      setOfflineQueue(loadOfflineQueue());
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        if (data.cases) setCasesList(data.cases);
      }
      if (syncedCount > 0) {
        alert(`Successfully synced ${syncedCount} offline case(s) with Central Health System!`);
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectPreset = (preset: ClinicalPreset) => {
    setSelectedPresetId(preset.id);
    setPatientData((prev) => ({
      ...prev,
      ...preset.patientData,
      rawVoiceInput: preset.voiceSampleText,
      inputLanguage: preset.language,
    }));
    setCurrentStep(1);
    setAssessment(null);
  };

  const handleNewAssessment = () => {
    setSelectedPresetId(undefined);
    const cached = getCachedLiveLocation();
    setPatientData({
      patientName: "",
      age: 30,
      gender: "Male",
      village: cached?.villageName || "",
      villageLatitude: cached?.latitude,
      villageLongitude: cached?.longitude,
      chwName: "Anjali Devi (ASHA)",
      symptoms: [],
      symptomDuration: "1-2 days",
      rawVoiceInput: "",
      vitals: {
        temperature: 98.6,
        heartRate: 75,
        spo2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
      },
      isPregnant: false,
      followUpAnswers: {},
    });
    setAssessment(null);
    setCurrentStep(1);
    setRole("CHW");
  };

  const handleUpdatePatientData = (updated: Partial<PatientCase>) => {
    setPatientData((prev) => ({ ...prev, ...updated }));
  };

  const handleFollowUpAnswer = (question: string, answer: string) => {
    setPatientData((prev) => ({
      ...prev,
      followUpAnswers: {
        ...(prev.followUpAnswers || {}),
        [question]: answer,
      },
    }));
  };

  const handleCalculateAssessment = async () => {
    if (isOfflineMode) {
      const localResult = evaluateClinicalRiskLocally(patientData);
      setAssessment(localResult);
      setCurrentStep(4);
    } else {
      try {
        const response = await fetch("/api/assess-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patientData),
        });
        const result = await response.json();
        if (result.success && result.assessment) {
          setAssessment(result.assessment);
        } else {
          setAssessment(evaluateClinicalRiskLocally(patientData));
        }
      } catch {
        setAssessment(evaluateClinicalRiskLocally(patientData));
      }
      setCurrentStep(4);
    }
  };

  const handleSaveRoutineCase = async () => {
    if (!assessment) return;

    const newCase: PatientCase = {
      id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientData.patientName || "Village Resident",
      age: patientData.age || 30,
      gender: (patientData.gender as any) || "Male",
      village: patientData.village || "Local Area",
      villageLatitude: patientData.villageLatitude,
      villageLongitude: patientData.villageLongitude,
      chwName: patientData.chwName || "Anjali Devi (ASHA)",
      contactNumber: patientData.contactNumber,
      symptoms: patientData.symptoms || ["General Malaise"],
      symptomDuration: patientData.symptomDuration || "2 days",
      rawVoiceInput: patientData.rawVoiceInput,
      inputLanguage: language,
      vitals: patientData.vitals as VitalsData,
      isPregnant: patientData.isPregnant,
      pregnancyWeeks: patientData.pregnancyWeeks,
      followUpAnswers: patientData.followUpAnswers || {},
      riskLevel: "ROUTINE",
      riskScore: assessment.riskScore,
      dangerSigns: assessment.dangerSigns || [],
      clinicalImpression: assessment.clinicalImpression,
      recommendedAction: assessment.recommendedAction,
      sbarSummary: assessment.sbarSummary,
      fieldStabilizingActions: assessment.fieldStabilizingActions || [],
      status: "RESOLVED",
      createdAt: new Date().toISOString(),
    };

    addOrUpdateLocalCase(newCase, isOfflineMode);
    setCasesList((prev) => [newCase, ...prev.filter((c) => c.id !== newCase.id)]);
    setOfflineQueue(loadOfflineQueue());

    if (!isOfflineMode) {
      try {
        await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCase),
        });
      } catch (err) {
        console.error("Save routine case server error:", err);
      }
    }

    alert("Routine case registered and logged locally under ASHA home care guidelines!");
    handleNewAssessment();
  };

  const handleSelectFacilityAndGenerateSlip = async (facility: HealthcareFacility) => {
    if (!assessment) return;

    const newCase: PatientCase = {
      id: `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patientData.patientName || "Emergency Patient",
      age: patientData.age || 40,
      gender: (patientData.gender as any) || "Male",
      village: patientData.village || "Local Area",
      villageLatitude: patientData.villageLatitude,
      villageLongitude: patientData.villageLongitude,
      chwName: patientData.chwName || "Anjali Devi (ASHA)",
      contactNumber: patientData.contactNumber,
      symptoms: patientData.symptoms || ["Acute Symptoms"],
      symptomDuration: patientData.symptomDuration || "Recent",
      rawVoiceInput: patientData.rawVoiceInput,
      inputLanguage: language,
      vitals: patientData.vitals as VitalsData,
      isPregnant: patientData.isPregnant,
      pregnancyWeeks: patientData.pregnancyWeeks,
      followUpAnswers: patientData.followUpAnswers || {},
      riskLevel: assessment.riskLevel,
      riskScore: assessment.riskScore,
      dangerSigns: assessment.dangerSigns || [],
      clinicalImpression: assessment.clinicalImpression,
      recommendedAction: assessment.recommendedAction,
      sbarSummary: assessment.sbarSummary,
      fieldStabilizingActions: assessment.fieldStabilizingActions || [],
      referredFacility: {
        id: facility.id,
        name: facility.name,
        type: facility.type,
        distanceKm: facility.distanceKm,
      },
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    };

    addOrUpdateLocalCase(newCase, isOfflineMode);
    setCasesList((prev) => [newCase, ...prev.filter((c) => c.id !== newCase.id)]);
    setOfflineQueue(loadOfflineQueue());
    setCompletedCase(newCase);
    setShowReferralModal(true);

    if (!isOfflineMode) {
      try {
        await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCase),
        });
      } catch (err) {
        console.error("Save referral case server error:", err);
      }
    }
  };

  const handleUpdateCaseFromDoctor = async (caseId: string, updates: Partial<PatientCase>) => {
    setCasesList((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, ...updates } : c))
    );

    const found = casesList.find((c) => c.id === caseId);
    if (found) {
      addOrUpdateLocalCase({ ...found, ...updates }, false);
    }

    try {
      await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Update case error:", err);
    }
  };

  const handleTriggerEmergencySos = () => {
    playHapticSound("alert");
    const sosCaseId = `SOS-${Date.now().toString().slice(-5)}`;
    const emergencyCase: PatientCase = {
      id: sosCaseId,
      patientName: "Emergency 1-Tap SOS Patient",
      age: patientData.age || 40,
      gender: patientData.gender || "Other",
      village: patientData.village || "Rampur Village (Auto-Located)",
      villageLatitude: patientData.villageLatitude || 22.8115,
      villageLongitude: patientData.villageLongitude || 77.7845,
      contactNumber: "108 Emergency Control CAD",
      chwName: patientData.chwName || "Anjali Devi (ASHA)",
      symptoms: ["Critical Life Threat", "Rapid 1-Tap SOS Triggered"],
      symptomDuration: "Immediate / Acute",
      rawVoiceInput: "Rapid one-tap 108 Emergency Ambulance dispatch triggered from header, bypassing standard intake workflows.",
      vitals: {
        temperature: 98.6,
        heartRate: 118,
        spo2: 86,
        bpSystolic: 146,
        bpDiastolic: 94,
        respiratoryRate: 28,
      },
      isPregnant: patientData.isPregnant || false,
      riskLevel: "URGENT",
      riskScore: 98,
      dangerSigns: [
        "Rapid one-tap 108 Emergency Ambulance alert",
        "Immediate ALS transit dispatched",
        "Standard field triage workflow bypassed",
      ],
      clinicalImpression: "Acute Emergency: 108 ALS Ambulance dispatched via rapid one-tap bypass.",
      recommendedAction: "Emergency ALS ambulance transfer to nearest District Emergency Trauma Center.",
      sbarSummary: {
        situation: `ONE-TAP EMERGENCY SOS: Ambulance 108 dispatched to ${patientData.village || "Rampur"}. Standard intake workflow bypassed.`,
        background: "Frontline health worker triggered direct emergency ambulance alert for acute life threat.",
        assessment: "Unstable / Acute Life Threatening Emergency requiring advanced airway and emergency room resuscitation.",
        recommendation: "Emergency Department alert: Prepare trauma resuscitation bay, ALS stretcher, and on-call Emergency Medical Officer.",
      },
      fieldStabilizingActions: [
        "High-flow 100% Oxygen support via non-rebreather mask",
        "Keep patient in 30° head-elevated left lateral position",
        "Continuous SpO2 and hemodynamic monitoring until ALS arrives",
      ],
      followUpAnswers: {
        urgent_sos_note: "1-Tap rapid ambulance bypass triggered by frontline worker.",
      },
      referredFacility: {
        id: "dh-district-emergency",
        name: "District Emergency Trauma Center",
        type: "District Hospital (DH)",
        distanceKm: 8.5,
      },
      status: "DISPATCHED",
      createdAt: new Date().toISOString(),
    };

    setCasesList((prev) => [emergencyCase, ...prev]);
    setCompletedCase(emergencyCase);
    setPdfReportCase(emergencyCase);
    setShowSosModal(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-200">
      {/* Header with Professional Polish */}
      <Header
        currentRole={role}
        onRoleChange={setRole}
        language={language}
        onLanguageChange={setLanguage}
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode(!isOfflineMode)}
        offlineQueue={offlineQueue}
        onSyncOfflineQueue={handleSyncOffline}
        isSyncing={isSyncing}
        onNewAssessment={handleNewAssessment}
        onTriggerEmergencySos={handleTriggerEmergencySos}
        onOpenLiveTracker={() => {
          playHapticSound("click");
          setShowLiveTracker(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {role === "CHW" ? (
          <div>
            {/* Cinematic 3D Telemetry HUD & Hero */}
            {showCinematicHero && (
              <CinematicHero
                currentRisk={assessment?.riskLevel || "ROUTINE"}
                onQuickStart={() => {
                  playHapticSound("click");
                  setCurrentStep(1);
                  const el = document.getElementById("chw-workflow-stepper");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                onExploreDoctorPortal={() => {
                  playHapticSound("click");
                  setRole("DOCTOR");
                }}
                language={language}
                isOffline={isOfflineMode}
              />
            )}

            {/* Toggle bar for 3D Hero */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-600 font-semibold tracking-wide uppercase text-[11px]">
                  CHW Frontline Workflow & Triage Mesh
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  setShowCinematicHero(!showCinematicHero);
                }}
                className="text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showCinematicHero ? "Collapse Telemetry HUD" : "Expand Telemetry HUD"}</span>
              </button>
            </div>

            {/* 1. Quick Scenario Selector */}
            <ScenarioQuickSelector
              onSelectPreset={handleSelectPreset}
              selectedPresetId={selectedPresetId}
              language={language}
            />

            {/* 3D Dynamic Clinical Pathway Pipeline */}
            <div className="mb-4">
              <PatientJourney3D
                currentStage={
                  role === "DOCTOR"
                    ? "doctor"
                    : currentStep === 1
                    ? "patient"
                    : currentStep === 2
                    ? "chw"
                    : currentStep === 3
                    ? "assessment"
                    : currentStep === 4
                    ? "risk"
                    : "referral"
                }
                riskLevel={assessment?.riskLevel || "ROUTINE"}
                onSelectStage={(stage) => {
                  if (stage === "patient") { setRole("CHW"); setCurrentStep(1); }
                  else if (stage === "chw") { setRole("CHW"); setCurrentStep(2); }
                  else if (stage === "assessment") { setRole("CHW"); setCurrentStep(3); }
                  else if (stage === "risk") { if (assessment) { setRole("CHW"); setCurrentStep(4); } }
                  else if (stage === "referral") { if (assessment) { setRole("CHW"); setCurrentStep(5); } }
                  else if (stage === "doctor") { setRole("DOCTOR"); }
                }}
              />
            </div>

            {/* 2. Step Stepper with Professional Polish */}
            <div id="chw-workflow-stepper" className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: "1. Patient Info", shortLabel: "Patient", icon: UserPlus },
                  { step: 2, label: "2. Vitals", shortLabel: "Vitals", icon: Activity },
                  { step: 3, label: "3. Danger Signs", shortLabel: "Danger Signs", icon: HelpCircle },
                  { step: 4, label: "4. Risk Triage", shortLabel: "Risk Triage", icon: ShieldAlert },
                  { step: 5, label: "5. Referral & Facility", shortLabel: "Referral", icon: Hospital },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentStep === item.step;
                  const isPast = currentStep > item.step;

                  return (
                    <button
                      key={item.step}
                      onClick={() => {
                        if (item.step < currentStep || (item.step === 4 && assessment)) {
                          playHapticSound("step");
                          setCurrentStep(item.step);
                        }
                      }}
                      className={`relative flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-0.5 sm:px-2 md:px-3 rounded-xl text-center transition-all duration-300 ${
                        isActive
                          ? "text-blue-700 font-bold bg-blue-50/90 border border-blue-300 ring-2 ring-blue-500/20 shadow-xs scale-[1.02]"
                          : isPast
                          ? "text-slate-600 hover:text-blue-700 hover:bg-slate-50 cursor-pointer"
                          : "text-slate-400 cursor-not-allowed opacity-75"
                      }`}
                    >
                      <div className="relative flex items-center justify-center shrink-0">
                        {isActive && (
                          <span className="absolute -inset-0.5 rounded-full bg-blue-500/40 animate-ping" />
                        )}
                        <div
                          className={`relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/40"
                              : isPast
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isPast ? "✓" : item.step}
                        </div>
                      </div>
                      <span className="text-[11px] lg:text-xs truncate hidden sm:inline font-medium transition-colors duration-200">
                        <span className="hidden lg:inline">{item.label}</span>
                        <span className="lg:hidden">{item.shortLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Step Transitions with AnimatePresence */}
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <PatientRegistration
                    formData={patientData}
                    onChange={handleUpdatePatientData}
                    onProceedToVitals={() => {
                      playHapticSound("step");
                      setCurrentStep(2);
                    }}
                    language={language}
                    isOffline={isOfflineMode}
                  />
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <VitalsEntry
                    vitals={
                      patientData.vitals || {
                        temperature: 98.6,
                        heartRate: 75,
                        spo2: 98,
                        bpSystolic: 120,
                        bpDiastolic: 80,
                      }
                    }
                    patientData={patientData}
                    onChange={(updatedVitals) => handleUpdatePatientData({ vitals: updatedVitals })}
                    onBack={() => {
                      playHapticSound("step");
                      setCurrentStep(1);
                    }}
                    onProceedToFollowUp={() => {
                      playHapticSound("step");
                      setCurrentStep(3);
                    }}
                    language={language}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <IntelligentFollowup
                    patientData={patientData}
                    answers={patientData.followUpAnswers || {}}
                    onAnswerChange={handleFollowUpAnswer}
                    onBack={() => {
                      playHapticSound("step");
                      setCurrentStep(2);
                    }}
                    onProceedToAssessment={handleCalculateAssessment}
                    language={language}
                    isOffline={isOfflineMode}
                  />
                </motion.div>
              )}

              {currentStep === 4 && assessment && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <ClinicalRiskEngine3D
                    assessment={assessment}
                    patientData={patientData}
                    onProceedToFacilities={() => {
                      playHapticSound("step");
                      setCurrentStep(5);
                    }}
                    onSaveRoutineCase={handleSaveRoutineCase}
                    onBack={() => {
                      playHapticSound("step");
                      setCurrentStep(3);
                    }}
                    language={language}
                  />
                </motion.div>
              )}

              {currentStep === 5 && assessment && (
                <motion.div
                  key="step-5"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Step 5 View Toggle */}
                  <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        Referral Navigation Mode:
                      </span>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        onClick={() => {
                          playHapticSound("click");
                          setStep5ViewMode("locator");
                        }}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          step5ViewMode === "locator"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Hospital className="w-3.5 h-3.5" />
                        <span>OSM Facility Locator & Radar</span>
                      </button>
                      <button
                        onClick={() => {
                          playHapticSound("click");
                          setStep5ViewMode("map");
                        }}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                          step5ViewMode === "map"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Referral Trajectory Map</span>
                      </button>
                    </div>
                  </div>

                  {step5ViewMode === "locator" ? (
                    <FacilityLocator
                      assessment={assessment}
                      patientData={patientData}
                      onSelectFacilityAndGenerateSlip={handleSelectFacilityAndGenerateSlip}
                      onBack={() => {
                        playHapticSound("step");
                        setCurrentStep(4);
                      }}
                      language={language}
                    />
                  ) : (
                    <ReferralMap3D
                      assessment={assessment}
                      patientData={patientData}
                      onSelectFacilityAndGenerateSlip={handleSelectFacilityAndGenerateSlip}
                      onBack={() => {
                        playHapticSound("step");
                        setCurrentStep(4);
                      }}
                      language={language}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Doctor Hospital Dashboard */
          <DoctorDashboard
            cases={casesList}
            onUpdateCase={handleUpdateCaseFromDoctor}
            language={language}
            onRefresh={loadInitialData}
            onOpenPdfReport={(c) => {
              setPdfReportCase(c);
              setShowPdfReportModal(true);
            }}
          />
        )}
      </main>

      {/* Official Referral Slip Modal */}
      {showReferralModal && completedCase && (
        <ReferralSlipModal
          caseData={completedCase}
          onClose={() => {
            setShowReferralModal(false);
            handleNewAssessment();
          }}
          onViewDoctorPortal={() => {
            setShowReferralModal(false);
            setRole("DOCTOR");
          }}
          onGeneratePdfReport={(c) => {
            setPdfReportCase(c);
            setShowPdfReportModal(true);
          }}
          language={language}
        />
      )}

      {/* Standardized Printable PDF Referral Report Modal */}
      {showPdfReportModal && (pdfReportCase || completedCase) && (
        <ReferralReportPDFModal
          caseData={(pdfReportCase || completedCase)!}
          isOpen={showPdfReportModal}
          onClose={() => setShowPdfReportModal(false)}
          language={language}
        />
      )}

      {/* Rapid One-Tap Emergency SOS Ambulance Dispatch Modal */}
      {showSosModal && (
        <EmergencySosModal
          isOpen={showSosModal}
          onClose={() => setShowSosModal(false)}
          currentLocation={{
            village: patientData.village || "Rampur Village (Auto-Located)",
            latitude: patientData.villageLatitude,
            longitude: patientData.villageLongitude,
          }}
          onGenerateReport={(sosCase) => {
            setShowSosModal(false);
            setPdfReportCase(sosCase);
            setShowPdfReportModal(true);
          }}
          onOpenMapTracker={() => {
            setShowSosModal(false);
            setShowLiveTracker(true);
          }}
        />
      )}

      {/* Quick Floating Action to re-view / print standardized PDF Referral Report from completedCase */}
      {completedCase && !showReferralModal && !showPdfReportModal && !showSosModal && (
        <div className="fixed bottom-4 left-4 z-40 print:hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
          <button
            id="floating-btn-view-pdf-report"
            type="button"
            onClick={() => {
              playHapticSound("click");
              setPdfReportCase(completedCase);
              setShowPdfReportModal(true);
            }}
            className="bg-slate-900/95 hover:bg-slate-800 text-white text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Open and print standardized PDF referral report for current patient"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-500/40">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <div className="text-left leading-tight">
              <span className="block text-[10px] text-slate-400 font-normal">Active Case Summary</span>
              <span className="font-semibold text-slate-100 flex items-center gap-1">
                <span>Print PDF Report</span>
                <span className="text-[9px] font-mono text-cyan-300 uppercase">({completedCase.riskLevel})</span>
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Live Location Tracker Overlay */}
      {showLiveTracker && (
        <LiveLocationTracker
          patientData={patientData}
          assessment={assessment}
          selectedFacility={completedCase?.referredFacility ? {
            id: completedCase.referredFacility.id,
            name: completedCase.referredFacility.name,
            type: completedCase.referredFacility.type as any,
            distanceKm: completedCase.referredFacility.distanceKm,
            travelTimeMins: Math.round((completedCase.referredFacility.distanceKm / 45) * 60),
            address: "District Emergency Trauma Center",
            contactNumber: "108 / Emergency Desk",
            emergencyHotline: "108",
            hasOxygen: true,
            hasBloodBank: true,
            hasCSection: true,
            hasNICU: true,
            hasSnakeAntivenom: true,
            hasAmbulance24x7: true,
            availableBeds: 40,
            icuBedsAvailable: 6,
            latitude: 22.8115,
            longitude: 77.7845,
          } : null}
          isOpen={showLiveTracker}
          onClose={() => setShowLiveTracker(false)}
        />
      )}

      {/* Footer (Professional Polish) */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-3.5 px-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">SYSTEM: v2.4-STABLE</span>
          <span>•</span>
          <span>OFFLINE ENGINE: WHO IMCI & ETAT</span>
          <span>•</span>
          <span className="text-emerald-400">STATUS: ACTIVE</span>
        </div>
        <div className="text-slate-400 font-medium">
          PATIENT DATA ENCRYPTED (AES-256) • AYUSHMAN BHARAT COMPLIANT
        </div>
      </footer>
    </div>
  );
}
