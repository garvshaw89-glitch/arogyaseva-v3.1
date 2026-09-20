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
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
      {/* Top Hairline Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#123B78] via-[#2563EB] via-[#06B6D4] to-[#123B78] animate-gradient-flow" />

      <div className="container-constrained relative h-20 sm:h-[84px] flex items-center justify-between">
        {/* Left Section: Regional State Selector */}
        <div className="flex items-center gap-2.5 z-10">
          <button
            type="button"
            onClick={onOpenStateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-blue-50/90 border border-slate-200 hover:border-blue-300 text-xs font-bold text-[#123B78] shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Click to change Indian State / UT"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[120px] xl:max-w-[150px]">{currentState.name}</span>
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/80 backdrop-blur-sm z-10" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleLinkClick(link.href)}
              className="px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-[#123B78] hover:bg-white/90 hover:shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Actions (Right Section) */}
        <div className="hidden sm:flex items-center gap-2.5 ml-auto z-10">
          {/* Doctor Portal Action */}
          <button
            type="button"
            onClick={() => onNavigate("doctor")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-[#123B78] bg-slate-50 hover:bg-slate-100 border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-[#2563EB]" />
            <span className="hidden md:inline">Doctor Portal</span>
            <span className="md:hidden">Doctor</span>
          </button>

          {/* CHW Workstation CTA */}
          <button
            type="button"
            onClick={() => onNavigate("chw")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-[#123B78] to-[#1E40AF] hover:from-[#0E2C5B] hover:to-[#1D4ED8] shadow-sm hover:shadow-md hover:shadow-blue-900/20 transition-all cursor-pointer group"
          >
            <UserCheck className="w-4 h-4 text-[#06B6D4]" />
            <span>CHW Workstation</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile State Button (Left on Mobile) */}
        <div className="flex lg:hidden items-center z-10">
          <button
            type="button"
            onClick={onOpenStateModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100/90 text-[11px] font-bold text-[#123B78] border border-slate-200"
          >
            <MapPin className="w-3 h-3 text-[#2563EB]" />
            <span className="max-w-[70px] truncate">{currentState.name}</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle (Right on Mobile) */}
        <div className="flex sm:hidden items-center gap-2 ml-auto z-10">
          <button
            type="button"
            onClick={() => onNavigate("chw")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#123B78] shadow-xs"
          >
            Intake
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#0F172A] hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                onOpenStateModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#123B78] bg-[#EFF6FF] px-3 py-1.5 rounded-full"
            >
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>State: {currentState.name}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleLinkClick(link.href)}
                className="text-left text-sm font-medium text-[#334155] py-2 px-1 hover:text-[#123B78]"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("chw");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#123B78]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Open CHW Workstation</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate("doctor");
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#123B78] bg-slate-100"
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
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#DC2626]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>108 Emergency Response</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
