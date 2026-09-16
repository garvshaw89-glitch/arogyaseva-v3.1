import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RiskLevel } from "../../types";
import { playHapticSound } from "../../utils/audioFeedback";

interface PatientJourney3DProps {
  currentStage: number; // 1: Patient, 2: CHW Intake, 3: Dynamic Followup, 4: Risk Engine, 5: 3D Referral, 6: Doctor
  onSelectStage?: (stage: number) => void;
  riskLevel?: RiskLevel;
}

const STAGES = [
  { id: 1, label: "Patient Origin", village: "Rampur Hamlet", icon: "👤" },
  { id: 2, label: "ASHA / CHW Intake", village: "Voice & Vitals", icon: "🩺" },
  { id: 3, label: "Dynamic Triage", village: "ETAT Protocols", icon: "⚡" },
  { id: 4, label: "Clinical Risk Engine", village: "Decision Support", icon: "🔮" },
  { id: 5, label: "Referral Network", village: "Hospital Network", icon: "🏥" },
  { id: 6, label: "Doctor Command", village: "District Hospital", icon: "👨‍⚕️" },
];

export const PatientJourney3D: React.FC<PatientJourney3DProps> = ({
  currentStage,
  onSelectStage,
  riskLevel = "ROUTINE",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = 90;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Nodes along X axis (-7.5 to 7.5)
    const nodeCount = 6;
    const spacing = 15 / (nodeCount - 1);
    const nodePositions: THREE.Vector3[] = [];
    const meshes: THREE.Mesh[] = [];

    const activeColor =
      riskLevel === "URGENT" ? 0xef4444 : riskLevel === "CONSULTATION" ? 0xf59e0b : 0x06b6d4;
    const inactiveColor = 0x334155;

    for (let i = 0; i < nodeCount; i++) {
      const x = -7.5 + i * spacing;
      const pos = new THREE.Vector3(x, 0, 0);
      nodePositions.push(pos);

      const isCurrent = i + 1 === currentStage;
      const isPast = i + 1 < currentStage;

      const geo = new THREE.SphereGeometry(isCurrent ? 0.6 : 0.38, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: isCurrent ? activeColor : isPast ? 0x38bdf8 : inactiveColor,
        wireframe: !isCurrent,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      group.add(mesh);
      meshes.push(mesh);
    }

    // Glowing Curve connecting all nodes
    const curve = new THREE.CatmullRomCurve3(nodePositions);
    const points = curve.getPoints(80);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    group.add(line);

    // Traveling glowing energy packet representing the patient case
    const packetGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({
      color: activeColor,
    });
    const packetMesh = new THREE.Mesh(packetGeo, packetMat);
    group.add(packetMesh);

    let frameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = (clock.getElapsedTime() * 0.25) % 1;
      const packetPos = curve.getPointAt(t);
      packetMesh.position.copy(packetPos);

      // Pulse active stage node
      const currentMesh = meshes[currentStage - 1];
      if (currentMesh) {
        const pulse = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        currentMesh.scale.set(pulse, pulse, pulse);
      }

      renderer.render(scene, camera);
    };

    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) {
          camera.aspect = w / height;
          camera.updateProjectionMatrix();
          renderer.setSize(w, height);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentStage, riskLevel]);

  return (
    <div className="relative bg-slate-950/90 border border-slate-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-2xl mb-6 overflow-hidden">
      {/* HUD Bar */}
      <div className="flex items-center justify-between text-[10px] font-mono border-b border-slate-800/70 pb-2 mb-2 text-slate-400 flex-wrap gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold text-white tracking-widest uppercase">
            Clinical Pathway Architecture
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">STAGE:</span>
          <span className="text-cyan-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {currentStage} OF 6
          </span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">ZERO-SIGNAL ETAT ENABLED</span>
        </div>
      </div>

      {/* 3D WebGL Pathway Canvas */}
      <div ref={containerRef} className="w-full h-[70px] cursor-pointer" />

      {/* Interactive Stage Labels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 mt-1">
        {STAGES.map((s) => {
          const isActive = s.id === currentStage;
          const isPassed = s.id < currentStage;

          return (
            <button
              key={s.id}
              onClick={() => {
                playHapticSound("step");
                if (onSelectStage) onSelectStage(s.id);
              }}
              className={`text-left p-2 rounded-xl transition-all border cursor-pointer ${
                isActive
                  ? "bg-slate-900/90 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30"
                  : isPassed
                  ? "bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300"
                  : "bg-slate-950/20 border-slate-900 text-slate-500 hover:text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-slate-200">{s.icon} {s.label}</span>
              </div>
              <p className="text-[9px] font-mono text-cyan-400/80 mt-0.5 truncate">
                {s.village}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
