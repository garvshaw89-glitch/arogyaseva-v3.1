import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RiskLevel } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";

export interface PatientJourneyTimeline3DProps {
  currentStage: number | string; // 1-6 or stage name
  onSelectStage?: (stage: number) => void;
  riskLevel?: RiskLevel;
}

const STAGES = [
  { id: 1, key: "patient", label: "Patient", sub: "Identification", icon: "👤" },
  { id: 2, key: "symptoms", label: "Symptoms", sub: "Voice Intake", icon: "🎙️" },
  { id: 3, key: "vitals", label: "Vitals", sub: "Pulse & BP", icon: "🩺" },
  { id: 4, key: "risk", label: "Risk Assessment", sub: "ETAT Decision", icon: "🛡️" },
  { id: 5, key: "referral", label: "Referral", sub: "GPS Hospital", icon: "📍" },
  { id: 6, key: "doctor", label: "Doctor", sub: "Care Command", icon: "🏥" },
];

function TimelineScene({
  activeStageIndex,
  riskLevel,
  onNodeClick,
}: {
  activeStageIndex: number; // 0-indexed (0 to 5)
  riskLevel: RiskLevel;
  onNodeClick: (stageId: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isUrgent = riskLevel === "URGENT";
  const isConsultation = riskLevel === "CONSULTATION";

  const urgentColor = "#EF4444";
  const warnColor = "#F59E0B";
  const successColor = "#22C55E";
  const activeColor = isUrgent ? urgentColor : isConsultation ? warnColor : "#38BDF8";
  const inactiveColor = "#334155";

  // Coordinates from -5.5 to 5.5
  const count = STAGES.length;
  const positions: [number, number, number][] = STAGES.map((_, i) => [
    -5.5 + (i * 11) / (count - 1),
    0,
    0,
  ]);

  return (
    <group ref={groupRef}>
      {/* Base Connection Rail */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[11.2, 0.05, 0.05]} />
        <meshBasicMaterial color="#1E293B" />
      </mesh>

      {/* Progress Glowing Line */}
      {activeStageIndex > 0 && (
        <mesh
          position={[
            -5.5 + ((activeStageIndex * 11) / (count - 1)) / 2,
            0,
            0,
          ]}
        >
          <boxGeometry
            args={[
              (activeStageIndex * 11) / (count - 1),
              0.08,
              0.08,
            ]}
          />
          <meshBasicMaterial color={successColor} />
        </mesh>
      )}

      {/* Nodes */}
      {STAGES.map((s, idx) => {
        const isCurrent = idx === activeStageIndex;
        const isCompleted = idx < activeStageIndex;
        const isRiskNode = s.key === "risk";
        const nodeColor = isCompleted
          ? successColor
          : isCurrent
          ? isRiskNode && isUrgent
            ? urgentColor
            : activeColor
          : inactiveColor;

        return (
          <JourneyNode
            key={s.id}
            stageId={s.id}
            position={positions[idx]}
            color={nodeColor}
            isCurrent={isCurrent}
            isCompleted={isCompleted}
            isUrgent={isUrgent && isRiskNode}
            onClick={() => onNodeClick(s.id)}
          />
        );
      })}
    </group>
  );
}

function JourneyNode({
  stageId,
  position,
  color,
  isCurrent,
  isCompleted,
  isUrgent,
  onClick,
}: {
  stageId: number;
  position: [number, number, number];
  color: string;
  isCurrent: boolean;
  isCompleted: boolean;
  isUrgent: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (isCurrent) {
      meshRef.current.rotation.y = t * 1.5;
      meshRef.current.rotation.x = Math.sin(t) * 0.2;
      const pulseSpeed = isUrgent ? 8 : 3.5;
      const s = 1.1 + Math.sin(t * pulseSpeed) * (isUrgent ? 0.2 : 0.08);
      meshRef.current.scale.set(s, s, s);
    } else if (isCompleted) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.set(0.9, 0.9, 0.9);
    } else {
      meshRef.current.scale.set(0.7, 0.7, 0.7);
    }

    if (ringRef.current && isCurrent) {
      ringRef.current.rotation.z = t * 2;
      const ringPulse = 1.4 + Math.sin(t * (isUrgent ? 8 : 4)) * 0.15;
      ringRef.current.scale.set(ringPulse, ringPulse, ringPulse);
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* 3D Geometry depending on stage */}
      <mesh ref={meshRef}>
        {stageId === 1 ? (
          <sphereGeometry args={[0.42, 16, 16]} />
        ) : stageId === 2 ? (
          <torusGeometry args={[0.32, 0.12, 12, 24]} />
        ) : stageId === 3 ? (
          <cylinderGeometry args={[0.35, 0.35, 0.25, 16]} />
        ) : stageId === 4 ? (
          <octahedronGeometry args={[0.44, 1]} />
        ) : stageId === 5 ? (
          <coneGeometry args={[0.35, 0.6, 16]} />
        ) : (
          <boxGeometry args={[0.55, 0.55, 0.55]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isCurrent ? 1.6 : isCompleted ? 0.9 : 0.3}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Dynamic Animated Ring on Active Node */}
      {isCurrent && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.65, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export const PatientJourneyTimeline3D: React.FC<PatientJourneyTimeline3DProps> = ({
  currentStage,
  onSelectStage,
  riskLevel = "ROUTINE",
}) => {
  // Translate stage prop
  let activeIndex = 0;
  if (typeof currentStage === "number") {
    activeIndex = Math.max(0, Math.min(5, currentStage - 1));
  } else if (typeof currentStage === "string") {
    const map: Record<string, number> = {
      patient: 0,
      symptoms: 1,
      vitals: 2,
      risk: 3,
      referral: 4,
      doctor: 5,
      chw: 1,
      assessment: 2,
    };
    activeIndex = map[currentStage.toLowerCase()] ?? 0;
  }

  const handleNodeClick = (stageId: number) => {
    playHapticSound("step");
    if (onSelectStage) {
      onSelectStage(stageId);
    }
  };

  return (
    <div className="relative bg-[#07111F]/95 border border-slate-800/90 rounded-2xl p-3 sm:p-4 backdrop-blur-xl shadow-2xl mb-6 overflow-hidden">
      {/* Header telemetry HUD */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/80 pb-2 mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-white tracking-widest uppercase">
            3D PATIENT JOURNEY TIMELINE
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>ACTIVE STAGE:</span>
          <span className="text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {STAGES[activeIndex].label} ({activeIndex + 1}/6)
          </span>
          {riskLevel === "URGENT" && (
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded font-bold animate-pulse">
              URGENT REFERRAL ACTIVATED
            </span>
          )}
        </div>
      </div>

      {/* 3D WebGL Canvas for the horizontal timeline */}
      <div className="w-full h-[72px] sm:h-[80px]">
        <Canvas camera={{ position: [0, 0, 7.8], fov: 42 }} gl={{ alpha: true }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[0, 0, 5]} intensity={3.5} color="#38BDF8" />
          <TimelineScene
            activeStageIndex={activeIndex}
            riskLevel={riskLevel}
            onNodeClick={handleNodeClick}
          />
        </Canvas>
      </div>

      {/* Interactive Node Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 mt-1">
        {STAGES.map((s, idx) => {
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;

          return (
            <button
              key={s.id}
              onClick={() => handleNodeClick(s.id)}
              className={`text-left p-2 rounded-xl transition-all border cursor-pointer ${
                isActive
                  ? "bg-slate-900/90 border-cyan-400 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                  : isDone
                  ? "bg-slate-950/50 border-emerald-500/30 text-slate-300 hover:border-emerald-500/50"
                  : "bg-slate-950/20 border-slate-850 text-slate-500 hover:text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className={isActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-400"}>
                  {s.icon} {s.label}
                </span>
                {isDone && <span className="text-[9px] text-emerald-400 font-mono">✓</span>}
              </div>
              <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">
                {s.sub}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
