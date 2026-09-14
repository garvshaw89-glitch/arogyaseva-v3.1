import React, { useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Sparkles, ChevronUp, ChevronDown, CheckCircle2 } from "lucide-react";
import { playHapticSound } from "../../utils/audioFeedback";

interface HackathonDemoControllerProps {
  currentDemoStep: number;
  onJumpToStep: (stepNumber: number) => void;
  onResetDemo: () => void;
}

const DEMO_STEPS = [
  { step: 1, title: "3D Mission Control", desc: "Cinematic 3D rural health network overview" },
  { step: 2, title: "Voice-First Intake", desc: "52Y Male - Spoken Hindi/English audio stream" },
  { step: 3, title: "AI Extraction", desc: "Voice transforms into structured clinical variables" },
  { step: 4, title: "Dynamic Questions", desc: "WHO ETAT prompts: Respiratory difficulty = YES" },
  { step: 5, title: "Critical SpO₂ Entry", desc: "Vitals gauge captures hypoxemia at 88%" },
  { step: 6, title: "3D Risk Engine", desc: "Vortex activates: 🔴 URGENT EMERGENCY RED TRIAGE" },
  { step: 7, title: "Transparent Reasoning", desc: "Auditable clinical rationale & stabilizing protocol" },
  { step: 8, title: "3D Referral Map", desc: "Village-to-Hospital 3D route trajectory & match" },
  { step: 9, title: "Digital SBAR Slip", desc: "Encrypted transfer token & ambulance dispatch" },
  { step: 10, title: "Doctor Command", desc: "Hospital team reviews incoming priority case" },
];

export const HackathonDemoController: React.FC<HackathonDemoControllerProps> = ({
  currentDemoStep,
  onJumpToStep,
  onResetDemo,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeStepObj = DEMO_STEPS.find((s) => s.step === currentDemoStep) || DEMO_STEPS[0];

  const handleNext = () => {
    playHapticSound("step");
    if (currentDemoStep < DEMO_STEPS.length) {
      onJumpToStep(currentDemoStep + 1);
    } else {
      onJumpToStep(1);
    }
  };

  const handlePrev = () => {
    playHapticSound("click");
    if (currentDemoStep > 1) {
      onJumpToStep(currentDemoStep - 1);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
      <div className="bg-slate-950/95 border border-cyan-500/40 rounded-2xl shadow-2xl p-3 backdrop-blur-xl ring-1 ring-cyan-500/20">
        <div className="flex items-center justify-between gap-3">
          {/* Badge and Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                  SIH HACKATHON DEMO WALKTHROUGH
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  STEP {currentDemoStep}/10
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">
                {activeStepObj.title}: <span className="text-slate-300 font-normal">{activeStepObj.desc}</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="btn-demo-prev"
              onClick={handlePrev}
              disabled={currentDemoStep <= 1}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer"
              title="Previous Step"
            >
              Prev
            </button>

            <button
              id="btn-demo-next"
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-lg shadow-md shadow-cyan-600/30 flex items-center gap-1.5 cursor-pointer"
              title="Next Hackathon Step"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-demo-toggle-drawer"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 cursor-pointer"
              title="Toggle Step Drawer"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded 10-Step Timeline Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto">
            {DEMO_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  playHapticSound("click");
                  onJumpToStep(s.step);
                }}
                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                  s.step === currentDemoStep
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/40 font-bold"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span>STEP {s.step}</span>
                  {s.step < currentDemoStep && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </div>
                <p className="text-[11px] font-semibold truncate mt-0.5">{s.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
