import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles, Activity, ShieldCheck, Wifi, MapPin } from "lucide-react";

interface NodeData {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  color: string;
  pulseSpeed: number;
}

const NETWORK_NODES: NodeData[] = [
  { id: "patient", name: "Patient Home", role: "Rural Hamlet (Rampur)", position: [-2.6, 1.2, 0], color: "#38BDF8", pulseSpeed: 1.8 },
  { id: "chw", name: "Community Health Worker", role: "ASHA Mobile Unit", position: [-1.4, -1.5, 0.4], color: "#14B8A6", pulseSpeed: 2.2 },
  { id: "ambulance", name: "108 Ambulance", role: "GPS Telematics Active", position: [0.2, 1.8, -0.3], color: "#EF4444", pulseSpeed: 3.0 },
  { id: "phc", name: "Primary Health Centre", role: "First Triage Post", position: [1.6, -1.3, 0.2], color: "#F59E0B", pulseSpeed: 2.0 },
  { id: "hospital", name: "District Hospital", role: "Advanced ICU & Surgery", position: [2.5, 1.1, -0.2], color: "#3B82F6", pulseSpeed: 1.9 },
  { id: "doctor", name: "Doctor Command Center", role: "Live Clinical Oversight", position: [0, -2.1, -0.4], color: "#8B5CF6", pulseSpeed: 2.4 },
];

function CentralCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.4;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.2;
      const s = 1 + Math.sin(t * 2.5) * 0.05;
      meshRef.current.scale.set(s, s, s);
    }
    if (glowRef.current) {
      glowRef.current.rotation.y = -t * 0.2;
      const gs = 1.35 + Math.sin(t * 3) * 0.08;
      glowRef.current.scale.set(gs, gs, gs);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Central Solid Icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          color="#06B6D4"
          emissive="#0891B2"
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      {/* Translucent Outer Shield Wireframe */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.85, 24, 24]} />
        <meshBasicMaterial
          color="#38BDF8"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>
    </group>
  );
}

function NodeSphere({
  node,
  isSelected,
  onSelect,
}: {
  node: NodeData;
  isSelected: boolean;
  onSelect: (node: NodeData) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.8;
      const scale = isSelected ? 1.35 : 1 + Math.sin(t * node.pulseSpeed) * 0.08;
      meshRef.current.scale.set(scale, scale, scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.2;
      const ringScale = 1.4 + Math.sin(t * node.pulseSpeed * 1.5) * 0.2;
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
    }
  });

  return (
    <group
      position={node.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 2.0 : 1.1}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>
      {/* Pulsing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.44, 24]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isSelected ? 0.85 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function ConnectionLine({
  target,
  color,
}: {
  target: [number, number, number];
  color: string;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const midPoint: [number, number, number] = [
      target[0] * 0.5,
      target[1] * 0.5 + 0.3,
      target[2] * 0.5 + 0.1,
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...target)
    );
  }, [target]);

  const points = useMemo(() => curve.getPoints(30), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  useFrame(({ clock }) => {
    const t = (clock.getElapsedTime() * 0.4) % 1;
    if (pulseRef.current) {
      const p = curve.getPointAt(t);
      pulseRef.current.position.copy(p);
    }
  });

  return (
    <group>
      <primitive
        object={
          new THREE.Line(
            geometry,
            new THREE.LineBasicMaterial({
              color: new THREE.Color(color),
              transparent: true,
              opacity: 0.38,
            })
          )
        }
        ref={lineRef}
      />
      {/* Animated Traveling Pulse along the connection line */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function NetworkField({
  onSelectNode,
  selectedNode,
}: {
  onSelectNode: (node: NodeData) => void;
  selectedNode: NodeData | null;
}) {
  return (
    <group>
      <CentralCore />
      {NETWORK_NODES.map((node) => (
        <React.Fragment key={node.id}>
          <ConnectionLine target={node.position} color={node.color} />
          <NodeSphere
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={onSelectNode}
          />
        </React.Fragment>
      ))}
    </group>
  );
}

export function StaticCareNetworkIllustration() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900/80 to-[#07111F]">
      <div className="relative w-28 h-28 rounded-full border-2 border-cyan-500/40 flex items-center justify-center bg-cyan-950/30 mb-4 shadow-xl shadow-cyan-950/40">
        <Activity className="w-12 h-12 text-cyan-400 animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/50 animate-spin" />
      </div>
      <p className="text-sm font-bold text-white tracking-wide">ArogyaSeva Care Command Network</p>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        Connecting rural patients, ASHA frontline workers, 108 emergency dispatch, and district hospital doctors in real-time.
      </p>
    </div>
  );
}

export const CareNetworkScene: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(NETWORK_NODES[0]);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    const lowPower =
      typeof navigator !== "undefined" &&
      ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
        (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches));

    if (lowPower) setIsLowPower(true);
  }, []);

  if (!hasWebGL || isLowPower) {
    return <StaticCareNetworkIllustration />;
  }

  return (
    <div className="relative w-full h-[280px] sm:h-[320px] rounded-3xl overflow-hidden bg-[#07111F] border border-slate-800/80 shadow-2xl">
      {/* Canvas 3D View */}
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 48 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 3]} intensity={4.5} color="#38BDF8" />
        <pointLight position={[-4, 3, 2]} intensity={2.0} color="#14B8A6" />
        <pointLight position={[4, -3, 2]} intensity={2.0} color="#EF4444" />
        <NetworkField
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNode={selectedNode}
        />
      </Canvas>

      {/* Top HUD Overlay */}
      <div className="pointer-events-none absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-500/30 text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold tracking-wider">CARE COMMAND TOPOLOGY</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-slate-400">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>6 Active Nodes Connected</span>
        </div>
      </div>

      {/* Bottom Selected Node Telemetry Banner */}
      <div className="absolute bottom-3 left-4 right-4 bg-slate-950/85 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: `${selectedNode?.color || "#38BDF8"}20`,
              borderColor: selectedNode?.color || "#38BDF8",
            }}
          >
            <MapPin className="w-4 h-4" style={{ color: selectedNode?.color || "#38BDF8" }} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              SELECTED NETWORK NODE
            </span>
            <span className="text-sm font-bold text-white block">
              {selectedNode?.name}
            </span>
            <span className="text-[11px] text-cyan-300">
              {selectedNode?.role}
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-right">
          <span className="text-[10px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full flex items-center gap-1 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            SYNCHRONIZED
          </span>
        </div>
      </div>
    </div>
  );
};
