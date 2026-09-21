import React from "react";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?:
    | "clinical"
    | "clinical-subtle"
    | "clinical-elevated"
    | "clinical-modal"
    | "default"
    | "dark"
    | "elevated"
    | "accent"
    | "emergency";
  className?: string;
  glow?: "none" | "cyan" | "emerald" | "amber" | "rose" | "blue";
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  variant = "clinical",
  glow = "none",
  className = "",
  ...props
}) => {
  const variantStyles = {
    // Clinical Glassmorphism Hierarchy (Light Clinical Environments)
    clinical: "glass-level-2 text-slate-800",
    "clinical-subtle": "glass-level-1 text-slate-800",
    "clinical-elevated": "glass-level-3 text-slate-900",
    "clinical-modal": "glass-level-4 text-slate-900",

    // Dark/Command Center Variants
    default: "bg-[#0c1a2e]/85 backdrop-blur-xl border border-slate-700/50 shadow-2xl",
    dark: "bg-[#07111f]/92 backdrop-blur-2xl border border-slate-800/80 shadow-2xl",
    elevated: "bg-slate-900/80 backdrop-blur-xl border border-cyan-500/25 shadow-xl shadow-cyan-950/20",
    accent: "bg-gradient-to-br from-slate-900/90 via-[#0a1829]/90 to-[#07111f]/95 backdrop-blur-xl border border-cyan-400/30",
    emergency: "bg-gradient-to-br from-red-950/40 via-slate-900/90 to-slate-950/95 backdrop-blur-xl border border-red-500/40 shadow-xl shadow-red-950/30",
  };

  const glowStyles = {
    none: "",
    blue: "ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10",
    cyan: "ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10",
    emerald: "ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10",
    amber: "ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10",
    rose: "ring-1 ring-red-500/40 shadow-lg shadow-red-500/20",
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${variantStyles[variant]} ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
