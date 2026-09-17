/**
 * Client-side integration for the Healthcare AI API (FastAPI + Ollama llama3.2 & fallback).
 * Matches the user-provided API contract:
 * POST /api/healthcare/ask
 * {
 *   "question": string,
 *   "patient_context": string | null
 * }
 * => {
 *   "answer": string,
 *   "warning": string
 * }
 */

export interface HealthRequest {
  question: string;
  patient_context?: string | null;
}

export interface HealthResponse {
  answer: string;
  warning: string;
  provider?: string;
}

export interface VoiceToStructuredResult {
  healthcareAi: HealthResponse;
  extracted: {
    age?: number;
    gender?: "Male" | "Female" | "Other";
    symptoms: string[];
    symptomDuration: string;
    temperature?: number;
    vitalsMentioned?: {
      temperature?: number;
      spo2?: number;
      bpSystolic?: number;
      bpDiastolic?: number;
      heartRate?: number;
      respiratoryRate?: number;
    };
    isPregnant?: boolean;
    urgentRedFlagsMentioned?: string[];
    rawText: string;
  };
}

// Default to server-side proxy route /api/healthcare/ask, which forwards to Ollama/FastAPI or handles fallback
const DEFAULT_API_ENDPOINT = "/api/healthcare/ask";
const LOCAL_FASTAPI_ENDPOINT = "http://localhost:8000/api/healthcare/ask";

export function getCustomHealthcareApiUrl(): string {
  try {
    return localStorage.getItem("healthcare_ai_api_url") || DEFAULT_API_ENDPOINT;
  } catch {
    return DEFAULT_API_ENDPOINT;
  }
}

export function setCustomHealthcareApiUrl(url: string) {
  try {
    localStorage.setItem("healthcare_ai_api_url", url);
  } catch {
    // ignore
  }
}

/**
 * askHealthcareAI: Core function as specified in user's app.js
 */
export async function askHealthcareAI(
  question: string,
  patientContext: string = ""
): Promise<HealthResponse> {
  const primaryUrl = getCustomHealthcareApiUrl();

  // Helper to make the POST request
  const makeRequest = async (url: string) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        patient_context: patientContext || null,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as HealthResponse;
  };

  try {
    return await makeRequest(primaryUrl);
  } catch (err: any) {
    // If user configured a custom URL (e.g. localhost:8000) that is currently offline,
    // fallback gracefully to our integrated /api/healthcare/ask endpoint
    if (primaryUrl !== DEFAULT_API_ENDPOINT) {
      console.warn(`Primary endpoint ${primaryUrl} failed (${err?.message}), failing over to /api/healthcare/ask`);
      return await makeRequest(DEFAULT_API_ENDPOINT);
    }
    throw err;
  }
}

/**
 * Check health status of the Healthcare AI API
 */
export async function checkHealthcareAiHealth(customUrl?: string): Promise<{ status: string; provider?: string }> {
  const baseUrl = customUrl || getCustomHealthcareApiUrl();
  const healthEndpoint = baseUrl.replace(/\/api\/healthcare\/ask\/?$/, "/health").replace(/\/ask\/?$/, "/health");

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(healthEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Try root /health on same origin
  }

  try {
    const res = await fetch("/health");
    if (res.ok) return await res.json();
  } catch {
    // ignore
  }

  return { status: "fallback_ready", provider: "internal" };
}

/**
 * convertVoiceToStructuredData
 * Uses the Healthcare AI API to interpret conversational voice and extract
 * clinical context, safety warning, and structured patient fields.
 */
export async function convertVoiceToStructuredData(
  spokenText: string,
  patientContext: string = ""
): Promise<VoiceToStructuredResult> {
  if (!spokenText || !spokenText.trim()) {
    throw new Error("Spoken voice text is required");
  }

  // 1. Call /api/healthcare/voice-to-structured on our server
  try {
    const response = await fetch("/api/healthcare/voice-to-structured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spoken_text: spokenText,
        patient_context: patientContext,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        return {
          healthcareAi: {
            answer: result.data.answer,
            warning: result.data.warning,
            provider: result.data.provider,
          },
          extracted: {
            age: result.data.age,
            gender: result.data.gender,
            symptoms: result.data.symptoms || [],
            symptomDuration: result.data.duration || "2 days",
            temperature: result.data.vitalsMentioned?.temperature,
            vitalsMentioned: result.data.vitalsMentioned,
            isPregnant: result.data.isPregnant,
            urgentRedFlagsMentioned: result.data.urgentRedFlagsMentioned || [],
            rawText: spokenText,
          },
        };
      }
    }
  } catch (err) {
    console.warn("Server-side voice-to-structured failed, falling back to direct askHealthcareAI:", err);
  }

  // 2. Client-side fallback pairing askHealthcareAI with rule extraction
  const aiResponse = await askHealthcareAI(
    `Summarize patient symptoms and urgency from this spoken narrative: "${spokenText}"`,
    patientContext
  );

  // Local extraction rule
  const lower = spokenText.toLowerCase();
  const ageMatch = lower.match(/(\d+)\s*(?:years?|saal|sal|वर्ष|month|months)/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : 35;
  const isFemale = /female|woman|girl|mahila|महिला|गर्भवती|स्त्री/i.test(spokenText);
  const isPregnant = /pregnant|गर्भवती|गर्भ/i.test(spokenText);

  const symptoms: string[] = [];
  if (/fever|बुखार|ताप/i.test(spokenText)) symptoms.push("High Fever");
  if (/breath|सांस|cough|खांसी|dyspnea/i.test(spokenText)) symptoms.push("Difficulty Breathing / Dyspnea");
  if (/headache|सिरदर्द/i.test(spokenText)) symptoms.push("Severe Headache");
  if (/vomit|उल्टी/i.test(spokenText)) symptoms.push("Persistent Vomiting");
  if (/diarrhea|दस्त/i.test(spokenText)) symptoms.push("Watery Diarrhea");
  if (/chest|सीने/i.test(spokenText)) symptoms.push("Chest Pain");
  if (/snake|सांप/i.test(spokenText)) symptoms.push("Snakebite");

  let temp = 98.6;
  const tempMatch = lower.match(/(?:10[0-5]|9[7-9])(?:\.\d+)?/);
  if (tempMatch) {
    temp = parseFloat(tempMatch[0]);
  } else if (/fever|बुखार/i.test(spokenText)) {
    temp = 102.0;
  }

  return {
    healthcareAi: aiResponse,
    extracted: {
      age,
      gender: isFemale ? "Female" : "Male",
      symptoms: symptoms.length > 0 ? symptoms : ["Acute Symptoms Reported"],
      symptomDuration: /three|3\s*day/i.test(spokenText) ? "3 days" : "2 days",
      temperature: temp,
      isPregnant,
      rawText: spokenText,
    },
  };
}
