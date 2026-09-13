import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

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
  status: "PENDING_REVIEW" | "DOCTOR_REVIEWED" | "DISPATCHED" | "RESOLVED";
  doctorNotes?: string;
  doctorAction?: string;
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

  app.use(express.json({ limit: "10mb" }));

  // API Route: Health Check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      casesCount: casesDatabase.length,
      timestamp: new Date().toISOString(),
    });
  });

  // API Route: Get all cases
  app.get("/api/cases", (_req: Request, res: Response) => {
    res.json({
      success: true,
      cases: casesDatabase,
    });
  });

  // API Route: Create or Sync a case
  app.post("/api/cases", (req: Request, res: Response) => {
    const newCase = req.body as CaseRecord;
    if (!newCase.id) {
      newCase.id = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    newCase.syncedAt = new Date().toISOString();

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
      res.json({ success: true, data: parsed, source: "gemini_ai" });
    } catch (err: any) {
      console.error("Extraction error:", err);
      res.status(500).json({
        success: false,
        error: "Failed to extract symptoms",
        fallback: {
          age: 30,
          gender: "Male",
          symptoms: ["Fever", "Fatigue"],
          duration: "2 days",
          vitalsMentioned: {},
          isPregnant: false,
          chronicConditions: [],
          normalizedSummary: "Clinical input received."
        }
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
      res.json({ success: true, assessment, source: "gemini_ai" });
    } catch (err: any) {
      console.error("Risk assessment error:", err);
      const fallbackAssessment = evaluateRuleBasedRisk(req.body);
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

startServer();
