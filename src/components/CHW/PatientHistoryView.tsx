import React, { useState, useMemo, useEffect } from "react";
import { PatientCase, RiskLevel, SupportedLanguage } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  lookupPatientHistory,
  getAllIndexedPatientsList,
  buildOrUpdateIndex,
  seedHistoricalCasesIfRequired,
  PatientHistoryLookupResult,
  VitalsTrendPoint,
} from "../../utils/patientHistoryIndex";
import {
  History,
  Search,
  User,
  Calendar,
  Clock,
  HeartPulse,
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  QrCode,
  ArrowRight,
  Database,
  RefreshCw,
  Stethoscope,
  MapPin,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Download,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ExternalLink,
  Users,
} from "lucide-react";

interface PatientHistoryViewProps {
  currentPatient: Partial<PatientCase>;
  allCases: PatientCase[];
  onSelectPatient: (patient: Partial<PatientCase>) => void;
  onSelectCaseForSlip: (caseData: PatientCase) => void;
  onOpenPdfReport?: (caseData: PatientCase) => void;
  onOpenIdCard?: (patient: Partial<PatientCase>) => void;
  onOpenQrScanner?: () => void;
  onStartIntakeForPatient?: (patient: Partial<PatientCase>) => void;
  language: SupportedLanguage;
}

export const PatientHistoryView: React.FC<PatientHistoryViewProps> = ({
  currentPatient,
  allCases,
  onSelectPatient,
  onSelectCaseForSlip,
  onOpenPdfReport,
  onOpenIdCard,
  onOpenQrScanner,
  onStartIntakeForPatient,
  language,
}) => {
  // Local search query for patient index
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseDetailId, setSelectedCaseDetailId] = useState<string | null>(null);
  const [activeRiskFilter, setActiveRiskFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexSuccess, setReindexSuccess] = useState(false);

  // Ensure seed data exists on component mount
  useEffect(() => {
    seedHistoricalCasesIfRequired();
  }, []);

  // Quick list of all indexed patients for the selector / switch dropdown
  const indexedPatients = useMemo(() => {
    return getAllIndexedPatientsList(allCases);
  }, [allCases, isReindexing]);

  // Determine current active patient query:
  // If currentPatient has a name or abhaId or id, use it; otherwise default to the first indexed patient
  const activeLookup = useMemo<PatientHistoryLookupResult>(() => {
    const hasCurrentPatient =
      Boolean(currentPatient?.patientName && currentPatient.patientName.trim().length > 0) ||
      Boolean(currentPatient?.abhaId) ||
      Boolean(currentPatient?.contactNumber);

    if (hasCurrentPatient) {
      return lookupPatientHistory(currentPatient, allCases);
    }

    // Default to the first indexed patient with richest history if available
    if (indexedPatients.length > 0) {
      return lookupPatientHistory(indexedPatients[0].patientKey, allCases);
    }

    return lookupPatientHistory(currentPatient, allCases);
  }, [currentPatient, allCases, indexedPatients, isReindexing]);

  // Filter encounters by risk tier if selected
  const displayedCases = useMemo(() => {
    if (activeRiskFilter === "ALL") return activeLookup.cases;
    return activeLookup.cases.filter((c) => c.riskLevel === activeRiskFilter);
  }, [activeLookup.cases, activeRiskFilter]);

  // Re-index trigger
  const handleReindex = () => {
    playHapticSound("click");
    setIsReindexing(true);
    setTimeout(() => {
      buildOrUpdateIndex(allCases);
      setIsReindexing(false);
      setReindexSuccess(true);
      setTimeout(() => setReindexSuccess(false), 3000);
    }, 400);
  };

  // Filtered patients for dropdown/search
  const filteredPatientsList = useMemo(() => {
    if (!searchQuery.trim()) return indexedPatients;
    const q = searchQuery.toLowerCase().trim();
    return indexedPatients.filter(
      (p) =>
        p.patientName.toLowerCase().includes(q) ||
        (p.abhaId && p.abhaId.toLowerCase().includes(q)) ||
        (p.contactNumber && p.contactNumber.includes(q)) ||
        p.village.toLowerCase().includes(q)
    );
  }, [indexedPatients, searchQuery]);

  // Export history JSON
  const handleExportHistory = () => {
    playHapticSound("click");
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            patient: activeLookup.patientName,
            patientKey: activeLookup.patientKey,
            totalVisits: activeLookup.totalVisits,
            allergies: activeLookup.allKnownAllergies,
            chronicConditions: activeLookup.allChronicConditions,
            vitalsTrend: activeLookup.vitalsTrend,
            encounters: activeLookup.cases,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `patient_history_${activeLookup.patientName.replace(/\s+/g, "_")}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const currentEntry = activeLookup.entry;
  const latestCase = activeLookup.cases[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* =========================================================
          1. PATIENT HEADER & LOCAL STORAGE INDEX CONTROL BANNER
          ========================================================= */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#123B78] to-[#1E4D8C] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background circuit accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <History className="w-48 h-48 text-white" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Top Bar: Title & Index Status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 text-xs font-mono uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>Local Storage Patient Index (IndexedDB / Key-Value Fast Index)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 flex items-center gap-2.5">
                <History className="w-7 h-7 text-cyan-400" />
                <span>Longitudinal Patient Clinical History</span>
              </h1>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              {/* Local Index Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white/90">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px]">
                  Index: {indexedPatients.length} Patients ({allCases.length} Encounters)
                </span>
              </div>

              {/* Re-index Button */}
              <button
                type="button"
                onClick={handleReindex}
                disabled={isReindexing}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title="Refresh and rebuild local storage patient index"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? "animate-spin" : ""}`} />
                <span>{isReindexing ? "Indexing..." : reindexSuccess ? "Indexed!" : "Re-Index"}</span>
              </button>

              {/* Scan ID Card Button */}
              {onOpenQrScanner && (
                <button
                  type="button"
                  onClick={() => {
                    playHapticSound("click");
                    onOpenQrScanner();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan ID Card</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Patient Details Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-white/20 shrink-0">
                {activeLookup.patientName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2.5">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {activeLookup.patientName}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      activeLookup.primaryRiskLevel === "URGENT"
                        ? "bg-red-500/90 text-white border border-red-400"
                        : activeLookup.primaryRiskLevel === "CONSULTATION"
                        ? "bg-amber-400 text-slate-950 font-bold"
                        : "bg-emerald-500/90 text-white"
                    }`}
                  >
                    {activeLookup.primaryRiskLevel} TIER
                  </span>

                  {(currentEntry?.abhaId || latestCase?.abhaId) && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-cyan-200 text-xs font-mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-300" />
                      <span>{currentEntry?.abhaId || latestCase?.abhaId}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center flex-wrap gap-3 text-xs text-blue-100/90">
                  <span>
                    <strong>{currentEntry?.age || latestCase?.age || currentPatient.age || "—"}</strong> Y,{" "}
                    {currentEntry?.gender || latestCase?.gender || currentPatient.gender || "—"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{currentEntry?.village || latestCase?.village || currentPatient.village || "Unknown Village"}</span>
                  </span>
                  {(currentEntry?.contactNumber || latestCase?.contactNumber) && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-cyan-300" />
                        <span>{currentEntry?.contactNumber || latestCase?.contactNumber}</span>
                      </span>
                    </>
                  )}
                  {latestCase?.bloodGroup && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-red-200">Blood: {latestCase.bloodGroup}</span>
                    </>
                  )}
                </div>

                {/* Chronic conditions & allergies */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  {activeLookup.allChronicConditions.length > 0 ? (
                    activeLookup.allChronicConditions.map((cond, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white/10 text-cyan-200 text-[11px] font-medium border border-white/10"
                      >
                        {cond}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-blue-200/70">No recorded chronic comorbidities</span>
                  )}

                  {activeLookup.allKnownAllergies.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-200 text-[11px] font-bold border border-red-400/30">
                      Allergies: {activeLookup.allKnownAllergies.join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Stack: Intake / ID Card / Export */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2 justify-end">
              {onStartIntakeForPatient && (
                <button
                  type="button"
                  onClick={() => {
                    playHapticSound("click");
                    onStartIntakeForPatient(latestCase || currentPatient);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Start New Follow-Up Intake</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                {onOpenIdCard && (latestCase || currentEntry) && (
                  <button
                    type="button"
                    onClick={() => {
                      playHapticSound("click");
                      onOpenIdCard(latestCase || currentPatient);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Digital ID Card</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportHistory}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Export full historical encounters as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Export History</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. PATIENT SWITCHER / SEARCH INDEX BAR
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Switch Patient from Local Storage Index ({indexedPatients.length} registered):</span>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search index by patient name, ABHA ID, or phone..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Quick Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 text-xs">
          {filteredPatientsList.slice(0, 8).map((p) => {
            const isSelected =
              p.patientName.toLowerCase() === activeLookup.patientName.toLowerCase() ||
              p.patientKey === activeLookup.patientKey;
            return (
              <button
                key={p.patientKey}
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  onSelectPatient({
                    patientName: p.patientName,
                    age: p.age,
                    gender: p.gender as any,
                    village: p.village,
                    abhaId: p.abhaId,
                    contactNumber: p.contactNumber,
                  });
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isSelected
                    ? "bg-[#123B78] text-white border-[#123B78] shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
                }`}
              >
                <span>{p.patientName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600"
                  }`}
                >
                  {p.visitsCount} visits
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================
          3. LONGITUDINAL CLINICAL METRICS & TRAJECTORY CARDS
          ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Encounters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total Clinical Visits</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A]">
            {activeLookup.totalVisits}{" "}
            <span className="text-xs font-normal text-slate-500">encounters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            First: {currentEntry?.firstEncounterDate ? new Date(currentEntry.firstEncounterDate).toLocaleDateString() : "Today"}
          </div>
        </div>

        {/* Latest Blood Pressure & Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Blood Pressure Trajectory</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-mono">
            {latestCase?.vitals.bpSystolic || 120}/{latestCase?.vitals.bpDiastolic || 80}{" "}
            <span className="text-xs font-normal text-slate-500 font-sans">mmHg</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            {(latestCase?.vitals.bpSystolic || 120) >= 140 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                <span className="text-red-600 font-bold">Hypertensive trend flagged</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-700 font-bold">Normotensive baseline</span>
              </>
            )}
          </div>
        </div>

        {/* Oxygenation & Respiratory */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>SpO2 & Heart Rate</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F172A] font-mono">
            {latestCase?.vitals.spo2 || 98}%{" "}
            <span className="text-xs font-normal text-slate-500 font-sans">
              ({latestCase?.vitals.heartRate || 76} bpm)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {(latestCase?.vitals.spo2 || 98) < 92 ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Severe Hypoxemia Alert
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">Adequate peripheral oxygenation</span>
            )}
          </div>
        </div>

        {/* Primary Diagnosis & Risk Level */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Primary Longitudinal Status</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-[#0F172A] line-clamp-1">
            {latestCase?.clinicalImpression || "General community screening"}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                activeLookup.primaryRiskLevel === "URGENT"
                  ? "bg-red-500"
                  : activeLookup.primaryRiskLevel === "CONSULTATION"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
            />
            <span>{latestCase?.status?.replace(/_/g, " ") || "Under Review"}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. LONGITUDINAL VITALS TRAJECTORY TABLE / PROGRESSION
          ========================================================= */}
      {activeLookup.vitalsTrend.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Multi-Visit Longitudinal Vitals Trajectory</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Tracking physiological signs chronologically across recorded community health visits
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeLookup.vitalsTrend.length} data points
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Encounter ID</th>
                  <th className="py-2.5 px-3">Blood Pressure</th>
                  <th className="py-2.5 px-3">SpO2</th>
                  <th className="py-2.5 px-3">Pulse / HR</th>
                  <th className="py-2.5 px-3">Temp (°F)</th>
                  <th className="py-2.5 px-3">Resp. Rate</th>
                  <th className="py-2.5 px-3">Blood Sugar</th>
                  <th className="py-2.5 px-3 text-right">Risk Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeLookup.vitalsTrend.map((v, idx) => {
                  const isLatest = idx === activeLookup.vitalsTrend.length - 1;
                  return (
                    <tr
                      key={v.caseId}
                      className={`hover:bg-slate-50 transition-colors ${
                        isLatest ? "bg-blue-50/40 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {v.displayDate} {isLatest && <span className="text-[10px] text-blue-600 font-bold">(Latest)</span>}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{v.caseId}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            v.bpSystolic >= 140 || v.bpDiastolic >= 90
                              ? "text-red-600 font-bold"
                              : "text-slate-800"
                          }
                        >
                          {v.bpSystolic}/{v.bpDiastolic}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            v.spo2 < 92
                              ? "text-red-600 font-bold"
                              : v.spo2 < 95
                              ? "text-amber-600 font-bold"
                              : "text-slate-800"
                          }
                        >
                          {v.spo2}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">{v.heartRate} bpm</td>
                      <td className="py-2.5 px-3">
                        <span className={v.temperature >= 101 ? "text-red-600 font-bold" : "text-slate-800"}>
                          {v.temperature}°F
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {v.respiratoryRate ? `${v.respiratoryRate}/min` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {v.bloodSugar ? `${v.bloodSugar} mg/dL` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-sans ${
                            v.riskLevel === "URGENT"
                              ? "bg-red-100 text-red-700"
                              : v.riskLevel === "CONSULTATION"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {v.riskLevel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          5. PAST CLINICAL CASES TIMELINE (ENCOUNTER BY ENCOUNTER)
          ========================================================= */}
      <div className="space-y-4">
        {/* Section Header & Risk Tier Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Past Clinical Encounters Timeline</span>
              <span className="text-xs font-normal text-slate-500">
                ({displayedCases.length} of {activeLookup.cases.length} records)
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Complete chronological medical record indexed in local storage for this patient
            </p>
          </div>

          {/* Risk Level Filter Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs">
            {(["ALL", "URGENT", "CONSULTATION", "ROUTINE"] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  setActiveRiskFilter(tier);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeRiskFilter === tier
                    ? "bg-white text-[#123B78] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Encounters List */}
        {displayedCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No Historical Cases Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No previous clinical encounters match this filter for {activeLookup.patientName}. Start an intake or register a new assessment to build their local history index.
            </p>
            {onStartIntakeForPatient && (
              <button
                type="button"
                onClick={() => onStartIntakeForPatient(currentPatient)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Start First Clinical Intake
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedCases.map((encounter, index) => {
              const isExpanded = selectedCaseDetailId === encounter.id;
              const encounterDate = new Date(encounter.createdAt);

              return (
                <div
                  key={encounter.id}
                  className={`bg-white rounded-2xl border transition-all shadow-2xs ${
                    encounter.riskLevel === "URGENT"
                      ? "border-red-200 hover:border-red-300"
                      : encounter.riskLevel === "CONSULTATION"
                      ? "border-amber-200 hover:border-amber-300"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  {/* Encounter Card Header */}
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          encounter.riskLevel === "URGENT"
                            ? "bg-red-100 text-red-700"
                            : encounter.riskLevel === "CONSULTATION"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        #{displayedCases.length - index}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#0F172A]">
                            {encounterDate.toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {encounterDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-500 font-mono">{encounter.id}</span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>Worker: {encounter.chwName}</span>
                          <span>•</span>
                          <span>{encounter.village}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          encounter.riskLevel === "URGENT"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : encounter.riskLevel === "CONSULTATION"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {encounter.riskLevel}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          playHapticSound("click");
                          setSelectedCaseDetailId(isExpanded ? null : encounter.id);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? "Collapse" : "Details"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Encounter Body Summary */}
                  <div className="p-5 space-y-4">
                    {/* Symptoms & Vitals snapshot */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Symptoms */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                        <div className="font-bold text-[#123B78] flex items-center justify-between">
                          <span>Reported Symptoms ({encounter.symptomDuration})</span>
                        </div>
                        <div className="text-slate-700 font-medium">
                          {encounter.symptoms.length > 0
                            ? encounter.symptoms.join(", ")
                            : "Routine health assessment"}
                        </div>
                        {encounter.clinicalImpression && (
                          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <strong>Impression:</strong> {encounter.clinicalImpression}
                          </div>
                        )}
                      </div>

                      {/* Vitals Snapshot */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 font-mono">
                        <div className="font-bold text-[#123B78] font-sans flex items-center justify-between">
                          <span>Recorded Vitals</span>
                          <span className="text-[10px] text-slate-400">At encounter</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700">
                          <div>
                            BP: <strong>{encounter.vitals.bpSystolic}/{encounter.vitals.bpDiastolic}</strong>
                          </div>
                          <div>
                            SpO2: <strong className={encounter.vitals.spo2 < 92 ? "text-red-600 font-bold" : ""}>{encounter.vitals.spo2}%</strong>
                          </div>
                          <div>
                            HR: <strong>{encounter.vitals.heartRate} bpm</strong>
                          </div>
                          <div>
                            Temp: <strong>{encounter.vitals.temperature}°F</strong>
                          </div>
                          {encounter.vitals.respiratoryRate && (
                            <div>
                              RR: <strong>{encounter.vitals.respiratoryRate}/m</strong>
                            </div>
                          )}
                          {encounter.vitals.bloodSugar && (
                            <div>
                              Sugar: <strong>{encounter.vitals.bloodSugar}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Doctor's Review / Teleconsult Note if available */}
                    {(encounter.doctorNotes || encounter.doctorAction) && (
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs space-y-1">
                        <div className="font-bold text-blue-900 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                          <span>Medical Officer Review & Prescriptions</span>
                          {encounter.doctorAction && (
                            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 font-bold">
                              {encounter.doctorAction}
                            </span>
                          )}
                        </div>
                        <p className="text-blue-950 font-medium">{encounter.doctorNotes}</p>
                      </div>
                    )}

                    {/* Expanded Clinical Deep-Dive (SBAR, Danger signs, Stabilizing actions) */}
                    {isExpanded && (
                      <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                        {/* Danger Signs */}
                        {encounter.dangerSigns && encounter.dangerSigns.length > 0 && (
                          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
                            <div className="font-bold mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>Critical Danger Signs Identified:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
                              {encounter.dangerSigns.map((ds, idx) => (
                                <li key={idx}>{ds}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* SBAR Summary */}
                        {encounter.sbarSummary && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="font-bold text-slate-800 text-xs">
                              SBAR Clinical Referral Transmission
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="font-bold text-slate-700">Situation:</span>{" "}
                                <span className="text-slate-600">{encounter.sbarSummary.situation}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">Background:</span>{" "}
                                <span className="text-slate-600">{encounter.sbarSummary.background}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">Assessment:</span>{" "}
                                <span className="text-slate-600">{encounter.sbarSummary.assessment}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">Recommendation:</span>{" "}
                                <span className="text-slate-600">{encounter.sbarSummary.recommendation}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Field Stabilizing Actions */}
                        {encounter.fieldStabilizingActions && encounter.fieldStabilizingActions.length > 0 && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                            <div className="font-bold mb-1">Field Supportive Actions Taken:</div>
                            <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                              {encounter.fieldStabilizingActions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar for this encounter */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <div className="text-[11px] text-slate-400 font-mono">
                        Status: <strong className="text-slate-700">{encounter.status}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenPdfReport && (
                          <button
                            type="button"
                            onClick={() => {
                              playHapticSound("click");
                              onOpenPdfReport(encounter);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Generate official clinical referral PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-600" />
                            <span>Referral PDF</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            playHapticSound("click");
                            onSelectCaseForSlip(encounter);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>View QR Slip</span>
                        </button>

                        {onStartIntakeForPatient && (
                          <button
                            type="button"
                            onClick={() => {
                              playHapticSound("click");
                              onStartIntakeForPatient(encounter);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#123B78] hover:bg-[#1E4D8C] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            title="Pre-populate intake workspace with this patient's profile for follow-up"
                          >
                            <span>Load into Intake →</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
