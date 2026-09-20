import React from "react";
import { Activity, PhoneCall, ShieldAlert, Heart, ExternalLink } from "lucide-react";

interface LandingFooterProps {
  onNavigate: (route: "landing" | "chw" | "doctor" | "emergency") => void;
  onOpenStateModal: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onNavigate, onOpenStateModal }) => {
  return (
    <footer className="w-full bg-[#0A192F] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="container-constrained">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-left">
          
          {/* Column 1: Brand & Description (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5 text-cyan-200" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Arogya<span className="text-cyan-400">Seva</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Production-grade clinical decision support system and emergency referral network. Built for frontline Community Health Workers (ASHAs), Medical Officers, and Rural Health Missions across 36 Indian States and Union Territories.
            </p>

            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 inline-flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-red-200 uppercase tracking-wide">
                  Emergency Medical Hotline
                </div>
                <div className="text-sm font-mono font-bold text-white">
                  Dial 108 / 102 (Toll Free)
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Clinical Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("chw")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  CHW Intake Workstation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("doctor")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Doctor Hospital Command
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("emergency")}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  108 Emergency Referral
                </button>
              </li>
              <li>
                <a href="#clinical-ai" className="hover:text-white transition-colors">
                  WHO IMCI Decision Rules
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenStateModal}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  36 States & UTs Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards & Protocols */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Clinical Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>WHO IMCI 2024 Guidelines</li>
              <li>ICMR Maternal & Child Protocols</li>
              <li>SBAR Communication Matrix</li>
              <li>ABDM Digital Health Standards</li>
              <li>22 Scheduled Indian Languages</li>
            </ul>
          </div>

          {/* Column 4: Compliance & Privacy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Governance & Privacy
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>Local IndexedDB Encryption</li>
              <li>Zero Tracking Cookies</li>
              <li>No Third-Party Analytics</li>
              <li>Audit Logging for Medico-Legal Records</li>
              <li>DISHA Act Ready</li>
            </ul>
          </div>

        </div>

        {/* Medical Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p className="text-center md:text-left max-w-2xl leading-relaxed">
            <strong>Medical Disclaimer:</strong> ArogyaSeva is a clinical decision support and triage assistance tool intended for certified community health workers and registered medical practitioners. It does not replace independent clinical judgment or physical medical examination.
          </p>
          <div className="text-slate-400 font-mono text-center md:text-right shrink-0">
            © {new Date().getFullYear()} ArogyaSeva. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
