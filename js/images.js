// Procesamiento de fotos: quitar fondo, recortar márgenes, comprimir.

let modBg = null;

// Quita el fondo dentro del navegador con @imgly/background-removal (licencia AGPL).
// La primera vez descarga el modelo (~40 MB) y queda en caché.
export async function quitarFondo(blob, onProgreso) {
  if (!modBg) modBg = await import('https://esm.sh/@imgly/background-removal@1.7.0');
  const fn = modBg.removeBackground || modBg.default;
  return fn(blob, {
    progress: (key, actual, total) => onProgreso?.(key, actual, total),
    output: { format: 'image/png', quality: 0.9 },
  });
}

export function cargarImagen(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Recorta los bordes transparentes (para que la prenda llene su zona del maniquí)
// y la reduce a un tamaño máximo. Devuelve { blob, dataUrl, img }.
export async function prepararImagen(blob, { max = 720, recortar = true } = {}) {
  const url = URL.createObjectURL(blob);
  const img = await cargarImagen(url);
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (recortar) {
    const c = document.createElement('canvas');
    const esc = Math.min(1, 400 / Math.max(sw, sh));
    c.width = Math.round(sw * esc); c.height = Math.round(sh * esc);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0, hay = false;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 20) {
        hay = true; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
      }
    }
    if (hay && (x1 - x0) > 10 && (y1 - y0) > 10) {
      sx = Math.floor(x0 / esc); sy = Math.floor(y0 / esc);
      sw = Math.ceil((x1 - x0 + 1) / esc); sh = Math.ceil((y1 - y0 + 1) / esc);
    }
  }

  const esc = Math.min(1, max / Math.max(sw, sh));
  const out = document.createElement('canvas');
  out.width = Math.round(sw * esc); out.height = Math.round(sh * esc);
  out.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
  URL.revokeObjectURL(url);

  const final = await new Promise(r => out.toBlob(r, 'image/webp', 0.86));
  const dataUrl = out.toDataURL('image/webp', 0.86);
  const imgFinal = await cargarImagen(dataUrl);
  return { blob: final, dataUrl, img: imgFinal };
}
