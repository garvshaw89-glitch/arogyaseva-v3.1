import React, { useState } from "react";
import { PatientCase, SupportedLanguage } from "../../types";
import { IndianStateData } from "../../data/indianStates";
import { DoctorDashboard } from "./DoctorDashboard";
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BedDouble,
  Search,
  Wifi,
  RefreshCw,
  MapPin,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Menu,
  X,
  FileText,
  Settings,
} from "lucide-react";
import { RealtimeStatusBar } from "../Realtime/RealtimeStatusBar";

interface DoctorAppViewProps {
  cases: PatientCase[];
  onUpdateCase: (caseId: string, updates: Partial<PatientCase>) => void;
  language: SupportedLanguage;
  onRefresh: () => void;
  onOpenPdfReport: (caseData: PatientCase) => void;
  selectedState: IndianStateData;
  onOpenStateModal: () => void;
  onNavigateHome: () => void;
  onNavigateCHW: () => void;
  onTriggerEmergencySos: () => void;
  onOpenDevicesDrawer?: () => void;
  onOpenNotificationsDrawer?: () => void;
}

export const DoctorAppView: React.FC<DoctorAppViewProps> = ({
  cases,
  onUpdateCase,
  language,
  onRefresh,
  onOpenPdfReport,
  selectedState,
  onOpenStateModal,
  onNavigateHome,
  onNavigateCHW,
  onTriggerEmergencySos,
  onOpenDevicesDrawer,
  onOpenNotificationsDrawer,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "cases" | "beds" | "emergency">("cases");

  const criticalCases = cases.filter((c) => c.riskLevel === "URGENT");
  const consultationCases = cases.filter((c) => c.riskLevel === "CONSULTATION");
  const pendingCases = cases.filter((c) => c.status === "PENDING_REVIEW");

  return (
    <div className="min-h-screen bg-[#F8FAFC] bg-glass-atmosphere flex flex-col font-sans">
      {/* Doctor Portal Header - Clinical Glass Navbar */}
      <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-xl border-b border-white/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-white/90 border border-transparent hover:border-slate-200/80"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F2347] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-900/15 ring-1 ring-white/50">
              <Stethoscope className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#0F172A] leading-tight flex items-center gap-2">
                <span>District Hospital Command</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100/70 text-[#2563EB] font-bold hidden sm:inline-block">
                  TELE-MED
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-500">
                Medical Officer Tele-Consultation Bay
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Live Shared Workspace Status Bar */}
          <RealtimeStatusBar
            onOpenDevicesDrawer={onOpenDevicesDrawer}
            onOpenNotificationsDrawer={onOpenNotificationsDrawer}
          />

          <button
            type="button"
            onClick={onOpenStateModal}
            className="glass-pill hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#123B78] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{selectedState.name}</span>
          </button>

          {/* CHW Portal Quick Switch */}
          <button
            type="button"
            onClick={onNavigateCHW}
            className="glass-btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
          >
            <span>Switch to CHW</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            Exit to Home
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 shadow-xs ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 space-y-5">
            {/* Doctor Profile Card */}
            <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F2347] to-[#1E40AF] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                DR
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#0F172A] truncate">
                  Dr. Rajesh Kulkarni, MD
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Civil Hospital Medical Officer
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="space-y-1 text-left">
              {[
                { id: "cases", label: "Incoming Case Queue", icon: Users, count: cases.length },
                { id: "dashboard", label: "Hospital Overview", icon: LayoutDashboard },
                { id: "beds", label: "Bed Availability", icon: BedDouble },
                { id: "emergency", label: "108 Ambulance Dispatch", icon: PhoneCall, alert: true },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-50/90 text-[#123B78] font-bold border border-blue-200/80 shadow-2xs"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#2563EB]" : item.alert ? "text-red-500" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.count !== undefined && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="text-[10px] text-slate-400">
              ABDM Registry Connected
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area with Safe Bottom Padding for Mobile Nav */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {activeTab === "cases" && (
            <div className="max-w-7xl mx-auto">
              <DoctorDashboard
                cases={cases}
                onUpdateCase={onUpdateCase}
                language={language}
                onRefresh={onRefresh}
                onOpenPdfReport={onOpenPdfReport}
                selectedState={selectedState}
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="max-w-5xl mx-auto space-y-6 text-left">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-xl font-bold text-[#0F172A] mb-4">
                  Hospital Triage Metrics & Bed Census
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-xs text-red-700 font-bold uppercase">Critical Queue</div>
                    <div className="text-3xl font-black text-red-800 font-mono mt-1">
                      {criticalCases.length}
                    </div>
                    <div className="text-[11px] text-red-600 mt-1">Pending immediate physician review</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-xs text-amber-700 font-bold uppercase">Consultations</div>
                    <div className="text-3xl font-black text-amber-800 font-mono mt-1">
                      {consultationCases.length}
                    </div>
                    <div className="text-[11px] text-amber-600 mt-1">Tele-advice requests from ASHAs</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs text-emerald-700 font-bold uppercase">ICU Capacity</div>
                    <div className="text-3xl font-black text-emerald-800 font-mono mt-1">
                      4 Available
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1">Of 12 designated emergency beds</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "beds" && (
            <div className="max-w-4xl mx-auto space-y-4 text-left">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-lg font-bold text-[#0F172A] mb-2">
                  Emergency Bed Availability Registry
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  District Civil Hospital, {selectedState.name}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 text-sm mb-1">Maternity & Labor Ward</div>
                    <div className="text-slate-500">Occupancy: 85% • 3 Beds Open</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 text-sm mb-1">Pediatric High Dependency Unit</div>
                    <div className="text-slate-500">Occupancy: 70% • 4 Beds Open</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 text-sm mb-1">Adult Intensive Care (ICU)</div>
                    <div className="text-slate-500">Occupancy: 66% • 4 Beds Open</div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="font-bold text-slate-900 text-sm mb-1">Isolation & Infectious Ward</div>
                    <div className="text-slate-500">Occupancy: 30% • 12 Beds Open</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "emergency" && (
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="bg-white p-8 rounded-2xl border border-red-200 shadow-md space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <PhoneCall className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-red-700">Hospital 108 Emergency Link</h2>
                <p className="text-xs text-slate-600">
                  Notify state emergency dispatch or coordinate incoming Advanced Life Support (ALS) ambulances directly from this workstation.
                </p>
                <button
                  type="button"
                  onClick={onTriggerEmergencySos}
                  className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Open 108 Dispatch Panel
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================
          Section 34: Mobile Bottom Navigation Bar (Doctor Station)
          ========================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(11,31,58,0.08)] px-2 py-1.5 safe-area-bottom flex items-center justify-around"
        aria-label="Doctor Mobile Navigation"
      >
        {[
          { id: "cases", label: "Queue", icon: Users, count: cases.length },
          { id: "dashboard", label: "Census", icon: LayoutDashboard },
          { id: "beds", label: "Beds", icon: BedDouble },
          { id: "emergency", label: "108 SOS", icon: PhoneCall, isEmergency: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-bold transition-all min-h-[46px] cursor-pointer relative ${
                item.isEmergency
                  ? isActive
                    ? "text-red-700 bg-red-50"
                    : "text-red-600 hover:bg-red-50/60"
                  : isActive
                  ? "text-[#00C2D7] bg-[#E8F6FA]/80 font-black"
                  : "text-[#527086] hover:text-[#0B1F3A]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${item.isEmergency && "animate-pulse"}`} />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#123B63] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
