import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RiskLevel } from "../../types";

interface BioMatrix3DProps {
  riskLevel?: RiskLevel;
  className?: string;
  interactive?: boolean;
}

export const BioMatrix3D: React.FC<BioMatrix3DProps> = ({
  riskLevel = "ROUTINE",
  className = "",
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNodeName, setActiveNodeName] = useState<string>("Network Mesh Active");
  const [fpsActive, setFpsActive] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio < 2, // optimize for high dpi
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Group for the entire constellation
    const group = new THREE.Group();
    scene.add(group);

    // Determine colors based on riskLevel
    let primaryColorHex = 0x06b6d4; // Cyan for routine
    let accentColorHex = 0x2563eb;  // Blue
    if (riskLevel === "URGENT") {
      primaryColorHex = 0xef4444; // Red
      accentColorHex = 0xf97316;  // Orange
    } else if (riskLevel === "CONSULTATION") {
      primaryColorHex = 0xf59e0b; // Amber
      accentColorHex = 0xd97706;  // Gold
    }

    // 1. Central Pulsing Bio-Core (Icosahedron Wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(4.8, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: primaryColorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    group.add(coreMesh);

    // Inner Glow Core
    const innerGeo = new THREE.OctahedronGeometry(2.4, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: accentColorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // 2. Outer Node Constellation (Points & Connection lines representing referral health network)
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    const nodeVectors: THREE.Vector3[] = [];

    const radius = 9.5;
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi) + (Math.random() - 0.5) * 1.5;
      const y = radius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * 1.5;
      const z = radius * Math.cos(phi) + (Math.random() - 0.5) * 1.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      nodeVectors.push(new THREE.Vector3(x, y, z));
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const pointsMat = new THREE.PointsMaterial({
      color: primaryColorHex,
      size: 0.55,
      transparent: true,
      opacity: 0.9,
    });
    const pointsMesh = new THREE.Points(pointsGeo, pointsMat);
    group.add(pointsMesh);

    // 3. Dynamic Lines Connecting Nearest Healthcare Nodes
    const lineIndices: number[] = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dist = nodeVectors[i].distanceTo(nodeVectors[j]);
        if (dist < 5.2) {
          lineIndices.push(i, j);
        }
      }
    }

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    linesGeo.setIndex(lineIndices);

    const linesMat = new THREE.LineBasicMaterial({
      color: accentColorHex,
      transparent: true,
      opacity: 0.22,
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    group.add(linesMesh);

    // 4. Subtle Orbital Ring
    const ringGeo = new THREE.RingGeometry(11, 11.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: primaryColorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 3;
    group.add(ringMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      targetRotationY = x * 0.8;
      targetRotationX = y * 0.8;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
    }

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth inertia rotation
      group.rotation.y += (targetRotationY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;

      if (!prefersReducedMotion) {
        group.rotation.y += 0.003;
        coreMesh.rotation.y -= 0.006;
        coreMesh.rotation.x += 0.004;

        innerMesh.rotation.y += 0.01;
        innerMesh.rotation.z -= 0.008;

        // Subtle Bio-rhythm scale pulse
        const pulseRate = riskLevel === "URGENT" ? 5 : 2.2;
        const pulseAmp = riskLevel === "URGENT" ? 0.08 : 0.04;
        const scale = 1 + Math.sin(elapsedTime * pulseRate) * pulseAmp;
        coreMesh.scale.set(scale, scale, scale);
        innerMesh.scale.set(scale * 1.1, scale * 1.1, scale * 1.1);

        ringMesh.rotation.z += 0.002;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      pointsGeo.dispose();
      pointsMat.dispose();
      linesGeo.dispose();
      linesMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [riskLevel, interactive]);

  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Holographic Telemetry Label */}
      <div className="absolute bottom-2.5 left-3 pointer-events-none flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full animate-ping ${
            riskLevel === "URGENT"
              ? "bg-red-500"
              : riskLevel === "CONSULTATION"
              ? "bg-amber-400"
              : "bg-cyan-400"
          }`}
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs border border-slate-700/60 shadow-xs">
          {riskLevel === "URGENT"
            ? "BIO-NODE: EMERGENCY TRAJECTORY"
            : riskLevel === "CONSULTATION"
            ? "BIO-NODE: MO CONSULTATION QUEUE"
            : "BIO-NODE: RURAL HEALTHCARE MESH"}
        </span>
      </div>
    </div>
  );
};
