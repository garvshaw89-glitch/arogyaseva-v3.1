import React from "react";
import { SupportedLanguage, PatientCase } from "../../types";
import { TRANSLATIONS, ALL_INDIAN_LANGUAGES } from "../../utils/translations";
import { IndianStateData } from "../../data/indianStates";
import {
  Dna,
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
  MapPin,
  ChevronDown,
  ArrowRight,
  Activity,
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
      className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur-md border-b border-[rgba(0,0,0,0.08)] transition-all duration-150"
    >
      {/* Top Offline Alert Banner */}
      {isOfflineMode && (
        <div
          id="offline-alert-strip"
          className="bg-[#0c2b64] text-white text-xs font-mono px-4 sm:px-16 py-1.5 flex items-center justify-between border-b border-[#1a56db]/40"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-amber-300 font-bold uppercase tracking-wider">
              OFFLINE PROTOCOL ENGAGED
            </span>
            <span className="text-slate-200 hidden sm:inline text-[11px]">
              | Autonomous WHO IMCI triage in local memory
              {offlineQueue.length > 0 && ` [QUEUED: ${offlineQueue.length} cases]`}
            </span>
          </div>
          <button
            onClick={() => {
              playHapticSound("click");
              onToggleOffline();
            }}
            className="text-cyan-300 hover:text-white underline font-bold text-xs uppercase cursor-pointer"
          >
            Reconnect Cloud →
          </button>
        </div>
      )}

      {/* Main Navbar Container (Specification: Padding 1.5rem top/bottom, 4rem left/right on desktop) */}
      <div className="w-full px-4 sm:px-8 lg:px-16 py-3 sm:py-4 flex items-center justify-between gap-4">
        {/* Left: Clean minimal icon indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform duration-200 hover:scale-105"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1a56db",
            }}
          >
            <Dna className="w-5 h-5" />
          </div>
        </div>

        {/* Center: Navigation Links (Specification: 0.95rem Medium, Gap 2.5rem, Color #475569, Hover #1a56db) */}
        <nav className="hidden xl:flex items-center gap-10 text-[0.95rem] font-medium text-[#475569]">
          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onRoleChange("CHW");
              const el = document.getElementById("chw-workflow-stepper");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-[#1a56db] cursor-pointer"
          >
            <span>Clinical Workstation</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenStateModal();
            }}
            className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-[#1a56db] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#1a56db]" />
            <span>State Directory</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onRoleChange("CHW");
            }}
            className="transition-colors duration-200 hover:text-[#1a56db] cursor-pointer"
          >
            WHO IMCI Protocols
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onRoleChange("DOCTOR");
              const el = document.getElementById("doctor-hospital-command");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-1 transition-colors duration-200 hover:text-[#1a56db] cursor-pointer"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#1a56db]" />
            <span>Doctor Command</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenLiveTracker?.();
            }}
            className="transition-colors duration-200 hover:text-[#1a56db] cursor-pointer"
          >
            GPS Live Radar
          </button>
        </nav>

        {/* Right: Controls & Primary Action Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* State Pill Button */}
          <button
            type="button"
            onClick={() => {
              playHapticSound("click");
              onOpenStateModal();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1a56db] border border-[#bae6fd] hover:bg-[#dbeafe] transition-all cursor-pointer"
            title="Change Indian State (All 36 States & UTs)"
          >
            <MapPin className="w-3 h-3 text-[#1a56db]" />
            <span className="hidden sm:inline">{currentState.shortCode} - {currentState.name}</span>
            <span className="sm:hidden">{currentState.shortCode}</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex bg-[#e2e8f0]/60 p-0.5 rounded-full border border-[rgba(0,0,0,0.08)]">
            <button
              id="header-role-chw"
              type="button"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("CHW");
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                currentRole === "CHW"
                  ? "bg-[#0c2b64] text-white shadow-xs font-semibold"
                  : "text-[#475569] hover:text-[#0a192f]"
              }`}
            >
              CHW
            </button>
            <button
              id="header-role-doctor"
              type="button"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("DOCTOR");
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                currentRole === "DOCTOR"
                  ? "bg-[#0c2b64] text-white shadow-xs font-semibold"
                  : "text-[#475569] hover:text-[#0a192f]"
              }`}
            >
              Doctor
            </button>
          </div>

          {/* Language Selector Dropdown (22 Languages) */}
          <div className="flex items-center relative">
            <select
              id="header-language-select"
              value={language}
              onChange={(e) => {
                playHapticSound("click");
                onLanguageChange(e.target.value as SupportedLanguage);
              }}
              className="appearance-none bg-white px-2.5 py-1.5 pr-6 rounded-full text-xs font-medium text-[#0a192f] border border-[rgba(0,0,0,0.12)] focus:outline-none focus:border-[#1a56db] cursor-pointer max-w-[85px] sm:max-w-[110px]"
              title="Select Language (22 Official Indian Languages)"
            >
              {ALL_INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
            <Languages className="w-3 h-3 text-[#475569] absolute right-2 pointer-events-none" />
          </div>

          {/* Sync Button if offline queue exists */}
          {offlineQueue.length > 0 && (
            <button
              id="header-btn-sync"
              type="button"
              onClick={() => {
                playHapticSound("step");
                onSyncOfflineQueue();
              }}
              disabled={isSyncing}
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync ({offlineQueue.length})</span>
            </button>
          )}

          {/* Right Primary Button (Specification: Primary "Contact Us" / "Emergency SOS" with right arrow icon, background #0c2b64, hover #133a80, fully rounded 9999px) */}
          {onTriggerEmergencySos ? (
            <button
              id="header-floating-emergency-sos-btn"
              type="button"
              onClick={() => {
                playHapticSound("alert");
                onTriggerEmergencySos();
              }}
              className="group inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer shadow-xs"
              style={{
                backgroundColor: "#0c2b64",
                color: "#ffffff",
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.88rem",
                gap: "0.45rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#133a80";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0c2b64";
                e.currentTarget.style.transform = "translateY(0)";
              }}
              title="Alert and dispatch 108 Emergency Ambulance immediately"
            >
              <Siren className="w-3.5 h-3.5 text-red-400" />
              <span>SOS Dispatch</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playHapticSound("click");
                onNewAssessment();
              }}
              className="group inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer shadow-xs"
              style={{
                backgroundColor: "#0c2b64",
                color: "#ffffff",
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                fontSize: "0.88rem",
                gap: "0.45rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#133a80";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0c2b64";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>New Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
