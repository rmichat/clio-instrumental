import React from 'react';
import { WeatherData } from '../hooks/useWeather';

interface SecondaryTelemetryBarProps {
  altitude: number | null;     // meters
  heading: number | null;      // degrees
  accuracy: number | null;     // meters
  satellites: number;
  weather?: WeatherData;
  className?: string;
}

export const SecondaryTelemetryBar: React.FC<SecondaryTelemetryBarProps> = ({
  altitude,
  heading,
  accuracy,
  satellites,
  weather,
  className = '',
}) => {
  // Convert heading degrees to cardinal description
  const getCardinal = (deg: number | null): string => {
    if (deg == null || isNaN(deg)) return '---';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
    return directions[index];
  };

  const currentHeading = heading != null && !isNaN(heading) ? Math.round(heading) : null;
  const currentAltitude = altitude != null && !isNaN(altitude) ? Math.round(altitude) : null;
  const currentAccuracy = accuracy != null && !isNaN(accuracy) ? Math.round(accuracy) : null;
  const currentSatellites = satellites > 0 ? satellites : null;

  return (
    <footer
      id="secondary-telemetry-bar"
      className={`w-full h-[32px] sm:h-[34px] px-2.5 sm:px-3 rounded-lg bg-[#0a0d13]/70 border border-[#181e28] flex items-center justify-between text-[#7d8b9d] text-[10px] sm:text-[10.5px] font-medium tracking-wider select-none shrink-0 ${className}`}
    >
      {/* 1. ALTITUD */}
      <div id="telemetry-altitude" className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-[#596577] uppercase text-[9px] sm:text-[9.5px] font-semibold">
          ALTITUD
        </span>
        <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px] sm:text-[11px]">
          {currentAltitude != null ? currentAltitude : '---'}
        </span>
        {currentAltitude != null && (
          <span className="text-[#596577] text-[9px]">m</span>
        )}
      </div>

      <span className="text-[#1c222e]">|</span>

      {/* 2. RUMBO */}
      <div id="telemetry-heading" className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-[#596577] uppercase text-[9px] sm:text-[9.5px] font-semibold">
          RUMBO
        </span>
        <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px] sm:text-[11px]">
          {currentHeading != null ? `${currentHeading}°` : '---'}
        </span>
        {currentHeading != null && (
          <span className="text-[#38bdf8]/80 text-[9px] sm:text-[9.5px] font-mono-num font-medium">
            {getCardinal(currentHeading)}
          </span>
        )}
      </div>

      <span className="text-[#1c222e]">|</span>

      {/* 3. PRECISIÓN */}
      <div id="telemetry-accuracy" className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-[#596577] uppercase text-[9px] sm:text-[9.5px] font-semibold">
          PRECISIÓN
        </span>
        <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px] sm:text-[11px]">
          {currentAccuracy != null ? `±${currentAccuracy}` : '---'}
        </span>
        {currentAccuracy != null && (
          <span className="text-[#596577] text-[9px]">m</span>
        )}
      </div>

      <span className="text-[#1c222e]">|</span>

      {/* 4. CLIMA GEOLOCALIZADO */}
      <div id="telemetry-weather" className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-[#596577] uppercase text-[9px] sm:text-[9.5px] font-semibold">
          CLIMA
        </span>
        {weather ? (
          <>
            <span className="text-[11px] leading-none">{weather.icon}</span>
            <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px] sm:text-[11px]">
              {weather.isLoading ? '...' : `${weather.temp}°C`}
            </span>
            <span className="text-[#8e9aa8] text-[9px] font-medium hidden md:inline max-w-[90px] truncate">
              {weather.condition}
            </span>
          </>
        ) : (
          <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px]">---</span>
        )}
      </div>

      <span className="text-[#1c222e]">|</span>

      {/* 5. SATÉLITES */}
      <div id="telemetry-satellites" className="flex items-baseline gap-1 sm:gap-1.5">
        <span className="text-[#596577] uppercase text-[9px] sm:text-[9.5px] font-semibold">
          SATÉLITES
        </span>
        <span className="text-[#d5dce6] font-mono-num font-semibold text-[10.5px] sm:text-[11px]">
          {currentSatellites != null ? currentSatellites : '---'}
        </span>
      </div>
    </footer>
  );
};
