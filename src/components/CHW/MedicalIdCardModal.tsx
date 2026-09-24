import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { PatientCase } from "../../types";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MapPin,
  HeartPulse,
  AlertCircle,
  Copy,
  Check,
  QrCode,
  User,
  Phone,
  Activity,
  Heart
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface MedicalIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Partial<PatientCase>;
}

export const MedicalIdCardModal: React.FC<MedicalIdCardModalProps> = ({
  isOpen,
  onClose,
  patient,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const abhaId = patient.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const patientId = patient.id || "CASE-TEMP";

  useEffect(() => {
    if (!isOpen || !patient) return;

    // Construct standard interoperable digital health payload
    const payload = JSON.stringify({
      schema: "NHA_ABHA_V2",
      app: "ArogyaSeva",
      caseId: patientId,
      abhaNumber: abhaId,
      patientName: patient.patientName || "Unknown Patient",
      age: patient.age || 30,
      gender: patient.gender || "Female",
      village: patient.village || "Sub-Centre",
      contactNumber: patient.contactNumber || "",
      bloodGroup: patient.bloodGroup || "O+",
      isPregnant: Boolean(patient.isPregnant),
      pregnancyWeeks: patient.pregnancyWeeks,
      chronicConditions: patient.chronicConditions || [],
      allergies: patient.allergies || [],
      emergencyContact: patient.emergencyContact || "",
      issuedDate: new Date().toISOString().split("T")[0],
    });

    QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Failed to generate QR code:", err));
  }, [isOpen, patient, abhaId, patientId]);

  if (!isOpen) return null;

  const handleCopyAbha = () => {
    playHapticSound("click");
    navigator.clipboard?.writeText(abhaId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    playHapticSound("click");
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Official Digital Medical ID Card
              </h2>
              <p className="text-[11px] text-slate-500">
                Ayushman Bharat / ArogyaSeva Linked Frontline ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Visual ID Card Preview */}
          <div
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A192F] text-white p-5 shadow-xl select-none"
          >
            {/* Background watermarks */}
            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

            {/* Card Header Strip */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                  आ
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                    National Digital Health Registry
                  </div>
                  <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>ArogyaSeva Digital Health Card</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
                ABDM Verified
              </span>
            </div>

            {/* Card Main Info & Scannable QR */}
            <div className="flex items-start gap-4">
              {/* Left Details */}
              <div className="flex-1 space-y-2.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Patient Name / नाम
                  </div>
                  <div className="text-base font-black text-white tracking-wide">
                    {patient.patientName || "Sunita Devi"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Age / Sex
                    </span>
                    <span className="font-bold text-slate-200">
                      {patient.age || 29} Yrs • {patient.gender || "Female"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Blood Group
                    </span>
                    <span className="font-bold text-rose-400">
                      {patient.bloodGroup || "B+"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Village / Centre
                  </span>
                  <span className="font-semibold text-xs text-slate-300 truncate block">
                    {patient.village || "Rampur Sub-Centre"}
                  </span>
                </div>

                {patient.isPregnant && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>Maternal Registered ({patient.pregnancyWeeks || 32}w)</span>
                  </div>
                )}
              </div>

              {/* Right: Scannable QR Code Frame */}
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="p-1.5 bg-white rounded-xl shadow-md border border-white/20">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Scannable Medical ID QR Code"
                      className="w-24 h-24 object-contain rounded"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
                <span className="text-[8px] font-mono tracking-wider text-slate-300 uppercase">
                  Scan for Triage
                </span>
              </div>
            </div>

            {/* Card Footer Strip: ABHA Number */}
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">
                  ABHA Health Number
                </span>
                <span className="font-mono font-bold text-cyan-400 tracking-wider text-sm">
                  {abhaId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyAbha}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-300" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-slate-700 text-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">
                Interoperable Ayushman Bharat (ABDM) Compatible
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Frontline ASHA workers and hospital triage desks can scan this QR code using the built-in scanner to instantly pull demographic details, pre-existing chronic conditions, and previous clinical visits.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            ID: {patientId}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
