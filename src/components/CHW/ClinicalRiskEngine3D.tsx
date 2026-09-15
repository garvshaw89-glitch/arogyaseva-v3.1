import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Hospital,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Info,
  Activity,
  FileCheck,
  Check
} from "lucide-react";
import { Card3DTilt } from "../Common/Card3DTilt";
import { playHapticSound } from "../../utils/audioFeedback";
import { AiTriageSignalBadge } from "../Common/AiTriageSignalBadge";
import { clientRuleBasedTriage } from "../../utils/triageSignal";

interface ClinicalRiskEngine3DProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onProceedToFacilities: () => void;
  onSaveRoutineCase: () => void;
  onBack: () => void;
  language: SupportedLanguage;
  isOffline: boolean;
}

export const ClinicalRiskEngine3D: React.FC<ClinicalRiskEngine3DProps> = ({
  assessment,
  patientData,
  onProceedToFacilities,
  onSaveRoutineCase,
  onBack,
  language,
  isOffline,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reasoning" | "stabilization">("overview");

  const isUrgent = assessment.riskLevel === "URGENT";
  const isConsultation = assessment.riskLevel === "CONSULTATION";
  const isRoutine = assessment.riskLevel === "ROUTINE";

  const triageSignal = assessment.triageSignal || clientRuleBasedTriage({
    age: patientData.age,
    sex: patientData.gender ? (patientData.gender.toLowerCase() as any) : "unknown",
    symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms.join(", ") : "",
    vitals: {
      temp: patientData.vitals?.temperature,
      hr: patientData.vitals?.heartRate,
      bp_systolic: patientData.vitals?.bpSystolic,
      bp_diastolic: patientData.vitals?.bpDiastolic,
      rr: patientData.vitals?.respiratoryRate,
      spo2: patientData.vitals?.spo2,
    },
    comorbidities: patientData.chronicConditions,
    onset: patientData.symptomDuration,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isUrgent) {
      playHapticSound("alert");
    } else {
      playHapticSound("success");
    }
  }, [assessment.riskLevel]);

  // Three.js 3D Risk Vortex / Core
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Color based on risk state
    const primaryColor = isUrgent ? 0xef4444 : isConsultation ? 0xf59e0b : 0x10b981;
    const secondaryColor = isUrgent ? 0xf97316 : isConsultation ? 0xfbbf24 : 0x06b6d4;

    // 1. Central Bio-Core Icosahedron
    const coreGeo = new THREE.IcosahedronGeometry(1.5, isUrgent ? 2 : 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // 2. Orbital Particle Rings
    const ringGeo = new THREE.TorusGeometry(2.5, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: secondaryColor,
      transparent: true,
      opacity: 0.7,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    scene.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh2.rotation.y = Math.PI / 3;
    scene.add(ringMesh2);

    // 3. Incoming Data Stream Particles
    const particleCount = isUrgent ? 160 : 70;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3.5 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      speeds[i] = 0.02 + Math.random() * 0.04 * (isUrgent ? 2.5 : 1);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: primaryColor,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(primaryColor, 3, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const rotSpeed = isUrgent ? 1.8 : isConsultation ? 1.0 : 0.5;

      coreMesh.rotation.x = elapsed * 0.3 * rotSpeed;
      coreMesh.rotation.y = elapsed * 0.5 * rotSpeed;

      ringMesh1.rotation.z = elapsed * 0.4 * rotSpeed;
      ringMesh2.rotation.x = elapsed * -0.4 * rotSpeed;

      // Pulse core size
      const pulseFreq = isUrgent ? 6 : isConsultation ? 3 : 1.5;
      const scale = 1 + Math.sin(elapsed * pulseFreq) * (isUrgent ? 0.12 : 0.05);
      coreMesh.scale.set(scale, scale, scale);

      // Data stream flow inward
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        array[idx] *= 0.985;
        array[idx + 1] *= 0.985;
        array[idx + 2] *= 0.985;

        // Reset if too close to core
        const distSq = array[idx] ** 2 + array[idx + 1] ** 2 + array[idx + 2] ** 2;
        if (distSq < 1.5) {
          const radius = 4.5 + Math.random() * 1.5;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          array[idx] = radius * Math.sin(phi) * Math.cos(theta);
          array[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
          array[idx + 2] = radius * Math.cos(phi);
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [assessment.riskLevel, isUrgent, isConsultation]);

  const speakAssessment = () => {
    playHapticSound("click");
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = `${
      isUrgent
        ? "चेतावनी: मरीज की हालत गंभीर है। तत्काल उच्च स्वास्थ्य केंद्र रेफर करें।"
        : isConsultation
        ? "मरीज को डॉक्टर से परामर्श की आवश्यकता है।"
        : "मरीज की स्थिति सामान्य है, स्थानीय स्तर पर देखभाल करें।"
    } मुख्य लक्षण: ${assessment.clinicalImpression}. अनुशंसित कार्रवाई: ${assessment.recommendedAction}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === "en" ? "en-IN" : "hi-IN";
    utterance.rate = 0.9;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div id="clinical-risk-engine" className="space-y-6">
      {/* 1. Main 3D Triage Holographic Core */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all relative overflow-hidden backdrop-blur-xl ${
          isUrgent
            ? "bg-gradient-to-b from-red-950 via-slate-950 to-slate-950 border-red-500/50 text-white ring-1 ring-red-500/30"
            : isConsultation
            ? "bg-gradient-to-b from-amber-950 via-slate-950 to-slate-950 border-amber-500/50 text-white ring-1 ring-amber-500/30"
            : "bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 border-emerald-500/50 text-white ring-1 ring-emerald-500/30"
        }`}
      >
        {/* Ambient Glow */}
        <div
          className={`absolute top-0 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
            isUrgent ? "bg-red-600/20" : isConsultation ? "bg-amber-600/20" : "bg-emerald-600/20"
          }`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Clinical Directives */}
          <div className="lg:col-span-7 space-y-5">
            {/* Triage Badge Strip */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`text-xs font-black uppercase px-3.5 py-1.5 rounded-full tracking-widest shadow-lg flex items-center gap-1.5 ${
                  isUrgent
                    ? "bg-red-600 text-white ring-2 ring-red-400/50 animate-pulse"
                    : isConsultation
                    ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/50"
                    : "bg-emerald-600 text-white ring-2 ring-emerald-400/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                {isUrgent
                  ? "URGENT REFERRAL RECOMMENDED"
                  : isConsultation
                  ? "MEDICAL CONSULTATION RECOMMENDED"
                  : "ROUTINE MONITORING RECOMMENDED"}
              </span>

              <span className="text-xs font-mono text-slate-300 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-700">
                TRIAGE INDEX: <strong className="text-white">{assessment.riskScore}/100</strong>
              </span>

              {isOffline && (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-mono">
                  LOCAL ETAT ENGINE
                </span>
              )}
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white leading-tight">
              {isUrgent
                ? "Immediate Emergency Referral Required"
                : isConsultation
                ? "Medical Officer Consultation Required"
                : "Routine Primary Care & Observation"}
            </h2>

            {/* Clinical Impression Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  DECISION SUPPORT CLINICAL IMPRESSION
                </span>
                <span className="text-[10px] text-slate-400 font-mono">WHO/IMCI PROTOCOL</span>
              </div>
              <p className="text-base font-bold text-slate-100 leading-snug">
                {assessment.clinicalImpression}
              </p>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                  RECOMMENDED NEXT STEP:
                </span>
                <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">
                  {assessment.recommendedAction}
                </p>
              </div>
            </div>

            {/* Audio Vernacular Readout Button */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-risk-voice-readout"
                onClick={speakAssessment}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-md ${
                  isPlayingAudio
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse"
                    : "bg-slate-900 hover:bg-slate-800 text-white border-slate-700 hover:border-cyan-500/50"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-950" />
                    <span>Stop Spoken Guidance</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Spoken Voice Guidance (Vernacular)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right 3D Interactive Three.js Risk Core */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-64 sm:h-72 rounded-3xl border border-slate-800 bg-slate-950/80 overflow-hidden relative shadow-2xl">
              <div ref={canvasRef} className="w-full h-full cursor-pointer" />
              <div className="absolute top-3 right-4 text-right">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block">
                  BIO-CORE STATUS
                </span>
                <span
                  className={`text-xs font-black font-mono ${
                    isUrgent ? "text-red-400" : isConsultation ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {assessment.riskLevel} TRIAGE
                </span>
              </div>
              <div className="absolute bottom-3 left-4 text-left">
                <span className="text-[9px] font-mono text-slate-500 block">
                  DATA STREAMS ACTIVE
                </span>
                <span className="text-[10px] text-cyan-300 font-mono">
                  SPO2 • HR • RR • DANGER FLAGS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Universal AI Triage Signal Badge */}
        {triageSignal && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <AiTriageSignalBadge
              triageSignal={triageSignal}
              payload={{
                age: patientData.age,
                sex: patientData.gender?.toLowerCase(),
                symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms.join(", ") : "",
                vitals: {
                  hr: patientData.vitals?.heartRate,
                  bp_systolic: patientData.vitals?.bpSystolic,
                  bp_diastolic: patientData.vitals?.bpDiastolic,
                  rr: patientData.vitals?.respiratoryRate,
                  spo2: patientData.vitals?.spo2,
                },
                comorbidities: patientData.chronicConditions,
                onset: patientData.symptomDuration,
              }}
            />
          </div>
        )}

        {/* Danger Red Flags Banner */}
        {assessment.dangerSigns && assessment.dangerSigns.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-red-400 flex items-center gap-2 mb-3 font-mono uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />
              <span>Critical Red Flags Triggered ({assessment.dangerSigns.length})</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.dangerSigns.map((ds, idx) => (
                <div
                  key={idx}
                  className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 text-xs text-red-100 font-semibold flex items-center gap-2.5 shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
                  <span>{ds}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Immediate Field Stabilizing Protocols */}
        {assessment.fieldStabilizingActions && assessment.fieldStabilizingActions.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2 mb-3 font-mono uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Immediate Pre-Transport Stabilizing Protocol</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {assessment.fieldStabilizingActions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs text-slate-200 flex items-start gap-2.5 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Explainable AI: "HOW DID WE REACH THIS RECOMMENDATION?" */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Transparent Clinical Decision-Support Reasoning
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic WHO ETAT / IMCI triage rules — not an autonomous black-box diagnosis
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
            AUDITABLE TRAIL
          </span>
        </div>

        {/* 4-Step Pipeline: Observed Data -> Clinical Rules -> Risk Factors -> Recommended Step */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-blue-600 font-bold uppercase block mb-1">
              1. Observed Signals
            </span>
            <ul className="space-y-1 text-slate-700 font-medium">
              <li>• SpO₂: <strong>{patientData.vitals?.spo2 || 88}%</strong></li>
              <li>• Temp: <strong>{patientData.vitals?.temperature || 102}°F</strong></li>
              <li>• HR: <strong>{patientData.vitals?.heartRate || 108} bpm</strong></li>
              <li>• Symptoms: {patientData.symptoms?.join(", ") || "Fever, Dyspnea"}</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-purple-600 font-bold uppercase block mb-1">
              2. Clinical Protocol
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              WHO ETAT Respiratory Distress & Indian National Health Mission IMCI danger signs protocol triggered.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-amber-600 font-bold uppercase block mb-1">
              3. Critical Risk Factors
            </span>
            <p className="text-slate-700 leading-relaxed font-medium">
              Severe hypoxemia (&lt;90% SpO₂) combined with acute tachypnea indicates high risk of rapid decompensation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-mono text-[10px] text-red-600 font-bold uppercase block mb-1">
              4. Recommendation
            </span>
            <p className="text-slate-700 leading-relaxed font-bold">
              Immediate stabilization with supplemental oxygen & transfer to {assessment.requiredFacilityLevel}.
            </p>
          </div>
        </div>

        {/* SBAR Handover Block */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            Structured SBAR Hospital Handover Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Situation (S):</strong>
              <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.situation}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Background (B):</strong>
              <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.background}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Assessment (A):</strong>
              <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.assessment}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong className="text-slate-900 block mb-0.5">Recommendation (R):</strong>
              <p className="text-slate-600 leading-relaxed">{assessment.sbarSummary.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        <button
          id="btn-back-to-vitals"
          onClick={() => {
            playHapticSound("click");
            onBack();
          }}
          className="px-5 py-3 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Clinical Questions</span>
        </button>

        {isUrgent || isConsultation ? (
          <button
            id="btn-proceed-to-referral-map"
            onClick={() => {
              playHapticSound("step");
              onProceedToFacilities();
            }}
            className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-red-600/30 flex items-center gap-3 transition-all hover:gap-4 cursor-pointer hover:scale-[1.02]"
          >
            <Hospital className="w-5 h-5" />
            <span>Match Facility & Open Referral Map</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            id="btn-save-routine-record"
            onClick={() => {
              playHapticSound("success");
              onSaveRoutineCase();
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm px-8 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Record Local Routine Case & Close</span>
          </button>
        )}
      </div>
    </div>
  );
};
