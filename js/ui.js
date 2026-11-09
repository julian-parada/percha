// Utilidades de interfaz: íconos, toasts, modales, formato.

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const cop = n => (n == null || n === '' || isNaN(n)) ? '' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export const diasDesde = iso => iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : null;
export const hace = iso => {
  const d = diasDesde(iso);
  if (d == null) return 'Nunca';
  if (d <= 0) return 'Hoy';
  if (d === 1) return 'Ayer';
  if (d < 30) return `Hace ${d} días`;
  const m = Math.floor(d / 30); return m === 1 ? 'Hace un mes' : `Hace ${m} meses`;
};
export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const esMovil = () => matchMedia('(max-width: 899px)').matches;
export const iniciales = (n = '') => n.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('') || 'P';

const P = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const I = {
  percha: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 8a3 3 0 1 1 4.6 2.5c-1 .6-1.6 1.4-1.6 2.5v1"/><path d="M16 14 3.5 22.4c-1.2.8-.6 2.6.8 2.6h23.4c1.4 0 2-1.8.8-2.6L16 14Z"/></svg>`,
  mas: P('<path d="M12 5v14M5 12h14"/>'),
  izq: P('<path d="m15 18-6-6 6-6"/>'),
  der: P('<path d="m9 18 6-6-6-6"/>'),
  x: P('<path d="M18 6 6 18M6 6l12 12"/>'),
  chispa: P('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>'),
  azar: P('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
  guardar: P('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  check: P('<path d="M20 6 9 17l-5-5"/>'),
  basura: P('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  editar: P('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  camara: P('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>'),
  puntos: P('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
  armario: P('<rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M12 2v20M9.5 12h.01M14.5 12h.01"/>'),
  persona: P('<circle cx="12" cy="5" r="2.5"/><path d="M8 10h8l-1 6h-2l-.5 6h-1l-.5-6H9Z"/>'),
  outfits: P('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  resumen: P('<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-8"/>'),
  usar: P('<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="m9 15 2 2 4-4"/>'),
  ojo: P('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'),
  salir: P('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  ubicacion: P('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>'),
  lavar: P('<rect x="3" y="2" width="18" height="20" rx="2"/><circle cx="12" cy="13" r="5"/><path d="M7 5h.01M10 5h.01"/>'),
  descargar: P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  subir: P('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
};

// ─── Toasts ─────────────────────────────────────────────────
export function toast(msg, { accion, onAccion, tipo = '', ms = 3600 } = {}) {
  const root = document.getElementById('toast-root');
  const t = document.createElement('div');
  t.className = 'toast ' + tipo;
  t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${accion ? `<button type="button">${esc(accion)}</button>` : ''}`;
  if (accion) t.querySelector('button').onclick = () => { onAccion?.(); cerrar(); };
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  const cerrar = () => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); };
  setTimeout(cerrar, ms);
}

// ─── Modales ────────────────────────────────────────────────
let ultimoFoco = null;
export function abrirModal(html, { clase = '', onCerrar } = {}) {
  cerrarModal(true);
  ultimoFoco = document.activeElement;
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-fondo" data-cerrar-modal></div>
    <div class="modal ${clase}" role="dialog" aria-modal="true">${html}</div>`;
  root.classList.add('abierto');
  root._onCerrar = onCerrar;
  const m = root.querySelector('.modal');
  requestAnimationFrame(() => {
    root.classList.add('visible');
    const f = m.querySelector('[autofocus], input, select, textarea, button:not([data-cerrar-modal])');
    f?.focus({ preventScroll: true });
  });
  return m;
}
export function cerrarModal(silencioso = false) {
  const root = document.getElementById('modal-root');
  if (!root.classList.contains('abierto')) return;
  const cb = root._onCerrar; root._onCerrar = null;
  root.classList.remove('visible', 'abierto');
  root.innerHTML = '';
  if (!silencioso) { cb?.(); ultimoFoco?.focus?.({ preventScroll: true }); }
}
document.addEventListener('click', e => { if (e.target.closest('[data-cerrar-modal]')) cerrarModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarModal(); });

export function confirmar(titulo, texto, { si = 'Confirmar', peligro = false } = {}) {
  return new Promise(res => {
    const m = abrirModal(`
      <div class="modal-cuerpo confirmar">
        <h2>${esc(titulo)}</h2>
        <p>${esc(texto)}</p>
        <div class="modal-pie">
          <button class="btn" data-r="no">Cancelar</button>
          <button class="btn ${peligro ? 'btn-peligro' : 'btn-primario'}" data-r="si">${esc(si)}</button>
        </div>
      </div>`, { clase: 'modal-chico', onCerrar: () => res(false) });
    m.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      const r = b.dataset.r === 'si';
      const root = document.getElementById('modal-root'); root._onCerrar = null;
      cerrarModal(); res(r);
    });
  });
}
