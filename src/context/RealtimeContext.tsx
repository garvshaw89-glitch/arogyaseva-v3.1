import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { PatientCase, CaseAttachment, ConnectedDevice, RealtimeNotification, RealtimeStats, ConnectionState } from "../types";
import {
  loadLocalCases,
  saveLocalCases,
  loadOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
} from "../utils/offlineStorage";

interface RealtimeContextValue {
  cases: PatientCase[];
  activeCaseId: string | null;
  setActiveCaseId: (id: string | null) => void;
  stats: RealtimeStats;
  notifications: RealtimeNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  connectedDevices: ConnectedDevice[];
  currentDeviceId: string;
  connectionState: ConnectionState;
  currentRole: "chw" | "doctor" | "ambulance" | "admin";
  setCurrentRole: (role: "chw" | "doctor" | "ambulance" | "admin") => void;
  deviceName: string;
  setDeviceName: (name: string) => void;
  createCase: (caseData: PatientCase) => Promise<PatientCase>;
  updateCase: (caseId: string, updates: Partial<PatientCase>) => Promise<PatientCase | null>;
  submitDoctorReview: (caseId: string, doctorAction: string, doctorNotes: string, status?: PatientCase["status"]) => Promise<void>;
  addAttachment: (caseId: string, fileData: { fileName: string; fileType: string; fileSize: number; dataUrl?: string; category?: any }) => Promise<void>;
  dispatchAmbulance: (caseId: string, facilityName?: string) => Promise<void>;
  offlineQueueCount: number;
  offlineQueue: PatientCase[];
  isOnline: boolean;
  isSyncing: boolean;
  syncOfflineQueue: () => Promise<void>;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  toastAlert: { id: string; title: string; message: string; type: "urgent" | "info" | "success" | "warning"; caseId?: string } | null;
  dismissToast: () => void;
  reloadFromServer: () => Promise<void>;
  refreshCases: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const DEFAULT_STATS: RealtimeStats = {
  totalPatientsToday: 0,
  activeCases: 0,
  criticalCases: 0,
  pendingReferrals: 0,
  reviewedCases: 0,
  connectedDevicesCount: 1,
};

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<PatientCase[]>(() => loadLocalCases());
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [stats, setStats] = useState<RealtimeStats>(DEFAULT_STATS);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<ConnectedDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>(() => `dev-${Math.random().toString(36).slice(2, 8)}`);
  const [connectionState, setConnectionState] = useState<ConnectionState>("syncing");
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => loadOfflineQueue().length);
  const [toastAlert, setToastAlert] = useState<{ id: string; title: string; message: string; type: "urgent" | "info" | "success" | "warning"; caseId?: string } | null>(null);

  // Role and device label preferences
  const [currentRole, setCurrentRoleState] = useState<"chw" | "doctor" | "ambulance" | "admin">(() => {
    return (localStorage.getItem("arogyaseva_device_role") as any) || "chw";
  });
  const [deviceName, setDeviceNameState] = useState<string>(() => {
    return localStorage.getItem("arogyaseva_device_name") || `Station-${Math.floor(100 + Math.random() * 900)}`;
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);
  const casesRef = useRef<PatientCase[]>(cases);
  casesRef.current = cases;

  const setCurrentRole = useCallback((role: "chw" | "doctor" | "ambulance" | "admin") => {
    setCurrentRoleState(role);
    localStorage.setItem("arogyaseva_device_role", role);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "IDENTIFY",
        payload: { role, deviceName, location: "Connected Clinical Node" }
      }));
    }
  }, [deviceName]);

  const setDeviceName = useCallback((name: string) => {
    setDeviceNameState(name);
    localStorage.setItem("arogyaseva_device_name", name);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "IDENTIFY",
        payload: { role: currentRole, deviceName: name, location: "Connected Clinical Node" }
      }));
    }
  }, [currentRole]);

  const dismissToast = useCallback(() => {
    setToastAlert(null);
  }, []);

  const triggerToast = useCallback((title: string, message: string, type: "urgent" | "info" | "success" | "warning", caseId?: string) => {
    setToastAlert({
      id: `toast-${Date.now()}`,
      title,
      message,
      type,
      caseId,
    });
    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToastAlert((current) => (current && current.title === title ? null : current));
    }, 6000);
  }, []);

  // Compute stats helper
  const computeStats = useCallback((caseList: PatientCase[], devicesCount: number): RealtimeStats => {
    const today = new Date().toISOString().slice(0, 10);
    const totalPatientsToday = caseList.filter((c) => c.createdAt && c.createdAt.startsWith(today)).length || caseList.length;
    const activeCases = caseList.filter((c) => c.status !== "RESOLVED" && (c.status as any) !== "COMPLETED").length;
    const criticalCases = caseList.filter((c) => c.riskLevel === "URGENT").length;
    const pendingReferrals = caseList.filter((c) => c.status === "PENDING_REVIEW" || (c.status as any) === "SUBMITTED" || (c.status as any) === "UNDER_REVIEW").length;
    const reviewedCases = caseList.filter((c) => c.status === "DOCTOR_REVIEWED" || (c.status as any) === "REFERRED" || c.status === "RESOLVED").length;

    return {
      totalPatientsToday,
      activeCases,
      criticalCases,
      pendingReferrals,
      reviewedCases,
      connectedDevicesCount: Math.max(1, devicesCount),
    };
  }, []);

  // REST initial data fetch
  const reloadFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/cases");
      if (res.ok) {
        const data = await res.json();
        if (data.cases && Array.isArray(data.cases)) {
          setCases(data.cases);
          saveLocalCases(data.cases);
          setStats((prev) => computeStats(data.cases, prev.connectedDevicesCount));
        }
      }
      const notifRes = await fetch("/api/notifications");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.notifications) {
          setNotifications(notifData.notifications);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch initial cases via REST:", err);
    }
  }, [computeStats]);

  // WebSocket Connection Management
  const connectWebSocket = useCallback(() => {
    if (isSimulatedOffline) {
      setConnectionState("offline");
      return;
    }

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionState("syncing");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setConnectionState("connected");

        // Identify this station
        socket.send(
          JSON.stringify({
            type: "IDENTIFY",
            payload: {
              role: currentRole,
              deviceName: deviceName,
              location: "Frontline Health Hub",
            },
          })
        );

        // Heartbeat ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "PING" }));
          }
        }, 20000);

        // Process any queued offline items
        syncOfflineQueue();
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          switch (message.type) {
            case "INIT_SYNC": {
              const { cases: incomingCases, stats: incomingStats, notifications: incomingNotifs, devices, deviceId } = message.payload;
              if (deviceId) setCurrentDeviceId(deviceId);
              if (incomingCases && Array.isArray(incomingCases)) {
                setCases(incomingCases);
                saveLocalCases(incomingCases);
              }
              if (incomingStats) setStats(incomingStats);
              if (incomingNotifs) setNotifications(incomingNotifs);
              if (devices) setConnectedDevices(devices);
              break;
            }

            case "PRESENCE_UPDATE": {
              const { devices, count } = message.payload;
              if (devices) setConnectedDevices(devices);
              setStats((prev) => ({ ...prev, connectedDevicesCount: count || (devices ? devices.length : prev.connectedDevicesCount) }));
              break;
            }

            case "CASE_CREATED": {
              const { case: newCase, notification, stats: newStats, senderDeviceId } = message.payload;
              if (newCase) {
                setCases((prev) => {
                  const exists = prev.some((c) => c.id === newCase.id);
                  const updated = exists ? prev.map((c) => (c.id === newCase.id ? newCase : c)) : [newCase, ...prev];
                  saveLocalCases(updated);
                  return updated;
                });

                if (notification) {
                  setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
                }

                if (newStats) {
                  setStats(newStats);
                } else {
                  setStats((prev) => computeStats([newCase, ...casesRef.current], prev.connectedDevicesCount));
                }

                // Show prominent visual toast if generated from another device or critical
                if (senderDeviceId !== currentDeviceId) {
                  triggerToast(
                    newCase.riskLevel === "URGENT" ? "🚨 Incoming Critical Triage!" : "🆕 New Patient Registered",
                    `${newCase.patientName} (${newCase.age}y, ${newCase.village || "Rural Sub-Centre"}) • SpO2 ${newCase.vitals?.spo2 || 98}%`,
                    newCase.riskLevel === "URGENT" ? "urgent" : "info",
                    newCase.id
                  );
                }
              }
              break;
            }

            case "CASE_UPDATED": {
              const { case: updatedCase, notification, stats: newStats } = message.payload;
              if (updatedCase) {
                setCases((prev) => {
                  const next = prev.map((c) => (c.id === updatedCase.id ? updatedCase : c));
                  saveLocalCases(next);
                  return next;
                });

                if (notification) {
                  setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
                }

                if (newStats) setStats(newStats);
              }
              break;
            }

            case "DOCTOR_RESPONSE": {
              const { case: reviewedCase, notification, stats: newStats, senderDeviceId } = message.payload;
              if (reviewedCase) {
                setCases((prev) => {
                  const next = prev.map((c) => (c.id === reviewedCase.id ? reviewedCase : c));
                  saveLocalCases(next);
                  return next;
                });

                if (notification) {
                  setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
                }

                if (newStats) setStats(newStats);

                // Show prominent toast for medical officer review
                if (senderDeviceId !== currentDeviceId) {
                  triggerToast(
                    "👨‍⚕️ Medical Officer Reviewed Case",
                    `${reviewedCase.patientName}: ${reviewedCase.doctorAction || "Care plan updated"}`,
                    "success",
                    reviewedCase.id
                  );
                }
              }
              break;
            }

            case "CONFLICT_DETECTED": {
              const { message: conflictMsg, latestCase } = message.payload;
              if (latestCase) {
                setCases((prev) => {
                  const next = prev.map((c) => (c.id === latestCase.id ? latestCase : c));
                  saveLocalCases(next);
                  return next;
                });
              }
              triggerToast("⚠️ Record Synchronized", conflictMsg, "warning", latestCase?.id);
              break;
            }

            case "PONG": {
              // Heartbeat acknowledged
              break;
            }
          }
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
        }
      };

      socket.onclose = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (!isSimulatedOffline) {
          setConnectionState("reconnecting");
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setConnectionState("offline");
        }
      };

      socket.onerror = () => {
        // Socket will trigger onclose and attempt exponential reconnection
      };
    } catch (err) {
      console.warn("Failed to create WebSocket:", err);
      setConnectionState("reconnecting");
    }
  }, [isSimulatedOffline, currentRole, deviceName, currentDeviceId, computeStats, triggerToast]);

  // Initial mount: load data via REST and establish WebSocket connection
  useEffect(() => {
    reloadFromServer();
    connectWebSocket();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [reloadFromServer, connectWebSocket]);

  // Offline simulation toggle
  const toggleSimulateOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => {
      const next = !prev;
      if (next) {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
        setConnectionState("offline");
        triggerToast("📡 Simulating Offline Mode", "Device disconnected from live cluster. Changes will queue locally.", "warning");
      } else {
        triggerToast("🟢 Reconnecting Live Workspace", "Restoring live real-time network synchronization...", "info");
        setTimeout(() => connectWebSocket(), 400);
      }
      return next;
    });
  }, [connectWebSocket, triggerToast]);

  // Queue sync logic
  const syncOfflineQueue = useCallback(async () => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    setConnectionState("syncing");
    let synced = 0;

    for (const item of queue) {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "CREATE_CASE", payload: item }));
          synced++;
        } else {
          const res = await fetch("/api/cases", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          if (res.ok) synced++;
        }
      } catch (err) {
        console.error("Queue replay item error:", err);
      }
    }

    clearOfflineQueue();
    setOfflineQueueCount(0);
    setConnectionState("connected");

    if (synced > 0) {
      triggerToast(
        "🔄 Offline Queue Synced",
        `Successfully uploaded ${synced} queued patient ${synced === 1 ? "record" : "records"} to ArogyaSeva live server.`,
        "success"
      );
    }
  }, [triggerToast]);

  // Action: Create Case
  const createCase = useCallback(
    async (caseData: PatientCase): Promise<PatientCase> => {
      const newId = caseData.id || `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
      const timestamp = new Date().toISOString();
      const preparedCase: PatientCase = {
        ...caseData,
        id: newId,
        version: 1,
        createdAt: caseData.createdAt || timestamp,
        updatedAt: timestamp,
        syncedAt: timestamp,
        isOfflineCreated: connectionState === "offline",
        attachments: caseData.attachments || [],
      };

      // Optimistic update local state
      setCases((prev) => {
        const next = [preparedCase, ...prev.filter((c) => c.id !== newId)];
        saveLocalCases(next);
        return next;
      });

      // If offline, save to local queue
      if (connectionState === "offline" || isSimulatedOffline) {
        addToOfflineQueue(preparedCase);
        setOfflineQueueCount((prev) => prev + 1);
        triggerToast("💾 Saved Locally (Offline)", `${preparedCase.patientName} queued for auto-sync when network returns.`, "info", preparedCase.id);
        return preparedCase;
      }

      // Send through WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "CREATE_CASE",
            payload: preparedCase,
          })
        );
        triggerToast("⚡ Live Case Broadcast", `${preparedCase.patientName} submitted & synced to all clinical stations.`, "success", preparedCase.id);
        return preparedCase;
      }

      // Fallback to REST API
      try {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preparedCase),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.case) {
            triggerToast("⚡ Live Case Broadcast", `${data.case.patientName} submitted & synced.`, "success", data.case.id);
            return data.case;
          }
        }
      } catch (err) {
        console.warn("REST create fallback error, queueing:", err);
        addToOfflineQueue(preparedCase);
        setOfflineQueueCount((prev) => prev + 1);
      }

      return preparedCase;
    },
    [connectionState, isSimulatedOffline, triggerToast]
  );

  // Action: Update Case
  const updateCase = useCallback(
    async (caseId: string, updates: Partial<PatientCase>): Promise<PatientCase | null> => {
      const existing = casesRef.current.find((c) => c.id === caseId);
      if (!existing) return null;

      const updated: PatientCase = {
        ...existing,
        ...updates,
        version: (existing.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      };

      // Optimistic local update
      setCases((prev) => {
        const next = prev.map((c) => (c.id === caseId ? updated : c));
        saveLocalCases(next);
        return next;
      });

      if (connectionState === "offline" || isSimulatedOffline) {
        addToOfflineQueue(updated);
        setOfflineQueueCount((prev) => prev + 1);
        return updated;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "UPDATE_CASE",
            payload: {
              id: caseId,
              updates,
              clientVersion: existing.version,
            },
          })
        );
      } else {
        try {
          await fetch(`/api/cases/${caseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          });
        } catch (err) {
          console.error("Failed to update case via REST:", err);
        }
      }

      return updated;
    },
    [connectionState, isSimulatedOffline]
  );

  // Action: Doctor Review
  const submitDoctorReview = useCallback(
    async (caseId: string, doctorAction: string, doctorNotes: string, status: PatientCase["status"] = "DOCTOR_REVIEWED") => {
      const existing = casesRef.current.find((c) => c.id === caseId);
      const updated: PatientCase = {
        ...(existing || ({} as PatientCase)),
        doctorAction,
        doctorNotes,
        status,
        version: ((existing?.version || 1) + 1),
        updatedAt: new Date().toISOString(),
      };

      setCases((prev) => {
        const next = prev.map((c) => (c.id === caseId ? updated : c));
        saveLocalCases(next);
        return next;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "DOCTOR_REVIEW",
            payload: {
              id: caseId,
              doctorAction,
              doctorNotes,
              status,
            },
          })
        );
      } else {
        try {
          await fetch(`/api/cases/${caseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ doctorAction, doctorNotes, status }),
          });
        } catch (err) {
          console.error("Doctor review error:", err);
        }
      }

      triggerToast("👨‍⚕️ Review Submitted", `Plan confirmed for ${existing?.patientName || "patient"}.`, "success", caseId);
    },
    [triggerToast]
  );

  // Action: Add Attachment
  const addAttachment = useCallback(
    async (
      caseId: string,
      fileData: { fileName: string; fileType: string; fileSize: number; dataUrl?: string; category?: any }
    ) => {
      const fullAtt: CaseAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        caseId,
        fileName: fileData.fileName,
        fileType: fileData.fileType,
        fileSize: fileData.fileSize,
        dataUrl: fileData.dataUrl,
        uploadedBy: deviceName,
        uploadedAt: new Date().toISOString(),
        category: fileData.category || "lab_report",
      };

      setCases((prev) => {
        const next = prev.map((c) => {
          if (c.id === caseId) {
            return {
              ...c,
              attachments: [...(c.attachments || []), fullAtt],
              version: (c.version || 1) + 1,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
        saveLocalCases(next);
        return next;
      });

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "ADD_ATTACHMENT",
            payload: { caseId, attachment: fullAtt },
          })
        );
      } else {
        try {
          await fetch(`/api/cases/${caseId}/attachments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fullAtt),
          });
        } catch (err) {
          console.error("Failed to add attachment via REST:", err);
        }
      }

      triggerToast("📎 Document Attached", `${fullAtt.fileName} uploaded and synced.`, "info", caseId);
    },
    [deviceName, triggerToast]
  );

  // Action: Dispatch Ambulance
  const dispatchAmbulance = useCallback(
    async (caseId: string, facilityName: string = "District Civil Hospital") => {
      const targetCase = casesRef.current.find((c) => c.id === caseId);
      const updates: Partial<PatientCase> = {
        status: "IN_TRANSIT",
      };
      await updateCase(caseId, updates);

      // Post initial telemetry
      try {
        await fetch("/api/telemetry/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            latitude: targetCase?.villageLatitude || 22.7533,
            longitude: targetCase?.villageLongitude || 77.7291,
            patientName: targetCase?.patientName,
            targetFacilityName: facilityName,
            status: "IN_TRANSIT",
          }),
        });
      } catch (err) {
        console.error("Telemetry post error:", err);
      }

      triggerToast("🚑 108 Emergency Dispatched", `Ambulance en route for ${targetCase?.patientName || "patient"}.`, "urgent", caseId);
    },
    [updateCase, triggerToast]
  );

  // Notification actions
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        cases,
        activeCaseId,
        setActiveCaseId,
        stats,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        connectedDevices,
        currentDeviceId,
        connectionState,
        currentRole,
        setCurrentRole,
        deviceName,
        setDeviceName,
        createCase,
        updateCase,
        submitDoctorReview,
        addAttachment,
        dispatchAmbulance,
        offlineQueueCount,
        offlineQueue: loadOfflineQueue(),
        isOnline: connectionState === "connected" && !isSimulatedOffline,
        isSyncing: connectionState === "syncing",
        syncOfflineQueue,
        isSimulatedOffline,
        toggleSimulateOffline,
        toastAlert,
        dismissToast,
        reloadFromServer,
        refreshCases: reloadFromServer,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
