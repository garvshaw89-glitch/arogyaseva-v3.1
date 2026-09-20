import React, { useState } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import {
  Wifi,
  WifiOff,
  Radio,
  Users,
  Bell,
  RefreshCw,
  Sliders,
  Laptop,
  Smartphone,
  Shield,
  Stethoscope,
  Ambulance,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

interface RealtimeStatusBarProps {
  onOpenDevicesDrawer?: () => void;
  onOpenNotificationsDrawer?: () => void;
  className?: string;
}

export const RealtimeStatusBar: React.FC<RealtimeStatusBarProps> = ({
  onOpenDevicesDrawer,
  onOpenNotificationsDrawer,
  className = "",
}) => {
  const {
    connectionState,
    connectedDevices,
    unreadNotificationsCount,
    currentRole,
    setCurrentRole,
    deviceName,
    setDeviceName,
    offlineQueueCount,
    syncOfflineQueue,
    isSimulatedOffline,
    toggleSimulateOffline,
  } = useRealtime();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState(deviceName);

  const getStatusColor = () => {
    switch (connectionState) {
      case "connected":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "syncing":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "reconnecting":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "offline":
      default:
        return "text-rose-700 bg-rose-50 border-rose-200";
    }
  };

  const getStatusLabel = () => {
    switch (connectionState) {
      case "connected":
        return "LIVE SYNC";
      case "syncing":
        return "SYNCING";
      case "reconnecting":
        return "RECONNECTING";
      case "offline":
        return isSimulatedOffline ? "OFFLINE SIMULATION" : "DISCONNECTED";
    }
  };

  const handleSaveDeviceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempDeviceName.trim()) {
      setDeviceName(tempDeviceName.trim());
    }
    setShowConfigModal(false);
  };

  return (
    <>
      <div
        id="realtime-status-bar"
        className={`flex items-center gap-2 text-xs font-medium ${className}`}
      >
        {/* Connection State Pill */}
        <button
          onClick={() => setShowConfigModal(true)}
          title="Click to configure Device Role & Network Simulation"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all shadow-xs hover:shadow-sm ${getStatusColor()}`}
        >
          {connectionState === "connected" ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          ) : connectionState === "reconnecting" || connectionState === "syncing" ? (
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-rose-500" />
          )}

          <span className="tracking-wide font-bold">{getStatusLabel()}</span>

          {offlineQueueCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-mono text-[10px]">
              {offlineQueueCount} queued
            </span>
          )}
        </button>

        {/* Connected Devices Count Pill */}
        <button
          onClick={onOpenDevicesDrawer}
          title="View all synchronized clinical devices on ArogyaSeva"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-xs"
        >
          <Radio className="w-3 h-3 text-teal-600" />
          <span>
            <strong className="font-semibold">{Math.max(1, connectedDevices.length)}</strong>{" "}
            {connectedDevices.length === 1 ? "Station" : "Stations"}
          </span>
        </button>

        {/* Quick Role Indicator */}
        <button
          onClick={() => setShowConfigModal(true)}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
          title={`Active Device: ${deviceName} (${currentRole.toUpperCase()})`}
        >
          {currentRole === "doctor" ? (
            <Stethoscope className="w-3 h-3 text-indigo-600" />
          ) : currentRole === "ambulance" ? (
            <Ambulance className="w-3 h-3 text-rose-600" />
          ) : (
            <Laptop className="w-3 h-3 text-teal-600" />
          )}
          <span className="capitalize text-[11px] max-w-[110px] truncate">{deviceName}</span>
        </button>

        {/* Offline Simulation Toggle */}
        <button
          onClick={toggleSimulateOffline}
          title={isSimulatedOffline ? "Turn simulation off and reconnect live" : "Simulate field offline disconnection"}
          className={`flex items-center gap-1 px-2 py-1 rounded-md border text-[11px] font-semibold transition-all ${
            isSimulatedOffline
              ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isSimulatedOffline ? <WifiOff className="w-3 h-3 text-amber-700" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
          <span className="hidden lg:inline">{isSimulatedOffline ? "Go Online" : "Simulate Offline"}</span>
        </button>

        {/* Offline Queue Manual Sync Button */}
        {offlineQueueCount > 0 && (
          <button
            onClick={syncOfflineQueue}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-600 text-white hover:bg-teal-700 text-[11px] font-bold shadow-xs transition-colors"
            title="Sync queued local data now"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync ({offlineQueueCount})</span>
          </button>
        )}

        {/* Notifications Drawer Toggle */}
        <button
          onClick={onOpenNotificationsDrawer}
          title="Clinical Activity & Alerts Stream"
          className="relative p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Device Configuration & Realtime Simulation Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Real-Time Workspace Settings</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeviceSettings} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Clinical Station Role
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Controls how this device identifies itself across the shared ArogyaSeva network.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentRole("chw")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      currentRole === "chw"
                        ? "bg-teal-50 border-teal-500 text-teal-900 font-bold ring-2 ring-teal-200"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-teal-600" />
                    <span className="text-xs">CHW Tablet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentRole("doctor")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      currentRole === "doctor"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-200"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                    <span className="text-xs">Doctor Bay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentRole("ambulance")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                      currentRole === "ambulance"
                        ? "bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-200"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Ambulance className="w-5 h-5 text-rose-600" />
                    <span className="text-xs">108 Fleet</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Device Label
                </label>
                <input
                  type="text"
                  value={tempDeviceName}
                  onChange={(e) => setTempDeviceName(e.target.value)}
                  placeholder="e.g. Pipariya Sub-Centre Tablet"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Network Sync Mode:</span>
                  <span className="font-mono">{getStatusLabel()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Active Stations in Cluster:</span>
                  <span className="font-bold text-teal-700">{Math.max(1, connectedDevices.length)} devices</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Offline Queued Changes:</span>
                  <span className="font-mono">{offlineQueueCount}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={toggleSimulateOffline}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    isSimulatedOffline
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-amber-100 text-amber-900 hover:bg-amber-200"
                  }`}
                >
                  {isSimulatedOffline ? "Restore Live Sync" : "Simulate Offline"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                  >
                    Save & Update
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
