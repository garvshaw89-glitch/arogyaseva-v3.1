import React, { useEffect, useState } from "react";
import { PatientCase, SupportedLanguage, HealthcareFacility } from "../../types";
import confetti from "canvas-confetti";
import { LiveLocationTracker } from "./LiveLocationTracker";
import { playHapticSound } from "../../utils/audioFeedback";
import { downloadReferralSlipPDF } from "../../utils/pdfGenerator";
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
  Download,
  Radio,
} from "lucide-react";

interface ReferralSlipModalProps {
  caseData: PatientCase;
  onClose: () => void;
  onViewDoctorPortal: () => void;
  language: SupportedLanguage;
  onGeneratePdfReport?: (caseData: PatientCase) => void;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({
  caseData,
  onClose,
  onViewDoctorPortal,
  language,
  onGeneratePdfReport,
}) => {
  const [showTracker, setShowTracker] = useState(false);

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
              id="btn-download-slip-pdf"
              type="button"
              onClick={() => {
                playHapticSound("success");
                downloadReferralSlipPDF(caseData);
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Download official PDF referral slip file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Slip</span>
            </button>

            {onGeneratePdfReport && (
              <button
                id="btn-open-pdf-report"
                type="button"
                onClick={() => {
                  playHapticSound("click");
                  onGeneratePdfReport(caseData);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Open full clinical PDF preview"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Detailed Report</span>
              </button>
            )}
            <button
              id="btn-print-slip"
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print slip"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div id="printable-referral-slip" className="p-6 sm:p-8 space-y-5 text-slate-900 bg-white">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-700">
              ArogyaSeva • Digital Health Referral Network
            </h2>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
              CLINICAL REFERRAL & SBAR HANDOVER SLIP
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ArogyaSeva Frontline Clinical Assessment & Triage
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
            <p><strong>Situation:</strong> {caseData.sbarSummary?.situation || "Clinical field referral for emergency care."}</p>
            <p><strong>Background:</strong> {caseData.sbarSummary?.background || "Frontline community assessment."}</p>
            <p><strong>Assessment:</strong> {caseData.sbarSummary?.assessment || caseData.clinicalImpression}</p>
            <p><strong>Recommendation:</strong> {caseData.sbarSummary?.recommendation || "Immediate physician evaluation and admission."}</p>
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
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-footer-download-slip-pdf"
              type="button"
              onClick={() => {
                playHapticSound("success");
                downloadReferralSlipPDF(caseData);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 cursor-pointer transition-all"
              title="Download official PDF referral slip file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Slip</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Close & Start Next Patient
            </button>
            {onGeneratePdfReport && (
              <button
                type="button"
                id="btn-footer-open-pdf-report"
                onClick={() => {
                  playHapticSound("click");
                  onGeneratePdfReport(caseData);
                }}
                className="px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-xl hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Detailed PDF Report</span>
              </button>
            )}
            <button
              onClick={() => {
                playHapticSound("click");
                setShowTracker(true);
              }}
              className="px-4 py-2 text-xs font-bold text-cyan-700 bg-cyan-50 border border-cyan-300 rounded-xl hover:bg-cyan-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>Track Live Ambulance</span>
            </button>
          </div>

          <button
            id="btn-switch-to-doctor-view"
            onClick={onViewDoctorPortal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>View on Doctor Hospital Dashboard</span>
            <Hospital className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTracker && (
        <LiveLocationTracker
          patientData={caseData}
          selectedFacility={
            caseData.referredFacility
              ? {
                  id: caseData.referredFacility.id,
                  name: caseData.referredFacility.name,
                  type: caseData.referredFacility.type as any,
                  distanceKm: caseData.referredFacility.distanceKm,
                  travelTimeMins: Math.round((caseData.referredFacility.distanceKm / 45) * 60),
                  address: "Verified Emergency Trauma Hub",
                  contactNumber: "108 / Emergency Desk",
                  emergencyHotline: "108",
                  hasOxygen: true,
                  hasBloodBank: true,
                  hasCSection: true,
                  hasNICU: true,
                  hasSnakeAntivenom: true,
                  hasAmbulance24x7: true,
                  availableBeds: 45,
                  icuBedsAvailable: 8,
                  latitude: 22.8115,
                  longitude: 77.7845,
                }
              : null
          }
          isOpen={showTracker}
          onClose={() => setShowTracker(false)}
        />
      )}
    </div>
  );
};
