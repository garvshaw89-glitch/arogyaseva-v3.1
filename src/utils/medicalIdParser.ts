import { PatientCase, ScannedMedicalIdData } from "../types";

/**
 * Standard formats supported by National Health Authority (ABDM / ABHA),
 * ArogyaSeva Clinical Network, and frontline rural health registers.
 */

export interface SampleMedicalCard {
  id: string;
  cardTitle: string;
  scheme: "ABHA" | "NHM" | "RCH" | "AROGYASEVA";
  badgeColor: string;
  patientName: string;
  abhaId: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  village: string;
  district?: string;
  state?: string;
  contactNumber: string;
  bloodGroup: string;
  isPregnant?: boolean;
  pregnancyWeeks?: number;
  chronicConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  emergencyContact?: string;
  payloadString: string;
}

export const SAMPLE_MEDICAL_CARDS: SampleMedicalCard[] = [
  {
    id: "card-abha-sunita",
    cardTitle: "Ayushman Bharat National Health ID (ABHA)",
    scheme: "ABHA",
    badgeColor: "emerald",
    patientName: "Sunita Devi",
    abhaId: "91-4492-8172-5501",
    age: 29,
    gender: "Female",
    village: "Rampur Kalan",
    district: "Varanasi",
    state: "Uttar Pradesh",
    contactNumber: "+91 98765 43210",
    bloodGroup: "B+",
    isPregnant: true,
    pregnancyWeeks: 32,
    chronicConditions: ["Gestational Hypertension"],
    currentMedications: ["Labetalol 100mg", "Iron & Folic Acid"],
    allergies: ["Penicillin"],
    emergencyContact: "Rameshwar (Husband) - 98765 43211",
    payloadString: JSON.stringify({
      schema: "NHA_ABHA_V2",
      abhaNumber: "91-4492-8172-5501",
      abhaAddress: "sunitadevi@abdm",
      name: "Sunita Devi",
      gender: "F",
      yearOfBirth: "1997",
      age: 29,
      mobile: "+91 98765 43210",
      address: "Rampur Kalan, Varanasi, Uttar Pradesh",
      village: "Rampur Kalan",
      bloodGroup: "B+",
      isPregnant: true,
      pregnancyWeeks: 32,
      chronicConditions: ["Gestational Hypertension"],
      allergies: ["Penicillin"],
      emergencyContact: "+91 98765 43211",
    }),
  },
  {
    id: "card-nhm-rameshwar",
    cardTitle: "National Health Mission - Senior Rural Health Card",
    scheme: "NHM",
    badgeColor: "blue",
    patientName: "Rameshwar Patel",
    abhaId: "91-7712-4091-8834",
    age: 64,
    gender: "Male",
    village: "Badaun Khurd",
    district: "Bareilly",
    state: "Uttar Pradesh",
    contactNumber: "+91 94123 78901",
    bloodGroup: "O+",
    chronicConditions: ["Type 2 Diabetes Mellitus", "COPD / Chronic Bronchitis"],
    currentMedications: ["Metformin 500mg BD", "Salbutamol Inhaler PRN"],
    allergies: ["Sulfa Antibiotics"],
    emergencyContact: "Virendra Patel (Son) - 94123 78902",
    payloadString: JSON.stringify({
      schema: "NHM_STATE_HEALTH_CARD",
      abhaId: "91-7712-4091-8834",
      patientName: "Rameshwar Patel",
      age: 64,
      gender: "Male",
      village: "Badaun Khurd",
      district: "Bareilly",
      contactNumber: "+91 94123 78901",
      bloodGroup: "O+",
      chronicConditions: ["Type 2 Diabetes Mellitus", "COPD / Chronic Bronchitis"],
      currentMedications: ["Metformin 500mg BD", "Salbutamol Inhaler PRN"],
      allergies: ["Sulfa Antibiotics"],
      emergencyContact: "+91 94123 78902",
    }),
  },
  {
    id: "card-rch-priyanka",
    cardTitle: "Reproductive & Child Health (RCH) Maternal Card",
    scheme: "RCH",
    badgeColor: "rose",
    patientName: "Priyanka Kumari",
    abhaId: "91-8833-2211-4567",
    age: 24,
    gender: "Female",
    village: "Mehrauli Dehat",
    district: "Patna",
    state: "Bihar",
    contactNumber: "+91 98112 33445",
    bloodGroup: "A+",
    isPregnant: true,
    pregnancyWeeks: 34,
    chronicConditions: ["Previous Preeclampsia Risk", "Mild Anemia (Hb 9.8)"],
    currentMedications: ["Calcium 500mg", "IFA Tablets"],
    allergies: ["None known"],
    emergencyContact: "Manoj Kumar (Husband) - 98112 33446",
    payloadString: [
      "SCHEME: RCH_MATERNAL_TRACKING",
      "ABHA: 91-8833-2211-4567",
      "NAME: Priyanka Kumari",
      "AGE: 24",
      "GENDER: Female",
      "PREGNANT: YES (34 WEEKS)",
      "VILLAGE: Mehrauli Dehat",
      "PHONE: +91 98112 33445",
      "BLOOD_GROUP: A+",
      "CONDITIONS: Mild Anemia, Previous Preeclampsia",
      "EMERGENCY: +91 98112 33446",
    ].join("\n"),
  },
  {
    id: "card-arogya-devendra",
    cardTitle: "ArogyaSeva Frontline Sub-Centre Digital Card",
    scheme: "AROGYASEVA",
    badgeColor: "cyan",
    patientName: "Devendra Singh",
    abhaId: "91-1029-3847-5612",
    age: 45,
    gender: "Male",
    village: "Sonpur Chauraha",
    district: "Saran",
    state: "Bihar",
    contactNumber: "+91 93541 22987",
    bloodGroup: "AB+",
    chronicConditions: ["Hypertension", "Chronic Wheezing"],
    currentMedications: ["Amlodipine 5mg OD"],
    allergies: ["Aspirin / NSAIDs"],
    emergencyContact: "Sunil Singh (Brother) - 93541 22988",
    payloadString: JSON.stringify({
      app: "ArogyaSeva",
      patientName: "Devendra Singh",
      age: 45,
      gender: "Male",
      village: "Sonpur Chauraha",
      abhaId: "91-1029-3847-5612",
      contactNumber: "+91 93541 22987",
      bloodGroup: "AB+",
      chronicConditions: ["Hypertension", "Chronic Wheezing"],
      currentMedications: ["Amlodipine 5mg OD"],
      allergies: ["Aspirin / NSAIDs"],
      emergencyContact: "+91 93541 22988",
    }),
  },
];

/**
 * Parses any scanned QR code payload string into structured medical identity data.
 * Matches against existing cases in the database to link medical histories.
 */
export function parseMedicalIdQr(
  rawText: string,
  existingCases: PatientCase[] = []
): ScannedMedicalIdData {
  const trimmed = rawText.trim();
  const scannedAt = new Date().toISOString();

  // 1. Direct Case ID matching (e.g. "case-172720194819" or "case-...")
  if (trimmed.startsWith("case-") || trimmed.startsWith("CASE-")) {
    const matched = existingCases.find(
      (c) => c.id.toLowerCase() === trimmed.toLowerCase()
    );
    if (matched) {
      return {
        patientName: matched.patientName,
        age: matched.age,
        gender: matched.gender,
        village: matched.village,
        contactNumber: matched.contactNumber,
        abhaId: matched.abhaId,
        nationalHealthId: matched.nationalHealthId,
        bloodGroup: matched.bloodGroup,
        emergencyContact: matched.emergencyContact,
        chronicConditions: matched.chronicConditions,
        currentMedications: matched.currentMedications,
        allergies: matched.allergies,
        isPregnant: matched.isPregnant,
        pregnancyWeeks: matched.pregnancyWeeks,
        matchedCaseId: matched.id,
        rawPayload: rawText,
        format: "AROGYASEVA",
        scannedAt,
      };
    }
  }

  // 2. Attempt JSON parsing
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(trimmed);

      // Extract Name
      const name =
        parsed.name ||
        parsed.patientName ||
        parsed.patient_name ||
        parsed.fullName ||
        parsed.beneficiaryName ||
        "";

      // Extract Age
      let age: number | undefined = undefined;
      if (typeof parsed.age === "number") {
        age = parsed.age;
      } else if (typeof parsed.age === "string" && !isNaN(parseInt(parsed.age, 10))) {
        age = parseInt(parsed.age, 10);
      } else if (parsed.yearOfBirth) {
        const yob = parseInt(String(parsed.yearOfBirth), 10);
        if (yob > 1900) {
          age = new Date().getFullYear() - yob;
        }
      } else if (parsed.dob) {
        const dobYear = new Date(parsed.dob).getFullYear();
        if (!isNaN(dobYear) && dobYear > 1900) {
          age = new Date().getFullYear() - dobYear;
        }
      }

      // Extract Gender
      let gender: "Male" | "Female" | "Other" = "Male";
      const rawGender = String(parsed.gender || parsed.sex || "").toLowerCase();
      if (rawGender.startsWith("f") || rawGender === "female" || rawGender === "महिला") {
        gender = "Female";
      } else if (rawGender.startsWith("m") || rawGender === "male" || rawGender === "पुरुष") {
        gender = "Male";
      } else if (rawGender.startsWith("o") || rawGender === "other") {
        gender = "Other";
      }

      // Extract Health ID / ABHA
      const abhaId =
        parsed.abhaNumber ||
        parsed.abhaId ||
        parsed.healthId ||
        parsed.healthIdNumber ||
        parsed.nationalHealthId ||
        parsed.id ||
        undefined;

      // Extract Village & Address
      const village =
        parsed.village ||
        parsed.subCentre ||
        parsed.address ||
        parsed.district ||
        undefined;

      const contactNumber =
        parsed.mobile ||
        parsed.contactNumber ||
        parsed.phone ||
        parsed.emergencyContact ||
        undefined;

      const bloodGroup = parsed.bloodGroup || parsed.blood_group || undefined;
      const isPregnant =
        parsed.isPregnant === true ||
        String(parsed.pregnant || "").toLowerCase() === "yes" ||
        Boolean(parsed.pregnancyWeeks);
      const pregnancyWeeks = parsed.pregnancyWeeks ? Number(parsed.pregnancyWeeks) : undefined;

      const chronicConditions = Array.isArray(parsed.chronicConditions)
        ? parsed.chronicConditions
        : parsed.chronicConditions
        ? [String(parsed.chronicConditions)]
        : undefined;

      const currentMedications = Array.isArray(parsed.currentMedications)
        ? parsed.currentMedications
        : parsed.currentMedications
        ? [String(parsed.currentMedications)]
        : undefined;

      const allergies = Array.isArray(parsed.allergies)
        ? parsed.allergies
        : parsed.allergies
        ? [String(parsed.allergies)]
        : undefined;

      // Check for match in existing cases
      const matchedCase = existingCases.find((c) => {
        if (abhaId && (c.abhaId === abhaId || c.id === abhaId)) return true;
        if (name && c.patientName.toLowerCase() === name.toLowerCase()) {
          if (!village || (c.village && c.village.toLowerCase().includes(village.toLowerCase()))) {
            return true;
          }
        }
        return false;
      });

      return {
        patientName: name || "Verified Health Card Holder",
        age: age || 35,
        gender,
        village: village || "Rural Health Sub-Centre",
        contactNumber,
        abhaId: abhaId ? String(abhaId) : undefined,
        nationalHealthId: parsed.nationalHealthId || undefined,
        bloodGroup,
        emergencyContact: parsed.emergencyContact,
        chronicConditions,
        currentMedications,
        allergies,
        isPregnant,
        pregnancyWeeks,
        matchedCaseId: matchedCase?.id,
        rawPayload: rawText,
        format: parsed.schema?.includes("ABHA") || parsed.abhaNumber ? "ABHA" : "AROGYASEVA",
        scannedAt,
      };
    } catch (e) {
      // Fall through to text parsing
    }
  }

  // 3. Key-Value text lines format (e.g. "NAME: Sunita Devi\nAGE: 29...")
  const lines = trimmed.split(/[\r\n;,]+/);
  if (lines.length > 1) {
    const kvMap: Record<string, string> = {};
    for (const line of lines) {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const key = line.slice(0, idx).trim().toUpperCase().replace(/[\s_-]/g, "");
        const val = line.slice(idx + 1).trim();
        kvMap[key] = val;
      }
    }

    if (Object.keys(kvMap).length >= 2) {
      const name = kvMap["NAME"] || kvMap["PATIENTNAME"] || kvMap["FN"] || "";
      const ageNum = parseInt(kvMap["AGE"] || kvMap["YEARS"] || "", 10);
      const genderRaw = (kvMap["GENDER"] || kvMap["SEX"] || "").toUpperCase();
      const gender = genderRaw.startsWith("F")
        ? "Female"
        : genderRaw.startsWith("M")
        ? "Male"
        : "Other";
      const village = kvMap["VILLAGE"] || kvMap["ADDRESS"] || kvMap["DISTRICT"];
      const abhaId = kvMap["ABHA"] || kvMap["ABHANUMBER"] || kvMap["ID"] || kvMap["HEALTHID"];
      const contact = kvMap["PHONE"] || kvMap["MOBILE"] || kvMap["TEL"];
      const bloodGroup = kvMap["BLOODGROUP"] || kvMap["BLOOD"];
      const isPregnant =
        (kvMap["PREGNANT"] || "").toUpperCase().includes("YES") ||
        (kvMap["PREGNANCY"] || "").toUpperCase().includes("YES");

      const matchedCase = existingCases.find((c) => {
        if (abhaId && (c.abhaId === abhaId || c.id === abhaId)) return true;
        if (name && c.patientName.toLowerCase() === name.toLowerCase()) return true;
        return false;
      });

      return {
        patientName: name || "Frontline Health Card Holder",
        age: !isNaN(ageNum) ? ageNum : 30,
        gender,
        village: village || "Rural Primary Health Centre",
        contactNumber: contact,
        abhaId,
        bloodGroup,
        isPregnant,
        matchedCaseId: matchedCase?.id,
        rawPayload: rawText,
        format: "KEY_VALUE",
        scannedAt,
      };
    }
  }

  // 4. URL format (e.g. https://arogyaseva.org/patient?id=...&name=...)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const name = url.searchParams.get("name") || url.searchParams.get("patientName") || "";
      const id = url.searchParams.get("id") || url.searchParams.get("abhaId") || "";
      const age = parseInt(url.searchParams.get("age") || "", 10);
      const village = url.searchParams.get("village") || "";

      const matchedCase = existingCases.find((c) => c.id === id || (c.abhaId && c.abhaId === id));

      return {
        patientName: name || "Verified Patient (Web Card)",
        age: !isNaN(age) ? age : 30,
        gender: "Female",
        village: village || "Rural Health Sub-Centre",
        abhaId: id,
        matchedCaseId: matchedCase?.id,
        rawPayload: rawText,
        format: "URL",
        scannedAt,
      };
    } catch {
      // Fallback below
    }
  }

  // 5. Fallback plain text string
  const matched = existingCases.find(
    (c) => c.patientName.toLowerCase() === trimmed.toLowerCase()
  );

  return {
    patientName: trimmed || "Frontline Patient",
    age: 30,
    gender: "Female",
    village: "Sub-Centre",
    matchedCaseId: matched?.id,
    rawPayload: rawText,
    format: "PLAIN_TEXT",
    scannedAt,
  };
}
