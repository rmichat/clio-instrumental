import React from 'react';
import { WeatherData } from '../hooks/useWeather';

interface WeatherWidgetProps {
  weather: WeatherData;
  className?: string;
  variant?: 'compact' | 'badge' | 'card';
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  className = '',
  variant = 'compact',
}) => {
  if (variant === 'badge') {
    return (
      <div
        id="weather-badge"
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#121620] border border-[#1e2534] text-[#cbd5e1] text-[10px] font-medium tracking-wide ${className}`}
        title={`Sensación: ${weather.apparentTemp}°C | Viento: ${weather.windSpeedKmh} km/h | Humedad: ${weather.humidity}%`}
      >
        <span className="text-[12px] leading-none">{weather.icon}</span>
        <span className="font-mono-num font-semibold text-[#f1f5f9]">
          {weather.isLoading ? '...' : `${weather.temp}°C`}
        </span>
        <span className="hidden sm:inline text-[#8e9aa8] text-[9.5px] max-w-[90px] truncate">
          {weather.condition}
        </span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        id="weather-card"
        className={`p-3 rounded-xl bg-[#0e1219]/90 border border-[#1d2330] flex flex-col justify-between ${className}`}
      >
        <div className="flex items-center justify-between text-[10px] font-semibold text-[#8e9aa8] tracking-[0.12em] uppercase font-display">
          <span>CONDICIONES CLIMÁTICAS</span>
          <span className="text-[14px]">{weather.icon}</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1">
            <span className="text-[24px] font-bold text-[#ffffff] font-gauge font-mono-num leading-none">
              {weather.temp}
            </span>
            <span className="text-[11px] font-medium text-[#38bdf8]">°C</span>
          </div>
          <span className="text-[11px] text-[#cbd5e1] font-medium">
            {weather.condition}
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-[#64748b] font-mono-num mt-1 pt-1 border-t border-[#18202c]">
          <span>Sensación: {weather.apparentTemp}°C</span>
          <span>Viento: {weather.windSpeedKmh} km/h</span>
          <span>Humedad: {weather.humidity}%</span>
        </div>
      </div>
    );
  }

  // Default compact variant for status bars
  return (
    <div
      id="weather-telemetry-item"
      className={`flex items-baseline gap-1.5 ${className}`}
    >
      <span className="text-[#596577] uppercase text-[9.5px] font-semibold">
        CLIMA
      </span>
      <span className="text-[11px] leading-none">{weather.icon}</span>
      <span className="text-[#d5dce6] font-mono-num font-semibold text-[11px]">
        {weather.isLoading ? '...' : `${weather.temp}°C`}
      </span>
      <span className="text-[#8e9aa8] text-[9.5px] font-medium hidden xs:inline max-w-[80px] truncate">
        {weather.condition}
      </span>
    </div>
  );
};
