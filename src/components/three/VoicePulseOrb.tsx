import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

interface VoicePulseOrbProps {
  isListening: boolean;
  intensity?: number;
}

export function VoicePulseOrb({
  isListening,
  intensity = 0.5,
}: VoicePulseOrbProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();
    const pulse = isListening
      ? 1 + Math.sin(time * 5) * 0.08 * intensity
      : 1 + Math.sin(time * 2) * 0.03;

    meshRef.current.scale.setScalar(pulse);
    meshRef.current.rotation.y += isListening ? 0.008 : 0.003;
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 3]} />
      <meshStandardMaterial
        color={isListening ? "#14B8A6" : "#3B82F6"}
        emissive={isListening ? "#0F766E" : "#1D4ED8"}
        emissiveIntensity={isListening ? 1.4 : 0.7}
        roughness={0.25}
        metalness={0.35}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
