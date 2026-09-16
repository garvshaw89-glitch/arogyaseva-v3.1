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
} from "lucide-react";

export default function App() {
  const [role, setRole] = useState<"CHW" | "DOCTOR">("CHW");
  const [language, setLanguage] = useState<SupportedLanguage>("en");
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);

  const [patientData, setPatientData] = useState<Partial<PatientCase>>({
    patientName: "",
    age: 35,
    gender: "Male",
    village: "Rampur Village (Sector 4)",
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
  });

  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [completedCase, setCompletedCase] = useState<PatientCase | null>(null);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showCinematicHero, setShowCinematicHero] = useState<boolean>(true);

  const [casesList, setCasesList] = useState<PatientCase[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<PatientCase[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showLiveTracker, setShowLiveTracker] = useState<boolean>(false);
  const [step5ViewMode, setStep5ViewMode] = useState<"locator" | "map">("locator");

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  useEffect(() => {
    loadInitialData();
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
    setPatientData({
      patientName: "",
      age: 30,
      gender: "Male",
      village: "Rampur Village",
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
      village: patientData.village || "Rampur Village",
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
      village: patientData.village || "Rampur Village",
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
          language={language}
        />
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
