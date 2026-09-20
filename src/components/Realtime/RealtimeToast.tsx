import React from "react";
import { useRealtime } from "../../context/RealtimeContext";
import { AlertTriangle, CheckCircle2, Info, X, ExternalLink, Activity } from "lucide-react";

interface RealtimeToastProps {
  onSelectCase?: (caseId: string) => void;
}

export const RealtimeToast: React.FC<RealtimeToastProps> = ({ onSelectCase }) => {
  const { toastAlert, dismissToast, setActiveCaseId } = useRealtime();

  if (!toastAlert) return null;

  const getTheme = () => {
    switch (toastAlert.type) {
      case "urgent":
        return {
          border: "border-rose-300 bg-rose-50/95 text-rose-950 shadow-rose-900/10",
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />,
          button: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "success":
        return {
          border: "border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-emerald-900/10",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      case "warning":
        return {
          border: "border-amber-300 bg-amber-50/95 text-amber-950 shadow-amber-900/10",
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          button: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "info":
      default:
        return {
          border: "border-teal-300 bg-teal-50/95 text-teal-950 shadow-teal-900/10",
          icon: <Info className="w-5 h-5 text-teal-600 shrink-0" />,
          button: "bg-teal-600 hover:bg-teal-700 text-white",
        };
    }
  };

  const theme = getTheme();

  const handleOpenCase = () => {
    if (toastAlert.caseId) {
      setActiveCaseId(toastAlert.caseId);
      if (onSelectCase) {
        onSelectCase(toastAlert.caseId);
      }
    }
    dismissToast();
  };

  return (
    <aside
      aria-label="Real-time alert"
      className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-200"
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md ${theme.border}`}
      >
        {theme.icon}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-ping" />
            <h4 className="text-sm font-bold truncate leading-tight">{toastAlert.title}</h4>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">{toastAlert.message}</p>

          {toastAlert.caseId && (
            <div className="mt-2.5 flex items-center gap-2">
              <button
                onClick={handleOpenCase}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${theme.button}`}
              >
                <span>Open Patient Record</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
