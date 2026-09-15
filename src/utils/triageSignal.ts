import { TriagePayload, TriageSignalResult } from "../types";

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

export function clientRuleBasedTriage(payload: TriagePayload): TriageSignalResult {
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

  const age = Number(payload.age || 0);
  if (age >= 75) ctx.push("age>=75");

  const comorbCount = Array.isArray(payload.comorbidities)
    ? payload.comorbidities.length
    : 0;
  if (comorbCount >= 2) ctx.push("multiple_comorbidities");

  let level: "emergency" | "urgent" | "non-urgent" = "non-urgent";
  let danger = false;
  const reasons = ctx.slice();

  if (red.length || vitalsConcerns.length) {
    level = "emergency";
    danger = true;
  } else if (urg.length || age >= 65 || comorbCount >= 1) {
    level = "urgent";
  }

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

/**
 * Call the POST /api/triage.js (or /api/triage) API endpoint with offline resilient fallback
 */
export async function callTriageApi(
  payload: TriagePayload,
  preferredEndpoint = "/api/triage.js"
): Promise<TriageSignalResult> {
  const endpoints = [preferredEndpoint, "/api/triage", "/triage.js"];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        return data as TriageSignalResult;
      }
    } catch {
      // Continue to next endpoint or client fallback
    }
  }

  return clientRuleBasedTriage(payload);
}
