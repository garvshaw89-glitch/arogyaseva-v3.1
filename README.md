<div align="center">

<!-- High-End 3D Animated Showcase Banner -->
<a href="#-live-clinical-portals">
  <img src="./assets/arogyaseva-3d-animated.svg" alt="ArogyaSeva AI - 3D Animated Clinical Network Banner" width="100%" style="border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 194, 215, 0.15);" />
</a>

<br/>
<br/>

# 🏥 ArogyaSeva-v3.1
### *Rural Clinical Decision Support, Multilingual Voice Triage & 108 Emergency Referral Grid*

<!-- High-Density Badge Matrix -->
[![MIT License](https://img.shields.io/badge/License-MIT-00C2D7.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](./LICENSE)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8.svg?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![OpenStreetMap](https://img.shields.io/badge/GIS-OpenStreetMap-7EBC6F.svg?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org/)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75FF.svg?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![WHO ETAT & ICMR](https://img.shields.io/badge/Protocol-WHO_ETAT_%26_ICMR-10B981.svg?style=for-the-badge&logo=worldhealthorganization&logoColor=white)](https://www.who.int/)
[![108 EMRS](https://img.shields.io/badge/Emergency-108_ALS_Dispatch-EF4444.svg?style=for-the-badge&logo=ambulance&logoColor=white)]()

<br/>

<p align="center">
  <b>Bridging India's Critical Rural-to-Tertiary Healthcare Divide</b><br/>
  Empowering Accredited Social Health Activists (<b>ASHAs</b>), Auxillary Nurse Midwives (<b>ANMs</b>), and Community Health Workers (<b>CHWs</b>) with instant offline clinical triage, multilingual voice symptom recognition, real-time OpenStreetMap facility discovery, and automated 108 Emergency Referral Slips.
</p>

<!-- Interactive Quick Navigation Capsule Bar -->
<p align="center">
  <a href="#-live-clinical-portals"><b>⚡ Live Portals</b></a> •
  <a href="#-key-architectural-pillars"><b>🌟 Key Pillars</b></a> •
  <a href="#-clinical-acuity--algorithm-matrix"><b>🩺 Clinical Matrix</b></a> •
  <a href="#-clinical-data-pipeline"><b>🏗️ Pipeline</b></a> •
  <a href="#-traditional-vs-arogyaseva-ai"><b>⚖️ Impact Matrix</b></a> •
  <a href="#-interactive-gis-facility-locator"><b>🗺️ GIS Engine</b></a> •
  <a href="#-quick-start"><b>📦 Quick Start</b></a> •
  <a href="#-author--license"><b>📄 License</b></a>
</p>

</div>

---

> [!IMPORTANT]
> **Zero Cloud Dependency in Critical Rural Fields**: ArogyaSeva's primary triage rules, physiological danger scoring, and vital sign thresholds run **100% locally on-device** (WebAssembly / JavaScript / IndexedDB). Even in areas with zero cellular connectivity, frontline workers can complete full triage evaluations, generate cryptographic SBAR referral slips, and queue records for cloud synchronization.

---

## ⚡ Live Clinical Portals

ArogyaSeva unites frontline rural healthcare workers, tertiary hospital doctors, and national emergency response systems into one cohesive, real-time operating system:

```
                                ┌──────────────────────────────────────────────┐
                                │     AROGYASEVA UNIFIED CLINICAL NETWORK      │
                                └──────────────────────┬───────────────────────┘
                                                       │
         ┌─────────────────────────┬───────────────────┴───────────────────┬─────────────────────────┐
         ▼                         ▼                                       ▼                         ▼
┌──────────────────┐      ┌──────────────────┐                   ┌──────────────────┐      ┌──────────────────┐
│  🌿 CHW INTAKE   │      │ 🗺️ GIS LOCATOR   │                   │ 🩺 DOCTOR COMMAND│      │ 🚨 108 EMERGENCY │
│ Voice AI Triage  │      │ Live Overpass OSM│                   │ Pre-Arrival ICU  │      │ Instant Ambulance│
│ Offline Vitals   │      │ Dynamic Driving  │                   │ Teleconsultation │      │ Telemetry Beacon │
│ SBAR QR Slips    │      │ Hospital Matcher │                   │ Acuity Priority  │      │ GPS Coordinates  │
└──────────────────┘      └──────────────────┘                   └──────────────────┘      └──────────────────┘
```

<br/>

<details open>
<summary><b>1. 🌿 Community Health Worker (CHW / ASHA) Workstation</b></summary>
<br/>

Designed specifically for field tablets, mobile phones, and rural sub-centers:
- **Multilingual Colloquial Speech**: Frontline workers or patients speak naturally in **Hindi, Bhojpuri, Bengali, or English** (e.g., *"3 din se tez bukhar hai aur saans lene mein takleef ho rahi hai"*).
- **Automated Clinical Entity Parser**: Gemini 2.5 Flash extracts chief complaints, duration, physiological signs, and obstetrical flags into structured clinical JSON.
- **Physical Exam Checklist**: WHO Integrated Management of Childhood Illness (IMCI) and maternal danger sign checklists with tap-optimized touch ergonomics.
- **Instant Referral Slip**: Generates cryptographic, verifiable SBAR referral slips with QR codes for paperless admission at district civil hospitals.
</details>

<details open>
<summary><b>2. 🩺 District Civil Hospital Doctor Command Center</b></summary>
<br/>

Provides receiving physicians and trauma centers with real-time situational awareness before the patient reaches the hospital:
- **Clinical Acuity Sorting**: Cases automatically ranked from **Priority Red (Score 80–100)** to **Priority Green (Score 0–39)**.
- **Pre-Arrival Bed & Resource Reservation**: Doctors can mark ICU beds, prepare blood bank units, and ready emergency obstetrics/surgical teams in 1 click.
- **Live In-Transit Telemetry**: Real-time GPS distance, estimated time of arrival (ETA), and field stabilization measures taken by the ASHA.
- **Direct WebRTC Teleconsultation**: Instant video/audio relay connecting the village sub-center directly to attending specialists.
</details>

<details open>
<summary><b>3. 🗺️ Live GIS Facility Locator & Overpass API Engine</b></summary>
<br/>

Zero simulated or hardcoded hospital coordinates. Interfaces directly with OpenStreetMap:
- **Dynamic Overpass API Querying**: Searches genuine hospitals, community health centers (CHCs), and primary health centers (PHCs) within a 35 km radius of the patient's device GPS.
- **Filter by Critical Capability**: Instantly filter facilities offering **Oxygen Generators, ICU Beds, Blood Banks, or 24/7 C-Section OT**.
- **Interactive Multi-Tile Engine**: Switch seamlessly between **OpenStreetMap Standard**, **CartoDB Crisp Light**, and **Satellite Aerial Imagery**.
- **Geodesic Route Polylines**: Renders optimal road trajectories with dynamic driving time and distance calculation.
</details>

<details open>
<summary><b>4. 🚨 National 108 Emergency Medical Response System (EMRS)</b></summary>
<br/>

- **Single-Tap Emergency SOS**: Immediate transmission of patient GPS coordinates, vitals snapshot, and suspected condition to the state 108 ambulance dispatch control room.
- **Live Fleet Tracking**: Displays nearest Advanced Life Support (ALS) and Basic Life Support (BLS) ambulances en route.
- **Direct Ambulance Hotline Call**: 1-tap dialer for `tel:108` and state emergency control rooms.
</details>

---

## 🌟 Key Architectural Pillars

### 1. 🎙️ Dialect-Tolerant Voice AI & Clinical Extraction
Traditional medical software requires complex English drop-down forms inaccessible to rural frontline workers. ArogyaSeva integrates a dual-mode intake engine:
- **Audio Capture & Regional Dialects**: Captures audio input with automatic dialect normalization for rural idioms and non-standard phrasing.
- **Zero Hallucination Guardrails**: Gemini 2.5 Flash operates strictly as an entity parser; clinical risk scores and emergency classifications are calculated **deterministically** via ICMR/WHO rule algorithms.

### 2. ⚡ 100% Offline-First Triage Engine
- **Local Storage Engine**: Employs client-side IndexedDB with optimistic caching.
- **Resilient Protocol Matching**: Immediate calculation of **WHO ETAT** and **ICMR danger algorithms** in <10ms without an active internet connection.
- **Background Synchronization**: Automatically broadcasts submitted cases to district hospital queues the moment mobile connectivity (2G/3G/4G/5G/Wi-Fi) is detected.

### 3. 🇮🇳 36 Indian States & Union Territories Dynamic Switching
- ArogyaSeva covers all **28 States and 8 Union Territories** of India.
- Selecting any state instantly re-aligns:
  - Local ASHA worker health circles and sub-center IDs.
  - Tertiary referral hospital hierarchy (e.g., *AIIMS New Delhi*, *KEM Hospital Mumbai*, *SCB Medical College Cuttack*, *Government General Hospital Chennai*).
  - Regional emergency dispatch telephone relays and clinical caseload profiles.

---

## 🩺 Clinical Acuity & Algorithm Matrix

ArogyaSeva implements deterministic emergency triage protocols adapted from **ICMR Rural Healthcare Guidelines** and the **WHO Emergency Triage Assessment and Treatment (ETAT)** framework:

| Priority Tier | Acuity Score | Physiological Triggers / Danger Signs | Automated Field Protocol | Referral Target & Transport |
| :--- | :---: | :--- | :--- | :--- |
| **🔴 CRITICAL RED** | **80 – 100** | • SpO2 < 90% on room air<br/>• Systolic BP > 160 or < 80 mmHg<br/>• Active convulsions / coma<br/>• Postpartum Hemorrhage (PPH)<br/>• Severe stridor / respiratory exhaustion | 1. Administer high-flow O₂ (6–8 L/min)<br/>2. Elevate head 45° / Fowler's<br/>3. Establish large-bore IV access<br/>4. Trigger 108 Emergency SOS | **Tertiary Trauma / Medical College Hospital**<br/>*(ALS 108 Ambulance with Paramedic)* |
| **🟡 URGENT AMBER** | **40 – 79** | • SpO2 90% – 94%<br/>• High remittent fever > 3 days<br/>• Dehydration with sunken eyes<br/>• Diastolic BP 90 – 109 mmHg<br/>• Moderate pediatric chest indrawing | 1. Oral rehydration therapy (ORS)<br/>2. Antipyretic paracetamol dosing<br/>3. Initiate Doctor Teleconsultation<br/>4. Prepare SBAR Referral Slip | **Sub-District / Community Health Centre (CHC)**<br/>*(BLS Ambulance or Sanitized Vehicle)* |
| **🟢 NON-URGENT GREEN**| **0 – 39** | • Normal vitals (SpO2 ≥ 95%, HR 60-100)<br/>• Mild seasonal upper respiratory symptoms<br/>• Superficial abrasions / localized rash<br/>• Routine antenatal follow-up | 1. Sub-center outpatient management<br/>2. Dietary counseling & iron/folic acid<br/>3. Community health tracking in 48h | **Primary Health Sub-Center (PHC)**<br/>*(Local ASHA Outpatient Monitoring)* |

---

## 🏗️ Clinical Data Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLINICAL DATA PIPELINE                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ Rural Patient Intake ]
             │
             ├──────────────────────────────────────────────────┐
             ▼                                                  ▼
   🎙️ Multilingual Speech                             📋 Guided Physical Exam
   (Hindi, Bhojpuri, Bengali, English)                (Vitals: SpO2, BP, PR, RR, Temp)
             │                                                  │
             ▼                                                  ▼
   🤖 Gemini 2.5 Flash                                ⚡ Offline Rule Engine
   (Clinical Entity Extraction)                       (ICMR & WHO ETAT Algorithms)
             │                                                  │
             └─────────────────────────┬────────────────────────┘
                                       │
                                       ▼
                       🛡️ Clinical Risk Acuity Score (0 - 100)
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
        🔴 Score ≥ 80 (EMERGENCY)               🟢 Score < 80 (URGENT / ROUTINE)
                    │                                     │
                    ▼                                     ▼
        🚨 108 Ambulance Dispatch             🗺️ Live Overpass OSM Locator
        (GPS Beacon + Priority Transit)       (Match CHC / PHC within 35km)
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       │
                                       ▼
                       📄 Cryptographic SBAR Referral Slip
                       (FHIR R4 QR Code + Clinical Summary)
                                       │
                                       ▼
                       🩺 District Hospital Doctor Command
                       (Pre-Arrival Bed & Oxygen Prep via SSE)
```

---

## ⚖️ Traditional vs. ArogyaSeva AI

| Dimension | ❌ Traditional Rural Referral System | 🚀 ArogyaSeva AI Ecosystem |
| :--- | :--- | :--- |
| **Data Capture** | Illegible handwritten paper registers, delay in transcription | **Multilingual Voice AI** with auto-categorization in local dialects |
| **Offline Reliability** | Cloud apps crash in dead zones; paper lacks decision rules | **100% Offline deterministic triage** running on-device via IndexedDB |
| **Triage Standard** | Subjective guesswork by overburdened field workers | **ICMR & WHO ETAT algorithmic acuity scoring** (0 to 100 scale) |
| **Hospital Discovery** | Outdated phone directories; unknown bed/oxygen availability | **Live OpenStreetMap & Overpass API** with real-time capability filtering |
| **Referral Communication**| Unstructured slips; patient arrives unannounced at ER | **Standardized FHIR SBAR digital slips** with QR code verification |
| **Emergency Transit** | Delays finding ambulance numbers; no GPS telemetry | **1-click 108 Emergency Response** with live ambulance dispatch |
| **Doctor Coordination** | Doctor learns about patient only upon arrival at ER | **Pre-Arrival Doctor Command Center** with bed & OT preparation |

---

## 🗺️ Interactive GIS Facility Locator

ArogyaSeva interfaces directly with the OpenStreetMap GIS ecosystem via Leaflet:

```overpass
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:35000, {{lat}}, {{lng}});
  way["amenity"="hospital"](around:35000, {{lat}}, {{lng}});
  node["amenity"="clinic"](around:35000, {{lat}}, {{lng}});
);
out center 35;
```

- **Resilient Multi-Tier Failover**:
  1. Direct Overpass API GIS Endpoint (`https://overpass-api.de/api/interpreter`)
  2. Server-side Caching & Proxy Route (`/api/nearby-hospitals`)
  3. Pre-Verified Regional Cluster Data for all 36 Indian States & UTs
- **Zero Mock Telemetry**: Real driving distances, dynamic road route polylines, and capability badges (Oxygen, ICU, Blood Bank, 24/7 OT).

---

## 📱 Cross-Device Responsiveness (320px to 4K)

ArogyaSeva is engineered with mobile-first CSS architecture, supporting:

- **Mobile Viewports (320px – 480px)**: Compact phones (iPhone SE, Galaxy A-series) with single-column touch layouts, comfortable 44px+ touch targets, and collapsible navigation drawer.
- **Tablet & Phablet (640px – 1024px)**: iPad, iPad Air, Android tablets in portrait/landscape with responsive dual-pane views.
- **Desktop & Workstations (1280px – 3840px)**: Full multi-column clinical command centers with live sidebars and synchronized multi-panel layouts.
- **Safe Area Insets**: Native support for notches, Dynamic Island, and curved screens (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).
- **Reduced Motion Support**: Full compliance with `prefers-reduced-motion` for accessibility.

---

## 💻 Tech Stack & Architecture

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18.3**, TypeScript 5.5 | Reactive, component-driven clinical workstations |
| **Build & Bundler** | **Vite 6** | Ultra-fast HMR and optimized production asset bundles |
| **Styling & Design** | **Tailwind CSS v4**, Glassmorphism CSS | Responsive fluid layout, tokenized glass design system |
| **Interactive Mapping** | **Leaflet**, `react-leaflet` | Geospatial vector maps, custom pins, geodesic routes |
| **GIS Data Providers** | **OpenStreetMap**, **Overpass API** | Live query engine for global hospital discovery |
| **AI / NLP Intelligence** | **Google Gemini 2.5 Flash** (`@google/genai`) | Multilingual clinical symptom parsing and entity extraction |
| **Server & Sync** | **Express.js**, Node.js (TypeScript) | API endpoints, Overpass proxying, real-time sync |
| **Field Audio & Haptics** | **Web Audio API** | Auditory feedback and haptic cues for field workers |
| **Iconography** | **Lucide React** | Medical and system vector icons |

---

## 📦 Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/garvshaw89-glitch/ArogyaSeva.git
cd ArogyaSeva
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the example environment template:
```bash
cp .env.example .env
```

Configure your Google Gemini API key:
```env
# Google Gemini API key for server-side clinical entity parsing
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!NOTE]
> Even without a Gemini API key configured, ArogyaSeva runs smoothly using built-in deterministic heuristic clinical parsers!

### 4. Run Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and Gemini API connectivity status |
| `POST` | `/api/gemini/clinical-intake` | Parse multilingual clinical speech/text into structured clinical JSON |
| `GET` | `/api/nearby-hospitals` | Live Overpass API hospital locator proxy with automatic failover |
| `GET` | `/api/cases` | Fetch real-time referral queue for district hospital doctors |
| `POST` | `/api/cases` | Transmit newly triaged referral case from the field |

---

## 🧪 Pre-Seeded Clinical Test Cases

You can test ArogyaSeva with these realistic rural clinical scenarios:

<details>
<summary><b>Scenario A: Acute Pediatric Respiratory Distress (Red Priority)</b></summary>

- **Patient**: Aarav Sharma, 3 Years Old, Male
- **Voice Input**: *"Mera bachha subah se bohot tez saans le raha hai, chhati andar dhas rahi hai aur hoth neele pad rahe hain."*
- **Vitals**: SpO2: 86%, Pulse Rate: 138 bpm, Temp: 102.8°F, Respiratory Rate: 46 bpm.
- **Expected Triage**: 🔴 **Critical Priority Red (Score: 95)**. Immediate high-flow O2 protocol, Fowler's position, and 108 ALS Ambulance dispatch.
</details>

<details>
<summary><b>Scenario B: Severe Antepartum Pre-Eclampsia (Red Priority)</b></summary>

- **Patient**: Sunita Devi, 26 Years Old, Female (34 Weeks Pregnant)
- **Voice Input**: *"Aankhon ke aage andhera chha raha hai, sar mein bohot tez dard hai aur pairon mein bohot sujan hai."*
- **Vitals**: Blood Pressure: 168/108 mmHg, Pulse Rate: 92 bpm, SpO2: 97%.
- **Expected Triage**: 🔴 **Critical Priority Red (Score: 92)**. Emergency obstetric referral, Magnesium Sulfate protocol preparation, direct transfer to C-Section capable hospital.
</details>

<details>
<summary><b>Scenario C: Remittent Viral Fever & Mild Dehydration (Amber Priority)</b></summary>

- **Patient**: Ramesh Yadav, 42 Years Old, Male
- **Voice Input**: *"Teen din se bukhar utar nahi raha, gale mein kharash hai aur ulti jaisa lag raha hai."*
- **Vitals**: Temp: 101.4°F, SpO2: 95%, BP: 122/80 mmHg, PR: 84 bpm.
- **Expected Triage**: 🟡 **Urgent Priority Amber (Score: 54)**. Sub-district hospital outpatient referral, paracetamol antipyretic dosing, ORS hydration.
</details>

---

## 🔒 Security & Data Sovereignty

- **DISHA & ABDM Alignment**: Follows national guidelines for Indian Digital Health Record sovereignty.
- **Client-Side Cryptography**: Referral slip QR codes contain tamper-evident SHA-256 signatures of patient vitals and timestamp.
- **De-Identification**: Sensitive telemetry strip logs are scrubbed of non-essential identifying data prior to regional dispatch.

---

## 📄 Author & License

Developed with dedication to India's frontline healthcare champions, ASHA workers, and rural medical officers.

- **Author**: Garv Shaw
- **Email**: [garvshaw89@gmail.com](mailto:garvshaw89@gmail.com) • [garvshawinfo@gmail.com](mailto:garvshawinfo@gmail.com)
- **Repository**: [github.com/garvshaw89-glitch/ArogyaSeva](https://github.com/garvshaw89-glitch/ArogyaSeva)
- **License**: Licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

<div align="center">
  <sub>Built for frontline resilience • ArogyaSeva AI © 2026</sub>
</div>
