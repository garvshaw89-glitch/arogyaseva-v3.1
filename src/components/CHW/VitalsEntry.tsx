import React from "react";
import { VitalsData, SupportedLanguage, PatientCase } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import {
  Thermometer,
  Activity,
  Heart,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Sparkles
} from "lucide-react";
import { Card3DTilt } from "../Common/Card3DTilt";
import { playHapticSound } from "../../utils/audioFeedback";

interface VitalsEntryProps {
  vitals: VitalsData;
  patientData: Partial<PatientCase>;
  onChange: (updatedVitals: VitalsData) => void;
  onBack: () => void;
  onProceedToFollowUp: () => void;
  language: SupportedLanguage;
}

export const VitalsEntry: React.FC<VitalsEntryProps> = ({
  vitals,
  patientData,
  onChange,
  onBack,
  onProceedToFollowUp,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const isPregnant = patientData.isPregnant;
  const isPediatric = (patientData.age ?? 30) < 5;

  const updateField = (field: keyof VitalsData, value: number) => {
    playHapticSound("click");
    onChange({
      ...vitals,
      [field]: isNaN(value) ? 0 : value,
    });
  };

  const isHypoxic = vitals.spo2 > 0 && vitals.spo2 < 90;
  const isMildHypoxic = vitals.spo2 >= 90 && vitals.spo2 < 94;

  const isBPCrisis = isPregnant
    ? vitals.bpSystolic >= 160 || vitals.bpDiastolic >= 105
    : vitals.bpSystolic >= 180 || vitals.bpDiastolic >= 110;

  const isBPElevated = isPregnant
    ? vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90
    : vitals.bpSystolic >= 140 || vitals.bpDiastolic >= 90;

  const isHighFever = vitals.temperature >= 102.5;
  const isTachycardic = isPediatric ? vitals.heartRate > 140 : vitals.heartRate > 115;
  const isTachypneic = isPediatric ? (vitals.respiratoryRate ?? 0) >= 45 : (vitals.respiratoryRate ?? 0) >= 26;

  return (
    <div id="vitals-entry-step" className="space-y-6">
      {/* Vitals Overview Banner */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                {t.vitalsTitle}
                <span className="text-[10px] bg-cyan-50 text-cyan-700 font-semibold px-2 py-0.5 rounded-full border border-cyan-200">
                  Live Sensor Telemetry
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pulse Oximeter, Digital BP Cuff, & Clinical Thermometer Measurements
              </p>
            </div>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full border border-blue-200 shadow-xs">
            Step 2 of 4
          </span>
        </div>

        {/* Live Warning Callout if any vital is critical */}
        {(isHypoxic || isBPCrisis || isHighFever) && (
          <div id="vitals-critical-alert" className="mb-5 bg-red-50/90 border border-red-300 p-4 rounded-xl text-xs text-red-900 flex items-start gap-3 shadow-sm ring-2 ring-red-500/15 animate-in fade-in duration-200">
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-xs">
              !
            </div>
            <div>
              <span className="font-bold text-sm text-red-950 block">CRITICAL DANGER THRESHOLD DETECTED:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs text-red-800 font-medium">
                {isHypoxic && <li>SpO₂ ({vitals.spo2}%) is critically low (&lt; 90%). Supplemental oxygen & emergency transfer needed!</li>}
                {isBPCrisis && <li>Severe Blood Pressure Crisis ({vitals.bpSystolic}/{vitals.bpDiastolic} mmHg){isPregnant ? " in pregnancy (Eclampsia alert)" : ""}.</li>}
                {isHighFever && <li>High grade fever ({vitals.temperature}°F). Rule out severe sepsis or respiratory infection.</li>}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Oxygen Saturation (SpO2) */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className={`p-4 rounded-xl border transition-all h-full flex flex-col justify-between ${
              isHypoxic
                ? "bg-red-50/90 border-red-300 ring-2 ring-red-500/20 shadow-sm"
                : isMildHypoxic
                ? "bg-amber-50/80 border-amber-300"
                : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Wind className={`w-4 h-4 ${isHypoxic ? "text-red-600" : isMildHypoxic ? "text-amber-600" : "text-blue-600"}`} />
                    <label className="text-xs font-bold text-slate-800">
                      {t.spo2} <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isHypoxic
                      ? "bg-red-600 text-white"
                      : isMildHypoxic
                      ? "bg-amber-200 text-amber-900"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {isHypoxic ? "CRITICAL LOW" : isMildHypoxic ? "BORDERLINE" : "NORMAL (>= 95%)"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="input-vital-spo2"
                    type="number"
                    min={50}
                    max={100}
                    value={vitals.spo2 || ""}
                    onChange={(e) => updateField("spo2", parseInt(e.target.value, 10))}
                    className={`w-24 text-2xl font-black font-display px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isHypoxic ? "text-red-600" : "text-slate-800"
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-500">%</span>

                  <input
                    type="range"
                    min={70}
                    max={100}
                    value={vitals.spo2 || 98}
                    onChange={(e) => updateField("spo2", parseInt(e.target.value, 10))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Normal: 95–100% | Critical Danger: &lt; 90%
              </p>
            </div>
          </Card3DTilt>

          {/* 2. Blood Pressure (Systolic / Diastolic) */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className={`p-4 rounded-xl border transition-all h-full flex flex-col justify-between ${
              isBPCrisis
                ? "bg-red-50/90 border-red-300 ring-2 ring-red-500/20 shadow-sm"
                : isBPElevated
                ? "bg-amber-50/80 border-amber-300"
                : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className={`w-4 h-4 ${isBPCrisis ? "text-red-600" : isBPElevated ? "text-amber-600" : "text-blue-600"}`} />
                    <label className="text-xs font-bold text-slate-800">
                      {t.bp} <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isBPCrisis
                      ? "bg-red-600 text-white"
                      : isBPElevated
                      ? "bg-amber-200 text-amber-900"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {isBPCrisis ? "SEVERE CRISIS" : isBPElevated ? "ELEVATED" : "NORMAL (< 120/80)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Systolic</span>
                    <input
                      id="input-vital-bp-sys"
                      type="number"
                      min={60}
                      max={260}
                      value={vitals.bpSystolic || ""}
                      onChange={(e) => updateField("bpSystolic", parseInt(e.target.value, 10))}
                      placeholder="120"
                      className={`w-full text-xl font-black font-display px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        isBPCrisis ? "text-red-600" : "text-slate-800"
                      }`}
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-400 mt-3">/</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Diastolic</span>
                    <input
                      id="input-vital-bp-dia"
                      type="number"
                      min={40}
                      max={160}
                      value={vitals.bpDiastolic || ""}
                      onChange={(e) => updateField("bpDiastolic", parseInt(e.target.value, 10))}
                      placeholder="80"
                      className={`w-full text-xl font-black font-display px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        isBPCrisis ? "text-red-600" : "text-slate-800"
                      }`}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                {isPregnant ? "Pregnancy: >= 140/90 requires urgent monitoring" : "Normal: 110-120 / 70-80 mmHg"}
              </p>
            </div>
          </Card3DTilt>

          {/* 3. Temperature (°F) */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className={`p-4 rounded-xl border transition-all h-full flex flex-col justify-between ${
              isHighFever
                ? "bg-red-50/80 border-red-300"
                : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Thermometer className={`w-4 h-4 ${isHighFever ? "text-red-600" : "text-slate-600"}`} />
                    <label className="text-xs font-bold text-slate-800">
                      {t.temperature}
                    </label>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isHighFever ? "bg-red-600 text-white" : vitals.temperature > 99 ? "bg-amber-200 text-amber-900" : "bg-slate-200 text-slate-700"
                  }`}>
                    {isHighFever ? "HIGH FEVER" : vitals.temperature > 99 ? "FEVER" : "NORMAL (98.6°F)"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="input-vital-temp"
                    type="number"
                    step="0.1"
                    min={94}
                    max={108}
                    value={vitals.temperature || ""}
                    onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
                    className={`w-24 text-2xl font-black font-display px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isHighFever ? "text-red-600" : "text-slate-800"
                    }`}
                  />
                  <span className="text-sm font-semibold text-slate-500">°F</span>

                  <input
                    type="range"
                    min={96}
                    max={106}
                    step={0.2}
                    value={vitals.temperature || 98.6}
                    onChange={(e) => updateField("temperature", parseFloat(e.target.value))}
                    className="flex-1 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Normal: 98.0–99.0°F | High Fever: &gt; 102°F
              </p>
            </div>
          </Card3DTilt>

          {/* 4. Heart Rate / Pulse (BPM) with Audio Haptic Tester */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Heart className={`w-4 h-4 ${isTachycardic ? "text-red-500 animate-ping" : "text-red-500"}`} />
                    <label className="text-xs font-bold text-slate-800">
                      {t.heartRate}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => playHapticSound("heartbeat")}
                    title="Audio Pulse Check"
                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Test Audio</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="input-vital-hr"
                    type="number"
                    min={30}
                    max={220}
                    value={vitals.heartRate || ""}
                    onChange={(e) => updateField("heartRate", parseInt(e.target.value, 10))}
                    className="w-24 text-2xl font-black font-display text-slate-800 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">beats/min</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Normal: 60–100 BPM {isTachycardic ? "• Tachycardia Alert" : ""}
              </p>
            </div>
          </Card3DTilt>

          {/* 5. Respiratory Rate */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-slate-600" />
                    <label className="text-xs font-bold text-slate-800">
                      {t.respiratoryRate}
                    </label>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {isTachypneic ? "FAST BREATHING" : "14–20 /min"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="input-vital-rr"
                    type="number"
                    min={8}
                    max={80}
                    value={vitals.respiratoryRate || ""}
                    onChange={(e) => updateField("respiratoryRate", parseInt(e.target.value, 10))}
                    placeholder="18"
                    className="w-24 text-2xl font-black font-display text-slate-800 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">breaths/min</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Normal Adult: 14–20 | Child: up to 40
              </p>
            </div>
          </Card3DTilt>

          {/* 6. Blood Sugar */}
          <Card3DTilt maxTilt={5} className="h-full">
            <div className="p-4 rounded-xl border bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <label className="text-xs font-bold text-slate-800">
                      {t.bloodSugar} (Optional)
                    </label>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Field Glucometer
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    id="input-vital-glucose"
                    type="number"
                    min={30}
                    max={600}
                    value={vitals.bloodSugar || ""}
                    onChange={(e) => updateField("bloodSugar", parseInt(e.target.value, 10))}
                    placeholder="110"
                    className="w-24 text-2xl font-black font-display text-slate-800 px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                Fasting: 70–100 mg/dL | Random: &lt; 140 mg/dL
              </p>
            </div>
          </Card3DTilt>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          id="btn-back-to-registration"
          onClick={() => {
            playHapticSound("click");
            onBack();
          }}
          className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2 shadow-xs transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registration</span>
        </button>

        <button
          id="btn-proceed-to-followup"
          onClick={() => {
            playHapticSound("step");
            onProceedToFollowUp();
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2.5 transition-all hover:gap-3.5"
        >
          <span>{t.proceedToQuestions}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
