import React, { useState } from 'react';
import { TripSession } from '../types/instrument';
import { playSwitchFeedback } from '../services/audioHaptics';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TripSession[];
  onDeleteSession?: (id: string) => void;
  onClearHistory: () => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onDeleteSession,
  onClearHistory,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const formatDateTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Cumulative stats
  const totalDistance = history.reduce((acc, curr) => acc + curr.distanceKm, 0);
  const totalDurationSec = history.reduce((acc, curr) => acc + curr.durationSec, 0);
  const maxRecordedSpeed = history.length > 0 ? Math.max(...history.map((s) => s.maxSpeedKmh)) : 0;

  return (
    <div
      id="trip-history-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="trip-history-modal"
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-[#0d1017] border border-[#232a38] shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#1b2230] bg-[#090c12]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
            <h2 className="text-[12px] sm:text-[13px] font-bold tracking-[0.16em] uppercase text-[#f1f5f9] font-gauge">
              REGISTRO DE VIAJES - CLIO DE RAMA
            </h2>
          </div>
          <button
            id="btn-close-history"
            type="button"
            onClick={() => {
              playSwitchFeedback('click');
              onClose();
            }}
            className="px-2.5 py-1 rounded-lg bg-[#141923] hover:bg-[#1f2737] active:bg-[#090c12] border border-[#232b3c] text-[#94a3b8] hover:text-[#f1f5f9] text-[10.5px] font-semibold tracking-wider transition-colors"
          >
            CERRAR ✕
          </button>
        </div>

        {/* Global Summary Metric Bar */}
        <div className="grid grid-cols-3 gap-2 px-4 sm:px-5 py-2.5 bg-[#10141d]/80 border-b border-[#1b2230]">
          <div className="flex flex-col">
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              TOTAL RECORRIDO
            </span>
            <span className="text-[15px] sm:text-[18px] font-bold text-[#38bdf8] font-mono-num">
              {totalDistance.toFixed(1)} <span className="text-[10px] sm:text-[11px] font-normal text-[#94a3b8]">km</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              V. MÁXIMA HISTÓRICA
            </span>
            <span className="text-[15px] sm:text-[18px] font-bold text-[#ff4d5a] font-mono-num">
              {Math.round(maxRecordedSpeed)} <span className="text-[10px] sm:text-[11px] font-normal text-[#94a3b8]">km/h</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider text-[#64748b] font-medium">
              TIEMPO ACUMULADO
            </span>
            <span className="text-[15px] sm:text-[18px] font-bold text-[#34d399] font-mono-num">
              {formatDuration(totalDurationSec)}
            </span>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[48vh]">
          {history.length === 0 ? (
            <div className="py-12 text-center text-[#556172] text-[11.5px] font-medium tracking-wide">
              No hay viajes registrados. Los registros de viaje se guardan aquí al finalizar.
            </div>
          ) : (
            history.map((session, index) => {
              const { dateStr, timeStr } = formatDateTime(session.startTime);
              return (
                <div
                  key={session.id || index}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#111620] hover:bg-[#151c2a] border border-[#1d2535] transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-[12px] font-bold text-[#f1f5f9] font-gauge">
                        {dateStr}
                      </span>
                      <span className="text-[9.5px] text-[#64748b] font-mono-num">
                        {timeStr}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-[#7d8b9d] font-mono-num">
                      Promedio: {session.avgSpeedKmh.toFixed(1)} km/h
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 text-right font-mono-num">
                    <div className="flex flex-col">
                      <span className="text-[8.5px] text-[#64748b] uppercase tracking-wider">
                        DISTANCIA
                      </span>
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#38bdf8]">
                        {session.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[8.5px] text-[#64748b] uppercase tracking-wider">
                        V. MÁX
                      </span>
                      <span className="text-[12px] sm:text-[13px] font-bold text-[#ff4d5a]">
                        {Math.round(session.maxSpeedKmh)} km/h
                      </span>
                    </div>

                    <div className="flex flex-col min-w-[55px] sm:min-w-[65px]">
                      <span className="text-[8.5px] text-[#64748b] uppercase tracking-wider">
                        DURACIÓN
                      </span>
                      <span className="text-[12px] sm:text-[13px] font-semibold text-[#34d399]">
                        {formatDuration(session.durationSec)}
                      </span>
                    </div>

                    {/* Delete single session button */}
                    {onDeleteSession && (
                      <button
                        type="button"
                        onClick={() => {
                          playSwitchFeedback('stop');
                          onDeleteSession(session.id);
                        }}
                        title="Eliminar este viaje permanentemente"
                        className="p-1.5 rounded-lg bg-[#181d28] hover:bg-[#2b1618] text-[#64748b] hover:text-[#ef4444] border border-[#232b3c] transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-[#1b2230] bg-[#090c12]">
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#ef4444] font-medium">¿Confirmar borrado total?</span>
              <button
                type="button"
                onClick={() => {
                  playSwitchFeedback('stop');
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-0.5 rounded bg-[#991b1b] hover:bg-[#b91c1c] text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                SÍ, BORRAR
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 rounded bg-[#1f293d] hover:bg-[#2b3850] text-[#94a3b8] text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                CANCELAR
              </button>
            </div>
          ) : (
            <button
              id="btn-clear-history"
              type="button"
              disabled={history.length === 0}
              onClick={() => {
                playSwitchFeedback('stop');
                setShowClearConfirm(true);
              }}
              className="text-[10px] uppercase font-semibold tracking-wider text-[#991b1b] hover:text-[#ef4444] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              BORRAR TODOS LOS REGISTROS
            </button>
          )}

          <span className="text-[10px] text-[#475569] font-mono-num">
            {history.length} {history.length === 1 ? 'viaje guardado' : 'viajes guardados'}
          </span>
        </div>
      </div>
    </div>
  );
};
