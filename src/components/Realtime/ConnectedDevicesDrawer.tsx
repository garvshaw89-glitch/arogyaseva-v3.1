import React, { useState } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import {
  Radio,
  X,
  Laptop,
  Smartphone,
  Stethoscope,
  Ambulance,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface ConnectedDevicesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectedDevicesDrawer: React.FC<ConnectedDevicesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    connectedDevices,
    currentDeviceId,
    deviceName,
    currentRole,
    connectionState,
    createCase,
    submitDoctorReview,
    cases,
  } = useRealtime();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Dual-device simulation: simulate another device submitting or reviewing a case
  const handleSimulateRemoteAction = async () => {
    setIsSimulating(true);
    try {
      const demoPatients = [
        {
          patientName: "Kamleshwar Singh",
          age: 48,
          gender: "Male" as const,
          village: "Khargone East (Block 4)",
          chwName: "Anita ASHA Sangini",
          contactNumber: "+91 98912 34567",
          symptoms: ["Sudden Chest Discomfort", "Profuse Diaphoresis", "Mild Nausea"],
          symptomDuration: "1 hour",
          vitals: {
            temperature: 98.4,
            heartRate: 114,
            spo2: 94,
            bpSystolic: 156,
            bpDiastolic: 98,
            respiratoryRate: 22,
          },
          chronicConditions: ["Diabetes Mellitus"],
          riskLevel: "URGENT" as const,
          riskScore: 94,
          dangerSigns: ["Elevated Blood Pressure", "Acute Tachycardia", "Suspected ACS"],
          clinicalImpression: "Acute Coronary Syndrome Suspect — Urgent ECG & Referral",
          recommendedAction: "Immediate ambulance dispatch and high-acuity secondary facility transfer.",
          sbarSummary: {
            situation: "48M presenting with acute crushing chest pressure and perspiration for 1 hour.",
            background: "Known diabetic on Metformin. Heavy smoker.",
            assessment: "High risk acute coronary syndrome with hemodynamic stability currently maintained.",
            recommendation: "Immediate chewable aspirin 300mg, Sublingual Sorbitrate if systolic >100, 108 ambulance transfer."
          },
          fieldStabilizingActions: [
            "Keep patient seated in semi-fowler position",
            "Administer chewable Aspirin 300mg as per protocol",
            "Monitor SpO2 and pulse every 5 minutes",
            "Alert 108 Emergency response unit"
          ],
          status: "PENDING_REVIEW" as const,
        },
        {
          patientName: "Geeta Bai",
          age: 26,
          gender: "Female" as const,
          village: "Bhimnagar Sub-centre",
          chwName: "Kavita Chouhan",
          contactNumber: "+91 94250 88219",
          symptoms: ["Severe Headache", "Blurred Vision", "Swelling in Feet"],
          symptomDuration: "2 days",
          isPregnant: true,
          pregnancyWeeks: 34,
          vitals: {
            temperature: 98.6,
            heartRate: 98,
            spo2: 97,
            bpSystolic: 162,
            bpDiastolic: 104,
            respiratoryRate: 18,
          },
          chronicConditions: ["None"],
          riskLevel: "URGENT" as const,
          riskScore: 96,
          dangerSigns: ["Severe Gestational Hypertension (BP 162/104)", "Visual disturbance"],
          clinicalImpression: "Severe Pre-eclampsia with Impending Eclampsia Signs",
          recommendedAction: "Urgent Obstetric triage transfer with Magnesium Sulfate loading if indicated.",
          sbarSummary: {
            situation: "26F G2P1 at 34 weeks gestation presenting with BP 162/104, headache and blurred vision.",
            background: "Routine antenatal checkup previously normal.",
            assessment: "Severe pre-eclampsia requiring emergency secondary referral.",
            recommendation: "Immediate transfer to District Obstetric Ward with blood pressure stabilization."
          },
          fieldStabilizingActions: [
            "Keep patient in left lateral tilt",
            "Minimize loud stimulation and bright light",
            "Prepare emergency transport slip"
          ],
          status: "PENDING_REVIEW" as const,
        },
      ];

      const chosen = demoPatients[Math.floor(Math.random() * demoPatients.length)];
      await createCase(chosen as any);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateDoctorApproval = async () => {
    const pending = cases.find((c) => c.status === "PENDING_REVIEW" || (c.status as any) === "SUBMITTED");
    if (!pending) return;

    setIsSimulating(true);
    try {
      await submitDoctorReview(
        pending.id,
        "Referral Approved — Bed Reserved",
        `Confirmed by Dr. R. Kulkarni (Medical Officer). Emergency bed and supplemental O2 reserved at District Hospital. Priority transport authorized.`,
        "DOCTOR_REVIEWED"
      );
    } catch (err) {
      console.error("Doctor approval simulation error:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-teal-600 animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Synchronized Clinical Devices</h3>
              <p className="text-xs text-slate-500">Multi-device ArogyaSeva network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Multi-Device Testing Banner */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 text-xs">
          <div className="flex items-start gap-2.5">
            <Laptop className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-teal-900">
                Open in multiple tabs, laptops, or mobile phones!
              </p>
              <p className="text-teal-700 mt-0.5 leading-relaxed">
                All devices share ONE unified real-time clinical workspace. Any case created or updated updates everywhere instantly without refreshing.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] shadow-xs transition-colors"
                >
                  {copiedUrl ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUrl ? "Copied Link!" : "Copy App URL"}</span>
                </button>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-[11px] transition-colors"
                >
                  <span>Open 2nd Device Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Device List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>ACTIVE CONNECTED DEVICES ({Math.max(1, connectedDevices.length)})</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Network Connected
            </span>
          </div>

          {/* Current Device Card */}
          <div className="p-3.5 rounded-xl border-2 border-teal-500 bg-teal-50/40 shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
                  {currentRole === "doctor" ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : currentRole === "ambulance" ? (
                    <Ambulance className="w-4 h-4" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-slate-900">{deviceName}</h4>
                    <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[9px] font-extrabold uppercase">
                      This Device
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 capitalize">Role: {currentRole.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Online
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">{`DEV-${currentDeviceId.slice(-6).toUpperCase()}`}</p>
              </div>
            </div>
          </div>

          {/* Other Devices */}
          {connectedDevices
            .filter((d) => d.id !== currentDeviceId)
            .map((device, idx) => (
              <div
                key={device.id || idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                      {device.role === "doctor" ? (
                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                      ) : device.role === "ambulance" ? (
                        <Ambulance className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Laptop className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{device.deviceName || "Remote Device"}</h4>
                      <p className="text-[11px] text-slate-500 capitalize">Role: {device.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Connected
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {device.id ? `DEV-${device.id.slice(-6).toUpperCase()}` : "Remote Device"}
                    </p>
                  </div>
                </div>
              </div>
            ))}

          {connectedDevices.length <= 1 && (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
              <p>No other physical devices connected at this instant.</p>
              <p className="mt-1 text-slate-400">
                Open another browser tab or share the URL to see live multi-device synchronization in action!
              </p>
            </div>
          )}

          {/* Simulation Tools */}
          <div className="pt-3 border-t border-slate-200">
            <h5 className="text-xs font-bold text-slate-700 mb-2">Dual-Device Simulator</h5>
            <p className="text-[11px] text-slate-500 mb-3">
              Trigger a real-time event from a simulated remote device to test instant workspace synchronization without needing a second screen.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleSimulateRemoteAction}
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {isSimulating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                )}
                <span>Simulate Remote CHW Submitting Case</span>
              </button>

              <button
                onClick={handleSimulateDoctorApproval}
                disabled={isSimulating || !cases.some((c) => c.status === "PENDING_REVIEW" || (c.status as any) === "SUBMITTED")}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-bold text-xs transition-colors disabled:opacity-40"
              >
                <Stethoscope className="w-3.5 h-3.5 text-indigo-700" />
                <span>Simulate Remote Doctor Approving Case</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>ArogyaSeva Clinical Network</span>
          <span className="font-semibold text-teal-700">Autonomous Synchronization</span>
        </div>
      </div>
    </div>
  );
};
