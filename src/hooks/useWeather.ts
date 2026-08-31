import { useState, useEffect, useRef } from 'react';

export interface WeatherData {
  temp: number;
  apparentTemp: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeedKmh: number;
  precipitationMm: number;
  isDay: boolean;
  isLoading: boolean;
  error: string | null;
}

// Map WMO weather codes to human-readable Spanish descriptions and weather icons
function getWeatherInfo(code: number, isDay: boolean): { condition: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Despejado', icon: isDay ? '☀️' : '🌙' };
    case 1:
      return { condition: 'Mayormente despejado', icon: isDay ? '🌤️' : '🌙' };
    case 2:
      return { condition: 'Parcialmente nublado', icon: '⛅' };
    case 3:
      return { condition: 'Nublado', icon: '☁️' };
    case 45:
    case 48:
      return { condition: 'Niebla', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Llovizna', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Lluvia', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Nieve', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Chubascos', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Tormenta eléctrica', icon: '⛈️' };
    default:
      return { condition: 'Estable', icon: isDay ? '🌤️' : '🌙' };
  }
}

export function useWeather(latitude: number | null, longitude: number | null, isSimulated: boolean) {
  const [weather, setWeather] = useState<WeatherData>({
    temp: 21,
    apparentTemp: 21,
    condition: 'Consultando...',
    icon: '🌤️',
    humidity: 55,
    windSpeedKmh: 12,
    precipitationMm: 0,
    isDay: true,
    isLoading: false,
    error: null,
  });

  const lastCoordsRef = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    // If no coordinates yet, use simulated or standard default coordinates
    const targetLat = latitude ?? -34.6037;
    const targetLng = longitude ?? -58.3816;

    const now = Date.now();
    // Cache check: only re-fetch if moved > 0.02 deg (~2km) or > 15 minutes since last fetch
    if (lastCoordsRef.current) {
      const dLat = Math.abs(lastCoordsRef.current.lat - targetLat);
      const dLng = Math.abs(lastCoordsRef.current.lng - targetLng);
      const timeDiff = now - lastCoordsRef.current.time;
      if (dLat < 0.02 && dLng < 0.02 && timeDiff < 15 * 60 * 1000) {
        return;
      }
    }

    let isMounted = true;
    const fetchWeather = async () => {
      try {
        setWeather((prev) => ({ ...prev, isLoading: true, error: null }));
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error('Respuesta meteorológica no disponible');
        const data = await res.json();
        
        if (!isMounted) return;

        const current = data.current;
        const isDay = current.is_day === 1;
        const { condition, icon } = getWeatherInfo(current.weather_code, isDay);

        lastCoordsRef.current = { lat: targetLat, lng: targetLng, time: Date.now() };

        setWeather({
          temp: Math.round(current.temperature_2m),
          apparentTemp: Math.round(current.apparent_temperature),
          condition,
          icon,
          humidity: Math.round(current.relative_humidity_2m),
          windSpeedKmh: Math.round(current.wind_speed_10m),
          precipitationMm: current.precipitation || 0,
          isDay,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (!isMounted) return;
        setWeather((prev) => ({
          ...prev,
          isLoading: false,
          error: err?.message || 'Error al obtener clima',
        }));
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, isSimulated]);

  return weather;
}
