import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  hoverEffect?: boolean;
  className?: string;
}

/**
 * GlassCard
 * Core clinical glass surface with optical depth, top edge reflection,
 * soft blue-tinted shadow, and WCAG-compliant readability.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  level = 2,
  hoverEffect = true,
  className = "",
  ...props
}) => {
  const levelClass =
    level === 1
      ? "glass-level-1"
      : level === 3
      ? "glass-level-3"
      : level === 4
      ? "glass-level-4"
      : "glass-level-2";

  return (
    <div
      className={`rounded-2xl transition-all duration-200 ${levelClass} ${
        !hoverEffect ? "hover:transform-none hover:shadow-inherit" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
