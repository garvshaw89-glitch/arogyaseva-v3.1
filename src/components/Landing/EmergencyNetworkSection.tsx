import React from "react";
import {
  PhoneCall,
  Ambulance,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Hospital,
} from "lucide-react";

interface EmergencyNetworkSectionProps {
  onOpenEmergency: () => void;
  onOpenStateModal: () => void;
  stateName: string;
}

export const EmergencyNetworkSection: React.FC<EmergencyNetworkSectionProps> = ({
  onOpenEmergency,
  onOpenStateModal,
  stateName,
}) => {
  return (
    <section id="emergency-network" className="w-full py-16 lg:py-24 bg-white border-b border-slate-200/80">
      <div className="container-constrained">
        <div className="bg-gradient-to-br from-[#123B78] via-[#0E2C5B] to-[#0A192F] rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Col (7 cols) */}
            <div className="lg:col-span-7 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-xs font-bold text-red-200 uppercase tracking-wider mb-4">
                <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                <span>National Emergency Response Integration</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 leading-tight">
                Direct 108 Emergency Ambulance & Bed Matching
              </h2>

              <p className="text-base text-slate-300 leading-relaxed mb-8 max-w-xl">
                When critical danger signs or severe physiological decompensation are detected, ArogyaSeva instantly calculates road travel times, contacts the nearest 108 emergency fleet, and alerts the receiving hospital emergency triage bay.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onOpenEmergency}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] shadow-lg transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Launch 108 SOS Dispatch Center</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenStateModal}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Configured Region: {stateName}</span>
                </button>
              </div>
            </div>

            {/* Right Col: Live Ambulance Dispatch Radar Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-left shadow-2xl text-xs space-y-4">
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <Ambulance className="w-5 h-5 text-red-400" />
                    <span className="font-bold text-sm tracking-wide font-mono">
                      Ambulance Fleet Status
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] font-mono">
                    ACTIVE FLEET
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-300">National Dispatch Line</span>
                    <span className="font-mono font-bold text-white">108 / 102 (Janani Shishu)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-300">Average Rural ETA</span>
                    <span className="font-mono font-bold text-cyan-300">&lt; 22 Minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-300">Nearest Capable Center</span>
                    <span className="font-mono font-bold text-white">District Civil Hospital</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-white/10">
                    <span className="text-slate-300">ICU Bed Availability</span>
                    <span className="font-mono font-bold text-emerald-400">4 Operational Beds</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] leading-relaxed">
                  Equipped with GPS coordinates, biometric SBAR telemetry, and automatic SMS notification to the Emergency Department Medical Officer.
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
