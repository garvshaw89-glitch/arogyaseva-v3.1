import React from "react";
import { SupportedLanguage, PatientCase } from "../../types";
import { TRANSLATIONS, ALL_INDIAN_LANGUAGES } from "../../utils/translations";
import { IndianStateData } from "../../data/indianStates";
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Stethoscope,
  Users,
  Languages,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Radio,
  Zap,
  Siren,
  PhoneCall,
  AlertOctagon,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface HeaderProps {
  currentRole: "CHW" | "DOCTOR";
  onRoleChange: (role: "CHW" | "DOCTOR") => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  offlineQueue: PatientCase[];
  onSyncOfflineQueue: () => void;
  isSyncing: boolean;
  onNewAssessment: () => void;
  onOpenLiveTracker?: () => void;
  onTriggerEmergencySos?: () => void;
  currentState: IndianStateData;
  onOpenStateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  isOfflineMode,
  onToggleOffline,
  offlineQueue,
  onSyncOfflineQueue,
  isSyncing,
  onNewAssessment,
  onOpenLiveTracker,
  onTriggerEmergencySos,
  currentState,
  onOpenStateModal,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <header
      id="main-app-header"
      className="bg-white text-[#1A1A1A] border-b-[2.5px] border-[#1A1A1A] sticky top-0 z-40 transition-all duration-150"
    >
      {/* Top Offline Notification Bar */}
      {isOfflineMode && (
        <div
          id="offline-alert-strip"
          className="bg-[#1A1A1A] text-white text-xs font-mono px-4 py-1.5 flex items-center justify-between border-b border-[#E32E10]"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#E32E10] font-bold animate-pulse">● OFFLINE_PROTOCOL_ACTIVE</span>
            <span className="text-slate-300 hidden sm:inline">
              | Autonomous WHO IMCI/ETAT algorithms in local memory
              {offlineQueue.length > 0 && ` [QUEUED: ${offlineQueue.length}]`}
            </span>
          </div>
          <button
            onClick={() => {
              playHapticSound("click");
              onToggleOffline();
            }}
            className="text-[#E32E10] hover:underline font-bold text-xs uppercase cursor-pointer"
          >
            Reconnect Cloud →
          </button>
        </div>
      )}

      <div className="w-full px-3 sm:px-6 h-[60px] flex items-center justify-between gap-3">
        {/* Brand Block (Variation 12) */}
        <div className="flex items-center gap-3 sm:border-r sm:border-black/10 sm:pr-5 h-full shrink-0">
          <div className="w-6 h-6 bg-[#E32E10] shrink-0" />
          <h1 className="font-['Oswald'] text-xl sm:text-2xl font-semibold uppercase tracking-[0.05em] text-[#1A1A1A] leading-none">
            ArogyaSeva
          </h1>
          <span className="hidden md:inline-block font-mono text-[10px] font-bold px-1.5 py-0.5 bg-[#1A1A1A] text-white uppercase">
            {currentRole === "CHW" ? "CHW_TRIAGE" : "DOC_HUB"}
          </span>
        </div>

        {/* Center / Telemetry Status (Variation 12) */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono shrink-0">
          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenStateModal();
            }}
            className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#1A1A1A] hover:text-[#E32E10] transition-colors cursor-pointer border-b border-dashed border-[#1A1A1A]"
            title="Change Indian State (Updates ASHA Unit, Hospital & Regional Directory)"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E32E10]" />
            <span>STATE: {currentState.shortCode}_{currentState.name.toUpperCase()}</span>
          </button>

          <span className="text-[#E32E10] font-bold flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#E32E10] animate-ping" />
            <span>CONNECTION_ENCRYPTED</span>
          </span>

          <span className="text-[#8E8E85] font-mono text-[10px]">
            {currentRole === "CHW" ? `ASHA: ${currentState.ashaWorker}` : `HOSP: ${currentState.hospital.split("/")[0]}`}
          </span>
        </div>

        {/* Right Controls (Variation 12) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile State Change Trigger */}
          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenStateModal();
            }}
            className="lg:hidden flex items-center gap-1 text-[10px] font-mono font-bold bg-[#F2F2EB] px-2 py-1 border border-[#1A1A1A] cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-[#E32E10]" />
            <span>{currentState.shortCode}</span>
          </button>

          {/* Role Toggle Switch */}
          <div className="flex border border-[#1A1A1A] bg-[#F2F2EB]">
            <button
              id="header-role-chw"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("CHW");
              }}
              className={`px-2 sm:px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentRole === "CHW"
                  ? "bg-[#1A1A1A] text-white font-bold"
                  : "text-[#1A1A1A] hover:bg-black/5"
              }`}
            >
              CHW
            </button>
            <button
              id="header-role-doctor"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("DOCTOR");
              }}
              className={`px-2 sm:px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                currentRole === "DOCTOR"
                  ? "bg-[#1A1A1A] text-white font-bold"
                  : "text-[#1A1A1A] hover:bg-black/5"
              }`}
            >
              Doctor
            </button>
          </div>

          {/* Language Selector (Variation 12 Space Mono border-bottom style) */}
          <div className="flex items-center">
            <select
              id="header-language-select"
              value={language}
              onChange={(e) => {
                playHapticSound("click");
                onLanguageChange(e.target.value as SupportedLanguage);
              }}
              className="font-mono text-[11px] font-bold border-none bg-transparent border-b-2 border-[#1A1A1A] text-[#1A1A1A] focus:outline-none cursor-pointer py-1 max-w-[90px] sm:max-w-[120px]"
              title="Select Language (All 22 Official Indian Languages Supported)"
            >
              {ALL_INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-black font-mono">
                  {lang.code.toUpperCase()} - {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Button if queue exists */}
          {offlineQueue.length > 0 && (
            <button
              id="header-btn-sync"
              onClick={() => {
                playHapticSound("step");
                onSyncOfflineQueue();
              }}
              disabled={isSyncing}
              className="bg-[#1A1A1A] text-[#E32E10] text-[11px] font-mono font-bold px-2 py-1 border border-[#1A1A1A] flex items-center gap-1 cursor-pointer"
              title="Sync pending local records"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>SYNC ({offlineQueue.length})</span>
            </button>
          )}

          {/* SOS Dispatch Button (Variation 12 btn-sos) */}
          {onTriggerEmergencySos && (
            <button
              id="header-floating-emergency-sos-btn"
              type="button"
              onClick={() => {
                playHapticSound("alert");
                onTriggerEmergencySos();
              }}
              className="btn-sos flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95"
              title="RAPID 1-TAP SOS: Alert and dispatch 108 Emergency Ambulance immediately"
            >
              <Siren className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              <span>SOS DISPATCH</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
