import { ClinicalPreset } from "../types";

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: "scenario-hypoxia",
    title: "Severe Breathlessness & Fever (SpO2 88%)",
    titleHi: "गंभीर सांस फूलना व तेज बुखार (SpO2 88%)",
    description: "52yo Male with 3-day cough and severe respiratory distress. Triggers urgent oxygen & transfer alert.",
    targetRisk: "URGENT",
    language: "hi",
    voiceSampleText: "मरीज की उम्र 52 वर्ष है, 3 दिन से तेज बुखार और बहुत ज्यादा सांस फूल रही है, बात करने में परेशानी हो रही है",
    patientData: {
      patientName: "Gopal Sharma",
      age: 52,
      gender: "Male",
      village: "Pipariya Kalan",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 98261 44521",
      symptoms: ["High Fever", "Severe Shortness of Breath", "Productive Cough", "Chest Tightness"],
      symptomDuration: "3 days",
      rawVoiceInput: "मरीज की उम्र 52 वर्ष है, 3 दिन से तेज बुखार और बहुत ज्यादा सांस फूल रही है, बात करने में परेशानी हो रही है",
      inputLanguage: "hi",
      vitals: {
        temperature: 102.6,
        heartRate: 116,
        spo2: 88,
        bpSystolic: 134,
        bpDiastolic: 86,
        respiratoryRate: 30,
        bloodSugar: 142
      },
      chronicConditions: ["Hypertension", "Smoker"],
      currentMedications: ["Amlodipine 5mg"],
      isPregnant: false,
      followUpAnswers: {
        "Is patient able to speak in full sentences?": "No, gasping between words",
        "Any blue discoloration around lips or nailbeds?": "Yes, mild peripheral cyanosis",
        "Is there chest pain on deep inspiration?": "Yes, right-sided"
      }
    }
  },
  {
    id: "scenario-preeclampsia",
    title: "Pregnancy Warning: High BP & Blurred Vision",
    titleHi: "गर्भावस्था खतरा: उच्च रक्तचाप (BP 164/106) व सिरदर्द",
    description: "23yo Primigravida (28 weeks) with severe headache, facial swelling and BP 164/106 mmHg.",
    targetRisk: "URGENT",
    language: "en",
    voiceSampleText: "Patient is 23 years old, 28 weeks pregnant, experiencing severe headache, puffy eyes, and blurred vision since yesterday. Blood pressure is 164 over 106.",
    patientData: {
      patientName: "Pooja Meena",
      age: 23,
      gender: "Female",
      village: "Ghatola Village",
      chwName: "Anita ANM",
      contactNumber: "+91 94142 88102",
      symptoms: ["Severe Throbbing Headache", "Blurred Vision", "Facial and Ankle Swelling", "Epigastric discomfort"],
      symptomDuration: "2 days",
      rawVoiceInput: "Patient is 23 years old, 28 weeks pregnant, experiencing severe headache, puffy eyes, and blurred vision since yesterday. Blood pressure is 164 over 106.",
      inputLanguage: "en",
      vitals: {
        temperature: 98.6,
        heartRate: 96,
        spo2: 98,
        bpSystolic: 164,
        bpDiastolic: 106,
        respiratoryRate: 18,
        bloodSugar: 98
      },
      chronicConditions: ["Primigravida (28 Weeks)"],
      currentMedications: ["Iron Folic Acid", "Calcium"],
      isPregnant: true,
      pregnancyWeeks: 28,
      followUpAnswers: {
        "Any convulsions, fits, or loss of consciousness?": "No",
        "Any sudden severe upper abdominal pain?": "Yes, moderate pain under ribs",
        "Are fetal movements active today?": "Yes, felt kicks"
      }
    }
  },
  {
    id: "scenario-pediatric-dehydration",
    title: "Pediatric Diarrhea with Severe Dehydration",
    titleHi: "बच्चे को गंभीर दस्त, उल्टी व सुस्ती (4 वर्ष)",
    description: "4yo Child with acute watery diarrhea, sunken eyes, skin pinch > 2s, and lethargy.",
    targetRisk: "URGENT",
    language: "hi",
    voiceSampleText: "चार साल का बच्चा है, दो दिन से लगातार पानी जैसे दस्त और उल्टियां हो रही हैं, बहुत सुस्त है और पानी नहीं पी रहा",
    patientData: {
      patientName: "Aarav Kumar",
      age: 4,
      gender: "Male",
      village: "Bhimnagar Sub-centre",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 91114 55320",
      symptoms: ["Profuse Watery Diarrhea", "Persistent Vomiting", "Extreme Lethargy", "Sunken Eyes"],
      symptomDuration: "2 days",
      rawVoiceInput: "चार साल का बच्चा है, दो दिन से लगातार पानी जैसे दस्त और उल्टियां हो रही हैं, बहुत सुस्त है और पानी नहीं पी रहा",
      inputLanguage: "hi",
      vitals: {
        temperature: 99.8,
        heartRate: 134,
        spo2: 97,
        bpSystolic: 86,
        bpDiastolic: 54,
        respiratoryRate: 36,
        weightKg: 13.5
      },
      chronicConditions: ["None"],
      currentMedications: ["None"],
      isPregnant: false,
      followUpAnswers: {
        "Skin pinch on abdomen goes back:": "Very slowly (> 2 seconds)",
        "Is child able to drink or breastfeed?": "Drinks poorly / unable to retain fluids",
        "Any blood or mucus in stool?": "No"
      }
    }
  },
  {
    id: "scenario-snakebite",
    title: "Farmer Suspected Snakebite with Local Swelling",
    titleHi: "किसान को संदिग्ध सर्पदंश (सांप का काटना) व सूजन",
    description: "38yo farmer bitten by unknown snake in wheat field 90 mins ago, spreading edema and gum oozing.",
    targetRisk: "URGENT",
    language: "hi",
    voiceSampleText: "38 साल के किसान हैं, खेत में काम करते समय पैर में सांप ने काट लिया, सूजन ऊपर बढ़ रही है और मसूड़ों से खून आ रहा है",
    patientData: {
      patientName: "Devendra Lodhi",
      age: 38,
      gender: "Male",
      village: "Dhamangaon",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 96302 77410",
      symptoms: ["Fang bite marks on right lower leg", "Rapidly spreading edema", "Severe burning pain", "Bleeding from gums"],
      symptomDuration: "90 minutes",
      rawVoiceInput: "38 साल के किसान हैं, खेत में काम करते समय पैर में सांप ने काट लिया, सूजन ऊपर बढ़ रही है और मसूड़ों से खून आ रहा है",
      inputLanguage: "hi",
      vitals: {
        temperature: 98.4,
        heartRate: 122,
        spo2: 95,
        bpSystolic: 102,
        bpDiastolic: 64,
        respiratoryRate: 24
      },
      chronicConditions: ["None"],
      currentMedications: ["None"],
      isPregnant: false,
      followUpAnswers: {
        "Was a tight tourniquet applied?": "No, kept limb immobilized",
        "Any ptosis (drooping eyelids) or difficulty swallowing?": "Mild heaviness in eyelids",
        "Time elapsed since bite:": "Approximately 1.5 hours"
      }
    }
  },
  {
    id: "scenario-routine-fever",
    title: "Mild Seasonal Viral Fever & Cold (Routine Care)",
    titleHi: "हल्का मौसमी बुखार व जुकाम (सामान्य देखभाल)",
    description: "19yo student with mild sore throat, clear nasal discharge, normal vitals (SpO2 99%, BP normal).",
    targetRisk: "ROUTINE",
    language: "hi",
    voiceSampleText: "19 साल का लड़का है, कल से हल्का बुखार और सिरदर्द है, नाक बह रही है लेकिन सांस में कोई दिक्कत नहीं है",
    patientData: {
      patientName: "Vikram Sen",
      age: 19,
      gender: "Male",
      village: "Pipariya Kalan",
      chwName: "Sunita ASHA Worker",
      contactNumber: "+91 99811 22345",
      symptoms: ["Mild Fever", "Sore throat", "Runny nose", "Mild frontal headache"],
      symptomDuration: "1 day",
      rawVoiceInput: "19 साल का लड़का है, कल से हल्का बुखार और सिरदर्द है, नाक बह रही है लेकिन सांस में कोई दिक्कत नहीं है",
      inputLanguage: "hi",
      vitals: {
        temperature: 99.8,
        heartRate: 74,
        spo2: 99,
        bpSystolic: 118,
        bpDiastolic: 76,
        respiratoryRate: 16
      },
      chronicConditions: ["None"],
      currentMedications: ["None"],
      isPregnant: false,
      followUpAnswers: {
        "Any difficulty breathing or chest pain?": "No",
        "Any rash or stiff neck?": "No",
        "Able to eat and drink normally?": "Yes, good appetite"
      }
    }
  }
];
