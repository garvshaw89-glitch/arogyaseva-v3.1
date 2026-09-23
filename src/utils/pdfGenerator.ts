import { jsPDF } from "jspdf";
import { PatientCase } from "../types";

export type PdfDocumentType = "referral" | "doctor_report";

export interface GeneratePdfOptions {
  documentType?: PdfDocumentType;
  doctorName?: string;
  hospitalName?: string;
  doctorNotes?: string;
  doctorAction?: string;
  followUpDate?: string;
}

export interface PdfDownloadResult {
  success: boolean;
  fileName: string;
  fileSizeFormatted: string;
  blob: Blob;
  blobUrl: string;
  dataUri: string;
  pageCount: number;
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
  pageCount: number;
  documentType: PdfDocumentType;
}

/**
 * Builds the official ArogyaSeva Clinical Document (Referral Slip or Doctor Report).
 * Re-engineered with dynamic multi-page budgeting, running headers/footers,
 * professional typography hierarchy, and zero-overlap layout geometry.
 */
export function generateReferralPDF(
  caseData: PatientCase,
  options?: GeneratePdfOptions
): GeneratedPdfBundle {
  const docType: PdfDocumentType = options?.documentType || "referral";
  const isDoctorReport = docType === "doctor_report";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186mm
  const bottomMarginLimit = 276; // mm - leave room for running footer

  const isUrgent = caseData.riskLevel === "URGENT";
  const isConsultation = caseData.riskLevel === "CONSULTATION";

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

  // ISO date formatted strictly as YYYY-MM-DD
  const dateIso = caseDateObj.toISOString().split("T")[0];
  const cleanId = (caseData.id || "RECORD").replace(/[^a-zA-Z0-9_-]/g, "_");
  const docUid = `AROGYA-${cleanId}-${dateIso}`;

  // Standardized filenames matching requirement #6
  const fileName = isDoctorReport
    ? `ArogyaSeva_Patient_Report_${cleanId}_${dateIso}.pdf`
    : `ArogyaSeva_Referral_${cleanId}_${dateIso}.pdf`;

  let currentY = 0;

  // Helper to draw continuation header when a new page is added
  const drawContinuationHeader = (pageNumber: number) => {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 12, "F");

    doc.setFillColor(6, 182, 212); // cyan-500
    doc.roundedRect(margin, 2.5, 7, 7, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("+", margin + 2.2, 7.5);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("ArogyaSeva Digital Health Network", margin + 9, 7.2);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${isDoctorReport ? "Doctor Clinical Dossier" : "Clinical Referral Slip"} • Case: ${caseData.id} • Patient: ${caseData.patientName}`,
      margin + 65,
      7.2
    );

    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.text(`Page ${pageNumber}`, pageWidth - margin, 7.2, { align: "right" });
  };

  // Helper to ensure vertical room or create a new page
  const ensureRoom = (neededHeight: number): void => {
    if (currentY + neededHeight > bottomMarginLimit) {
      doc.addPage();
      const newPageNum = doc.getNumberOfPages();
      drawContinuationHeader(newPageNum);
      currentY = 17;
    }
  };

  // =========================================================================
  // 1. TOP HEADER BANNER (Page 1 Official Medical Institution Header)
  // =========================================================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, "F");

  // Medical Emblem
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.roundedRect(margin, 4.5, 9, 9, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("+", margin + 2.8, 11);

  // Institution Title & Subtitle
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("ArogyaSeva Digital Health Network", margin + 12, 10);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  if (isDoctorReport) {
    doc.text("Medical Officer Clinical Examination, Diagnosis & Treatment Dossier", margin + 12, 15);
  } else {
    doc.text("Standardized Clinical SBAR Handover & Inter-Facility Transfer Record", margin + 12, 15);
  }

  // Top-Right Metadata
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`REF ID: ${cleanId}`, pageWidth - margin, 8.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`DATE: ${formattedDate} | ${formattedTime} IST`, pageWidth - margin, 13.5, { align: "right" });
  doc.text("CONFIDENTIAL CLINICAL RECORD", pageWidth - margin, 18.5, { align: "right" });

  currentY = 27;

  // =========================================================================
  // 2. TRIAGE PRIORITY & STATUS BANNER
  // =========================================================================
  ensureRoom(10);
  if (isUrgent) {
    doc.setFillColor(220, 38, 38); // red-600
  } else if (isConsultation) {
    doc.setFillColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(13, 148, 136); // teal-600
  }
  doc.roundedRect(margin, currentY, contentWidth, 8, 1.2, 1.2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  const priorityLabel = isUrgent
    ? "URGENT CLINICAL PRIORITY — IMMEDIATE MEDICAL EVALUATION REQUIRED"
    : isConsultation
    ? "CONSULTATION PRIORITY — SPECIALIST TELE-MEDICINE GUIDANCE REQUIRED"
    : "ROUTINE PRIORITY — PRIMARY CLINICAL SCREENING & COMMUNITY FOLLOW-UP";

  doc.text(priorityLabel, margin + 4, currentY + 5.2);

  const docStatusLabel = isDoctorReport
    ? `STATUS: ${caseData.status === "DOCTOR_REVIEWED" ? "DOCTOR REVIEWED" : "DOCTOR CONSULTATION"}`
    : `STATUS: ${caseData.status || "DISPATCHED"}`;

  doc.setFontSize(7.5);
  doc.text(docStatusLabel, pageWidth - margin - 4, currentY + 5.2, { align: "right" });

  currentY += 10.5;

  // =========================================================================
  // 3. PATIENT DEMOGRAPHICS & CARE-TEAM PROFILE (DUAL BOX)
  // =========================================================================
  ensureRoom(28);
  const colW = (contentWidth - 3) / 2;
  const colH = 26;

  // Left Box: Patient Details
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, colW, colH, 1.5, 1.5, "FD");

  // Subheader banner
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, currentY + 0.3, colW - 0.6, 5.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("PATIENT DEMOGRAPHIC PROFILE", margin + 3.5, currentY + 3.8);

  // Patient Info Lines
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  let pY = currentY + 9;

  doc.text("Full Name:", margin + 3.5, pY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.patientName || "Not provided", margin + 22, pY);

  pY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Age / Sex:", margin + 3.5, pY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const pregTag = caseData.isPregnant ? ` (Pregnant: ${caseData.pregnancyWeeks || "Yes"} wks)` : "";
  doc.text(`${caseData.age ?? "N/A"} Years • ${caseData.gender || "Not specified"}${pregTag}`, margin + 22, pY);

  pY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Village / Origin:", margin + 3.5, pY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.village || "Not provided", margin + 22, pY);

  pY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Comorbidities:", margin + 3.5, pY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const comorbText = caseData.chronicConditions?.length
    ? caseData.chronicConditions.join(", ")
    : "None reported";
  doc.text(comorbText.substring(0, 32), margin + 22, pY);

  // Right Box: Clinical Team & Referral Destination
  const rightX = margin + colW + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightX, currentY, colW, colH, 1.5, 1.5, "FD");

  doc.setFillColor(241, 245, 249);
  doc.rect(rightX + 0.3, currentY + 0.3, colW - 0.6, 5.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("CARE TEAM & CLINICAL FACILITY", rightX + 3.5, currentY + 3.8);

  let cY = currentY + 9;
  doc.setFontSize(7.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Referring CHW:", rightX + 3.5, cY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(caseData.chwName || "Anjali Devi (ASHA)", rightX + 26, cY);

  cY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Target Hospital:", rightX + 3.5, cY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const targetHospName =
    options?.hospitalName ||
    caseData.referredFacility?.name ||
    "District Civil Hospital & Emergency Trauma Centre";
  doc.text(targetHospName.substring(0, 30), rightX + 26, cY);

  cY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Attending Doctor:", rightX + 3.5, cY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const attendingDoc = options?.doctorName || "Dr. Rajesh Sharma, MD (Medical Officer)";
  doc.text(attendingDoc.substring(0, 30), rightX + 26, cY);

  cY += 4.2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Facility Distance:", rightX + 3.5, cY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${caseData.referredFacility?.distanceKm || 12} km (~${Math.round(
      ((caseData.referredFacility?.distanceKm || 12) / 40) * 60
    )} mins transit)`,
    rightX + 26,
    cY
  );

  currentY += colH + 3.5;

  // =========================================================================
  // 4. OBJECTIVE VITAL SIGNS MATRIX (6-COLUMN METRICS GRID)
  // =========================================================================
  ensureRoom(25);
  const vitalsCardH = 22;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, vitalsCardH, 1.5, 1.5, "FD");

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, currentY + 0.3, contentWidth - 0.6, 5.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("OBJECTIVE CLINICAL TELEMETRY & VITAL SIGNS MATRIX", margin + 3.5, currentY + 3.8);

  const vitals = [
    {
      label: "SpO₂ OXYGEN",
      val: caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : "Not provided",
      alert: (caseData.vitals?.spo2 || 100) < 92,
      ref: "Norm: 95-100%",
    },
    {
      label: "BLOOD PRESSURE",
      val:
        caseData.vitals?.bpSystolic && caseData.vitals?.bpDiastolic
          ? `${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic}`
          : "Not provided",
      alert: (caseData.vitals?.bpSystolic || 120) >= 140 || (caseData.vitals?.bpDiastolic || 80) >= 90,
      ref: "Norm: 120/80",
    },
    {
      label: "PULSE / HR",
      val: caseData.vitals?.heartRate ? `${caseData.vitals.heartRate} bpm` : "Not provided",
      alert: (caseData.vitals?.heartRate || 75) > 105 || (caseData.vitals?.heartRate || 75) < 55,
      ref: "Norm: 60-100",
    },
    {
      label: "CORE TEMP",
      val: caseData.vitals?.temperature ? `${caseData.vitals.temperature}°F` : "Not provided",
      alert: (caseData.vitals?.temperature || 98.6) >= 101,
      ref: "Norm: 98.6°F",
    },
    {
      label: "RESPIRATORY",
      val: caseData.vitals?.respiratoryRate ? `${caseData.vitals.respiratoryRate}/min` : "Not provided",
      alert: (caseData.vitals?.respiratoryRate || 18) > 24,
      ref: "Norm: 12-20",
    },
    {
      label: "BLOOD SUGAR",
      val: caseData.vitals?.bloodSugar ? `${caseData.vitals.bloodSugar} mg/dL` : "Not provided",
      alert: (caseData.vitals?.bloodSugar || 100) > 180 || (caseData.vitals?.bloodSugar || 100) < 70,
      ref: "Norm: 70-140",
    },
  ];

  const vColW = contentWidth / 6;
  vitals.forEach((v, idx) => {
    const vx = margin + idx * vColW;

    if (idx > 0) {
      doc.setDrawColor(226, 232, 240);
      doc.line(vx, currentY + 5.5, vx, currentY + vitalsCardH - 1);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(v.label, vx + 2.5, currentY + 9.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    if (v.alert) {
      doc.setTextColor(220, 38, 38);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(v.val, vx + 2.5, currentY + 14.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.8);
    doc.setTextColor(148, 163, 184);
    doc.text(v.ref, vx + 2.5, currentY + 18.5);
  });

  currentY += vitalsCardH + 3.5;

  // =========================================================================
  // 5. CLINICAL SYMPTOMS & WHO IMCI DANGER SIGNS (DYNAMIC HEIGHT)
  // =========================================================================
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

  const lineStep = 3.6;
  const impBlockH = Math.max(4.5, impLines.length * lineStep);
  const sympBlockH = Math.max(4.5, sympLines.length * lineStep);
  const dangerBlockH = Math.max(4.5, dangerLines.length * lineStep);

  const evalCardH = 7 + impBlockH + 2 + sympBlockH + 2 + dangerBlockH + 3;

  ensureRoom(evalCardH);

  if (isUrgent) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
  }
  doc.roundedRect(margin, currentY, contentWidth, evalCardH, 1.5, 1.5, "FD");

  // Header band
  if (isUrgent) {
    doc.setFillColor(254, 226, 226);
    doc.rect(margin + 0.3, currentY + 0.3, contentWidth - 0.6, 5.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(153, 27, 27);
    doc.text("PRIMARY CLINICAL IMPRESSION & DANGER FLAGS (WHO / IMCI PROTOCOL)", margin + 3.5, currentY + 3.8);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 0.3, currentY + 0.3, contentWidth - 0.6, 5.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("CLINICAL EVALUATION & REPORTED SYMPTOM PROFILE", margin + 3.5, currentY + 3.8);
  }

  let evalCurY = currentY + 9;

  // Item 1: Primary Assessment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text("Primary Assessment:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", isUrgent ? "bold" : "normal");
  doc.setTextColor(isUrgent ? 185 : 15, isUrgent ? 28 : 23, isUrgent ? 28 : 42);
  doc.text(impLines, margin + evalLabelWidth + 2, evalCurY);
  evalCurY += impBlockH + 2;

  // Item 2: Reported Symptoms
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text("Reported Symptoms:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(sympLines, margin + evalLabelWidth + 2, evalCurY);
  evalCurY += sympBlockH + 2;

  // Item 3: Danger Flags
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(isUrgent ? 220 : 71, isUrgent ? 38 : 85, isUrgent ? 38 : 105);
  doc.text("Danger Flags:", margin + 3.5, evalCurY);
  doc.setFont("helvetica", caseData.dangerSigns?.length ? "bold" : "normal");
  doc.setTextColor(
    caseData.dangerSigns?.length ? 220 : 100,
    caseData.dangerSigns?.length ? 38 : 116,
    caseData.dangerSigns?.length ? 38 : 139
  );
  doc.text(dangerLines, margin + evalLabelWidth + 2, evalCurY);

  currentY += evalCardH + 3.5;

  // =========================================================================
  // 6. STANDARDIZED SBAR CLINICAL HANDOVER (DYNAMIC HEIGHT)
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
    const rowH = Math.max(5, lines.length * 3.4 + 1.2);
    return { ...item, lines, rowH };
  });

  const sbarCardH = 7 + sbarProcessed.reduce((sum, item) => sum + item.rowH + 1.6, 0) + 2;

  ensureRoom(sbarCardH);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, sbarCardH, 1.5, 1.5, "FD");

  // Header band
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.3, currentY + 0.3, contentWidth - 0.6, 5.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("STANDARDIZED SBAR CLINICAL HANDOVER NOTE", margin + 3.5, currentY + 3.8);

  let sbarCurY = currentY + 9;
  sbarProcessed.forEach((item) => {
    // SBAR Letter Badge
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin + 3.5, sbarCurY - 3, 4.2, 4.2, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);
    doc.text(item.code, margin + 4.7, sbarCurY);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(30, 41, 59);
    doc.text(`${item.title}:`, margin + 9.5, sbarCurY);

    // Text lines
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(item.lines, margin + 36, sbarCurY);

    sbarCurY += item.rowH + 1.6;
  });

  currentY += sbarCardH + 3.5;

  // =========================================================================
  // 7. DOCTOR REPORT SPECIFIC SECTION: PHYSICIAN ORDERS & TREATMENT PLAN
  // =========================================================================
  if (isDoctorReport) {
    const docNotesText =
      options?.doctorNotes ||
      caseData.doctorNotes ||
      caseData.doctorAction ||
      "Emergency bed allocated. IV fluid resuscitation initiated. Supplemental oxygen administered at 4L/min. Diagnostic blood panel and bedside ultrasound scheduled.";

    const noteLines: string[] = doc.splitTextToSize(docNotesText, contentWidth - 8);
    const docSectionH = 7 + Math.max(5, noteLines.length * 3.6) + 7;

    ensureRoom(docSectionH);

    doc.setFillColor(240, 249, 255); // sky-50
    doc.setDrawColor(186, 230, 253); // sky-200
    doc.roundedRect(margin, currentY, contentWidth, docSectionH, 1.5, 1.5, "FD");

    doc.setFillColor(224, 242, 254);
    doc.rect(margin + 0.3, currentY + 0.3, contentWidth - 0.6, 5.2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(3, 105, 161);
    doc.text("DISTRICT MEDICAL OFFICER CLINICAL ORDERS & TREATMENT PLAN", margin + 3.5, currentY + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(noteLines, margin + 3.5, currentY + 9);

    const followUpStr = options?.followUpDate
      ? `Scheduled Follow-up: ${options.followUpDate}`
      : `Recommended Re-evaluation: 48-72 hours or upon immediate deterioration.`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(3, 105, 161);
    doc.text(followUpStr, margin + 3.5, currentY + docSectionH - 2);

    currentY += docSectionH + 3.5;
  }

  // =========================================================================
  // 8. FIELD STABILIZING PROTOCOLS (IF RECORDED)
  // =========================================================================
  if (caseData.fieldStabilizingActions && caseData.fieldStabilizingActions.length > 0) {
    const actionsStr = caseData.fieldStabilizingActions.map((a) => `• ${a}`).join("   ");
    const actLines: string[] = doc.splitTextToSize(actionsStr, contentWidth - 8);
    const actH = 7 + Math.max(5, actLines.length * 3.5) + 2.5;

    ensureRoom(actH);

    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(margin, currentY, contentWidth, actH, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(13, 148, 136);
    doc.text("FIELD STABILIZING PROTOCOLS APPLIED PRIOR TO DISPATCH:", margin + 3.5, currentY + 4.2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(actLines, margin + 3.5, currentY + 8.5);

    currentY += actH + 3.5;
  }

  // =========================================================================
  // 9. INSTITUTIONAL HANDOVER & DIGITAL SIGNATURE VERIFICATION
  // =========================================================================
  const signCardH = 24;
  const halfW = (contentWidth - 6) / 2;

  ensureRoom(signCardH);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, signCardH, 1.5, 1.5, "D");

  // Left Signature: Referring CHW
  const signLeftX = margin + 3.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Referring Frontline Health Worker", signLeftX, currentY + 4.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${caseData.chwName || "Anjali Devi (ASHA)"}`, signLeftX, currentY + 9);
  doc.text(`Sub-Center: ${caseData.village || "Field Unit"} Health Post`, signLeftX, currentY + 13);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signLeftX, currentY + 19.5, signLeftX + halfW - 6, currentY + 19.5);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text("Signature of Referring Health Worker", signLeftX, currentY + 22.5);

  // Right Signature: Receiving Medical Officer
  const signRightX = margin + halfW + 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + halfW + 1, currentY + 2, margin + halfW + 1, currentY + signCardH - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    isDoctorReport ? "Attending Medical Officer Certification" : "Receiving Medical Officer (Hospital Handover)",
    signRightX,
    currentY + 4.8
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const hospNameDisplay =
    options?.hospitalName || caseData.referredFacility?.name || "District Hospital Emergency";
  doc.text(`Facility: ${hospNameDisplay.substring(0, 32)}`, signRightX, currentY + 9);
  doc.text(`Reg. No: DMO-MH-${cleanId.slice(-4) || "8821"} • Date: ${formattedDate}`, signRightX, currentY + 13);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signRightX, currentY + 19.5, signRightX + halfW - 6, currentY + 19.5);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text("Physician Signature & Official Hospital Seal", signRightX, currentY + 22.5);

  // =========================================================================
  // 10. RUNNING FOOTERS ON EVERY PAGE (Page X of Y & Electronic Disclaimer)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  const footerY = pageHeight - 6.5;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Subtle divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 2.5, pageWidth - margin, footerY - 2.5);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    const electronicStatement =
      "This document was generated electronically by the ArogyaSeva Digital Health Platform • Conforms to National Health Mission SBAR Protocols";
    doc.text(electronicStatement, margin, footerY);

    const pageCountText = `Page ${i} of ${totalPages} • UID: ${docUid}`;
    doc.text(pageCountText, pageWidth - margin, footerY, { align: "right" });
  }

  // Generate binary output
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
    pageCount: totalPages,
    documentType: docType,
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
 * Native file system save with showSaveFilePicker fallback.
 */
export async function savePdfWithPicker(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const picker = (
        window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }
      ).showSaveFilePicker;
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
          title: "ArogyaSeva Clinical Document",
          text: `Official Clinical Record for ${fileName}`,
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
 * Generates and triggers a direct download of a standardized PDF
 * (Referral Slip or Doctor Report) branded with ArogyaSeva.
 */
export async function downloadReferralSlipPDF(
  caseData: PatientCase,
  options?: GeneratePdfOptions
): Promise<PdfDownloadResult> {
  try {
    const bundle = generateReferralPDF(caseData, options);

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
      pageCount: bundle.pageCount,
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("downloadReferralSlipPDF failed:", error);
    const cleanId = (caseData.id || "Report").replace(/[^a-zA-Z0-9_-]/g, "_");
    const dateIso = new Date().toISOString().split("T")[0];
    return {
      success: false,
      fileName: `ArogyaSeva_Referral_${cleanId}_${dateIso}.pdf`,
      fileSizeFormatted: "0 KB",
      blob: new Blob(),
      blobUrl: "",
      dataUri: "",
      pageCount: 1,
      error: err?.message || "PDF generation and download failed",
    };
  }
}
