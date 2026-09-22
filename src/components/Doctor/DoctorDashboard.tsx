import React, { useState, useEffect } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import { IndianStateData } from "../../data/indianStates";
import {
  Stethoscope,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Filter,
  Search,
  User,
  Activity,
  Heart,
  Wind,
  PhoneCall,
  Video,
  FileCheck,
  BedDouble,
  ChevronRight,
  Send,
  AlertTriangle,
  RefreshCw,
  Printer,
  Radio,
  Wifi,
  Sparkles,
  X,
  MapPin,
  Navigation,
  Gauge,
  Zap,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";
import { AiTriageSignalBadge } from "../Common/AiTriageSignalBadge";
import { clientRuleBasedTriage } from "../../utils/triageSignal";
import { CaseAttachmentsManager } from "../Common/CaseAttachmentsManager";

interface DoctorDashboardProps {
  cases: PatientCase[];
  onUpdateCase: (caseId: string, updates: Partial<PatientCase>) => void;
  language: SupportedLanguage;
  onRefresh: () => void;
  onOpenPdfReport?: (caseData: PatientCase) => void;
  selectedState?: IndianStateData;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  cases,
  onUpdateCase,
  language,
  onRefresh,
  onOpenPdfReport,
  selectedState,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorNoteInput, setDoctorNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTeleconsultModal, setShowTeleconsultModal] = useState(false);
  const [teleconsultStatus, setTeleconsultStatus] = useState<"connecting" | "active" | "ended">("connecting");
  const [activeVehicles, setActiveVehicles] = useState<any[]>([]);

  // Poll live ambulance & fleet telemetry
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const res = await fetch("/api/telemetry/location");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.vehicles)) {
            setActiveVehicles(data.vehicles);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesRisk = riskFilter === "ALL" || c.riskLevel === riskFilter;
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRisk && matchesSearch;
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleDoctorAction = (actionName: string) => {
    if (!selectedCase) return;
    setIsSubmitting(true);

    const note = doctorNoteInput.trim()
      ? `${actionName}: ${doctorNoteInput.trim()}`
      : `${actionName} executed by District Medical Officer.`;

    onUpdateCase(selectedCase.id, {
      status: actionName.includes("Accept") || actionName.includes("Prescribe") ? "DOCTOR_REVIEWED" : "RESOLVED",
      doctorAction: actionName,
      doctorNotes: note,
    });

    setDoctorNoteInput("");
    setIsSubmitting(false);
  };

  const urgentCount = cases.filter((c) => c.riskLevel === "URGENT").length;
  const consultationCount = cases.filter((c) => c.riskLevel === "CONSULTATION").length;
  const routineCount = cases.filter((c) => c.riskLevel === "ROUTINE").length;

  return (
    <div id="doctor-dashboard-view" className="space-y-6">
      {/* 1. Futuristic Regional Command Center Status Bar */}
      <div className="glass-command text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle Cyan Atmosphere */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-950/50 backdrop-blur-md shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40 backdrop-blur-xs truncate max-w-full">
                {selectedState ? `${selectedState.shortCode} • ${selectedState.name.toUpperCase()}` : "DISTRICT CLINICAL COMMAND CENTER"}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                TELEMETRY LIVE
              </span>
            </div>
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white mt-1 truncate">
              {selectedState?.hospital || "District Civil Hospital & Trauma Centre (Sector 1)"}
            </h3>
            {selectedState && (
              <p className="text-xs text-slate-300 font-mono truncate">
                Attending: <span className="text-cyan-200 font-bold">{selectedState.doctor}</span> • Coverage: {selectedState.ashaUnit}
              </p>
            )}
          </div>
        </div>

        {/* Live Resource Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 font-mono text-xs relative z-10 w-full md:w-auto">
          <div className="bg-slate-900/80 border border-cyan-500/30 px-3 py-2 rounded-xl backdrop-blur-sm shadow-inner">
            <span className="text-slate-400 text-[9px] sm:text-[10px] block">ICU BEDS</span>
            <span className="text-cyan-300 font-bold text-xs sm:text-sm">4 / 12 Free</span>
          </div>
          <div className="bg-slate-900/80 border border-cyan-500/30 px-3 py-2 rounded-xl backdrop-blur-sm shadow-inner">
            <span className="text-slate-400 text-[9px] sm:text-[10px] block">O2 PRESSURE</span>
            <span className="text-emerald-400 font-bold text-xs sm:text-sm">4.2 bar</span>
          </div>
          <div className="bg-slate-900/80 border border-cyan-500/30 px-3 py-2 rounded-xl backdrop-blur-sm shadow-inner col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[9px] sm:text-[10px] block">108 AMBULANCES</span>
            <span className="text-amber-400 font-bold text-xs sm:text-sm truncate block">
              {activeVehicles.length > 0 ? `${activeVehicles.length} Live Transit` : "2 Standby"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Ambulance Fleet Telemetry Stream (Active Dispatches) */}
      {activeVehicles.length > 0 && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl p-4 shadow-xl text-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                LIVE AMBULANCE TRANSIT TELEMETRY ({activeVehicles.length} ACTIVE)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              UPDATED SECONDS AGO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeVehicles.map((v, i) => (
              <div
                key={i}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 flex items-center justify-center text-lg shadow-inner">
                    🚑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{v.patientName}</span>
                      <span className="text-[10px] font-mono bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                        {v.caseId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{v.latitude.toFixed(4)}°N, {v.longitude.toFixed(4)}°E</span>
                      <span>•</span>
                      <span>Target: <strong className="text-slate-200">{v.targetFacilityName}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0">
                  <div className="flex items-center gap-1 text-cyan-300 font-bold text-xs justify-end">
                    <Gauge className="w-3 h-3 text-cyan-400" />
                    <span>{v.speedKmH} km/h</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 block mt-1">
                    TRAUMA BAY READY
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top District Health Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/90 shadow-2xs hover:shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Active Triage Queue
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{cases.length}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Across 6 Village Sectors</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50/80 text-blue-600 flex items-center justify-center font-bold shadow-2xs border border-blue-200/50">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-red-200/60 shadow-2xs hover:shadow-md bg-red-50/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider block">
              Red Alert (Urgent)
            </span>
            <span className="text-2xl font-bold text-red-600 mt-1 block font-mono">{urgentCount}</span>
            <span className="text-xs text-red-500 font-medium mt-0.5 block">Immediate Bed / Transfer</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-100/80 text-red-600 flex items-center justify-center font-bold shadow-2xs border border-red-200/60">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-200/60 shadow-2xs hover:shadow-md bg-amber-50/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">
              Consultation Queue
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">{consultationCount}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Tele-MO Review Needed</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center font-bold shadow-2xs border border-amber-200/60">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-200/60 shadow-2xs hover:shadow-md bg-emerald-50/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
              Routine Subcentre Care
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{routineCount}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Managed by ASHA</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold shadow-2xs border border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Triage Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Triage Patient List (5 cols) */}
        <div className="lg:col-span-5 glass-level-2 border border-white/90 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200/60 space-y-3 bg-white/60 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Emergency Triage Stream</span>
              </h3>
              <button
                onClick={onRefresh}
                className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium"
                title="Refresh Triage Stream"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, village or case ID..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
              />
            </div>

            {/* Risk Filters Tabs */}
            <div className="flex gap-1.5 pt-1 overflow-x-auto pb-1">
              {["ALL", "URGENT", "CONSULTATION", "ROUTINE"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                    riskFilter === lvl
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {lvl === "ALL" ? "All Cases" : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Cases Scrollable List */}
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No cases match the selected filter.
              </div>
            ) : (
              filteredCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                const isUrgent = c.riskLevel === "URGENT";
                const isConsultation = c.riskLevel === "CONSULTATION";

                return (
                  <div
                    key={c.id}
                    id={`doctor-case-item-${c.id}`}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/60 border-l-4 border-blue-600"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                            isUrgent
                              ? "bg-red-600 text-white"
                              : isConsultation
                              ? "bg-amber-600 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {c.riskLevel}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {c.patientName} ({c.age}y/{c.gender.charAt(0)})
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.id}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 line-clamp-1">
                      {c.clinicalImpression}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>📍 {c.village}</span>
                      <span className="font-semibold text-slate-700">
                        SpO₂: {c.vitals.spo2}% | BP: {c.vitals.bpSystolic}/{c.vitals.bpDiastolic}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <AiTriageSignalBadge
                        compact
                        triageSignal={
                          c.triageSignal ||
                          clientRuleBasedTriage({
                            age: c.age,
                            sex: c.gender?.toLowerCase() as any,
                            symptoms: (c.symptoms || []).join(" ") + " " + (c.clinicalImpression || ""),
                            vitals: {
                              spo2: c.vitals.spo2,
                              bp_systolic: c.vitals.bpSystolic,
                              bp_diastolic: c.vitals.bpDiastolic,
                              hr: c.vitals.heartRate,
                              rr: c.vitals.respiratoryRate,
                            },
                            comorbidities: c.chronicConditions,
                          })
                        }
                      />
                    </div>

                    {c.status === "DOCTOR_REVIEWED" && (
                      <div className="mt-2 text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                        <span>Action: {c.doctorAction || "Reviewed & Handled"}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Clinical Dossier & Action Console (7 cols) */}
        <div className="lg:col-span-7 glass-level-2 border border-white/90 rounded-2xl shadow-md p-6 space-y-5">
          {selectedCase ? (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedCase.patientName}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      • {selectedCase.age}Y • {selectedCase.gender} • {selectedCase.isPregnant ? "🤰 Pregnant" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Village: <strong className="text-slate-800">{selectedCase.village}</strong> • ASHA: <strong className="text-slate-800">{selectedCase.chwName}</strong>
                  </p>
                </div>

                <div className="flex items-start gap-2 text-right">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full inline-block shadow-2xs font-mono ${
                        selectedCase.riskLevel === "URGENT"
                          ? "glass-badge-rose"
                          : selectedCase.riskLevel === "CONSULTATION"
                          ? "glass-badge-amber"
                          : "glass-badge-blue"
                      }`}
                    >
                      {selectedCase.riskLevel} PRIORITY
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      Case: {selectedCase.id}
                    </p>
                    {onOpenPdfReport && (
                      <button
                        type="button"
                        id="btn-doctor-generate-pdf-report"
                        onClick={() => {
                          playHapticSound("click");
                          onOpenPdfReport(selectedCase);
                        }}
                        className="mt-1.5 glass-btn-secondary text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ml-auto shadow-2xs"
                        title="Generate and print standardized PDF referral report"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print PDF Report</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    id="btn-close-doctor-case-summary"
                    onClick={() => {
                      playHapticSound("click");
                      setSelectedCaseId("");
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Remove case summary from screen"
                    aria-label="Remove case summary from screen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Vitals Telemetry Box */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                  Frontline Clinical Telemetry
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO₂ Oxygen</span>
                    <span className={`text-xl font-bold font-mono ${selectedCase.vitals.spo2 < 92 ? "text-red-600" : "text-slate-900"}`}>
                      {selectedCase.vitals.spo2}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood Pressure</span>
                    <span className={`text-xl font-bold font-mono ${selectedCase.vitals.bpSystolic >= 140 ? "text-red-600" : "text-slate-900"}`}>
                      {selectedCase.vitals.bpSystolic}/{selectedCase.vitals.bpDiastolic}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Temperature</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {selectedCase.vitals.temperature}°F
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pulse / HR</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {selectedCase.vitals.heartRate} bpm
                    </span>
                  </div>
                </div>
              </div>

              {/* Universal AI Triage Signal Audit Card */}
              <div>
                <AiTriageSignalBadge
                  triageSignal={
                    selectedCase.triageSignal ||
                    clientRuleBasedTriage({
                      age: selectedCase.age,
                      sex: selectedCase.gender?.toLowerCase() as any,
                      symptoms:
                        (selectedCase.symptoms || []).join(", ") +
                        " " +
                        (selectedCase.clinicalImpression || "") +
                        " " +
                        (selectedCase.rawVoiceInput || ""),
                      vitals: {
                        spo2: selectedCase.vitals.spo2,
                        bp_systolic: selectedCase.vitals.bpSystolic,
                        bp_diastolic: selectedCase.vitals.bpDiastolic,
                        hr: selectedCase.vitals.heartRate,
                        rr: selectedCase.vitals.respiratoryRate,
                      },
                      comorbidities: selectedCase.chronicConditions,
                    })
                  }
                  payload={{
                    age: selectedCase.age,
                    sex: selectedCase.gender?.toLowerCase() as any,
                    symptoms: (selectedCase.symptoms || []).join(", "),
                    vitals: {
                      spo2: selectedCase.vitals.spo2,
                      bp_systolic: selectedCase.vitals.bpSystolic,
                      bp_diastolic: selectedCase.vitals.bpDiastolic,
                      hr: selectedCase.vitals.heartRate,
                      rr: selectedCase.vitals.respiratoryRate,
                    },
                    comorbidities: selectedCase.chronicConditions,
                  }}
                />
              </div>

              {/* Voice Transcript */}
              {selectedCase.rawVoiceInput && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Frontline Spoken Audio Narrative:
                  </span>
                  <p className="text-slate-700 italic leading-relaxed">
                    "{selectedCase.rawVoiceInput}"
                  </p>
                </div>
              )}

              {/* Danger Signs Identified */}
              {selectedCase.dangerSigns && selectedCase.dangerSigns.length > 0 && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
                    🚨 Identified Danger Flags & Clinical Alerts:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {selectedCase.dangerSigns.map((ds, i) => (
                      <li key={i} className="font-semibold">{ds}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SBAR Structured Doctor Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  SBAR Clinical Handover Note
                </span>
                <p><strong>Situation:</strong> {selectedCase.sbarSummary?.situation}</p>
                <p><strong>Background:</strong> {selectedCase.sbarSummary?.background}</p>
                <p><strong>Assessment:</strong> {selectedCase.sbarSummary?.assessment}</p>
                <p><strong>Recommendation:</strong> {selectedCase.sbarSummary?.recommendation}</p>
              </div>

              {/* Case Diagnostic Attachments & Documents */}
              <CaseAttachmentsManager
                caseId={selectedCase.id}
                attachments={selectedCase.attachments || []}
              />

              {/* Doctor Action Panel */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  District Medical Officer Action Panel
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doctorNoteInput}
                    onChange={(e) => setDoctorNoteInput(e.target.value)}
                    placeholder="Enter clinical order (e.g. 'Admit to Emergency Ward, start IV Saline and O2 4L/min')..."
                    className="flex-1 text-xs px-3.5 py-2.5 bg-white/90 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-slate-800 shadow-2xs transition-all"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    id="btn-doc-accept-referral"
                    onClick={() => handleDoctorAction("Referral Accepted & Emergency Bed Reserved")}
                    disabled={isSubmitting}
                    className="glass-btn-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <BedDouble className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Accept Referral & Reserve Bed</span>
                  </button>

                  <button
                    id="btn-doc-dispatch-ambulance"
                    onClick={() => {
                      playHapticSound("alert");
                      handleDoctorAction("108 Emergency Ambulance Dispatched with Oxygen");
                    }}
                    disabled={isSubmitting}
                    className="glass-btn-emergency text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dispatch 108 Ambulance</span>
                  </button>

                  <button
                    id="btn-doc-teleconsult"
                    onClick={() => {
                      playHapticSound("success");
                      setShowTeleconsultModal(true);
                      setTeleconsultStatus("connecting");
                      setTimeout(() => setTeleconsultStatus("active"), 1200);
                    }}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Teleconsult to Village</span>
                  </button>

                  <button
                    id="btn-doc-routine-rx"
                    onClick={() => {
                      playHapticSound("success");
                      handleDoctorAction("Routine Home Care Guidance Approved");
                    }}
                    disabled={isSubmitting}
                    className="glass-btn-secondary text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Approve Local Care</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              Select a case from the triage stream on the left.
            </div>
          )}
        </div>
      </div>

      {/* Live Teleconsultation Video Modal */}
      {showTeleconsultModal && selectedCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h3 className="font-bold text-sm tracking-wider uppercase font-mono">
                  LIVE TELECONSULTATION LINK: {selectedCase.village}
                </h3>
              </div>
              <button
                onClick={() => setShowTeleconsultModal(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Simulated Stage */}
            <div className="relative h-64 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center overflow-hidden">
              {teleconsultStatus === "connecting" ? (
                <div className="text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-cyan-300">
                    Establishing encrypted WebRTC uplink to ASHA Tablet ({selectedCase.chwName})...
                  </p>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950">
                  <div className="text-center space-y-2 z-10">
                    <div className="w-16 h-16 rounded-full bg-cyan-900/60 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center mx-auto text-xl font-bold">
                      {selectedCase.chwName.slice(0, 2)}
                    </div>
                    <h4 className="font-bold text-sm">{selectedCase.chwName} (ASHA Worker)</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      Village Subcentre • Audio & Vitals Stream Online
                    </p>
                    <div className="flex items-center justify-center gap-1 text-emerald-400 text-xs font-mono">
                      <Wifi className="w-3.5 h-3.5" />
                      <span>HD Audio 24kbps Low-Bandwidth Mode Active</span>
                    </div>
                  </div>

                  {/* Picture-in-picture Doctor Preview */}
                  <div className="absolute bottom-3 right-3 w-28 h-20 bg-slate-800 rounded-xl border border-slate-700 p-2 flex flex-col justify-end text-[10px] text-slate-300">
                    <span className="font-bold">Dr. Sharma</span>
                    <span className="text-emerald-400">Mic Active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Doctor Instruction Transmission */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  playHapticSound("success");
                  handleDoctorAction("Clinical Order: Elevate head 45 deg, apply high-flow O2, prepare for transfer");
                  setShowTeleconsultModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs py-3 px-3 rounded-xl cursor-pointer min-h-[44px] flex items-center justify-center text-center"
              >
                Transmit Direct Protocol: "Elevate head 45°, Apply O₂, Prepare Transfer"
              </button>
              <button
                onClick={() => setShowTeleconsultModal(false)}
                className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
