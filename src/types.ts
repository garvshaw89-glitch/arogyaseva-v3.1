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
  status: "PENDING_REVIEW" | "DOCTOR_REVIEWED" | "DISPATCHED" | "RESOLVED";
  doctorNotes?: string;
  doctorAction?: string;
  createdAt: string;
  syncedAt?: string;
  isOfflineCreated?: boolean;
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
