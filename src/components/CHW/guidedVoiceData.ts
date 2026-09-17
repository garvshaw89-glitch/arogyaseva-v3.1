import { SupportedLanguage } from "../../types";

export type GuidedVoiceStepId = "age" | "fever_temp" | "duration" | "gender" | "problem_details";

export interface GuidedStepDefinition {
  id: GuidedVoiceStepId;
  stepNumber: number;
  labelEn: string;
  labelHi: string;
  questionEn: string;
  questionHi: string;
  promptVoiceEn: string;
  promptVoiceHi: string;
  instructionEn: string;
  instructionHi: string;
  field: "age" | "temperature" | "duration" | "gender" | "problemDetails";
  chips: Array<{
    label: string;
    value: any;
    spokenText?: string;
  }>;
}

export interface GuidedVoiceAnswers {
  age: number | null;
  hasFever: boolean | null;
  temperature: number | null;
  duration: string;
  gender: "Male" | "Female" | "Other" | null;
  problemDetails: string;
}

export const GUIDED_STEPS: GuidedStepDefinition[] = [
  {
    id: "age",
    stepNumber: 1,
    labelEn: "1. Patient Age",
    labelHi: "१. मरीज की उम्र",
    questionEn: "What is the patient's age?",
    questionHi: "मरीज की उम्र कितनी है? (कृपया उम्र बताएं)",
    promptVoiceEn: "What is the patient's age?",
    promptVoiceHi: "मरीज की उम्र कितनी है? कृपया उम्र बताएं।",
    instructionEn: "Speak age in years or select a quick option (e.g., '45 years old')",
    instructionHi: "उम्र बोलें या विकल्प चुनें (जैसे '45 साल')",
    field: "age",
    chips: [
      { label: "18 Yrs", value: 18, spokenText: "18 years old" },
      { label: "25 Yrs", value: 25, spokenText: "25 years old" },
      { label: "35 Yrs", value: 35, spokenText: "35 years old" },
      { label: "45 Yrs", value: 45, spokenText: "45 years old" },
      { label: "52 Yrs", value: 52, spokenText: "52 years old" },
      { label: "65 Yrs", value: 65, spokenText: "65 years old" },
    ],
  },
  {
    id: "fever_temp",
    stepNumber: 2,
    labelEn: "2. Fever & Body Temperature",
    labelHi: "२. बुखार व शरीर का तापमान",
    questionEn: "Does the patient have a fever? If yes, what is the body temperature?",
    questionHi: "क्या मरीज को बुखार है? यदि हाँ, तो शरीर का तापमान कितना है?",
    promptVoiceEn: "Does the patient have a fever? If yes, what is the body temperature?",
    promptVoiceHi: "क्या मरीज को बुखार है? यदि हाँ, तो तापमान कितना है?",
    instructionEn: "State fever status and degrees (e.g., 'Yes, 102 degrees' or 'No fever, normal 98.6')",
    instructionHi: "बुखार व तापमान बोलें (जैसे 'हाँ, 102 डिग्री' या 'बुखार नहीं है')",
    field: "temperature",
    chips: [
      { label: "No Fever (98.6°F)", value: { hasFever: false, temp: 98.6 }, spokenText: "No fever, body temperature is 98.6" },
      { label: "Mild Fever (100.4°F)", value: { hasFever: true, temp: 100.4 }, spokenText: "Mild fever, 100.4 degrees" },
      { label: "High Fever (102.0°F)", value: { hasFever: true, temp: 102.0 }, spokenText: "High fever, 102 degrees" },
      { label: "Critical High (104.0°F)", value: { hasFever: true, temp: 104.0 }, spokenText: "Very high fever, 104 degrees" },
    ],
  },
  {
    id: "duration",
    stepNumber: 3,
    labelEn: "3. Symptom Duration",
    labelHi: "३. समस्या की अवधि",
    questionEn: "How long has the patient had these symptoms or problem?",
    questionHi: "यह समस्या या तकलीफ कितने समय अथवा दिनों से है?",
    promptVoiceEn: "How long has the patient had these symptoms or problem?",
    promptVoiceHi: "यह समस्या कितने दिनों से है?",
    instructionEn: "Speak duration in days or hours (e.g., 'Since yesterday', '3 days', '1 week')",
    instructionHi: "अवधि बोलें (जैसे 'कल से', '3 दिन', '1 हफ्ता')",
    field: "duration",
    chips: [
      { label: "Since Today (6h)", value: "Since today (6 hrs)", spokenText: "Started today about 6 hours ago" },
      { label: "1-2 Days", value: "2 days", spokenText: "Symptoms present for 2 days" },
      { label: "3-5 Days", value: "3 days", spokenText: "Symptoms present for 3 days" },
      { label: "1-2 Weeks", value: "1-2 weeks", spokenText: "Symptoms present for 1 to 2 weeks" },
      { label: "Chronic (>1 Mo)", value: "> 1 month", spokenText: "Chronic condition for over one month" },
    ],
  },
  {
    id: "gender",
    stepNumber: 4,
    labelEn: "4. Gender",
    labelHi: "४. मरीज का लिंग",
    questionEn: "What is the patient's gender?",
    questionHi: "मरीज का लिंग क्या है? (महिला, पुरुष या अन्य)",
    promptVoiceEn: "What is the patient's gender?",
    promptVoiceHi: "मरीज का लिंग क्या है? महिला या पुरुष?",
    instructionEn: "Speak Female, Male, or Other (e.g., 'Female patient')",
    instructionHi: "लिंग बताएं: महिला, पुरुष या अन्य",
    field: "gender",
    chips: [
      { label: "Female (महिला)", value: "Female", spokenText: "Female patient" },
      { label: "Male (पुरुष)", value: "Male", spokenText: "Male patient" },
      { label: "Other (अन्य)", value: "Other", spokenText: "Other" },
    ],
  },
  {
    id: "problem_details",
    stepNumber: 5,
    labelEn: "5. Details of the Problem",
    labelHi: "५. समस्या का पूरा विवरण",
    questionEn: "Now, please tell all the details of what problem the patient is facing.",
    questionHi: "अब मरीज की पूरी समस्या, लक्षण और तकलीफ का विस्तार से विवरण बताएं।",
    promptVoiceEn: "Now, please tell all the details of what problem the patient is facing.",
    promptVoiceHi: "अब मरीज की पूरी समस्या और सभी लक्षणों का विस्तार से विवरण बताएं।",
    instructionEn: "Describe all complaints, pain location, difficulty breathing, cough, vomiting, etc.",
    instructionHi: "सभी लक्षण, दर्द, सांस की तकलीफ, उल्टी, दस्त आदि खुलकर बोलें",
    field: "problemDetails",
    chips: [
      {
        label: "Severe Breathlessness & Chest Pain",
        value: "Severe breathlessness, chest tightness, and difficulty speaking in full sentences",
        spokenText: "Severe breathlessness, chest tightness, and difficulty speaking in full sentences",
      },
      {
        label: "Watery Diarrhea & Repeated Vomiting",
        value: "Acute watery diarrhea, persistent vomiting, sunken eyes, and extreme weakness",
        spokenText: "Acute watery diarrhea, persistent vomiting, sunken eyes, and extreme weakness",
      },
      {
        label: "Severe Throbbing Headache & Blurry Vision",
        value: "Severe throbbing headache, blurred vision, dizziness, and facial puffiness",
        spokenText: "Severe throbbing headache, blurred vision, dizziness, and facial puffiness",
      },
      {
        label: "Chills, Body Ache & Productive Cough",
        value: "High fever with shaking chills, intense muscle pain, and thick chest cough",
        spokenText: "High fever with shaking chills, intense muscle pain, and thick chest cough",
      },
    ],
  },
];

// Parser utilities for each individual guided step
export function parseAgeFromText(text: string): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Match digits with optional units
  const digitMatch = lower.match(/(?:age\s*(?:is)?\s*)?(\d{1,3})\s*(?:years?|saal|sal|वर्ष|yr|months?|mahine)?/i);
  if (digitMatch) {
    const val = parseInt(digitMatch[1], 10);
    if (val >= 0 && val <= 125) return val;
  }

  // Common spoken word numbers
  const numberWords: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, "twenty five": 25, thirty: 30, "thirty five": 35,
    forty: 40, "forty five": 45, fifty: 50, "fifty two": 52, "fifty five": 55, sixty: 60,
    "sixty five": 65, seventy: 70, eighty: 80,
    बीस: 20, पच्चीस: 25, तीस: 30, पैंतीस: 35, चालीस: 40, पैंतालीस: 45, पचास: 50, बावन: 52, साठ: 60,
  };

  for (const [word, val] of Object.entries(numberWords)) {
    if (lower.includes(word)) return val;
  }

  return null;
}

export function parseFeverTempFromText(text: string): { hasFever: boolean; temperature: number } | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Explicit no fever
  if (
    lower.includes("no fever") ||
    lower.includes("no temp") ||
    lower.includes("normal") ||
    lower.includes("bukhar nahi") ||
    lower.includes("nahi hai") ||
    lower.includes("नहीं है")
  ) {
    return { hasFever: false, temperature: 98.6 };
  }

  // Look for temperature digits like 102, 101.4, 99.5, 98.6
  const tempMatch = lower.match(/(?:10[0-5]|9[6-9])(?:\.[0-9])?/);
  if (tempMatch) {
    const temp = parseFloat(tempMatch[0]);
    return { hasFever: temp > 99.5, temperature: temp };
  }

  // Verbal fever confirmation without exact number
  if (
    lower.includes("high fever") ||
    lower.includes("tez bukhar") ||
    lower.includes("तेज बुखार") ||
    lower.includes("hot") ||
    lower.includes("burning")
  ) {
    return { hasFever: true, temperature: 102.0 };
  }

  if (
    lower.includes("fever") ||
    lower.includes("bukhar") ||
    lower.includes("ताप") ||
    lower.includes("yes") ||
    lower.includes("हाँ")
  ) {
    return { hasFever: true, temperature: 101.2 };
  }

  return null;
}

export function parseDurationFromText(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (lower.includes("today") || lower.includes("aaj") || lower.includes("आज")) {
    return "Since today (6 hrs)";
  }
  if (lower.includes("yesterday") || lower.includes("kal se") || lower.includes("कल से")) {
    return "Since yesterday (24 hrs)";
  }

  const durationMatch = lower.match(/(\d+)\s*(days?|din|दिन|hours?|ghante|घंटे|weeks?|hafte|हफ्ते|months?|mahine|महीने)/i);
  if (durationMatch) {
    const num = durationMatch[1];
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith("day") || unit === "din" || unit === "दिन") return `${num} days`;
    if (unit.startsWith("hour") || unit === "ghante" || unit === "घंटे") return `${num} hours`;
    if (unit.startsWith("week") || unit === "hafte" || unit === "हफ्ते") return `${num} weeks`;
    if (unit.startsWith("month") || unit === "mahine" || unit === "महीने") return `${num} months`;
  }

  if (lower.includes("three") || lower.includes("teen") || lower.includes("तीन")) return "3 days";
  if (lower.includes("two") || lower.includes("do") || lower.includes("दो")) return "2 days";
  if (lower.includes("one week") || lower.includes("ek hafta") || lower.includes("एक हफ्ता")) return "1 week";

  return null;
}

export function parseGenderFromText(text: string): "Male" | "Female" | "Other" | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (
    lower.includes("female") ||
    lower.includes("woman") ||
    lower.includes("girl") ||
    lower.includes("mahila") ||
    lower.includes("महिला") ||
    lower.includes("aurat") ||
    lower.includes("stri") ||
    lower.includes("ladki") ||
    lower.includes("stree") ||
    lower.includes("pregnant") ||
    lower.includes("गर्भवती")
  ) {
    return "Female";
  }

  if (
    lower.includes("male") ||
    lower.includes("man") ||
    lower.includes("boy") ||
    lower.includes("purush") ||
    lower.includes("पुरुष") ||
    lower.includes("aadmi") ||
    lower.includes("ladka")
  ) {
    return "Male";
  }

  if (lower.includes("other") || lower.includes("transgender") || lower.includes("अन्य")) {
    return "Other";
  }

  return null;
}

export function extractSymptomsFromProblemText(text: string): string[] {
  if (!text) return ["General Malaise"];
  const lower = text.toLowerCase();
  const symptoms: string[] = [];

  if (/fever|bukhar|बुखार|ताप/i.test(lower)) symptoms.push("High Fever");
  if (/breath|saans|सांस|dyspnea|shortness|suffocat/i.test(lower)) symptoms.push("Difficulty Breathing / Dyspnea");
  if (/cough|khasi|खांसी/i.test(lower)) symptoms.push("Severe Cough");
  if (/headache|sirdard|सिरदर्द|head pain/i.test(lower)) symptoms.push("Severe Headache");
  if (/chest|chhati|सीने|angina/i.test(lower)) symptoms.push("Chest Pain / Tightness");
  if (/vomit|ulti|उल्टी/i.test(lower)) symptoms.push("Persistent Vomiting");
  if (/diarrhea|dast|दस्त|loose motion/i.test(lower)) symptoms.push("Watery Diarrhea");
  if (/blurred|dizziness|chakkar|चक्कर|faint|unconscious/i.test(lower)) symptoms.push("Dizziness / Blurred Vision");
  if (/abdomen|pet|stomach|पेट दर्द/i.test(lower)) symptoms.push("Severe Abdominal Pain");
  if (/swelling|sujan|सूजन|edema/i.test(lower)) symptoms.push("Pedal Edema / Swelling");
  if (/snake|saamp|सांप/i.test(lower)) symptoms.push("Snakebite Envenomation");
  if (/bleeding|khoon|रक्त|खून/i.test(lower)) symptoms.push("Acute Hemorrhage / Bleeding");
  if (/seizure|convulsion|daura|दौरा/i.test(lower)) symptoms.push("Convulsions / Seizures");

  if (symptoms.length === 0) {
    symptoms.push("Reported Acute Symptom");
  }

  return Array.from(new Set(symptoms));
}
