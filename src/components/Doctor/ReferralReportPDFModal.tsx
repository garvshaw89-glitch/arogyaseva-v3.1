import React, { useState } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  downloadReferralSlipPDF,
  openPdfInNewTab,
  savePdfWithPicker,
  sharePdfToDevice,
  PdfDownloadResult,
} from "../../utils/pdfGenerator";
import {
  Printer,
  Download,
  X,
  FileText,
  Hospital,
  AlertTriangle,
  QrCode,
  CheckCircle2,
  Copy,
  Share2,
  ExternalLink,
  FolderDown,
  Loader2,
  HardDriveDownload,
  FileCheck,
  User,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface ReferralReportPDFModalProps {
  caseData: PatientCase;
  isOpen: boolean;
  onClose: () => void;
  language?: SupportedLanguage;
}

export const ReferralReportPDFModal: React.FC<ReferralReportPDFModalProps> = ({
  caseData,
  isOpen,
  onClose,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadState, setDownloadState] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [downloadResult, setDownloadResult] = useState<PdfDownloadResult | null>(null);
  const [downloadErrorMsg, setDownloadErrorMsg] = useState<string | null>(null);
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  if (!isOpen || !caseData) return null;

  const isUrgent = caseData.riskLevel === "URGENT";
  const reportUid = `REF-AROGYA-${caseData.id}-${new Date(caseData.createdAt).getFullYear()}`;
  const formattedDate = new Date(caseData.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(caseData.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleDownloadPDF = async () => {
    try {
      setDownloadState("generating");
      setDownloadErrorMsg(null);
      playHapticSound("click");

      const result = await downloadReferralSlipPDF(caseData);
      setDownloadResult(result);

      if (result.success) {
        setDownloadState("success");
        setShowDownloadPanel(true);
        playHapticSound("success");
      } else {
        setDownloadState("error");
        setDownloadErrorMsg(result.error || "Automatic background download was restricted by the browser.");
        setShowDownloadPanel(true);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("PDF download execution failed:", err);
      setDownloadState("error");
      setDownloadErrorMsg(error?.message || "Failed to trigger PDF file download");
      setShowDownloadPanel(true);
    }
  };

  const handlePrint = () => {
    playHapticSound("click");
    window.print();
  };

  const handleDownloadTextSummary = () => {
    playHapticSound("click");
    const summaryText = `================================================================================
AROGYASEVA DIGITAL HEALTH PLATFORM
PRIMARY RURAL HEALTH EMERGENCY & CLINICAL REFERRAL REPORT
Document UID: ${reportUid}
Date: ${formattedDate} ${formattedTime}
================================================================================

PATIENT DEMOGRAPHIC PROFILE
--------------------------------------------------------------------------------
Name: ${caseData.patientName}
Age / Sex: ${caseData.age} Years / ${caseData.gender}
Contact: ${caseData.contactNumber || "N/A"}
Village / Origin: ${caseData.village} (Lat: ${caseData.villageLatitude || "22.81"}, Lon: ${caseData.villageLongitude || "77.78"})
Special Conditions: ${caseData.isPregnant ? `Pregnant (${caseData.pregnancyWeeks || 28} Wks)` : "None noted"}
Chronic Illnesses: ${caseData.chronicConditions?.join(", ") || "None recorded"}

TRIAGE & CLINICAL SEVERITY
--------------------------------------------------------------------------------
Priority Level: [${caseData.riskLevel} - ${isUrgent ? "CRITICAL IMMEDIATE EMERGENCY" : "STANDARD CLINICAL REFERRAL"}]
Primary Impression: ${caseData.clinicalImpression}
Reported Symptoms: ${caseData.symptoms?.join(", ") || "None"}
Symptom Duration: ${caseData.symptomDuration || "Unspecified"}
Danger Signs Identified:
${caseData.dangerSigns?.length ? caseData.dangerSigns.map((d) => ` * [CRITICAL] ${d}`).join("\n") : " * None explicitly recorded"}

OBJECTIVE FIELD VITALS MATRIX
--------------------------------------------------------------------------------
* SpO2 (Oxygen Saturation): ${caseData.vitals?.spo2}% (Normal: 95-100%) ${caseData.vitals?.spo2 && caseData.vitals.spo2 < 92 ? "[CRITICAL HYPOXIA]" : "[NORMAL]"}
* Blood Pressure: ${caseData.vitals?.bpSystolic}/${caseData.vitals?.bpDiastolic} mmHg (Normal: 120/80 mmHg)
* Heart Rate / Pulse: ${caseData.vitals?.heartRate} bpm (Normal: 60-100 bpm)
* Core Temperature: ${caseData.vitals?.temperature}°F (Normal: 97.8-99.1°F)
* Respiratory Rate: ${caseData.vitals?.respiratoryRate ? `${caseData.vitals.respiratoryRate}/min` : "Not recorded"}
* Random Blood Sugar: ${caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "Not tested"}

STANDARDIZED SBAR CLINICAL HANDOVER NOTE
--------------------------------------------------------------------------------
S (Situation): ${caseData.sbarSummary?.situation || "Patient referred from field for immediate hospital evaluation."}
B (Background): ${caseData.sbarSummary?.background || "Evaluated by Community Health Worker during field screening."}
A (Assessment): ${caseData.sbarSummary?.assessment || caseData.clinicalImpression}
R (Recommendation): ${caseData.sbarSummary?.recommendation || "Admit for emergency evaluation, oxygenation, and physician assessment."}

REFERRING LOGISTICS & TARGET HOSPITAL
--------------------------------------------------------------------------------
Referring CHW: ${caseData.chwName || "Anjali Devi (ASHA)"}
Designated Facility: ${caseData.referredFacility?.name || "District Hospital Emergency Trauma Center"}
Facility Category: ${caseData.referredFacility?.type || "District Hospital (DH)"}
Distance: ${caseData.referredFacility?.distanceKm || 12} km (Approx. ${Math.round(((caseData.referredFacility?.distanceKm || 12) / 45) * 60)} mins transit)

MEDICOLEGAL HANDOVER VERIFICATION
--------------------------------------------------------------------------------
Referring Frontline Worker Signature: _______________________ Date: ${formattedDate}
Receiving Medical Officer Signature: _______________________ Registration No: ________
Bed Assigned: _________ Ward / Department: __________________ Time Received: _________
================================================================================`;

    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Referral_Report_${caseData.patientName.replace(/\s+/g, "_")}_${caseData.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    playHapticSound("click");
    const brief = `[OFFICIAL CLINICAL REFERRAL REPORT - ${caseData.riskLevel}]
Patient: ${caseData.patientName} (${caseData.age}y, ${caseData.gender})
Village: ${caseData.village} | Case ID: ${caseData.id}
Impression: ${caseData.clinicalImpression}
Vitals: SpO2 ${caseData.vitals?.spo2}%, BP ${caseData.vitals?.bpSystolic}/${caseData.vitals?.bpDiastolic}, HR ${caseData.vitals?.heartRate}bpm, Temp ${caseData.vitals?.temperature}°F
Danger Signs: ${caseData.dangerSigns?.join(", ") || "None"}
Referred to: ${caseData.referredFacility?.name || "District Hospital"}
SBAR: ${caseData.sbarSummary?.situation} -> ${caseData.sbarSummary?.recommendation}`;

    navigator.clipboard.writeText(brief);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div
      id="referral-report-pdf-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-6"
    >
      {/* Top Floating Action Bar (Hidden during Print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 text-white rounded-2xl px-4 sm:px-6 py-3 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl print:hidden sticky top-2 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <span>Standardized Referral Report (PDF Preview)</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  isUrgent ? "bg-red-500/20 text-red-300 border border-red-500/40" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                }`}
              >
                {caseData.riskLevel}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              UID: {reportUid} • Patient: {caseData.patientName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-copy-clinical-summary"
            onClick={handleCopySummary}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy standardized summary to clipboard"
          >
            {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copySuccess ? "Copied!" : "Copy Text"}</span>
          </button>

          <button
            type="button"
            id="btn-download-pdf-report"
            onClick={handleDownloadPDF}
            disabled={downloadState === "generating"}
            className="text-xs font-bold px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            title="Download formatted official PDF referral document to device storage"
          >
            {downloadState === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : downloadState === "success" ? (
              <>
                <FileCheck className="w-4 h-4 text-emerald-300" />
                <span>Saved to Device</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="btn-download-txt-summary"
            onClick={handleDownloadTextSummary}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download standardized summary file"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Text</span>
          </button>

          <button
            type="button"
            id="btn-print-pdf-report"
            onClick={handlePrint}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Browser Print Preview"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden md:inline">Print</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Interactive Device Storage Download Confirmation Panel (Direct Anchor & Storage Access) */}
      {showDownloadPanel && downloadResult && (
        <div
          id="pdf-download-status-card"
          className={`w-full max-w-4xl mb-4 rounded-2xl p-4 sm:p-5 border shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-3 duration-300 z-40 print:hidden ${
            downloadState === "error"
              ? "bg-amber-950/95 border-amber-500/50 text-amber-100"
              : "bg-slate-900/95 border-cyan-500/50 text-white backdrop-blur-md"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-md ${
                downloadState === "error"
                  ? "bg-amber-600 text-white"
                  : "bg-emerald-600 text-white shadow-emerald-500/30"
              }`}
            >
              {downloadState === "error" ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  {downloadState === "error"
                    ? "Download Stream Intercepted"
                    : "PDF Referral Slip Downloaded"}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  {downloadResult.fileSizeFormatted}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5 break-all">
                {downloadResult.fileName}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {downloadState === "error"
                  ? "Automatic download was prevented by browser sandbox permissions. Click the direct button below to save:"
                  : "File stream dispatched to device storage (Downloads folder). If it didn't save automatically, use the direct buttons below:"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {/* Direct user-gesture anchor download link (100% bypass of iframe sandbox blocks) */}
            <a
              id="btn-direct-download-anchor"
              href={downloadResult.blobUrl}
              download={downloadResult.fileName}
              onClick={() => playHapticSound("success")}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              title="Click direct anchor link to download file"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>Save File Directly</span>
            </a>

            {/* Open in Browser PDF Viewer */}
            <button
              type="button"
              id="btn-open-pdf-viewer"
              onClick={() => {
                playHapticSound("click");
                openPdfInNewTab(downloadResult.blobUrl);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open and view in browser native PDF reader"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open PDF</span>
            </button>

            {/* Modern File Picker (Desktop Chrome / Android) */}
            {typeof window !== "undefined" && "showSaveFilePicker" in window && (
              <button
                type="button"
                id="btn-picker-save-pdf"
                onClick={async () => {
                  playHapticSound("click");
                  const saved = await savePdfWithPicker(downloadResult.blob, downloadResult.fileName);
                  if (saved) playHapticSound("success");
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hidden md:flex"
                title="Select folder on device storage"
              >
                <FolderDown className="w-3.5 h-3.5 text-blue-400" />
                <span>Choose Folder</span>
              </button>
            )}

            {/* Mobile Native Share Sheet (iOS Files / Android Storage) */}
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                id="btn-mobile-share-pdf"
                onClick={async () => {
                  playHapticSound("click");
                  await sharePdfToDevice(downloadResult.blob, downloadResult.fileName);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Share or Save to iOS Files / Android device"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Save to Files</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDownloadPanel(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Printable Sheet (Simulates standardized A4 Clinical Document) */}
      <div
        id="printable-standardized-referral-document"
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-8 sm:p-12 mb-8 space-y-6 print:m-0 print:p-8 print:shadow-none print:border-none print:rounded-none print:w-full font-sans"
        style={{ minHeight: "1050px" }}
      >
        {/* Official Letterhead & Institutional Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-slate-900 text-white rounded-xl flex flex-col items-center justify-center font-bold font-mono text-center p-1 leading-none shadow-sm print:border print:border-slate-900">
                <span className="text-[8px] uppercase tracking-widest text-cyan-400 font-sans">AROGYA</span>
                <span className="text-xl font-black text-cyan-300">+</span>
                <span className="text-[7px] uppercase tracking-wider text-slate-300">SEVA</span>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wider uppercase text-cyan-700">
                  ArogyaSeva
                </p>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase mt-0.5">
                  National Rural Health Referral Network
                </h1>
                <p className="text-xs font-semibold text-slate-700">
                  Standardized Clinical SBAR Handover & Inter-Facility Transfer Record
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="border-2 border-slate-900 p-1.5 rounded-lg bg-slate-50 flex items-center gap-2">
                <QrCode className="w-10 h-10 text-slate-900" />
                <div className="text-left font-mono text-[9px] leading-tight pr-1">
                  <span className="font-bold block text-slate-900">{caseData.id}</span>
                  <span className="text-slate-500">DIGITAL HASH</span>
                  <span className="text-emerald-700 font-bold block">VERIFIED</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                Doc UID: {reportUid}
              </span>
            </div>
          </div>

          {/* Quick Metadata Ribbon */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-700 font-mono gap-2">
            <div className="flex items-center gap-4">
              <span>
                <strong>DATE:</strong> {formattedDate}
              </span>
              <span>
                <strong>TIME:</strong> {formattedTime} IST
              </span>
              <span>
                <strong>DISPATCH SECTOR:</strong> {caseData.village}
              </span>
            </div>
            <div className="flex items-center gap-2 font-sans">
              <span className="text-[11px] font-semibold text-slate-600">TRIAGE CLASSIFICATION:</span>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded border ${
                  isUrgent
                    ? "bg-red-100 text-red-900 border-red-400 font-black"
                    : "bg-blue-100 text-blue-900 border-blue-400 font-bold"
                }`}
              >
                {caseData.riskLevel} PRIORITY REFERRAL
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Patient Demographic & Origin Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <User className="w-3.5 h-3.5 text-blue-700" />
              <span>Patient Demographic Profile</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Full Legal Name</span>
                <strong className="text-sm text-slate-900">{caseData.patientName}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Age / Biological Sex</span>
                <strong className="text-sm text-slate-900">
                  {caseData.age} Yrs / {caseData.gender}
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Phone Contact</span>
                <strong className="text-sm text-slate-900">{caseData.contactNumber || "N/A (Field Recorded)"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Origin Village</span>
                <strong className="text-xs text-slate-900">{caseData.village}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">GPS Geo-Coordinates</span>
                <span className="text-xs font-mono text-slate-700">
                  {caseData.villageLatitude ? `${caseData.villageLatitude.toFixed(4)}, ${caseData.villageLongitude?.toFixed(4)}` : "22.8115, 77.7845"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Maternal Status</span>
                <strong className={`text-xs ${caseData.isPregnant ? "text-amber-800 font-bold" : "text-slate-700"}`}>
                  {caseData.isPregnant ? `Pregnant (${caseData.pregnancyWeeks || 28} Weeks)` : "Not Pregnant"}
                </strong>
              </div>
            </div>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Referring CHW Worker</span>
            </h4>
            <div className="text-xs space-y-1.5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">ASHA Worker Name</span>
                <strong className="text-slate-900">{caseData.chwName || "Anjali Devi (ASHA)"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Sub-Center / Node</span>
                <span className="text-slate-800 font-medium">Kolkata Sub-Center • Node: ASHA-Kolkata</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Emergency Channel</span>
                <span className="font-mono text-emerald-700 font-semibold">Mesh Sync / 108 CAD Uplink</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Standardized Objective Field Vitals Matrix */}
        <div className="border border-slate-300 rounded-xl overflow-hidden">
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Standardized Objective Field Vitals Matrix</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-300">CALIBRATED FIELD TELEMETRY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 font-bold">Vital Parameter</th>
                  <th className="py-2.5 px-3 font-bold">Recorded Value</th>
                  <th className="py-2.5 px-3 font-bold">Normal Benchmark</th>
                  <th className="py-2.5 px-3 font-bold">Clinical Significance / Alert Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                <tr className={caseData.vitals.spo2 < 92 ? "bg-red-50/80 font-semibold text-red-950" : ""}>
                  <td className="py-2 px-3">Oxygen Saturation (SpO₂)</td>
                  <td className="py-2 px-3 font-bold text-sm">
                    {caseData.vitals.spo2}%
                  </td>
                  <td className="py-2 px-3 text-slate-500">95% – 100%</td>
                  <td className="py-2 px-3">
                    {caseData.vitals.spo2 < 90 ? (
                      <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300 text-[11px]">
                        CRITICAL HYPOXEMIA — O2 THERAPY MANDATED
                      </span>
                    ) : caseData.vitals.spo2 < 94 ? (
                      <span className="text-amber-800 font-bold">Moderate Hypoxia (Monitor Closely)</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Normal Atmospheric Saturation</span>
                    )}
                  </td>
                </tr>
                <tr className={caseData.vitals.bpSystolic >= 140 || caseData.vitals.bpDiastolic >= 90 ? "bg-amber-50/80" : ""}>
                  <td className="py-2 px-3">Blood Pressure (BP)</td>
                  <td className="py-2 px-3 font-bold text-sm">
                    {caseData.vitals.bpSystolic}/{caseData.vitals.bpDiastolic} mmHg
                  </td>
                  <td className="py-2 px-3 text-slate-500">90/60 – 120/80 mmHg</td>
                  <td className="py-2 px-3">
                    {caseData.vitals.bpSystolic >= 160 || caseData.vitals.bpDiastolic >= 100 ? (
                      <span className="text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded border border-red-300 text-[11px]">
                        STAGE 2 HYPERTENSIVE RANGE (Check for preeclampsia if pregnant)
                      </span>
                    ) : caseData.vitals.bpSystolic >= 140 ? (
                      <span className="text-amber-800 font-semibold">Stage 1 Elevated Pressure</span>
                    ) : caseData.vitals.bpSystolic < 90 ? (
                      <span className="text-red-700 font-bold">Hypotension / Shock Warning</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Normotensive</span>
                    )}
                  </td>
                </tr>
                <tr className={caseData.vitals.heartRate > 100 ? "bg-amber-50/50" : ""}>
                  <td className="py-2 px-3">Heart Rate (Pulse)</td>
                  <td className="py-2 px-3 font-bold text-sm">{caseData.vitals.heartRate} bpm</td>
                  <td className="py-2 px-3 text-slate-500">60 – 100 bpm</td>
                  <td className="py-2 px-3">
                    {caseData.vitals.heartRate > 110 ? (
                      <span className="text-red-700 font-semibold">Marked Sinus Tachycardia (Compensatory or febrile)</span>
                    ) : caseData.vitals.heartRate > 100 ? (
                      <span className="text-amber-800 font-medium">Mild Tachycardia</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Normal Sinus Rhythm Range</span>
                    )}
                  </td>
                </tr>
                <tr className={caseData.vitals.temperature >= 101 ? "bg-red-50/50" : ""}>
                  <td className="py-2 px-3">Core Body Temperature</td>
                  <td className="py-2 px-3 font-bold text-sm">{caseData.vitals.temperature}°F</td>
                  <td className="py-2 px-3 text-slate-500">97.8°F – 99.1°F</td>
                  <td className="py-2 px-3">
                    {caseData.vitals.temperature >= 102 ? (
                      <span className="text-red-700 font-bold">High Grade Pyrexia (Risk of dehydration/febrile seizure)</span>
                    ) : caseData.vitals.temperature >= 100 ? (
                      <span className="text-amber-800 font-medium">Low Grade Fever</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Afebrile / Normal</span>
                    )}
                  </td>
                </tr>
                {caseData.vitals.respiratoryRate && (
                  <tr>
                    <td className="py-2 px-3">Respiratory Rate</td>
                    <td className="py-2 px-3 font-bold text-sm">{caseData.vitals.respiratoryRate} /min</td>
                    <td className="py-2 px-3 text-slate-500">12 – 20 /min</td>
                    <td className="py-2 px-3">
                      {caseData.vitals.respiratoryRate > 24 ? (
                        <span className="text-red-700 font-semibold">Tachypnea — Increased Work of Breathing</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Normal Eupneic Respiration</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Clinical Impression & WHO/IMCI Danger Signs */}
        <div className="border-2 border-red-300 bg-red-50/70 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between border-b border-red-200 pb-1.5">
            <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Primary Syndromic Assessment & Danger Flags (WHO / IMCI Protocol)</span>
            </h4>
            <span className="text-[10px] font-mono text-red-800 font-bold uppercase">
              SEVERITY: {caseData.riskLevel}
            </span>
          </div>

          <div className="pt-1">
            <p className="text-sm font-black text-red-950">
              {caseData.clinicalImpression}
            </p>
            <p className="text-xs text-slate-700 mt-1">
              <strong>Reported Symptoms & Onset:</strong> {caseData.symptoms?.join(", ")} (Duration: {caseData.symptomDuration || "3 days"})
            </p>
          </div>

          {caseData.dangerSigns && caseData.dangerSigns.length > 0 && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block mb-1">
                Verified Clinical Danger Signs Identified:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-red-900 font-semibold">
                {caseData.dangerSigns.map((ds, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>{ds}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Section 4: Standardized SBAR Clinical Handover Matrix */}
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="bg-slate-800 text-white px-4 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Standardized SBAR Handover Note (Situation • Background • Assessment • Recommendation)
            </h4>
          </div>

          <div className="p-4 space-y-3 text-xs text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <span className="font-bold text-slate-900 uppercase font-mono text-[11px] md:col-span-1">
                [S] Situation:
              </span>
              <p className="md:col-span-3 text-slate-800">
                {caseData.sbarSummary?.situation || "Acute rural field referral presenting with critical signs requiring doctor evaluation."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900 uppercase font-mono text-[11px] md:col-span-1">
                [B] Background:
              </span>
              <p className="md:col-span-3 text-slate-800">
                {caseData.sbarSummary?.background || "Screened by frontline community health worker using standardized clinical decision support algorithms."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900 uppercase font-mono text-[11px] md:col-span-1">
                [A] Assessment:
              </span>
              <p className="md:col-span-3 text-slate-800">
                {caseData.sbarSummary?.assessment || caseData.clinicalImpression}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900 uppercase font-mono text-[11px] md:col-span-1">
                [R] Recommendation:
              </span>
              <p className="md:col-span-3 text-slate-800 font-semibold">
                {caseData.sbarSummary?.recommendation || "Immediate physician evaluation, oxygen readiness, and inpatient bed assignment."}
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Target Facility & Transit Destination */}
        <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Target Designated Receiving Hospital
              </span>
              <strong className="text-sm text-slate-900">
                {caseData.referredFacility?.name || "District Hospital Emergency Trauma Center"}
              </strong>
              <p className="text-[11px] text-slate-600">
                Tier: {caseData.referredFacility?.type || "District Hospital (DH)"} • Approx {caseData.referredFacility?.distanceKm || 12} km away (Est. Transit: {Math.round(((caseData.referredFacility?.distanceKm || 12) / 45) * 60)} mins)
              </p>
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Emergency Desk Contact</span>
            <span className="font-bold text-blue-700 font-mono text-sm">108 / +91-755-2445890</span>
            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">● Bed & Oxygen Verified</span>
          </div>
        </div>

        {/* Section 6: Medicolegal & Handover Signatures */}
        <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs break-inside-avoid">
          <div className="space-y-1 text-center">
            <div className="border-b-2 border-slate-400 pb-8 mb-1 flex items-end justify-center">
              <span className="font-bold text-slate-900">{caseData.chwName || "Anjali Devi (ASHA)"}</span>
            </div>
            <p className="font-bold text-slate-800">Referring Frontline Worker Signature</p>
            <p className="text-[10px] text-slate-500">Designation: ASHA / CHW • Node: ASHA-Kolkata</p>
          </div>

          <div className="space-y-1 text-center">
            <div className="border-b-2 border-slate-400 pb-8 mb-1 flex items-end justify-center">
              <span className="text-slate-400 italic text-[11px]">(Doctor Signature & Stamp upon Intake)</span>
            </div>
            <p className="font-bold text-slate-800">Receiving Emergency Medical Officer Signature</p>
            <p className="text-[10px] text-slate-500">State Medical Council Reg. No: ______________ | Bed: _________</p>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 leading-tight">
          Generated via ArogyaSeva Clinical Decision & Rural Referral Network. This standardized document conforms to National Health Mission SBAR clinical transfer protocols.
        </div>
      </div>

      {/* Bottom Action Toolbar (Sticky/Accessible after reviewing the full report) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 text-white rounded-2xl px-4 sm:px-6 py-3.5 mb-8 flex flex-wrap items-center justify-between gap-3 shadow-2xl print:hidden">
        <div className="text-xs text-slate-400">
          ArogyaSeva Official Record • Document UID:{" "}
          <span className="font-mono text-cyan-400 font-semibold">{reportUid}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-footer-download-pdf-report"
            onClick={handleDownloadPDF}
            disabled={downloadState === "generating"}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            title="Download formatted official PDF referral document to device storage"
          >
            {downloadState === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : downloadState === "success" ? (
              <>
                <FileCheck className="w-4 h-4 text-emerald-300" />
                <span>Download Again</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF to Device</span>
              </>
            )}
          </button>

          {downloadResult && (
            <a
              id="btn-footer-direct-anchor"
              href={downloadResult.blobUrl}
              download={downloadResult.fileName}
              onClick={() => playHapticSound("success")}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Direct file download link"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Link</span>
            </a>
          )}

          <button
            type="button"
            id="btn-footer-export-text"
            onClick={handleDownloadTextSummary}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Text</span>
          </button>

          <button
            type="button"
            id="btn-footer-print-report"
            onClick={handlePrint}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer ml-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
