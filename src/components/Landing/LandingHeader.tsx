import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  MapPin,
  Stethoscope,
  ArrowRight,
  PhoneCall,
  UserCheck,
  Layers,
  Compass,
  Sparkles,
  TrendingUp,
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

  // Lock body scroll when mobile menu is open & listen for Escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { label: "Solutions", href: "#solutions", icon: Layers },
    { label: "How It Works", href: "#how-it-works", icon: Compass },
    { label: "Clinical AI", href: "#clinical-ai", icon: Sparkles },
    { label: "Emergency 108", href: "#emergency-network", icon: PhoneCall },
    { label: "Impact", href: "#impact", icon: TrendingUp },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full pt-2 sm:pt-3 px-2 sm:px-6 pointer-events-none transition-all">
        {/* Floating Glass Navigation Pill Container */}
        <div className="container-constrained pointer-events-auto">
          <div className="glass-nav relative px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between shadow-lg">
            {/* Subtle Top Inner Highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/90 to-transparent pointer-events-none" />

            {/* Left Section: Logo & Regional State Selector */}
            <div className="flex items-center gap-1.5 xs:gap-2.5 sm:gap-3 z-10 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate("landing")}
                className="flex items-center gap-0.5 font-extrabold text-base sm:text-lg tracking-tight cursor-pointer select-none shrink-0"
                aria-label="ArogyaSeva Home"
              >
                <span className="text-[#0B1F3A]">Arogya</span>
                <span className="text-[#00C2D7]">Seva</span>
              </button>

              <button
                type="button"
                onClick={onOpenStateModal}
                className="glass-pill flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0B1F3A] cursor-pointer group min-w-0"
                title="Click to change Indian State / UT"
              >
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E8F6FA] border border-[rgba(0,194,215,0.25)] flex items-center justify-center text-[#00C2D7] shadow-2xs group-hover:scale-105 group-hover:shadow-[0_0_10px_rgba(0,194,215,0.3)] transition-all shrink-0">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00C2D7]" />
                </span>
                <span className="truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[130px] xl:max-w-[160px] text-[#0A172A] group-hover:text-[#0B1F3A]">
                  {currentState.name}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#DDFBF5] text-[#065F53] font-bold hidden md:inline-block border border-[rgba(25,230,193,0.3)]">
                  ACTIVE
                </span>
              </button>
            </div>

            {/* Center: Custom Animated Button Container Navigation (Uiverse Specification) */}
            <nav
              className="button-container hidden md:flex z-10"
              aria-label="Main Navigation"
            >
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleLinkClick(item.href)}
                    className="button group relative"
                    aria-label={item.label}
                    title={item.label}
                  >
                    <IconComponent className="icon" />
                    {/* Tooltip Label */}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-[#002855] text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-cyan-400/40 z-30 scale-95 group-hover:scale-100">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Desktop Actions (Right Section: Doctor & CHW Portal) */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-2.5 ml-auto z-10">
              {/* Doctor Portal Action - Secondary Glass */}
              <button
                type="button"
                onClick={() => onNavigate("doctor")}
                className="glass-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer group min-h-[38px]"
              >
                <Stethoscope className="w-4 h-4 text-[#164E78] group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline">Doctor Portal</span>
                <span className="md:hidden">Doctor</span>
              </button>

              {/* CHW Workstation CTA */}
              <button
                type="button"
                onClick={() => onNavigate("chw")}
                className="glass-btn-primary inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer group min-h-[38px]"
              >
                <UserCheck className="w-4 h-4 text-[#00C2D7] group-hover:scale-110 transition-transform" />
                <span>CHW Workstation</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform hidden xs:inline" />
              </button>
            </div>

            {/* Mobile State Button & Hamburger Toggle */}
            <div className="flex sm:hidden items-center gap-1.5 ml-auto z-10">
              <button
                type="button"
                onClick={() => onNavigate("chw")}
                className="glass-btn-primary px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs min-h-[38px] flex items-center"
              >
                Intake
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl text-[#0B1F3A] bg-white/80 hover:bg-white border border-white/90 shadow-2xs flex items-center justify-center cursor-pointer transition-colors active:scale-95"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-[#0B1F3A]" /> : <Menu className="w-5 h-5 text-[#0B1F3A]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Backdrop & Slide-Down Glass Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Dark Glass Overlay */}
          <div
            className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative z-50 pt-20 px-3 pb-safe max-h-[92vh] overflow-y-auto">
            <div className="glass-level-3 p-5 rounded-3xl shadow-2xl space-y-4 border border-white/90 animate-in slide-in-from-top-4 duration-250">
              {/* Regional System Switcher */}
              <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(11,31,58,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    onOpenStateModal();
                    setMobileMenuOpen(false);
                  }}
                  className="glass-pill flex items-center gap-2 text-xs font-bold text-[#0B1F3A] px-3.5 py-2 rounded-full min-h-[44px] w-full justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-[#00C2D7] shrink-0" />
                    <span className="truncate">State: <strong>{currentState.name}</strong></span>
                  </div>
                  <span className="text-[10px] text-[#00C2D7] font-semibold uppercase tracking-wider shrink-0">Change</span>
                </button>
              </div>

              {/* Navigation Links (min 44px touch targets) */}
              <div className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleLinkClick(item.href)}
                      className="text-left text-sm font-bold text-[#527086] hover:text-[#0B1F3A] py-3 px-3.5 rounded-xl hover:bg-white/80 active:bg-white transition-all min-h-[44px] flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <IconComponent className="w-4 h-4 text-[#00C2D7]" />
                        <span>{item.label}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>

              {/* Portal Actions */}
              <div className="pt-3 flex flex-col gap-2.5 border-t border-[rgba(11,31,58,0.08)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate("chw");
                  }}
                  className="glass-btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold shadow-md min-h-[48px] cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#00C2D7]" />
                  <span>Launch CHW Workstation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate("doctor");
                  }}
                  className="glass-btn-secondary w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-[#0B1F3A] min-h-[48px] cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4 text-[#164E78]" />
                  <span>Doctor Command Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate("emergency");
                  }}
                  className="glass-btn-emergency w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-extrabold text-white shadow-md min-h-[48px] cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 animate-pulse" />
                  <span>108 Emergency Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

