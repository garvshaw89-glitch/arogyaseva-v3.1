import React, { useState } from "react";
import { useRealtime } from "../../context/RealtimeContext";
import {
  Bell,
  RefreshCw,
  X,
  Smartphone,
  Stethoscope,
  Ambulance,
  Radio,
} from "lucide-react";

interface RealtimeStatusBarProps {
  onOpenDevicesDrawer?: () => void;
  onOpenNotificationsDrawer?: () => void;
  className?: string;
}

export const RealtimeStatusBar: React.FC<RealtimeStatusBarProps> = ({
  onOpenNotificationsDrawer,
  className = "",
}) => {
  const {
    unreadNotificationsCount,
    currentRole,
    setCurrentRole,
    deviceName,
    setDeviceName,
    offlineQueueCount,
    syncOfflineQueue,
    isSimulatedOffline,
    toggleSimulateOffline,
    connectedDevices,
  } = useRealtime();

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempDeviceName, setTempDeviceName] = useState(deviceName);

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
        {/* Offline Queue Manual Sync Button */}
        {offlineQueueCount > 0 && (
          <button
            onClick={syncOfflineQueue}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-600 text-white hover:bg-teal-700 text-[11px] font-bold shadow-xs transition-colors"
            title="Upload queued offline records"
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

      {/* Device Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Workspace Settings</h3>
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
                  Clinical Device Role
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
                  placeholder="e.g. Sub-Centre Tablet"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold">Connected Devices:</span>
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
                  {isSimulatedOffline ? "Go Online" : "Simulate Offline"}
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
