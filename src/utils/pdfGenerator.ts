import { jsPDF } from "jspdf";
import { PatientCase } from "../types";

export interface PdfDownloadResult {
  success: boolean;
  fileName: string;
  fileSizeFormatted: string;
  blob: Blob;
  blobUrl: string;
  dataUri: string;
  savedViaPicker?: boolean;
  error?: string;
}

export interface GeneratedPdfBundle {
  doc: jsPDF;
  fileName: string;
  blob: Blob;
  blobUrl: string;
  fileSizeFormatted: string;
  dataUri: string;
}

/**
 * Builds the official ArogyaSeva Clinical Referral SBAR Document PDF instance.
 */
export function generateReferralPDF(caseData: PatientCase): GeneratedPdfBundle {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const isUrgent = caseData.riskLevel === "URGENT";
  const formattedDate = new Date(caseData.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(caseData.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Top Header Banner (ArogyaSeva Primary Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  // ArogyaSeva Brand Mark
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.roundedRect(margin, 5, 10, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("+", margin + 3.2, 12);

  // ArogyaSeva Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ArogyaSeva", margin + 14, 11);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Digital Health Referral Network • Clinical SBAR Handover Record", margin + 14, 16);

  // Right-aligned Document Meta
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`CASE: ${caseData.id}`, pageWidth - margin, 9, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`DATE: ${formattedDate} ${formattedTime}`, pageWidth - margin, 14, { align: "right" });
  doc.text("NODE: ASHA-Kolkata", pageWidth - margin, 19, { align: "right" });

  let y = 33;

  // 2. Priority Banner
  if (isUrgent) {
    doc.setFillColor(220, 38, 38); // red-600
  } else if (caseData.riskLevel === "CONSULTATION") {
    doc.setFillColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(16, 185, 129); // emerald-600
  }
  doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `[ ${caseData.riskLevel} PRIORITY REFERRAL ] - ${
      isUrgent ? "CRITICAL EMERGENCY - IMMEDIATE ATTENTION REQUIRED" : "CLINICAL FIELD REFERRAL"
    }`,
    margin + 4,
    y + 6
  );

  y += 14;

  // 3. Section: Patient Demographic Profile
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("PATIENT DEMOGRAPHIC PROFILE", margin + 4, y + 6);

  doc.setFontSize(8.5);
  // Column 1
  doc.setFont("helvetica", "bold");
  doc.text("Name:", margin + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.patientName || "Unknown", margin + 22, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Age / Sex:", margin + 4, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${caseData.age} Yrs / ${caseData.gender}`, margin + 22, y + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Contact:", margin + 4, y + 24);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.contactNumber || "N/A", margin + 22, y + 24);

  // Column 2
  const col2X = margin + 70;
  doc.setFont("helvetica", "bold");
  doc.text("Origin / Village:", col2X, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.village || "Local Sector", col2X + 26, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Special Status:", col2X, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(
    caseData.isPregnant ? `Pregnant (${caseData.pregnancyWeeks || 28} Wks)` : "None noted",
    col2X + 26,
    y + 18
  );

  doc.setFont("helvetica", "bold");
  doc.text("Chronic Illness:", col2X, y + 24);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.chronicConditions?.join(", ") || "None recorded", col2X + 26, y + 24);

  // Column 3 (Ref Facility & Worker)
  const col3X = margin + 125;
  doc.setFont("helvetica", "bold");
  doc.text("Target Hospital:", col3X, y + 12);
  doc.setFont("helvetica", "normal");
  const targetFac = caseData.referredFacility?.name || "District Hospital";
  const truncatedFac = targetFac.length > 25 ? targetFac.substring(0, 23) + "..." : targetFac;
  doc.text(truncatedFac, col3X + 24, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Referring CHW:", col3X, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(caseData.chwName || "Anjali Devi (ASHA)", col3X + 24, y + 18);

  doc.setFont("helvetica", "bold");
  doc.text("Health Node:", col3X, y + 24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text("ASHA-Kolkata", col3X + 24, y + 24);
  doc.setTextColor(15, 23, 42);

  y += 33;

  // 4. Objective Vitals Matrix
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("OBJECTIVE FIELD VITALS MATRIX", margin + 4, y + 6);

  const vitals = [
    {
      label: "SpO2 Oxygen",
      val: caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : "Not checked",
      alert: caseData.vitals?.spo2 && caseData.vitals.spo2 < 92,
    },
    {
      label: "Blood Pressure",
      val: caseData.vitals?.bpSystolic
        ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic || 80} mmHg`
        : "Not checked",
      alert: caseData.vitals?.bpSystolic && (caseData.vitals.bpSystolic > 140 || caseData.vitals.bpSystolic < 90),
    },
    {
      label: "Pulse / HR",
      val: caseData.vitals?.heartRate ? `${caseData.vitals.heartRate} bpm` : "Not checked",
      alert: caseData.vitals?.heartRate && (caseData.vitals.heartRate > 110 || caseData.vitals.heartRate < 50),
    },
    {
      label: "Temperature",
      val: caseData.vitals?.temperature ? `${caseData.vitals.temperature}°F` : "Not checked",
      alert: caseData.vitals?.temperature && caseData.vitals.temperature >= 101,
    },
    {
      label: "Resp. Rate",
      val: caseData.vitals?.respiratoryRate ? `${caseData.vitals.respiratoryRate}/min` : "Standard",
      alert: caseData.vitals?.respiratoryRate && caseData.vitals.respiratoryRate > 24,
    },
    {
      label: "Blood Sugar",
      val: caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "Not tested",
      alert: false,
    },
  ];

  const colW = contentWidth / 6;
  vitals.forEach((v, idx) => {
    const vx = margin + idx * colW + 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(v.label, vx, y + 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    if (v.alert) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(v.val, vx, y + 19);
  });

  y += 29;

  // 5. Clinical Impression & Danger Signs Box
  doc.setFillColor(254, 242, 242); // light red tint if urgent
  if (!isUrgent) doc.setFillColor(248, 250, 252);
  doc.setDrawColor(isUrgent ? 252 : 203, isUrgent ? 165 : 213, isUrgent ? 165 : 225);
  doc.roundedRect(margin, y, contentWidth, 30, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(isUrgent ? 185 : 15, isUrgent ? 28 : 23, isUrgent ? 28 : 42);
  doc.text("CLINICAL EVALUATION & DANGER SIGNS", margin + 4, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Primary Impression:", margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  const impressionText = doc.splitTextToSize(caseData.clinicalImpression || "Acute Clinical Referral", contentWidth - 42);
  doc.text(impressionText, margin + 38, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text("Reported Symptoms:", margin + 4, y + 20);
  doc.setFont("helvetica", "normal");
  const sympText = `${(caseData.symptoms || []).join(", ") || "None specified"} (Duration: ${caseData.symptomDuration || "Recent"})`;
  doc.text(doc.splitTextToSize(sympText, contentWidth - 42), margin + 38, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 38, 38);
  doc.text("Danger Flags:", margin + 4, y + 27);
  doc.setFont("helvetica", "bold");
  const dangerStr = caseData.dangerSigns?.length ? caseData.dangerSigns.join(" • ") : "No overt immediate red flags identified";
  doc.text(doc.splitTextToSize(dangerStr, contentWidth - 42), margin + 38, y + 27);

  y += 35;

  // 6. SBAR Standardized Clinical Handover Section
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("STANDARDIZED SBAR CLINICAL HANDOVER", margin + 4, y + 6);

  const sbar = [
    {
      code: "S",
      title: "Situation",
      text: caseData.sbarSummary?.situation || "Patient referred from community field assessment for clinical care.",
    },
    {
      code: "B",
      title: "Background",
      text: caseData.sbarSummary?.background || `Evaluated by frontline worker ${caseData.chwName || "ASHA"}. Duration: ${caseData.symptomDuration || "Recent"}.`,
    },
    {
      code: "A",
      title: "Assessment",
      text: caseData.sbarSummary?.assessment || caseData.clinicalImpression,
    },
    {
      code: "R",
      title: "Recommendation",
      text: caseData.sbarSummary?.recommendation || caseData.recommendedAction || "Immediate triage, vitals verification, and medical officer consultation.",
    },
  ];

  let sbarY = y + 13;
  sbar.forEach((item) => {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin + 4, sbarY - 3.5, 5, 5, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(item.code, margin + 5.5, sbarY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.title}:`, margin + 11, sbarY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(item.text, contentWidth - 40);
    doc.text(splitDesc, margin + 38, sbarY);

    sbarY += 10;
  });

  y += 59;

  // 7. Field Stabilizing Measures Applied
  if (caseData.fieldStabilizingActions && caseData.fieldStabilizingActions.length > 0) {
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(153, 246, 228); // teal-200
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text("FIELD STABILIZING PROTOCOLS APPLIED BEFORE TRANSIT:", margin + 4, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const actionsStr = caseData.fieldStabilizingActions.map((a) => `• ${a}`).join("   ");
    doc.text(doc.splitTextToSize(actionsStr, contentWidth - 8), margin + 4, y + 11.5);

    y += 23;
  }

  // 8. Signatures & Institutional Verification
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  const halfW = (contentWidth - 10) / 2;

  // Left: Referring Worker
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Referring Frontline Worker", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${caseData.chwName || "Anjali Devi (ASHA)"}`, margin, y + 5);
  doc.text("Designation: Frontline Health Worker (ASHA / CHW)", margin, y + 10);
  doc.text("Node: ASHA-Kolkata", margin, y + 15);
  doc.text("Signature: ___________________________", margin, y + 22);

  // Right: Receiving Doctor
  const rightX = margin + halfW + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Receiving Medical Officer (Hospital Handover)", rightX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Facility: ${caseData.referredFacility?.name || "District Hospital"}`, rightX, y + 5);
  doc.text("Doctor Name & Reg. No: ____________________", rightX, y + 10);
  doc.text("Ward / Bed Assigned: _______________________", rightX, y + 15);
  doc.text("Signature & Seal: __________________________", rightX, y + 22);

  // 9. Document Footer
  const footerY = pageHeight - 8;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "ArogyaSeva Digital Health Network • Official Confidential Clinical Record • Direct Transit Handover Document",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  // Clean filename for system storage
  const cleanName = (caseData.patientName || "Patient").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `ArogyaSeva_Referral_Report_${cleanName}_${caseData.id || "REC"}.pdf`;

  // Binary Blob & URLs
  const blob = doc.output("blob");
  const blobUrl = URL.createObjectURL(blob);
  const dataUri = doc.output("datauristring");

  const bytes = blob.size;
  const fileSizeFormatted =
    bytes < 1024
      ? `${bytes} B`
      : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return {
    doc,
    fileName,
    blob,
    blobUrl,
    fileSizeFormatted,
    dataUri,
  };
}

/**
 * Triggers a direct download of the provided Blob to device storage.
 * Uses a multi-tiered strategy (Blob URL anchor click, MouseEvent dispatch, DOM attachment).
 */
export function triggerBlobDownload(blob: Blob, fileName: string): boolean {
  try {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.setAttribute("download", fileName);
    link.rel = "noopener noreferrer";
    link.style.position = "fixed";
    link.style.left = "-9999px";
    link.style.top = "-9999px";
    link.style.opacity = "0";

    document.body.appendChild(link);

    // Primary: Synthetic mouse click
    const clickEvt = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window,
    });
    link.dispatchEvent(clickEvt);

    // Secondary assurance: direct method
    try {
      link.click();
    } catch {
      // Handled if already triggered
    }

    // Clean up
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
    }, 1500);

    return true;
  } catch (e) {
    console.error("triggerBlobDownload failed:", e);
    return false;
  }
}

/**
 * Modern File System Access API save picker for Chrome / Chromium / Android.
 * Allows user to choose destination folder directly.
 */
export async function savePdfWithPicker(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const picker = (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
      const handle = await picker({
        suggestedName: fileName,
        types: [
          {
            description: "PDF Document (*.pdf)",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name !== "AbortError") {
        console.warn("showSaveFilePicker failed or disallowed:", err);
      }
    }
  }
  return false;
}

/**
 * Mobile Web Share API file save sheet (iOS Files / Android device storage).
 */
export async function sharePdfToDevice(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "ArogyaSeva Clinical Referral Document",
          text: `Official Clinical Referral Document for ${fileName}`,
        });
        return true;
      }
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name !== "AbortError") {
        console.warn("Native share failed:", e);
      }
    }
  }
  return false;
}

/**
 * Opens the generated PDF in the browser's native viewer.
 */
export function openPdfInNewTab(blobUrl: string): void {
  try {
    const win = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      // In case popup blocker intercepted
      const link = document.createElement("a");
      link.href = blobUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
    }
  } catch (e) {
    console.error("Failed to open PDF in new tab:", e);
  }
}

/**
 * Generates and immediately triggers a direct download of a standardized
 * clinical referral PDF slip branded with ArogyaSeva.
 * Returns a detailed PdfDownloadResult with blob, URLs, and status.
 */
export async function downloadReferralSlipPDF(caseData: PatientCase): Promise<PdfDownloadResult> {
  try {
    const bundle = generateReferralPDF(caseData);

    // 1. Direct Anchor Download (universal & standard)
    const downloadStarted = triggerBlobDownload(bundle.blob, bundle.fileName);

    // 2. jsPDF native save as supplemental fallback
    try {
      bundle.doc.save(bundle.fileName);
    } catch {
      // Primary triggerBlobDownload already handled the trigger
    }

    return {
      success: downloadStarted,
      fileName: bundle.fileName,
      fileSizeFormatted: bundle.fileSizeFormatted,
      blob: bundle.blob,
      blobUrl: bundle.blobUrl,
      dataUri: bundle.dataUri,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("downloadReferralSlipPDF failed:", error);
    return {
      success: false,
      fileName: `ArogyaSeva_Referral_${caseData.id || "Report"}.pdf`,
      fileSizeFormatted: "0 KB",
      blob: new Blob(),
      blobUrl: "",
      dataUri: "",
      error: err?.message || "PDF generation and download failed",
    };
  }
}

