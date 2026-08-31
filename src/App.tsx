/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useGpsTracker } from './hooks/useGpsTracker';
import { useWeather } from './hooks/useWeather';
import { SpeedometerGauge } from './components/SpeedometerGauge';
import { TripTelemetryModule } from './components/TripTelemetryModule';
import { TopStatusBar } from './components/TopStatusBar';
import { SecondaryTelemetryBar } from './components/SecondaryTelemetryBar';
import { ControlButtons } from './components/ControlButtons';
import { TripHistoryModal } from './components/TripHistoryModal';
import { TripSession } from './types/instrument';

export default function App() {
  const {
    telemetry,
    tripStatus,
    signalQuality,
    isSimulated,
    setIsSimulated,
    history,
    startTrip,
    endTrip,
    deleteTripSession,
    clearHistory,
  } = useGpsTracker();

  // Geolocation-based weather
  const weather = useWeather(telemetry.latitude, telemetry.longitude, isSimulated);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [completedTripSummary, setCompletedTripSummary] = useState<TripSession | null>(null);
  const [isLandscape, setIsLandscape] = useState<boolean>(true);

  // Monitor orientation & viewport
  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isLand = window.innerWidth >= window.innerHeight;
        setIsLandscape(isLand);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleEndTripAction = () => {
    const session = endTrip();
    if (session) {
      setCompletedTripSummary(session);
    }
  };

  return (
    <div
      id="instrument-cluster-root"
      className="relative w-screen h-screen overflow-hidden bg-[#06080b] p-[15px] box-border text-[#e2e8f0] flex flex-col justify-between select-none"
      style={{
        padding: '15px', // Exact 15px outer padding
      }}
    >
      {/* 1. TOP STATUS BAR (Brand 'CLIO DE RAMA', GPS Lock, Weather Badge, History access) */}
      <TopStatusBar
        signalQuality={signalQuality}
        accuracy={telemetry.accuracy}
        latitude={telemetry.latitude}
        longitude={telemetry.longitude}
        isSimulated={isSimulated}
        onToggleSimulated={() => setIsSimulated(!isSimulated)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        tripCount={history.length}
        weather={weather}
      />

      {/* 2. MAIN INSTRUMENT CLUSTER BODY */}
      {isLandscape ? (
        /* ================= HORIZONTAL / LANDSCAPE LAYOUT (PRIMARY AUTOMOTIVE COCKPIT) ================= */
        <main
          id="cluster-landscape-layout"
          className="flex-1 w-full my-1.5 sm:my-2 grid grid-cols-12 gap-3 items-center min-h-0 overflow-hidden"
        >
          {/* Left Column: Speedometer (occupying ~50% / 6 cols of the cluster) */}
          <div
            id="speedometer-column"
            className="col-span-6 h-full flex items-center justify-center relative min-h-0"
          >
            <SpeedometerGauge
              speed={telemetry.speed}
              accuracy={telemetry.accuracy}
              isLandscape={true}
              className="w-full h-full max-h-[290px] sm:max-h-[340px]"
            />
          </div>

          {/* Right Column: 3 Trip Telemetry Modules + Main Controls (6 cols) */}
          <div
            id="telemetry-controls-column"
            className="col-span-6 h-full flex flex-col justify-between py-1 pl-1 min-h-0"
          >
            {/* 3 Trip Telemetry Modules (Velocidad Máxima, Distancia Recorrida, Tiempo de Viaje) */}
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <TripTelemetryModule
                maxSpeed={telemetry.maxSpeed}
                distanceKm={telemetry.distanceKm}
                tripSeconds={telemetry.tripSeconds}
                isTripActive={tripStatus === 'ACTIVE'}
                layout="vertical"
              />
            </div>

            {/* Primary & Secondary Action Controls (Iniciar Viaje / Finalizar) */}
            <div className="mt-2 shrink-0">
              <ControlButtons
                tripStatus={tripStatus}
                onStartTrip={startTrip}
                onEndTrip={handleEndTripAction}
              />
            </div>
          </div>
        </main>
      ) : (
        /* ================= VERTICAL / PORTRAIT ADAPTIVE LAYOUT ================= */
        <main
          id="cluster-portrait-layout"
          className="flex-1 w-full my-1.5 flex flex-col justify-between items-center min-h-0 overflow-hidden"
        >
          {/* Top Main: Speedometer */}
          <div className="flex-1 w-full min-h-0 max-h-[46vh] flex items-center justify-center">
            <SpeedometerGauge
              speed={telemetry.speed}
              accuracy={telemetry.accuracy}
              isLandscape={false}
              className="w-full h-full"
            />
          </div>

          {/* Center: 3 Trip Telemetry Modules in Horizontal Row for minimal vertical footprint */}
          <div className="w-full my-2 shrink-0">
            <TripTelemetryModule
              maxSpeed={telemetry.maxSpeed}
              distanceKm={telemetry.distanceKm}
              tripSeconds={telemetry.tripSeconds}
              isTripActive={tripStatus === 'ACTIVE'}
              layout="horizontal"
            />
          </div>

          {/* Bottom: Action Controls */}
          <div className="w-full mt-1 shrink-0">
            <ControlButtons
              tripStatus={tripStatus}
              onStartTrip={startTrip}
              onEndTrip={handleEndTripAction}
            />
          </div>
        </main>
      )}

      {/* 3. SECONDARY TELEMETRY BAR (Altitud, Rumbo, Precisión, Clima, Satélites - No battery) */}
      <SecondaryTelemetryBar
        altitude={telemetry.altitude}
        heading={telemetry.heading}
        accuracy={telemetry.accuracy}
        satellites={telemetry.satellites}
        weather={weather}
      />

      {/* 4. TRIP HISTORY MODAL */}
      <TripHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onDeleteSession={deleteTripSession}
        onClearHistory={clearHistory}
      />

      {/* 5. TRIP COMPLETED NOTIFICATION DIALOG */}
      {completedTripSummary && (
        <div
          id="trip-completed-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setCompletedTripSummary(null)}
        >
          <div
            className="w-full max-w-sm p-4 sm:p-5 rounded-2xl bg-[#0d1017] border border-[#262f40] shadow-[0_20px_40px_rgba(0,0,0,0.9)] flex flex-col gap-3.5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34d399]" />
              <h3 className="text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#f1f5f9] font-gauge">
                VIAJE FINALIZADO
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#111620] border border-[#1b2230] text-left">
              <div>
                <div className="text-[8.5px] text-[#64748b] uppercase tracking-wider">Distancia</div>
                <div className="text-[15px] sm:text-[16px] font-bold text-[#38bdf8] font-mono-num">
                  {completedTripSummary.distanceKm.toFixed(1)} km
                </div>
              </div>
              <div>
                <div className="text-[8.5px] text-[#64748b] uppercase tracking-wider">Vel. Máxima</div>
                <div className="text-[15px] sm:text-[16px] font-bold text-[#ff4d5a] font-mono-num">
                  {Math.round(completedTripSummary.maxSpeedKmh)} km/h
                </div>
              </div>
              <div>
                <div className="text-[8.5px] text-[#64748b] uppercase tracking-wider">Duración</div>
                <div className="text-[13px] sm:text-[14px] font-semibold text-[#34d399] font-mono-num">
                  {Math.floor(completedTripSummary.durationSec / 60)}m {completedTripSummary.durationSec % 60}s
                </div>
              </div>
              <div>
                <div className="text-[8.5px] text-[#64748b] uppercase tracking-wider">Promedio</div>
                <div className="text-[13px] sm:text-[14px] font-semibold text-[#f1f5f9] font-mono-num">
                  {completedTripSummary.avgSpeedKmh.toFixed(1)} km/h
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setCompletedTripSummary(null);
                  setIsHistoryOpen(true);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#171e2b] hover:bg-[#20293a] border border-[#2a3548] text-[10.5px] sm:text-[11px] font-bold tracking-wider uppercase text-[#cbd5e1] transition-colors font-gauge"
              >
                VER HISTORIAL
              </button>
              <button
                type="button"
                onClick={() => setCompletedTripSummary(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#34d399]/20 hover:bg-[#34d399]/30 border border-[#34d399]/40 text-[10.5px] sm:text-[11px] font-bold tracking-wider uppercase text-[#34d399] transition-colors font-gauge"
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
