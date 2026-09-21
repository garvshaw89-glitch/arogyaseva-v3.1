import React, { useState } from "react";
import {
  Menu,
  X,
  MapPin,
  Stethoscope,
  ArrowRight,
  PhoneCall,
  UserCheck,
} from "lucide-react";
import { IndianStateData } from "../../data/indianStates";

interface LandingHeaderProps {
  onNavigate: (route: "landing" | "chw" | "doctor" | "emergency") => void;
  currentState: IndianStateData;
  onOpenStateModal: () => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  onOpenDevicesDrawer?: () => void;
  onOpenNotificationsDrawer?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onNavigate,
  currentState,
  onOpenStateModal,
  isOffline,
  onToggleOffline,
  onOpenDevicesDrawer,
  onOpenNotificationsDrawer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Solutions", href: "#solutions" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Clinical AI", href: "#clinical-ai" },
    { label: "Emergency 108", href: "#emergency-network" },
    { label: "Impact", href: "#impact" },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-3 px-3 sm:px-6 pointer-events-none transition-all">
      {/* Floating Glass Navigation Pill Container */}
      <div className="container-constrained pointer-events-auto">
        <div className="glass-nav relative px-3.5 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between shadow-lg">
          {/* Subtle Top Inner Highlight */}
          <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

          {/* Left Section: Logo & Regional State Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 z-10">
            <button
              type="button"
              onClick={() => onNavigate("landing")}
              className="flex items-center gap-1 font-extrabold text-base sm:text-lg tracking-tight cursor-pointer select-none"
              aria-label="ArogyaSeva Home"
            >
              <span className="text-[#0B1F3A]">Arogya</span>
              <span className="text-[#00C2D7]">Seva</span>
            </button>

            <button
              type="button"
              onClick={onOpenStateModal}
              className="glass-pill flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B1F3A] cursor-pointer group"
              title="Click to change Indian State / UT"
            >
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E8F6FA] border border-[rgba(0,194,215,0.25)] flex items-center justify-center text-[#00C2D7] shadow-2xs group-hover:scale-105 group-hover:shadow-[0_0_10px_rgba(0,194,215,0.3)] transition-all">
                <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00C2D7]" />
              </span>
              <span className="truncate max-w-[90px] sm:max-w-[130px] xl:max-w-[160px] text-[#0A172A] group-hover:text-[#0B1F3A]">
                {currentState.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#DDFBF5] text-[#065F53] font-bold hidden sm:inline-block border border-[rgba(25,230,193,0.3)]">
                ACTIVE
              </span>
            </button>
          </div>

          {/* Center: Desktop Navigation Links (Floating Glass Capsule) */}
          <nav
            className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-white/70 border border-[rgba(11,31,58,0.08)] backdrop-blur-md shadow-2xs z-10"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleLinkClick(link.href)}
                className="relative px-3 xl:px-4 py-1.5 rounded-full text-xs font-bold text-[#527086] hover:text-[#0B1F3A] hover:bg-white/90 hover:shadow-2xs transition-all duration-200 cursor-pointer whitespace-nowrap group"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#00C2D7] rounded-full group-hover:w-4 transition-all duration-200" />
              </button>
            ))}
          </nav>

          {/* Desktop Actions (Right Section: Doctor & CHW Portal) */}
          <div className="hidden sm:flex items-center gap-2.5 ml-auto z-10">
            {/* Doctor Portal Action - Secondary Glass */}
            <button
              type="button"
              onClick={() => onNavigate("doctor")}
              className="glass-btn-secondary inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer group"
            >
              <Stethoscope className="w-4 h-4 text-[#164E78] group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Doctor Portal</span>
              <span className="md:hidden">Doctor</span>
            </button>

            {/* CHW Workstation CTA - Deep Navy / Deep Blue Gradient, Electric Cyan Highlight */}
            <button
              type="button"
              onClick={() => onNavigate("chw")}
              className="glass-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer group"
            >
              <UserCheck className="w-4 h-4 text-[#00C2D7] group-hover:scale-110 transition-transform" />
              <span>CHW Workstation</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Mobile State Button & Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-1.5 ml-auto z-10">
            <button
              type="button"
              onClick={() => onNavigate("chw")}
              className="glass-btn-primary px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs"
            >
              Intake
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0F172A] bg-white/70 hover:bg-white border border-white/90 shadow-2xs focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Animated Floating Glass Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 container-constrained pointer-events-auto">
          <div className="glass-level-3 p-4 rounded-2xl shadow-xl space-y-4 border border-white/90 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  onOpenStateModal();
                  setMobileMenuOpen(false);
                }}
                className="glass-pill flex items-center gap-1.5 text-xs font-semibold text-[#123B78] px-3 py-1.5 rounded-full"
              >
                <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>State: {currentState.name}</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleLinkClick(link.href)}
                  className="text-left text-sm font-semibold text-slate-700 py-2 px-3 rounded-xl hover:bg-white/80 hover:text-[#123B78] transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-2.5 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("chw");
                }}
                className="glass-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold shadow-md"
              >
                <UserCheck className="w-4 h-4 text-[#06B6D4]" />
                <span>Open CHW Workstation</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("doctor");
                }}
                className="glass-btn-secondary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                <span>Open Doctor Command Center</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate("emergency");
                }}
                className="glass-btn-emergency w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold shadow-md"
              >
                <PhoneCall className="w-4 h-4" />
                <span>108 Emergency Response</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
