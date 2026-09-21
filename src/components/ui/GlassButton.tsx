import React from "react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "emergency" | "ghost" | "pill";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

/**
 * GlassButton
 * High-end clinical action control with micro-glow, top highlight reflection,
 * tactile hover elevation, and active compression.
 */
export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  icon,
  iconPosition = "left",
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "glass-btn-primary font-bold",
    secondary: "glass-btn-secondary font-bold",
    emergency: "glass-btn-emergency font-bold",
    ghost: "bg-transparent hover:bg-white/60 text-slate-700 hover:text-[#123B78] border border-transparent hover:border-slate-200/80 transition-all",
    pill: "glass-pill text-[#123B78] font-semibold",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5",
    md: "px-4 py-2.5 text-xs sm:text-sm rounded-xl gap-2",
    lg: "px-5 sm:px-6 py-3 text-sm sm:text-base rounded-2xl gap-2.5",
  };

  return (
    <button
      className={`inline-flex items-center justify-center select-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="shrink-0 transition-transform">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="shrink-0 transition-transform">{icon}</span>
      )}
    </button>
  );
};
