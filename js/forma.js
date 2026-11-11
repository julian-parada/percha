// Ajuste de forma: deforma la foto de una prenda por franjas horizontales.
// Cada control (cintura, rodilla, bota… / hombros, pecho, ruedo…) dice qué tan ancha
// queda la prenda a esa altura; entre controles el ancho se interpola suavemente.

export const PADDING = 1.5;   // la imagen deformada es 1.5× más ancha (márgenes transparentes) para poder ensanchar

// Controles de forma por zona. "pos" = altura relativa de la prenda (0 = arriba, 1 = abajo)
export const CONTROLES_FORMA = {
  piernas: [
    { k: 'f0', label: 'Cintura', pos: 0 },
    { k: 'f1', label: 'Cadera', pos: 0.28 },
    { k: 'f2', label: 'Rodilla', pos: 0.62 },
    { k: 'f3', label: 'Bota', pos: 1 },
  ],
  torso: [
    { k: 'f0', label: 'Hombros', pos: 0.08 },
    { k: 'f1', label: 'Pecho', pos: 0.32 },
    { k: 'f2', label: 'Cintura', pos: 0.68 },
    { k: 'f3', label: 'Ruedo', pos: 1 },
  ],
};
CONTROLES_FORMA.capa = CONTROLES_FORMA.torso;

// Devuelve { vals, pos } si la prenda tiene algún control de forma distinto de 100 %; si no, null
export function formaDe(ajuste, zona) {
  const ctl = CONTROLES_FORMA[zona];
  if (!ctl || !ajuste) return null;
  const vals = ctl.map(c => +(ajuste[c.k] ?? 1) || 1);
  if (vals.every(v => Math.abs(v - 1) < 0.005)) return null;
  return { vals, pos: ctl.map(c => c.pos) };
}

const listos = new Map();     // clave → dataURL ya procesado
const pendientes = new Map(); // clave → promesa

export function claveForma(src, forma) {
  return `${src.length}:${src.slice(-60)}|${forma.vals.map(v => v.toFixed(3)).join(',')}`;
}
export function formaLista(src, forma) { return listos.get(claveForma(src, forma)) || null; }

function cargar(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });
}

function anchoEn(t, forma) {
  const { vals, pos } = forma;
  if (t <= pos[0]) return vals[0];
  for (let i = 1; i < pos.length; i++) {
    if (t <= pos[i]) {
      const u = (t - pos[i - 1]) / (pos[i] - pos[i - 1] || 1);
      const s = u * u * (3 - 2 * u);                 // transición suave
      return vals[i - 1] + (vals[i] - vals[i - 1]) * s;
    }
  }
  return vals[vals.length - 1];
}

export function deformar(src, forma) {
  const clave = claveForma(src, forma);
  if (listos.has(clave)) return Promise.resolve(listos.get(clave));
  if (pendientes.has(clave)) return pendientes.get(clave);
  const p = cargar(src).then(img => {
    const esc = Math.min(1, 900 / img.naturalHeight);
    const W = Math.round(img.naturalWidth * esc), H = Math.round(img.naturalHeight * esc);
    // primero a tamaño de trabajo
    const base = document.createElement('canvas'); base.width = W; base.height = H;
    base.getContext('2d').drawImage(img, 0, 0, W, H);
    const out = document.createElement('canvas');
    out.width = Math.round(W * PADDING); out.height = H;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const cx = out.width / 2;
    for (let y = 0; y < H; y++) {
      const s = anchoEn(H > 1 ? y / (H - 1) : 0, forma);
      const w = W * s;
      ctx.drawImage(base, 0, y, W, 1, cx - w / 2, y, w, 1);
    }
    const url = out.toDataURL('image/webp', 0.92);
    listos.set(clave, url);
    if (listos.size > 80) listos.delete(listos.keys().next().value);
    return url;
  }).finally(() => pendientes.delete(clave));
  pendientes.set(clave, p);
  return p;
}

// Procesa todas las <img data-forma> que aparezcan en la página
function procesar(img) {
  if (img.dataset.formaHecha) return;
  img.dataset.formaHecha = '1';
  let forma; try { forma = JSON.parse(img.dataset.forma); } catch { return; }
  deformar(img.dataset.src, forma)
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
