import React, { useState } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
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
  Printer
} from "lucide-react";

interface DoctorDashboardProps {
  cases: PatientCase[];
  onUpdateCase: (caseId: string, updates: Partial<PatientCase>) => void;
  language: SupportedLanguage;
  onRefresh: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  cases,
  onUpdateCase,
  language,
  onRefresh,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || "");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorNoteInput, setDoctorNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      {/* Top District Health Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
              Active Triage Queue
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{cases.length}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Across 6 Village Sectors</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider block">
              Red Alert (Urgent)
            </span>
            <span className="text-2xl font-bold text-red-600 mt-1 block">{urgentCount}</span>
            <span className="text-xs text-red-500 font-medium mt-0.5 block">Immediate Bed / Transfer</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-amber-600 tracking-wider block">
              Consultation Queue
            </span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{consultationCount}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Tele-MO Review Needed</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
              Routine Subcentre Care
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{routineCount}</span>
            <span className="text-xs text-slate-500 font-medium mt-0.5 block">Managed by ASHA</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Two-Column Triage Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Triage Patient List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/70">
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
            <div className="flex gap-1.5 pt-1">
              {["ALL", "URGENT", "CONSULTATION", "ROUTINE"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
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
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          {selectedCase ? (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
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

                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded inline-block ${
                      selectedCase.riskLevel === "URGENT"
                        ? "bg-red-600 text-white"
                        : selectedCase.riskLevel === "CONSULTATION"
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {selectedCase.riskLevel} PRIORITY
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Case: {selectedCase.id}
                  </p>
                </div>
              </div>

              {/* Vitals Telemetry Box */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Frontline Telemetry
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO₂ Oxygen</span>
                    <span className={`text-xl font-bold ${selectedCase.vitals.spo2 < 92 ? "text-red-600" : "text-slate-900"}`}>
                      {selectedCase.vitals.spo2}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Blood Pressure</span>
                    <span className={`text-xl font-bold ${selectedCase.vitals.bpSystolic >= 140 ? "text-red-600" : "text-slate-900"}`}>
                      {selectedCase.vitals.bpSystolic}/{selectedCase.vitals.bpDiastolic}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Temperature</span>
                    <span className="text-xl font-bold text-slate-900">
                      {selectedCase.vitals.temperature}°F
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pulse / HR</span>
                    <span className="text-xl font-bold text-slate-900">
                      {selectedCase.vitals.heartRate} bpm
                    </span>
                  </div>
                </div>
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
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    id="btn-doc-accept-referral"
                    onClick={() => handleDoctorAction("Referral Accepted & Emergency Bed Reserved")}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm shadow-blue-100 transition-all"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Accept Referral & Reserve Bed</span>
                  </button>

                  <button
                    id="btn-doc-dispatch-ambulance"
                    onClick={() => handleDoctorAction("108 Emergency Ambulance Dispatched with Oxygen")}
                    disabled={isSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Dispatch 108 Ambulance</span>
                  </button>

                  <button
                    id="btn-doc-teleconsult"
                    onClick={() => handleDoctorAction("Teleconsultation Video Link Sent to ASHA")}
                    disabled={isSubmitting}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Teleconsult</span>
                  </button>

                  <button
                    id="btn-doc-routine-rx"
                    onClick={() => handleDoctorAction("Routine Home Care Guidance Approved")}
                    disabled={isSubmitting}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
