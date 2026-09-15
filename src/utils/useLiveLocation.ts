import { useState, useEffect, useRef, useCallback } from "react";
import { HealthcareFacility, LiveLocationData } from "../types";

export interface LiveLocationState {
  coords: LiveLocationData;
  isTracking: boolean;
  isLocating: boolean;
  error: string | null;
  source: "gps_live" | "fallback_district" | "simulated_transit";
  nearbyHospitals: HealthcareFacility[];
  isLoadingHospitals: boolean;
  lastUpdated: string;
}

// Default regional healthcare hub coordinates (Narmadapuram / Hoshangabad District Cluster)
export const DEFAULT_REGION_COORDS: LiveLocationData = {
  latitude: 22.7533,
  longitude: 77.7291,
  accuracyMeters: 12,
  altitudeMeters: 310,
  speedKmH: 0,
  headingDegrees: 45,
  timestamp: new Date().toISOString(),
  isSimulated: false,
};

// Route waypoints towards District Hospital for ambulance emergency transit simulation
const SIMULATED_TRANSIT_WAYPOINTS: Array<{ lat: number; lon: number; speed: number }> = [
  { lat: 22.7533, lon: 77.7291, speed: 28 }, // Village Health Post
  { lat: 22.7612, lon: 77.7384, speed: 48 }, // State Highway 22 Junction
  { lat: 22.7745, lon: 77.7490, speed: 62 }, // Bypass Road
  { lat: 22.7880, lon: 77.7615, speed: 54 }, // River Bridge
  { lat: 22.8021, lon: 77.7730, speed: 42 }, // City Entrance
  { lat: 22.8115, lon: 77.7845, speed: 25 }, // District Hospital Emergency Trauma Gate
];

export function useLiveLocation(initialAutoTrack = false, caseId?: string) {
  const [state, setState] = useState<LiveLocationState>({
    coords: DEFAULT_REGION_COORDS,
    isTracking: initialAutoTrack,
    isLocating: false,
    error: null,
    source: "fallback_district",
    nearbyHospitals: [],
    isLoadingHospitals: false,
    lastUpdated: new Date().toLocaleTimeString(),
  });

  const watchIdRef = useRef<number | null>(null);
  const simIndexRef = useRef<number>(0);
  const simTimerRef = useRef<any>(null);

  // Calculate Haversine distance in km
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  // Fetch nearby medical facilities from OSM API
  const fetchNearbyHospitals = useCallback(
    async (lat: number, lon: number, radiusKm = 50) => {
      setState((prev) => ({ ...prev, isLoadingHospitals: true }));
      try {
        const url = `/api/nearby-hospitals?lat=${lat}&lon=${lon}&radius=${radiusKm}&osm=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data && Array.isArray(data.facilities)) {
          setState((prev) => ({
            ...prev,
            nearbyHospitals: data.facilities,
            isLoadingHospitals: false,
          }));
          return data.facilities as HealthcareFacility[];
        }
      } catch (err: any) {
        console.warn("Could not fetch OSM nearby hospitals, using local fallbacks:", err);
      } finally {
        setState((prev) => ({ ...prev, isLoadingHospitals: false }));
      }
      return [];
    },
    []
  );

  // Send telemetry coordinate updates to server
  const pushTelemetry = useCallback(
    async (locationData: LiveLocationData, referralCaseId?: string) => {
      try {
        await fetch("/api/telemetry/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ambulanceId: "AMB-108-MP05",
            caseId: referralCaseId || caseId || "EMERGENCY-REF-ACTIVE",
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            speedKmH: locationData.speedKmH || 0,
            headingDegrees: locationData.headingDegrees || 0,
            accuracyMeters: locationData.accuracyMeters || 10,
            status: "IN_TRANSIT",
            timestamp: locationData.timestamp,
          }),
        });
      } catch {
        // Silently tolerate telemetry dropouts
      }
    },
    [caseId]
  );

  // Fetch current one-shot geolocation from device
  const fetchCurrentLocation = useCallback(async (): Promise<LiveLocationData> => {
    setState((prev) => ({ ...prev, isLocating: true, error: null }));

    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isLocating: false,
        error: "Geolocation not supported by device/browser. Using district cluster coordinates.",
        source: "fallback_district",
      }));
      return DEFAULT_REGION_COORDS;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LiveLocationData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: Math.round(pos.coords.accuracy),
            altitudeMeters: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
            speedKmH: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
            headingDegrees: pos.coords.heading ? Math.round(pos.coords.heading) : null,
            timestamp: new Date(pos.timestamp).toISOString(),
            isSimulated: false,
          };

          setState((prev) => ({
            ...prev,
            coords: loc,
            isLocating: false,
            source: "gps_live",
            lastUpdated: new Date().toLocaleTimeString(),
          }));

          fetchNearbyHospitals(loc.latitude, loc.longitude);
          pushTelemetry(loc);
          resolve(loc);
        },
        (err) => {
          console.warn("Geolocation prompt denied or timed out:", err.message);
          setState((prev) => ({
            ...prev,
            isLocating: false,
            error: `Location access: ${err.message}. Showing district hub.`,
            source: "fallback_district",
          }));
          fetchNearbyHospitals(DEFAULT_REGION_COORDS.latitude, DEFAULT_REGION_COORDS.longitude);
          resolve(DEFAULT_REGION_COORDS);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    });
  }, [fetchNearbyHospitals, pushTelemetry]);

  // Start continuous location tracking
  const startTracking = useCallback(() => {
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      fetchCurrentLocation();
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: LiveLocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: Math.round(pos.coords.accuracy),
          altitudeMeters: pos.coords.altitude ? Math.round(pos.coords.altitude) : null,
          speedKmH: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : null,
          headingDegrees: pos.coords.heading ? Math.round(pos.coords.heading) : null,
          timestamp: new Date(pos.timestamp).toISOString(),
          isSimulated: false,
        };

        setState((prev) => ({
          ...prev,
          coords: loc,
          source: "gps_live",
          lastUpdated: new Date().toLocaleTimeString(),
        }));

        pushTelemetry(loc);
      },
      (err) => {
        console.warn("Watch position error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    );
  }, [fetchCurrentLocation, pushTelemetry]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Toggle simulated ambulance transit
  const toggleAmbulanceSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
      setState((prev) => ({
        ...prev,
        isTracking: false,
        source: "fallback_district",
      }));
      return;
    }

    // Stop real GPS watch if running
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isTracking: true,
      source: "simulated_transit",
    }));

    simIndexRef.current = 0;
    simTimerRef.current = setInterval(() => {
      const wp = SIMULATED_TRANSIT_WAYPOINTS[simIndexRef.current];
      const nextWp =
        SIMULATED_TRANSIT_WAYPOINTS[
          (simIndexRef.current + 1) % SIMULATED_TRANSIT_WAYPOINTS.length
        ];

      const simLoc: LiveLocationData = {
        latitude: wp.lat,
        longitude: wp.lon,
        accuracyMeters: 5,
        altitudeMeters: 305,
        speedKmH: wp.speed,
        headingDegrees: 65,
        timestamp: new Date().toISOString(),
        isSimulated: true,
      };

      setState((prev) => ({
        ...prev,
        coords: simLoc,
        lastUpdated: new Date().toLocaleTimeString(),
      }));

      pushTelemetry(simLoc);

      simIndexRef.current =
        (simIndexRef.current + 1) % SIMULATED_TRANSIT_WAYPOINTS.length;
    }, 3000);
  }, [pushTelemetry]);

  // Initial load
  useEffect(() => {
    fetchCurrentLocation();
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    fetchCurrentLocation,
    startTracking,
    stopTracking,
    toggleAmbulanceSimulation,
    fetchNearbyHospitals,
    getDistanceKm,
  };
}
