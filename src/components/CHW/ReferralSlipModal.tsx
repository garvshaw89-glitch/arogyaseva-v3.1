import React, { useEffect } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import confetti from "canvas-confetti";
import {
  FileText,
  Printer,
  Share2,
  CheckCircle,
  X,
  Hospital,
  AlertTriangle,
  QrCode,
  Calendar,
  User,
  Activity,
  PhoneCall,
  Download
} from "lucide-react";

interface ReferralSlipModalProps {
  caseData: PatientCase;
  onClose: () => void;
  onViewDoctorPortal: () => void;
  language: SupportedLanguage;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({
  caseData,
  onClose,
  onViewDoctorPortal,
  language,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const isUrgent = caseData.riskLevel === "URGENT";

  return (
    <div id="referral-slip-modal-backdrop" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Clinical Referral & Emergency Handover Record
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Case ID: <span className="text-white font-mono font-bold">{caseData.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-print-slip"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div id="printable-referral-slip" className="p-6 sm:p-8 space-y-5 text-slate-900 bg-white">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              National Health Mission • Primary Rural Referral Network
            </h2>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              CLINICAL REFERRAL & SBAR HANDOVER SLIP
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Community Health Worker Field Assessment & Triage
            </p>
          </div>

          {/* Top Metadata: QR & Target Facility */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 bg-white p-1.5 border border-slate-200 rounded-xl flex flex-col items-center justify-center shadow-xs">
                <QrCode className="w-10 h-10 text-slate-900" />
                <span className="text-[8px] font-mono text-slate-500 mt-0.5">{caseData.id}</span>
              </div>

              <div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    isUrgent
                      ? "bg-red-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {caseData.riskLevel} PRIORITY
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Referred To: {caseData.referredFacility?.name || "District Hospital"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Logged: {new Date(caseData.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="text-right text-xs">
              <p className="font-semibold text-slate-800">
                ASHA Worker: <span className="font-bold">{caseData.chwName || "Anjali Devi"}</span>
              </p>
              <p className="text-slate-500">
                Village: {caseData.village}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                ● Transmitted to Hospital Stream
              </p>
            </div>
          </div>

          {/* Patient Details & Vitals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-1.5 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Patient Demographics
              </span>
              <p className="text-base font-bold text-slate-900">{caseData.patientName}</p>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>Age: <strong>{caseData.age} Years</strong></div>
                <div>Gender: <strong>{caseData.gender}</strong></div>
                <div>Phone: <strong>{caseData.contactNumber || "N/A"}</strong></div>
                <div>Pregnant: <strong>{caseData.isPregnant ? `Yes (${caseData.pregnancyWeeks || 28} Wks)` : "No"}</strong></div>
              </div>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-white text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Field Vital Signs
              </span>
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-slate-800">
                <div>SpO₂: <strong className={caseData.vitals.spo2 < 92 ? "text-red-600 font-bold" : ""}>{caseData.vitals.spo2}%</strong></div>
                <div>Blood Pressure: <strong className={caseData.vitals.bpSystolic >= 140 ? "text-red-600 font-bold" : ""}>{caseData.vitals.bpSystolic}/{caseData.vitals.bpDiastolic} mmHg</strong></div>
                <div>Temp: <strong>{caseData.vitals.temperature}°F</strong></div>
                <div>Pulse / HR: <strong>{caseData.vitals.heartRate} bpm</strong></div>
                {caseData.vitals.respiratoryRate && <div>Resp Rate: <strong>{caseData.vitals.respiratoryRate} /min</strong></div>}
                {caseData.vitals.bloodSugar && <div>Blood Sugar: <strong>{caseData.vitals.bloodSugar} mg/dL</strong></div>}
              </div>
            </div>
          </div>

          {/* Clinical Impression & Danger Flags */}
          <div className="p-4 border border-red-200 bg-red-50 rounded-xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">
              Primary Syndromic Assessment & Danger Flags
            </span>
            <p className="text-sm font-bold text-red-950">
              {caseData.clinicalImpression}
            </p>
            {caseData.dangerSigns && caseData.dangerSigns.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-red-900 space-y-0.5 pt-1">
                {caseData.dangerSigns.map((ds, i) => (
                  <li key={i}>{ds}</li>
                ))}
              </ul>
            )}
          </div>

          {/* SBAR Doctor Handover Note */}
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              SBAR Clinical Handover Note
            </span>
            <p><strong>Situation:</strong> {caseData.sbarSummary.situation}</p>
            <p><strong>Background:</strong> {caseData.sbarSummary.background}</p>
            <p><strong>Assessment:</strong> {caseData.sbarSummary.assessment}</p>
            <p><strong>Recommendation:</strong> {caseData.sbarSummary.recommendation}</p>
          </div>

          {/* Signatures */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1">
                <span className="font-semibold text-slate-800">{caseData.chwName || "Anjali Devi"}</span>
              </div>
              <span className="text-[10px] text-slate-400">Referring Frontline Worker Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-300 pb-6 mb-1">
                <span className="text-slate-400 italic">Emergency Medical Officer</span>
              </div>
              <span className="text-[10px] text-slate-400">Receiving Doctor Signature & Bed Assigned</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
          >
            Close & Start Next Patient
          </button>

          <button
            id="btn-switch-to-doctor-view"
            onClick={onViewDoctorPortal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 flex items-center gap-2 transition-all"
          >
            <span>View on Doctor Hospital Dashboard</span>
            <Hospital className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
