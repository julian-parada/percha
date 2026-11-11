// Forma real de las prendas en el maniquí, a partir de medidas en cm.
//
// 1. Con el LARGO en cm sabemos cuántos píxeles de la foto son 1 cm.
// 2. En cada altura (cintura, rodilla, bota… / hombros, pecho, ruedo…) medimos cuánto
//    mide la tela en la foto, leyendo los píxeles no transparentes.
// 3. Comparamos con la medida real (prenda acostada) convertida a "puesta" y
//    deformamos la foto por franjas para que cada parte mida lo que debe.

export const PADDING = 1.6;   // la imagen deformada es más ancha (márgenes transparentes) para poder ensanchar

// Acostada, una prenda mide la mitad de su contorno; puesta, el cuerpo es como un óvalo y se ve
// más angosta: ancho visto de frente ≈ 0,72 × ancho acostado. Los hombros son una medida recta (≈ igual).
const PROYECCION = { hombros: 0.96, pecho: 0.72, cintura: 0.72, ruedo: 0.72, cadera: 0.72, rodilla: 0.72, bota: 0.72 };

// Dónde y cómo se mide cada parte. t = altura relativa en la foto (0 arriba, 1 abajo).
//   tipo 'todo' = de borde a borde; 'centro' = solo el cuerpo (sin mangas sueltas); 'pierna' = una sola pierna
const PUNTOS = {
  piernas: [
    { k: 'cintura', t: 0.03, tipo: 'todo' },
    { k: 'cadera',  t: 0.22, tipo: 'todo' },
    { k: 'rodilla', t: 0.60, tipo: 'pierna' },
    { k: 'bota',    t: 0.90, tipo: 'pierna' },
  ],
  short: [
    { k: 'cintura', t: 0.04, tipo: 'todo' },
    { k: 'cadera',  t: 0.40, tipo: 'todo' },
    { k: 'bota',    t: 0.88, tipo: 'pierna' },
  ],
  torso: [
    { k: 'hombros', t: 0.10, tipo: 'centro' },
    { k: 'pecho',   t: [0.30, 0.60], tipo: 'centro-min' },   // la parte más angosta entre axila y cintura = sin mangas
    { k: 'cintura', t: 0.75, tipo: 'centro' },
    { k: 'ruedo',   t: 0.93, tipo: 'centro' },
  ],
};
PUNTOS.capa = PUNTOS.torso;
const puntosDe = (zona, tipo) => zona === 'piernas' && tipo === 'short' ? PUNTOS.short : PUNTOS[zona];

// ¿La prenda necesita deformarse? Devuelve una especificación o null
export function formaDe(prenda, zona) {
  const m = prenda?.medidas || {};
  const pts = puntosDe(zona, prenda?.tipo);
  if (!prenda?.imagen_url || !pts || !(+m.largo > 0)) return null;
  const cm = {};
  for (const p of pts) if (+m[p.k] > 0) cm[p.k] = +m[p.k];
  if (!Object.keys(cm).length) return null;
  return { zona, tipo: prenda.tipo, largo: +m.largo, cm };
}

const listos = new Map();
const pendientes = new Map();
const mediciones = new Map();

export function claveForma(src, f) {
  return `${src.length}:${src.slice(-60)}|${f.zona}|${f.tipo}|${f.largo}|${JSON.stringify(f.cm)}`;
}
export function formaLista(src, f) { return listos.get(claveForma(src, f)) || null; }

function cargar(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });
}

async function base(src) {
  const img = await cargar(src);
  const esc = Math.min(1, 900 / img.naturalHeight);
  const W = Math.max(1, Math.round(img.naturalWidth * esc)), H = Math.max(1, Math.round(img.naturalHeight * esc));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const alpha = ctx.getImageData(0, 0, W, H).data;
  return { c, W, H, alpha };
}

// Tramos de tela (píxeles no transparentes) en la fila y
function tramos(b, y) {
  const { W, alpha } = b, out = [];
  const hueco = Math.max(2, Math.round(W * 0.012));
  let ini = -1, ultimo = -10;
  for (let x = 0; x < W; x++) {
    if (alpha[(y * W + x) * 4 + 3] > 40) {
      if (ini < 0) ini = x;
      else if (x - ultimo > hueco) { out.push([ini, ultimo]); ini = x; }
      ultimo = x;
    }
  }
  if (ini >= 0) out.push([ini, ultimo]);
  return out.filter(([a, z]) => z - a > W * 0.02);
}
function medirFila(b, y, tipo) {
  const ts = tramos(b, Math.min(b.H - 1, Math.max(0, y)));
  if (!ts.length) return 0;
  if (tipo === 'todo') return ts[ts.length - 1][1] - ts[0][0];
  if (tipo === 'pierna') {
    const anchos = ts.map(([a, z]) => z - a).sort((a, z) => z - a);
    return anchos.length >= 2 ? (anchos[0] + anchos[1]) / 2 : anchos[0] / 2;
  }
  const cx = b.W / 2;   // 'centro': el tramo que pasa por el centro (o el más cercano)
  const t = ts.find(([a, z]) => a <= cx && z >= cx) || ts.reduce((m, r) => Math.abs((r[0] + r[1]) / 2 - cx) < Math.abs((m[0] + m[1]) / 2 - cx) ? r : m);
  return t[1] - t[0];
}

// Mide la foto: { cintura: { t, px }, … } (px en la imagen de trabajo)
function medir(b, zona, tipo) {
  const out = {};
  for (const p of puntosDe(zona, tipo)) {
    if (Array.isArray(p.t)) {
      let mejor = null;
      for (let t = p.t[0]; t <= p.t[1]; t += 0.02) {
        const px = medirFila(b, Math.round(t * (b.H - 1)), 'centro');
        if (px && (!mejor || px < mejor.px)) mejor = { t, px };
      }
      if (mejor) out[p.k] = mejor;
    } else {
      // mediana de varias filas alrededor del punto: evita bordes rotos, diagonales y ruido
      const vals = [];
      for (let d = -0.03; d <= 0.0301; d += 0.01) {
        const t = Math.min(1, Math.max(0, p.t + d));
        const px = medirFila(b, Math.round(t * (b.H - 1)), p.tipo);
        if (px) vals.push(px);
      }
      if (vals.length) { vals.sort((a, z) => a - z); out[p.k] = { t: p.t, px: vals[Math.floor(vals.length / 2)] }; }
    }
  }
  return out;
}

// Para el editor: cuánto mide la prenda en la foto, en cm "acostada" (para comparar con tus medidas)
export async function medidasDeFoto(src, zona, tipo, largo) {
  const clave = `${src.length}:${src.slice(-60)}|${zona}|${tipo}`;
  let med = mediciones.get(clave);
  if (!med) { const b = await base(src); med = { m: medir(b, zona, tipo), H: b.H }; mediciones.set(clave, med); }
  const pxCm = med.H / largo;
  const out = {};
  for (const [k, v] of Object.entries(med.m)) out[k] = Math.round(v.px / pxCm / (PROYECCION[k] || 1));
  return out;
}

function suave(u) { return u * u * (3 - 2 * u); }

export function deformar(src, f) {
  const clave = claveForma(src, f);
  if (listos.has(clave)) return Promise.resolve(listos.get(clave));
  if (pendientes.has(clave)) return pendientes.get(clave);
  const p = base(src).then(b => {
    const med = medir(b, f.zona, f.tipo);
    const pxCm = b.H / f.largo;
    // factores de ancho en cada punto medido
    const anclas = [];
    for (const [k, objetivo] of Object.entries(f.cm)) {
      const m = med[k]; if (!m) continue;
      const actualCm = m.px / pxCm;
      const deseadoCm = objetivo * (PROYECCION[k] || 1);
      anclas.push({ t: m.t, s: Math.min(1.35, Math.max(0.6, deseadoCm / actualCm)) });   // límites: no deformar de más si la foto engaña
    }
    anclas.sort((a, z) => a.t - z.t);
    const factor = t => {
      if (!anclas.length) return 1;
      if (t <= anclas[0].t) return anclas[0].s;
      for (let i = 1; i < anclas.length; i++) if (t <= anclas[i].t) {
        const u = (t - anclas[i - 1].t) / (anclas[i].t - anclas[i - 1].t || 1);
        return anclas[i - 1].s + (anclas[i].s - anclas[i - 1].s) * suave(u);
      }
      return anclas[anclas.length - 1].s;
    };
    const out = document.createElement('canvas');
    out.width = Math.round(b.W * PADDING); out.height = b.H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const cx = out.width / 2;
    for (let y = 0; y < b.H; y++) {
      const w = b.W * factor(b.H > 1 ? y / (b.H - 1) : 0);
      ctx.drawImage(b.c, 0, y, b.W, 1, cx - w / 2, y, w, 1);
    }
    const url = out.toDataURL('image/webp', 0.92);
    listos.set(clave, url);
    if (listos.size > 80) listos.delete(listos.keys().next().value);
    return url;
  }).finally(() => pendientes.delete(clave));
  pendientes.set(clave, p);
  return p;
}

function procesar(img) {
  if (img.dataset.formaHecha) return;
  img.dataset.formaHecha = '1';
  let f; try { f = JSON.parse(img.dataset.forma); } catch { return; }
  deformar(img.dataset.src, f)
    .then(url => { img.src = url; img.classList.remove('deformando'); })
    .catch(() => { img.src = img.dataset.src; img.classList.remove('deformando'); });
}
export function iniciarFormas() {
  const revisar = raiz => raiz.querySelectorAll?.('img[data-forma]:not([data-forma-hecha])').forEach(procesar);
  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches?.('img[data-forma]')) procesar(n); else revisar(n);
    }
  }).observe(document.body, { childList: true, subtree: true });
  revisar(document);
}
