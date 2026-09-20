import React, { useState } from "react";
import {
  PatientCase,
  SupportedLanguage,
  RiskAssessment,
  HealthcareFacility,
  ClinicalPreset,
  VitalsData,
} from "../../types";
import { IndianStateData } from "../../data/indianStates";
import { CLINICAL_PRESETS } from "../../data/clinicalPresets";
import { evaluateClinicalRiskLocally } from "../../utils/clinicalRules";
import { TRANSLATIONS } from "../../utils/translations";
import { playHapticSound } from "../../utils/audioFeedback";

// Child clinical workflow components
import { ClinicalIntakeWorkspace } from "./ClinicalIntakeWorkspace";
import { PatientRegistration } from "./PatientRegistration";
import { VitalsEntry } from "./VitalsEntry";
import { IntelligentFollowup } from "./IntelligentFollowup";
import { RiskAssessmentView } from "./RiskAssessmentView";
import { FacilityLocator } from "./FacilityLocator";
import { TacticalScenariosColumn } from "./TacticalScenariosColumn";
import { TacticalRightColumn } from "./TacticalRightColumn";
import { RealtimeStatusBar } from "../Realtime/RealtimeStatusBar";

import {
  Activity,
  LayoutDashboard,
  UserPlus,
  HeartPulse,
  Users,
  Send,
  PhoneCall,
  History,
  Settings,
  Search,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  FileText,
  Hospital,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";

interface CHWAppViewProps {
  cases: PatientCase[];
  offlineQueue: PatientCase[];
  isOffline: boolean;
  onToggleOffline: () => void;
  onSyncOffline: () => void;
  isSyncing: boolean;
  currentState: IndianStateData;
  onOpenStateModal: () => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onNavigateHome: () => void;
  onNavigateDoctor: () => void;
  onTriggerEmergencySos: () => void;
  onSelectCaseForSlip: (caseData: PatientCase) => void;
  onSaveCase: (caseData: PatientCase) => void;
  onOpenDevicesDrawer?: () => void;
  onOpenNotificationsDrawer?: () => void;
}

export const CHWAppView: React.FC<CHWAppViewProps> = ({
  cases,
  offlineQueue,
  isOffline,
  onToggleOffline,
  onSyncOffline,
  isSyncing,
  currentState,
  onOpenStateModal,
  language,
  onLanguageChange,
  onNavigateHome,
  onNavigateDoctor,
  onTriggerEmergencySos,
  onSelectCaseForSlip,
  onSaveCase,
  onOpenDevicesDrawer,
  onOpenNotificationsDrawer,
}) => {
  // Navigation tabs in CHW sidebar
  type CHWTab = "dashboard" | "intake" | "triage" | "patients" | "referrals" | "emergency";
  const [activeTab, setActiveTab] = useState<CHWTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Step in Intake Workflow (1 to 5)
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Active Draft Patient
  const [currentPatient, setCurrentPatient] = useState<Partial<PatientCase>>({
    id: `case-${Date.now()}`,
    patientName: "",
    age: 28,
    gender: "Female",
    village: currentState.defaultVillage,
    chwName: currentState.ashaWorker,
    contactNumber: "",
    symptoms: [],
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
      bloodSugar: 105,
    },
    isPregnant: false,
    followUpAnswers: {},
    riskLevel: "ROUTINE",
    riskScore: 15,
    dangerSigns: [],
    clinicalImpression: "Awaiting clinical assessment",
    recommendedAction: "Complete vitals & symptom triage",
    fieldStabilizingActions: [],
    sbarSummary: {
      situation: "Patient presented for initial community health screening.",
      background: "Screening performed by frontline ASHA health worker.",
      assessment: "Preliminary vitals within acceptable baseline.",
      recommendation: "Continue routine monitoring and health counseling.",
    },
    status: "PENDING_REVIEW",
    createdAt: new Date().toISOString(),
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>();

  // Reset/Start New Patient Intake
  const handleNewIntake = () => {
    playHapticSound("click");
    setSelectedPresetId(undefined);
    setCurrentPatient({
      id: `case-${Date.now()}`,
      patientName: "",
      age: 28,
      gender: "Female",
      village: currentState.defaultVillage,
      chwName: currentState.ashaWorker,
      contactNumber: "",
      symptoms: [],
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
        bloodSugar: 105,
      },
      isPregnant: false,
      followUpAnswers: {},
      riskLevel: "ROUTINE",
      riskScore: 15,
      dangerSigns: [],
      clinicalImpression: "Awaiting clinical assessment",
      recommendedAction: "Complete vitals & symptom triage",
      fieldStabilizingActions: [],
      sbarSummary: {
        situation: "Patient presented for initial community health screening.",
        background: "Screening performed by frontline ASHA health worker.",
        assessment: "Preliminary vitals within acceptable baseline.",
        recommendation: "Continue routine monitoring and health counseling.",
      },
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    });
    setWorkflowStep(1);
    setActiveTab("intake");
  };

  // Select Preset
  const handleSelectPreset = (preset: ClinicalPreset) => {
    playHapticSound("click");
    setSelectedPresetId(preset.id);
    const evaluation = evaluateClinicalRiskLocally(preset.patientData);
    setCurrentPatient({
      id: `case-${Date.now()}`,
      ...preset.patientData,
      chwName: currentState.ashaWorker,
      village: preset.patientData.village || currentState.defaultVillage,
      riskLevel: evaluation.riskLevel,
      riskScore: evaluation.riskScore,
      dangerSigns: evaluation.dangerSigns,
      clinicalImpression: evaluation.clinicalImpression,
      recommendedAction: evaluation.recommendedAction,
      fieldStabilizingActions: evaluation.fieldStabilizingActions,
      sbarSummary: evaluation.sbarSummary,
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    });
    setWorkflowStep(1);
    setActiveTab("intake");
  };

  // Form Updates
  const handlePatientUpdate = (updates: Partial<PatientCase>) => {
    setCurrentPatient((prev) => {
      const merged = { ...prev, ...updates };
      const evaluation = evaluateClinicalRiskLocally(merged);
      return {
        ...merged,
        riskLevel: evaluation.riskLevel,
        riskScore: evaluation.riskScore,
        dangerSigns: evaluation.dangerSigns,
        clinicalImpression: evaluation.clinicalImpression,
        recommendedAction: evaluation.recommendedAction,
        fieldStabilizingActions: evaluation.fieldStabilizingActions,
        sbarSummary: evaluation.sbarSummary,
      };
    });
  };

  const handleVitalsUpdate = (newVitals: VitalsData) => {
    handlePatientUpdate({ vitals: newVitals });
  };

  const currentRiskAssessment: RiskAssessment = evaluateClinicalRiskLocally(currentPatient);

  // Filtered Patients List
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.patientName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.village && c.village.toLowerCase().includes(q))
    );
  });

  const criticalCases = cases.filter((c) => c.riskLevel === "URGENT");
  const consultationCases = cases.filter((c) => c.riskLevel === "CONSULTATION");
  const routineCases = cases.filter((c) => c.riskLevel === "ROUTINE");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* -------------------------------------------------------------
          1. Top Offline Alert Banner (Non-blocking)
          ------------------------------------------------------------- */}
      {isOffline && (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 text-xs font-semibold flex items-center justify-between z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>You're Offline.</strong> Clinical decisions are functioning 100% locally. {offlineQueue.length} record(s) queued for sync.
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleOffline}
            className="text-[11px] underline font-bold hover:text-white shrink-0 cursor-pointer ml-4"
          >
            Re-check Online
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          2. CHW Dedicated Application Topbar
          ------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Clinical Workstation Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#123B78] flex items-center justify-center text-white font-bold">
              <HeartPulse className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#0F172A] leading-tight">
                ASHA Clinical Workstation
              </div>
              <div className="text-[10px] font-semibold text-slate-500">
                Frontline Community Health Portal
              </div>
            </div>
          </div>
        </div>

        {/* Center / Right Control Panel */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* State / Region Pill */}
          <button
            type="button"
            onClick={onOpenStateModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#123B78] transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{currentState.name}</span>
          </button>

          {/* Live Shared Workspace Status Bar */}
          <RealtimeStatusBar
            onOpenDevicesDrawer={onOpenDevicesDrawer}
            onOpenNotificationsDrawer={onOpenNotificationsDrawer}
          />

          {/* Doctor Portal Switch */}
          <button
            type="button"
            onClick={onNavigateDoctor}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#123B78] bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <span>Doctor View</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Back to Home Button */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] px-2 py-1"
          >
            Exit to Home
          </button>
        </div>
      </header>

      {/* -------------------------------------------------------------
          3. App Body with Sidebar + Main Content Viewport
          ------------------------------------------------------------- */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop Fixed, Mobile Drawer) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 space-y-6">
            {/* Health Worker Profile Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#123B78] text-white flex items-center justify-center font-bold text-sm">
                AS
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#0F172A] truncate">
                  {currentState.ashaWorker}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentState.defaultVillage} Sub-Center
                </div>
              </div>
            </div>

            {/* Quick Action: New Intake */}
            <button
              type="button"
              onClick={handleNewIntake}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#123B78] hover:bg-[#0E2C5B] shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Patient Intake</span>
            </button>

            {/* Main Navigation Links */}
            <nav className="space-y-1 text-left">
              {[
                { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
                { id: "intake", label: "Clinical Intake", icon: UserPlus },
                { id: "triage", label: "WHO IMCI Triage", icon: HeartPulse },
                { id: "patients", label: "Patients & Cases", icon: Users, count: cases.length },
                { id: "referrals", label: "Active Referrals", icon: Send },
                { id: "emergency", label: "108 SOS Dispatch", icon: PhoneCall, alert: true },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as CHWTab);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#123B78] font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#2563EB]" : item.alert ? "text-red-500" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex items-center justify-between">
              <span>National Hotline</span>
              <span className="font-bold text-[#0F172A] font-mono">108</span>
            </div>
            <div className="text-[10px] text-slate-400">
              ArogyaSeva v2.4 • Offline-First
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 text-left">
          {/* =========================================================
              VIEW 1: Dashboard Overview
              ========================================================= */}
          {activeTab === "dashboard" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Welcome Section */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0F172A]">
                    Namaste, {currentState.ashaWorker}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Frontline Community Health Command • {currentState.name} ({currentState.zone})
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleNewIntake}
                    className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#123B78] hover:bg-[#0E2C5B] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Start Patient Intake</span>
                  </button>
                  <button
                    type="button"
                    onClick={onTriggerEmergencySos}
                    className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>108 SOS</span>
                  </button>
                </div>
              </div>

              {/* Today's Overview: 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <span>Total Patients</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-[#0F172A] font-mono">
                    {cases.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Evaluated at Sub-Center</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-red-600 font-semibold mb-2">
                    <span>Critical Cases</span>
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-3xl font-black text-red-600 font-mono">
                    {criticalCases.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Requires immediate escalation</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-amber-600 font-semibold mb-2">
                    <span>Consultations</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-amber-600 font-mono">
                    {consultationCases.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Pending doctor advice</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold mb-2">
                    <span>Offline Sync Queue</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-[#0F172A] font-mono">
                    {offlineQueue.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Local records to sync</div>
                </div>
              </div>

              {/* Critical Cases List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Priority Emergency & Critical Cases</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {criticalCases.length} urgent
                  </span>
                </div>

                {criticalCases.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No critical cases recorded today. All vitals within baseline.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {criticalCases.map((c) => (
                      <div
                        key={c.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">
                            {c.patientName} ({c.age}Y, {c.gender})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {c.symptoms.join(", ")} • SpO2: {c.vitals.spo2}% • BP: {c.vitals.bpSystolic}/{c.vitals.bpDiastolic}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                            URGENT
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectCaseForSlip(c)}
                            className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                          >
                            View Slip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Patients Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#0F172A]">Recent Community Patients</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("patients")}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="pb-3">Patient Name</th>
                        <th className="pb-3">Age / Gender</th>
                        <th className="pb-3">Chief Symptoms</th>
                        <th className="pb-3">Risk Tier</th>
                        <th className="pb-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cases.slice(0, 5).map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-[#0F172A]">{c.patientName}</td>
                          <td className="py-3 text-slate-600">{c.age}Y, {c.gender}</td>
                          <td className="py-3 text-slate-600">{c.symptoms.slice(0, 2).join(", ")}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.riskLevel === "URGENT"
                                  ? "bg-red-100 text-red-800"
                                  : c.riskLevel === "CONSULTATION"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {c.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => onSelectCaseForSlip(c)}
                              className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                            >
                              Referral Slip
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 2: Clinical Intake (3-Column Layout: 25% / 50% / 25%)
              ========================================================= */}
          {activeTab === "intake" && (
            <ClinicalIntakeWorkspace
              cases={cases}
              offlineQueue={offlineQueue}
              isOffline={isOffline}
              onToggleOffline={onToggleOffline}
              onSyncOffline={onSyncOffline}
              isSyncing={isSyncing}
              currentState={currentState}
              language={language}
              onLanguageChange={onLanguageChange}
              onSaveCase={onSaveCase}
              onSelectCaseForSlip={onSelectCaseForSlip}
              onTriggerEmergencySos={onTriggerEmergencySos}
              onNavigateDoctor={onNavigateDoctor}
            />
          )}

          {/* =========================================================
              VIEW 3: WHO IMCI Triage & Protocols Reference
              ========================================================= */}
          {activeTab === "triage" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-xl font-bold text-[#0F172A] mb-2">
                  WHO IMCI & Maternal Danger Signs Reference
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Certified clinical decision guidelines implemented directly inside the ArogyaSeva autonomous inference engine.
                </p>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <h4 className="font-bold text-red-900 text-sm mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Red Tier: Immediate 108 Emergency Referral</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-red-800">
                      <li>SpO2 &lt; 92% or severe chest indrawing</li>
                      <li>Maternal systolic BP &ge; 160 mmHg or diastolic &ge; 110 mmHg</li>
                      <li>Convulsions, active seizures, or altered mental status</li>
                      <li>Heavy obstetric bleeding or postpartum hemorrhage</li>
                      <li>Snakebite with fang marks or neurotoxic ptosis</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <h4 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Amber Tier: Medical Officer Tele-Consultation</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-amber-800">
                      <li>Fever lasting longer than 3 days with headache</li>
                      <li>Persistent vomiting or inability to tolerate oral fluids</li>
                      <li>Moderate respiratory rate elevation with normal SpO2</li>
                      <li>Pediatric refusal to breastfeed</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <h4 className="font-bold text-emerald-900 text-sm mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Green Tier: Routine Field Supportive Care</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                      <li>Mild upper respiratory cold symptoms with normal vitals</li>
                      <li>Counseling on oral rehydration therapy (ORS) and zinc</li>
                      <li>Nutritional and iron-folic acid follow-up</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 4: Patients & Cases Queue
              ========================================================= */}
          {activeTab === "patients" && (
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">All Community Cases</h2>
                  <p className="text-xs text-slate-500">Total {cases.length} records registered locally</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or village..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-bold text-[#0F172A] text-sm">{c.patientName}</div>
                          <div className="text-[11px] text-slate-500">
                            {c.age}Y • {c.gender} • {c.village || currentState.defaultVillage}
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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

                      <div className="my-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="font-semibold text-[#123B78]">Symptoms:</div>
                        <div>{c.symptoms.join(", ") || "General screening"}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-500">
                          SpO2: {c.vitals.spo2}% | HR: {c.vitals.heartRate} bpm
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCaseForSlip(c)}
                        className="text-xs font-bold text-[#2563EB] hover:underline cursor-pointer"
                      >
                        View QR Slip →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 5: Active Referrals
              ========================================================= */}
          {activeTab === "referrals" && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-lg font-bold text-[#0F172A] mb-1">
                  Active Hospital Referrals
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Patients routed to Community Health Centers & District Civil Hospitals.
                </p>

                <div className="space-y-3">
                  {cases
                    .filter((c) => c.referredFacility || c.riskLevel === "URGENT")
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#0F172A]">{c.patientName}</div>
                          <div className="text-slate-500">
                            Referred to:{" "}
                            <strong>
                              {c.referredFacility?.name || "District Hospital Emergency"}
                            </strong>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCaseForSlip(c)}
                            className="px-3 py-1.5 rounded-lg bg-[#123B78] text-white text-xs font-bold cursor-pointer"
                          >
                            Print QR Slip
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 6: Emergency 108 Dispatch Trigger View
              ========================================================= */}
          {activeTab === "emergency" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-red-200 shadow-md text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-pulse">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-red-700">108 Emergency SOS Dispatch</h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Direct radio and telephone relay to the State 108 Emergency Medical Response Control Room for immediate Advanced Life Support (ALS) dispatch.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Caller:</span>
                    <span className="font-bold text-[#0F172A]">{currentState.ashaWorker}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sub-Center:</span>
                    <span className="font-bold text-[#0F172A]">{currentState.defaultVillage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-mono text-slate-700">
                      {currentState.coordinates.lat.toFixed(4)}° N, {currentState.coordinates.lng.toFixed(4)}° E
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onTriggerEmergencySos}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
                >
                  Confirm & Transmit 108 Dispatch Request
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
