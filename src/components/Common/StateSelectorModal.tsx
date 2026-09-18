import React, { useState } from "react";
import { INDIAN_STATES, IndianStateData } from "../../data/indianStates";
import { SupportedLanguage } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";
import {
  MapPin,
  Search,
  CheckCircle2,
  Building2,
  UserCheck,
  Languages,
  X,
  Compass,
  Sparkles,
} from "lucide-react";

interface StateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: IndianStateData;
  onSelectState: (state: IndianStateData, autoSwitchLanguage?: boolean) => void;
  currentLanguage: SupportedLanguage;
}

export const StateSelectorModal: React.FC<StateSelectorModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onSelectState,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("All");

  if (!isOpen) return null;

  const zones = ["All", "West", "North", "South", "East", "Central", "North-East", "Union Territory"];

  const filteredStates = INDIAN_STATES.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.regionFocus.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.ashaUnit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.hospital.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesZone = selectedZone === "All" || st.zone === selectedZone;

    return matchesSearch && matchesZone;
  });

  return (
    <div
      id="modal-state-selector-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="modal-state-selector-dialog"
        className="bg-[#0B1527] border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-cyan-200 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-mono">
                  SELECT INDIAN STATE & REGIONAL SYSTEM
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono">
                  36 States & UTs
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switches the regional ASHA health worker, referral hospital network, and default triage coordinates.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playHapticSound("click");
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Zone Filter Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="state-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by state (e.g. Mumbai, Maharashtra, Delhi, Bengaluru, Gujarat, Kolkata)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          {/* Zone Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => {
                  playHapticSound("click");
                  setSelectedZone(zone);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedZone === zone
                    ? "bg-cyan-600 text-white shadow-xs font-bold"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {zone === "Union Territory" ? "UTs (8)" : zone}
              </button>
            ))}
          </div>
        </div>

        {/* States Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[58vh]">
          {filteredStates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-bounce" />
              <p className="text-base font-semibold">No Indian states found matching &quot;{searchQuery}&quot;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for Maharashtra, Delhi, Karnataka, Tamil Nadu, etc.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStates.map((st) => {
                const isSelected = currentState.id === st.id;
                const isMaharashtraMumbai = st.id === "maharashtra";

                return (
                  <button
                    key={st.id}
                    id={`state-card-${st.id}`}
                    onClick={() => {
                      playHapticSound("success");
                      onSelectState(st, true);
                      onClose();
                    }}
                    className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 relative group cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border-cyan-500/80 shadow-lg shadow-cyan-950/50"
                        : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Top Row: State Name, Badge & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-xs flex items-center justify-center text-cyan-300 shrink-0">
                          {st.shortCode}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white group-hover:text-cyan-200 transition-colors">
                              {st.name}
                            </span>
                            {isMaharashtraMumbai && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                                PRIMARY ASHA
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">{st.regionFocus}</p>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 uppercase font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-800 shrink-0">
                          {st.zone}
                        </span>
                      )}
                    </div>

                    {/* Middle: ASHA Health Worker & Hospital Link */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">
                          <strong className="text-slate-200">{st.ashaWorker}</strong> • {st.ashaUnit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{st.hospital}</span>
                      </div>
                    </div>

                    {/* Bottom: Regional Language & Default Base */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Languages className="w-3 h-3 text-cyan-400" />
                        Primary: <span className="text-slate-200 font-semibold uppercase font-mono">{st.primaryLanguage}</span>
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono truncate max-w-[180px]">
                        📍 {st.defaultVillage}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Selecting a state dynamically re-assigns the ASHA health circle, referral tertiary hospital, and regional clinical triage profile.
            </span>
          </div>
          <button
            onClick={() => {
              playHapticSound("click");
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
