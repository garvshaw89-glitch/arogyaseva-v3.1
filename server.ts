import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";
import NodeCache from "node-cache";
import triageRouter, { ruleBasedTriage } from "./server/triage";

dotenv.config();

// Shared cache with 5-minute standard TTL
const geoCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
// Tile cache with 24-hour TTL (86400 seconds)
const tileCache = new NodeCache({ stdTTL: 86400, checkperiod: 600, maxKeys: 2500 });

// Contact agent per Nominatim usage policy
const USER_AGENT = "ArogyaSeva-RuralHealth/1.0 (ruralhealth-referral@arogyaseva.org)";

async function fetchWithAgent(url: string) {
  return await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "en",
    },
  });
}

// In-memory case store for the session (synchronized with client storage)
interface CaseRecord {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  village: string;
  chwName: string;
  contactNumber?: string;
  symptoms: string[];
  symptomDuration: string;
  rawVoiceInput?: string;
  inputLanguage?: string;
  vitals: {
    temperature: number; // °F
    heartRate: number; // bpm
    spo2: number; // %
    bpSystolic: number;
    bpDiastolic: number;
    respiratoryRate?: number;
    bloodSugar?: number;
  };
  chronicConditions?: string[];
  currentMedications?: string[];
  isPregnant?: boolean;
  pregnancyWeeks?: number;
  followUpAnswers: Record<string, string>;
  riskLevel: "ROUTINE" | "CONSULTATION" | "URGENT";
  riskScore: number;
  dangerSigns: string[];
  clinicalImpression: string;
  recommendedAction: string;
  sbarSummary: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
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
  triageSignal?: {
    danger: boolean;
    level: "emergency" | "urgent" | "non-urgent";
    reasons: string[];
    advice: string;
    llm_assist?: any;
  };
  createdAt: string;
  syncedAt: string;
  isOfflineCreated?: boolean;
}

const casesDatabase: CaseRecord[] = [
  {
    id: "CASE-1082",
    patientName: "Rameshwar Patel",
    age: 54,
    gender: "Male",
    village: "Pipariya Kalan (Block 2)",
    chwName: "Sunita ASHA Worker",
    contactNumber: "+91 98261 44521",
    symptoms: ["High Fever", "Severe Shortness of Breath", "Productive Cough", "Extreme Fatigue"],
    symptomDuration: "4 days",
    rawVoiceInput: "मरीज को चार दिन से बहुत तेज बुखार है और सांस लेने में बहुत दिक्कत हो रही है, सीने में दर्द है",
    inputLanguage: "hi",
    vitals: {
      temperature: 102.4,
      heartRate: 118,
      spo2: 87,
      bpSystolic: 138,
      bpDiastolic: 88,
      respiratoryRate: 28,
    },
    chronicConditions: ["Hypertension", "Tobacco User"],
    currentMedications: ["Amlodipine 5mg"],
    isPregnant: false,
    followUpAnswers: {
      "Is patient able to speak in full sentences?": "No, gasping between words",
      "Any blue discoloration around lips/nails?": "Mild peripheral cyanosis noticed",
      "Is there chest pain on deep inspiration?": "Yes, right-sided sharp pain"
    },
    riskLevel: "URGENT",
    riskScore: 92,
    dangerSigns: [
      "Severe Hypoxemia (SpO2 87% on room air)",
      "Tachypnea (RR 28 breaths/min)",
      "Tachycardia (HR 118 bpm)",
      "Inability to speak complete sentences"
    ],
    clinicalImpression: "Severe Lower Respiratory Tract Infection / Acute Hypoxemic Respiratory Distress (Suspected Severe Pneumonia)",
    recommendedAction: "Immediate transfer to Community Health Centre or District Hospital with continuous supplemental oxygen and ICU preparedness.",
    sbarSummary: {
      situation: "54-year-old male presenting with acute respiratory distress, severe hypoxemia (SpO2 87%), and fever for 4 days.",
      background: "History of hypertension and long-term smoking. No known TB history. Currently on Amlodipine.",
      assessment: "High risk of respiratory failure secondary to severe community-acquired pneumonia. Danger signs present.",
      recommendation: "Immediate oxygen therapy (4-6 L/min via mask), IV access, urgent 108 ambulance transfer to District Hospital Pulmonology Unit."
    },
    fieldStabilizingActions: [
      "Prop patient up in a 45-degree upright seated position",
      "Administer supplemental oxygen if cylinder available at HWC Sub-centre (4 L/min)",
      "Keep patient calm, avoid physical exertion",
      "Alert 108 Emergency Ambulance for expedited pickup with oxygen on board"
    ],
    referredFacility: {
      id: "DH-01",
      name: "District Civil Hospital & Trauma Centre",
      type: "District Hospital",
      distanceKm: 28
    },
    status: "PENDING_REVIEW",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    syncedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
  {
    id: "CASE-1081",
    patientName: "Pooja Meena",
    age: 23,
    gender: "Female",
    village: "Ghatola Village",
    chwName: "Anita ANM",
    contactNumber: "+91 94142 88102",
    symptoms: ["Severe Headache", "Blurred Vision", "Swelling in feet and face", "Epigastric discomfort"],
    symptomDuration: "2 days",
    rawVoiceInput: "Patient is 28 weeks pregnant, experiencing severe headache, puffy eyes and blurred vision since yesterday",
    inputLanguage: "en",
    vitals: {
      temperature: 98.8,
      heartRate: 94,
      spo2: 97,
      bpSystolic: 164,
      bpDiastolic: 106,
      respiratoryRate: 18,
    },
    chronicConditions: ["Primigravida (28 Weeks)"],
    currentMedications: ["Iron Folic Acid", "Calcium tablets"],
    isPregnant: true,
    pregnancyWeeks: 28,
    followUpAnswers: {
      "Any convulsions or fits?": "No",
      "Any sudden severe upper abdominal pain?": "Mild discomfort under ribs",
      "Fetal movements felt in last 12 hours?": "Yes, active"
    },
    riskLevel: "URGENT",
    riskScore: 88,
    dangerSigns: [
      "Severe Pregnancy Hypertension (BP 164/106 mmHg)",
      "Neurological warning signs: Severe headache with visual disturbances",
      "Facial and pedal edema"
    ],
    clinicalImpression: "Preeclampsia with Severe Features (Imminent Eclampsia Risk)",
    recommendedAction: "Urgent Obstetric Referral to First Referral Unit (FRU) / CHC equipped with Magnesium Sulphate and Obstetrician.",
    sbarSummary: {
      situation: "23yo Primigravida at 28 weeks gestation presenting with BP 164/106, severe persistent headache and blurred vision.",
      background: "Registered ANC beneficiary, regular on IFA. No prior known hypertension.",
      assessment: "Severe Preeclampsia at risk of eclamptic seizures.",
      recommendation: "Administer loading dose of Inj. Magnesium Sulphate if trained and authorized; urgent referral to District Obstetric Ward."
    },
    fieldStabilizingActions: [
      "Keep patient in left lateral recumbent position in a quiet, darkened corner",
      "Do not give oral fluids if drowsy",
      "Monitor BP every 15 minutes",
      "Expedite transfer to FRU/CHC with companion and ANC card"
    ],
    referredFacility: {
      id: "CHC-02",
      name: "Community Health Centre & FRU - Rampur",
      type: "CHC (FRU)",
      distanceKm: 14
    },
    status: "DOCTOR_REVIEWED",
    doctorNotes: "Dr. Sharma (OBGYN MO): Alerted triage labor room. Magnesium Sulphate ready. Transport initiated via 108.",
    doctorAction: "Referral Accepted & Emergency Bed Reserved",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: "CASE-1080",
    patientName: "Aarav Kumar (Pediatric)",
    age: 4,
    gender: "Male",
    village: "Bhimnagar Sub-centre",
    chwName: "Sunita ASHA Worker",
    contactNumber: "+91 91114 55320",
    symptoms: ["Watery Diarrhea", "Vomiting", "Lethargy", "Sunken Eyes"],
    symptomDuration: "2 days",
    rawVoiceInput: "चार साल का बच्चा है, दो दिन से लगातार दस्त और उल्टी हो रही है, पानी नहीं पी पा रहा",
    inputLanguage: "hi",
    vitals: {
      temperature: 99.4,
      heartRate: 132,
      spo2: 96,
      bpSystolic: 88,
      bpDiastolic: 56,
      respiratoryRate: 34,
    },
    chronicConditions: ["None"],
    currentMedications: ["None"],
    isPregnant: false,
    followUpAnswers: {
      "Skin pinch on abdomen goes back:": "Very slowly (> 2 seconds)",
      "Is child able to drink or breastfeed?": "Drinks poorly / unable to retain fluids",
      "Any blood in stool?": "No"
    },
    riskLevel: "URGENT",
    riskScore: 84,
    dangerSigns: [
      "Severe Dehydration (Skin pinch > 2s, sunken eyes)",
      "Pediatric Tachycardia (HR 132 bpm)",
      "Inability to drink / persistent vomiting"
    ],
    clinicalImpression: "Acute Gastroenteritis with Severe Dehydration (WHO Plan C Indication)",
    recommendedAction: "Urgent transfer to Primary Health Centre for IV Ringer's Lactate rehydration.",
    sbarSummary: {
      situation: "4-year-old child presenting with severe dehydration signs following 2 days of watery diarrhea and vomiting.",
      background: "Fully immunized child, no prior hospital admissions.",
      assessment: "Severe dehydration with lethargy and poor oral intake.",
      recommendation: "Immediate IV fluid resuscitation (Plan C), start zinc supplementation once tolerating oral intake."
    },
    fieldStabilizingActions: [
      "If child can take sips, offer ORS with spoon continuously during transit",
      "Keep child warm and comfortable",
      "Do not give anti-diarrheal medicines",
      "Transfer urgently to nearest 24/7 PHC"
    ],
    referredFacility: {
      id: "PHC-01",
      name: "Primary Health Centre - Bhimnagar",
      type: "Primary Health Centre",
      distanceKm: 6
    },
    status: "DOCTOR_REVIEWED",
    doctorNotes: "Dr. Verma (PHC MO): IV RL line initiated. Child responding well, vitals stabilizing.",
    doctorAction: "Treatment Underway at PHC",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date(Date.now() - 230 * 60 * 1000).toISOString(),
  },
  {
    id: "CASE-1079",
    patientName: "Kamla Bai",
    age: 62,
    gender: "Female",
    village: "Pipariya Kalan",
    chwName: "Sunita ASHA Worker",
    contactNumber: "+91 97721 33490",
    symptoms: ["Joint Pain in knees", "Mild lower back stiffness", "Difficulty walking long distances"],
    symptomDuration: "3 weeks",
    rawVoiceInput: "62 साल की महिला, दोनों घुटनों में दर्द और चलने में परेशानी, बुखार नहीं है",
    inputLanguage: "hi",
    vitals: {
      temperature: 98.4,
      heartRate: 76,
      spo2: 98,
      bpSystolic: 128,
      bpDiastolic: 82,
      respiratoryRate: 16,
    },
    chronicConditions: ["Osteoarthritis"],
    currentMedications: ["Calcium"],
    isPregnant: false,
    followUpAnswers: {
      "Any redness or severe heat over the joints?": "No",
      "Any recent fall or trauma?": "No",
      "Any morning stiffness lasting > 1 hour?": "About 15 minutes only"
    },
    riskLevel: "ROUTINE",
    riskScore: 22,
    dangerSigns: [],
    clinicalImpression: "Chronic Degenerative Osteoarthritis of Knee Joints (Non-emergency)",
    recommendedAction: "Local primary management with physical exercises, warm fomentation, and regular follow-up at next NCD screening camp.",
    sbarSummary: {
      situation: "62yo female with 3-week history of bilateral mechanical knee joint pain.",
      background: "Known mild osteoarthritis, normal vital signs.",
      assessment: "Chronic knee pain without acute red flags, effusion, or neurovascular compromise.",
      recommendation: "Provide Paracetamol for symptom relief as per ASHA kit, recommend gentle quadriceps exercises, schedule for routine NCD clinic."
    },
    fieldStabilizingActions: [
      "Reassure the patient",
      "Advise gentle knee strengthening exercises and avoiding deep squats",
      "Dispense Paracetamol 500mg SOS as per standard ASHA drug kit protocols",
      "Schedule routine visit during Tuesday NCD screening day"
    ],
    referredFacility: {
      id: "HWC-01",
      name: "Ayushman Arogya Mandir (Sub-Centre)",
      type: "Health & Wellness Centre",
      distanceKm: 1.5
    },
    status: "RESOLVED",
    doctorNotes: "Routine NCD care approved. Tele-physiotherapy guide shared.",
    doctorAction: "Routine Local Care",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date(Date.now() - 350 * 60 * 1000).toISOString(),
  }
];

// Helper to initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  // API Route: Triage Engine for AI Signals
  app.use("/api", triageRouter);

  // API Route: Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      casesCount: casesDatabase.length,
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Get all cases with AI Triage Signals
  app.get("/api/cases", (_req: Request, res: Response) => {
    const enrichedCases = casesDatabase.map((c) => {
      if (!c.triageSignal) {
        c.triageSignal = ruleBasedTriage({
          age: c.age,
          sex: c.gender,
          symptoms: (c.symptoms || []).join(" "),
          vitals: {
            temp: c.vitals?.temperature,
            hr: c.vitals?.heartRate,
            bp_systolic: c.vitals?.bpSystolic,
            bp_diastolic: c.vitals?.bpDiastolic,
            rr: c.vitals?.respiratoryRate,
            spo2: c.vitals?.spo2,
          },
          comorbidities: c.chronicConditions,
          onset: c.symptomDuration,
        });
      }
      return c;
    });

    res.json({
      success: true,
      cases: enrichedCases,
    });
  });

  // API Route: Create or Sync a case
  app.post("/api/cases", (req: Request, res: Response) => {
    const newCase = req.body as CaseRecord;
    if (!newCase.id) {
      newCase.id = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    newCase.syncedAt = new Date().toISOString();

    if (!newCase.triageSignal) {
      newCase.triageSignal = ruleBasedTriage({
        age: newCase.age,
        sex: newCase.gender,
        symptoms: (newCase.symptoms || []).join(" "),
        vitals: {
          temp: newCase.vitals?.temperature,
          hr: newCase.vitals?.heartRate,
          bp_systolic: newCase.vitals?.bpSystolic,
          bp_diastolic: newCase.vitals?.bpDiastolic,
          rr: newCase.vitals?.respiratoryRate,
          spo2: newCase.vitals?.spo2,
        },
        comorbidities: newCase.chronicConditions,
        onset: newCase.symptomDuration,
      });
    }

    const existingIdx = casesDatabase.findIndex((c) => c.id === newCase.id);
    if (existingIdx >= 0) {
      casesDatabase[existingIdx] = { ...casesDatabase[existingIdx], ...newCase };
      res.json({ success: true, case: casesDatabase[existingIdx], updated: true });
    } else {
      casesDatabase.unshift(newCase);
      res.json({ success: true, case: newCase, created: true });
    }
  });

  // API Route: Update case status / doctor notes
  app.patch("/api/cases/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, doctorNotes, doctorAction } = req.body;
    const caseItem = casesDatabase.find((c) => c.id === id);
    if (!caseItem) {
      res.status(404).json({ success: false, error: "Case not found" });
      return;
    }
    if (status) caseItem.status = status;
    if (doctorNotes !== undefined) caseItem.doctorNotes = doctorNotes;
    if (doctorAction !== undefined) caseItem.doctorAction = doctorAction;

    res.json({ success: true, case: caseItem });
  });

  // API Route: AI Natural Language & Voice Symptom Extraction
  app.post("/api/extract-symptoms", async (req: Request, res: Response) => {
    try {
      const { text, language = "en" } = req.body;
      if (!text || typeof text !== "string") {
        res.status(400).json({ error: "Text input is required" });
        return;
      }

      const ai = getGeminiClient();

      if (!ai) {
        // Deterministic fallback if API key is not present
        const lower = text.toLowerCase();
        const extracted = {
          age: extractNumberPattern(text, ["age", "वर्ष", "साल", "years", "yr", "old"]) || 35,
          gender: /female|महिला|woman|girl|pregnant|गर्भवती|स्त्री/i.test(text) ? "Female" : "Male",
          symptoms: extractKeywords(text, [
            "fever", "बुखार", "ताप", "cough", "खांसी", "खोखला", "headache", "सिरदर्द",
            "breathlessness", "difficulty breathing", "सांस", "weakness", "कमजोरी",
            "vomiting", "उल्टी", "diarrhea", "दस्त", "pain", "दर्द", "chest pain", "सीने में दर्द"
          ]),
          duration: extractDuration(text) || "2 days",
          vitalsMentioned: {
            temperature: extractTemp(text),
            spo2: extractNumberPattern(text, ["spo2", "oxygen", "ऑक्सीजन", "%"]),
            bpSystolic: extractNumberPattern(text, ["bp", "blood pressure", "systolic"]),
            bpDiastolic: undefined,
            heartRate: extractNumberPattern(text, ["pulse", "heart rate", "hr"]),
          },
          isPregnant: /pregnant|गर्भवती|गर्भ|garbh/i.test(text),
          chronicConditions: extractConditions(text),
          languageDetected: language,
          confidence: 0.85,
          normalizedSummary: `Extracted patient details from spoken/regional text.`
        };
        res.json({ success: true, data: extracted, source: "deterministic_engine" });
        return;
      }

      const prompt = `You are a clinical NLP extractor for a Rural Community Health Worker (ASHA/ANM) app in India.
Analyze the following patient narrative (which may be in Hindi, Bengali, Tamil, Telugu, Marathi, Hinglish, or English, spoken or typed):
"""${text}"""

Extract clinical facts into strict JSON format with schema:
{
  "age": number (or null if not mentioned),
  "gender": "Male" | "Female" | "Other" (infer from context if clear),
  "symptoms": string[] (list of medical symptoms in English, e.g. ["High Fever", "Difficulty Breathing", "Severe Headache"]),
  "duration": string (e.g. "3 days", "since yesterday", "1 week"),
  "vitalsMentioned": {
    "temperature": number (in Fahrenheit if specified, e.g. 102),
    "spo2": number (e.g. 88),
    "bpSystolic": number (e.g. 140),
    "bpDiastolic": number (e.g. 90),
    "heartRate": number (e.g. 110),
    "respiratoryRate": number (e.g. 26)
  },
  "isPregnant": boolean,
  "pregnancyWeeks": number (or null),
  "chronicConditions": string[],
  "currentMedications": string[],
  "urgentRedFlagsMentioned": string[],
  "normalizedSummary": string (a concise 1-sentence clinical summary in English)
}
Return valid JSON only.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      parsed.triageSignal = ruleBasedTriage({
        age: parsed.age,
        sex: parsed.gender,
        symptoms: (parsed.symptoms || []).join(" ") + " " + (parsed.normalizedSummary || "") + " " + (parsed.urgentRedFlagsMentioned || []).join(" "),
        vitals: {
          temp: parsed.vitalsMentioned?.temperature,
          spo2: parsed.vitalsMentioned?.spo2,
          bp_systolic: parsed.vitalsMentioned?.bpSystolic,
          bp_diastolic: parsed.vitalsMentioned?.bpDiastolic,
          hr: parsed.vitalsMentioned?.heartRate,
          rr: parsed.vitalsMentioned?.respiratoryRate,
        },
        comorbidities: parsed.chronicConditions,
        onset: parsed.duration,
      });
      res.json({ success: true, data: parsed, source: "gemini_ai" });
    } catch (err: any) {
      console.error("Extraction error:", err);
      const fallbackData: any = {
        age: 30,
        gender: "Male",
        symptoms: ["Fever", "Fatigue"],
        duration: "2 days",
        vitalsMentioned: {},
        isPregnant: false,
        chronicConditions: [],
        normalizedSummary: "Clinical input received."
      };
      fallbackData.triageSignal = ruleBasedTriage({
        age: fallbackData.age,
        sex: fallbackData.gender,
        symptoms: fallbackData.symptoms.join(" "),
        vitals: {},
        comorbidities: [],
        onset: fallbackData.duration,
      });
      res.status(500).json({
        success: false,
        error: "Failed to extract symptoms",
        fallback: fallbackData
      });
    }
  });

  // API Route: AI Dynamic Intelligent Follow-up Questions Generator
  app.post("/api/generate-followups", async (req: Request, res: Response) => {
    try {
      const { age, gender, symptoms, vitals, isPregnant, currentAnswers = {} } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // High-yield clinical decision rules fallback
        const questions = getRuleBasedFollowUps({ age, gender, symptoms, vitals, isPregnant });
        res.json({ success: true, questions, source: "clinical_rules_engine" });
        return;
      }

      const prompt = `You are a Senior Rural Primary Care Physician & Clinical Decision Support AI assisting a frontline Community Health Worker (ASHA/ANM) in a remote village with limited diagnostic tools.

Current Patient Case:
- Age: ${age}
- Gender: ${gender}
- Pregnant: ${isPregnant ? "Yes" : "No"}
- Symptoms: ${JSON.stringify(symptoms)}
- Vitals Recorded So Far: ${JSON.stringify(vitals)}
- Answers Already Given: ${JSON.stringify(currentAnswers)}

Task:
Generate 3 to 5 high-yield, specific follow-up questions for the ASHA worker to assess danger signs and rule out life-threatening emergencies according to WHO IMCI, Emergency Triage Assessment and Treatment (ETAT), and Ayushman Bharat Guidelines.

For each question, explain if any response triggers an immediate RED ALERT / DANGER SIGN.

Return strict JSON schema:
[
  {
    "id": "q1",
    "question": string (Clear, plain language for frontline worker),
    "hindiTranslation": string (in Devanagari Hindi for rural field convenience),
    "options": string[] (e.g. ["Yes", "No", "Unsure"] or specific options),
    "dangerSignAnswer": string (which option indicates danger, e.g. "Yes" or specific cutoff),
    "dangerSignDescription": string (clinical explanation of danger sign),
    "vitalCheckPrompt": string (optional vital sign measurement instruction, e.g. "Check SpO2 with pulse oximeter immediately" or "Count breaths for 60 seconds"),
    "category": "RESPIRATORY" | "CIRCULATORY" | "NEUROLOGICAL" | "OBSTETRIC" | "PEDIATRIC" | "GENERAL"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const questions = JSON.parse(response.text?.trim() || "[]");
      res.json({ success: true, questions, source: "gemini_ai" });
    } catch (err: any) {
      console.error("Follow-up generation error:", err);
      const fallbackQuestions = getRuleBasedFollowUps(req.body);
      res.json({ success: true, questions: fallbackQuestions, source: "clinical_rules_fallback" });
    }
  });

  // API Route: AI Clinical Risk Assessment & Triage Grading
  app.post("/api/assess-risk", async (req: Request, res: Response) => {
    try {
      const patientData = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        const ruleAssessment = evaluateRuleBasedRisk(patientData);
        res.json({ success: true, assessment: ruleAssessment, source: "clinical_rules_engine" });
        return;
      }

      const prompt = `You are an expert Clinical Decision Support System and Emergency Triage Engine for Indian Rural Healthcare (ICMR / WHO Primary Health Guidelines).

Evaluate the following patient assessed by a Community Health Worker (ASHA):
${JSON.stringify(patientData, null, 2)}

Provide a rigorous clinical decision support analysis.
Categorize the urgency into exactly one of:
- "URGENT": Red Alert 🔴 - Patient requires emergency transfer to Higher Facility (CHC / FRU / District Hospital).
- "CONSULTATION": Amber 🟡 - Needs Teleconsultation / Medical Officer visit at Primary Health Centre within 24 hours.
- "ROUTINE": Green 🟢 - Can be managed at Village / Sub-Centre level with routine home care, oral hydration, or ASHA kit protocols.

Provide:
1. riskLevel: "URGENT" | "CONSULTATION" | "ROUTINE"
2. riskScore: number (0 - 100)
3. dangerSigns: string[] (List of critical danger signs identified)
4. clinicalImpression: string (Probable clinical syndrome, e.g. "Acute Lower Respiratory Tract Infection with Hypoxia")
5. primaryDiagnosisRationale: string (Why this urgency was assigned)
6. recommendedAction: string (Clear actionable directive for CHW)
7. requiredFacilityLevel: "Sub-Centre / HWC" | "Primary Health Centre (PHC)" | "Community Health Centre (CHC / FRU)" | "District Hospital & Trauma" | "Tertiary / Medical College"
8. fieldStabilizingActions: string[] (Step-by-step first-aid & stabilizing measures the worker can do immediately before/during transport)
9. sbarSummary: {
     "situation": string,
     "background": string,
     "assessment": string,
     "recommendation": string
   } (Structured SBAR summary for the receiving Doctor)

Return pure JSON.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const assessment = JSON.parse(response.text?.trim() || "{}");
      assessment.triageSignal = ruleBasedTriage({
        age: patientData.age,
        sex: patientData.gender,
        symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms.join(" ") : patientData.symptoms,
        vitals: {
          temp: patientData.vitals?.temperature,
          spo2: patientData.vitals?.spo2,
          bp_systolic: patientData.vitals?.bpSystolic,
          bp_diastolic: patientData.vitals?.bpDiastolic,
          hr: patientData.vitals?.heartRate,
          rr: patientData.vitals?.respiratoryRate,
        },
        comorbidities: patientData.chronicConditions,
        onset: patientData.symptomDuration,
      });
      res.json({ success: true, assessment, source: "gemini_ai" });
    } catch (err: any) {
      console.error("Risk assessment error:", err);
      const fallbackAssessment = evaluateRuleBasedRisk(req.body);
      fallbackAssessment.triageSignal = ruleBasedTriage({
        age: req.body.age,
        sex: req.body.gender,
        symptoms: Array.isArray(req.body.symptoms) ? req.body.symptoms.join(" ") : req.body.symptoms,
        vitals: {
          temp: req.body.vitals?.temperature,
          spo2: req.body.vitals?.spo2,
          bp_systolic: req.body.vitals?.bpSystolic,
          bp_diastolic: req.body.vitals?.bpDiastolic,
          hr: req.body.vitals?.heartRate,
          rr: req.body.vitals?.respiratoryRate,
        },
        comorbidities: req.body.chronicConditions,
        onset: req.body.symptomDuration,
      });
      res.json({ success: true, assessment: fallbackAssessment, source: "clinical_rules_fallback" });
    }
  });

  // API Route: Regional Text Translation & Audio Guidance Helper
  app.post("/api/translate-text", async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage = "hi" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        res.json({ success: true, translatedText: text, source: "passthrough" });
        return;
      }

      const prompt = `Translate the following clinical instruction or case summary into the language code "${targetLanguage}" (e.g. hi for Hindi, bn for Bengali, ta for Tamil, te for Telugu, mr for Marathi). Keep medical clarity and easy colloquial phrasing for a village healthcare worker:
"""${text}"""
Return only the translated string.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
      });

      res.json({ success: true, translatedText: response.text?.trim() || text });
    } catch (err) {
      res.json({ success: false, translatedText: req.body.text });
    }
  });

  // --- OPENSTREETMAP, GEOCODING, ROUTING & OFFLINE TILE CACHE API ---

  // 1. Geocoding (Forward Address Search) with 5-min caching
  app.get("/api/geocode", async (req: Request, res: Response) => {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        res.status(400).json({ error: "q parameter required" });
        return;
      }

      const key = `geocode:${q.trim().toLowerCase()}`;
      const cached = geoCache.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.json(cached);
        return;
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q.trim())}&addressdetails=1&limit=8`;
      const r = await fetchWithAgent(url);
      if (!r.ok) {
        // Fallback to local district search
        const fallback = searchLocalPlaces(q);
        res.json(fallback);
        return;
      }

      const data = await r.json();
      geoCache.set(key, data);
      res.setHeader("X-Cache", "MISS");
      res.json(data);
    } catch (err: any) {
      const fallback = searchLocalPlaces((req.query.q as string) || "");
      res.json(fallback);
    }
  });

  // 2. Reverse Geocoding (Lat/Lon -> Place Name) with caching
  app.get("/api/reverse", async (req: Request, res: Response) => {
    try {
      const lat = req.query.lat as string;
      const lon = req.query.lon as string;
      if (!lat || !lon) {
        res.status(400).json({ error: "lat and lon required" });
        return;
      }

      const key = `reverse:${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
      const cached = geoCache.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.json(cached);
        return;
      }

      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
      const r = await fetchWithAgent(url);
      if (!r.ok) {
        res.json({
          display_name: `Rural Health Coordinates (${parseFloat(lat).toFixed(3)}°N, ${parseFloat(lon).toFixed(3)}°E)`,
          lat,
          lon,
        });
        return;
      }

      const data = await r.json();
      geoCache.set(key, data);
      res.setHeader("X-Cache", "MISS");
      res.json(data);
    } catch (err: any) {
      res.json({
        display_name: `Rural Sector Point (${parseFloat(req.query.lat as string || "0").toFixed(3)}°N, ${parseFloat(req.query.lon as string || "0").toFixed(3)}°E)`,
        lat: req.query.lat,
        lon: req.query.lon,
      });
    }
  });

  // 3. Routing via OSRM public server with cached routes & offline fallback
  app.get("/api/route", async (req: Request, res: Response) => {
    try {
      const start = req.query.start as string; // "lat,lon"
      const end = req.query.end as string;     // "lat,lon"
      if (!start || !end) {
        res.status(400).json({ error: "start and end required (lat,lon)" });
        return;
      }

      const key = `route:${start}:${end}`;
      const cached = geoCache.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.json(cached);
        return;
      }

      const [sLatStr, sLonStr] = start.split(",");
      const [eLatStr, eLonStr] = end.split(",");
      const sLat = parseFloat(sLatStr?.trim());
      const sLon = parseFloat(sLonStr?.trim());
      const eLat = parseFloat(eLatStr?.trim());
      const eLon = parseFloat(eLonStr?.trim());

      if (isNaN(sLat) || isNaN(sLon) || isNaN(eLat) || isNaN(eLon)) {
        res.status(400).json({ error: "bad coordinate format (expected lat,lon)" });
        return;
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${sLon},${sLat};${eLon},${eLat}?overview=full&geometries=geojson&steps=false`;
      
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (r.ok) {
          const data = await r.json();
          if (data && data.routes && data.routes.length > 0) {
            geoCache.set(key, data, 1800); // 30 min cache
            res.setHeader("X-Cache", "MISS");
            res.json(data);
            return;
          }
        }
      } catch (osrmErr) {
        // Fall through to procedural route fallback
      }

      // Procedural routing fallback (reliable when offline or OSRM unavailable)
      const fallback = buildFallbackRoute(sLat, sLon, eLat, eLon);
      geoCache.set(key, fallback, 1800);
      res.json(fallback);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Map Tile Caching & Serving Endpoint (/api/tile/:z/:x/:y)
  app.get("/api/tile/:z/:x/:y", async (req: Request, res: Response) => {
    const { z, x, y } = req.params;
    const tileKey = `tile:${z}:${x}:${y}`;

    const cached = tileCache.get<Buffer>(tileKey);
    if (cached) {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      res.setHeader("X-Tile-Cache", "HIT");
      res.send(cached);
      return;
    }

    const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    try {
      const r = await fetchWithAgent(tileUrl);
      if (r.ok) {
        const arrayBuf = await r.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        tileCache.set(tileKey, buffer);
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        res.setHeader("X-Tile-Cache", "MISS");
        res.send(buffer);
        return;
      }
      // If OSM returns 4xx/5xx, redirect
      res.redirect(tileUrl);
    } catch {
      // Offline / network failure: redirect
      res.redirect(tileUrl);
    }
  });

  // 5. Nearby Hospitals Discovery Endpoint
  app.get("/api/nearby-hospitals", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat((req.query.lat as string) || "22.7533");
      const lon = parseFloat((req.query.lon as string) || "77.7291");
      const radiusKm = parseFloat((req.query.radius as string) || "50");

      const key = `nearby:${lat.toFixed(3)},${lon.toFixed(3)}:${radiusKm}`;
      const cached = geoCache.get(key);
      if (cached) {
        res.json(cached);
        return;
      }

      // Calculate distances for local known facilities
      const rankedFacilities = DISTRICT_HEALTH_FACILITIES.map((f) => {
        const distance = computeHaversineKm(lat, lon, f.latitude, f.longitude);
        const approxSpeed = f.type.includes("District") ? 45 : 35; // rural km/h
        const travelMins = Math.max(3, Math.round((distance / approxSpeed) * 60));
        return {
          ...f,
          distanceKm: parseFloat(distance.toFixed(1)),
          travelTimeMins: travelMins,
        };
      })
        .filter((f) => f.distanceKm <= radiusKm * 1.5)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      const responsePayload = {
        success: true,
        origin: { latitude: lat, longitude: lon },
        radiusKm,
        totalFound: rankedFacilities.length,
        facilities: rankedFacilities,
      };

      geoCache.set(key, responsePayload, 600);
      res.json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Live Location Telemetry Tracking API (Ambulance & CHW Real-Time Fleet)
  const activeTelemetryMap = new Map<string, any>();

  app.post("/api/telemetry/location", (req: Request, res: Response) => {
    try {
      const {
        caseId = "GENERAL-FLEET",
        latitude,
        longitude,
        speedKmH = 0,
        heading = 0,
        accuracyMeters = 10,
        status = "IN_TRANSIT",
        patientName,
        targetFacilityName,
      } = req.body;

      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: "latitude and longitude are required" });
        return;
      }

      const telemetryPoint = {
        caseId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speedKmH: Math.round(speedKmH),
        heading: Math.round(heading),
        accuracyMeters: Math.round(accuracyMeters),
        status,
        patientName: patientName || "Emergency Referral",
        targetFacilityName: targetFacilityName || "District Hospital",
        updatedAt: new Date().toISOString(),
      };

      activeTelemetryMap.set(caseId, telemetryPoint);

      // If associated with a case, update the case status
      const associatedCase = casesDatabase.find((c) => c.id === caseId);
      if (associatedCase) {
        associatedCase.status = "IN_TRANSIT";
      }

      res.json({ success: true, telemetry: telemetryPoint });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/telemetry/location/:caseId?", (req: Request, res: Response) => {
    const { caseId } = req.params;
    if (caseId) {
      const point = activeTelemetryMap.get(caseId);
      if (!point) {
        res.status(404).json({ success: false, error: "No active telemetry for this case" });
        return;
      }
      res.json({ success: true, telemetry: point });
      return;
    }

    // Return all active fleet telemetry points
    const allTelemetry = Array.from(activeTelemetryMap.values());
    res.json({ success: true, count: allTelemetry.length, vehicles: allTelemetry });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ArogyaSeva Clinical Decision Server running on port ${PORT}`);
  });
}

// Deterministic Helper Functions for Offline / Fallback
function extractNumberPattern(text: string, triggers: string[]): number | undefined {
  for (const trigger of triggers) {
    const reg = new RegExp(`${trigger}[\\s:=]*([0-9]{1,3})`, "i");
    const match = text.match(reg);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}

function extractTemp(text: string): number | undefined {
  const match = text.match(/([0-9]{2,3}(\.[0-9])?)\s*(?:°?f|fahrenheit|fever|temperature|तापमान)/i) ||
                text.match(/(?:temp|fever|बुखार|तापमान)[\\s:=]*([0-9]{2,3}(\.[0-9])?)/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (val >= 95 && val <= 108) return val;
  }
  return undefined;
}

function extractKeywords(text: string, list: string[]): string[] {
  const found: string[] = [];
  for (const k of list) {
    if (text.toLowerCase().includes(k.toLowerCase())) {
      const clean = k.charAt(0).toUpperCase() + k.slice(1);
      if (!found.includes(clean)) found.push(clean);
    }
  }
  return found.length > 0 ? found : ["General Malaise"];
}

function extractDuration(text: string): string | undefined {
  const match = text.match(/([0-9]+\s*(?:days?|दिन|weeks?|हफ्ते|months?|hours?|घंटे))/i);
  return match ? match[1] : undefined;
}

function extractConditions(text: string): string[] {
  const conds: string[] = [];
  if (/diabetes|शुगर|madhumeh/i.test(text)) conds.push("Diabetes");
  if (/hypertension|bp|blood pressure|उच्च रक्तचाप/i.test(text)) conds.push("Hypertension");
  if (/asthma|दमा|dama/i.test(text)) conds.push("Asthma");
  if (/tb|tuberculosis|टीबी/i.test(text)) conds.push("Tuberculosis");
  return conds;
}

function getRuleBasedFollowUps(data: any): any[] {
  const questions: any[] = [];
  const symptomsStr = (data.symptoms || []).join(" ").toLowerCase();

  if (symptomsStr.includes("fever") || symptomsStr.includes("cough") || symptomsStr.includes("breath")) {
    questions.push({
      id: "resp_1",
      question: "Is the patient experiencing chest indrawing or difficulty speaking full sentences?",
      hindiTranslation: "क्या मरीज की पसलियां चल रही हैं या बोलने में सांस फूल रही है?",
      options: ["Yes, severe", "Mild", "No"],
      dangerSignAnswer: "Yes, severe",
      dangerSignDescription: "Signs of respiratory muscle exhaustion / acute distress",
      vitalCheckPrompt: "Measure SpO2 using pulse oximeter immediately.",
      category: "RESPIRATORY"
    });
  }

  if (data.isPregnant) {
    questions.push({
      id: "obs_1",
      question: "Does the pregnant mother have severe headache, blurry vision, or epigastric pain?",
      hindiTranslation: "क्या गर्भवती महिला को तेज सिरदर्द, धुंधला दिखना या पेट के ऊपरी हिस्से में दर्द है?",
      options: ["Yes", "No"],
      dangerSignAnswer: "Yes",
      dangerSignDescription: "Impending Eclampsia / Preeclampsia Red Flag",
      vitalCheckPrompt: "Check Blood Pressure immediately. If Systolic >= 160 or Diastolic >= 110, it is an emergency.",
      category: "OBSTETRIC"
    });
  }

  if ((data.age && data.age < 5) || symptomsStr.includes("vomit") || symptomsStr.includes("diarrhea")) {
    questions.push({
      id: "ped_1",
      question: "Is the patient abnormally lethargic, unconscious, or unable to drink fluids?",
      hindiTranslation: "क्या मरीज/बच्चा बहुत सुस्त है, बेहोश हो रहा है या पानी नहीं पी पा रहा?",
      options: ["Yes, unable to drink / lethargic", "Drinks eagerly", "Normal"],
      dangerSignAnswer: "Yes, unable to drink / lethargic",
      dangerSignDescription: "Severe dehydration / Systemic sepsis warning sign",
      vitalCheckPrompt: "Check skin pinch on abdomen (does it go back very slowly > 2s?).",
      category: "PEDIATRIC"
    });
  }

  questions.push({
    id: "gen_1",
    question: "Are there any convulsions, fits, or stiff neck?",
    hindiTranslation: "क्या मरीज को झटके (दौरे) आ रहे हैं या गर्दन में अकड़न है?",
    options: ["Yes", "No"],
    dangerSignAnswer: "Yes",
    dangerSignDescription: "Central nervous system infection / severe cerebral malaria / meningitis alert",
    vitalCheckPrompt: "Assess capillary refill time on nail bed (< 2 seconds is normal).",
    category: "NEUROLOGICAL"
  });

  return questions;
}

function evaluateRuleBasedRisk(data: any): any {
  const dangerSigns: string[] = [];
  let score = 20;

  const v = data.vitals || {};
  if (v.spo2 && v.spo2 < 90) {
    dangerSigns.push(`Critical Hypoxia (SpO2 ${v.spo2}% is < 90%)`);
    score += 45;
  } else if (v.spo2 && v.spo2 < 94) {
    dangerSigns.push(`Mild Hypoxia (SpO2 ${v.spo2}% is 90-93%)`);
    score += 25;
  }

  if (v.bpSystolic && (v.bpSystolic >= 160 || (v.bpDiastolic && v.bpDiastolic >= 105))) {
    dangerSigns.push(`Severe Hypertensive Crisis (BP ${v.bpSystolic}/${v.bpDiastolic || "—"} mmHg)`);
    score += 40;
  }

  if (v.temperature && v.temperature >= 103) {
    dangerSigns.push(`Hyperpyrexia (Temperature ${v.temperature}°F >= 103°F)`);
    score += 25;
  }

  if (v.heartRate && (v.heartRate > 125 || v.heartRate < 50)) {
    dangerSigns.push(`Abnormal Heart Rate (${v.heartRate} bpm)`);
    score += 25;
  }

  // Follow-up answers
  if (data.followUpAnswers) {
    for (const [q, a] of Object.entries(data.followUpAnswers)) {
      if (typeof a === "string" && (a.toLowerCase().includes("yes") || a.toLowerCase().includes("severe"))) {
        dangerSigns.push(`Clinical warning sign affirmed: ${q}`);
        score += 25;
      }
    }
  }

  if (data.isPregnant && (score >= 40 || dangerSigns.length > 0)) {
    dangerSigns.push("High-Risk Pregnancy with acute warning signs");
    score += 20;
  }

  score = Math.min(100, score);
  let riskLevel: "ROUTINE" | "CONSULTATION" | "URGENT" = "ROUTINE";
  if (score >= 70 || dangerSigns.length >= 2 || (v.spo2 && v.spo2 < 90)) {
    riskLevel = "URGENT";
  } else if (score >= 40 || dangerSigns.length === 1) {
    riskLevel = "CONSULTATION";
  }

  return {
    riskLevel,
    riskScore: score,
    dangerSigns,
    clinicalImpression: riskLevel === "URGENT" ? "Acute Clinical Emergency requiring higher-level stabilization" : riskLevel === "CONSULTATION" ? "Moderate Severity Condition requiring Medical Officer Review" : "Mild / Routine Primary Healthcare Condition",
    primaryDiagnosisRationale: dangerSigns.length > 0 ? `Identified ${dangerSigns.length} critical clinical red flags.` : "Vitals and symptom presentation within manageable primary limits.",
    recommendedAction: riskLevel === "URGENT" ? "Immediate transfer to nearest CHC/District Hospital with 108 ambulance dispatch." : riskLevel === "CONSULTATION" ? "Schedule primary medical consultation with PHC Doctor within 24 hours." : "Provide standard ASHA home management guidance and scheduled follow-up.",
    requiredFacilityLevel: riskLevel === "URGENT" ? "Community Health Centre (CHC / FRU)" : riskLevel === "CONSULTATION" ? "Primary Health Centre (PHC)" : "Sub-Centre / HWC",
    fieldStabilizingActions: [
      "Keep patient in safe, well-ventilated posture",
      "Monitor vitals every 15-30 minutes",
      "Ensure patient hydration with oral sips if conscious",
      "Prepare referral slip and emergency contact phone"
    ],
    sbarSummary: {
      situation: `${data.age || "Unknown"}-year-old ${data.gender || "patient"} presenting with ${Array.isArray(data.symptoms) ? data.symptoms.join(", ") : "acute symptoms"}.`,
      background: `Assessed by ASHA ${data.chwName || "Worker"} in village ${data.village || "Sub-centre"}.`,
      assessment: `Risk Tier: ${riskLevel}. Danger Signs: ${dangerSigns.join("; ") || "None flagged."}`,
      recommendation: `Recommended triage action: ${riskLevel === "URGENT" ? "Emergency referral to secondary hospital" : "Routine clinical consultation"}.`
    }
  };
}

// Healthcare Facilities with precise GPS coordinates for mapping & routing
const DISTRICT_HEALTH_FACILITIES = [
  {
    id: "HWC-01",
    name: "Ayushman Arogya Mandir (Pipariya Sub-Centre)",
    type: "Sub-Centre / HWC",
    latitude: 22.7533,
    longitude: 77.7291,
    address: "Main Gram Panchayat Road, Pipariya Kalan",
    contactNumber: "+91 94251 00112",
    emergencyHotline: "108",
    hasOxygen: true,
    hasBloodBank: false,
    hasCSection: false,
    hasNICU: false,
    hasSnakeAntivenom: false,
    hasAmbulance24x7: false,
    availableBeds: 2,
    icuBedsAvailable: 0,
  },
  {
    id: "PHC-01",
    name: "Primary Health Centre - Bhimnagar 24x7",
    type: "Primary Health Centre (PHC)",
    latitude: 22.7812,
    longitude: 77.7654,
    address: "NH-46 Junction, Bhimnagar Block",
    contactNumber: "+91 7574 220199",
    emergencyHotline: "108 / 104",
    hasOxygen: true,
    hasBloodBank: false,
    hasCSection: false,
    hasNICU: false,
    hasSnakeAntivenom: true,
    hasAmbulance24x7: true,
    availableBeds: 6,
    icuBedsAvailable: 0,
  },
  {
    id: "CHC-01",
    name: "Community Health Centre & FRU - Rampur",
    type: "Community Health Centre (CHC / FRU)",
    latitude: 22.8421,
    longitude: 77.8512,
    address: "Civil Lines, Rampur Tehsil HQ",
    contactNumber: "+91 7574 244501",
    emergencyHotline: "108 / +91 7574 244500",
    hasOxygen: true,
    hasBloodBank: true,
    hasCSection: true,
    hasNICU: true,
    hasSnakeAntivenom: true,
    hasAmbulance24x7: true,
    availableBeds: 30,
    icuBedsAvailable: 4,
  },
  {
    id: "SDH-01",
    name: "Sub-District Hospital - Hoshangabad West",
    type: "Sub-District Hospital",
    latitude: 22.7521,
    longitude: 77.9211,
    address: "Station Road, Near Tehsil Complex",
    contactNumber: "+91 7574 288310",
    emergencyHotline: "108 / +91 7574 288300",
    hasOxygen: true,
    hasBloodBank: true,
    hasCSection: true,
    hasNICU: true,
    hasSnakeAntivenom: true,
    hasAmbulance24x7: true,
    availableBeds: 65,
    icuBedsAvailable: 8,
  },
  {
    id: "DH-01",
    name: "District Civil Hospital & Trauma Centre",
    type: "District Hospital & Trauma",
    latitude: 22.7489,
    longitude: 77.7289,
    address: "District Collectorate Road, Narmadapuram",
    contactNumber: "+91 7574 252200",
    emergencyHotline: "108 (24x7 Control Room: 07574-252201)",
    hasOxygen: true,
    hasBloodBank: true,
    hasCSection: true,
    hasNICU: true,
    hasSnakeAntivenom: true,
    hasAmbulance24x7: true,
    availableBeds: 250,
    icuBedsAvailable: 24,
  },
];

function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function searchLocalPlaces(q: string) {
  const query = q.toLowerCase();
  const matched = DISTRICT_HEALTH_FACILITIES.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.type.toLowerCase().includes(query) ||
      f.address.toLowerCase().includes(query)
  );

  if (matched.length > 0) {
    return matched.map((m) => ({
      place_id: m.id,
      lat: m.latitude.toString(),
      lon: m.longitude.toString(),
      display_name: `${m.name}, ${m.address}`,
      type: "hospital",
      importance: 0.9,
    }));
  }

  // Fallback generic points for rural district centers
  return [
    {
      place_id: "ramp-01",
      lat: "22.8421",
      lon: "77.8512",
      display_name: "Rampur Tehsil Health Block, District Hospital Network",
      type: "administrative",
      importance: 0.8,
    },
    {
      place_id: "bhim-01",
      lat: "22.7812",
      lon: "77.7654",
      display_name: "Bhimnagar Sector & Primary Health Centre",
      type: "administrative",
      importance: 0.75,
    },
    {
      place_id: "pip-01",
      lat: "22.7533",
      lon: "77.7291",
      display_name: "Pipariya Kalan Gram Panchayat Sub-Centre",
      type: "administrative",
      importance: 0.7,
    },
  ];
}

function buildFallbackRoute(sLat: number, sLon: number, eLat: number, eLon: number) {
  // Generates curved polyline coordinates connecting village to target hospital
  const coordinates: [number, number][] = [];
  const segments = 24;

  for (let i = 0; i <= segments; i++) {
    const fraction = i / segments;
    // Add realistic country road waviness
    const roadCurve = Math.sin(fraction * Math.PI) * 0.006;
    const lat = sLat + (eLat - sLat) * fraction + roadCurve;
    const lon = sLon + (eLon - sLon) * fraction + roadCurve * 0.75;
    coordinates.push([parseFloat(lon.toFixed(5)), parseFloat(lat.toFixed(5))]);
  }

  const directDist = computeHaversineKm(sLat, sLon, eLat, eLon);
  const roadDistKm = directDist * 1.28; // Rural road winding coefficient
  const durationSec = Math.max(300, Math.round((roadDistKm / 42) * 3600)); // 42 km/h rural transit speed

  return {
    code: "Ok",
    routes: [
      {
        geometry: {
          type: "LineString",
          coordinates,
        },
        distance: Math.round(roadDistKm * 1000),
        duration: durationSec,
        weight: durationSec,
        weight_name: "routability",
      },
    ],
    waypoints: [
      { location: [sLon, sLat], name: "Village Origin Point" },
      { location: [eLon, eLat], name: "Referred Healthcare Facility" },
    ],
  };
}

startServer();
