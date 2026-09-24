import { PatientCase, RiskLevel, VitalsData } from "../types";
import { loadLocalCases, saveLocalCases } from "./offlineStorage";

export const PATIENT_HISTORY_INDEX_KEY = "arogyaseva_patient_history_index_v1";

export interface PatientHistoryIndexEntry {
  patientKey: string;
  canonicalName: string;
  abhaId?: string;
  contactNumber?: string;
  age: number;
  gender: string;
  village: string;
  caseIds: string[];
  latestEncounterDate: string;
  firstEncounterDate: string;
  encountersCount: number;
  chronicConditions: string[];
  allergies: string[];
  lastVitals?: VitalsData;
  lastRiskLevel?: RiskLevel;
}

export interface PatientHistoryIndex {
  version: number;
  lastUpdated: string;
  byAbhaId: Record<string, string>; // normalized abhaId -> patientKey
  byPhone: Record<string, string>; // digits only -> patientKey
  byName: Record<string, string[]>; // lowercase normalized name -> patientKey[]
  byCaseId: Record<string, string>; // caseId -> patientKey
  entries: Record<string, PatientHistoryIndexEntry>; // patientKey -> entry
}

export interface VitalsTrendPoint {
  date: string;
  displayDate: string;
  caseId: string;
  temperature: number;
  heartRate: number;
  spo2: number;
  bpSystolic: number;
  bpDiastolic: number;
  respiratoryRate?: number;
  bloodSugar?: number;
  riskLevel: RiskLevel;
}

export interface PatientHistoryLookupResult {
  entry: PatientHistoryIndexEntry | null;
  patientKey: string;
  patientName: string;
  cases: PatientCase[];
  vitalsTrend: VitalsTrendPoint[];
  allKnownAllergies: string[];
  allChronicConditions: string[];
  totalVisits: number;
  primaryRiskLevel: RiskLevel;
  latestEncounterDate?: string;
}

// Normalization utilities
export function normalizeAbhaId(id?: string): string {
  if (!id) return "";
  return id.trim().replace(/[-\s]/g, "").toUpperCase();
}

export function normalizePhone(phone?: string): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10); // last 10 digits
}

export function normalizePatientName(name?: string): string {
  if (!name) return "";
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Generate a consistent patient key from identifiers
 */
export function generatePatientKey(patient: {
  abhaId?: string;
  nationalHealthId?: string;
  contactNumber?: string;
  patientName?: string;
  id?: string;
}): string {
  const normAbha = normalizeAbhaId(patient.abhaId || patient.nationalHealthId);
  if (normAbha) return `abha:${normAbha}`;

  const normPhone = normalizePhone(patient.contactNumber);
  const normName = normalizePatientName(patient.patientName);

  if (normPhone && normName) return `p:${normName}:${normPhone}`;
  if (normPhone) return `phone:${normPhone}`;
  if (normName) return `name:${normName}`;

  return `id:${patient.id || Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Default empty index structure
 */
function createEmptyIndex(): PatientHistoryIndex {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    byAbhaId: {},
    byPhone: {},
    byName: {},
    byCaseId: {},
    entries: {},
  };
}

/**
 * Load the current index from localStorage
 */
export function loadHistoryIndex(): PatientHistoryIndex | null {
  try {
    const raw = localStorage.getItem(PATIENT_HISTORY_INDEX_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse patient history index:", err);
    return null;
  }
}

/**
 * Save index to localStorage
 */
export function saveHistoryIndex(index: PatientHistoryIndex): void {
  try {
    index.lastUpdated = new Date().toISOString();
    localStorage.setItem(PATIENT_HISTORY_INDEX_KEY, JSON.stringify(index));
  } catch (err) {
    console.error("Failed to save patient history index:", err);
  }
}

/**
 * Seed sample historical multi-encounter cases for realistic demonstration
 * so that key frontline patients have authentic longitudinal history.
 */
export function seedHistoricalCasesIfRequired(): PatientCase[] {
  const currentCases = loadLocalCases();

  // If we already have more than 5 cases, check if historical cases are present
  const hasHistory = currentCases.some((c) => c.id.startsWith("HIST-"));
  if (hasHistory) {
    return currentCases;
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Rich multi-visit longitudinal records
  const historicalSeedCases: PatientCase[] = [
    // --- RAMESHWAR PATEL HISTORICAL VISITS ---
    {
      id: "HIST-RP-01",
      patientName: "Rameshwar Patel",
      age: 54,
      gender: "Male",
      village: "Pipariya Kalan (Block 2)",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 98261 44521",
      abhaId: "ABHA-9826-1445-2101",
      bloodGroup: "B+",
      symptoms: ["Mild Dry Cough", "Morning Wheezing", "Fatigue"],
      symptomDuration: "1-2 weeks",
      vitals: {
        temperature: 98.6,
        heartRate: 78,
        spo2: 96,
        bpSystolic: 142,
        bpDiastolic: 90,
        respiratoryRate: 18,
        bloodSugar: 110,
      },
      chronicConditions: ["Hypertension", "Tobacco User"],
      currentMedications: ["Amlodipine 5mg OD"],
      followUpAnswers: {
        "History of smoking": "30 pack-years, bidi smoker",
        "Previous hospitalizations": "None in last 12 months",
      },
      riskLevel: "ROUTINE",
      riskScore: 35,
      dangerSigns: [],
      clinicalImpression: "Chronic Bronchitis / Stage 1 Essential Hypertension under routine monitoring",
      recommendedAction: "Counseling on tobacco cessation. Adherence to Amlodipine. Routine 1-month BP follow-up.",
      sbarSummary: {
        situation: "54M presented for monthly NCD hypertension screening at Sub-Centre.",
        background: "Known hypertensive since 3 years, chronic smoker.",
        assessment: "BP mildly elevated (142/90), SpO2 normal at 96%, clear chest.",
        recommendation: "Continue lifestyle counseling and Amlodipine 5mg. Schedule next follow-up.",
      },
      fieldStabilizingActions: ["Deep breathing exercises", "Advised reduction in dietary salt intake"],
      status: "RESOLVED",
      doctorNotes: "Dr. Arvind (MO PHC): BP controlled. Encouraged smoking cessation patch or behavioral therapy. Refill Amlodipine 30 days.",
      doctorAction: "Medication Refill & NCD Counseling",
      createdAt: new Date(now - 75 * DAY_MS).toISOString(),
    },
    {
      id: "HIST-RP-02",
      patientName: "Rameshwar Patel",
      age: 54,
      gender: "Male",
      village: "Pipariya Kalan (Block 2)",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 98261 44521",
      abhaId: "ABHA-9826-1445-2101",
      bloodGroup: "B+",
      symptoms: ["Moderate Productive Cough", "Low Grade Fever", "Exertional Breathlessness"],
      symptomDuration: "4-5 days",
      vitals: {
        temperature: 100.2,
        heartRate: 92,
        spo2: 93,
        bpSystolic: 148,
        bpDiastolic: 94,
        respiratoryRate: 22,
        bloodSugar: 118,
      },
      chronicConditions: ["Hypertension", "COPD / Chronic Bronchitis"],
      currentMedications: ["Amlodipine 5mg OD", "Salbutamol Inhaler PRN"],
      followUpAnswers: {
        "Sputum color": "Yellow-greenish",
        "Night sweats": "None",
      },
      riskLevel: "CONSULTATION",
      riskScore: 68,
      dangerSigns: ["SpO2 dropped to 93%", "Mild tachypnea (RR 22)"],
      clinicalImpression: "Acute Exacerbation of Chronic Bronchitis with secondary bacterial superinfection",
      recommendedAction: "Medical Officer tele-consultation. Prescribed oral Amoxicillin-Clavulanate and Steam Inhalation.",
      sbarSummary: {
        situation: "54M with sudden flare-up of cough with purulent sputum and SpO2 93%.",
        background: "Known hypertensive and smoker with recurrent winter cough.",
        assessment: "Infective bronchitis exacerbation.",
        recommendation: "5-day course of antibiotics, bronchodilator, repeat SpO2 in 48 hours.",
      },
      fieldStabilizingActions: ["Administered steam inhalation with menthol", "Measured peak flow and SpO2"],
      status: "DOCTOR_REVIEWED",
      doctorNotes: "Dr. Arvind (MO PHC): Prescribed Tab Augmentin 625mg BD x 5 days, Levosalbutamol inhaler. Advised immediate return if breathlessness increases.",
      doctorAction: "Oral Antibiotic & Bronchodilator Prescribed",
      createdAt: new Date(now - 28 * DAY_MS).toISOString(),
    },

    // --- POOJA MEENA HISTORICAL VISITS (ANC HISTORY) ---
    {
      id: "HIST-PM-01",
      patientName: "Pooja Meena",
      age: 23,
      gender: "Female",
      village: "Ghatola Village",
      chwName: "Anita ANM",
      contactNumber: "+91 94142 88102",
      abhaId: "ABHA-9414-2881-0201",
      bloodGroup: "O+",
      symptoms: ["Nausea", "Mild Morning Sickness"],
      symptomDuration: "3-4 days",
      vitals: {
        temperature: 98.4,
        heartRate: 74,
        spo2: 99,
        bpSystolic: 118,
        bpDiastolic: 76,
        respiratoryRate: 16,
        bloodSugar: 92,
      },
      chronicConditions: ["Primigravida (12 Weeks)"],
      currentMedications: ["Folic Acid 5mg OD"],
      isPregnant: true,
      pregnancyWeeks: 12,
      followUpAnswers: {
        "ANC Registration": "MCP Card issued, TT/Td first dose given",
        "Ultrasonography done?": "Scheduled for dating scan at CHC next week",
      },
      riskLevel: "ROUTINE",
      riskScore: 10,
      dangerSigns: [],
      clinicalImpression: "First Trimester Antenatal Care (ANC 1) - Healthy baseline",
      recommendedAction: "Initiate daily IFA and Calcium. Dietary nutrition counseling for pregnant mother.",
      sbarSummary: {
        situation: "23F Primigravida attending first trimester ANC checkup at Village Health Nutrition Day (VHND).",
        background: "First pregnancy, married 1 year. MCP card created.",
        assessment: "Normal vitals, BP 118/76, no danger signs.",
        recommendation: "Provide 180 IFA tablets, schedule ANC 2 at 20 weeks.",
      },
      fieldStabilizingActions: ["MCP Card Registered", "Nutritional Counseling on Green Leafy Vegetables"],
      status: "COMPLETED",
      doctorNotes: "ANM Anita: Routine registration completed. Urine protein nil. Hemoglobin 11.2 g/dL.",
      doctorAction: "ANC-1 MCP Card Registered",
      createdAt: new Date(now - 110 * DAY_MS).toISOString(),
    },
    {
      id: "HIST-PM-02",
      patientName: "Pooja Meena",
      age: 23,
      gender: "Female",
      village: "Ghatola Village",
      chwName: "Anita ANM",
      contactNumber: "+91 94142 88102",
      abhaId: "ABHA-9414-2881-0201",
      bloodGroup: "O+",
      symptoms: ["Mild Pedal Swelling", "Occasional Lightheadedness"],
      symptomDuration: "1 week",
      vitals: {
        temperature: 98.6,
        heartRate: 84,
        spo2: 98,
        bpSystolic: 136,
        bpDiastolic: 88,
        respiratoryRate: 18,
        bloodSugar: 98,
      },
      chronicConditions: ["Primigravida (22 Weeks)"],
      currentMedications: ["IFA Tablets", "Calcium 500mg BD"],
      isPregnant: true,
      pregnancyWeeks: 22,
      followUpAnswers: {
        "Fetal movement active?": "Yes, kick count positive",
        "Visual disturbances?": "None reported",
      },
      riskLevel: "CONSULTATION",
      riskScore: 48,
      dangerSigns: ["Borderline Gestational BP (136/88)", "Mild bilateral pedal edema"],
      clinicalImpression: "Second Trimester ANC (ANC 2) - Borderline Pregnancy-Induced Hypertension (PIH) surveillance",
      recommendedAction: "Close weekly BP monitoring. Advised resting in left lateral position. Urine dipstick for albumin.",
      sbarSummary: {
        situation: "23F at 22 weeks presenting with borderline BP elevation (136/88) and mild ankle edema.",
        background: "Prior BP was 118/76. Anomaly scan was normal.",
        assessment: "Developing gestational hypertension risk.",
        recommendation: "Repeat BP in 7 days. Urine albumin dipstick test.",
      },
      fieldStabilizingActions: ["Demonstrated left lateral resting position", "Advised high protein diet and low salt"],
      status: "DOCTOR_REVIEWED",
      doctorNotes: "Dr. Sharma (OBGYN MO): Urine protein negative (trace). Advised strict bi-weekly BP checks and immediate SOS if headache develops.",
      doctorAction: "Surveillance Alert Flagged for ASHA",
      createdAt: new Date(now - 42 * DAY_MS).toISOString(),
    },

    // --- AARAV KUMAR HISTORICAL VISITS (PEDIATRIC) ---
    {
      id: "HIST-AK-01",
      patientName: "Aarav Kumar (Pediatric)",
      age: 4,
      gender: "Male",
      village: "Bhimnagar Sub-centre",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 91114 55320",
      abhaId: "ABHA-9111-4553-2001",
      bloodGroup: "A+",
      symptoms: ["Mild Runny Nose", "Low Grade Fever", "Decreased Appetite"],
      symptomDuration: "2 days",
      vitals: {
        temperature: 99.8,
        heartRate: 104,
        spo2: 98,
        bpSystolic: 94,
        bpDiastolic: 62,
        respiratoryRate: 24,
      },
      chronicConditions: ["None"],
      currentMedications: ["Paracetamol syrup SOS"],
      followUpAnswers: {
        "Immunization status": "Fully immunized up to 2 years, booster pending",
        "Able to drink fluids": "Yes, drinking coconut water and milk",
      },
      riskLevel: "ROUTINE",
      riskScore: 22,
      dangerSigns: [],
      clinicalImpression: "Viral Upper Respiratory Tract Infection (Pediatric IMCI Green Tier)",
      recommendedAction: "Supportive home care. Paracetamol syrup 5ml for fever. Warm fluids. Red flag counseling for mother.",
      sbarSummary: {
        situation: "4yo child brought by mother with mild cold and fever for 2 days.",
        background: "Normal birth weight, milestone milestones intact.",
        assessment: "Active child, moist mucous membranes, clear chest.",
        recommendation: "Home management with oral fluids and fever control. Follow up if persistent after 3 days.",
      },
      fieldStabilizingActions: ["Demonstrated sponge bath technique to mother", "Provided ORS sachet as precaution"],
      status: "RESOLVED",
      doctorNotes: "Dr. Arvind: Common viral rhinitis. No antibiotic required. Educated mother on danger signs (fast breathing, chest indrawing).",
      doctorAction: "Home Supportive Care Cleared",
      createdAt: new Date(now - 60 * DAY_MS).toISOString(),
    },
  ];

  // Merge seed cases into local cases if not already present
  const mergedCases = [...historicalSeedCases, ...currentCases];
  saveLocalCases(mergedCases);
  return mergedCases;
}

/**
 * Build or refresh the entire local storage patient history index
 * from the complete list of cases.
 */
export function buildOrUpdateIndex(cases: PatientCase[]): PatientHistoryIndex {
  const index = createEmptyIndex();

  for (const c of cases) {
    if (!c.id || !c.patientName) continue;

    const patientKey = generatePatientKey(c);
    const normAbha = normalizeAbhaId(c.abhaId || c.nationalHealthId);
    const normPhone = normalizePhone(c.contactNumber);
    const normName = normalizePatientName(c.patientName);

    // Map secondary indices
    if (normAbha) {
      index.byAbhaId[normAbha] = patientKey;
    }
    if (normPhone) {
      index.byPhone[normPhone] = patientKey;
    }
    if (normName) {
      if (!index.byName[normName]) index.byName[normName] = [];
      if (!index.byName[normName].includes(patientKey)) {
        index.byName[normName].push(patientKey);
      }
    }
    index.byCaseId[c.id] = patientKey;

    // Build or update entry
    let entry = index.entries[patientKey];
    if (!entry) {
      entry = {
        patientKey,
        canonicalName: c.patientName,
        abhaId: c.abhaId || c.nationalHealthId,
        contactNumber: c.contactNumber,
        age: c.age,
        gender: c.gender,
        village: c.village,
        caseIds: [c.id],
        latestEncounterDate: c.createdAt,
        firstEncounterDate: c.createdAt,
        encountersCount: 1,
        chronicConditions: c.chronicConditions ? [...c.chronicConditions] : [],
        allergies: c.allergies ? [...c.allergies] : [],
        lastVitals: c.vitals,
        lastRiskLevel: c.riskLevel,
      };
      index.entries[patientKey] = entry;
    } else {
      if (!entry.caseIds.includes(c.id)) {
        entry.caseIds.push(c.id);
      }
      entry.encountersCount = entry.caseIds.length;

      // Update dates
      if (new Date(c.createdAt) > new Date(entry.latestEncounterDate)) {
        entry.latestEncounterDate = c.createdAt;
        entry.canonicalName = c.patientName;
        entry.lastVitals = c.vitals;
        entry.lastRiskLevel = c.riskLevel;
        if (c.village) entry.village = c.village;
      }
      if (new Date(c.createdAt) < new Date(entry.firstEncounterDate)) {
        entry.firstEncounterDate = c.createdAt;
      }

      // Merge chronic conditions & allergies
      if (c.chronicConditions) {
        c.chronicConditions.forEach((cond) => {
          if (cond && !entry.chronicConditions.includes(cond)) {
            entry.chronicConditions.push(cond);
          }
        });
      }
      if (c.allergies) {
        c.allergies.forEach((allergy) => {
          if (allergy && !entry.allergies.includes(allergy)) {
            entry.allergies.push(allergy);
          }
        });
      }
      if (c.abhaId && !entry.abhaId) entry.abhaId = c.abhaId;
      if (c.contactNumber && !entry.contactNumber) entry.contactNumber = c.contactNumber;
    }
  }

  saveHistoryIndex(index);
  return index;
}

/**
 * Index a single newly created or updated case into the index
 */
export function indexSingleCase(newCase: PatientCase): void {
  let index = loadHistoryIndex();
  if (!index) {
    const allCases = loadLocalCases();
    index = buildOrUpdateIndex(allCases);
    return;
  }

  const patientKey = generatePatientKey(newCase);
  const normAbha = normalizeAbhaId(newCase.abhaId || newCase.nationalHealthId);
  const normPhone = normalizePhone(newCase.contactNumber);
  const normName = normalizePatientName(newCase.patientName);

  if (normAbha) index.byAbhaId[normAbha] = patientKey;
  if (normPhone) index.byPhone[normPhone] = patientKey;
  if (normName) {
    if (!index.byName[normName]) index.byName[normName] = [];
    if (!index.byName[normName].includes(patientKey)) {
      index.byName[normName].push(patientKey);
    }
  }
  index.byCaseId[newCase.id] = patientKey;

  let entry = index.entries[patientKey];
  if (!entry) {
    entry = {
      patientKey,
      canonicalName: newCase.patientName,
      abhaId: newCase.abhaId || newCase.nationalHealthId,
      contactNumber: newCase.contactNumber,
      age: newCase.age,
      gender: newCase.gender,
      village: newCase.village,
      caseIds: [newCase.id],
      latestEncounterDate: newCase.createdAt,
      firstEncounterDate: newCase.createdAt,
      encountersCount: 1,
      chronicConditions: newCase.chronicConditions ? [...newCase.chronicConditions] : [],
      allergies: newCase.allergies ? [...newCase.allergies] : [],
      lastVitals: newCase.vitals,
      lastRiskLevel: newCase.riskLevel,
    };
    index.entries[patientKey] = entry;
  } else {
    if (!entry.caseIds.includes(newCase.id)) {
      entry.caseIds.push(newCase.id);
    }
    entry.encountersCount = entry.caseIds.length;
    entry.latestEncounterDate = newCase.createdAt;
    entry.canonicalName = newCase.patientName;
    entry.lastVitals = newCase.vitals;
    entry.lastRiskLevel = newCase.riskLevel;

    if (newCase.chronicConditions) {
      newCase.chronicConditions.forEach((cond) => {
        if (cond && !entry.chronicConditions.includes(cond)) entry.chronicConditions.push(cond);
      });
    }
    if (newCase.allergies) {
      newCase.allergies.forEach((allergy) => {
        if (allergy && !entry.allergies.includes(allergy)) entry.allergies.push(allergy);
      });
    }
  }

  saveHistoryIndex(index);
}

/**
 * Retrieve patient clinical history by identifier or partial patient object
 * using the local storage index for sub-millisecond lookup.
 */
export function lookupPatientHistory(
  patientQuery: Partial<PatientCase> | string,
  allCasesInput?: PatientCase[]
): PatientHistoryLookupResult {
  // Ensure we have active cases and an index
  let allCases = allCasesInput && allCasesInput.length > 0 ? allCasesInput : loadLocalCases();
  if (allCases.length === 0) {
    allCases = seedHistoricalCasesIfRequired();
  }

  let index = loadHistoryIndex();
  if (!index || Object.keys(index.entries).length === 0) {
    index = buildOrUpdateIndex(allCases);
  }

  let patientKey: string | null = null;
  let queryName = "";
  let queryAbha = "";
  let queryPhone = "";
  let queryCaseId = "";

  if (typeof patientQuery === "string") {
    const trimmed = patientQuery.trim();
    const normAbha = normalizeAbhaId(trimmed);
    const normPhone = normalizePhone(trimmed);
    const normName = normalizePatientName(trimmed);

    if (normAbha && index.byAbhaId[normAbha]) {
      patientKey = index.byAbhaId[normAbha];
    } else if (normPhone && index.byPhone[normPhone]) {
      patientKey = index.byPhone[normPhone];
    } else if (index.byCaseId[trimmed]) {
      patientKey = index.byCaseId[trimmed];
    } else if (normName && index.byName[normName]?.length > 0) {
      patientKey = index.byName[normName][0];
    } else {
      // Direct patientKey match or search in canonical names
      if (index.entries[trimmed]) {
        patientKey = trimmed;
      } else {
        const found = Object.values(index.entries).find(
          (e) =>
            e.canonicalName.toLowerCase().includes(normName) ||
            e.patientKey.toLowerCase().includes(normName)
        );
        if (found) patientKey = found.patientKey;
      }
    }
    queryName = trimmed;
  } else if (patientQuery) {
    queryAbha = normalizeAbhaId(patientQuery.abhaId || patientQuery.nationalHealthId);
    queryPhone = normalizePhone(patientQuery.contactNumber);
    queryName = normalizePatientName(patientQuery.patientName);
    queryCaseId = patientQuery.id || "";

    if (queryAbha && index.byAbhaId[queryAbha]) {
      patientKey = index.byAbhaId[queryAbha];
    } else if (queryPhone && index.byPhone[queryPhone]) {
      patientKey = index.byPhone[queryPhone];
    } else if (queryCaseId && index.byCaseId[queryCaseId]) {
      patientKey = index.byCaseId[queryCaseId];
    } else if (queryName && index.byName[queryName]?.length > 0) {
      patientKey = index.byName[queryName][0];
    } else {
      // Fallback: search across entries
      const found = Object.values(index.entries).find((e) => {
        if (queryName && e.canonicalName.toLowerCase() === queryName) return true;
        if (queryName && e.canonicalName.toLowerCase().includes(queryName)) return true;
        if (queryPhone && e.contactNumber && normalizePhone(e.contactNumber) === queryPhone) return true;
        return false;
      });
      if (found) {
        patientKey = found.patientKey;
      } else {
        // Fallback: search directly in allCases array
        const matchInCases = allCases.find((c) => {
          if (queryAbha && (normalizeAbhaId(c.abhaId) === queryAbha || normalizeAbhaId(c.nationalHealthId) === queryAbha)) return true;
          if (queryPhone && normalizePhone(c.contactNumber) === queryPhone) return true;
          if (queryName && normalizePatientName(c.patientName) === queryName) return true;
          if (queryCaseId && c.id === queryCaseId) return true;
          return false;
        });
        if (matchInCases) {
          patientKey = generatePatientKey(matchInCases);
          // Re-index to keep fast
          buildOrUpdateIndex(allCases);
        }
      }
    }
  }

  // If patientKey is resolved, retrieve all matching cases
  const entry = patientKey ? index.entries[patientKey] || null : null;

  let matchedCases: PatientCase[] = [];
  if (entry && entry.caseIds && entry.caseIds.length > 0) {
    matchedCases = allCases.filter((c) => entry.caseIds.includes(c.id));
  } else if (patientKey) {
    // Attempt fallback lookup directly
    matchedCases = allCases.filter((c) => generatePatientKey(c) === patientKey);
  } else if (queryName) {
    matchedCases = allCases.filter((c) =>
      normalizePatientName(c.patientName).includes(queryName)
    );
  }

  // Sort matched cases chronologically descending (newest first)
  matchedCases.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Extract vitals trajectory timeline (sorted chronologically ascending for graphs/progress)
  const vitalsTrend: VitalsTrendPoint[] = matchedCases
    .slice()
    .reverse()
    .map((c) => {
      const d = new Date(c.createdAt);
      return {
        date: c.createdAt,
        displayDate: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        caseId: c.id,
        temperature: c.vitals.temperature || 98.6,
        heartRate: c.vitals.heartRate || 72,
        spo2: c.vitals.spo2 || 98,
        bpSystolic: c.vitals.bpSystolic || 120,
        bpDiastolic: c.vitals.bpDiastolic || 80,
        respiratoryRate: c.vitals.respiratoryRate,
        bloodSugar: c.vitals.bloodSugar,
        riskLevel: c.riskLevel,
      };
    });

  // Cumulative allergies and chronic conditions
  const allAllergies = new Set<string>();
  const allConditions = new Set<string>();

  matchedCases.forEach((c) => {
    c.allergies?.forEach((a) => a && allAllergies.add(a));
    c.chronicConditions?.forEach((cond) => cond && allConditions.add(cond));
  });

  const latestCase = matchedCases[0];
  const primaryRiskLevel: RiskLevel =
    latestCase?.riskLevel || entry?.lastRiskLevel || "ROUTINE";

  return {
    entry,
    patientKey: patientKey || (typeof patientQuery === "string" ? patientQuery : patientQuery.patientName || "unknown"),
    patientName:
      entry?.canonicalName ||
      latestCase?.patientName ||
      (typeof patientQuery === "string" ? patientQuery : patientQuery.patientName || "Unnamed Patient"),
    cases: matchedCases,
    vitalsTrend,
    allKnownAllergies: Array.from(allAllergies),
    allChronicConditions: Array.from(allConditions),
    totalVisits: matchedCases.length,
    primaryRiskLevel,
    latestEncounterDate: latestCase?.createdAt || entry?.latestEncounterDate,
  };
}

/**
 * Return all distinct patients registered in the local storage index
 * for quick searching and switching.
 */
export function getAllIndexedPatientsList(allCasesInput?: PatientCase[]): {
  patientKey: string;
  patientName: string;
  abhaId?: string;
  contactNumber?: string;
  village: string;
  age: number;
  gender: string;
  visitsCount: number;
  latestVisit: string;
  latestRisk: RiskLevel;
}[] {
  let allCases = allCasesInput && allCasesInput.length > 0 ? allCasesInput : loadLocalCases();
  if (allCases.length === 0) {
    allCases = seedHistoricalCasesIfRequired();
  }

  let index = loadHistoryIndex();
  if (!index || Object.keys(index.entries).length === 0) {
    index = buildOrUpdateIndex(allCases);
  }

  return Object.values(index.entries)
    .map((e) => ({
      patientKey: e.patientKey,
      patientName: e.canonicalName,
      abhaId: e.abhaId,
      contactNumber: e.contactNumber,
      village: e.village,
      age: e.age,
      gender: e.gender,
      visitsCount: e.encountersCount,
      latestVisit: e.latestEncounterDate,
      latestRisk: e.lastRiskLevel || "ROUTINE",
    }))
    .sort(
      (a, b) => new Date(b.latestVisit).getTime() - new Date(a.latestVisit).getTime()
    );
}
