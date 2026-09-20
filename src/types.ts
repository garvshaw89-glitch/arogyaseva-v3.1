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
  triageSignal?: TriageSignalResult;
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
  isGovt?: boolean;
  sector?: "Government" | "Private" | "Trust";
}

export interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  village: string;
  villageLatitude?: number;
  villageLongitude?: number;
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
  triageSignal?: TriageSignalResult;
  referredFacility?: {
    id: string;
    name: string;
    type: string;
    distanceKm: number;
  };
  status: "PENDING_REVIEW" | "DOCTOR_REVIEWED" | "DISPATCHED" | "IN_TRANSIT" | "RESOLVED" | "DRAFT" | "SUBMITTED" | "RECEIVED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "REFERRED" | "COMPLETED" | "CANCELLED";
  doctorNotes?: string;
  doctorAction?: string;
  version?: number;
  updatedAt?: string;
  lastModifiedBy?: string;
  attachments?: CaseAttachment[];
  createdAt: string;
  syncedAt?: string;
  isOfflineCreated?: boolean;
}

export interface CaseAttachment {
  id: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  category?: "lab_report" | "prescription" | "ecg_trace" | "photo" | "referral_slip";
}

export type ConnectionState = "connected" | "reconnecting" | "offline" | "syncing";

export interface ConnectedDevice {
  id: string;
  role: "chw" | "doctor" | "ambulance" | "admin" | "guest";
  deviceName: string;
  location?: string;
  connectedAt: string;
  lastActive: string;
  isCurrentDevice?: boolean;
}

export interface RealtimeNotification {
  id: string;
  caseId?: string;
  patientName?: string;
  type: "CASE_CREATED" | "DOCTOR_REVIEW" | "CRITICAL_ALERT" | "ATTACHMENT_ADDED" | "SYNC_COMPLETE";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  level: "info" | "warning" | "urgent" | "success";
}

export interface RealtimeStats {
  totalPatientsToday: number;
  activeCases: number;
  criticalCases: number;
  pendingReferrals: number;
  reviewedCases: number;
  connectedDevicesCount: number;
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
    diagnosticHypothesis?: string;
    riskRationale?: string;
    recommendedReferralTier?: string;
    suggestedQuestions?: string[];
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

export type SupportedLanguage =
  | "en" // English
  | "hi" // Hindi (हिन्दी)
  | "mr" // Marathi (मराठी)
  | "bn" // Bengali (বাংলা)
  | "ta" // Tamil (தமிழ்)
  | "te" // Telugu (తెలుగు)
  | "gu" // Gujarati (ગુજરાતી)
  | "kn" // Kannada (ಕನ್ನಡ)
  | "ml" // Malayalam (മലയാളം)
  | "pa" // Punjabi (ਪੰਜਾਬੀ)
  | "or" // Odia (ଓଡ଼ିଆ)
  | "as" // Assamese (অসমীয়া)
  | "ur" // Urdu (اردو)
  | "mai" // Maithili (मैथिली)
  | "sa" // Sanskrit (संस्कृतम्)
  | "kok" // Konkani (कोंकणी)
  | "ne" // Nepali (नेपाली)
  | "doi" // Dogri (डोगरी)
  | "ks" // Kashmiri (कश्मीरी)
  | "mni" // Manipuri (মৈতৈলোন্ / মণিপুরী)
  | "brx" // Bodo (बड़ो)
  | "sat" // Santali (संथाली)
  | "sd"; // Sindhi (سنڌي / सिंधी)
