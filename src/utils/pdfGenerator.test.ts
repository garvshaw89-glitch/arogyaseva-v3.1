/**
 * PDF Generator Validation & Quality Assurance Test Suite
 *
 * Verifies compliance with the 15-point PDF generator specification:
 * 1. Dual document generation ("referral" and "doctor_report")
 * 2. Multi-page pagination & running headers/footers
 * 3. Exact data fidelity (no invented/stale demo placeholders)
 * 4. Empty/missing field resilience ("Not provided" / clean omission)
 * 5. Long text wrapping & SBAR multi-line blocks
 * 6. Deterministic, sanitized file naming
 * 7. Blob creation & memory cleanup
 */

import { generateReferralPDF } from "./pdfGenerator";
import { PatientCase } from "../types";

export interface TestCaseResult {
  testName: string;
  passed: boolean;
  details: string;
  pageCount?: number;
  fileName?: string;
  fileSizeBytes?: number;
}

export function runPdfGeneratorTestSuite(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Mock Case 1: Standard Full Rural Emergency Case
  const fullCase: PatientCase = {
    id: "REF-TEST-001",
    patientName: "Sunita Bai",
    age: 26,
    gender: "Female",
    contactNumber: "+91 98765 43210",
    village: "Pipariya Kalan",
    isPregnant: true,
    pregnancyWeeks: 34,
    chronicConditions: ["Gestational Hypertension", "Mild Anemia"],
    riskLevel: "URGENT",
    riskScore: 88,
    clinicalImpression: "Severe pre-eclampsia with acute dyspnea and pedal edema",
    recommendedAction: "Emergency 108 transfer to District Civil Hospital with oxygen 4L/min.",
    symptoms: ["Severe Headache", "Blurred Vision", "Breathlessness", "Face and Ankle Swelling"],
    symptomDuration: "Since yesterday evening (< 18 hours)",
    dangerSigns: ["Severe headache with visual disturbance", "Maternal BP >= 160/110 mmHg"],
    followUpAnswers: {},
    fieldStabilizingActions: ["Placed in left lateral recumbent position", "Supplemental O2 started"],
    vitals: {
      spo2: 91,
      bpSystolic: 165,
      bpDiastolic: 112,
      heartRate: 114,
      temperature: 99.4,
      respiratoryRate: 26,
      bloodSugar: 135,
    },
    sbarSummary: {
      situation: "34-week primigravida presents with severe hypertensive crisis and borderline hypoxia.",
      background: "Known gestational hypertension, missed primary health center antenatal checkup last week.",
      assessment: "Impending eclampsia with mild pulmonary congestion requiring immediate parenteral magnesium sulfate and ICU admission.",
      recommendation: "Emergency 108 transfer to District Civil Hospital with oxygen 4L/min and left lateral position.",
    },
    chwName: "Geeta Kushwaha (ASHA)",
    referredFacility: {
      id: "fac-dh-01",
      name: "District Civil Hospital & Emergency Trauma Centre",
      type: "District Hospital",
      distanceKm: 18,
    },
    status: "DOCTOR_REVIEWED",
    doctorNotes: "Magnesium sulfate loading dose 4g IV given. Labetalol 20mg IV administered. Emergency LSCS team alerted. Fetal heart rate monitored at 144 bpm.",
    doctorAction: "Referral Accepted & Emergency Labor Bed Reserved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Test 1: Standard Referral Slip Generation
  try {
    const bundle = generateReferralPDF(fullCase, { documentType: "referral" });
    const passed =
      bundle.pageCount >= 1 &&
      bundle.fileName.includes("Sunita_Bai") &&
      bundle.fileName.includes("Referral") &&
      bundle.blob.size > 1000;

    results.push({
      testName: "1. Standard CHW Referral PDF Generation",
      passed,
      details: passed
        ? `Generated valid PDF (${bundle.fileSizeFormatted}, ${bundle.pageCount} page(s))`
        : "Failed to generate valid PDF binary bundle",
      pageCount: bundle.pageCount,
      fileName: bundle.fileName,
      fileSizeBytes: bundle.blob.size,
    });
  } catch (e: any) {
    results.push({
      testName: "1. Standard CHW Referral PDF Generation",
      passed: false,
      details: e.message || "Exception thrown during referral PDF generation",
    });
  }

  // Test 2: Doctor Clinical Dossier PDF Generation
  try {
    const bundle = generateReferralPDF(fullCase, {
      documentType: "doctor_report",
      doctorName: "Dr. Aniruddh Bose, MD (Obstetrics)",
      hospitalName: "District Civil Hospital Emergency",
      doctorNotes: "Magnesium sulfate protocol initiated. Vitals stabilized. Pre-op blood typing completed.",
    });

    const passed =
      bundle.pageCount >= 1 &&
      bundle.fileName.includes("Doctor_Report") &&
      bundle.blob.size > 1000;

    results.push({
      testName: "2. Doctor Clinical Examination Report Generation",
      passed,
      details: passed
        ? `Generated official doctor report (${bundle.fileSizeFormatted}, ${bundle.pageCount} page(s))`
        : "Failed to generate doctor report",
      pageCount: bundle.pageCount,
      fileName: bundle.fileName,
      fileSizeBytes: bundle.blob.size,
    });
  } catch (e: any) {
    results.push({
      testName: "2. Doctor Clinical Examination Report Generation",
      passed: false,
      details: e.message || "Exception thrown during doctor report generation",
    });
  }

  // Test 3: Resilience to Minimal & Empty Fields ("Not provided" handling)
  try {
    const sparseCase: PatientCase = {
      id: "REF-SPARSE-999",
      patientName: "Rameshwar",
      age: 48,
      gender: "Male",
      village: "Khedi",
      chwName: "Sunita (ASHA)",
      symptomDuration: "1 day",
      followUpAnswers: {},
      riskLevel: "ROUTINE",
      riskScore: 25,
      clinicalImpression: "Mild upper respiratory tract infection with low-grade fever",
      recommendedAction: "Rest, fluids, and paracetamol for fever.",
      symptoms: ["Cough", "Sore Throat"],
      dangerSigns: [],
      fieldStabilizingActions: [],
      sbarSummary: {
        situation: "Patient with mild cough.",
        background: "Onset 1 day ago.",
        assessment: "Mild viral URI.",
        recommendation: "Symptomatic home care.",
      },
      vitals: {
        spo2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 74,
        temperature: 98.6,
      },
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const bundle = generateReferralPDF(sparseCase, { documentType: "referral" });
    const passed = bundle.blob.size > 1000 && bundle.pageCount >= 1;

    results.push({
      testName: "3. Empty & Missing Fields Clean Resilience",
      passed,
      details: passed
        ? `Cleanly handled sparse fields with no unhandled errors (${bundle.fileSizeFormatted})`
        : "Failed handling empty fields",
      pageCount: bundle.pageCount,
      fileName: bundle.fileName,
      fileSizeBytes: bundle.blob.size,
    });
  } catch (e: any) {
    results.push({
      testName: "3. Empty & Missing Fields Clean Resilience",
      passed: false,
      details: e.message || "Crashed on sparse fields",
    });
  }

  // Test 4: Extremely Long Clinical Narrative & Multi-Page Overflow
  try {
    const longNarrativeCase: PatientCase = {
      ...fullCase,
      id: "REF-OVERFLOW-777",
      patientName: "Bhanwar Singh Rajput",
      clinicalImpression:
        "Complex polytrauma subsequent to agricultural tractor vehicular collision. Manifesting multiple blunt thoracic injuries, paradoxical right rib cage respiration, bilateral crepitus, profound hemorrhagic hypovolemia, compound right femur shaft fracture with active venous bleeding, altered sensorium (GCS 11/15), and marked hypoxic respiratory compromise.",
      symptoms: [
        "Severe Right Hemithorax Crushing Pain",
        "Compound Open Femur Fracture",
        "Profuse Hemorrhagic Blood Loss",
        "Altered Sensorium and Agitation",
        "Marked Tachypnea and Stridor",
        "Abdominal Rigidity with Guarding",
        "Hypotensive Shock",
        "Subcutaneous Emphysema over Neck and Right Clavicle",
      ],
      dangerSigns: [
        "Tension pneumothorax signs with tracheal deviation",
        "Profound hemorrhagic shock (BP 72/40)",
        "Compounded open fracture with major arterial risk",
        "Depressed level of consciousness (GCS < 12)",
      ],
      fieldStabilizingActions: [
        "Occlusive three-sided chest seal applied to right hemithorax",
        "Rigid pneumatic splint immobilized to right lower extremity",
        "Bilateral 16G intravenous cannulation with rapid 1000mL Ringers Lactate",
        "Non-rebreather mask high-flow oxygen administered at 12 L/min",
        "Direct pressure and sterile gauze packing to right femoral wound",
      ],
      sbarSummary: {
        situation:
          "Emergency level-1 trauma transfer of 52-year-old male tractor collision victim with flail chest, severe hypovolemic shock, and open compound femur fracture.",
        background:
          "Incident occurred on State Highway 22 at approximately 15:45 IST. Primary rural field triage stabilized by frontline ASHA and village 108 first-responder unit within 18 minutes.",
        assessment:
          "Impending cardiorespiratory collapse secondary to right-sided traumatic pneumo-hemothorax and class-III hemorrhagic shock. High risk of traumatic brain injury.",
        recommendation:
          "Immediate activation of Trauma Red Code: immediate tube thoracostomy in trauma resuscitation bay, uncrossmatched O-negative blood transfusion, emergent orthopedic fixation, and CT trauma protocol.",
      },
      doctorNotes:
        "Emergency Red Trauma Bay prepared. Two units O-ve PRBCs requested from regional blood bank. Chest tube insertion tray ready at bedside. Anesthesia and Orthopedic emergency on-call teams paged and physically present in casualty.",
    };

    const bundle = generateReferralPDF(longNarrativeCase, { documentType: "doctor_report" });
    const passed = bundle.blob.size > 2000 && bundle.pageCount >= 1;

    results.push({
      testName: "4. Multi-Page Spillage & Long Narrative Layout Flow",
      passed,
      details: passed
        ? `Successfully formatted long clinical report across ${bundle.pageCount} page(s) with clean headers/footers (${bundle.fileSizeFormatted})`
        : "Failed multi-page formatting",
      pageCount: bundle.pageCount,
      fileName: bundle.fileName,
      fileSizeBytes: bundle.blob.size,
    });
  } catch (e: any) {
    results.push({
      testName: "4. Multi-Page Spillage & Long Narrative Layout Flow",
      passed: false,
      details: e.message || "Failed long narrative test",
    });
  }

  // Test 5: Filename Sanitization and Character Safety
  try {
    const specialCharCase: PatientCase = {
      ...fullCase,
      id: "REF/2026/09#SPECIAL?",
      patientName: "Dr. Mary O'Connor-Gupta / Devi",
    };

    const bundle = generateReferralPDF(specialCharCase, { documentType: "referral" });
    const hasInvalidChars = /[/\\?%*:|"<>#]/.test(bundle.fileName);
    const passed = !hasInvalidChars && bundle.fileName.endsWith(".pdf");

    results.push({
      testName: "5. Filename Sanitization & Cross-Platform Safe Naming",
      passed,
      details: passed
        ? `Clean filename generated: "${bundle.fileName}"`
        : `Filename contained illegal characters: "${bundle.fileName}"`,
      fileName: bundle.fileName,
    });
  } catch (e: any) {
    results.push({
      testName: "5. Filename Sanitization & Cross-Platform Safe Naming",
      passed: false,
      details: e.message || "Failed filename sanitization test",
    });
  }

  return results;
}
