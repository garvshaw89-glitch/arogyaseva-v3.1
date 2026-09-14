export type RiskLevel = "ROUTINE" | "CONSULTATION" | "URGENT";

export type FacilityType =
  | "Sub-Centre / HWC"
  | "Primary Health Centre (PHC)"
  | "Community Health Centre (CHC / FRU)"
  | "Sub-District Hospital"
  | "District Hospital & Trauma"
  | "Tertiary / Medical College";

export interface VitalsData {
  temperature: number; // °F
  heartRate: number; // bpm
  spo2: number; // %
  bpSystolic: number; // mmHg
  bpDiastolic: number; // mmHg
  respiratoryRate?: number; // breaths/min
  bloodSugar?: number; // mg/dL
  weightKg?: number;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  hindiTranslation?: string;
  options: string[];
  dangerSignAnswer?: string;
  dangerSignDescription?: string;
  vitalCheckPrompt?: string;
  category: "RESPIRATORY" | "CIRCULATORY" | "NEUROLOGICAL" | "OBSTETRIC" | "PEDIATRIC" | "GENERAL";
}

export interface SBARSummary {
  situation: string;
  background: string;
  assessment: string;
  recommendation: string;
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  dangerSigns: string[];
  clinicalImpression: string;
  primaryDiagnosisRationale: string;
  recommendedAction: string;
  requiredFacilityLevel: FacilityType;
  fieldStabilizingActions: string[];
  sbarSummary: SBARSummary;
}

export interface HealthcareFacility {
  id: string;
  name: string;
  type: FacilityType;
  distanceKm: number;
  travelTimeMins: number;
  address: string;
  contactNumber: string;
  emergencyHotline: string;
  hasOxygen: boolean;
  hasBloodBank: boolean;
  hasCSection: boolean;
  hasNICU: boolean;
  hasSnakeAntivenom: boolean;
  hasAmbulance24x7: boolean;
  availableBeds: number;
  icuBedsAvailable: number;
  latitude: number;
  longitude: number;
}

export interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  village: string;
  chwName: string;
  contactNumber?: string;
  symptoms: string[];
  symptomDuration: string;
  rawVoiceInput?: string;
  inputLanguage?: string;
  vitals: VitalsData;
  chronicConditions?: string[];
  currentMedications?: string[];
  isPregnant?: boolean;
  pregnancyWeeks?: number;
  followUpAnswers: Record<string, string>;
  riskLevel: RiskLevel;
  riskScore: number;
  dangerSigns: string[];
  clinicalImpression: string;
  recommendedAction: string;
  sbarSummary: SBARSummary;
  fieldStabilizingActions: string[];
  referredFacility?: {
    id: string;
    name: string;
    type: string;
    distanceKm: number;
  };
  status: "PENDING_REVIEW" | "DOCTOR_REVIEWED" | "DISPATCHED" | "IN_TRANSIT" | "RESOLVED";
  doctorNotes?: string;
  doctorAction?: string;
  createdAt: string;
  syncedAt?: string;
  isOfflineCreated?: boolean;
}

export interface LiveLocationData {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number | null;
  speedKmH?: number | null;
  headingDegrees?: number | null;
  timestamp: string;
  isSimulated?: boolean;
}

export interface TriageVitals {
  temp?: number;
  hr?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  rr?: number;
  spo2?: number;
}

export interface TriagePayload {
  age?: number;
  sex?: string;
  symptoms?: string;
  vitals?: TriageVitals;
  comorbidities?: string[];
  onset?: string;
  duration_minutes?: number;
}

export interface TriageSignalResult {
  danger: boolean;
  level: "emergency" | "urgent" | "non-urgent";
  reasons: string[];
  advice: string;
  llm_assist?: {
    recommendation?: string;
    reasons?: string;
    safety_instruction?: string;
    raw?: string;
    error?: string;
  } | null;
}

export interface ClinicalPreset {
  id: string;
  title: string;
  titleHi: string;
  description: string;
  targetRisk: RiskLevel;
  voiceSampleText: string;
  language: string;
  patientData: Partial<PatientCase>;
}

export type SupportedLanguage = "en" | "hi" | "mr" | "bn" | "ta" | "te";
