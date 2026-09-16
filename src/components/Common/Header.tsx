import React from "react";
import { SupportedLanguage, PatientCase } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
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
  Zap
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
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <header id="main-app-header" className="bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-xs sticky top-0 z-40 transition-all duration-200">
      {/* Top Offline Notification Bar */}
      {isOfflineMode && (
        <div id="offline-alert-strip" className="bg-amber-500 text-amber-950 text-xs font-semibold px-4 py-1.5 flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>
              <strong>OFFLINE MODE ACTIVE:</strong> Autonomous WHO/IMCI decision algorithms in memory.
              {offlineQueue.length > 0 && ` (${offlineQueue.length} record(s) queued for sync)`}
            </span>
          </div>
          <button
            onClick={() => {
              playHapticSound("click");
              onToggleOffline();
            }}
            className="underline font-bold text-amber-950 hover:text-black text-xs ml-3 cursor-pointer"
          >
            Re-enable Cloud AI
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand and Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/25 relative overflow-hidden group shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 font-display flex items-center gap-1.5 truncate">
              <span>ArogyaSeva</span>
              <span className="text-blue-600 font-normal text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 hidden md:inline shrink-0">
                {currentRole === "CHW" ? "CHW Field Mesh" : "Hospital Command"}
              </span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden lg:block truncate">
              AI Rural Clinical Decision & Referral Network
            </p>
          </div>
        </div>

        {/* Right Section: Sync Badge, Role Toggle, Language, Worker Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Online/Offline Status Indicator Pill */}
          <button
            id="header-btn-network-toggle"
            onClick={() => {
              playHapticSound("click");
              onToggleOffline();
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isOfflineMode
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-xs"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-xs"
            }`}
            title="Toggle Network connectivity simulation"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${isOfflineMode ? "bg-amber-500" : "bg-emerald-500 animate-ping"}`} />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wide hidden xs:inline">
              {isOfflineMode ? "OFFLINE" : "CLOUD"}
            </span>
          </button>

          {/* Sync Button if queue exists */}
          {offlineQueue.length > 0 && (
            <button
              id="header-btn-sync"
              onClick={() => {
                playHapticSound("step");
                onSyncOfflineQueue();
              }}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1 sm:gap-1.5 animate-bounce shadow-xs transition-colors cursor-pointer"
              title="Sync pending local records with central cloud"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>({offlineQueue.length})</span>
            </button>
          )}

          {/* New Assessment Button */}
          {currentRole === "CHW" && (
            <button
              id="header-btn-new-patient"
              onClick={() => {
                playHapticSound("click");
                onNewAssessment();
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 hover:scale-[1.02] cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New Intake</span>
            </button>
          )}

          {onOpenLiveTracker && (
            <button
              id="header-btn-live-tracker"
              onClick={() => {
                playHapticSound("click");
                onOpenLiveTracker();
              }}
              className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs hover:scale-[1.02]"
              title="Open Live Location Tracker & OSM Hospital Radar"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono text-[11px]">GPS Radar</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100/90 rounded-lg border border-slate-200 px-1.5 sm:px-2 py-1 shadow-2xs">
            <Languages className="w-3.5 h-3.5 text-slate-500 mr-0.5 sm:mr-1 shrink-0" />
            <select
              id="header-language-select"
              value={language}
              onChange={(e) => {
                playHapticSound("click");
                onLanguageChange(e.target.value as SupportedLanguage);
              }}
              className="bg-transparent text-[11px] sm:text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex bg-slate-100/90 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
            <button
              id="header-role-chw"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("CHW");
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentRole === "CHW"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">CHW</span>
            </button>
            <button
              id="header-role-doctor"
              onClick={() => {
                playHapticSound("click");
                onRoleChange("DOCTOR");
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                currentRole === "DOCTOR"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Doctor</span>
            </button>
          </div>

          {/* Worker / Doctor Badge */}
          <div className="hidden xl:flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <div className="text-right leading-tight">
              <p className="text-xs font-bold text-slate-800">
                {currentRole === "CHW" ? "Anjali Devi (ASHA)" : "Dr. S. K. Verma"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                {currentRole === "CHW" ? "SECTOR: RAMPUR" : "DISTRICT HOSPITAL"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
              {currentRole === "CHW" ? "AD" : "DR"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
