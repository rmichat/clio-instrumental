import React from 'react';

interface TripTelemetryModuleProps {
  maxSpeed: number;       // km/h
  distanceKm: number;     // km
  tripSeconds: number;    // seconds
  isTripActive: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

export const TripTelemetryModule: React.FC<TripTelemetryModuleProps> = ({
  maxSpeed,
  distanceKm,
  tripSeconds,
  isTripActive,
  className = '',
  layout = 'vertical',
}) => {
  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  if (layout === 'horizontal') {
    return (
      <div
        id="trip-telemetry-cluster"
        className={`grid grid-cols-3 gap-2 w-full ${className}`}
      >
        {/* 1. VELOCIDAD MÁXIMA */}
        <div
          id="module-max-speed"
          className="relative flex flex-col justify-center px-2.5 py-2 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm"
        >
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#e63946]" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold tracking-[0.1em] text-[#8e9aa8] uppercase font-display truncate">
              V. MÁX
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e63946]/70 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              id="val-max-speed"
              className="text-[20px] sm:text-[22px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
            >
              {Math.round(maxSpeed)}
            </span>
            <span className="text-[9.5px] font-medium text-[#e63946] font-display uppercase">
              km/h
            </span>
          </div>
        </div>

        {/* 2. DISTANCIA RECORRIDA */}
        <div
          id="module-distance"
          className="relative flex flex-col justify-center px-2.5 py-2 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm"
        >
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#38bdf8]" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold tracking-[0.1em] text-[#8e9aa8] uppercase font-display truncate">
              DISTANCIA
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/70 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              id="val-distance"
              className="text-[20px] sm:text-[22px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
            >
              {distanceKm.toFixed(1)}
            </span>
            <span className="text-[9.5px] font-medium text-[#38bdf8] font-display uppercase">
              km
            </span>
          </div>
        </div>

        {/* 3. TIEMPO DE VIAJE */}
        <div
          id="module-time"
          className="relative flex flex-col justify-center px-2.5 py-2 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm"
        >
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#34d399]" />
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold tracking-[0.1em] text-[#8e9aa8] uppercase font-display truncate">
              TIEMPO
            </span>
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isTripActive ? 'bg-[#34d399] animate-pulse' : 'bg-[#34d399]/70'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              id="val-trip-time"
              className="text-[19px] sm:text-[21px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
            >
              {formatTime(tripSeconds)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Standard Vertical Layout (for Landscape side panel)
  return (
    <div
      id="trip-telemetry-cluster"
      className={`flex flex-col justify-between gap-2 sm:gap-2.5 w-full ${className}`}
    >
      {/* 1. VELOCIDAD MÁXIMA */}
      <div
        id="module-max-speed"
        className="relative flex flex-col justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm transition-all duration-200"
      >
        <div className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r bg-[#e63946]" />
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.12em] text-[#8e9aa8] uppercase font-display">
            VELOCIDAD MÁXIMA
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#e63946]/70" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            id="val-max-speed"
            className="text-[24px] sm:text-[28px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
          >
            {Math.round(maxSpeed)}
          </span>
          <span className="text-[10.5px] font-medium text-[#e63946] font-display uppercase tracking-wider">
            km/h
          </span>
        </div>
      </div>

      {/* 2. DISTANCIA RECORRIDA */}
      <div
        id="module-distance"
        className="relative flex flex-col justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm transition-all duration-200"
      >
        <div className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r bg-[#38bdf8]" />
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.12em] text-[#8e9aa8] uppercase font-display">
            DISTANCIA RECORRIDA
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]/70" />
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            id="val-distance"
            className="text-[24px] sm:text-[28px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
          >
            {distanceKm.toFixed(1)}
          </span>
          <span className="text-[10.5px] font-medium text-[#38bdf8] font-display uppercase tracking-wider">
            km
          </span>
        </div>
      </div>

      {/* 3. TIEMPO DE VIAJE */}
      <div
        id="module-time"
        className="relative flex flex-col justify-center px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[#0e1219]/90 border border-[#1d2330] backdrop-blur-sm transition-all duration-200"
      >
        <div className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r bg-[#34d399]" />
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.12em] text-[#8e9aa8] uppercase font-display">
            TIEMPO DE VIAJE
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isTripActive ? 'bg-[#34d399] animate-pulse' : 'bg-[#34d399]/70'
            }`}
          />
        </div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            id="val-trip-time"
            className="text-[22px] sm:text-[26px] font-bold text-[#ffffff] font-gauge tracking-tight font-mono-num leading-none"
          >
            {formatTime(tripSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
