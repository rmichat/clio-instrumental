import React from 'react';
import { TripStatus } from '../types/instrument';
import { playSwitchFeedback } from '../services/audioHaptics';
import { requestWakeLock, releaseWakeLock } from '../services/wakeLock';

interface ControlButtonsProps {
  tripStatus: TripStatus;
  onStartTrip: () => void;
  onEndTrip: () => void;
  className?: string;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  tripStatus,
  onStartTrip,
  onEndTrip,
  className = '',
}) => {
  const isTripActive = tripStatus === 'ACTIVE';

  const handleStart = async () => {
    if (isTripActive) return;
    playSwitchFeedback('start');
    await requestWakeLock();
    onStartTrip();
  };

  const handleEnd = async () => {
    if (!isTripActive) return;
    playSwitchFeedback('stop');
    await releaseWakeLock();
    onEndTrip();
  };

  return (
    <div
      id="instrument-controls"
      className={`grid grid-cols-2 gap-2 sm:gap-3 w-full shrink-0 ${className}`}
    >
      {/* BOTÓN PRINCIPAL: ▶ INICIAR VIAJE / VIAJE EN CURSO */}
      <button
        id="btn-start-trip"
        type="button"
        disabled={isTripActive}
        onClick={handleStart}
        className={`group relative flex items-center justify-center gap-2 h-[46px] sm:h-[50px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-[12px] sm:text-[13px] tracking-[0.14em] uppercase transition-all duration-150 select-none ${
          isTripActive
            ? 'bg-[#0f241a] text-[#34d399] border border-[#34d399]/60 shadow-[inset_0_0_14px_rgba(52,211,153,0.2),0_0_12px_rgba(52,211,153,0.15)] cursor-default'
            : 'bg-gradient-to-b from-[#1c2331] to-[#111622] hover:from-[#252e40] hover:to-[#171e2c] active:scale-[0.98] text-[#f8fafc] border border-[#2c374c] shadow-[0_4px_14px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer'
        }`}
      >
        <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {isTripActive ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-ping shrink-0" />
            <span className="font-gauge font-bold whitespace-nowrap">VIAJE EN CURSO</span>
          </>
        ) : (
          <>
            <span className="text-[#38bdf8] text-[13px] sm:text-[14px] shrink-0">▶</span>
            <span className="font-gauge font-bold whitespace-nowrap">INICIAR VIAJE</span>
          </>
        )}
      </button>

      {/* BOTÓN SECUNDARIO: ■ FINALIZAR */}
      <button
        id="btn-end-trip"
        type="button"
        disabled={!isTripActive}
        onClick={handleEnd}
        className={`relative flex items-center justify-center gap-2 h-[46px] sm:h-[50px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-[12px] sm:text-[13px] tracking-[0.14em] uppercase transition-all duration-150 select-none ${
          isTripActive
            ? 'bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] hover:from-[#991b1b] hover:to-[#590e0e] active:scale-[0.98] text-[#ffffff] border border-[#ef4444]/80 shadow-[0_4px_16px_rgba(239,68,68,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)] cursor-pointer'
            : 'bg-[#0e1219]/80 text-[#475569] border border-[#1b2230] opacity-45 cursor-not-allowed'
        }`}
      >
        <span className="text-[10px] sm:text-[11px] shrink-0">■</span>
        <span className="font-gauge font-bold whitespace-nowrap">FINALIZAR</span>
      </button>
    </div>
  );
};
