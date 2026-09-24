import React, { useEffect, useRef, useState } from "react";

export interface MovingDnaCanvasProps {
  className?: string;
  speed?: number; // Speed multiplier (default 1)
  opacity?: number; // Overall canvas opacity (default 1)
  density?: "compact" | "normal" | "dense";
  colorScheme?: "clinical" | "cyan-mint" | "neon" | "monochrome";
  interactive?: boolean; // Mouse interaction
  showParticles?: boolean; // Molecular floating particles
  showSecondaryHelix?: boolean; // Subtle background secondary helix
  glowIntensity?: number; // 0 to 2 (default 1)
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  pulsePhase: number;
}

export const MovingDnaCanvas: React.FC<MovingDnaCanvasProps> = ({
  className = "",
  speed = 1,
  opacity = 1,
  density = "normal",
  colorScheme = "clinical",
  interactive = true,
  showParticles = true,
  showSecondaryHelix = true,
  glowIntensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mouse tilt tracking with smoothing
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) {
      setPrefersReducedMotion(true);
    }
    const handleMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener?.("change", handleMotion);
    return () => motionQuery.removeEventListener?.("change", handleMotion);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    // High DPI scaling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.parentElement.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    // Mouse listener
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      mouseRef.current.targetX = x;
      mouseRef.current.targetY = y;
    };

    const targetEl = containerRef.current?.parentElement || window;
    targetEl.addEventListener("mousemove", handleMouseMove as EventListener);

    // Visibility Observer to pause when scrolled out of view
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    if (canvas) observer.observe(canvas);

    // Generate Molecular Floating Particles
    const particleCount = showParticles ? Math.floor(Math.min(width, height) / 24) : 0;
    const particles: Particle[] = [];
    const colors =
      colorScheme === "neon"
        ? ["#00F2FE", "#4FACFE", "#00C2D7", "#19E6C1"]
        : colorScheme === "monochrome"
        ? ["#94A3B8", "#64748B", "#CBD5E1"]
        : ["#00C2D7", "#19E6C1", "#38BDF8", "#0284C7", "#14B8A6"];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.1, // subtle upward drift
        size: Math.random() * 2.5 + 1.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Animation variables
    let time = 0;
    const nodeCount =
      density === "compact" ? 28 : density === "dense" ? 54 : 40;

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const effectiveSpeed = prefersReducedMotion ? 0.002 : 0.014 * speed;
      time += effectiveSpeed;

      // -------------------------------------------------------------
      // 1. Draw Ambient Floating Molecular Particles
      // -------------------------------------------------------------
      if (showParticles) {
        ctx.save();
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          const pulse = Math.sin(time * 2 + p.pulsePhase) * 0.2 + 0.8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.6 * pulse;
          ctx.fill();

          // Subtle glowing halo for larger particles
          if (p.size > 2.2 && glowIntensity > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * 0.15 * glowIntensity;
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 2. Draw Secondary Subtle DNA Helix in Distance (Background layer)
      // -------------------------------------------------------------
      if (showSecondaryHelix) {
        renderHelix({
          ctx,
          width,
          height,
          time: time * 0.7 + 10,
          centerX: width * 0.2,
          centerY: height * 0.5,
          helixLength: height * 1.3,
          radius: Math.min(width, height) * 0.08,
          rotationAngle: -0.35 + mouseRef.current.x * 0.15,
          numNodes: Math.floor(nodeCount * 0.7),
          frequency: 3.2,
          tiltY: 0.2 + mouseRef.current.y * 0.1,
          opacityMultiplier: 0.28,
          glow: glowIntensity * 0.5,
          colorA: "#38BDF8",
          colorB: "#2DD4BF",
          isSecondary: true,
        });
      }

      // -------------------------------------------------------------
      // 3. Draw Primary High-Fidelity 3D Moving DNA Helix
      // -------------------------------------------------------------
      renderHelix({
        ctx,
        width,
        height,
        time: time,
        centerX: width * 0.72 + mouseRef.current.x * 40,
        centerY: height * 0.48 + mouseRef.current.y * 30,
        helixLength: height * 1.4,
        radius: Math.max(70, Math.min(145, width * 0.12)),
        rotationAngle: 0.42 + mouseRef.current.x * 0.35,
        numNodes: nodeCount,
        frequency: 4.0,
        tiltY: 0.35 + mouseRef.current.y * 0.25,
        opacityMultiplier: 0.85,
        glow: glowIntensity,
        colorA: "#00C2D7", // Electric Cyan
        colorB: "#19E6C1", // Medical Mint
        isSecondary: false,
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener("resize", handleResize);
      targetEl.removeEventListener("mousemove", handleMouseMove as EventListener);
      observer.disconnect();
    };
  }, [
    speed,
    density,
    colorScheme,
    interactive,
    showParticles,
    showSecondaryHelix,
    glowIntensity,
    prefersReducedMotion,
  ]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          filter: glowIntensity > 1 ? "drop-shadow(0 0 16px rgba(0, 194, 215, 0.3))" : "none",
        }}
      />
    </div>
  );
};

// ============================================================================
// HELPER: 3D Helix Projection & Multi-Pass Depth-Sorted Rendering
// ============================================================================
interface RenderHelixOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  centerX: number;
  centerY: number;
  helixLength: number;
  radius: number;
  rotationAngle: number; // Overall orientation tilt of helix in screen space
  numNodes: number;
  frequency: number; // How many turns along the length
  tiltY: number; // 3D pitch/yaw
  opacityMultiplier: number;
  glow: number;
  colorA: string;
  colorB: string;
  isSecondary: boolean;
}

interface ProjectedNode {
  screenX: number;
  screenY: number;
  depthZ: number; // -1 to 1 (depth)
  scale: number;
  color: string;
  strandIndex: 0 | 1;
  baseIndex: number;
}

interface ProjectedRung {
  nodeA: ProjectedNode;
  nodeB: ProjectedNode;
  midX: number;
  midY: number;
  avgZ: number;
  baseType: number; // 0: A-T, 1: G-C
}

function renderHelix(opts: RenderHelixOptions) {
  const {
    ctx,
    time,
    centerX,
    centerY,
    helixLength,
    radius,
    rotationAngle,
    numNodes,
    frequency,
    tiltY,
    opacityMultiplier,
    glow,
    colorA,
    colorB,
  } = opts;

  const nodesA: ProjectedNode[] = [];
  const nodesB: ProjectedNode[] = [];
  const rungs: ProjectedRung[] = [];

  const startY = -helixLength / 2;
  const stepY = helixLength / (numNodes - 1);

  // Cos and Sin for 2D screen-plane rotation
  const cosRot = Math.cos(rotationAngle);
  const sinRot = Math.sin(rotationAngle);

  // Step 1: Calculate 3D points and perspective projection
  for (let i = 0; i < numNodes; i++) {
    const localY = startY + i * stepY;
    const progress = i / (numNodes - 1);

    // Helix phase: combines continuous rotation with a traveling wave flow along Y
    const phase = progress * Math.PI * 2 * frequency + time * 2;

    // Strand A (phase) and Strand B (phase + PI)
    const sinA = Math.sin(phase);
    const cosA = Math.cos(phase);

    // 3D coordinates relative to helix center
    const xA3D = radius * cosA;
    const zA3D = radius * sinA; // Depth (-radius to +radius)
    const yA3D = localY + zA3D * tiltY * 0.4;

    const xB3D = radius * -cosA;
    const zB3D = radius * -sinA;
    const yB3D = localY + zB3D * tiltY * 0.4;

    // Perspective projection factor (fov = 400)
    const fov = 350;
    const scaleA = fov / (fov + zA3D);
    const scaleB = fov / (fov + zB3D);

    // 2D Rotation into screen coordinates
    const rotXA = xA3D * cosRot - yA3D * sinRot;
    const rotYA = xA3D * sinRot + yA3D * cosRot;

    const rotXB = xB3D * cosRot - yB3D * sinRot;
    const rotYB = xB3D * sinRot + yB3D * cosRot;

    const screenXA = centerX + rotXA;
    const screenYA = centerY + rotYA;

    const screenXB = centerX + rotXB;
    const screenYB = centerY + rotYB;

    const normZA = zA3D / radius; // -1 to 1
    const normZB = zB3D / radius;

    const nodeA: ProjectedNode = {
      screenX: screenXA,
      screenY: screenYA,
      depthZ: normZA,
      scale: scaleA,
      color: colorA,
      strandIndex: 0,
      baseIndex: i,
    };

    const nodeB: ProjectedNode = {
      screenX: screenXB,
      screenY: screenYB,
      depthZ: normZB,
      scale: scaleB,
      color: colorB,
      strandIndex: 1,
      baseIndex: i,
    };

    nodesA.push(nodeA);
    nodesB.push(nodeB);

    rungs.push({
      nodeA,
      nodeB,
      midX: (screenXA + screenXB) / 2,
      midY: (screenYA + screenYB) / 2,
      avgZ: (normZA + normZB) / 2,
      baseType: i % 2,
    });
  }

  // -----------------------------------------------------------------
  // Step 2: Draw Connecting Base-Pair Rungs (Depth-Sorted)
  // -----------------------------------------------------------------
  // Sort rungs from furthest back (avgZ < 0) to front (avgZ > 0)
  const sortedRungs = [...rungs].sort((a, b) => a.avgZ - b.avgZ);

  ctx.save();
  for (let i = 0; i < sortedRungs.length; i++) {
    const rung = sortedRungs[i];
    const { nodeA, nodeB, midX, midY, avgZ } = rung;

    // Opacity based on depth
    const depthFactor = (avgZ + 1) / 2; // 0 (back) to 1 (front)
    const baseAlpha = (0.2 + depthFactor * 0.65) * opacityMultiplier;
    const lineWidth = (1.2 + depthFactor * 1.8);

    // Gradient between Strand A color and Strand B color
    const grad = ctx.createLinearGradient(
      nodeA.screenX,
      nodeA.screenY,
      nodeB.screenX,
      nodeB.screenY
    );
    grad.addColorStop(0, hexToRgba(nodeA.color, baseAlpha));
    grad.addColorStop(0.45, hexToRgba(nodeA.color, baseAlpha * 0.9));
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${baseAlpha * 1.1})`);
    grad.addColorStop(0.55, hexToRgba(nodeB.color, baseAlpha * 0.9));
    grad.addColorStop(1, hexToRgba(nodeB.color, baseAlpha));

    ctx.beginPath();
    ctx.moveTo(nodeA.screenX, nodeA.screenY);
    ctx.lineTo(nodeB.screenX, nodeB.screenY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Central Hydrogen Bond Spark / Node
    const sparkAlpha = (0.3 + depthFactor * 0.7) * opacityMultiplier;
    const sparkRadius = (1.5 + depthFactor * 1.5);
    ctx.beginPath();
    ctx.arc(midX, midY, sparkRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
    ctx.fill();

    if (glow > 0 && depthFactor > 0.6) {
      ctx.beginPath();
      ctx.arc(midX, midY, sparkRadius * 3, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(nodeA.color, sparkAlpha * 0.25 * glow);
      ctx.fill();
    }
  }
  ctx.restore();

  // -----------------------------------------------------------------
  // Step 3: Draw Continuous Backbone Strands (Ribbon Curves)
  // -----------------------------------------------------------------
  drawBackboneRibbon(ctx, nodesA, colorA, opacityMultiplier, glow);
  drawBackboneRibbon(ctx, nodesB, colorB, opacityMultiplier, glow);

  // -----------------------------------------------------------------
  // Step 4: Draw Glowing Nucleotide Spheres / Nodes (Depth Sorted)
  // -----------------------------------------------------------------
  const allNodes = [...nodesA, ...nodesB].sort((a, b) => a.depthZ - b.depthZ);

  ctx.save();
  for (let i = 0; i < allNodes.length; i++) {
    const node = allNodes[i];
    const depthFactor = (node.depthZ + 1) / 2; // 0 to 1

    // Size scales with perspective
    const radiusNode = (2.2 + depthFactor * 3.8);
    const alpha = (0.25 + depthFactor * 0.75) * opacityMultiplier;

    // Glowing halo for front nodes
    if (glow > 0 && depthFactor > 0.45) {
      const haloRadius = radiusNode * (2.2 + glow * 1.2);
      const haloGrad = ctx.createRadialGradient(
        node.screenX,
        node.screenY,
        radiusNode * 0.5,
        node.screenX,
        node.screenY,
        haloRadius
      );
      haloGrad.addColorStop(0, hexToRgba(node.color, alpha * 0.45 * glow));
      haloGrad.addColorStop(0.5, hexToRgba(node.color, alpha * 0.15 * glow));
      haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(node.screenX, node.screenY, haloRadius, 0, Math.PI * 2);
      ctx.fillStyle = haloGrad;
      ctx.fill();
    }

    // Main nucleotide node sphere
    const sphereGrad = ctx.createRadialGradient(
      node.screenX - radiusNode * 0.35,
      node.screenY - radiusNode * 0.35,
      radiusNode * 0.1,
      node.screenX,
      node.screenY,
      radiusNode
    );
    sphereGrad.addColorStop(0, "#FFFFFF");
    sphereGrad.addColorStop(0.4, node.color);
    sphereGrad.addColorStop(1, hexToRgba(node.color, 0.7));

    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radiusNode, 0, Math.PI * 2);
    ctx.fillStyle = sphereGrad;
    ctx.globalAlpha = alpha;
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a smooth cubic spline ribbon connecting all nodes in a strand
 */
function drawBackboneRibbon(
  ctx: CanvasRenderingContext2D,
  nodes: ProjectedNode[],
  color: string,
  opacityMultiplier: number,
  glow: number
) {
  if (nodes.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(nodes[0].screenX, nodes[0].screenY);

  for (let i = 0; i < nodes.length - 1; i++) {
    const p0 = nodes[Math.max(0, i - 1)];
    const p1 = nodes[i];
    const p2 = nodes[i + 1];
    const p3 = nodes[Math.min(nodes.length - 1, i + 2)];

    // Catmull-Rom to Cubic Bezier
    const cp1x = p1.screenX + (p2.screenX - p0.screenX) / 6;
    const cp1y = p1.screenY + (p2.screenY - p0.screenY) / 6;
    const cp2x = p2.screenX - (p3.screenX - p1.screenX) / 6;
    const cp2y = p2.screenY - (p3.screenY - p1.screenY) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.screenX, p2.screenY);
  }

  // Soft glowing backbone strand
  ctx.strokeStyle = hexToRgba(color, 0.45 * opacityMultiplier);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  if (glow > 0) {
    ctx.strokeStyle = hexToRgba(color, 0.18 * opacityMultiplier * glow);
    ctx.lineWidth = 4.2;
    ctx.stroke();
  }

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
