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
  UserCheck
} from "lucide-react";

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
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <header id="main-app-header" className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
      {/* Top Offline Notification Bar */}
      {isOfflineMode && (
        <div id="offline-alert-strip" className="bg-amber-500 text-amber-950 text-xs font-semibold px-4 py-1.5 flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>OFFLINE MODE ACTIVE:</strong> Running local WHO/IMCI decision algorithms.
              {offlineQueue.length > 0 && ` (${offlineQueue.length} record(s) in local sync queue)`}
            </span>
          </div>
          <button
            onClick={onToggleOffline}
            className="underline font-bold text-amber-950 hover:text-black text-xs ml-3"
          >
            Re-enable Online AI
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand and Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg sm:text-xl tracking-tight text-slate-800 flex items-center gap-1.5">
              SevaSetu
              <span className="text-blue-600 font-normal text-sm sm:text-base hidden sm:inline">
                | {currentRole === "CHW" ? "CHW Field Assistant" : "District Doctor Portal"}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              AI Rural Clinical Decision & Referral Network
            </p>
          </div>
        </div>

        {/* Right Section: Sync Badge, Role Toggle, Language, Worker Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Online/Offline Status Indicator Pill */}
          <button
            id="header-btn-network-toggle"
            onClick={onToggleOffline}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              isOfflineMode
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
            title="Toggle Network connectivity simulation"
          >
            <div className={`w-2 h-2 rounded-full ${isOfflineMode ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span className="text-[11px] uppercase tracking-wide">
              {isOfflineMode ? "OFFLINE READY" : "CLOUD SYNCED"}
            </span>
          </button>

          {/* Sync Button if queue exists */}
          {offlineQueue.length > 0 && (
            <button
              id="header-btn-sync"
              onClick={onSyncOfflineQueue}
              disabled={isSyncing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-bounce shadow-xs transition-colors"
              title="Sync pending local records with central cloud"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Sync ({offlineQueue.length})</span>
            </button>
          )}

          {/* New Assessment Button */}
          {currentRole === "CHW" && (
            <button
              id="header-btn-new-patient"
              onClick={onNewAssessment}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shadow-blue-200"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Assessment</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 px-2 py-1">
            <Languages className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <select
              id="header-language-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="mr">मराठी (MR)</option>
              <option value="bn">বাংলা (BN)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="te">తెలుగు (TE)</option>
            </select>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              id="header-role-chw"
              onClick={() => onRoleChange("CHW")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                currentRole === "CHW"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CHW</span>
            </button>
            <button
              id="header-role-doctor"
              onClick={() => onRoleChange("DOCTOR")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                currentRole === "DOCTOR"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Doctor</span>
            </button>
          </div>

          {/* Worker / Doctor Badge */}
          <div className="hidden lg:flex items-center gap-2.5 border-l border-slate-200 pl-3">
            <div className="text-right leading-tight">
              <p className="text-xs font-bold text-slate-800">
                {currentRole === "CHW" ? "Anjali Devi (ASHA)" : "Dr. S. K. Verma"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                {currentRole === "CHW" ? "SECTOR: RAMPUR" : "DISTRICT HOSPITAL"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
              {currentRole === "CHW" ? "AD" : "DR"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
