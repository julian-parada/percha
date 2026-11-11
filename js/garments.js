// Catálogo de tipos de prenda, zonas del maniquí, utilidades de color
// y dibujos SVG de prendas (para cuando no hay foto).

// Coordenadas en el sistema del maniquí (viewBox 0 0 300 600): [x, y, ancho, alto]
export const ZONAS = {
  piernas: { label: 'Abajo',   box: [98, 284, 104, 264], z: 10 },
  pies:    { label: 'Pies',    box: [88, 532, 124, 44],  z: 15 },
  torso:   { label: 'Arriba',  box: [66, 118, 168, 190], z: 20 },
  cuello:  { label: 'Cadena',  box: [124, 112, 52, 64],  z: 25 },
  capa:    { label: 'Encima',  box: [54, 112, 192, 214], z: 30 },
  cabeza:  { label: 'Cabeza',  box: [106, 20, 88, 62],   z: 50 },
  cara:    { label: 'Gafas',   box: [116, 54, 68, 24],   z: 55 },
  muneca:  { label: 'Reloj',   box: [54, 284, 32, 24],   z: 60 },
};

// Zonas que tienen flechas para rotar prendas en el probador
export const ZONAS_ROTABLES = ['cabeza', 'torso', 'capa', 'piernas', 'pies'];

export const COMPARTIMENTOS = {
  gorras:     { label: 'Gorras',               estilo: 'repisa'   },
  camisetas:  { label: 'Camisetas y camisas',  estilo: 'colgado'  },
  abrigos:    { label: 'Buzos y chaquetas',    estilo: 'colgado'  },
  pantalones: { label: 'Pantalones y shorts',  estilo: 'repisa'   },
  zapatos:    { label: 'Zapatos',              estilo: 'zapatera' },
  accesorios: { label: 'Accesorios',           estilo: 'cajon'    },
};

export const TIPOS = {
  gorra:     { label: 'Gorra',              zona: 'cabeza',  comp: 'gorras' },
  sombrero:  { label: 'Bucket / sombrero',  zona: 'cabeza',  comp: 'gorras' },
  gorro:     { label: 'Gorro de lana',      zona: 'cabeza',  comp: 'gorras' },
  camiseta:  { label: 'Camiseta',           zona: 'torso',   comp: 'camisetas' },
  camisa:    { label: 'Camisa',             zona: 'torso',   comp: 'camisetas' },
  polo:      { label: 'Polo',               zona: 'torso',   comp: 'camisetas' },
  esqueleto: { label: 'Esqueleto',          zona: 'torso',   comp: 'camisetas' },
  buzo:      { label: 'Buzo',               zona: 'capa',    comp: 'abrigos' },
  hoodie:    { label: 'Hoodie con capota',  zona: 'capa',    comp: 'abrigos' },
  chaqueta:  { label: 'Chaqueta',           zona: 'capa',    comp: 'abrigos' },
  jean:      { label: 'Jean',               zona: 'piernas', comp: 'pantalones' },
  pantalon:  { label: 'Pantalón de tela',   zona: 'piernas', comp: 'pantalones' },
  jogger:    { label: 'Jogger / sudadera',  zona: 'piernas', comp: 'pantalones' },
  short:     { label: 'Short / bermuda',    zona: 'piernas', comp: 'pantalones' },
  tenis:     { label: 'Tenis',              zona: 'pies',    comp: 'zapatos' },
  botas:     { label: 'Botas',              zona: 'pies',    comp: 'zapatos' },
  zapatos:   { label: 'Zapatos formales',   zona: 'pies',    comp: 'zapatos' },
  gafas:     { label: 'Gafas',              zona: 'cara',    comp: 'accesorios' },
  cadena:    { label: 'Cadena',             zona: 'cuello',  comp: 'accesorios' },
  reloj:     { label: 'Reloj',              zona: 'muneca',  comp: 'accesorios' },
};

// Medidas en cm que se piden según la zona de la prenda (medidas "en plano", con la prenda acostada).
// "escala: true" = esa medida define el tamaño real de la foto en el maniquí.
const M = (k, label, ayuda, extra = {}) => ({ k, label, ayuda, ...extra });
export const MEDIDAS = {
  torso: [
    M('largo', 'Largo', 'Del cuello al ruedo', { escala: true }),
    M('hombros', 'Hombros', 'De costura a costura'),
    M('pecho', 'Pecho', 'De axila a axila'),
    M('cintura', 'Cintura', 'A la altura del ombligo'),
    M('ruedo', 'Ruedo', 'Ancho del borde de abajo'),
  ],
  piernas: [
    M('largo', 'Largo', 'De la cintura a la bota', { escala: true }),
    M('cintura', 'Cintura', 'De lado a lado, arriba'),
    M('cadera', 'Cadera', 'De lado a lado, a la altura del tiro'),
    M('rodilla', 'Rodilla', 'Ancho de una pierna'),
    M('bota', 'Bota', 'Ancho de la boca de una pierna'),
  ],
  short: [
    M('largo', 'Largo', 'De la cintura al borde', { escala: true }),
    M('cintura', 'Cintura', 'De lado a lado, arriba'),
    M('cadera', 'Cadera', 'De lado a lado, a la altura del tiro'),
    M('bota', 'Bota', 'Ancho de la boca de una pierna'),
  ],
  cabeza: [M('talla', 'Talla', 'Ej: 7 1/4, S/M o ajustable', { texto: true })],
  pies: [M('talla', 'Talla', 'Talla colombiana, ej: 40', { texto: true })],
};
MEDIDAS.capa = MEDIDAS.torso;
export const medidasPara = tipo => tipo === 'short' ? MEDIDAS.short : (MEDIDAS[TIPOS[tipo]?.zona] || []);

// Puntos del maniquí (viewBox 300×600): de la coronilla (y=30) al piso (y=563) hay 533 unidades = la altura de la persona.
const ALTO_FIGURA = 533;
const ANCLA = { torso: 116, capa: 110, piernas: 286 };   // dónde empieza cada prenda: cuello, cuello (encima), cintura
const PISO = 574;                                       // más abajo de esto la bota queda escondida bajo los tenis

// Si la prenda tiene foto y largo en cm, devuelve su caja a tamaño real; si no, null (se usa la zona normal)
export function cajaReal(zona, prenda, alturaCm) {
  const largo = +prenda?.medidas?.largo;
  if (!prenda?.imagen_url || !largo || !(zona in ANCLA)) return null;
  const k = ALTO_FIGURA / (+alturaCm || 170);            // unidades por cm
  const y = ANCLA[zona], alto = largo * k;
  const visible = zona === 'piernas' ? Math.min(alto, PISO - y) : alto;
  return { x: 0, y, w: 300, h: visible, alto };
}

export const ESTADOS = {
  disponible: { label: 'Disponible' },
  sucia:      { label: 'Sucia' },
  prestada:   { label: 'Prestada' },
  danada:     { label: 'Dañada' },
};

export const FORMALIDAD = { 1: 'Casual', 2: 'Semiformal', 3: 'Formal' };
export const CLIMAS = { calor: 'Calor', templado: 'Templado', frio: 'Frío', todo: 'Cualquier clima' };

export const OCASIONES = {
  universidad: { label: 'Universidad', formal: [1, 2] },
  salida:      { label: 'Salir con amigos', formal: [1, 2] },
  cita:        { label: 'Cita', formal: [2, 2] },
  formal:      { label: 'Evento formal', formal: [3, 3] },
  deporte:     { label: 'Deporte', formal: [1, 1] },
  casa:        { label: 'Casa / relajado', formal: [1, 1] },
};

// ─── Color ──────────────────────────────────────────────────
export function hexToRgb(hex) {
  if (typeof hex !== 'string' || !/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(hex.trim())) hex = '#777777';
  const h = hex.trim().replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function hexToHsl(hex) {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function hslToHex(h, s, l) {
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
export function shade(hex, dl) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(1, l + dl)));
}
// Para dar contraste: si la prenda es muy oscura, aclara; si es clara, oscurece
export function contrastShade(hex, amt = 0.14) {
  const l = hexToHsl(hex)[2];
  return shade(hex, l < 0.28 ? amt : -amt);
}

export function esNeutro(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.16 || l > 0.9) return true;          // negro / blanco
  if (s < 0.16) return true;                      // grises
  if (h >= 25 && h <= 50 && s < 0.45 && l > 0.55) return true; // beige / caqui
  if (h >= 200 && h <= 232 && s < 0.65 && l > 0.2 && l < 0.6) return true; // denim / azul marino
  return false;
}

export function nombreColor(hex) {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.14) return 'negro';
  if (l > 0.9 && s < 0.5) return 'blanco';
  if (s < 0.12) return l < 0.45 ? 'gris oscuro' : 'gris';
  if (h >= 25 && h <= 50 && s < 0.45 && l > 0.55) return 'beige';
  if (h < 15 || h >= 345) return l < 0.35 ? 'vinotinto' : (l > 0.7 ? 'rosado' : 'rojo');
  if (h < 40) return l < 0.4 ? 'café' : 'naranja';
  if (h < 55) return l < 0.45 ? 'café' : 'mostaza';
  if (h < 75) return 'amarillo';
  if (h < 100) return 'verde oliva';
  if (h < 165) return l < 0.3 ? 'verde oscuro' : 'verde';
  if (h < 195) return 'turquesa';
  if (h < 245) return l < 0.32 ? 'azul oscuro' : (l > 0.7 ? 'azul claro' : 'azul');
  if (h < 290) return 'morado';
  return 'rosado';
}

// Extrae hasta 3 colores dominantes de una imagen (ignora transparencia y fondo blanco)
// soloCentro: si la foto conserva el fondo, mira solo el centro (donde suele estar la prenda)
export function coloresDominantes(img, ignorarBlanco = true, soloCentro = false) {
  const c = document.createElement('canvas');
  const N = 64; c.width = N; c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  if (soloCentro) ctx.drawImage(img, w * 0.3, h * 0.3, w * 0.4, h * 0.4, 0, 0, N, N);
  else ctx.drawImage(img, 0, 0, N, N);
  const d = ctx.getImageData(0, 0, N, N).data;
  const cubos = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 200) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (ignorarBlanco && r > 238 && g > 238 && b > 238) continue;
    const k = (r >> 4) << 8 | (g >> 4) << 4 | (b >> 4);
    const e = cubos.get(k) || { n: 0, r: 0, g: 0, b: 0 };
    e.n++; e.r += r; e.g += g; e.b += b; cubos.set(k, e);
  }
  const lista = [...cubos.values()].sort((a, b) => b.n - a.n)
    .map(e => rgbToHex(e.r / e.n, e.g / e.n, e.b / e.n));
  const out = [];
  for (const hex of lista) {
    const [r, g, b] = hexToRgb(hex);
    if (out.every(o => { const [r2, g2, b2] = hexToRgb(o); return Math.abs(r - r2) + Math.abs(g - g2) + Math.abs(b - b2) > 70; })) out.push(hex);
    if (out.length === 3) break;
  }
  return out.length ? out : ['#777777'];
}

// ─── Dibujos SVG de prendas ─────────────────────────────────
const svgWrap = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}">${body}</svg>`;

function dibujo(tipo, c) {
  const sh = contrastShade(c, 0.12);
  const sh2 = contrastShade(c, 0.22);
  const hi = shade(c, 0.1);
  const st = `stroke="${sh2}" stroke-width="1.2" stroke-linejoin="round"`;
  const costura = '#D9A441';
  switch (tipo) {
    case 'gorra': return svgWrap(88, 62, `
      <path d="M10 50 Q10 8 44 8 Q78 8 78 50 Z" fill="${c}" ${st}/>
      <path d="M44 9 V50 M27 13 Q31 30 28 50 M61 13 Q57 30 60 50" stroke="${sh}" stroke-width="1.2" fill="none"/>
      <circle cx="44" cy="8.5" r="3" fill="${sh}"/>
      <path d="M4 50 Q44 40 84 50 Q87 58 78 60 Q44 53 10 60 Q1 58 4 50 Z" fill="${sh}" ${st}/>`);
    case 'sombrero': return svgWrap(88, 62, `
      <ellipse cx="44" cy="48" rx="42" ry="11" fill="${sh}" ${st}/>
      <path d="M18 46 Q16 10 44 10 Q72 10 70 46 Z" fill="${c}" ${st}/>
      <path d="M17 38 Q44 44 71 38" stroke="${sh}" stroke-width="3" fill="none"/>`);
    case 'gorro': return svgWrap(88, 62, `
      <path d="M12 54 Q10 6 44 6 Q78 6 76 54 Z" fill="${c}" ${st}/>
      <rect x="10" y="38" width="68" height="18" rx="5" fill="${sh}" ${st}/>
      ${[18, 26, 34, 42, 50, 58, 66].map(x => `<line x1="${x}" y1="40" x2="${x}" y2="54" stroke="${sh2}" stroke-width="1"/>`).join('')}`);

    case 'camiseta':
    case 'camisa':
    case 'polo': {
      const base = `<path d="M54 6 Q84 26 114 6 L142 14 L166 52 L146 70 L138 60 L140 184 L28 184 L30 60 L22 70 L2 52 L26 14 Z" fill="${c}" ${st}/>
        <path d="M2 52 L22 70 M166 52 L146 70" stroke="${sh}" stroke-width="3"/>
        <line x1="30" y1="179" x2="138" y2="179" stroke="${sh}" stroke-width="2"/>`;
      if (tipo === 'camiseta') return svgWrap(168, 190, base + `<path d="M54 6 Q84 26 114 6" stroke="${sh}" stroke-width="4" fill="none"/>`);
      if (tipo === 'polo') return svgWrap(168, 190, base + `
        <path d="M54 6 L84 22 L68 30 Z M114 6 L84 22 L100 30 Z" fill="${hi}" ${st}/>
        <line x1="84" y1="22" x2="84" y2="58" stroke="${sh}" stroke-width="1.5"/>
        <circle cx="84" cy="36" r="2.4" fill="${sh2}"/><circle cx="84" cy="50" r="2.4" fill="${sh2}"/>`);
      return svgWrap(168, 190, base + `
        <path d="M54 6 L84 30 L68 36 Z M114 6 L84 30 L100 36 Z" fill="${hi}" ${st}/>
        <line x1="84" y1="30" x2="84" y2="184" stroke="${sh}" stroke-width="1.5"/>
        ${[52, 82, 112, 142, 168].map(y => `<circle cx="88" cy="${y}" r="2.4" fill="${sh2}"/>`).join('')}
        <rect x="104" y="64" width="20" height="20" rx="2" fill="none" stroke="${sh}" stroke-width="1.2"/>`);
    }
    case 'esqueleto': return svgWrap(168, 190, `
      <path d="M58 6 Q84 44 110 6 L122 6 Q126 48 140 62 L140 184 L28 184 L28 62 Q42 48 46 6 Z" fill="${c}" ${st}/>
      <path d="M58 6 Q84 44 110 6" stroke="${sh}" stroke-width="3" fill="none"/>`);

    case 'buzo':
    case 'hoodie':
    case 'chaqueta': {
      const base = `<path d="M64 8 Q96 30 128 8 L152 14 Q174 18 180 38 L190 186 Q190 196 180 196 L162 196 Q156 196 156 188 L150 84 L152 206 L40 206 L42 84 L36 188 Q36 196 30 196 L12 196 Q2 196 2 186 L12 38 Q18 18 40 14 Z" fill="${c}" ${st}/>
        <rect x="2" y="182" width="34" height="14" rx="4" fill="${sh}"/>
        <rect x="156" y="182" width="34" height="14" rx="4" fill="${sh}"/>`;
      if (tipo === 'buzo') return svgWrap(192, 214, base + `
        <rect x="40" y="194" width="112" height="12" rx="3" fill="${sh}"/>
        <path d="M64 8 Q96 30 128 8" stroke="${sh}" stroke-width="5" fill="none"/>`);
      if (tipo === 'hoodie') return svgWrap(192, 214, base + `
        <rect x="40" y="194" width="112" height="12" rx="3" fill="${sh}"/>
        <path d="M58 12 Q96 -8 134 12 Q122 38 96 38 Q70 38 58 12 Z" fill="${sh}" ${st}/>
        <path d="M86 34 L84 76 M106 34 L108 76" stroke="${hi}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M60 142 L132 142 L142 190 L50 190 Z" fill="${sh}" opacity=".45"/>`);
      return svgWrap(192, 214, base + `
        <path d="M64 8 L80 30 L96 22 L112 30 L128 8 Q96 0 64 8 Z" fill="${sh}" ${st}/>
        <line x1="96" y1="22" x2="96" y2="206" stroke="${sh2}" stroke-width="2.5"/>
        <rect x="56" y="70" width="24" height="22" rx="2" fill="none" stroke="${costura}" stroke-width="1.2" stroke-dasharray="3 2"/>
        <rect x="112" y="70" width="24" height="22" rx="2" fill="none" stroke="${costura}" stroke-width="1.2" stroke-dasharray="3 2"/>
        <rect x="40" y="194" width="112" height="12" rx="2" fill="${sh}"/>
        ${[50, 80, 110, 140, 170].map(y => `<circle cx="102" cy="${y}" r="2.2" fill="${costura}"/>`).join('')}`);
    }

    case 'jean':
    case 'pantalon': {
      const p = `<path d="M6 4 L98 4 L102 260 L58 260 L53 72 L51 72 L46 260 L2 260 Z" fill="${c}" ${st}/>
        <rect x="6" y="4" width="92" height="12" fill="${sh}"/>
        <path d="M52 16 V66" stroke="${sh}" stroke-width="1.6"/>
        <path d="M10 16 Q24 32 32 16 M94 16 Q80 32 72 16" stroke="${sh}" stroke-width="1.4" fill="none"/>`;
      if (tipo === 'pantalon') return svgWrap(104, 264, p + `<path d="M26 20 L24 256 M78 20 L80 256" stroke="${sh}" stroke-width="1" opacity=".7"/>`);
      return svgWrap(104, 264, p + `
        <path d="M10 18 Q24 34 32 18 M94 18 Q80 34 72 18 M4 20 L0 258 M100 20 L104 258" stroke="${costura}" stroke-width="1" stroke-dasharray="3 2" fill="none"/>
        <circle cx="52" cy="10" r="2.5" fill="${costura}"/>`);
    }
    case 'jogger': return svgWrap(104, 264, `
      <path d="M6 4 L98 4 L96 240 L60 240 L53 72 L51 72 L44 240 L8 240 Z" fill="${c}" ${st}/>
      <rect x="6" y="4" width="92" height="14" rx="3" fill="${sh}"/>
      <path d="M46 18 L44 40 M58 18 L60 40" stroke="${hi}" stroke-width="2" stroke-linecap="round"/>
      <rect x="8" y="238" width="36" height="20" rx="5" fill="${sh}"/>
      <rect x="60" y="238" width="36" height="20" rx="5" fill="${sh}"/>
      <path d="M8 60 L10 236 M96 60 L94 236" stroke="${hi}" stroke-width="3" opacity=".6"/>`);
    case 'short': return svgWrap(104, 264, `
      <path d="M6 4 L98 4 L104 118 L58 120 L53 64 L51 64 L46 120 L0 118 Z" fill="${c}" ${st}/>
      <rect x="6" y="4" width="92" height="12" fill="${sh}"/>
      <path d="M2 110 L46 112 M58 112 L102 110" stroke="${sh}" stroke-width="2.5"/>
      <path d="M52 16 V58" stroke="${sh}" stroke-width="1.6"/>`);

    case 'tenis':
    case 'botas':
    case 'zapatos': {
      const pie = cx => {
        if (tipo === 'botas') return `
          <path d="M${cx - 21} 32 L${cx - 19} 1 L${cx + 19} 1 L${cx + 21} 32 Z" fill="${c}" ${st}/>
          <rect x="${cx - 24}" y="30" width="48" height="11" rx="4" fill="#2B231E"/>
          ${[8, 14, 20].map(y => `<line x1="${cx - 7}" y1="${y}" x2="${cx + 7}" y2="${y}" stroke="${costura}" stroke-width="1.6"/>`).join('')}`;
        if (tipo === 'zapatos') return `
          <path d="M${cx - 21} 34 Q${cx - 22} 12 ${cx} 10 Q${cx + 22} 12 ${cx + 21} 34 Z" fill="${c}" ${st}/>
          <rect x="${cx - 23}" y="32" width="46" height="7" rx="3" fill="${sh2}"/>
          <ellipse cx="${cx - 6}" cy="20" rx="6" ry="3" fill="${shade(c, 0.25)}" opacity=".5"/>`;
        return `
          <path d="M${cx - 22} 30 Q${cx - 22} 8 ${cx} 6 Q${cx + 22} 8 ${cx + 22} 30 Z" fill="${c}" ${st}/>
          <rect x="${cx - 25}" y="28" width="50" height="11" rx="5" fill="#F4F3EE" stroke="#C9C6BC" stroke-width="1"/>
          ${[13, 18, 23].map(y => `<line x1="${cx - 7}" y1="${y}" x2="${cx + 7}" y2="${y}" stroke="${contrastShade(c, 0.4)}" stroke-width="1.8" stroke-linecap="round"/>`).join('')}`;
      };
      return svgWrap(124, 44, pie(36) + pie(88));
    }

    case 'gafas': return svgWrap(68, 24, `
      <rect x="4" y="4" width="26" height="16" rx="6" fill="#1D2522" fill-opacity=".85" stroke="${c}" stroke-width="2.4"/>
      <rect x="38" y="4" width="26" height="16" rx="6" fill="#1D2522" fill-opacity=".85" stroke="${c}" stroke-width="2.4"/>
      <path d="M30 10 Q34 6 38 10" stroke="${c}" stroke-width="2.4" fill="none"/>`);
    case 'cadena': return svgWrap(52, 64, `
      <path d="M8 2 Q26 44 44 2" stroke="${c}" stroke-width="2.6" stroke-dasharray="3 1.6" fill="none"/>
      <circle cx="26" cy="27" r="4.5" fill="${c}" stroke="${sh2}" stroke-width="1"/>`);
    case 'reloj': return svgWrap(32, 24, `
      <rect x="12" y="0" width="9" height="24" rx="2" fill="#2A2A28"/>
      <circle cx="16.5" cy="12" r="8" fill="${c}" stroke="${sh2}" stroke-width="1.5"/>
      <circle cx="16.5" cy="12" r="5" fill="#F7F6F1"/>
      <path d="M16.5 12 V8.5 M16.5 12 L19 13" stroke="#2A2A28" stroke-width="1"/>`);
  }
  return svgWrap(100, 100, `<rect width="100" height="100" rx="12" fill="${c}"/>`);
}

export function dibujoPrenda(tipo, color) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dibujo(tipo, color));
}

export function imagenDe(prenda) {
  return prenda.imagen_url || dibujoPrenda(prenda.tipo, prenda.color || '#777777');
}

// ─── Maniquí ────────────────────────────────────────────────
export const TONOS_PIEL = ['#F3D5BF', '#E4B894', '#C98E66', '#A86F4C', '#7E4E33', '#563624'];

// sinPiernas: con pantalón largo puesto se esconden piernas y cadera, para que no se asomen entre las botas
export function maniquiSVG({ piel, silueta, sinPiernas = false } = {}) {
  piel = piel || TONOS_PIEL[2];
  silueta = silueta || 'masculina';
  const borde = shade(piel, -0.14);
  const fem = silueta === 'femenina';
  const torso = fem
    ? 'M106 124 Q150 116 194 124 L204 138 Q198 200 186 232 Q202 268 204 298 L96 298 Q98 268 114 232 Q102 200 96 138 Z'
    : 'M100 124 Q150 116 200 124 L210 138 Q206 212 196 298 L104 298 Q94 212 90 138 Z';
  const brazoL = fem ? 'M98 136 L86 214 L74 296' : 'M94 136 L82 214 L72 296';
  const brazoR = fem ? 'M202 136 L214 214 L226 296' : 'M206 136 L218 214 L228 296';
  return `<svg class="maniqui-svg" viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="150" cy="572" rx="92" ry="10" fill="currentColor" opacity=".08"/>
    <g fill="${piel}" stroke="${borde}" stroke-width="1.2">
      <path d="${brazoL}" fill="none" stroke="${piel}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${brazoR}" fill="none" stroke="${piel}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${fem ? 73 : 71}" cy="306" r="11"/>
      <circle cx="${fem ? 227 : 229}" cy="306" r="11"/>
      ${sinPiernas ? '' : `<path d="M128 300 L126 540" fill="none" stroke="${piel}" stroke-width="40" stroke-linecap="round"/>
      <path d="M172 300 L174 540" fill="none" stroke="${piel}" stroke-width="40" stroke-linecap="round"/>
      <path d="M104 288 L196 288 L194 330 L150 338 L106 330 Z"/>`}
      <ellipse cx="124" cy="553" rx="22" ry="10"/>
      <ellipse cx="176" cy="553" rx="22" ry="10"/>
      <path d="${torso}"/>
      <path d="M138 94 L162 94 L164 126 L136 126 Z"/>
      <ellipse cx="150" cy="66" rx="30" ry="36"/>
    </g>
  </svg>`;
}

// Prendas de ejemplo para la demo
export function prendasDemo() {
  const d = (dias) => new Date(Date.now() - dias * 864e5).toISOString();
  const P = (nombre, tipo, color, extra = {}) => ({
    nombre, tipo, color, formalidad: 1, clima: 'todo', estado: 'disponible',
    usos: 0, precio: null, ultimo_uso: null, imagen_url: null, ajuste: null,
    prestado_a: null, prestado_desde: null, notas: '', ...extra,
  });
  return [
    P('Gorra negra NY', 'gorra', '#1E1F1D', { usos: 14, precio: 60000 }),
    P('Gorra azul rey', 'gorra', '#1F4E9A', { usos: 3 }),
    P('Gorra beige', 'gorra', '#D8C6A2', { usos: 6, clima: 'calor' }),
    P('Bucket negro', 'sombrero', '#2B2B2A', { estado: 'prestada', prestado_a: 'Andrés', prestado_desde: d(12) }),
    P('Gorro de lana gris', 'gorro', '#8D8F8A', { clima: 'frio' }),
    P('Camiseta blanca básica', 'camiseta', '#F2F1EC', { usos: 22, precio: 35000, ultimo_uso: d(1) }),
    P('Camiseta negra oversize', 'camiseta', '#1C1C1B', { usos: 18, precio: 45000 }),
    P('Camiseta verde oliva', 'camiseta', '#5E6B3A', { usos: 5 }),
    P('Camiseta vinotinto', 'camiseta', '#6E1F2B', { usos: 2, estado: 'sucia' }),
    P('Camisa blanca', 'camisa', '#F4F4F1', { formalidad: 3, usos: 4, precio: 90000 }),
    P('Camisa azul cielo', 'camisa', '#9CB9DC', { formalidad: 2, usos: 7 }),
    P('Polo azul marino', 'polo', '#1E2B4A', { formalidad: 2, usos: 9 }),
    P('Esqueleto blanco', 'esqueleto', '#EDEBE4', { clima: 'calor', usos: 3 }),
    P('Buzo gris', 'buzo', '#8C8E8B', { clima: 'frio', estado: 'sucia', usos: 11 }),
    P('Hoodie negro', 'hoodie', '#252624', { clima: 'frio', usos: 16, precio: 120000 }),
    P('Hoodie verde', 'hoodie', '#2F5D46', { clima: 'templado', usos: 4 }),
    P('Chaqueta de jean', 'chaqueta', '#3E5F8A', { clima: 'templado', formalidad: 2, usos: 8, precio: 150000 }),
    P('Chaqueta beige', 'chaqueta', '#B9A27A', { clima: 'templado', formalidad: 2, usos: 1 }),
    P('Jean azul clásico', 'jean', '#3B5D8C', { usos: 30, precio: 110000 }),
    P('Jean negro', 'jean', '#262728', { usos: 19 }),
    P('Pantalón beige', 'pantalon', '#C9B48E', { formalidad: 2, usos: 6 }),
    P('Pantalón negro de tela', 'pantalon', '#1F2021', { formalidad: 3, usos: 3 }),
    P('Jogger gris', 'jogger', '#7D807D', { usos: 12, estado: 'danada', notas: 'Rasgado en la rodilla' }),
    P('Jogger negro', 'jogger', '#2A2B2A', { usos: 9 }),
    P('Short beige', 'short', '#CDBB98', { clima: 'calor', usos: 5 }),
    P('Short negro', 'short', '#2A2A29', { clima: 'calor', usos: 7 }),
    P('Tenis blancos', 'tenis', '#F3F2EC', { usos: 40, precio: 250000 }),
    P('Tenis negros', 'tenis', '#202120', { usos: 15 }),
    P('Tenis rojos', 'tenis', '#B3262B', { usos: 2 }),
    P('Botas café', 'botas', '#6B4128', { clima: 'frio', formalidad: 2, usos: 4 }),
    P('Zapatos negros', 'zapatos', '#1C1B1A', { formalidad: 3, usos: 2 }),
    P('Gafas de sol', 'gafas', '#2C2C2B', { clima: 'calor', usos: 6 }),
    P('Cadena plateada', 'cadena', '#C9CCCF', { usos: 10 }),
    P('Reloj dorado', 'reloj', '#C99A3B', { usos: 20, formalidad: 2 }),
  ];
}
