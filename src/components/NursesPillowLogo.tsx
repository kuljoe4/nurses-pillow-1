import React from 'react';

export const LOCAL_LOGO_URL = '/nurses-pillow-logo.png';

interface NursesPillowLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  isNightShiftMode?: boolean;
}

export const NursesPillowLogo: React.FC<NursesPillowLogoProps> = ({
  className = 'h-8 w-auto',
  size = 32,
  showText = false,
  isNightShiftMode = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={LOCAL_LOGO_URL}
        alt="Nurses Pillow Logo"
        className="shrink-0 object-contain drop-shadow-xs"
        style={{ width: size, height: size }}
      />

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-bold tracking-tight text-lg leading-tight ${
              isNightShiftMode ? 'text-white' : 'text-[#001848]'
            }`}
          >
            Nurses Pillow
          </span>
          <span
            className="text-[16px] leading-none -mt-0.5 font-normal text-[#745b0d] dark:text-[#E4C36D]"
            style={{ fontFamily: "'Kaushan Script', cursive" }}
          >
            Rest Well. Heal Better.
          </span>
        </div>
      )}
    </div>
  );
};
