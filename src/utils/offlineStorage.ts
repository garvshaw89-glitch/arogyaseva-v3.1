import { PatientCase } from "../types";

const LOCAL_STORAGE_KEY = "arogyaseva_patient_cases_v1";
const OFFLINE_QUEUE_KEY = "arogyaseva_offline_queue_v1";

export function loadLocalCases(): PatientCase[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load local cases:", err);
    return [];
  }
}

export function saveLocalCases(cases: PatientCase[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error("Failed to save local cases:", err);
  }
}

export function addOrUpdateLocalCase(caseItem: PatientCase, isOffline: boolean = false): void {
  const cases = loadLocalCases();
  const index = cases.findIndex((c) => c.id === caseItem.id);
  const updatedItem = {
    ...caseItem,
    isOfflineCreated: isOffline,
    syncedAt: isOffline ? undefined : new Date().toISOString(),
  };

  if (index >= 0) {
    cases[index] = updatedItem;
  } else {
    cases.unshift(updatedItem);
  }

  saveLocalCases(cases);

  if (isOffline) {
    addToOfflineQueue(updatedItem);
  }
}

export function loadOfflineQueue(): PatientCase[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(caseItem: PatientCase): void {
  try {
    const queue = loadOfflineQueue();
    const idx = queue.findIndex((q) => q.id === caseItem.id);
    if (idx >= 0) {
      queue[idx] = caseItem;
    } else {
      queue.push(caseItem);
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to add to offline queue:", err);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error("Failed to clear offline queue:", err);
  }
}

export async function syncOfflineQueueWithServer(): Promise<{ syncedCount: number; errors: number }> {
  const queue = loadOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: 0 };

  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: PatientCase[] = [];

  for (const item of queue) {
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (response.ok) {
        syncedCount++;
        // Update local case synced status
        const cases = loadLocalCases();
        const found = cases.find((c) => c.id === item.id);
        if (found) {
          found.isOfflineCreated = false;
          found.syncedAt = new Date().toISOString();
          saveLocalCases(cases);
        }
      } else {
        remainingQueue.push(item);
        errors++;
      }
    } catch {
      remainingQueue.push(item);
      errors++;
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
  return { syncedCount, errors };
}
