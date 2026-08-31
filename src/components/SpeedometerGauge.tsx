import React, { useMemo } from 'react';

interface SpeedometerGaugeProps {
  speed: number;        // 0 to 140 km/h (smoothed)
  maxScale?: number;    // default 140
  accuracy?: number | null;
  className?: string;
  isLandscape?: boolean;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({
  speed,
  maxScale = 140,
  className = '',
  isLandscape = true,
}) => {
  const clampedSpeed = Math.min(maxScale, Math.max(0, speed));

  // Geometry configuration:
  // Automotive dial sweep: 240 degrees symmetrical arc from -120° (bottom-left) to +120° (bottom-right)
  // 0 km/h is at -120° (8 o'clock)
  // 70 km/h is at 0° (12 o'clock / straight up)
  // 140 km/h is at +120° (4 o'clock)
  const START_ANGLE = -120;
  const SWEEP_ANGLE = 240;
  const END_ANGLE = START_ANGLE + SWEEP_ANGLE; // +120°

  const cx = 200;
  const cy = 200;
  const radius = 152;

  // Convert angle in degrees clockwise from 12 o'clock (0° = Top) to SVG cartesian coordinates
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.sin(rad),
      y: centerY - r * Math.cos(rad),
    };
  };

  // Generate SVG path for a clockwise arc from startAngle to endAngle
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, startAngle);
    const end = polarToCartesian(x, y, r, endAngle);
    const diff = endAngle - startAngle;
    const largeArcFlag = diff > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  // Current angle for needle and active illumination track
  const currentAngle = START_ANGLE + (clampedSpeed / maxScale) * SWEEP_ANGLE;

  // Background arc path
  const backgroundTrackPath = useMemo(() => {
    return describeArc(cx, cy, radius, START_ANGLE, END_ANGLE);
  }, []);

  // Active highlighted speed arc path (illuminates from 0 km/h up to the exact needle angle)
  const activeTrackPath = useMemo(() => {
    if (clampedSpeed <= 0.2) return '';
    return describeArc(cx, cy, radius, START_ANGLE, currentAngle);
  }, [clampedSpeed, currentAngle]);

  // Tick markers and scale numerals
  const { majorTicks, minorTicks, microTicks, labels } = useMemo(() => {
    const majors: { x1: number; y1: number; x2: number; y2: number; speedVal: number }[] = [];
    const minors: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const micros: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const textLabels: { x: number; y: number; text: string; active: boolean }[] = [];

    // Scale from 0 to 200 in steps of 2 km/h
    for (let s = 0; s <= maxScale; s += 2) {
      const angle = START_ANGLE + (s / maxScale) * SWEEP_ANGLE;
      const isMajor = s % 20 === 0;
      const isMinor = s % 10 === 0 && !isMajor;
      const isMicro = !isMajor && !isMinor && s % 5 === 0;

      if (isMajor) {
        // Longest tick
        const p1 = polarToCartesian(cx, cy, radius + 2, angle);
        const p2 = polarToCartesian(cx, cy, radius - 14, angle);
        majors.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, speedVal: s });

        // Label position placed inwards
        const textPos = polarToCartesian(cx, cy, radius - 27, angle);
        textLabels.push({
          x: textPos.x,
          y: textPos.y,
          text: s.toString(),
          active: clampedSpeed >= s,
        });
      } else if (isMinor) {
        // Medium tick
        const p1 = polarToCartesian(cx, cy, radius + 1, angle);
        const p2 = polarToCartesian(cx, cy, radius - 9, angle);
        minors.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      } else if (isMicro) {
        // Small tick
        const p1 = polarToCartesian(cx, cy, radius, angle);
        const p2 = polarToCartesian(cx, cy, radius - 5, angle);
        micros.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
      }
    }

    return { majorTicks: majors, minorTicks: minors, microTicks: micros, labels: textLabels };
  }, [maxScale, clampedSpeed]);

  const displaySpeed = Math.round(clampedSpeed);

  return (
    <div
      id="speedometer-container"
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Outer subtle atmospheric rim & instrument housing */}
      <div className="relative w-full h-full max-w-[370px] max-h-[370px] aspect-square flex items-center justify-center">
        
        {/* Subtle graphite cluster bezel backdrop */}
        <div className="absolute inset-1.5 rounded-full bg-radial from-[#10141c]/90 via-[#0a0d13]/95 to-[#06080b] border border-[#1e2430]/70 shadow-inner" />
        
        {/* Center mechanical glare reduction pattern */}
        <div className="absolute w-[200px] h-[200px] rounded-full bg-radial from-[#131822]/60 to-transparent pointer-events-none opacity-60" />

        {/* SVG Instrument Gauge */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full z-10 overflow-visible"
          id="speedometer-svg"
        >
          <defs>
            {/* Active red track gradient */}
            <linearGradient id="activeTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4d5a" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#e63946" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff1e2d" stopOpacity="1" />
            </linearGradient>

            {/* Subtle glow filter for active elements */}
            <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Center Boss Radial Gradient */}
            <radialGradient id="centerBossGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#2a303d" />
              <stop offset="60%" stopColor="#141820" />
              <stop offset="100%" stopColor="#0a0c10" />
            </radialGradient>

            {/* Needle Blade Linear Gradient */}
            <linearGradient id="needleBladeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff3b4b" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ff3b4b" />
            </linearGradient>
          </defs>

          {/* Secondary outer reference ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 14}
            fill="none"
            stroke="#161b24"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.6"
          />

          {/* Background Inactive Arc Track */}
          <path
            d={backgroundTrackPath}
            fill="none"
            stroke="#181d26"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Micro Ticks */}
          {microTicks.map((tick, i) => (
            <line
              key={`micro-${i}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#262d3a"
              strokeWidth="1"
              strokeLinecap="round"
            />
          ))}

          {/* Minor Ticks */}
          {minorTicks.map((tick, i) => (
            <line
              key={`minor-${i}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#40495a"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}

          {/* Major Ticks */}
          {majorTicks.map((tick, i) => {
            const isPassed = clampedSpeed >= tick.speedVal;
            return (
              <line
                key={`major-${i}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke={isPassed ? '#ff4d5a' : '#738096'}
                strokeWidth={isPassed ? '2.5' : '2'}
                strokeLinecap="round"
                className="transition-colors duration-150"
              />
            );
          })}

          {/* Active Red Arc Illumination */}
          {activeTrackPath && (
            <path
              d={activeTrackPath}
              fill="none"
              stroke="url(#activeTrackGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#redGlow)"
            />
          )}

          {/* Dial Scale Numerals */}
          {labels.map((lbl, idx) => (
            <text
              key={`lbl-${idx}`}
              x={lbl.x}
              y={lbl.y + 4.5}
              textAnchor="middle"
              className={`font-gauge transition-colors duration-150 ${
                lbl.active
                  ? 'fill-[#f1f5f9] font-semibold text-[13px]'
                  : 'fill-[#586274] font-medium text-[12px]'
              }`}
            >
              {lbl.text}
            </text>
          ))}

          {/* Physical / Virtual Precision Needle (Starts at exact 0 km/h at -120° and rotates clockwise) */}
          <g
            transform={`rotate(${currentAngle} ${cx} ${cy})`}
            className="transition-transform duration-75 ease-out"
          >
            {/* Needle Shadow */}
            <path
              d={`M ${cx - 3} ${cy} L ${cx} ${cy - (radius - 8)} L ${cx + 3} ${cy} L ${cx} ${cy + 24} Z`}
              fill="rgba(0,0,0,0.5)"
              transform="translate(1, 2)"
            />

            {/* Needle Blade: Tapered fine pointer pointing upwards to (cy - (radius - 4)) */}
            <path
              d={`M ${cx - 2.5} ${cy} L ${cx - 0.75} ${cy - (radius - 12)} L ${cx} ${cy - (radius - 4)} L ${cx + 0.75} ${cy - (radius - 12)} L ${cx + 2.5} ${cy} L ${cx + 3.5} ${cy + 22} L ${cx - 3.5} ${cy + 22} Z`}
              fill="url(#needleBladeGrad)"
              filter="drop-shadow(0 0 3px rgba(255, 59, 75, 0.7))"
            />

            {/* Luminous High-Intensity Tip */}
            <line
              x1={cx}
              y1={cy - (radius - 30)}
              x2={cx}
              y2={cy - (radius - 3)}
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* Counterweight accent */}
            <circle
              cx={cx}
              cy={cy + 16}
              r="2.5"
              fill="#222834"
              stroke="#ff4d5a"
              strokeWidth="0.8"
            />
          </g>

          {/* Mechanical Center Hub (Milled boss cap) */}
          <g id="center-hub">
            {/* Outer mechanical bezel ring */}
            <circle
              cx={cx}
              cy={cy}
              r="26"
              fill="#12161f"
              stroke="#2c3444"
              strokeWidth="1.5"
              filter="drop-shadow(0 2px 5px rgba(0,0,0,0.8))"
            />
            {/* Concentric grooved ring */}
            <circle
              cx={cx}
              cy={cy}
              r="20"
              fill="url(#centerBossGrad)"
              stroke="#1b202a"
              strokeWidth="1"
            />
            {/* Inner jewel pin */}
            <circle
              cx={cx}
              cy={cy}
              r="5"
              fill="#ff3b4b"
              filter="drop-shadow(0 0 2px rgba(255,59,75,0.8))"
            />
            <circle
              cx={cx - 1}
              cy={cy - 1}
              r="1.5"
              fill="#ffffff"
              opacity="0.9"
            />
          </g>
        </svg>

        {/* Central Digital Readout (Harmoniously centered below the needle hub and balanced above KM/H) */}
        <div
          id="digital-speed-readout"
          className="absolute z-20 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ top: '61%' }}
        >
          {/* Razor sharp digital digits */}
          <div className="flex items-baseline justify-center">
            <span
              id="current-speed-value"
              className="text-[52px] sm:text-[58px] leading-none font-bold tracking-tight text-[#ffffff] font-gauge drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]"
            >
              {displaySpeed}
            </span>
          </div>

          {/* Sub-unit label with balanced breathing room */}
          <div className="text-[11.5px] sm:text-[12.5px] font-bold tracking-[0.18em] text-[#8e9aa8] uppercase mt-1 sm:mt-1.5 font-gauge">
            km/h
          </div>
        </div>

      </div>
    </div>
  );
};
