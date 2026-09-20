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
 * Re-engineered with dynamic height budgeting, professional typography hierarchy,
 * and zero-overlap layout geometry.
 */
export function generateReferralPDF(caseData: PatientCase): GeneratedPdfBundle {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm

  const isUrgent = caseData.riskLevel === "URGENT";
  const isConsultation = caseData.riskLevel === "CONSULTATION";

  const formattedDate = new Date(caseData.createdAt).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = new Date(caseData.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // =========================================================================
  // 1. TOP HEADER BANNER (Official Medical Institution Style)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, "F");

  // Medical Cross Icon Emblem
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.roundedRect(margin, 4.5, 9, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("+", margin + 2.8, 11);

  // Institution Title & Subtitle
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ArogyaSeva Health Network", margin + 12, 10);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Standardized Clinical SBAR Handover & Inter-Facility Transfer Record", margin + 12, 15);

  // Top-Right Metadata
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`CASE REF: ${caseData.id}`, pageWidth - margin, 9, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`DATE: ${formattedDate} | ${formattedTime} IST`, pageWidth - margin, 14, { align: "right" });
  doc.text("CONFIDENTIAL MEDICAL DOCUMENT", pageWidth - margin, 19, { align: "right" });

  let y = 28;

  // =========================================================================
  // 2. TRIAGE PRIORITY BANNER
  // =========================================================================
  if (isUrgent) {
    doc.setFillColor(220, 38, 38); // red-600
  } else if (isConsultation) {
    doc.setFillColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(16, 185, 129); // emerald-600
  }

  const priorityH = 7.5;
  doc.roundedRect(margin, y, contentWidth, priorityH, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  const priorityLabel = isUrgent
    ? `[ URGENT / HIGH PRIORITY EMERGENCY ] — CRITICAL FIELD TRANSFER (IMMEDIATE ATTENTION)`
    : isConsultation
    ? `[ CONSULTATION REQUIRED ] — SPECIALIST REVIEW & CLINICAL EVALUATION`
    : `[ ROUTINE REFERRAL ] — COMMUNITY HEALTH CLINICAL FOLLOW-UP`;

  doc.text(priorityLabel, margin + 4, y + 5.2);
  y += priorityH + 3.5;

  // =========================================================================
  // 3. SECTION: PATIENT DEMOGRAPHIC & REFERRAL CONTEXT
  // =========================================================================
  const demoCardH = 26;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, demoCardH, 1.5, 1.5, "FD");

  // Section Header Band
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("PATIENT DEMOGRAPHIC & REFERRAL CONTEXT", margin + 3.5, y + 4.3);

  // Column Boundaries (3 Columns: 60mm, 60mm, 66mm)
  const col1X = margin + 3.5;
  const col2X = margin + 64;
  const col3X = margin + 126;

  // Row 1 (y + 10.5)
  const r1Y = y + 10.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("Full Name:", col1X, r1Y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const pName = (caseData.patientName || "Unknown Patient").substring(0, 24);
  doc.text(pName, col1X + 18, r1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Origin / Sector:", col2X, r1Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const villageStr = (caseData.village || "Local Field Sector").substring(0, 24);
  doc.text(villageStr, col2X + 22, r1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Target Hospital:", col3X, r1Y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199); // sky-600
  const facName = (caseData.referredFacility?.name || "District Hospital").substring(0, 24);
  doc.text(facName, col3X + 23, r1Y);

  // Row 2 (y + 16.5)
  const r2Y = y + 16.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Age / Sex:", col1X, r2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${caseData.age} Yrs / ${caseData.gender}`, col1X + 18, r2Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Maternal Status:", col2X, r2Y);
  if (caseData.isPregnant) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(`Pregnant (${caseData.pregnancyWeeks || 28} Wks)`, col2X + 22, r2Y);
  } else {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Not Pregnant", col2X + 22, r2Y);
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Referring CHW:", col3X, r2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const chwStr = (caseData.chwName || "Anjali Devi (ASHA)").substring(0, 24);
  doc.text(chwStr, col3X + 23, r2Y);

  // Row 3 (y + 22.5)
  const r3Y = y + 22.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Contact No:", col1X, r3Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.contactNumber || "Field Verified", col1X + 18, r3Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Chronic Illness:", col2X, r3Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const condStr = caseData.chronicConditions?.length
    ? caseData.chronicConditions.join(", ").substring(0, 24)
    : "None documented";
  doc.text(condStr, col2X + 22, r3Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Dispatch Unit:", col3X, r3Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.village ? `${caseData.village} Health Post` : "Sub-Center Post", col3X + 23, r3Y);

  y += demoCardH + 3.5;

  // =========================================================================
  // 4. SECTION: STANDARDIZED OBJECTIVE FIELD VITALS MATRIX
  // =========================================================================
  const vitalsCardH = 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, vitalsCardH, 1.5, 1.5, "FD");

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("OBJECTIVE FIELD TELEMETRY & VITALS MATRIX", margin + 3.5, y + 4.1);

  const vitalsList = [
    {
      label: "SpO2 OXYGEN",
      val: caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : "N/A",
      ref: "Norm: 95-100%",
      alert: caseData.vitals?.spo2 && caseData.vitals.spo2 < 92,
    },
    {
      label: "BLOOD PRESSURE",
      val: caseData.vitals?.bpSystolic
        ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic || 80}`
        : "N/A",
      ref: "mmHg (Norm: <120/80)",
      alert: caseData.vitals?.bpSystolic && (caseData.vitals.bpSystolic >= 140 || caseData.vitals.bpSystolic < 90),
    },
    {
      label: "PULSE / HR",
      val: caseData.vitals?.heartRate ? `${caseData.vitals.heartRate} bpm` : "N/A",
      ref: "Norm: 60-100 bpm",
      alert: caseData.vitals?.heartRate && (caseData.vitals.heartRate > 100 || caseData.vitals.heartRate < 50),
    },
    {
      label: "TEMPERATURE",
      val: caseData.vitals?.temperature ? `${caseData.vitals.temperature}°F` : "N/A",
      ref: "Norm: 97.8-99.1°F",
      alert: caseData.vitals?.temperature && caseData.vitals.temperature >= 101,
    },
    {
      label: "RESP. RATE",
      val: caseData.vitals?.respiratoryRate ? `${caseData.vitals.respiratoryRate}/min` : "Standard",
      ref: "Norm: 12-20/min",
      alert: caseData.vitals?.respiratoryRate && caseData.vitals.respiratoryRate > 24,
    },
    {
      label: "BLOOD GLUCOSE",
      val: caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar}` : "Not tested",
      ref: "mg/dL (Norm: 70-140)",
      alert: false,
    },
  ];

  const colW = contentWidth / 6;
  vitalsList.forEach((v, idx) => {
    const vx = margin + idx * colW;

    // Divider line between columns (except first)
    if (idx > 0) {
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(vx, y + 6, vx, y + vitalsCardH - 1);
    }

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(v.label, vx + 2.5, y + 10);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    if (v.alert) {
      doc.setTextColor(220, 38, 38); // Red
    } else {
      doc.setTextColor(15, 23, 42); // Navy
    }
    doc.text(v.val, vx + 2.5, y + 15);

    // Reference
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(v.ref, vx + 2.5, y + 19);
  });

  y += vitalsCardH + 3.5;

  // =========================================================================
  // 5. SECTION: CLINICAL EVALUATION & DANGER SIGNS (DYNAMIC HEIGHT)
  // =========================================================================
  // Calculate text wrapping dynamically so texts NEVER overlap
  const evalLabelWidth = 32;
  const evalTextWidth = contentWidth - evalLabelWidth - 6;

  const impText = caseData.clinicalImpression || "Acute clinical referral requiring evaluation.";
  const impLines: string[] = doc.splitTextToSize(impText, evalTextWidth);

  const sympStr = `${(caseData.symptoms || []).join(", ") || "None specified"} (Duration: ${
    caseData.symptomDuration || "Recent onset"
  })`;
  const sympLines: string[] = doc.splitTextToSize(sympStr, evalTextWidth);

  const dangerStr = caseData.dangerSigns?.length
    ? caseData.dangerSigns.join(" • ")
    : "No acute WHO IMCI danger flags recorded";
  const dangerLines: string[] = doc.splitTextToSize(dangerStr, evalTextWidth);

  const lineStep = 3.8;
  const impBlockH = Math.max(5, impLines.length * lineStep);
  const sympBlockH = Math.max(5, sympLines.length * lineStep);
  const dangerBlockH = Math.max(5, dangerLines.length * lineStep);

  const evalCardH = 7 + impBlockH + 2 + sympBlockH + 2 + dangerBlockH + 3;

  if (isUrgent) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(252, 165, 165); // red-300
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
  }
  doc.roundedRect(margin, y, contentWidth, evalCardH, 1.5, 1.5, "FD");

  // Header band
  if (isUrgent) {
    doc.setFillColor(254, 226, 226);
    doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27); // red-800
    doc.text("PRIMARY CLINICAL IMPRESSION & DANGER FLAGS (WHO / IMCI PROTOCOL)", margin + 3.5, y + 4.1);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 5.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("CLINICAL EVALUATION & REPORTED SYMPTOM PROFILE", margin + 3.5, y + 4.1);
  }

  let evalCurY = y + 9.5;

  // Item 1: Primary Assessment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("Primary Assessment:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", isUrgent ? "bold" : "normal");
  doc.setTextColor(isUrgent ? 185 : 15, isUrgent ? 28 : 23, isUrgent ? 28 : 42);
  doc.text(impLines, margin + evalLabelWidth + 2, evalCurY);
  evalCurY += impBlockH + 2;

  // Item 2: Reported Symptoms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Reported Symptoms:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(sympLines, margin + evalLabelWidth + 2, evalCurY);
  evalCurY += sympBlockH + 2;

  // Item 3: Danger Flags
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(isUrgent ? 220 : 71, isUrgent ? 38 : 85, isUrgent ? 38 : 105);
  doc.text("Danger Flags:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", caseData.dangerSigns?.length ? "bold" : "normal");
  doc.setTextColor(caseData.dangerSigns?.length ? 220 : 100, caseData.dangerSigns?.length ? 38 : 116, caseData.dangerSigns?.length ? 38 : 139);
  doc.text(dangerLines, margin + evalLabelWidth + 2, evalCurY);

  y += evalCardH + 3.5;

  // =========================================================================
  // 6. SECTION: STANDARDIZED SBAR HANDOVER (DYNAMIC HEIGHT)
  // =========================================================================
  const sbarRaw = [
    {
      code: "S",
      title: "Situation",
      text: caseData.sbarSummary?.situation || "Patient referred from community field assessment for acute clinical care.",
    },
    {
      code: "B",
      title: "Background",
      text:
        caseData.sbarSummary?.background ||
        `Screened by ${caseData.chwName || "frontline worker"}. Symptom duration: ${caseData.symptomDuration || "Recent"}.`,
    },
    {
      code: "A",
      title: "Assessment",
      text: caseData.sbarSummary?.assessment || caseData.clinicalImpression || "Clinical impression noted in intake record.",
    },
    {
      code: "R",
      title: "Recommendation",
      text:
        caseData.sbarSummary?.recommendation ||
        caseData.recommendedAction ||
        "Immediate triage, vitals verification, and medical officer evaluation upon arrival.",
    },
  ];

  const sbarContentWidth = contentWidth - 42;
  const sbarProcessed = sbarRaw.map((item) => {
    const lines: string[] = doc.splitTextToSize(item.text, sbarContentWidth);
    const rowH = Math.max(5.5, lines.length * 3.6 + 1.2);
    return { ...item, lines, rowH };
  });

  const sbarCardH = 7 + sbarProcessed.reduce((sum, item) => sum + item.rowH + 1.8, 0) + 2;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, sbarCardH, 1.5, 1.5, "FD");

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, y + 0.3, contentWidth - 0.6, 5.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text("STANDARDIZED SBAR CLINICAL HANDOVER NOTE", margin + 3.5, y + 4.1);

  let sbarCurY = y + 9.5;
  sbarProcessed.forEach((item) => {
    // SBAR Letter Badge
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(margin + 3.5, sbarCurY - 3.2, 4.5, 4.5, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(item.code, margin + 4.8, sbarCurY);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.title}:`, margin + 10, sbarCurY);

    // Text lines
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(item.lines, margin + 38, sbarCurY);

    sbarCurY += item.rowH + 1.8;
  });

  y += sbarCardH + 3.5;

  // =========================================================================
  // 7. SECTION: FIELD STABILIZING PROTOCOLS APPLIED (IF APPLICABLE)
  // =========================================================================
  if (caseData.fieldStabilizingActions && caseData.fieldStabilizingActions.length > 0) {
    const actionsStr = caseData.fieldStabilizingActions.map((a) => `• ${a}`).join("   ");
    const actLines: string[] = doc.splitTextToSize(actionsStr, contentWidth - 8);
    const actH = 7 + Math.max(5, actLines.length * 3.6) + 2.5;

    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(153, 246, 228); // teal-200
    doc.roundedRect(margin, y, contentWidth, actH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text("FIELD STABILIZING PROTOCOLS APPLIED PRIOR TO DISPATCH:", margin + 3.5, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(actLines, margin + 3.5, y + 9);

    y += actH + 3.5;
  }

  // =========================================================================
  // 8. SECTION: INSTITUTIONAL HANDOVER & SIGNATURES
  // =========================================================================
  // Ensure signatures never hit bottom footer
  const signCardH = 25;
  const halfW = (contentWidth - 6) / 2;

  // Container
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, signCardH, 1.5, 1.5, "D");

  // Left Column: Referring Worker
  const signLeftX = margin + 3.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Referring Frontline Worker (Dispatch)", signLeftX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${caseData.chwName || "Anjali Devi (ASHA)"}`, signLeftX, y + 9.5);
  doc.text(`Sub-Center: ${caseData.village || "Field Unit"} Health Post`, signLeftX, y + 14);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signLeftX, y + 21, signLeftX + halfW - 6, y + 21);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature of Referring Health Worker", signLeftX, y + 23.5);

  // Right Column: Receiving Medical Officer
  const signRightX = margin + halfW + 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + halfW + 1, y + 2, margin + halfW + 1, y + signCardH - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text("Receiving Medical Officer (Hospital Handover)", signRightX, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Hospital: ${(caseData.referredFacility?.name || "District Hospital").substring(0, 30)}`, signRightX, y + 9.5);
  doc.text("Doctor Reg. No / Stamp: _______________________", signRightX, y + 14);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signRightX, y + 21, signRightX + halfW - 6, y + 21);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature & Receiving Hospital Seal", signRightX, y + 23.5);

  // =========================================================================
  // 9. DOCUMENT FOOTER (Official Disclaimer)
  // =========================================================================
  const footerY = pageHeight - 7;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "ArogyaSeva Digital Health Network • Conforming to National Health Mission Clinical SBAR Protocols • Direct Handover Document",
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

