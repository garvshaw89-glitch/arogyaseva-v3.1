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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Doctor Portal Header */}
      <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#123B78] flex items-center justify-center text-white">
              <Stethoscope className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-[#0F172A] leading-tight">
                District Hospital Command
              </div>
              <div className="text-[10px] font-semibold text-slate-500">
                Medical Officer Tele-Consultation Bay
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live Shared Workspace Status Bar */}
          <RealtimeStatusBar
            onOpenDevicesDrawer={onOpenDevicesDrawer}
            onOpenNotificationsDrawer={onOpenNotificationsDrawer}
          />

          <button
            type="button"
            onClick={onOpenStateModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#123B78] cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{selectedState.name}</span>
          </button>

          {/* CHW Portal Quick Switch */}
          <button
            type="button"
            onClick={onNavigateCHW}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#123B78] hover:bg-[#0E2C5B] transition-colors"
          >
            <span>Switch to CHW Intake</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] px-2 py-1"
          >
            Exit to Home
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-4 space-y-6">
            {/* Doctor Profile Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#123B78] text-white flex items-center justify-center font-bold text-sm">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#EFF6FF] text-[#123B78] font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
            <div className="flex justify-between">
              <span>Sync Protocol:</span>
              <span className="font-bold text-emerald-600">Active Live</span>
            </div>
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
    </div>
  );
};
