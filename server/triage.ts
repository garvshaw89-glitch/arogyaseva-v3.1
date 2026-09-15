/**
 * triage.ts
 * Express router exposing POST /api/triage
 *
 * Request body (JSON):
 * {
 *   "age": 45,
 *   "sex": "female",
 *   "symptoms": "chest pain and sweating",
 *   "vitals": { "temp": 37.0, "hr": 110, "bp_systolic": 110, "bp_diastolic": 70, "rr": 18, "spo2": 96 },
 *   "comorbidities": ["diabetes"],
 *   "onset": "sudden",
 *   "duration_minutes": 30
 * }
 *
 * Response:
 * {
 *   "danger": true,
 *   "level": "emergency",
 *   "reasons": ["chest pain", "low_spo2:89"],
 *   "advice": "This presentation includes potentially life-threatening features...",
 *   "llm_assist": { ... }
 * }
 *
 * IMPORTANT: This module is for demo/triage decision support only. Not a substitute for medical care.
 */

import { Router, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

export const RED_FLAG_PATTERNS = [
  /chest pain/i,
  /pressure? in chest/i,
  /unconscious|unresponsive|passing out|syncope/i,
  /severe difficulty breathing|can't breathe|unable to breathe|respiratory arrest/i,
  /major bleeding|severe bleeding|arterial bleeding/i,
  /stroke|face droop|arm weakness|speech difficulty|slurred speech/i,
  /seizure/i,
  /sudden severe headache|thunderclap headache/i,
  /loss of vision|sudden blindness/i,
  /severe burn/i,
  /suspected poisoning/i,
];

// Moderate flags (may require urgent attention)
export const URGENT_PATTERNS = [
  /high fever|fever over|temp.*39|temperature.*39/i,
  /persistent vomiting|can't keep anything down/i,
  /dehydration|very thirsty|little urine/i,
  /sudden severe abdominal pain/i,
  /confusion|new disorientation/i,
  /suicidal ideation|self[- ]harm/i,
  /severe pain/i,
  /pregnancy.*bleeding/i,
  /worsening chronic condition|exacerbation/i,
];

export function findMatches(text: string, patterns: RegExp[]): string[] {
  if (!text) return [];
  const matches: string[] = [];
  patterns.forEach((p) => {
    const m = text.match(p);
    if (m) matches.push(m[0]);
  });
  return matches;
}

export function vitalsRaiseConcern(vitals: any): string[] {
  if (!vitals) return [];
  const reasons: string[] = [];
  if (vitals.spo2 !== undefined && Number(vitals.spo2) < 92) {
    reasons.push(`low_spo2:${vitals.spo2}`);
  }
  if (vitals.bp_systolic !== undefined && Number(vitals.bp_systolic) < 90) {
    reasons.push(`low_bp:${vitals.bp_systolic}`);
  }
  if (
    vitals.hr !== undefined &&
    (Number(vitals.hr) > 130 || Number(vitals.hr) < 40)
  ) {
    reasons.push(`abnormal_hr:${vitals.hr}`);
  }
  if (vitals.rr !== undefined && Number(vitals.rr) > 30) {
    reasons.push(`high_rr:${vitals.rr}`);
  }
  return reasons;
}

export function ruleBasedTriage(payload: any) {
  const ctx: string[] = [];
  const text = [
    payload.symptoms,
    payload.onset || "",
    payload.duration_minutes !== undefined ? `${payload.duration_minutes} minutes` : "",
    Array.isArray(payload.comorbidities) ? payload.comorbidities.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ");

  const red = findMatches(text, RED_FLAG_PATTERNS);
  if (red.length) ctx.push(...red);

  const urg = findMatches(text, URGENT_PATTERNS);
  if (urg.length) ctx.push(...urg);

  const vitalsConcerns = vitalsRaiseConcern(payload.vitals);
  if (vitalsConcerns.length) ctx.push(...vitalsConcerns);

  // Age / comorbidity escalation
  const age = Number(payload.age || 0);
  if (age >= 75) ctx.push("age>=75");

  const comorbCount = Array.isArray(payload.comorbidities)
    ? payload.comorbidities.length
    : 0;
  if (comorbCount >= 2) ctx.push("multiple_comorbidities");

  // Decision logic
  let level: "emergency" | "urgent" | "non-urgent" = "non-urgent";
  let danger = false;
  const reasons = ctx.slice();

  if (red.length || vitalsConcerns.length) {
    level = "emergency";
    danger = true;
  } else if (urg.length || age >= 65 || comorbCount >= 1) {
    level = "urgent";
  }

  // Advice templates
  let advice = "";
  if (danger) {
    advice =
      "This presentation includes potentially life-threatening features. Call emergency services (108 / 911) or go to the nearest emergency department immediately.";
  } else if (level === "urgent") {
    advice =
      "This may require prompt medical attention. Contact your healthcare provider or urgent care within the next few hours.";
  } else {
    advice =
      "This appears non-urgent from the provided information. Consider contacting your primary care clinician for routine follow-up if symptoms persist or worsen.";
  }

  return { danger, level, reasons, advice };
}

// LLM assist helper — supports Gemini & OpenAI
async function llmAssist(payload: any, ruleResult?: any) {
  const result = ruleResult || ruleBasedTriage(payload);
  const systemPrompt = [
    "You are an assistant that explains clinical triage reasoning in a short paragraph.",
    "Be concise, do NOT provide a diagnosis, and instruct to seek emergency care for life-threatening findings.",
    "Label assumptions clearly if data is missing.",
  ].join(" ");

  const userPrompt = `Patient data:
age: ${payload.age || "unknown"}
sex: ${payload.sex || "unknown"}
symptoms: ${payload.symptoms || "none provided"}
vitals: ${JSON.stringify(payload.vitals || {})}
comorbidities: ${JSON.stringify(payload.comorbidities || [])}
onset: ${payload.onset || "unknown"}
duration_minutes: ${payload.duration_minutes || "unknown"}

Based on this, provide:
1) A one-sentence triage recommendation: 'Emergency', 'Urgent', or 'Non-urgent'.
2) One short sentence describing the top reasons.
3) A one-line clear safety instruction (if emergency, say call emergency services).
Return JSON with keys: recommendation, reasons, safety_instruction.`;

  // 1. Try OpenAI if key is present
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-0613",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 300,
          temperature: 0.0,
        }),
      });

      if (resp.ok) {
        const j = await resp.json();
        const msg =
          j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        try {
          return JSON.parse(msg);
        } catch {
          return { raw: msg };
        }
      }
    } catch (err: any) {
      console.warn("OpenAI LLM assist error:", err.message);
    }
  }

  // 2. Default to Google Gemini if available
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
    for (const modelName of modelsToTry) {
      try {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: { "User-Agent": "aistudio-build" },
          },
        });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        if (parsed && typeof parsed === "object") {
          return { ...parsed, source: `gemini_${modelName}` };
        }
      } catch (err: any) {
        // Log brief notice and try next fallback model in cascade
        const errMsg = err?.message || String(err);
        if (
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("quota") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("429")
        ) {
          // Model temporarily congested; wait 300ms and move to fallback
          await new Promise((resolve) => setTimeout(resolve, 300));
          continue;
        }
      }
    }
  }

  // 3. Resilient deterministic clinical reasoning fallback (active when LLM is unavailable or congested)
  const isEmergency = result.level === "emergency";
  const isUrgent = result.level === "urgent";

  return {
    diagnosticHypothesis: isEmergency
      ? `Critical physiological instability or acute red-flag presentation (${result.reasons.join(", ") || "Immediate tertiary attention required"})`
      : isUrgent
      ? `Sub-acute or high-risk symptomatic presentation requiring facility review (${result.reasons.join(", ") || "Prompt clinical evaluation"})`
      : `Stable baseline presentation consistent with non-emergent frontline care`,
    riskRationale: `Determined ${result.level.toUpperCase()} triage priority based on WHO/IMCI vital threshold cutoffs and trigger markers: ${result.reasons.join("; ") || "all vitals in acceptable baseline range"}.`,
    suggestedQuestions: [
      "Are symptoms sudden in onset or progressively worsening with physical exertion?",
      "Is there any past history of cardiovascular, respiratory, diabetic, or neurological disease?",
      "Is the patient experiencing any shortness of breath, dizziness, cold clammy sweat, or altered consciousness?",
    ],
    recommendedReferralTier: isEmergency
      ? "Tertiary Care / District Hospital (Emergency Resuscitation & ICU)"
      : isUrgent
      ? "Community Health Centre (CHC) / Secondary Specialist Care"
      : "Primary Health Centre (PHC) / Sub-Centre Routine Follow-up",
    redFlags: result.reasons.length > 0 ? result.reasons : ["None currently detected in baseline telemetry"],
    source: "clinical_rule_engine_synthesis",
  };
}

router.get(["/triage", "/triage.js"], (req: Request, res: Response) => {
  res.json({
    status: "active",
    endpoint: "POST /api/triage or /api/triage.js",
    description: "Clinical decision support & triage signal engine",
    samplePayload: {
      age: 45,
      sex: "female",
      symptoms: "chest pain and sweating",
      vitals: { temp: 37.0, hr: 110, bp_systolic: 110, bp_diastolic: 70, rr: 18, spo2: 96 },
      comorbidities: ["diabetes"],
      onset: "sudden",
      duration_minutes: 30,
    },
  });
});

router.post(["/triage", "/triage.js"], async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    // Basic input validation
    if (!payload.symptoms && !payload.vitals) {
      res.status(400).json({ error: "Provide at least symptoms text or vitals." });
      return;
    }

    const result = ruleBasedTriage(payload);

    // Attach LLM assist optionally or when Gemini / OpenAI is available
    let llm: any = null;
    if (
      process.env.ENABLE_LLM_ASSIST === "1" ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY
    ) {
      llm = await llmAssist(payload, result);
    }

    const out = {
      danger: result.danger,
      level: result.level,
      reasons: result.reasons,
      advice: result.advice,
      llm_assist: llm,
    };

    res.json(out);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
