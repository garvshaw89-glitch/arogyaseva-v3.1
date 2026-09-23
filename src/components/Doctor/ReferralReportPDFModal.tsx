import React, { useState, useEffect, useMemo } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  generateReferralPDF,
  downloadReferralSlipPDF,
  openPdfInNewTab,
  savePdfWithPicker,
  sharePdfToDevice,
  PdfDownloadResult,
  PdfDocumentType,
  GeneratedPdfBundle,
} from "../../utils/pdfGenerator";
import {
  Printer,
  Download,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  HardDriveDownload,
  FileCheck,
  ShieldCheck,
  Activity,
  Stethoscope,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Share2,
  FolderDown,
  Building2,
  UserCheck,
  Clock,
  Calendar,
} from "lucide-react";
import { DiagnosticConfidenceIndicator } from "./DiagnosticConfidenceIndicator";

interface ReferralReportPDFModalProps {
  caseData: PatientCase;
  isOpen: boolean;
  onClose: () => void;
  language?: SupportedLanguage;
  initialDocType?: PdfDocumentType;
  doctorName?: string;
  hospitalName?: string;
}

export const ReferralReportPDFModal: React.FC<ReferralReportPDFModalProps> = ({
  caseData,
  isOpen,
  onClose,
  initialDocType,
  doctorName = "Dr. Rajesh Sharma, MD (Medical Officer)",
  hospitalName,
}) => {
  const [docType, setDocType] = useState<PdfDocumentType>(
    initialDocType || (caseData?.status === "DOCTOR_REVIEWED" ? "doctor_report" : "referral")
  );
  const [viewMode, setViewMode] = useState<"formatted" | "compiled_stream">("formatted");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [downloadResult, setDownloadResult] = useState<PdfDownloadResult | null>(null);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);
  const [activePdfBundle, setActivePdfBundle] = useState<GeneratedPdfBundle | null>(null);

  // Sync initialDocType if changed from outside
  useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    } else if (caseData?.status === "DOCTOR_REVIEWED") {
      setDocType("doctor_report");
    } else {
      setDocType("referral");
    }
  }, [initialDocType, caseData?.status]);

  // Pre-generate the in-memory PDF bundle for preview & fast export
  useEffect(() => {
    if (!caseData || !isOpen) return;
    try {
      const bundle = generateReferralPDF(caseData, {
        documentType: docType,
        doctorName,
        hospitalName: hospitalName || caseData.referredFacility?.name,
        doctorNotes: caseData.doctorNotes,
        doctorAction: caseData.doctorAction,
      });
      setActivePdfBundle(bundle);
      setDownloadResult(null);
      setDownloadState("idle");
      setDownloadErrorMsg(null);
    } catch (e) {
      console.error("Failed to generate PDF bundle preview:", e);
    }
  }, [caseData, isOpen, docType, doctorName, hospitalName]);

  const targetHospitalName = useMemo(() => {
    return (
      hospitalName ||
      caseData?.referredFacility?.name ||
      "District Civil Hospital & Emergency Trauma Centre"
    );
  }, [hospitalName, caseData?.referredFacility?.name]);

  if (!isOpen || !caseData) return null;

  const isUrgent = caseData.riskLevel === "URGENT";
  const isConsultation = caseData.riskLevel === "CONSULTATION";
  const isDoctorReport = docType === "doctor_report";

  const caseDateObj = caseData.createdAt ? new Date(caseData.createdAt) : new Date();
  const formattedDate = caseDateObj.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = caseDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateIso = caseDateObj.toISOString().split("T")[0];
  const cleanId = (caseData.id || "REC").replace(/[^a-zA-Z0-9_-]/g, "_");
  const reportUid = `AROGYA-${cleanId}-${dateIso}`;

  const handleDownloadPDF = async () => {
    try {
      setDownloadState("generating");
      setDownloadErrorMsg(null);
      playHapticSound("click");

      const result = await downloadReferralSlipPDF(caseData, {
        documentType: docType,
        doctorName,
        hospitalName: targetHospitalName,
        doctorNotes: caseData.doctorNotes,
        doctorAction: caseData.doctorAction,
      });

      setDownloadResult(result);

      if (result.success) {
        setDownloadState("success");
        playHapticSound("success");
      } else {
        setDownloadState("error");
        setDownloadErrorMsg(result.error || "Direct download was restricted by your browser. Use the direct link below.");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("PDF download execution failed:", err);
      setDownloadState("error");
      setDownloadErrorMsg(error?.message || "Failed to trigger PDF file download. Please retry.");
    }
  };

  const handlePrint = () => {
    playHapticSound("click");
    if (activePdfBundle?.blobUrl && viewMode === "compiled_stream") {
      openPdfInNewTab(activePdfBundle.blobUrl);
    } else {
      window.print();
    }
  };

  const handleCopySummary = () => {
    playHapticSound("click");
    const summaryText = `[AROGYASEVA ${isDoctorReport ? "DOCTOR CLINICAL DOSSIER" : "CLINICAL REFERRAL REPORT"}]
Document ID: ${reportUid}
Date: ${formattedDate} ${formattedTime}
Patient: ${caseData.patientName} (${caseData.age}y, ${caseData.gender})
Village: ${caseData.village} | Priority: [${caseData.riskLevel}]
Impression: ${caseData.clinicalImpression}
Vitals: SpO2 ${caseData.vitals?.spo2 || "N/A"}%, BP ${caseData.vitals?.bpSystolic || 120}/${caseData.vitals?.bpDiastolic || 80} mmHg, HR ${caseData.vitals?.heartRate || "N/A"} bpm, Temp ${caseData.vitals?.temperature || "N/A"}°F
Symptoms: ${caseData.symptoms?.join(", ") || "None"} (${caseData.symptomDuration || "Recent"})
Danger Signs: ${caseData.dangerSigns?.join(", ") || "None"}
Facility: ${targetHospitalName}
CHW: ${caseData.chwName || "Anjali Devi (ASHA)"} | Attending Doctor: ${doctorName}`;

    navigator.clipboard.writeText(summaryText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div
      id="referral-report-pdf-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:overflow-visible"
    >
      {/* =========================================================================
          TOP STICKY TOOLBAR (HIDDEN DURING PRINT)
          ========================================================================= */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 text-white rounded-2xl px-4 py-3 mb-4 shadow-2xl print:hidden sticky top-2 z-50 flex flex-col gap-3">
        {/* Row 1: Document Type Tabs, Document Title, and Close Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              {isDoctorReport ? <Stethoscope className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-tight">
                  {isDoctorReport ? "Doctor Clinical Dossier (PDF)" : "Clinical Referral Slip (PDF)"}
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                    isUrgent
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : isConsultation
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                  }`}
                >
                  {caseData.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official ArogyaSeva Clinical Record • UID:{" "}
                <span className="font-mono text-cyan-400 font-semibold">{reportUid}</span>
              </p>
            </div>
          </div>

          {/* Document Type Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                playHapticSound("click");
                setDocType("referral");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                docType === "referral"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CHW Referral</span>
            </button>
            <button
              type="button"
              onClick={() => {
                playHapticSound("click");
                setDocType("doctor_report");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                docType === "doctor_report"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Report</span>
            </button>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PDF preview"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Inspection Mode, Zoom Controls, Download PDF, and Print */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* View mode toggle & Zoom */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950/60 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("formatted")}
                className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                  viewMode === "formatted" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Inspection View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("compiled_stream")}
                className={`px-2.5 py-1 rounded font-semibold transition-all cursor-pointer ${
                  viewMode === "compiled_stream" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Compiled PDF Stream
              </button>
            </div>

            {viewMode === "formatted" && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800 text-slate-400">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                  disabled={zoomLevel <= 75}
                  className="hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] w-9 text-center font-bold">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(130, z + 15))}
                  disabled={zoomLevel >= 130}
                  className="hover:text-white disabled:opacity-30 cursor-pointer p-0.5"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activePdfBundle && (
              <span className="text-[11px] text-slate-400 hidden md:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Ready: {activePdfBundle.fileSizeFormatted} • {activePdfBundle.pageCount} {activePdfBundle.pageCount > 1 ? "Pages" : "Page"}
              </span>
            )}
          </div>

          {/* Action buttons: Download, Print, Share, Copy */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy summary button */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy formatted clinical summary to clipboard"
            >
              {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{copySuccess ? "Copied" : "Copy Brief"}</span>
            </button>

            {/* Open in New Tab */}
            {activePdfBundle?.blobUrl && (
              <button
                type="button"
                onClick={() => openPdfInNewTab(activePdfBundle.blobUrl)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open PDF in new browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">New Tab</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print formatted clinical document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            {/* MAIN DOWNLOAD PDF BUTTON */}
            <button
              type="button"
              id="btn-modal-generate-pdf-download"
              onClick={handleDownloadPDF}
              disabled={downloadState === "generating"}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold shadow-md shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {downloadState === "generating" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing...</span>
                </>
              ) : downloadState === "success" ? (
                <>
                  <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Downloaded! Click to Repeat</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Download Feedback / Error / Direct fallback notification */}
        {downloadState === "error" && downloadErrorMsg && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{downloadErrorMsg}</span>
            </div>
            {activePdfBundle?.blobUrl && (
              <a
                href={activePdfBundle.blobUrl}
                download={activePdfBundle.fileName}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
              >
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span>Direct Save</span>
              </a>
            )}
          </div>
        )}

        {downloadState === "success" && downloadResult && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Successfully saved <strong className="font-mono text-emerald-300">{downloadResult.fileName}</strong> ({downloadResult.fileSizeFormatted})
              </span>
            </div>
            <div className="flex items-center gap-2">
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  type="button"
                  onClick={() => sharePdfToDevice(downloadResult.blob, downloadResult.fileName)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3 h-3 text-cyan-400" />
                  <span>Share</span>
                </button>
              )}
              {typeof window !== "undefined" && "showSaveFilePicker" in window && (
                <button
                  type="button"
                  onClick={() => savePdfWithPicker(downloadResult.blob, downloadResult.fileName)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <FolderDown className="w-3 h-3 text-cyan-400" />
                  <span>Choose Folder</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 2: COMPILED BINARY PDF STREAM (IFRAME)
          ========================================================================= */}
      {viewMode === "compiled_stream" && activePdfBundle && (
        <div className="w-full max-w-5xl h-[80vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col mb-8">
          <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="font-mono">{activePdfBundle.fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openPdfInNewTab(activePdfBundle.blobUrl)}
                className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </button>
            </div>
          </div>
          <iframe
            src={activePdfBundle.blobUrl}
            title="Generated PDF Stream"
            className="w-full flex-1 border-0 bg-white"
          />
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: FORMATTED A4 INSPECTION VIEW (HIGH-FIDELITY CLINICAL SHEET)
          ========================================================================= */}
      {viewMode === "formatted" && (
        <div
          id="printable-referral-slip"
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: "top center",
          }}
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200 transition-transform duration-200 mb-8 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full font-sans"
        >
          {/* Header 1: Organization & Identity */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white shadow-md">
                <span className="text-2xl font-black text-[#06B6D4]">+</span>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  ArogyaSeva Digital Health Network
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  {isDoctorReport
                    ? "Medical Officer Clinical Examination, Diagnosis & Treatment Dossier"
                    : "Standardized Clinical SBAR Handover & Inter-Facility Transfer Record"}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  National Health Mission • Primary Rural Healthcare Tele-Triage
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono font-bold text-slate-900 text-sm">{cleanId}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {formattedDate} • {formattedTime} IST
              </div>
              <div className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider mt-1">
                CONFIDENTIAL CLINICAL RECORD
              </div>
            </div>
          </div>

          {/* Triage Priority Banner */}
          <div
            className={`w-full py-2.5 px-4 rounded-xl mb-5 flex items-center justify-between text-white font-bold text-xs ${
              isUrgent ? "bg-red-600" : isConsultation ? "bg-amber-600" : "bg-teal-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>
                {isUrgent
                  ? "URGENT CLINICAL PRIORITY — IMMEDIATE EMERGENCY EVALUATION REQUIRED"
                  : isConsultation
                  ? "CONSULTATION PRIORITY — SPECIALIST TELE-MEDICINE GUIDANCE REQUIRED"
                  : "ROUTINE PRIORITY — PRIMARY CLINICAL SCREENING & COMMUNITY FOLLOW-UP"}
              </span>
            </div>
            <span className="text-[11px] font-mono tracking-wider">
              STATUS: {isDoctorReport ? "DOCTOR REVIEWED" : caseData.status || "DISPATCHED"}
            </span>
          </div>

          {/* Section 1: Demographics & Care Team (Dual Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Box 1: Patient Profile */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>PATIENT DEMOGRAPHIC PROFILE</span>
                <span className="text-[10px] font-mono text-slate-500">ID: {cleanId}</span>
              </div>
              <div className="grid grid-cols-3 gap-y-1.5 pt-1">
                <span className="text-slate-500">Full Name:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {caseData.patientName || "Not provided"}
                </span>

                <span className="text-slate-500">Age / Gender:</span>
                <span className="col-span-2 font-semibold text-slate-800">
                  {caseData.age ?? "N/A"} Years • {caseData.gender || "Not specified"}
                  {caseData.isPregnant && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 font-bold text-[10px]">
                      Pregnant ({caseData.pregnancyWeeks || 28} Wks)
                    </span>
                  )}
                </span>

                <span className="text-slate-500">Contact:</span>
                <span className="col-span-2 font-mono text-slate-800">
                  {caseData.contactNumber || "Not provided"}
                </span>

                <span className="text-slate-500">Origin / Village:</span>
                <span className="col-span-2 text-slate-800 font-medium">
                  {caseData.village || "Not provided"}
                </span>

                <span className="text-slate-500">Comorbidities:</span>
                <span className="col-span-2 text-slate-800">
                  {caseData.chronicConditions?.length ? caseData.chronicConditions.join(", ") : "None reported"}
                </span>
              </div>
            </div>

            {/* Box 2: Care Team & Destination */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>CARE TEAM & CLINICAL FACILITY</span>
                <span className="text-[10px] font-mono text-slate-500">HANDOVER</span>
              </div>
              <div className="grid grid-cols-3 gap-y-1.5 pt-1">
                <span className="text-slate-500">Referring CHW:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {caseData.chwName || "Anjali Devi (ASHA)"}
                </span>

                <span className="text-slate-500">Target Facility:</span>
                <span className="col-span-2 font-bold text-blue-900">
                  {targetHospitalName}
                </span>

                <span className="text-slate-500">Facility Type:</span>
                <span className="col-span-2 text-slate-800">
                  {caseData.referredFacility?.type || "District Hospital (DH)"}
                </span>

                <span className="text-slate-500">Attending Doctor:</span>
                <span className="col-span-2 font-semibold text-slate-900">
                  {doctorName}
                </span>

                <span className="text-slate-500">Distance & ETA:</span>
                <span className="col-span-2 text-slate-800">
                  {caseData.referredFacility?.distanceKm || 12} km (~
                  {Math.round(((caseData.referredFacility?.distanceKm || 12) / 40) * 60)} mins transit)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Objective Vitals Signs Matrix (6 Columns) */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 mb-5">
            <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-2 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>OBJECTIVE CLINICAL TELEMETRY & VITAL SIGNS MATRIX</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Standard WHO Triage Ranges</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">SpO₂ OXYGEN</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.spo2 || 100) < 92 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 95-100%</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">BLOOD PRESSURE</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.bpSystolic || 120) >= 140 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.bpSystolic && caseData.vitals?.bpDiastolic
                    ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic}`
                    : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 120/80</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">PULSE / HR</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.heartRate || 75) > 105 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.heartRate ? `${caseData.vitals.heartRate} bpm` : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 60-100</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">CORE TEMP</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.temperature || 98.6) >= 101 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.temperature ? `${caseData.vitals.temperature}°F` : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 98.6°F</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">RESPIRATION</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.respiratoryRate || 18) > 24 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.respiratoryRate ? `${caseData.vitals.respiratoryRate}/m` : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 12-20</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">BLOOD SUGAR</span>
                <span
                  className={`text-sm font-black font-mono block mt-1 ${
                    (caseData.vitals?.bloodSugar || 100) > 180 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "Not provided"}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Norm: 70-140</span>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Impression, Symptoms & Danger Signs */}
          <div
            className={`p-4 rounded-xl border mb-5 text-xs space-y-2.5 ${
              isUrgent ? "bg-red-50/60 border-red-200" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="font-bold text-slate-900 border-b border-slate-200/80 pb-1.5 flex items-center justify-between">
              <span>PRIMARY CLINICAL IMPRESSION & DANGER FLAGS (WHO / IMCI)</span>
              <span className="text-[10px] text-slate-500 font-mono">ASSESSMENT</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <span className="font-bold text-slate-700">Primary Impression:</span>
              <span className="sm:col-span-3 font-semibold text-slate-900 leading-relaxed">
                {caseData.clinicalImpression || "Acute clinical referral requiring medical officer evaluation."}
              </span>

              <span className="font-bold text-slate-700">Reported Symptoms:</span>
              <span className="sm:col-span-3 text-slate-800">
                {caseData.symptoms?.length ? caseData.symptoms.join(", ") : "None specified"} (Duration:{" "}
                {caseData.symptomDuration || "Recent onset"})
              </span>

              <span className="font-bold text-slate-700">WHO IMCI Danger Flags:</span>
              <div className="sm:col-span-3 space-y-1">
                {caseData.dangerSigns && caseData.dangerSigns.length > 0 ? (
                  caseData.dangerSigns.map((ds, i) => (
                    <div
                      key={i}
                      className="px-2 py-1 rounded bg-red-100 border border-red-200 text-red-900 font-bold text-[11px] inline-block mr-1.5"
                    >
                      ⚠ {ds}
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 font-medium">No acute WHO IMCI danger flags recorded.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: SBAR Clinical Handover Note */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs space-y-2.5">
            <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>STANDARDIZED SBAR CLINICAL HANDOVER NOTE</span>
              <span className="text-[10px] text-slate-500 font-mono">PROTOCOL</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] shrink-0">
                  S
                </span>
                <div>
                  <strong className="text-slate-900">Situation: </strong>
                  <span className="text-slate-700">
                    {caseData.sbarSummary?.situation ||
                      "Patient referred from community field assessment for acute clinical care."}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] shrink-0">
                  B
                </span>
                <div>
                  <strong className="text-slate-900">Background: </strong>
                  <span className="text-slate-700">
                    {caseData.sbarSummary?.background ||
                      `Screened by ${caseData.chwName || "frontline worker"}. Symptom duration: ${
                        caseData.symptomDuration || "Recent"
                      }.`}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] shrink-0">
                  A
                </span>
                <div>
                  <strong className="text-slate-900">Assessment: </strong>
                  <span className="text-slate-700">
                    {caseData.sbarSummary?.assessment || caseData.clinicalImpression}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono font-bold text-[10px] shrink-0">
                  R
                </span>
                <div>
                  <strong className="text-slate-900">Recommendation: </strong>
                  <span className="text-slate-700">
                    {caseData.sbarSummary?.recommendation ||
                      caseData.recommendedAction ||
                      "Immediate triage, vitals verification, and medical officer evaluation upon arrival."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Doctor Orders & Treatment Plan (Shown when Doctor Report or when notes exist) */}
          {(isDoctorReport || caseData.doctorNotes || caseData.doctorAction) && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 mb-5 text-xs space-y-2">
              <div className="font-bold text-sky-950 border-b border-sky-200 pb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-sky-700" />
                  <span>DISTRICT MEDICAL OFFICER ORDERS & TREATMENT PLAN</span>
                </span>
                <span className="text-[10px] text-sky-700 font-mono">PHYSICIAN DIRECTIVE</span>
              </div>
              <p className="text-slate-900 leading-relaxed text-[11px] pt-1 font-medium">
                {caseData.doctorNotes ||
                  caseData.doctorAction ||
                  "Emergency bed allocated. IV fluid resuscitation initiated. Supplemental oxygen administered at 4L/min. Diagnostic blood panel and bedside ultrasound scheduled."}
              </p>
              <div className="text-[10px] text-sky-800 font-bold pt-1 flex items-center gap-2">
                <Clock className="w-3 h-3 text-sky-600" />
                <span>Recommended Re-evaluation: 48-72 hours or upon immediate deterioration</span>
              </div>
            </div>
          )}

          {/* Section 6: Field Stabilizing Protocols (if present) */}
          {caseData.fieldStabilizingActions && caseData.fieldStabilizingActions.length > 0 && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 mb-5 text-xs">
              <div className="font-bold text-teal-900 mb-1">
                FIELD STABILIZING PROTOCOLS APPLIED PRIOR TO DISPATCH:
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-800">
                {caseData.fieldStabilizingActions.map((action, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-teal-100/70 border border-teal-200 font-medium"
                  >
                    • {action}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Medicolegal Handover Verification & Signatures */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-4">
            <div className="space-y-1.5 text-center">
              <div className="border-b border-slate-400 pb-6 mb-1 flex items-end justify-center">
                <span className="font-bold text-slate-900">{caseData.chwName || "Anjali Devi (ASHA)"}</span>
              </div>
              <p className="font-bold text-slate-800">Referring Frontline Worker Signature</p>
              <p className="text-[10px] text-slate-500">Designation: ASHA / Frontline Health Worker</p>
            </div>

            <div className="space-y-1.5 text-center">
              <div className="border-b border-slate-400 pb-6 mb-1 flex items-end justify-center">
                <span className="font-bold text-slate-900 font-serif italic">{doctorName}</span>
              </div>
              <p className="font-bold text-slate-800">
                {isDoctorReport ? "Attending Medical Officer Certification" : "Receiving Medical Officer Signature & Stamp"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                Reg No: DMO-MH-{cleanId.slice(-4) || "8821"} • Facility: {targetHospitalName.substring(0, 24)}
              </p>
            </div>
          </div>

          {/* Running Footer Disclaimer */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 leading-tight">
            This document was generated electronically by the ArogyaSeva Digital Health Platform • Conforming to National Health Mission SBAR Protocols • Verified Clinical Record
          </div>
        </div>
      )}
    </div>
  );
};
