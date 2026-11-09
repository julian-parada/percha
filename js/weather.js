// Clima con Open-Meteo (gratis, sin API key, uso no comercial).
// Si algún día cobras por la app, cambia este archivo por un plan pago
// de Open-Meteo u otro proveedor: el resto de la app no se entera.

export const CIUDADES = {
  ocana:       { nombre: 'Ocaña',        lat: 8.2378, lon: -73.3560, tempAprox: 22 },
  cucuta:      { nombre: 'Cúcuta',       lat: 7.8939, lon: -72.5078, tempAprox: 30 },
  bucaramanga: { nombre: 'Bucaramanga',  lat: 7.1193, lon: -73.1227, tempAprox: 24 },
  bogota:      { nombre: 'Bogotá',       lat: 4.7110, lon: -74.0721, tempAprox: 14 },
  medellin:    { nombre: 'Medellín',     lat: 6.2442, lon: -75.5812, tempAprox: 23 },
  barranquilla:{ nombre: 'Barranquilla', lat: 10.9685, lon: -74.7813, tempAprox: 30 },
  cali:        { nombre: 'Cali',         lat: 3.4516, lon: -76.5320, tempAprox: 26 },
};

const CODIGOS = [
  [[0], 'Despejado', '☀️'],
  [[1, 2], 'Parcialmente nublado', '⛅'],
  [[3], 'Nublado', '☁️'],
  [[45, 48], 'Neblina', '🌫️'],
  [[51, 53, 55, 56, 57], 'Llovizna', '🌦️'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Lluvia', '🌧️'],
  [[71, 73, 75, 77, 85, 86], 'Nieve', '❄️'],
  [[95, 96, 99], 'Tormenta', '⛈️'],
];

function describir(code) {
  const f = CODIGOS.find(([cs]) => cs.includes(code));
  return f ? { texto: f[1], icono: f[2] } : { texto: 'Clima', icono: '🌡️' };
}

export function banda(temp) {
  if (temp >= 26) return 'calor';
  if (temp >= 18) return 'templado';
  return 'frio';
}

export async function obtenerClima({ ciudad, lat, lon } = {}) {
  const c = CIUDADES[ciudad] || null;
  const la = lat ?? c?.lat ?? CIUDADES.ocana.lat;
  const lo = lon ?? c?.lon ?? CIUDADES.ocana.lon;
  const nombre = c?.nombre || 'Tu ubicación';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}` +
    `&current=temperature_2m,apparent_temperature,weather_code,precipitation` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const temp = Math.round(j.current.temperature_2m);
    const d = describir(j.current.weather_code);
    return {
      ciudad: nombre, temp,
      sensacion: Math.round(j.current.apparent_temperature),
      max: Math.round(j.daily.temperature_2m_max[0]),
      min: Math.round(j.daily.temperature_2m_min[0]),
      lluvia: j.daily.precipitation_probability_max?.[0] ?? 0,
      ...d, banda: banda(temp), aprox: false,
    };
  } catch (e) {
    // Sin internet: usa la temperatura típica de la ciudad
    const temp = c?.tempAprox ?? 22;
    return { ciudad: nombre, temp, sensacion: temp, max: temp + 4, min: temp - 5, lluvia: 30,
      texto: 'Clima aproximado', icono: '🌡️', banda: banda(temp), aprox: true };
  }
}
