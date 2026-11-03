import React, { useEffect, useState } from 'react';

interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  trauma_level?: string;
  traumaLevel?: string; // Support mapped field if backend uses it
  teaching_hospital?: boolean;
  teachingHospital?: boolean;
  availableSanctuariesCount?: number;
  shiftTypes?: string[];
  parking_type?: string;
  parkingType?: string;
  nurse_feedback_score?: number;
  nurseFeedbackScore?: number;
}

interface VerifiedHospitalsViewProps {
  isNightShiftMode: boolean;
  onSelectHospital: (hospitalName: string) => void;
}

export const VerifiedHospitalsView: React.FC<VerifiedHospitalsViewProps> = ({
  isNightShiftMode,
  onSelectHospital,
}) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hospitals')
      .then(res => res.json())
      .then(data => {
        setHospitals(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);
  return (
    <div
      className={`w-full py-12 px-4 sm:px-6 lg:px-12 transition-colors ${
        isNightShiftMode ? 'bg-[#08101C]' : 'bg-[#f2f3ff]'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#cde5ff] text-[#005684] dark:bg-[#3E9AD1]/20 dark:text-[#93ccff] mb-2">
            <span className="material-symbols-outlined text-sm">local_hospital</span>
            Hospital &amp; Trauma Directory
          </span>
          <h1
            className={`text-3xl font-bold tracking-tight mb-2 ${
              isNightShiftMode ? 'text-white' : 'text-[#001848]'
            }`}
          >
            Verified Hospital Campuses
          </h1>
          <p
            className={`text-sm leading-relaxed ${
              isNightShiftMode ? 'text-[#9CB3D3]' : 'text-[#404850]'
            }`}
          >
            Hospital complexes where our nurse housing sanctuaries have designated quiet buffers, safety escorts, and verified shift parking routes.
          </p>
        </div>

        {/* Hospital cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="col-span-1 md:col-span-2 text-center text-sm text-gray-500 py-10">Loading verified hospitals...</div>
          ) : hospitals.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center text-sm text-gray-500 py-10">No active hospitals found.</div>
          ) : hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className={`p-6 rounded-3xl border shadow-md transition-all duration-200 ease-in-out flex flex-col justify-between ${
                isNightShiftMode
                  ? 'bg-[#0E1A2E] border-[#233550] text-[#E6ECF7]'
                  : 'bg-white border-[rgba(11,37,89,0.08)] text-[#001848]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#195b4c] dark:text-[#aff0db] bg-[#aff0db]/30 px-2.5 py-1 rounded-full">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    {hosp.traumaLevel || hosp.trauma_level || 'General Hospital'}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#745b0d] dark:text-[#ffdf91]">
                    <span className="material-symbols-outlined text-sm">thumb_up</span>
                    <span>{hosp.nurseFeedbackScore || hosp.nurse_feedback_score || 95}% Nurse Approved</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold tracking-tight mb-1">{hosp.name}</h3>
                <p className="text-xs opacity-75 mb-4">
                  {hosp.city}, {hosp.state} • {hosp.teachingHospital ? 'Academic Medical Center' : 'Regional Healthcare System'}
                </p>

                <div className="space-y-2 mb-5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0a6fa8] dark:text-[#3E9AD1] text-base">
                      local_parking
                    </span>
                    <span className="opacity-90"><strong>Parking:</strong> {hosp.parkingType || hosp.parking_type || 'Standard Parking'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0a6fa8] dark:text-[#3E9AD1] text-base">
                      schedule
                    </span>
                    <span className="opacity-90"><strong>Available Shifts:</strong> {hosp.shiftTypes?.join(', ') || 'Various'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(11,37,89,0.08)] dark:border-[#233550] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0a6fa8] dark:text-[#3E9AD1]">
                  {hosp.availableSanctuariesCount} verified sanctuaries nearby
                </span>
                <button
                  type="button"
                  onClick={() => onSelectHospital(hosp.name)}
                  className="px-4 py-2 rounded-full bg-[#0a6fa8] hover:bg-[#005684] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#005684] text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span>Find Homes</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
