import React, { useState } from "react";
import {
  PatientCase,
  SupportedLanguage,
} from "./types";
import { INDIAN_STATES, IndianStateData } from "./data/indianStates";
import { playHapticSound } from "./utils/audioFeedback";

// Realtime Infrastructure
import { RealtimeProvider, useRealtime } from "./context/RealtimeContext";
import { RealtimeToast } from "./components/Realtime/RealtimeToast";
import { ConnectedDevicesDrawer } from "./components/Realtime/ConnectedDevicesDrawer";
import { NotificationsDrawer } from "./components/Realtime/NotificationsDrawer";

// Landing Page Modular Architecture
import { LandingHeader } from "./components/Landing/LandingHeader";
import { LandingHero } from "./components/Landing/LandingHero";
import { PlatformStatistics } from "./components/Landing/PlatformStatistics";
import { SolutionsSection } from "./components/Landing/SolutionsSection";
import { HowItWorksSection } from "./components/Landing/HowItWorksSection";
import { ClinicalIntelligenceSection } from "./components/Landing/ClinicalIntelligenceSection";
import { EmergencyNetworkSection } from "./components/Landing/EmergencyNetworkSection";
import { TechnologyImpactSection } from "./components/Landing/TechnologyImpactSection";
import { FaqSection } from "./components/Landing/FaqSection";
import { LandingFooter } from "./components/Landing/LandingFooter";

// Application Views
import { CHWAppView } from "./components/CHW/CHWAppView";
import { DoctorAppView } from "./components/Doctor/DoctorAppView";
import { EmergencyAppView } from "./components/Emergency/EmergencyAppView";

// Modals
import { StateSelectorModal } from "./components/Common/StateSelectorModal";
import { EmergencySosModal } from "./components/Common/EmergencySosModal";
import { ReferralSlipModal } from "./components/CHW/ReferralSlipModal";
import { ReferralReportPDFModal } from "./components/Doctor/ReferralReportPDFModal";
import { LiveLocationTracker } from "./components/CHW/LiveLocationTracker";
import { MovingDnaCanvas } from "./components/Common/MovingDnaCanvas";

export type AppRoute = "landing" | "chw" | "doctor" | "emergency";

const AppContent: React.FC = () => {
  // --------------------------------------------------------------------------
  // Core Route & Session State
  // --------------------------------------------------------------------------
  const [currentRoute, setCurrentRoute] = useState<AppRoute>("landing");
  const [selectedState, setSelectedState] = useState<IndianStateData>(INDIAN_STATES[0]); // Default: Maharashtra
  const [language, setLanguage] = useState<SupportedLanguage>("en");

  // Real-Time Shared Workspace State
  const {
    cases,
    createCase,
    updateCase,
    isOnline,
    offlineQueue,
    syncOfflineQueue,
    isSyncing,
    refreshCases,
  } = useRealtime();

  // Drawer Modals
  const [showDevicesDrawer, setShowDevicesDrawer] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Global Clinical Modals State
  const [showStateModal, setShowStateModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showReferralSlip, setShowReferralSlip] = useState(false);
  const [completedCaseForSlip, setCompletedCaseForSlip] = useState<PatientCase | null>(null);
  const [pdfReportCase, setPdfReportCase] = useState<PatientCase | null>(null);
  const [showLiveTracker, setShowLiveTracker] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // State Selection
  const handleSelectState = (state: IndianStateData, autoSwitchLanguage = true) => {
    setSelectedState(state);
    if (autoSwitchLanguage && state.primaryLanguage) {
      setLanguage(state.primaryLanguage);
    }
  };

  // Save Case from CHW Workstation (Broadcasts Live to all devices)
  const handleSaveCase = async (newCase: PatientCase) => {
    await createCase(newCase);
  };

  // Update Case from Doctor Dashboard (Broadcasts Live to all devices)
  const handleDoctorUpdateCase = async (caseId: string, updates: Partial<PatientCase>) => {
    playHapticSound("click");
    await updateCase(caseId, updates);
  };

  // Smooth route navigation
  const navigateTo = (route: AppRoute) => {
    playHapticSound("step");
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] text-[#0F172A] flex flex-col font-sans antialiased relative selection:bg-cyan-100 selection:text-cyan-900">
      {/* Real-time Toast Notifications for cross-device activity */}
      <RealtimeToast />

      {/* Global Ambient Moving DNA Strand in Background */}
      <MovingDnaCanvas
        className="fixed inset-0 pointer-events-none -z-10"
        opacity={currentRoute === "landing" ? 0.28 : 0.20}
        speed={0.7}
        density="compact"
        colorScheme="clinical"
        showParticles={true}
        showSecondaryHelix={false}
        glowIntensity={0.8}
      />

      {/* =============================================================
          ROUTE 1: Landing / Marketing Homepage
          ============================================================= */}
      {currentRoute === "landing" && (
        <>
          <LandingHeader
            onNavigate={navigateTo}
            currentState={selectedState}
            onOpenStateModal={() => setShowStateModal(true)}
            isOffline={!isOnline}
            onToggleOffline={() => {}}
            onOpenDevicesDrawer={() => setShowDevicesDrawer(true)}
            onOpenNotificationsDrawer={() => setShowNotificationsDrawer(true)}
          />

          <main className="flex-1">
            <LandingHero
              onStartIntake={() => navigateTo("chw")}
              onOpenDoctorPortal={() => navigateTo("doctor")}
              onTriggerEmergencySos={() => setShowEmergencyModal(true)}
              onScrollToSolutions={() => {
                const el = document.getElementById("solutions");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              onOpenVideoModal={() => setVideoModalOpen(true)}
              currentState={selectedState}
            />

            <PlatformStatistics />

            <SolutionsSection
              onStartIntake={() => navigateTo("chw")}
              onOpenDoctorPortal={() => navigateTo("doctor")}
              onOpenEmergency={() => navigateTo("emergency")}
            />

            <HowItWorksSection />

            <ClinicalIntelligenceSection />

            <EmergencyNetworkSection
              onOpenEmergency={() => navigateTo("emergency")}
              onOpenStateModal={() => setShowStateModal(true)}
              stateName={selectedState.name}
            />

            <TechnologyImpactSection />

            <FaqSection />
          </main>

          <LandingFooter
            onNavigate={navigateTo}
            onOpenStateModal={() => setShowStateModal(true)}
          />
        </>
      )}

      {/* =============================================================
          ROUTE 2: CHW Frontline Clinical Application
          ============================================================= */}
      {currentRoute === "chw" && (
        <CHWAppView
          cases={cases}
          offlineQueue={offlineQueue}
          isOffline={!isOnline}
          onToggleOffline={() => {}}
          onSyncOffline={syncOfflineQueue}
          isSyncing={isSyncing}
          currentState={selectedState}
          onOpenStateModal={() => setShowStateModal(true)}
          language={language}
          onLanguageChange={setLanguage}
          onNavigateHome={() => navigateTo("landing")}
          onNavigateDoctor={() => navigateTo("doctor")}
          onTriggerEmergencySos={() => setShowEmergencyModal(true)}
          onSelectCaseForSlip={(caseData) => {
            setCompletedCaseForSlip(caseData);
            setShowReferralSlip(true);
          }}
          onSaveCase={handleSaveCase}
          onOpenPdfReport={(caseData) => setPdfReportCase(caseData)}
          onOpenDevicesDrawer={() => setShowDevicesDrawer(true)}
          onOpenNotificationsDrawer={() => setShowNotificationsDrawer(true)}
        />
      )}

      {/* =============================================================
          ROUTE 3: Doctor Command Center Application
          ============================================================= */}
      {currentRoute === "doctor" && (
        <DoctorAppView
          cases={cases}
          onUpdateCase={handleDoctorUpdateCase}
          language={language}
          onRefresh={refreshCases}
          onOpenPdfReport={(caseData) => setPdfReportCase(caseData)}
          selectedState={selectedState}
          onOpenStateModal={() => setShowStateModal(true)}
          onNavigateHome={() => navigateTo("landing")}
          onNavigateCHW={() => navigateTo("chw")}
          onTriggerEmergencySos={() => setShowEmergencyModal(true)}
          onOpenDevicesDrawer={() => setShowDevicesDrawer(true)}
          onOpenNotificationsDrawer={() => setShowNotificationsDrawer(true)}
        />
      )}

      {/* =============================================================
          ROUTE 4: Dedicated 108 Emergency Response Application
          ============================================================= */}
      {currentRoute === "emergency" && (
        <EmergencyAppView
          currentState={selectedState}
          onOpenStateModal={() => setShowStateModal(true)}
          onNavigateHome={() => navigateTo("landing")}
          onNavigateCHW={() => navigateTo("chw")}
          onNavigateDoctor={() => navigateTo("doctor")}
          onOpenLiveTracker={() => setShowLiveTracker(true)}
        />
      )}

      {/* =============================================================
          Global Drawers: Real-Time Multi-Device Presence & Notifications
          ============================================================= */}
      <ConnectedDevicesDrawer
        isOpen={showDevicesDrawer}
        onClose={() => setShowDevicesDrawer(false)}
      />

      <NotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
      />

      {/* =============================================================
          Global Modals & Dialogs
          ============================================================= */}
      {/* State Selector Modal (36 States & UTs) */}
      <StateSelectorModal
        isOpen={showStateModal}
        onClose={() => setShowStateModal(false)}
        currentState={selectedState}
        onSelectState={handleSelectState}
        currentLanguage={language}
      />

      {/* Emergency 108 SOS Dispatch Modal */}
      <EmergencySosModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        currentLocation={{
          village: selectedState.defaultVillage,
          latitude: selectedState.coordinates.lat,
          longitude: selectedState.coordinates.lng,
        }}
        onGenerateReport={(sosCase) => setPdfReportCase(sosCase)}
        onOpenMapTracker={() => setShowLiveTracker(true)}
      />

      {/* Referral Slip Modal (QR-Coded Slip) */}
      {showReferralSlip && completedCaseForSlip && (
        <ReferralSlipModal
          caseData={completedCaseForSlip}
          onClose={() => {
            setShowReferralSlip(false);
            setCompletedCaseForSlip(null);
          }}
          onViewDoctorPortal={() => {
            setShowReferralSlip(false);
            navigateTo("doctor");
          }}
          language={language}
          onGeneratePdfReport={(caseData) => setPdfReportCase(caseData)}
        />
      )}

      {/* Clinical SBAR PDF Report Modal */}
      {pdfReportCase && (
        <ReferralReportPDFModal
          caseData={pdfReportCase}
          isOpen={!!pdfReportCase}
          onClose={() => setPdfReportCase(null)}
          language={language}
        />
      )}

      {/* Live GPS Radar Tracker Modal */}
      {showLiveTracker && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-5">
            <LiveLocationTracker />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLiveTracker(false)}
                className="px-4 py-2 rounded-xl bg-[#123B78] text-white text-xs font-bold hover:bg-[#0E2C5B] transition-colors"
              >
                Close Radar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Video Modal */}
      {videoModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                The ArogyaSeva Mission: Transforming Rural Primary Care
              </h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 text-xs">
              <div className="text-center space-y-2 p-6">
                <div className="text-lg font-bold text-white">Frontline Healthcare in Action</div>
                <p className="max-w-md text-slate-300">
                  Documenting how ASHA workers use offline clinical triage, local voice transcription, and 108 referral dispatch across rural sub-centers in India.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <RealtimeProvider>
      <AppContent />
    </RealtimeProvider>
  );
};

export default App;
