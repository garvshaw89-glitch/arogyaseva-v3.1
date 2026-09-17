import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Search,
  X,
  RefreshCw,
  Building2,
  Home,
  ShieldAlert,
  Check,
} from "lucide-react";
import {
  acquireLiveLocation,
  getCachedLiveLocation,
  searchIndianLocations,
  LocationSearchResult,
  DetectedLocation,
} from "../../utils/geolocationHelper";
import { playHapticSound } from "../../utils/audioFeedback";

interface LocationSearchInputProps {
  id?: string;
  value: string;
  onChange: (villageName: string, coords?: { latitude: number; longitude: number }) => void;
  placeholder?: string;
  className?: string;
  showCurrentLocationOption?: boolean;
  onLocationSelected?: (loc: { village: string; latitude: number; longitude: number }) => void;
  disabled?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  id = "location-search-input",
  value,
  onChange,
  placeholder = "Search village, sub-centre, ward or address...",
  className = "",
  showCurrentLocationOption = true,
  onLocationSelected,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [cachedLocation, setCachedLocation] = useState<DetectedLocation | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Synchronize internal input value with external prop
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Check for cached location on mount
  useEffect(() => {
    const cached = getCachedLiveLocation();
    if (cached) {
      setCachedLocation(cached);
    }
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search debounced handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    onChange(text);
    setGpsError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchIndianLocations(text);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  // One-click: Use Current Live Location (GPS)
  const handleUseCurrentLocation = useCallback(async () => {
    playHapticSound("click");
    setIsDetectingGps(true);
    setGpsError(null);

    try {
      const loc = await acquireLiveLocation(true);
      setCachedLocation(loc);
      setInputValue(loc.villageName);
      onChange(loc.villageName, { latitude: loc.latitude, longitude: loc.longitude });
      if (onLocationSelected) {
        onLocationSelected({
          village: loc.villageName,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
      playHapticSound("success");
      setIsOpen(false);
    } catch (err: any) {
      playHapticSound("alert");
      setGpsError(err.message || "Could not detect GPS location");
    } finally {
      setIsDetectingGps(false);
    }
  }, [onChange, onLocationSelected]);

  // Select searched village / location
  const handleSelectResult = (result: LocationSearchResult) => {
    playHapticSound("click");
    const name = result.name || result.displayName.split(",")[0];
    const fullVillageName = result.displayName.split(",").slice(0, 3).join(", ");
    const finalName = fullVillageName || name;

    setInputValue(finalName);
    onChange(finalName, { latitude: result.latitude, longitude: result.longitude });
    if (onLocationSelected) {
      onLocationSelected({
        village: finalName,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }
    setIsOpen(false);
  };

  // Clear text
  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSearchResults([]);
    setGpsError(null);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input container */}
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-blue-600 absolute left-3 shrink-0 pointer-events-none" />
        <input
          id={id}
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full text-xs sm:text-sm font-semibold text-slate-800 pl-9 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {isSearching && (
            <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin mr-1" />
          )}

          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
              title="Clear location"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showCurrentLocationOption && !disabled && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              title="Use current live location"
              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 active:scale-95 transition-all cursor-pointer border border-blue-200 shadow-2xs"
            >
              <Navigation
                className={`w-3.5 h-3.5 ${
                  isDetectingGps ? "animate-spin text-blue-600" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* GPS Error alert */}
      {gpsError && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 shadow-lg">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="flex-1">{gpsError}</span>
          <button
            type="button"
            onClick={() => setGpsError(null)}
            className="text-amber-500 hover:text-amber-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[1000] overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
          {/* Top Option: Use Current Live Location (Google Maps Style) */}
          {showCurrentLocationOption && (
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              className="w-full text-left px-3.5 py-3 hover:bg-blue-50/80 active:bg-blue-100 transition-colors flex items-center gap-3 cursor-pointer bg-gradient-to-r from-blue-50/40 to-transparent group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Navigation
                  className={`w-4 h-4 ${
                    isDetectingGps ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-blue-900">
                    {isDetectingGps
                      ? "Acquiring Device GPS..."
                      : "Use Current Live Location"}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    GPS
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {cachedLocation
                    ? `Current: ${cachedLocation.villageName}`
                    : "Automatically detect your village / town coordinates across India"}
                </p>
              </div>
              {cachedLocation && (
                <span className="text-[10px] text-emerald-600 font-semibold shrink-0 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready
                </span>
              )}
            </button>
          )}

          {/* Search Result Items */}
          {searchResults.length > 0 ? (
            searchResults.map((result) => {
              const isVillage =
                result.category === "village" || result.category === "sub_centre";
              return (
                <button
                  key={result.placeId}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
                >
                  <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                    {isVillage ? (
                      <Home className="w-3.5 h-3.5" />
                    ) : result.category === "phc" ||
                      result.category === "sub_centre" ? (
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700 truncate">
                        {result.name}
                      </span>
                      {result.category && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            result.category === "sub_centre"
                              ? "bg-purple-100 text-purple-700"
                              : result.category === "village"
                              ? "bg-emerald-100 text-emerald-700"
                              : result.category === "phc" || result.category === "chc"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {result.category === "sub_centre"
                            ? "Sub-Centre / HWC"
                            : result.category === "village"
                            ? "Village"
                            : result.category === "phc"
                            ? "PHC"
                            : result.category === "chc"
                            ? "CHC"
                            : result.type || "Location"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {result.displayName}
                    </p>
                  </div>
                </button>
              );
            })
          ) : isSearching ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Searching Indian villages, sub-centres & towns...</span>
            </div>
          ) : inputValue && inputValue.length >= 2 ? (
            <div className="px-4 py-4 text-center text-xs text-slate-500">
              No matching Indian village or sub-centre found. You can keep typing custom address.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
