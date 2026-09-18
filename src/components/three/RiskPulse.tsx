import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RiskLevel } from "../../types";

interface RiskPulseProps {
  riskLevel: RiskLevel;
  riskScore?: number;
}

function RiskCore({ riskLevel }: { riskLevel: RiskLevel }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);

  const isUrgent = riskLevel === "URGENT";
  const isConsultation = riskLevel === "CONSULTATION";

  // Visual parameters depending on risk level
  const color = isUrgent ? "#EF4444" : isConsultation ? "#F59E0B" : "#14B8A6";
  const emissive = isUrgent ? "#B91C1C" : isConsultation ? "#D97706" : "#0D9488";
  const speed = isUrgent ? 6.5 : isConsultation ? 3.5 : 1.8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (coreRef.current) {
      coreRef.current.rotation.y = t * (isUrgent ? 1.4 : 0.6);
      coreRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
      const pulseScale = 1 + Math.sin(t * speed) * (isUrgent ? 0.16 : isConsultation ? 0.09 : 0.04);
      coreRef.current.scale.set(pulseScale, pulseScale, pulseScale);
    }

    if (ringRef1.current) {
      ringRef1.current.rotation.z = t * (isUrgent ? 2.5 : 1.2);
      const ringScale = 1.35 + Math.sin(t * speed * 0.8) * (isUrgent ? 0.25 : 0.12);
      ringRef1.current.scale.set(ringScale, ringScale, ringScale);
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.x = t * (isUrgent ? -2.0 : -0.8);
      const ringScale2 = 1.65 + Math.cos(t * speed * 0.7) * (isUrgent ? 0.3 : 0.15);
      ringRef2.current.scale.set(ringScale2, ringScale2, ringScale2);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central 3D Core Shield */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.9, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={isUrgent ? 2.0 : isConsultation ? 1.4 : 1.0}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>

      {/* Inner Rotating Ring */}
      <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.2, 0.04, 16, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isUrgent ? 0.9 : 0.6}
        />
      </mesh>

      {/* Outer Rotating Halo Ring */}
      <mesh ref={ringRef2} rotation={[-Math.PI / 4, 0, 0]}>
        <torusGeometry args={[1.5, 0.03, 16, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isUrgent ? 0.75 : 0.4}
        />
      </mesh>
    </group>
  );
}

export const RiskPulse: React.FC<RiskPulseProps> = ({ riskLevel, riskScore }) => {
  const isUrgent = riskLevel === "URGENT";
  const isConsultation = riskLevel === "CONSULTATION";

  const statusLabel = isUrgent
    ? "URGENT"
    : isConsultation
    ? "MONITOR"
    : "STABLE";

  const subtitle = isUrgent
    ? "Refer patient immediately"
    : isConsultation
    ? "Further review & vitals check needed"
    : "Risk is low. Continue routine monitoring";

  const badgeColor = isUrgent
    ? "bg-red-500/20 text-red-400 border-red-500/40"
    : isConsultation
    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
    : "bg-teal-500/20 text-teal-300 border-teal-500/40";

  return (
    <div className="relative w-full h-[220px] sm:h-[240px] rounded-2xl overflow-hidden bg-[#07111F] border border-slate-800 flex items-center justify-center shadow-2xl">
      {/* Background Soft Glow */}
      <div
        className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-500 ${
          isUrgent ? "bg-red-600" : isConsultation ? "bg-amber-600" : "bg-teal-600"
        }`}
      />

      {/* 3D WebGL Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} gl={{ alpha: true }}>
          <ambientLight intensity={0.6} />
          <pointLight
            position={[2, 2, 3]}
            intensity={4}
            color={isUrgent ? "#EF4444" : isConsultation ? "#F59E0B" : "#14B8A6"}
          />
          <RiskCore riskLevel={riskLevel} />
        </Canvas>
      </div>

      {/* Foreground Semantic HUD */}
      <div className="relative z-10 pointer-events-none text-center px-4">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black border tracking-widest ${badgeColor}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isUrgent
                ? "bg-red-500 animate-ping"
                : isConsultation
                ? "bg-amber-400"
                : "bg-teal-400"
            }`}
          />
          {statusLabel}
        </span>
        <h3 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
          {isUrgent ? "CRITICAL EMERGENCY PROTOCOL" : isConsultation ? "CLINICAL MONITORING ADVICE" : "ROUTINE COMMUNITY STABLE"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-0.5 font-medium">
          {subtitle}
        </p>
        {typeof riskScore === "number" && (
          <span className="text-[11px] font-mono text-slate-400 block mt-1">
            ETAT Risk Severity Score: <strong className="text-white">{riskScore}/100</strong>
          </span>
        )}
      </div>
    </div>
  );
};
