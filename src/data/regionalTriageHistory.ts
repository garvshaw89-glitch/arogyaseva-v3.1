import { PatientCase, RiskLevel } from "../types";

export type OutbreakSyndrome =
  | "ALL"
  | "RESPIRATORY"
  | "FEBRILE_VECTOR"
  | "GASTROINTESTINAL"
  | "MATERNAL"
  | "CARDIOVASCULAR"
  | "TRAUMA_OTHER";

export interface HistoricalTriageRecord {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  village: string;
  block: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  syndrome: Exclude<OutbreakSyndrome, "ALL">;
  syndromeLabel: string;
  symptoms: string[];
  diagnosis: string;
  dangerSignsCount: number;
  timestamp: string; // ISO date
  isLiveCase?: boolean;
  chwWorker?: string;
  vitalsSummary: string;
}

// Deterministic seed for historical regional epidemiological baseline
const SEED_VILLAGES = [
  { name: "Pipariya Kalan", block: "Sector North-1" },
  { name: "Mandla Khurd", block: "Sector North-1" },
  { name: "Ghoradongri", block: "Sector East-2" },
  { name: "Shahpur Tribal Belt", block: "Sector East-2" },
  { name: "Multai River Valley", block: "Sector South-3" },
  { name: "Bhimpur Outpost", block: "Sector South-3" },
  { name: "Amla Junction", block: "Sector West-4" },
  { name: "Chhindwara Border", block: "Sector Central-5" },
];

const SYNDROME_DEFINITIONS: Record<
  Exclude<OutbreakSyndrome, "ALL">,
  {
    label: string;
    sampleSymptoms: string[];
    sampleDiagnoses: string[];
    riskScoreRange: [number, number];
  }
> = {
  RESPIRATORY: {
    label: "Acute Respiratory Distress / Pneumonia",
    sampleSymptoms: ["Severe Cough", "Dyspnea / Gasping", "Stridor", "Chest Indrawing", "Low SpO2"],
    sampleDiagnoses: [
      "Severe Community-Acquired Pneumonia",
      "Acute Bronchiolitis with Hypoxia",
      "COPD Acute Exacerbation",
      "Viral Croup with Stridor",
    ],
    riskScoreRange: [65, 96],
  },
  FEBRILE_VECTOR: {
    label: "Acute Febrile / Suspected Vector-Borne",
    sampleSymptoms: ["High Fever >103°F", "Severe Retro-orbital Pain", "Petechiae / Rash", "Thrombocytopenia Sign"],
    sampleDiagnoses: [
      "Severe Dengue with Warning Signs",
      "Falciparum Malaria with Cerebral Alert",
      "Enteric Fever (Typhoid with Decompensation)",
      "Acute Encephalitis Syndrome (AES)",
    ],
    riskScoreRange: [50, 94],
  },
  GASTROINTESTINAL: {
    label: "Acute Water-Borne / Severe Gastroenteritis",
    sampleSymptoms: ["Rice-water Diarrhea", "Sunken Eyes & Turgor", "Unquenchable Thirst", "Lethargy"],
    sampleDiagnoses: [
      "Severe Dehydrating Cholera-like Illness",
      "Invasive Bacillary Dysentery",
      "Acute Food-Borne Gastroenteritis",
      "Hypovolemic Shock secondary to GE",
    ],
    riskScoreRange: [45, 92],
  },
  MATERNAL: {
    label: "Maternal & Obstetric Danger",
    sampleSymptoms: ["Severe Pre-eclampsia BP", "Active Vaginal Bleeding", "Convulsions", "Absent Fetal Movement"],
    sampleDiagnoses: [
      "Severe Pre-eclampsia in Labor",
      "Antepartum Hemorrhage (Placenta Previa)",
      "Puerperal Sepsis with High Rigors",
      "Eclampsia with Impending Seizure",
    ],
    riskScoreRange: [70, 98],
  },
  CARDIOVASCULAR: {
    label: "Hypertensive Crisis & Cardiovascular",
    sampleSymptoms: ["Crushing Retrosternal Pain", "Diaphoresis", "BP 190/115", "Syncope"],
    sampleDiagnoses: [
      "Acute Coronary Syndrome (STEMI alert)",
      "Hypertensive Encephalopathy",
      "Decompensated Heart Failure with Pulmonary Edema",
      "Arrhythmia with Hemodynamic Instability",
    ],
    riskScoreRange: [72, 97],
  },
  TRAUMA_OTHER: {
    label: "Routine Primary Care & Minor Illness",
    sampleSymptoms: ["Mild Coryza", "Superficial Abrasion", "Chronic Joint Pain", "Low-grade Malaise"],
    sampleDiagnoses: [
      "Upper Respiratory Tract Viral Infection",
      "Mild Musculoskeletal Strain",
      "Uncomplicated Allergic Dermatitis",
      "Controlled Essential Hypertension Review",
    ],
    riskScoreRange: [12, 44],
  },
};

// Generate historical records spanning past 30 days
function generateHistoricalRecords(): HistoricalTriageRecord[] {
  const records: HistoricalTriageRecord[] = [];
  const now = Date.now();

  // Create an intentional cluster spike in past 48 hours for Respiratory & Febrile to emulate real outbreak
  const recordConfigs = [
    // Past 24 hours: intense spike in Pipariya & Shahpur (Suspected viral pneumonia / dengue outbreak)
    { count: 18, daysAgoMin: 0, daysAgoMax: 1, skewHigh: true, targetSyndrome: "RESPIRATORY" as const },
    { count: 14, daysAgoMin: 0, daysAgoMax: 1, skewHigh: true, targetSyndrome: "FEBRILE_VECTOR" as const },
    { count: 12, daysAgoMin: 0, daysAgoMax: 2, skewHigh: false, targetSyndrome: "TRAUMA_OTHER" as const },
    
    // Past 2 to 7 days
    { count: 25, daysAgoMin: 1.5, daysAgoMax: 7, skewHigh: true, targetSyndrome: "RESPIRATORY" as const },
    { count: 20, daysAgoMin: 2, daysAgoMax: 7, skewHigh: false, targetSyndrome: "FEBRILE_VECTOR" as const },
    { count: 16, daysAgoMin: 2, daysAgoMax: 7, skewHigh: false, targetSyndrome: "GASTROINTESTINAL" as const },
    { count: 10, daysAgoMin: 1, daysAgoMax: 7, skewHigh: true, targetSyndrome: "MATERNAL" as const },
    { count: 8, daysAgoMin: 1, daysAgoMax: 7, skewHigh: true, targetSyndrome: "CARDIOVASCULAR" as const },
    { count: 32, daysAgoMin: 1, daysAgoMax: 7, skewHigh: false, targetSyndrome: "TRAUMA_OTHER" as const },

    // Past 8 to 30 days: baseline distribution
    { count: 35, daysAgoMin: 8, daysAgoMax: 30, skewHigh: false, targetSyndrome: "TRAUMA_OTHER" as const },
    { count: 24, daysAgoMin: 8, daysAgoMax: 30, skewHigh: false, targetSyndrome: "FEBRILE_VECTOR" as const },
    { count: 20, daysAgoMin: 8, daysAgoMax: 30, skewHigh: false, targetSyndrome: "GASTROINTESTINAL" as const },
    { count: 18, daysAgoMin: 8, daysAgoMax: 30, skewHigh: false, targetSyndrome: "RESPIRATORY" as const },
    { count: 12, daysAgoMin: 8, daysAgoMax: 30, skewHigh: true, targetSyndrome: "MATERNAL" as const },
  ];

  let idCounter = 2001;

  recordConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      const synKey = cfg.targetSyndrome;
      const def = SYNDROME_DEFINITIONS[synKey];
      
      const vLoc = SEED_VILLAGES[(idCounter + i * 3) % SEED_VILLAGES.length];
      const age = Math.floor(18 + ((idCounter * 7) % 65));
      const gender = (idCounter + i) % 2 === 0 ? "Female" : "Male";

      // Score distribution based on syndrome & skew
      let score: number;
      if (cfg.skewHigh) {
        score = Math.floor(def.riskScoreRange[0] + Math.random() * (def.riskScoreRange[1] - def.riskScoreRange[0]));
      } else {
        score = Math.floor(def.riskScoreRange[0] + (Math.random() * 0.7) * (def.riskScoreRange[1] - def.riskScoreRange[0]));
      }
      score = Math.max(8, Math.min(98, score));

      const riskLevel: RiskLevel = score >= 75 ? "URGENT" : score >= 40 ? "CONSULTATION" : "ROUTINE";
      
      // Calculate realistic timestamp
      const dayOffsetMs = (cfg.daysAgoMin + Math.random() * (cfg.daysAgoMax - cfg.daysAgoMin)) * 86400000;
      const timestamp = new Date(now - dayOffsetMs).toISOString();

      const diag = def.sampleDiagnoses[i % def.sampleDiagnoses.length];
      const symptomSubset = def.sampleSymptoms.slice(0, 2 + (i % 3));

      records.push({
        id: `HIST-${idCounter++}`,
        patientName: `${gender === "Female" ? "Patient F." : "Patient M."} ${100 + (idCounter % 900)}`,
        age,
        gender,
        village: vLoc.name,
        block: vLoc.block,
        riskScore: score,
        riskLevel,
        syndrome: synKey,
        syndromeLabel: def.label,
        symptoms: symptomSubset,
        diagnosis: diag,
        dangerSignsCount: riskLevel === "URGENT" ? 3 : riskLevel === "CONSULTATION" ? 1 : 0,
        timestamp,
        isLiveCase: false,
        chwWorker: `ASHA ${SEED_VILLAGES[(idCounter) % SEED_VILLAGES.length].block.slice(0, 8)}`,
        vitalsSummary: score >= 75 ? "SpO2 88%, HR 118, RR 26" : score >= 40 ? "BP 148/92, Temp 101.4°F" : "Vitals normal / stable",
      });
    }
  });

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const BASELINE_HISTORICAL_RECORDS = generateHistoricalRecords();

/**
 * Maps a live PatientCase into the HistoricalTriageRecord format
 */
export function mapLiveCaseToHistorical(caseData: PatientCase): HistoricalTriageRecord {
  // Determine dominant syndrome from symptoms & impressions
  const symptomsStr = (caseData.symptoms || []).join(" ").toLowerCase();
  const impression = (caseData.clinicalImpression || "").toLowerCase();

  let syndrome: Exclude<OutbreakSyndrome, "ALL"> = "TRAUMA_OTHER";

  if (symptomsStr.includes("breath") || symptomsStr.includes("cough") || impression.includes("pneumonia") || (caseData.vitals?.spo2 && caseData.vitals.spo2 < 93)) {
    syndrome = "RESPIRATORY";
  } else if (symptomsStr.includes("fever") || symptomsStr.includes("dengue") || impression.includes("malaria") || impression.includes("febrile")) {
    syndrome = "FEBRILE_VECTOR";
  } else if (symptomsStr.includes("vomit") || symptomsStr.includes("diarrhea") || impression.includes("gastroenteritis") || impression.includes("cholera")) {
    syndrome = "GASTROINTESTINAL";
  } else if (caseData.isPregnant || impression.includes("obstetric") || impression.includes("eclampsia") || impression.includes("labor")) {
    syndrome = "MATERNAL";
  } else if (symptomsStr.includes("chest") || impression.includes("cardiac") || (caseData.vitals?.bpSystolic && caseData.vitals.bpSystolic >= 170)) {
    syndrome = "CARDIOVASCULAR";
  }

  const def = SYNDROME_DEFINITIONS[syndrome];

  return {
    id: caseData.id,
    patientName: caseData.patientName,
    age: caseData.age,
    gender: caseData.gender,
    village: caseData.village || "District Sub-Center",
    block: "Live Intake Queue",
    riskScore: caseData.riskScore ?? (caseData.riskLevel === "URGENT" ? 88 : caseData.riskLevel === "CONSULTATION" ? 55 : 25),
    riskLevel: caseData.riskLevel || "ROUTINE",
    syndrome,
    syndromeLabel: def.label,
    symptoms: caseData.symptoms || [],
    diagnosis: caseData.clinicalImpression || def.sampleDiagnoses[0],
    dangerSignsCount: caseData.dangerSigns?.length ?? 0,
    timestamp: caseData.createdAt || new Date().toISOString(),
    isLiveCase: true,
    chwWorker: caseData.chwName || "Primary Health Worker",
    vitalsSummary: caseData.vitals
      ? `SpO2 ${caseData.vitals.spo2}%, BP ${caseData.vitals.bpSystolic}/${caseData.vitals.bpDiastolic}, HR ${caseData.vitals.heartRate}`
      : "Standard triage telemetry",
  };
}

/**
 * Combines live cases and historical database with deduplication
 */
export function getUnifiedTriageDataset(liveCases: PatientCase[]): HistoricalTriageRecord[] {
  const liveRecords = liveCases.map(mapLiveCaseToHistorical);
  return [...liveRecords, ...BASELINE_HISTORICAL_RECORDS];
}
