import React from "react";

export type GlassBadgeVariant =
  | "blue"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "neutral";

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: GlassBadgeVariant;
  pulse?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * GlassBadge
 * Translucent clinical status indicator with semantic tinting and optional gentle pulse.
 */
export const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = "blue",
  pulse = false,
  className = "",
  icon,
  ...props
}) => {
  const badgeClasses = {
    blue: "glass-badge-blue",
    cyan: "glass-badge-cyan",
    emerald: "glass-badge-emerald",
    amber: "glass-badge-amber",
    rose: "glass-badge-rose",
    neutral: "bg-white/70 text-slate-700 border border-slate-200/80 shadow-2xs",
  };

  const pulseDotColors = {
    blue: "bg-blue-600",
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-red-500",
    neutral: "bg-slate-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide select-none ${badgeClasses[variant]} ${className}`}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseDotColors[variant]}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${pulseDotColors[variant]}`}
          />
        </span>
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
