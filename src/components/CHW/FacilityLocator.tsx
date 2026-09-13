import React, { useState } from "react";
import { MOCK_FACILITIES } from "../../data/mockFacilities";
import { HealthcareFacility, RiskAssessment, PatientCase, SupportedLanguage } from "../../types";
import { TRANSLATIONS } from "../../utils/translations";
import {
  Hospital,
  MapPin,
  Clock,
  PhoneCall,
  Wind,
  Droplet,
  Baby,
  ShieldCheck,
  Navigation,
  CheckCircle,
  FileText,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

interface FacilityLocatorProps {
  assessment: RiskAssessment;
  patientData: Partial<PatientCase>;
  onSelectFacilityAndGenerateSlip: (facility: HealthcareFacility) => void;
  onBack: () => void;
  language: SupportedLanguage;
}

export const FacilityLocator: React.FC<FacilityLocatorProps> = ({
  assessment,
  patientData,
  onSelectFacilityAndGenerateSlip,
  onBack,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    assessment.requiredFacilityLevel.includes("District")
      ? "DH-01"
      : assessment.requiredFacilityLevel.includes("Community") || patientData.isPregnant
      ? "CHC-01"
      : "PHC-01"
  );

  const selectedFacility =
    MOCK_FACILITIES.find((f) => f.id === selectedFacilityId) || MOCK_FACILITIES[1];

  const handleCallAmbulance = () => {
    window.location.href = "tel:108";
  };

  return (
    <div id="facility-locator-step" className="space-y-6">
      {/* 1. Header & Direct Ambulance Call Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-800 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-red-400/40">
              EMERGENCY REFERRAL ROUTE
            </span>
            <span className="text-xs text-red-100 font-medium">
              Target Tier: {assessment.requiredFacilityLevel}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1.5">
            Nearest Capable Healthcare Facilities
          </h2>
          <p className="text-xs text-red-100 mt-0.5 max-w-xl">
            Ranked by specialized clinical capability (Oxygen, Blood Storage, Obstetric OT, Pediatric ICU) and travel distance.
          </p>
        </div>

        {/* 108 Emergency Ambulance Button */}
        <button
          id="btn-call-108"
          onClick={handleCallAmbulance}
          className="bg-white text-red-700 hover:bg-red-50 font-bold text-sm px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <PhoneCall className="w-4 h-4 text-red-600 animate-bounce" />
          <span>Call 108 Ambulance</span>
        </button>
      </div>

      {/* 2. Facilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {MOCK_FACILITIES.map((fac) => {
          const isSelected = selectedFacilityId === fac.id;
          const isRecommended =
            fac.type.toLowerCase().includes(assessment.requiredFacilityLevel.toLowerCase().slice(0, 5));

          return (
            <div
              key={fac.id}
              id={`facility-card-${fac.id}`}
              onClick={() => setSelectedFacilityId(fac.id)}
              className={`rounded-2xl p-5 border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                      {fac.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                      {fac.name}
                    </h3>
                  </div>

                  <span className="text-xs font-semibold text-blue-600 shrink-0">
                    {fac.distanceKm}km
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                  {fac.address}
                </p>

                <p className="text-[11px] font-medium text-slate-700 mb-3 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Travel Time: ~{fac.travelTimeMins} mins</span>
                </p>

                {/* Badges of Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {fac.hasOxygen && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Wind className="w-2.5 h-2.5 text-blue-600" /> Oxygen Plant
                    </span>
                  )}
                  {fac.hasBloodBank && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Droplet className="w-2.5 h-2.5 text-red-600" /> Blood Bank
                    </span>
                  )}
                  {fac.hasCSection && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Baby className="w-2.5 h-2.5 text-pink-600" /> C-Section OT
                    </span>
                  )}
                  {fac.hasNICU && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                      NICU Care
                    </span>
                  )}
                  {fac.hasSnakeAntivenom && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                      Anti-Venom (ASVS)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-slate-600">
                  Beds: {fac.availableBeds} | ICU: {fac.icuBedsAvailable}
                </span>

                <span
                  className={`text-xs font-bold ${
                    isSelected ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {isSelected ? "✓ Selected" : "Tap to Select"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Facility Action Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
            Target Destination Facility:
          </span>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mt-0.5">
            <Hospital className="w-5 h-5 text-blue-600" />
            <span>{selectedFacility.name}</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
              {selectedFacility.distanceKm} km (~{selectedFacility.travelTimeMins} mins)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Emergency Desk: <strong className="text-slate-800">{selectedFacility.contactNumber}</strong> • {selectedFacility.address}
          </p>
        </div>

        <button
          id="btn-generate-referral-slip"
          onClick={() => onSelectFacilityAndGenerateSlip(selectedFacility)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-blue-100 flex items-center gap-2 transition-all"
        >
          <FileText className="w-4 h-4" />
          <span>{t.generateReferralSlip}</span>
        </button>
      </div>

      {/* Back button */}
      <div>
        <button
          id="btn-back-to-assessment"
          onClick={onBack}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assessment</span>
        </button>
      </div>
    </div>
  );
};
