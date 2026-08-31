import React from 'react';
import { GpsSignalQuality } from '../types/instrument';
import { playSwitchFeedback } from '../services/audioHaptics';
import { WeatherData } from '../hooks/useWeather';
import { WeatherWidget } from './WeatherWidget';

interface TopStatusBarProps {
  signalQuality: GpsSignalQuality;
  accuracy: number | null;
  latitude: number | null;
  longitude: number | null;
  isSimulated: boolean;
  onToggleSimulated: () => void;
  onOpenHistory: () => void;
  tripCount: number;
  weather?: WeatherData;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  signalQuality,
  accuracy,
  latitude,
  longitude,
  isSimulated,
  onToggleSimulated,
  onOpenHistory,
  tripCount,
  weather,
}) => {
  // Format coordinates
  const formattedCoords =
    latitude != null && longitude != null
      ? `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'} ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`
      : 'Buscando fijación...';

  const getSignalBadge = () => {
    switch (signalQuality) {
      case 'LOCKED_HIGH':
        return {
          text: 'Precisión alta',
          dotClass: 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]',
        };
      case 'LOCKED_MED':
        return {
          text: 'Precisión media',
          dotClass: 'bg-[#eab308] shadow-[0_0_6px_rgba(234,179,8,0.6)]',
        };
      case 'SIMULATED':
        return {
          text: 'Simulación',
          dotClass: 'bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.7)] animate-pulse',
        };
      case 'UNAVAILABLE':
        return {
          text: 'Sin señal GPS',
          dotClass: 'bg-[#ef4444]',
        };
      default:
        return {
          text: 'Buscando GPS...',
          dotClass: 'bg-[#eab308] animate-ping',
        };
    }
  };

  const signalInfo = getSignalBadge();

  return (
    <header
      id="top-status-bar"
      className="flex items-center justify-between w-full h-[32px] sm:h-[34px] px-2.5 sm:px-3 rounded-lg bg-[#0a0d13]/85 border border-[#1b212c] text-[#8e9aa8] text-[10.5px] font-medium tracking-wide backdrop-blur-sm select-none shrink-0"
    >
      {/* Left: System identity brand & GPS indicator */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]/40" />
          <span className="font-bold text-[#e2e8f0] tracking-[0.14em] uppercase text-[10px] sm:text-[10.5px]">
            CLIO DE RAMA
          </span>
        </div>

        <span className="text-[#2c3545]">|</span>

        {/* GPS status with indicator light */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${signalInfo.dotClass} transition-all duration-300`} />
          <span className="font-semibold text-[#f1f5f9] tracking-wider text-[9.5px] sm:text-[10px]">
            GPS
          </span>
          <span className="hidden md:inline text-[#94a3b8] text-[9.5px]">
            {signalInfo.text} {accuracy ? `(±${accuracy}m)` : ''}
          </span>
        </div>
      </div>

      {/* Center: Weather Widget if available */}
      {weather && (
        <div className="hidden sm:flex items-center justify-center">
          <WeatherWidget weather={weather} variant="badge" />
        </div>
      )}

      {/* Right: History & Mode Toggles */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Discreet coordinates */}
        <div className="hidden lg:flex items-center gap-1 text-[9.5px] text-[#64748b] font-mono-num">
          <span>{formattedCoords}</span>
        </div>

        {/* History Quick Access */}
        <button
          id="btn-quick-history"
          type="button"
          onClick={() => {
            playSwitchFeedback('toggle');
            onOpenHistory();
          }}
          className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded bg-[#131720] hover:bg-[#1a202c] active:bg-[#0c0f14] border border-[#232a38] text-[#cbd5e1] text-[9.5px] sm:text-[10px] font-semibold tracking-wider uppercase transition-colors"
        >
          <span>HISTORIAL</span>
          {tripCount > 0 && (
            <span className="px-1 py-0.2 rounded-full bg-[#1e2533] text-[#94a3b8] text-[8.5px]">
              {tripCount}
            </span>
          )}
        </button>

        {/* Real vs Sim Mode Switch */}
        <button
          id="btn-toggle-sim"
          type="button"
          onClick={() => {
            playSwitchFeedback('toggle');
            onToggleSimulated();
          }}
          className={`flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded text-[9.5px] sm:text-[10px] font-semibold tracking-wider uppercase transition-all border ${
            isSimulated
              ? 'bg-[#182635] text-[#38bdf8] border-[#38bdf8]/40'
              : 'bg-[#131720] text-[#94a3b8] border-[#232a38] hover:text-[#cbd5e1]'
          }`}
          title="Alternar entre GPS en vivo y simulador dinámico"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isSimulated ? 'bg-[#38bdf8]' : 'bg-[#64748b]'}`} />
          <span>{isSimulated ? 'SIM' : 'EN VIVO'}</span>
        </button>
      </div>
    </header>
  );
};
