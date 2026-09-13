import { PatientCase, RiskAssessment, FollowUpQuestion, FacilityType } from "../types";

export function evaluateClinicalRiskLocally(caseData: Partial<PatientCase>): RiskAssessment {
  const dangerSigns: string[] = [];
  let score = 15;
  const vitals = caseData.vitals || {
    temperature: 98.6,
    heartRate: 75,
    spo2: 98,
    bpSystolic: 120,
    bpDiastolic: 80,
  };

  // 1. SpO2 Assessment
  if (vitals.spo2) {
    if (vitals.spo2 < 90) {
      dangerSigns.push(`Critical Hypoxemia (SpO2 ${vitals.spo2}% < 90%) — High Risk of Acute Respiratory Failure`);
      score += 50;
    } else if (vitals.spo2 < 94) {
      dangerSigns.push(`Sub-optimal Oxygen Saturation (SpO2 ${vitals.spo2}% is below 94%)`);
      score += 25;
    }
  }

  // 2. Blood Pressure (Obstetric vs General)
  if (caseData.isPregnant) {
    if (vitals.bpSystolic >= 160 || vitals.bpDiastolic >= 105) {
      dangerSigns.push(`Severe Gestational Hypertensive Crisis (BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg in pregnancy)`);
      score += 45;
    } else if (vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90) {
      dangerSigns.push(`Gestational Hypertension (BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg)`);
      score += 25;
    }
  } else {
    if (vitals.bpSystolic >= 180 || vitals.bpDiastolic >= 110) {
      dangerSigns.push(`Severe Hypertensive Urgency (BP ${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg)`);
      score += 40;
    } else if (vitals.bpSystolic < 90) {
      dangerSigns.push(`Hypotension / Shock Warning (Systolic BP ${vitals.bpSystolic} mmHg < 90)`);
      score += 35;
    }
  }

  // 3. Heart Rate (Pediatric vs Adult)
  const isPediatric = (caseData.age ?? 25) < 5;
  if (isPediatric) {
    if (vitals.heartRate > 150) {
      dangerSigns.push(`Severe Pediatric Tachycardia (${vitals.heartRate} bpm)`);
      score += 30;
    } else if (vitals.heartRate < 80) {
      dangerSigns.push(`Pediatric Bradycardia (${vitals.heartRate} bpm)`);
      score += 40;
    }
  } else {
    if (vitals.heartRate > 120) {
      dangerSigns.push(`Tachycardia (${vitals.heartRate} bpm)`);
      score += 20;
    } else if (vitals.heartRate < 48) {
      dangerSigns.push(`Severe Bradycardia (${vitals.heartRate} bpm)`);
      score += 35;
    }
  }

  // 4. Respiratory Rate
  if (vitals.respiratoryRate) {
    if (isPediatric && vitals.respiratoryRate >= 50) {
      dangerSigns.push(`Pediatric Tachypnea (Respiratory Rate ${vitals.respiratoryRate} /min)`);
      score += 30;
    } else if (!isPediatric && vitals.respiratoryRate >= 28) {
      dangerSigns.push(`Tachypnea / Respiratory Distress (${vitals.respiratoryRate} breaths/min)`);
      score += 25;
    }
  }

  // 5. Temperature
  if (vitals.temperature >= 103.5) {
    dangerSigns.push(`Hyperpyrexia (Temperature ${vitals.temperature}°F)`);
    score += 25;
  } else if (vitals.temperature < 95.0) {
    dangerSigns.push(`Hypothermia (Temperature ${vitals.temperature}°F)`);
    score += 30;
  }

  // 6. Symptoms Check
  const symptomsJoined = (caseData.symptoms || []).join(" ").toLowerCase();
  if (symptomsJoined.includes("snake") || symptomsJoined.includes("fang") || symptomsJoined.includes("डंक") || symptomsJoined.includes("सांप")) {
    dangerSigns.push("Suspected Envenomation (Snakebite with local/systemic signs)");
    score += 55;
  }
  if (symptomsJoined.includes("chest pain") || symptomsJoined.includes("सीने में दर्द")) {
    dangerSigns.push("Acute Chest Pain (Rule out Acute Coronary Syndrome)");
    score += 35;
  }
  if (symptomsJoined.includes("unconscious") || symptomsJoined.includes("convulsion") || symptomsJoined.includes("झटके") || symptomsJoined.includes("दौरा")) {
    dangerSigns.push("Altered Consciousness / Seizure Activity");
    score += 50;
  }

  // 7. Follow up answers
  if (caseData.followUpAnswers) {
    for (const [q, ans] of Object.entries(caseData.followUpAnswers)) {
      if (typeof ans === "string") {
        const lowerAns = ans.toLowerCase();
        if (lowerAns.includes("yes") || lowerAns.includes("severe") || lowerAns.includes("very slowly") || lowerAns.includes("gasping") || lowerAns.includes("poorly")) {
          dangerSigns.push(`Affirmed Red Flag: ${q} -> "${ans}"`);
          score += 25;
        }
      }
    }
  }

  score = Math.min(100, Math.max(10, score));

  let riskLevel: "ROUTINE" | "CONSULTATION" | "URGENT" = "ROUTINE";
  let requiredFacilityLevel: FacilityType = "Sub-Centre / HWC";

  if (score >= 65 || dangerSigns.length >= 2 || (vitals.spo2 && vitals.spo2 < 90)) {
    riskLevel = "URGENT";
    requiredFacilityLevel = caseData.isPregnant
      ? "Community Health Centre (CHC / FRU)"
      : (vitals.spo2 && vitals.spo2 < 88) || symptomsJoined.includes("snake")
      ? "District Hospital & Trauma"
      : "Community Health Centre (CHC / FRU)";
  } else if (score >= 35 || dangerSigns.length === 1) {
    riskLevel = "CONSULTATION";
    requiredFacilityLevel = "Primary Health Centre (PHC)";
  }

  // Primary Clinical Impression & Stabilization Guidance
  let clinicalImpression = "Mild Primary Health Condition";
  let recommendedAction = "Local supportive management at Village/Sub-Centre with ASHA home care guidelines.";
  const fieldStabilizingActions: string[] = [];

  if (riskLevel === "URGENT") {
    if (vitals.spo2 && vitals.spo2 < 92) {
      clinicalImpression = "Severe Acute Respiratory Infection / Acute Hypoxemia";
      recommendedAction = "Immediate emergency referral to CHC / District Hospital with continuous oxygen support. Dispatch 108 Ambulance.";
      fieldStabilizingActions.push("Place patient in a 45-degree seated upright position");
      fieldStabilizingActions.push("Administer oxygen (4-6 L/min via mask) if cylinder available at Sub-Centre");
      fieldStabilizingActions.push("Ensure open airway, loosen tight clothing around neck and chest");
      fieldStabilizingActions.push("Alert receiving hospital emergency triage desk");
    } else if (caseData.isPregnant) {
      clinicalImpression = "Severe Preeclampsia / Obstetric Emergency";
      recommendedAction = "Urgent Obstetric Transfer to First Referral Unit (FRU) with Magnesium Sulphate and operative capability.";
      fieldStabilizingActions.push("Position mother on left side (left lateral recumbent)");
      fieldStabilizingActions.push("Keep patient in a calm, darkened environment to reduce seizure stimuli");
      fieldStabilizingActions.push("Carry Mother & Child Protection (MCP) card and previous ANC records");
      fieldStabilizingActions.push("Do not leave patient unattended during transit");
    } else if (symptomsJoined.includes("snake") || symptomsJoined.includes("सांप")) {
      clinicalImpression = "Acute Snakebite Envenomation (Neurotoxic/Hemotoxic)";
      recommendedAction = "Urgent transfer to facility with Polyvalent Anti-Snake Venom (ASVS) and ventilator support.";
      fieldStabilizingActions.push("Immobilize the bitten limb with a splint (keep below heart level)");
      fieldStabilizingActions.push("Do NOT cut, suck, or apply tight arterial tourniquets");
      fieldStabilizingActions.push("Reassure patient, keep them strictly calm to slow venom circulation");
      fieldStabilizingActions.push("Arrange immediate transport to CHC/District Hospital");
    } else {
      clinicalImpression = "Acute High-Risk Clinical State with multiple danger signs";
      recommendedAction = "Immediate emergency referral to Community Health Centre or District Hospital.";
      fieldStabilizingActions.push("Maintain airway, breathing, circulation (ABC checklist)");
      fieldStabilizingActions.push("Keep patient warm and hydrated with small sips if conscious");
      fieldStabilizingActions.push("Call 108 Emergency Ambulance service immediately");
    }
  } else if (riskLevel === "CONSULTATION") {
    clinicalImpression = "Moderate Illness requiring Medical Officer Clinical Review";
    recommendedAction = "Arrange physical visit or Teleconsultation with Primary Health Centre Medical Officer within 24 hours.";
    fieldStabilizingActions.push("Provide symptomatic relief as per ASHA standard drug kit");
    fieldStabilizingActions.push("Advise family on warning signs: return immediately if fever spikes, breathlessness worsens, or patient becomes drowsy");
    fieldStabilizingActions.push("Encourage adequate oral fluids and nutrient-rich diet");
  } else {
    clinicalImpression = "Routine / Mild Primary Condition";
    recommendedAction = "Home management with oral hydration, rest, and follow-up during routine village rounds.";
    fieldStabilizingActions.push("Explain home care instructions clearly to patient and caregiver");
    fieldStabilizingActions.push("Provide Paracetamol/ORS as per ASHA protocol if needed");
    fieldStabilizingActions.push("Schedule review in 48-72 hours if symptoms do not resolve");
  }

  const sbarSummary = {
    situation: `${caseData.age || 30}yo ${caseData.gender || "patient"} in ${caseData.village || "village"} presenting with ${Array.isArray(caseData.symptoms) ? caseData.symptoms.join(", ") : "acute illness"}.`,
    background: `Evaluated by frontline worker ${caseData.chwName || "ASHA"}. Duration: ${caseData.symptomDuration || "Recent"}.${caseData.isPregnant ? ` Pregnant: ${caseData.pregnancyWeeks || 0} weeks.` : ""}`,
    assessment: `Urgency Tier: ${riskLevel} (Score: ${score}/100). Key danger signs: ${dangerSigns.length > 0 ? dangerSigns.join("; ") : "None detected"}.`,
    recommendation: `Recommended facility: ${requiredFacilityLevel}. Action: ${recommendedAction}`
  };

  return {
    riskLevel,
    riskScore: score,
    dangerSigns,
    clinicalImpression,
    primaryDiagnosisRationale: dangerSigns.length > 0
      ? `Detected ${dangerSigns.length} critical clinical red flags requiring escalation.`
      : "Patient vitals and clinical parameters are within baseline safety thresholds.",
    recommendedAction,
    requiredFacilityLevel,
    fieldStabilizingActions,
    sbarSummary
  };
}

export function getDefaultFollowUpQuestions(caseData: Partial<PatientCase>): FollowUpQuestion[] {
  const list: FollowUpQuestion[] = [];
  const symptomsStr = (caseData.symptoms || []).join(" ").toLowerCase();

  if (symptomsStr.includes("fever") || symptomsStr.includes("cough") || symptomsStr.includes("breath") || symptomsStr.includes("सांस") || symptomsStr.includes("बुखार")) {
    list.push({
      id: "q_resp_1",
      question: "Is the patient having chest indrawing or gasping between words?",
      hindiTranslation: "क्या मरीज की पसलियां चल रही हैं या बोलने में सांस फूल रही है?",
      options: ["Yes, severe", "Mild breathlessness", "No"],
      dangerSignAnswer: "Yes, severe",
      dangerSignDescription: "Severe respiratory muscle distress / Pneumonia red flag",
      vitalCheckPrompt: "Check SpO2 with pulse oximeter immediately.",
      category: "RESPIRATORY"
    });
    list.push({
      id: "q_resp_2",
      question: "Are lips or fingertips turning bluish (cyanosis)?",
      hindiTranslation: "क्या होंठ या उंगलियों के नाखून नीले पड़ रहे हैं?",
      options: ["Yes", "No"],
      dangerSignAnswer: "Yes",
      dangerSignDescription: "Peripheral / Central Cyanosis indicating critical hypoxia",
      vitalCheckPrompt: "Check SpO2 on warm fingers.",
      category: "RESPIRATORY"
    });
  }

  if (caseData.isPregnant) {
    list.push({
      id: "q_obs_1",
      question: "Does the mother experience severe headache, blurred vision, or epigastric pain?",
      hindiTranslation: "क्या गर्भवती महिला को तेज सिरदर्द, आंखों से धुंधला दिखना या पेट में तेज दर्द है?",
      options: ["Yes, severe", "Mild headache only", "No"],
      dangerSignAnswer: "Yes, severe",
      dangerSignDescription: "Imminent Eclampsia warning sign",
      vitalCheckPrompt: "Check Blood Pressure immediately (Target < 140/90).",
      category: "OBSTETRIC"
    });
    list.push({
      id: "q_obs_2",
      question: "Any vaginal bleeding or leaking of fluid?",
      hindiTranslation: "क्या योनि से रक्तस्राव या पानी बह रहा है?",
      options: ["Yes, active bleeding", "Mild spotting", "No"],
      dangerSignAnswer: "Yes, active bleeding",
      dangerSignDescription: "Antepartum / Postpartum hemorrhage alert",
      category: "OBSTETRIC"
    });
  }

  if ((caseData.age ?? 20) < 5 || symptomsStr.includes("diarrhea") || symptomsStr.includes("vomit") || symptomsStr.includes("दस्त") || symptomsStr.includes("उल्टी")) {
    list.push({
      id: "q_ped_1",
      question: "Is the child lethargic/unconscious, or unable to drink fluids?",
      hindiTranslation: "क्या बच्चा बहुत सुस्त है, होश खो रहा है या पानी/स्तनपान नहीं कर पा रहा?",
      options: ["Yes, unable to drink / lethargic", "Drinks eagerly (thirsty)", "Normal intake"],
      dangerSignAnswer: "Yes, unable to drink / lethargic",
      dangerSignDescription: "Severe Dehydration / Sepsis danger sign (WHO Plan C)",
      vitalCheckPrompt: "Pinch skin on abdomen: does it go back very slowly (>2 seconds)?",
      category: "PEDIATRIC"
    });
  }

  list.push({
    id: "q_gen_convulsions",
    question: "Has the patient suffered any convulsions, fits, or neck stiffness?",
    hindiTranslation: "क्या मरीज को झटके (दौरे) आए हैं या गर्दन में गंभीर अकड़न है?",
    options: ["Yes", "No"],
    dangerSignAnswer: "Yes",
    dangerSignDescription: "Neurological danger sign / Meningitis / Severe Malaria",
    category: "NEUROLOGICAL"
  });

  return list;
}
