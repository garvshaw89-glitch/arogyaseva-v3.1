import React from "react";
import { useRealtime } from "../../context/RealtimeContext";
import {
  Bell,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  CheckCheck,
} from "lucide-react";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase?: (caseId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectCase,
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setActiveCaseId,
  } = useRealtime();

  if (!isOpen) return null;

  const handleOpenCase = (caseId?: string, notifId?: string) => {
    if (notifId) markNotificationAsRead(notifId);
    if (caseId) {
      setActiveCaseId(caseId);
      if (onSelectCase) {
        onSelectCase(caseId);
      }
      onClose();
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "urgent":
        return {
          badge: "bg-rose-100 text-rose-800 border-rose-200",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        };
      case "success":
        return {
          badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        };
      case "warning":
        return {
          badge: "bg-amber-100 text-amber-800 border-amber-200",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        };
      case "info":
      default:
        return {
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          icon: <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        };
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "just now";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinical Activity & Alerts</h3>
              <p className="text-xs text-slate-500">Live multi-device notification stream</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
              className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-300" />
              <p>No activity notifications yet.</p>
              <p className="text-slate-400 mt-1">Actions taken across connected devices will stream here live.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const { badge, icon } = getLevelBadge(notif.level);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleOpenCase(notif.caseId, notif.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    notif.read
                      ? "bg-white border-slate-200 hover:border-slate-300 text-slate-600"
                      : "bg-teal-50/40 border-teal-200 hover:border-teal-300 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {icon}
                      <h4 className="text-xs font-bold leading-tight truncate">{notif.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(notif.timestamp)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed pl-5">{notif.message}</p>

                  {notif.caseId && (
                    <div className="mt-2.5 pl-5 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-md">
                        {notif.caseId}
                      </span>
                      <span className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-1">
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
          Showing real-time stream from server
        </div>
      </div>
    </div>
  );
};
