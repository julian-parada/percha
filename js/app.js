import { CONFIG } from './config.js';
import { crearStore } from './store.js';
import {
  ZONAS, ZONAS_ROTABLES, COMPARTIMENTOS, TIPOS, ESTADOS, medidasPara, cajaReal, FORMALIDAD, CLIMAS, OCASIONES, TONOS_PIEL,
  imagenDe, dibujoPrenda, maniquiSVG, prendasDemo, nombreColor, coloresDominantes, hexToHsl,
} from './garments.js';
import { obtenerClima, CIUDADES } from './weather.js';
import { recomendar, evaluarOutfit } from './recommender.js';
import { quitarFondo, prepararImagen, cargarImagen } from './images.js';
import { formaDe, formaLista, deformar, medidasDeFoto, PADDING, iniciarFormas } from './forma.js';
import { $, $$, esc, cop, hace, diasDesde, reduceMotion, esMovil, iniciales, I, toast, abrirModal, cerrarModal, confirmar } from './ui.js';

// ─── Estado ─────────────────────────────────────────────────
const S = {
  store: null, user: null, perfil: null,
  prendas: [], outfits: [], historial: [], clima: null,
  vista: 'armario', panelMovil: 'armario',
  comp: null, filtro: 'todas',
  outfit: {}, ocasion: 'universidad', razones: null,
  puertas: false,
};
const app = () => document.getElementById('app');
const prenda = id => S.prendas.find(p => p.id === id);
const zonaDe = p => TIPOS[p?.tipo]?.zona;
const ESCALA = { delgado: 0.92, medio: 1, atletico: 1.06, robusto: 1.13 };

function guardarProbador() { try { localStorage.setItem('percha_probador_' + S.user?.id, JSON.stringify({ outfit: S.outfit, ocasion: S.ocasion })); } catch {} }
function leerProbador() { try { return JSON.parse(localStorage.getItem('percha_probador_' + S.user?.id)) || {}; } catch { return {}; } }

// ─── Arranque ───────────────────────────────────────────────
async function boot() {
  app().innerHTML = `<div class="cargando"><span class="logo-grande">${I.percha}</span></div>`;
  S.store = await crearStore();
  const ses = await S.store.getSession().catch(() => null);
  if (!ses) return renderAuth();
  S.user = ses.user;
  await cargarDatos();
  if (!S.perfil?.completo) return renderOnboarding(1);
  renderApp();
}

async function cargarDatos() {
  const [perfil, prendas, outfits, historial] = await Promise.all([
    S.store.getPerfil(), S.store.listPrendas(), S.store.listOutfits(), S.store.listHistorial(),
  ]);
  S.perfil = perfil; S.prendas = prendas || []; S.outfits = outfits || []; S.historial = historial || [];
  const pr = leerProbador();
  S.outfit = Object.fromEntries(Object.entries(pr.outfit || {}).filter(([, id]) => prenda(id)));
  S.ocasion = pr.ocasion || 'universidad';
}

// ═══════════════════════════════════════════════════════════
//  LOGIN / REGISTRO
// ═══════════════════════════════════════════════════════════
function renderAuth(modo = 'entrar') {
  const local = S.store.mode === 'local';
  app().innerHTML = `
  <div class="auth">
    <div class="auth-arte" aria-hidden="true">
      <div class="auth-marca">${I.percha}<span>Percha</span></div>
      <div class="mueble mueble-auth">
        <div class="mueble-corona"></div>
        <div class="mueble-cuerpo">
          <div class="interior interior-auth">
            <div class="auth-riel"></div>
            <div class="auth-colgados">${['#1F4E9A', '#F2F1EC', '#5E6B3A', '#1C1C1B', '#B9A27A'].map((c, i) =>
              `<img src="${dibujoPrenda(i % 2 ? 'camiseta' : 'hoodie', c)}" style="--i:${i}" alt="">`).join('')}</div>
            <div class="auth-repisa">${['#3B5D8C', '#262728', '#C9B48E'].map(c => `<img src="${dibujoPrenda('short', c)}" alt="">`).join('')}</div>
            <div class="auth-zapatos">${['#F3F2EC', '#B3262B', '#202120'].map(c => `<img src="${dibujoPrenda('tenis', c)}" alt="">`).join('')}</div>
          </div>
          ${puertasHTML(false)}
        </div>
        <div class="mueble-patas"><span></span><span></span></div>
      </div>
      <p class="auth-lema">Tu ropa, en tu bolsillo.<br>Arma el outfit antes de abrir el armario.</p>
    </div>

    <div class="auth-panel">
      <div class="auth-caja">
        <h1>${modo === 'entrar' ? 'Entra a tu armario' : 'Crea tu armario'}</h1>
        <div class="segmento" role="tablist">
          <button role="tab" class="${modo === 'entrar' ? 'activo' : ''}" data-act="auth-modo" data-modo="entrar">Entrar</button>
          <button role="tab" class="${modo === 'crear' ? 'activo' : ''}" data-act="auth-modo" data-modo="crear">Crear cuenta</button>
        </div>
        <form id="form-auth" class="form" novalidate>
          ${modo === 'crear' ? `<label class="campo"><span>Tu nombre</span><input name="nombre" autocomplete="name" placeholder="Julian Parada" required></label>` : ''}
          <label class="campo"><span>Correo</span><input name="email" type="email" autocomplete="email" placeholder="tucorreo@gmail.com" required></label>
          <label class="campo"><span>Contraseña</span>
            <div class="input-con-boton">
              <input name="pass" type="password" autocomplete="${modo === 'entrar' ? 'current-password' : 'new-password'}" minlength="6" placeholder="Mínimo 6 caracteres" required>
              <button type="button" class="btn-icono" data-act="ver-pass" aria-label="Mostrar contraseña">${I.ojo}</button>
            </div>
          </label>
          <p class="error" id="auth-error" role="alert"></p>
          <button class="btn btn-primario btn-bloque" type="submit">${modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</button>
          ${modo === 'entrar' && !local ? `<button type="button" class="enlace" data-act="olvide">¿Olvidaste tu contraseña?</button>` : ''}
        </form>
        ${CONFIG.GOOGLE_AUTH && !local ? `<div class="separador"><span>o</span></div><button class="btn btn-bloque" data-act="google">Continuar con Google</button>` : ''}
        ${local ? `<div class="separador"><span>o</span></div>
          <button class="btn btn-bloque" data-act="demo">${I.armario} Probar con un armario de ejemplo</button>
          <p class="nota-modo">Modo local: las cuentas y la ropa se guardan solo en este navegador. Conecta Supabase en <code>js/config.js</code> para tener cuentas reales.</p>` : ''}
      </div>
    </div>
  </div>`;
  setTimeout(() => $('.mueble-auth')?.classList.add('abierto'), reduceMotion() ? 0 : 500);

  $('#form-auth').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = (f.get('email') || '').trim(), pass = f.get('pass') || '', nombre = (f.get('nombre') || '').trim();
    const err = $('#auth-error');
    if (modo === 'crear' && !nombre) return (err.textContent = 'Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return (err.textContent = 'Escribe un correo válido.');
    if (pass.length < 6) return (err.textContent = 'La contraseña debe tener al menos 6 caracteres.');
    const btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Un momento…';
    try {
      const r = modo === 'entrar' ? await S.store.signIn(email, pass) : await S.store.signUp(email, pass, nombre);
      if (r.needsConfirm) {
        err.textContent = ''; btn.disabled = false; btn.textContent = 'Crear cuenta';
        return toast('Te enviamos un correo. Confírmalo y luego entra.', { ms: 7000 });
      }
      S.user = r.user;
      if (modo === 'crear') await S.store.savePerfil({ nombre, completo: false });
      await cargarDatos();
      S.perfil?.completo ? renderApp() : renderOnboarding(1);
    } catch (ex) {
      err.textContent = ex.message; btn.disabled = false; btn.textContent = modo === 'entrar' ? 'Entrar' : 'Crear cuenta';
    }
  };
}

async function entrarDemo() {
  const email = 'demo@percha.app', pass = 'demo1234';
  try { S.user = (await S.store.signIn(email, pass)).user; }
  catch {
    S.user = (await S.store.signUp(email, pass, 'Julian')).user;
    await S.store.savePerfil({ nombre: 'Julian', silueta: 'masculina', altura: 173, contextura: 'medio', piel: TONOS_PIEL[2], subtono: 'calido', estilo: ['urbano', 'casual'], ciudad: 'ocana', lavanderia_auto: true, completo: true });
    await S.store.savePrendasLote(prendasDemo());
  }
  await cargarDatos();
  if (!S.perfil?.completo) return renderOnboarding(1);
  renderApp();
  toast('Bienvenido. Este armario es de ejemplo: juega con él.');
}

// ═══════════════════════════════════════════════════════════
//  ONBOARDING (3 pasos)
// ═══════════════════════════════════════════════════════════
let borrador = {};
function renderOnboarding(paso) {
  if (paso === 1) borrador = {
    nombre: S.perfil?.nombre || '', silueta: 'masculina', altura: 170, contextura: 'medio',
    piel: TONOS_PIEL[2], subtono: 'neutro', estilo: ['casual'], ciudad: CONFIG.CIUDAD_DEFECTO,
    lavanderia_auto: true, ejemplo: S.prendas.length === 0,
    // Supabase crea el perfil con campos vacíos (null): solo se usan los que tienen valor
    ...Object.fromEntries(Object.entries(S.perfil || {}).filter(([, v]) => v != null && !(Array.isArray(v) && !v.length))),
  };
  const b = borrador;
  const pasos = ['Tu silueta', 'Tu piel', 'Tu día a día'];
  let cuerpo = '';
  if (paso === 1) cuerpo = `
    <label class="campo"><span>¿Cómo te llamas?</span><input name="nombre" value="${esc(b.nombre)}" placeholder="Tu nombre" required></label>
    <fieldset class="campo"><legend>Silueta del maniquí</legend>
      <div class="opciones-2">${['masculina', 'femenina'].map(s => `
        <label class="opcion ${b.silueta === s ? 'activa' : ''}"><input type="radio" name="silueta" value="${s}" ${b.silueta === s ? 'checked' : ''}>
        <span class="opcion-titulo">${s === 'masculina' ? 'Masculina' : 'Femenina'}</span></label>`).join('')}</div>
    </fieldset>
    <label class="campo"><span>Altura: <b id="altura-val">${(b.altura / 100).toFixed(2)} m</b></span>
      <input type="range" name="altura" min="140" max="210" step="1" value="${b.altura}"></label>
    <fieldset class="campo"><legend>Contextura</legend>
      <div class="opciones-4">${[['delgado', 'Delgada'], ['medio', 'Media'], ['atletico', 'Atlética'], ['robusto', 'Robusta']].map(([v, l]) => `
        <label class="opcion ${b.contextura === v ? 'activa' : ''}"><input type="radio" name="contextura" value="${v}" ${b.contextura === v ? 'checked' : ''}><span class="opcion-titulo">${l}</span></label>`).join('')}</div>
    </fieldset>`;
  if (paso === 2) cuerpo = `
    <fieldset class="campo"><legend>Tono de piel del maniquí</legend>
      <div class="swatches">${TONOS_PIEL.map(t => `
        <label class="swatch ${b.piel === t ? 'activo' : ''}" style="--c:${t}"><input type="radio" name="piel" value="${t}" ${b.piel === t ? 'checked' : ''}><span class="sr">${t}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset class="campo"><legend>¿De qué color se ven las venas de tu muñeca?</legend>
      <div class="opciones-3">${[['frio', 'Azules o moradas'], ['calido', 'Verdes'], ['neutro', 'No sé, mezcla']].map(([v, l]) => `
        <label class="opcion ${b.venas === v ? 'activa' : ''}"><input type="radio" name="venas" value="${v}" ${b.venas === v ? 'checked' : ''}><span class="opcion-titulo">${l}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset class="campo"><legend>¿Qué te luce más?</legend>
      <div class="opciones-3">${[['frio', 'Plata'], ['calido', 'Oro'], ['neutro', 'Los dos']].map(([v, l]) => `
        <label class="opcion ${b.joyas === v ? 'activa' : ''}"><input type="radio" name="joyas" value="${v}" ${b.joyas === v ? 'checked' : ''}><span class="opcion-titulo">${l}</span></label>`).join('')}</div>
    </fieldset>
    <div class="resultado-subtono" id="subtono-res">${textoSubtono(b.subtono)}</div>`;
  if (paso === 3) cuerpo = `
    <label class="campo"><span>¿Dónde estás la mayoría del tiempo?</span>
      <select name="ciudad">${Object.entries(CIUDADES).map(([k, c]) => `<option value="${k}" ${b.ciudad === k ? 'selected' : ''}>${c.nombre}</option>`).join('')}</select></label>
    <fieldset class="campo"><legend>Tu estilo (elige varios)</legend>
      <div class="chips">${[['urbano', 'Urbano'], ['casual', 'Casual'], ['deportivo', 'Deportivo'], ['formal', 'Formal'], ['minimalista', 'Minimalista']].map(([v, l]) => `
        <label class="chip ${b.estilo?.includes(v) ? 'activo' : ''}"><input type="checkbox" name="estilo" value="${v}" ${b.estilo?.includes(v) ? 'checked' : ''}>${l}</label>`).join('')}</div>
    </fieldset>
    <label class="interruptor"><input type="checkbox" name="lavanderia_auto" ${b.lavanderia_auto ? 'checked' : ''}><span class="pista"></span>
      <span>Cuando marque un outfit como usado, mandar esa ropa al cesto de sucias</span></label>
    ${S.prendas.length === 0 ? `<label class="interruptor"><input type="checkbox" name="ejemplo" ${b.ejemplo ? 'checked' : ''}><span class="pista"></span>
      <span>Llenar mi armario con prendas de ejemplo para probar</span></label>` : ''}`;

  app().innerHTML = `
  <div class="onboarding">
    <div class="ob-preview">${maniquiHTML({}, { perfil: b, id: 'ob-maniqui' })}
      <p class="ob-medida">${(b.altura / 100).toFixed(2)} m</p></div>
    <form class="ob-form form" id="ob-form" novalidate>
      <p class="ob-paso">Paso ${paso} de 3 · ${pasos[paso - 1]}</p>
      <div class="ob-barra"><span style="width:${paso * 33.4}%"></span></div>
      <h1>${['Arma tu maniquí', 'Tu tono y subtono', 'Últimos detalles'][paso - 1]}</h1>
      <p class="ob-ayuda">${[
        'El maniquí del probador tendrá tus proporciones para que veas el outfit completo.',
        'El subtono decide qué colores te favorecen cerca de la cara. Responde rápido, sin pensarlo mucho.',
        'Con tu ciudad miramos el clima y te recomendamos ropa según la temperatura de hoy.'][paso - 1]}</p>
      ${cuerpo}
      <p class="error" id="ob-error" role="alert"></p>
      <div class="ob-acciones">
        ${paso > 1 ? `<button type="button" class="btn" data-act="ob-paso" data-paso="${paso - 1}">Atrás</button>` : '<span></span>'}
        <button type="submit" class="btn btn-primario">${paso < 3 ? 'Siguiente' : 'Abrir mi armario'}</button>
      </div>
    </form>
  </div>`;

  const form = $('#ob-form');
  const leer = () => {
    const f = new FormData(form);
    if (paso === 1) Object.assign(b, { nombre: (f.get('nombre') || '').trim(), silueta: f.get('silueta'), altura: +f.get('altura'), contextura: f.get('contextura') });
    if (paso === 2) {
      Object.assign(b, { piel: f.get('piel') || b.piel, venas: f.get('venas'), joyas: f.get('joyas') });
      const votos = [b.venas, b.joyas].filter(Boolean);
      if (votos.length) b.subtono = votos.every(v => v === votos[0]) ? votos[0] : 'neutro';
    }
    if (paso === 3) Object.assign(b, { ciudad: f.get('ciudad'), estilo: f.getAll('estilo'), lavanderia_auto: !!f.get('lavanderia_auto'), ejemplo: !!f.get('ejemplo') });
  };
  form.addEventListener('input', () => {
    leer();
    $$('.opcion', form).forEach(el => el.classList.toggle('activa', !!el.querySelector('input:checked')));
    $$('.swatch, .chip', form).forEach(el => el.classList.toggle('activo', !!el.querySelector('input:checked')));
    if ($('#altura-val')) $('#altura-val').textContent = (b.altura / 100).toFixed(2) + ' m';
    $('.ob-medida').textContent = (b.altura / 100).toFixed(2) + ' m';
    if ($('#subtono-res')) $('#subtono-res').innerHTML = textoSubtono(b.subtono);
    $('.ob-preview .maniqui').outerHTML = maniquiHTML({}, { perfil: b, id: 'ob-maniqui' });
  });
  form.onsubmit = async e => {
    e.preventDefault(); leer();
    if (paso === 1 && !b.nombre) return ($('#ob-error').textContent = 'Escribe tu nombre para seguir.');
    if (paso < 3) return renderOnboarding(paso + 1);
    const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Preparando…';
    const { ejemplo, venas, joyas, ...perfil } = b;
    try {
      S.perfil = await S.store.savePerfil({ ...perfil, completo: true });
      if (ejemplo && S.prendas.length === 0) await S.store.savePrendasLote(prendasDemo());
      await cargarDatos();
      renderApp();
    } catch (ex) { $('#ob-error').textContent = ex.message; btn.disabled = false; btn.textContent = 'Abrir mi armario'; }
  };
}
function textoSubtono(s) {
  const t = {
    frio: ['Subtono frío', 'Te favorecen azules, grises, negro, blanco puro, morados y verdes fríos.'],
    calido: ['Subtono cálido', 'Te favorecen beige, café, verde oliva, mostaza, naranjas y rojos tierra.'],
    neutro: ['Subtono neutro', 'Te va bien casi todo. Las recomendaciones se fijan más en la combinación.'],
  }[s || 'neutro'];
  return `<b>${t[0]}</b><span>${t[1]}</span>`;
}

// ═══════════════════════════════════════════════════════════
//  APP (estructura)
// ═══════════════════════════════════════════════════════════
function renderApp() {
  const local = S.store.mode === 'local';
  const bannerOff = localStorage.getItem('percha_banner_off');
  app().innerHTML = `
  <header class="topbar">
    <a class="logo" href="#" data-act="ir" data-vista="armario">${I.percha}<span>Percha</span></a>
    <nav class="tabs" aria-label="Secciones">
      ${[['armario', 'Armario'], ['outfits', 'Outfits'], ['resumen', 'Resumen'], ['perfil', 'Perfil']].map(([v, l]) =>
        `<button data-act="ir" data-vista="${v}" class="${S.vista === v ? 'activo' : ''}">${l}</button>`).join('')}
    </nav>
    <div class="top-acciones">
      <button class="clima-chip" data-act="ciudad" id="clima-chip" aria-label="Clima y ciudad">…</button>
      <button class="btn btn-primario btn-agregar" data-act="nueva-prenda">${I.mas}<span>Agregar prenda</span></button>
      <button class="avatar" data-act="ir" data-vista="perfil" aria-label="Tu perfil" style="--piel:${S.perfil?.piel || '#C98E66'}">${esc(iniciales(S.perfil?.nombre))}</button>
    </div>
  </header>
  ${local && !bannerOff ? `<div class="banner-local"><span>Estás en modo local: tu armario vive en este navegador.</span>
    <button class="enlace" data-act="como-supabase">Cómo pasarlo a la nube</button>
    <button class="btn-icono" data-act="cerrar-banner" aria-label="Cerrar aviso">${I.x}</button></div>` : ''}
  <main id="vista" class="vista"></main>
  <nav class="bottom-nav" aria-label="Secciones">
    <button data-act="movil" data-panel="armario">${I.armario}<span>Armario</span></button>
    <button data-act="movil" data-panel="probador" id="nav-probador">${I.persona}<span>Probador</span><b class="badge" id="badge-probador"></b></button>
    <button data-act="nueva-prenda" class="nav-mas" aria-label="Agregar prenda">${I.mas}</button>
    <button data-act="ir" data-vista="outfits">${I.outfits}<span>Outfits</span></button>
    <button data-act="ir" data-vista="resumen">${I.resumen}<span>Resumen</span></button>
  </nav>`;
  renderVista();
  actualizarClima();
}

function renderVista() {
  $$('.tabs button').forEach(b => b.classList.toggle('activo', b.dataset.vista === S.vista));
  $$('.bottom-nav [data-act]').forEach(b => {
    const activo = S.vista === 'armario' ? b.dataset.panel === S.panelMovil : b.dataset.vista === S.vista;
    b.classList.toggle('activo', !!activo);
  });
  const v = $('#vista');
  v.className = 'vista vista-' + S.vista;
  if (S.vista === 'armario') renderArmarioVista(v);
  if (S.vista === 'outfits') renderOutfits(v);
  if (S.vista === 'resumen') renderResumen(v);
  if (S.vista === 'perfil') renderPerfil(v);
  actualizarBadge();
}

async function actualizarClima(forzar) {
  const chip = $('#clima-chip');
  if (!S.clima || forzar) {
    const p = S.perfil || {};
    S.clima = await obtenerClima(p.ciudad === 'gps' ? { lat: p.lat, lon: p.lon } : { ciudad: p.ciudad || CONFIG.CIUDAD_DEFECTO });
  }
  const c = S.clima;
  const txt = `<span class="clima-icono">${c.icono}</span><b>${c.temp}°</b><span class="clima-ciudad">${esc(c.ciudad)}</span>`;
  if (chip) chip.innerHTML = txt;
  const pc = $('#probador-clima');
  if (pc) pc.innerHTML = `${c.icono} ${c.temp}° · ${esc(c.texto)}${c.aprox ? ' (aprox.)' : ''} · lluvia ${c.lluvia}%`;
}

// ═══════════════════════════════════════════════════════════
//  VISTA ARMARIO + PROBADOR
// ═══════════════════════════════════════════════════════════
function puertasHTML(conBoton = true) {
  const tag = conBoton ? 'button' : 'div';
  const attrs = conBoton ? 'type="button" data-act="puertas"' : '';
  return ['izq', 'der'].map(l => `
    <${tag} class="puerta puerta-${l}" ${attrs} ${conBoton ? `aria-label="${S.puertas ? 'Cerrar' : 'Abrir'} el armario"` : ''}>
      <span class="cara cara-frente"><span class="moldura"></span><span class="manija"></span></span>
      <span class="cara cara-dentro">${l === 'der' ? '<span class="espejo"></span>' : '<span class="ganchos"></span>'}</span>
    </${tag}>`).join('');
}

function renderArmarioVista(v) {
  v.innerHTML = `
  <div class="armario-layout panel-${S.panelMovil}">
    <section class="armario-panel" aria-label="Tu armario">
      <div class="mueble ${S.puertas ? 'abierto' : ''}" id="mueble">
        <div class="mueble-corona"><span>${esc((S.perfil?.nombre || 'Mi').split(' ')[0])}</span></div>
        <div class="mueble-cuerpo">
          <div class="interior" id="interior"></div>
          ${puertasHTML()}
        </div>
        <div class="mueble-patas"><span></span><span></span></div>
      </div>
    </section>
    <section class="probador-panel" aria-label="Probador" id="probador"></section>
  </div>`;
  renderInterior();
  renderProbador();
  if (!S.puertas) setTimeout(() => { S.puertas = true; $('#mueble')?.classList.add('abierto'); actualizarPuertasAria(); }, reduceMotion() ? 0 : 350);
}
function actualizarPuertasAria() { $$('#mueble .puerta').forEach(p => p.setAttribute('aria-label', (S.puertas ? 'Cerrar' : 'Abrir') + ' el armario')); }

const disponibles = lista => lista.filter(p => p.estado === 'disponible');

function renderInterior(animar) {
  const el = $('#interior'); if (!el) return;
  if (!S.comp) {
    el.className = 'interior vista-general';
    el.innerHTML = Object.entries(COMPARTIMENTOS).map(([k, c]) => compResumenHTML(k, c)).join('') +
      (S.prendas.length === 0 ? `<div class="interior-vacio"><p>Tu armario está vacío.</p><button class="btn btn-laton" data-act="nueva-prenda">${I.camara} Sube tu primera prenda</button></div>` : '');
  } else {
    const c = COMPARTIMENTOS[S.comp];
    const todas = S.prendas.filter(p => TIPOS[p.tipo]?.comp === S.comp);
    const lista = S.filtro === 'todas' ? todas : todas.filter(p => p.estado === S.filtro);
    const cuenta = e => todas.filter(p => p.estado === e).length;
    el.className = `interior vista-comp estilo-${c.estilo}`;
    el.innerHTML = `
      <div class="comp-abierto">
        <header class="comp-header">
          <button class="btn-volver" data-act="cerrar-comp">${I.izq}<span>Armario</span></button>
          <h2>${c.label}</h2>
          <button class="btn btn-mini" data-act="nueva-prenda" data-comp="${S.comp}">${I.mas}<span>Agregar</span></button>
        </header>
        <div class="filtros" role="group" aria-label="Filtrar por estado">
          ${[['todas', 'Todas', todas.length], ['disponible', 'Disponibles', cuenta('disponible')], ['sucia', 'Sucias', cuenta('sucia')], ['prestada', 'Prestadas', cuenta('prestada')], ['danada', 'Dañadas', cuenta('danada')]]
            .filter(([k, , n]) => k === 'todas' || k === 'disponible' || n > 0)
            .map(([k, l, n]) => `<button class="filtro ${S.filtro === k ? 'activo' : ''} ${k !== 'todas' ? 'f-' + k : ''}" data-act="filtro" data-filtro="${k}">${l} <span>${n}</span></button>`).join('')}
        </div>
        <div class="comp-items ${c.estilo === 'colgado' ? 'riel' : 'repisas'}">
          ${lista.length ? lista.map(itemHTML).join('') : `<div class="comp-vacio"><p>${todas.length ? 'No hay prendas con ese estado.' : 'Aún no tienes ' + c.label.toLowerCase() + '.'}</p>
            ${todas.length ? '' : `<button class="btn btn-laton" data-act="nueva-prenda" data-comp="${S.comp}">${I.camara} Agregar la primera</button>`}</div>`}
        </div>
      </div>`;
  }
  if (animar && !reduceMotion()) {
    el.classList.add(S.comp ? 'entra-comp' : 'entra-general');
    setTimeout(() => el.classList.remove('entra-comp', 'entra-general'), 500);
  }
}

function compResumenHTML(k, c) {
  const lista = S.prendas.filter(p => TIPOS[p.tipo]?.comp === k);
  const disp = disponibles(lista).length;
  const muestra = [...lista].sort((a, b) => (a.estado === 'disponible' ? 0 : 1) - (b.estado === 'disponible' ? 0 : 1)).slice(0, c.estilo === 'colgado' ? 6 : 5);
  const thumbs = muestra.map((p, i) => `<img src="${imagenDe(p)}" alt="" style="--i:${i}" class="${p.estado !== 'disponible' ? 'no-disp' : ''}" loading="lazy">`).join('');
  return `
    <button class="comp comp-${k} estilo-${c.estilo}" data-act="abrir-comp" data-comp="${k}" aria-label="Abrir ${c.label}: ${lista.length} prendas">
      ${c.estilo === 'colgado' ? '<span class="barra-riel"></span>' : ''}
      ${c.estilo === 'cajon' ? '<span class="cajon-frente"><span class="cajon-manija"></span></span>' : ''}
      <span class="comp-thumbs">${thumbs || '<span class="comp-hueco">Vacío</span>'}</span>
      <span class="comp-etiqueta"><b>${c.label}</b><span>${lista.length ? `${disp} de ${lista.length} listas` : 'Agrega prendas'}</span></span>
    </button>`;
}

function itemHTML(p) {
  const puesta = Object.values(S.outfit).includes(p.id);
  const extra = p.estado === 'prestada' && p.prestado_a ? ` · ${esc(p.prestado_a)}` : '';
  return `
    <div class="item estado-${p.estado} ${puesta ? 'puesta' : ''}" data-id="${p.id}">
      ${COMPARTIMENTOS[TIPOS[p.tipo]?.comp]?.estilo === 'colgado' ? '<span class="gancho" aria-hidden="true"></span>' : ''}
      <button class="item-prenda" data-act="probar" data-id="${p.id}" aria-label="${puesta ? 'Quitar' : 'Probar'} ${esc(p.nombre)}">
        <img src="${imagenDe(p)}" alt="" loading="lazy">
        ${puesta ? `<span class="item-puesta">${I.check}</span>` : ''}
      </button>
      <div class="item-info">
        <span class="item-nombre">${esc(p.nombre)}</span>
        <span class="pill pill-${p.estado}">${ESTADOS[p.estado]?.label}${extra}</span>
      </div>
      <button class="item-menu btn-icono" data-act="ficha" data-id="${p.id}" aria-label="Opciones de ${esc(p.nombre)}">${I.puntos}</button>
    </div>`;
}

// ─── Maniquí ────────────────────────────────────────────────
function maniquiHTML(outfit, { perfil = S.perfil || {}, id = '', mini = false, ocultar = null } = {}) {
  const k = ESCALA[perfil.contextura] || 1;
  const get = pid => (pid && typeof pid === 'object') ? pid : prenda(pid);
  const pantalon = get(outfit.piernas);
  // Pantalón largo: se esconden las piernas del maniquí y la foto se estira de la cintura a los tobillos
  const largo = !!pantalon && pantalon.tipo !== 'short';
  const slots = Object.entries(outfit).map(([z, pid]) => {
    const p = get(pid);
    if (!p || !ZONAS[z]) return '';
    const a = p.ajuste || {};
    const escala = `scale(${(a.s || 1) * (a.sx || 1)}, ${(a.s || 1) * (a.sy || 1)})`;
    // Forma por partes (cintura, bota, hombros…): la foto se deforma en un canvas con márgenes (PADDING)
    const src = imagenDe(p);
    const forma = formaDe(p, z);
    const lista = forma ? formaLista(src, forma) : null;
    const P = forma ? PADDING : 1;
    const imgAttrs = forma && !lista
      ? `src="${src}" data-src="${src}" data-forma='${esc(JSON.stringify(forma))}'`
      : `src="${lista || src}"`;
    const pendiente = forma && !lista ? 'deformando' : '';
    const real = cajaReal(z, p, perfil.altura);
    if (real) {
      // Tamaño real: la foto mide lo que dicen sus cm según tu altura; lo que pase del piso queda bajo los tenis
      const pct = real.alto / real.h * 100;
      return `<div class="slot slot-${z} real ${ocultar === z ? 'oculto' : ''}" data-zona="${z}" style="left:0;top:${real.y / 6}%;width:100%;height:${real.h / 6}%;z-index:${ZONAS[z].z}">
        <img class="${pendiente}" ${imgAttrs} alt="${esc(p.nombre)}" style="height:${pct}%;transform:translateX(-50%) translate(${a.x || 0}%,${a.y || 0}%) ${escala}" draggable="false"></div>`;
    }
    let [x, y, w, h] = ZONAS[z].box;
    if (P !== 1) { x -= w * (P - 1) / 2; w *= P; }      // el canvas deformado trae márgenes: se ensancha la caja igual
    const ajuste = z === 'piernas' ? (largo ? 'relleno' : 'arriba') : '';
    return `<div class="slot slot-${z} ${ocultar === z ? 'oculto' : ''}" data-zona="${z}" style="left:${x / 3}%;top:${y / 6}%;width:${w / 3}%;height:${h / 6}%;z-index:${ZONAS[z].z}">
      <img class="${ajuste} ${pendiente}" ${imgAttrs} alt="${esc(p.nombre)}" style="transform:translate(${a.x || 0}%,${a.y || 0}%) ${escala}" draggable="false"></div>`;
  }).join('');
  return `<div class="maniqui ${mini ? 'mini' : ''}" ${id ? `id="${id}"` : ''}>
    <div class="maniqui-figura" style="transform:scaleX(${k})">${maniquiSVG({ piel: perfil.piel, silueta: perfil.silueta, sinPiernas: largo })}<div class="slots">${slots}</div></div>
  </div>`;
}

const FILAS = { cabeza: 8.5, torso: 29, capa: 43, piernas: 68, pies: 93 };

// Ajuste de cada prenda en el maniquí (se guarda en prendas.ajuste)
const AJUSTE_BASE = { x: 0, y: 0, s: 1, sx: 1, sy: 1 };
const AJUSTES_GENERALES = [
  { n: 'ax', k: 'x', label: 'Mover a los lados', min: -40, max: 40, step: 1 },
  { n: 'ay', k: 'y', label: 'Subir o bajar', min: -40, max: 40, step: 1 },
  { n: 'as', k: 's', label: 'Tamaño general', min: 0.5, max: 1.6, step: 0.01, pct: true },
  { n: 'asx', k: 'sx', label: 'Ancho', min: 0.6, max: 1.4, step: 0.01, pct: true },
  { n: 'asy', k: 'sy', label: 'Largo', min: 0.7, max: 1.3, step: 0.01, pct: true },
];
const verValor = (d, v) => d.pct ? Math.round(v * 100) + '%' : (v > 0 ? '+' : '') + Math.round(v);

function renderProbador() {
  const el = $('#probador'); if (!el) return;
  const piezas = Object.entries(S.outfit).filter(([, id]) => prenda(id));
  const ev = evaluarOutfit(S.outfit, S.prendas);
  const evTxt = ev ? { neutros: 'Neutros: combinación segura', acento: 'Neutros + un color: muy bien', analogos: 'Colores vecinos: armónico', complementarios: 'Contraste fuerte, bien llevado', choque: 'Dos colores chocan un poco', muchos: 'Demasiados colores juntos' }[ev.tipo] : '';
  el.innerHTML = `
    <div class="probador-cabeza">
      <div>
        <h2>Probador</h2>
        <p class="probador-clima" id="probador-clima">Cargando clima…</p>
      </div>
      <label class="ocasion"><span class="sr">Ocasión</span>
        <select data-act-change="ocasion" aria-label="Ocasión">${Object.entries(OCASIONES).map(([k, o]) => `<option value="${k}" ${S.ocasion === k ? 'selected' : ''}>${o.label}</option>`).join('')}</select>
      </label>
    </div>
    <div class="escenario">
      <div class="escenario-piso"></div>
      ${maniquiHTML(S.outfit, { id: 'stage' })}
      <div class="flechas">
        ${ZONAS_ROTABLES.map(z => `
          <div class="fila-flecha" style="top:${FILAS[z]}%">
            <button class="flecha" data-act="rotar" data-zona="${z}" data-dir="-1" aria-label="${ZONAS[z].label}: anterior">${I.izq}</button>
            <span class="fila-label">${ZONAS[z].label}</span>
            <button class="flecha" data-act="rotar" data-zona="${z}" data-dir="1" aria-label="${ZONAS[z].label}: siguiente">${I.der}</button>
          </div>`).join('')}
      </div>
      ${piezas.length === 0 ? `<p class="escenario-ayuda">Toca una prenda del armario o usa las flechas para vestir el maniquí</p>` : ''}
    </div>
    ${ev ? `<p class="evaluacion eval-${ev.tipo}">${evTxt}</p>` : ''}
    <div class="outfit-chips">
      ${piezas.map(([z, id]) => { const p = prenda(id); return `
        <span class="outfit-chip"><img src="${imagenDe(p)}" alt=""><span>${esc(p.nombre)}</span>
          <button class="btn-icono" data-act="ajustar" data-id="${p.id}" aria-label="Ajustar ${esc(p.nombre)} en el maniquí" title="Ajustar en el maniquí">${I.editar}</button>
          <button class="btn-icono" data-act="quitar-zona" data-zona="${z}" aria-label="Quitar ${esc(p.nombre)}">${I.x}</button></span>`; }).join('')}
    </div>
    <div class="probador-acciones">
      <button class="btn btn-laton btn-grande" data-act="recomendar">${I.chispa}<span>Recomiéndame</span></button>
      <button class="btn" data-act="aleatorio">${I.azar}<span>Aleatorio</span></button>
      <button class="btn" data-act="guardar-outfit" ${piezas.length ? '' : 'aria-disabled="true"'}>${I.guardar}<span>Guardar</span></button>
      <button class="btn" data-act="usar-hoy" ${piezas.length ? '' : 'aria-disabled="true"'}>${I.usar}<span>Usar hoy</span></button>
      ${piezas.length ? `<button class="btn btn-fantasma" data-act="limpiar">${I.x}<span>Quitar todo</span></button>` : ''}
    </div>
    ${S.razones ? `<div class="razones"><h3>Por qué este outfit</h3><ul>${S.razones.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}`;
  if (S.clima) actualizarClima();
}

function actualizarBadge() {
  const b = $('#badge-probador'); if (!b) return;
  const n = Object.values(S.outfit).filter(Boolean).length;
  b.textContent = n || ''; b.classList.toggle('ver', n > 0);
}

function refrescarArmario({ interior = true, probador = true } = {}) {
  if (S.vista !== 'armario') return;
  if (interior) renderInterior();
  if (probador) renderProbador();
  actualizarBadge();
  guardarProbador();
}

// ─── Ponerse una prenda (con animación de vuelo) ────────────
async function probar(id, origen) {
  const p = prenda(id); if (!p) return;
  const z = zonaDe(p);
  if (S.outfit[z] === id) { delete S.outfit[z]; S.razones = null; refrescarArmario(); return; }
  if (p.estado !== 'disponible') {
    const el = origen?.closest('.item'); el?.classList.add('sacudir'); setTimeout(() => el?.classList.remove('sacudir'), 500);
    const msg = { sucia: 'está sucia', prestada: `está prestada${p.prestado_a ? ' a ' + p.prestado_a : ''}`, danada: 'está dañada' }[p.estado];
    return toast(`${p.nombre} ${msg}.`, { accion: p.estado === 'sucia' ? 'Ya la lavé' : p.estado === 'prestada' ? 'Ya me la devolvieron' : 'Ya la arreglé', onAccion: () => cambiarEstado([id], 'disponible') });
  }
  S.outfit[z] = id; S.razones = null;
  const img = origen?.querySelector('img');
  const verStage = !esMovil() || S.panelMovil === 'probador';
  renderInterior();
  if (verStage) $('#probador') && ($('#stage').outerHTML = maniquiHTML(S.outfit, { id: 'stage', ocultar: z }));
  const destino = verStage ? $(`#stage .slot-${z}`) : $('#nav-probador');
  if (img && destino && !reduceMotion()) await volar(img, destino);
  renderProbador();
  if (verStage) { const s = $(`#stage .slot-${z}`); s?.classList.add('cae'); }
  else { const n = $('#nav-probador'); n?.classList.add('rebote'); setTimeout(() => n?.classList.remove('rebote'), 600); }
  actualizarBadge(); guardarProbador();
}

function volar(imgOrigen, destino) {
  return new Promise(res => {
    const r1 = imgOrigen.getBoundingClientRect(), r2 = destino.getBoundingClientRect();
    if (!r1.width || !r2.width) return res();
    const clon = imgOrigen.cloneNode();
    clon.className = 'volando';
    Object.assign(clon.style, { left: r1.left + 'px', top: r1.top + 'px', width: r1.width + 'px', height: r1.height + 'px' });
    document.body.appendChild(clon);
    const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2);
    const dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2);
    const s = Math.min(r2.width / r1.width, r2.height / r1.height);
    const a = clon.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(${(1 + s) / 2}) rotate(-8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(0)`, opacity: 0.9 },
    ], { duration: 620, easing: 'cubic-bezier(.45,.05,.3,1)' });
    a.onfinish = () => { clon.remove(); res(); };
  });
}

function rotar(z, dir) {
  const lista = disponibles(S.prendas).filter(p => zonaDe(p) === z).sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (!lista.length) return toast(`No tienes prendas disponibles para "${ZONAS[z].label.toLowerCase()}".`);
  const opciones = [null, ...lista.map(p => p.id)];
  const i = opciones.indexOf(S.outfit[z] ?? null);
  const sig = opciones[(i + dir + opciones.length) % opciones.length];
  if (sig) S.outfit[z] = sig; else delete S.outfit[z];
  S.razones = null;
  refrescarArmario({ interior: !!S.comp });
  const s = $(`#stage .slot-${z}`);
  s?.classList.add(dir > 0 ? 'desliza-der' : 'desliza-izq');
}

function hacerRecomendacion() {
  const r = recomendar({ prendas: S.prendas, perfil: S.perfil, clima: S.clima, ocasion: S.ocasion });
  if (r.vacio) return toast(r.razones[0]);
  const anterior = S.outfit;
  S.outfit = r.outfit; S.razones = r.razones;
  refrescarArmario();
  if (!reduceMotion()) $$('#stage .slot').forEach((s, i) => { s.style.animationDelay = i * 70 + 'ms'; s.classList.add('cae'); });
  if (esMovil() && S.panelMovil !== 'probador') { S.panelMovil = 'probador'; renderVista(); }
  return anterior;
}

function aleatorio() {
  const o = {};
  for (const z of ['torso', 'piernas', 'pies', 'capa', 'cabeza']) {
    const l = disponibles(S.prendas).filter(p => zonaDe(p) === z);
    if (l.length && (['torso', 'piernas', 'pies'].includes(z) || Math.random() < 0.45)) o[z] = l[Math.floor(Math.random() * l.length)].id;
  }
  S.outfit = o; S.razones = null; refrescarArmario();
  if (!reduceMotion()) $$('#stage .slot').forEach((s, i) => { s.style.animationDelay = i * 60 + 'ms'; s.classList.add('cae'); });
}

async function guardarOutfit(preNombre) {
  const ids = Object.values(S.outfit).filter(Boolean);
  if (!ids.length) return toast('Viste el maniquí primero.');
  const sugerido = preNombre || `${OCASIONES[S.ocasion]?.label} · ${nombreColor(prenda(S.outfit.capa || S.outfit.torso)?.color || '#777')}`;
  const m = abrirModal(`
    <form class="modal-cuerpo form" id="f-outfit">
      <h2>Guardar outfit</h2>
      <div class="guardar-preview">${maniquiHTML(S.outfit, { mini: true })}</div>
      <label class="campo"><span>Nombre</span><input name="nombre" value="${esc(sugerido)}" maxlength="60" autofocus></label>
      <label class="campo"><span>Ocasión</span><select name="ocasion">${Object.entries(OCASIONES).map(([k, o]) => `<option value="${k}" ${S.ocasion === k ? 'selected' : ''}>${o.label}</option>`).join('')}</select></label>
      <p class="error" role="alert"></p>
      <div class="modal-pie"><button type="button" class="btn" data-cerrar-modal>Cancelar</button><button class="btn btn-primario">Guardar outfit</button></div>
    </form>`, { clase: 'modal-chico' });
  $('#f-outfit', m).onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const nombre = (f.get('nombre') || '').trim();
    if (!nombre) return (m.querySelector('.error').textContent = 'Ponle un nombre al outfit.');
    try {
      const o = await S.store.saveOutfit({ nombre, ocasion: f.get('ocasion'), items: { ...S.outfit } });
      S.outfits.unshift(o); cerrarModal(); toast('Outfit guardado.', { accion: 'Ver outfits', onAccion: () => ir('outfits') });
    } catch (ex) { m.querySelector('.error').textContent = ex.message; }
  };
}

async function usarHoy(outfit = S.outfit, outfitId = null) {
  const ids = Object.values(outfit).filter(id => prenda(id));
  if (!ids.length) return toast('Viste el maniquí primero.');
  const noDisp = ids.map(prenda).filter(p => p.estado !== 'disponible');
  if (noDisp.length) return toast(`No puedes usar ${noDisp[0].nombre}: está ${ESTADOS[noDisp[0].estado].label.toLowerCase()}.`);
  const auto = S.perfil?.lavanderia_auto;
  const hoy = new Date().toISOString();
  S.prendas = await S.store.updatePrendas(ids, p => ({ usos: (p.usos || 0) + 1, ultimo_uso: hoy, ...(auto && !['reloj', 'gafas', 'cadena', 'gorra', 'sombrero', 'tenis', 'botas', 'zapatos'].includes(p.tipo) ? { estado: 'sucia' } : {}) }));
  const h = await S.store.addHistorial({ prenda_ids: ids, outfit_id: outfitId });
  S.historial.unshift(h);
  if (outfitId) {
    const o = S.outfits.find(x => x.id === outfitId);
    if (o) { o.usos = (o.usos || 0) + 1; o.ultimo_uso = hoy; await S.store.saveOutfit({ id: o.id, usos: o.usos, ultimo_uso: hoy }); }
  }
  if (outfit === S.outfit) { S.outfit = {}; S.razones = null; }
  guardarProbador();
  renderVista();
  toast(auto ? 'Registrado. La ropa usada pasó al cesto de sucias.' : 'Registrado en tu historial.', auto ? { accion: 'Deshacer cesto', onAccion: () => cambiarEstado(ids.filter(id => prenda(id)?.estado === 'sucia'), 'disponible') } : {});
}

async function cambiarEstado(ids, estado, extra = {}) {
  if (!ids.length) return;
  const patch = { estado, ...extra };
  if (estado !== 'prestada') Object.assign(patch, { prestado_a: null, prestado_desde: null });
  S.prendas = await S.store.updatePrendas(ids, patch);
  if (estado !== 'disponible') for (const [z, id] of Object.entries(S.outfit)) if (ids.includes(id)) delete S.outfit[z];
  guardarProbador();
  if (S.vista === 'armario') refrescarArmario(); else renderVista();
}

// ═══════════════════════════════════════════════════════════
//  FICHA DE PRENDA
// ═══════════════════════════════════════════════════════════
function abrirFicha(id) {
  const p = prenda(id); if (!p) return;
  const cpu = p.precio && p.usos ? cop(Math.round(p.precio / p.usos)) : null;
  const m = abrirModal(`
    <div class="modal-cuerpo ficha">
      <button class="btn-icono cerrar" data-cerrar-modal aria-label="Cerrar">${I.x}</button>
      <div class="ficha-foto"><img src="${imagenDe(p)}" alt=""></div>
      <div class="ficha-datos">
        <p class="ficha-tipo">${TIPOS[p.tipo]?.label}</p>
        <h2>${esc(p.nombre)}</h2>
        <dl class="ficha-lista">
          <div><dt>Color</dt><dd><span class="punto" style="background:${p.color}"></span>${nombreColor(p.color)}</dd></div>
          <div><dt>Estilo</dt><dd>${FORMALIDAD[p.formalidad || 1]}</dd></div>
          <div><dt>Clima</dt><dd>${CLIMAS[p.clima || 'todo']}</dd></div>
          <div><dt>Veces usada</dt><dd>${p.usos || 0}</dd></div>
          <div><dt>Último uso</dt><dd>${hace(p.ultimo_uso)}</dd></div>
          ${p.precio ? `<div><dt>Precio</dt><dd>${cop(p.precio)}</dd></div>` : ''}
          ${cpu ? `<div><dt>Costo por uso</dt><dd>${cpu}</dd></div>` : ''}
          ${medidasPara(p.tipo).filter(d => p.medidas?.[d.k]).map(d => `<div><dt>${d.label}</dt><dd>${esc(p.medidas[d.k])}${d.texto ? '' : ' cm'}</dd></div>`).join('')}
        </dl>
        ${p.notas ? `<p class="ficha-notas">${esc(p.notas)}</p>` : ''}
        <fieldset class="campo"><legend>Estado</legend>
          <div class="estados">${Object.entries(ESTADOS).map(([k, e]) => `<button class="estado-btn e-${k} ${p.estado === k ? 'activo' : ''}" data-estado="${k}">${e.label}</button>`).join('')}</div>
        </fieldset>
        <div class="prestamo ${p.estado === 'prestada' ? '' : 'oculto'}">
          <label class="campo"><span>¿A quién se la prestaste?</span><input id="ficha-persona" value="${esc(p.prestado_a || '')}" placeholder="Nombre"></label>
          ${p.prestado_desde ? `<p class="nota">Prestada ${hace(p.prestado_desde).toLowerCase()}</p>` : ''}
        </div>
        <div class="modal-pie">
          <button class="btn btn-fantasma peligro" data-f="eliminar">${I.basura}<span>Eliminar</span></button>
          <button class="btn" data-f="editar">${I.editar}<span>Editar</span></button>
          <button class="btn btn-primario" data-f="probar" ${p.estado !== 'disponible' ? 'aria-disabled="true"' : ''}>Probar</button>
        </div>
      </div>
    </div>`, { clase: 'modal-ficha' });

  m.querySelectorAll('.estado-btn').forEach(b => b.onclick = async () => {
    const e = b.dataset.estado;
    m.querySelectorAll('.estado-btn').forEach(x => x.classList.toggle('activo', x === b));
    m.querySelector('.prestamo').classList.toggle('oculto', e !== 'prestada');
    if (e === 'prestada') { m.querySelector('#ficha-persona').focus(); return guardarPrestamo(); }
    await cambiarEstado([id], e);
    m.querySelector('[data-f=probar]').setAttribute('aria-disabled', e !== 'disponible');
    toast(`${p.nombre}: ${ESTADOS[e].label.toLowerCase()}.`);
  });
  const guardarPrestamo = async () => {
    const persona = m.querySelector('#ficha-persona').value.trim() || null;
    await cambiarEstado([id], 'prestada', { prestado_a: persona, prestado_desde: prenda(id).prestado_desde || new Date().toISOString() });
  };
  m.querySelector('#ficha-persona').addEventListener('change', guardarPrestamo);
  m.querySelector('[data-f=editar]').onclick = () => abrirEditor(prenda(id));
  m.querySelector('[data-f=probar]').onclick = () => {
    if (prenda(id).estado !== 'disponible') return toast('Marca la prenda como disponible para probarla.');
    cerrarModal(); if (S.vista !== 'armario') ir('armario'); probar(id, null);
  };
  m.querySelector('[data-f=eliminar]').onclick = async () => {
    if (!(await confirmar('Eliminar prenda', `¿Seguro que quieres eliminar "${p.nombre}"? No se puede deshacer.`, { si: 'Eliminar', peligro: true }))) return abrirFicha(id);
    await S.store.deletePrenda(id);
    S.prendas = S.prendas.filter(x => x.id !== id);
    for (const [z, pid] of Object.entries(S.outfit)) if (pid === id) delete S.outfit[z];
    guardarProbador(); renderVista(); toast('Prenda eliminada.');
  };
}

// ═══════════════════════════════════════════════════════════
//  AGREGAR / EDITAR PRENDA
// ═══════════════════════════════════════════════════════════
function abrirEditor(existente = null, compSugerido = null, { ajustar = false } = {}) {
  const tipoDef = existente?.tipo || Object.entries(TIPOS).find(([, t]) => t.comp === (compSugerido || S.comp))?.[0] || 'camiseta';
  const e = {
    nombre: '', tipo: tipoDef, color: '#3B5D8C', formalidad: 1, clima: 'todo', estado: 'disponible',
    precio: '', notas: '', prestado_a: '', ...existente,
  };
  e.ajuste = { ...AJUSTE_BASE, ...(existente?.ajuste || {}) };
  e.medidas = { ...(existente?.medidas || {}) };
  let blob = null, fotoUrl = existente?.imagen_url || null, quitarF = true, procesando = false;
  let paleta = [];
  const grupos = Object.entries(COMPARTIMENTOS).map(([k, c]) =>
    `<optgroup label="${c.label}">${Object.entries(TIPOS).filter(([, t]) => t.comp === k).map(([tk, t]) => `<option value="${tk}" ${e.tipo === tk ? 'selected' : ''}>${t.label}</option>`).join('')}</optgroup>`).join('');

  const m = abrirModal(`
    <form class="editor form" id="f-prenda" novalidate>
      <header class="editor-cabeza">
        <h2>${existente ? 'Editar prenda' : 'Nueva prenda'}</h2>
        <button type="button" class="btn-icono" data-cerrar-modal aria-label="Cerrar">${I.x}</button>
      </header>
      <div class="editor-cuerpo">
        <div class="editor-foto">
          <div class="foto-zona" id="foto-zona">
            <img id="foto-prev" alt="Vista de la prenda">
            <div class="foto-progreso" id="foto-progreso" hidden><span></span><p>Quitando el fondo…</p></div>
          </div>
          <div class="foto-botones">
            <label class="btn">${I.camara}<span>${existente?.imagen_url ? 'Cambiar foto' : 'Tomar o subir foto'}</span>
              <input type="file" accept="image/*" capture="environment" id="foto-input" class="sr"></label>
            <button type="button" class="btn btn-fantasma" id="usar-dibujo">Usar dibujo</button>
          </div>
          <label class="interruptor chico"><input type="checkbox" id="quitar-fondo" checked><span class="pista"></span><span>Quitar el fondo automáticamente</span></label>
          <p class="nota">Tip: foto de frente, con la prenda extendida sobre la cama o colgada en una pared lisa.</p>
          <div class="ajuste" id="ajuste">
            <p class="ajuste-titulo">Ajustar en el maniquí</p>
            <div class="ajuste-cuerpo">
              <div class="ajuste-maniqui" id="ajuste-maniqui"></div>
              <div class="ajuste-sliders" id="ajuste-sliders">
              </div>
            </div>
          </div>
        </div>
        <div class="editor-campos">
          <label class="campo"><span>Tipo de prenda</span><select name="tipo">${grupos}</select></label>
          <label class="campo"><span>Nombre</span><input name="nombre" value="${esc(e.nombre)}" placeholder="Camiseta negra oversize" maxlength="60"></label>
          <div class="campo"><span class="campo-titulo">Color principal</span>
            <div class="color-fila">
              <input type="color" name="color" value="${e.color}" aria-label="Color">
              <span class="color-nombre" id="color-nombre">${nombreColor(e.color)}</span>
              <span class="paleta" id="paleta"></span>
            </div>
          </div>
          <fieldset class="campo"><legend>Estilo</legend>
            <div class="segmento">${Object.entries(FORMALIDAD).map(([k, l]) => `<label class="${+e.formalidad === +k ? 'activo' : ''}"><input type="radio" name="formalidad" value="${k}" ${+e.formalidad === +k ? 'checked' : ''}>${l}</label>`).join('')}</div>
          </fieldset>
          <fieldset class="campo"><legend>¿Para qué clima?</legend>
            <div class="segmento">${Object.entries(CLIMAS).map(([k, l]) => `<label class="${e.clima === k ? 'activo' : ''}"><input type="radio" name="clima" value="${k}" ${e.clima === k ? 'checked' : ''}>${k === 'todo' ? 'Todos' : l}</label>`).join('')}</div>
          </fieldset>
          <fieldset class="campo"><legend>Estado</legend>
            <div class="segmento">${Object.entries(ESTADOS).map(([k, s]) => `<label class="${e.estado === k ? 'activo' : ''}"><input type="radio" name="estado" value="${k}" ${e.estado === k ? 'checked' : ''}>${s.label}</label>`).join('')}</div>
          </fieldset>
          <label class="campo prestamo ${e.estado === 'prestada' ? '' : 'oculto'}"><span>¿A quién se la prestaste?</span><input name="prestado_a" value="${esc(e.prestado_a || '')}" placeholder="Nombre"></label>
          <fieldset class="campo medidas" id="medidas-campos"></fieldset>
          <div class="campos-2">
            <label class="campo"><span>Precio (opcional)</span><input name="precio" type="number" inputmode="numeric" min="0" step="1000" value="${e.precio ?? ''}" placeholder="85000"></label>
            <label class="campo"><span>Notas</span><input name="notas" value="${esc(e.notas || '')}" placeholder="Talla M, regalo…"></label>
          </div>
          <p class="error" id="editor-error" role="alert"></p>
        </div>
      </div>
      <footer class="modal-pie editor-pie">
        <button type="button" class="btn" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-primario">${existente ? 'Guardar cambios' : 'Guardar prenda'}</button>
      </footer>
    </form>`, { clase: 'modal-editor' });

  const form = $('#f-prenda', m);
  const prev = $('#foto-prev', m);
  const pintar = () => {
    const actual = { ...e, imagen_url: fotoUrl };
    prev.src = imagenDe(actual);
    $('#foto-zona', m).classList.toggle('con-foto', !!fotoUrl);
    $('#color-nombre', m).textContent = nombreColor(e.color);
    const z = TIPOS[e.tipo].zona;
    pintarManiqui(z, actual);
    pintarMedidasFoto();
    $('#paleta', m).innerHTML = paleta.map(c => `<button type="button" class="paleta-color" style="background:${c}" data-c="${c}" aria-label="Usar ${nombreColor(c)}"></button>`).join('');
  };
  // Vista previa con el outfit puesto; espera a que la forma esté lista para no parpadear
  let turno = 0;
  const pintarManiqui = async (z, actual) => {
    const t = ++turno;
    const fm = formaDe(actual, z);
    if (fm) { try { await deformar(imagenDe(actual), fm); } catch {} }
    if (t !== turno) return;
    const outfit = Object.fromEntries(Object.entries(S.outfit).filter(([oz, id]) => oz !== z && id !== actual.id && prenda(id)));
    outfit[z] = actual;
    $('#ajuste-maniqui', m).innerHTML = maniquiHTML(outfit, { mini: true });
  };
  let zonaAjustes = null;
  const pintarAjustes = () => {
    const z = TIPOS[e.tipo].zona;
    if (z === zonaAjustes) return;
    zonaAjustes = z;
    const grupos = [
      ['Posición', AJUSTES_GENERALES.slice(0, 2)],
      ['Tamaño', AJUSTES_GENERALES.slice(2)],
    ].filter(([, defs]) => defs.length);
    $('#ajuste-sliders', m).innerHTML = grupos.map(([t, defs]) => `<div class="ajuste-grupo"><p>${t}</p>${defs.map(d => `
      <label><span>${d.label}<output data-o="${d.n}">${verValor(d, e.ajuste[d.k] ?? AJUSTE_BASE[d.k])}</output></span>
        <input type="range" name="${d.n}" min="${d.min}" max="${d.max}" step="${d.step}" value="${e.ajuste[d.k] ?? AJUSTE_BASE[d.k]}"></label>`).join('')}</div>`).join('')
      + '<button type="button" class="enlace" id="ajuste-reset">Restablecer todo</button>';
    $('#ajuste-reset', m).onclick = () => {
      $$('#ajuste-sliders input[type=range]', m).forEach(i => { const d = defDe(i.name); i.value = AJUSTE_BASE[d.k]; });
      sincronizar();
    };
  };
  const defDe = n => AJUSTES_GENERALES.find(d => d.n === n);
  let tipoMedidas = null;
  const pintarMedidas = () => {
    const defs = medidasPara(e.tipo);
    const firma = defs.map(d => d.k).join();
    if (firma === tipoMedidas) return;              // solo se redibuja al cambiar de tipo de prenda (no mientras escribes)
    tipoMedidas = firma;
    const caja = $('#medidas-campos', m);
    caja.classList.toggle('oculto', !defs.length);
    const cm = defs.some(d => !d.texto);
    caja.innerHTML = defs.length ? `<legend>Medidas reales${cm ? ' en cm (prenda acostada)' : ''}</legend>
      <div class="campos-medidas">${defs.map(d => `<label class="campo"><span>${d.label}</span>
        <input name="m_${d.k}" ${d.texto ? '' : 'type="number" inputmode="decimal" min="1" max="250" step="0.5"'} value="${esc(e.medidas[d.k] ?? '')}" placeholder="${d.texto ? '' : 'cm'}">
        <small class="nota">${d.ayuda}</small><small class="en-foto" data-foto="${d.k}"></small></label>`).join('')}</div>
      ${cm ? '<p class="nota">Con el <b>largo</b> la prenda toma su tamaño real según tu altura, y con las demás medidas se ajusta su forma (cintura, bota, hombros…). Debajo de cada medida ves cuánto mide la prenda en la foto.</p>' : ''}` : '';
  };
  // Cuánto mide la prenda en la foto ahora mismo (para comparar con lo que escribiste)
  let turnoFoto = 0;
  const pintarMedidasFoto = async () => {
    const t = ++turnoFoto;
    const src = fotoUrl;
    const largo = +e.medidas.largo;
    const zona = TIPOS[e.tipo].zona;
    $$('[data-foto]', m).forEach(el => (el.textContent = ''));
    if (!src || !(largo > 0)) return;
    try {
      const med = await medidasDeFoto(src, zona, e.tipo, largo);
      if (t !== turnoFoto) return;
      for (const [k, v] of Object.entries(med)) { const el = m.querySelector(`[data-foto="${k}"]`); if (el) el.textContent = `En la foto: ~${v} cm`; }
    } catch {}
  };
  const sincronizar = () => {
    const f = new FormData(form);
    e.tipo = f.get('tipo');
    pintarMedidas();
    e.medidas = {};
    for (const d of medidasPara(f.get('tipo'))) {
      const v = (f.get('m_' + d.k) || '').toString().trim();
      if (v) e.medidas[d.k] = d.texto ? v : Math.min(250, Math.max(1, +v));
    }
    e.tipo = f.get('tipo'); e.color = f.get('color'); e.formalidad = +f.get('formalidad'); e.clima = f.get('clima');
    e.estado = f.get('estado');
    pintarAjustes();
    const nuevo = { ...AJUSTE_BASE };
    $$('#ajuste-sliders input[type=range]', m).forEach(i => {
      const d = defDe(i.name); nuevo[d.k] = +i.value;
      const o = m.querySelector(`output[data-o="${i.name}"]`); if (o) o.textContent = verValor(d, +i.value);
    });
    e.ajuste = nuevo;
    $$('.segmento label', form).forEach(l => l.classList.toggle('activo', !!l.querySelector('input:checked')));
    $('.prestamo', form).classList.toggle('oculto', e.estado !== 'prestada');
    pintar();
  };
  form.addEventListener('input', ev => { if (ev.target.name === 'nombre') return; sincronizar(); });
  $('#paleta', m).addEventListener('click', ev => {
    const b = ev.target.closest('[data-c]'); if (!b) return;
    form.color.value = b.dataset.c; sincronizar();
  });
  $('#usar-dibujo', m).onclick = () => { fotoUrl = null; blob = null; paleta = []; pintar(); };
  $('#quitar-fondo', m).onchange = ev => (quitarF = ev.target.checked);

  $('#foto-input', m).onchange = async ev => {
    const file = ev.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) return ($('#editor-error', m).textContent = 'Ese archivo no es una imagen.');
    procesando = true;
    const prog = $('#foto-progreso', m); const barra = prog.querySelector('span');
    $('#editor-error', m).textContent = '';
    try {
      let fuente = file, sinFondo = false;
      if (quitarF) {
        prog.hidden = false; barra.style.width = '8%';
        prev.src = URL.createObjectURL(file);
        try {
          fuente = await quitarFondo(file, (k, a, t) => { if (t) barra.style.width = Math.max(8, Math.round(a / t * 90)) + '%'; });
          sinFondo = true;
        } catch (err) {
          console.warn(err);
          toast('No se pudo quitar el fondo (revisa tu conexión). Se usa la foto original.', { ms: 5000 });
        }
      }
      const r = await prepararImagen(fuente, { recortar: sinFondo });
      blob = r.blob; fotoUrl = r.dataUrl;
      paleta = coloresDominantes(r.img, !sinFondo, !sinFondo);
      form.color.value = paleta[0];
      if (!form.nombre.value.trim()) form.nombre.value = `${TIPOS[form.tipo.value].label} ${nombreColor(paleta[0])}`;
      sincronizar();
    } catch (err) {
      $('#editor-error', m).textContent = 'No pudimos leer la foto. Prueba con otra.';
    } finally { prog.hidden = true; procesando = false; }
  };

  form.onsubmit = async ev => {
    ev.preventDefault(); sincronizar();
    if (procesando) return ($('#editor-error', m).textContent = 'Espera a que termine de procesar la foto.');
    const f = new FormData(form);
    const nombre = (f.get('nombre') || '').trim() || `${TIPOS[e.tipo].label} ${nombreColor(e.color)}`;
    const datos = {
      ...(existente ? { id: existente.id } : { usos: 0, ultimo_uso: null }),
      nombre, tipo: e.tipo, color: e.color, formalidad: e.formalidad, clima: e.clima, estado: e.estado,
      prestado_a: e.estado === 'prestada' ? (f.get('prestado_a') || '').trim() || null : null,
      prestado_desde: e.estado === 'prestada' ? (existente?.prestado_desde || new Date().toISOString()) : null,
      precio: f.get('precio') ? Math.max(0, +f.get('precio')) : null, notas: (f.get('notas') || '').trim(),
      ajuste: Object.keys(AJUSTE_BASE).some(k => Math.abs((e.ajuste[k] ?? AJUSTE_BASE[k]) - AJUSTE_BASE[k]) > 0.001) ? e.ajuste : null,
      medidas: Object.keys(e.medidas).length ? e.medidas : null,
      imagen_url: fotoUrl && !blob ? fotoUrl : (blob ? undefined : null),
    };
    if (datos.imagen_url === undefined) delete datos.imagen_url;
    if (blob) datos._blob = blob;
    const btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      const g = await S.store.savePrenda(datos);
      if (existente) S.prendas = S.prendas.map(p => p.id === g.id ? g : p); else S.prendas.push(g);
      if (g.estado !== 'disponible') for (const [z, id] of Object.entries(S.outfit)) if (id === g.id) delete S.outfit[z];
      // si cambió de zona, sácala del probador
      for (const [z, id] of Object.entries(S.outfit)) if (id === g.id && zonaDe(g) !== z) delete S.outfit[z];
      cerrarModal();
      if (S.vista === 'armario') { S.comp = TIPOS[g.tipo].comp; S.filtro = 'todas'; refrescarArmario(); }
      else renderVista();
      toast(existente ? 'Cambios guardados.' : `${g.nombre} ya está en tu armario.`);
    } catch (ex) { $('#editor-error', m).textContent = ex.message; btn.disabled = false; btn.textContent = existente ? 'Guardar cambios' : 'Guardar prenda'; }
  };
  pintarMedidas();
  pintarAjustes();
  pintar();
  if (ajustar) setTimeout(() => { $('#ajuste', m)?.scrollIntoView({ block: 'center' }); $('#ajuste-sliders input', m)?.focus({ preventScroll: true }); }, 250);
}

// ═══════════════════════════════════════════════════════════
//  OUTFITS GUARDADOS
// ═══════════════════════════════════════════════════════════
let filtroOcasion = 'todas';
function renderOutfits(v) {
  const lista = S.outfits.filter(o => filtroOcasion === 'todas' || o.ocasion === filtroOcasion);
  v.innerHTML = `
  <div class="pagina">
    <header class="pagina-cabeza">
      <div><h1>Tus outfits</h1><p>${S.outfits.length} guardados</p></div>
      <div class="chips">${[['todas', 'Todos'], ...Object.entries(OCASIONES).map(([k, o]) => [k, o.label])]
        .filter(([k]) => k === 'todas' || S.outfits.some(o => o.ocasion === k))
        .map(([k, l]) => `<button class="chip ${filtroOcasion === k ? 'activo' : ''}" data-act="filtro-ocasion" data-o="${k}">${l}</button>`).join('')}</div>
    </header>
    ${lista.length ? `<div class="grid-outfits">${lista.map(o => {
      const items = Object.fromEntries(Object.entries(o.items || {}).filter(([, id]) => prenda(id)));
      const malas = Object.values(items).map(prenda).filter(p => p.estado !== 'disponible');
      return `<article class="outfit-card">
        <button class="outfit-maniqui" data-act="cargar-outfit" data-id="${o.id}" aria-label="Probar ${esc(o.nombre)}">${maniquiHTML(items, { mini: true })}</button>
        <div class="outfit-info">
          <h3>${esc(o.nombre)}</h3>
          <p>${OCASIONES[o.ocasion]?.label || ''} · ${o.usos ? `usado ${o.usos} ${o.usos === 1 ? 'vez' : 'veces'}` : 'sin estrenar'}</p>
          ${malas.length ? `<p class="aviso">${esc(malas[0].nombre)} está ${ESTADOS[malas[0].estado].label.toLowerCase()}${malas.length > 1 ? ` (+${malas.length - 1})` : ''}</p>` : ''}
        </div>
        <div class="outfit-acciones">
          <button class="btn btn-mini" data-act="cargar-outfit" data-id="${o.id}">Probar</button>
          <button class="btn btn-mini" data-act="usar-outfit" data-id="${o.id}" ${malas.length ? 'aria-disabled="true"' : ''}>Usar hoy</button>
          <button class="btn-icono" data-act="borrar-outfit" data-id="${o.id}" aria-label="Eliminar ${esc(o.nombre)}">${I.basura}</button>
        </div>
      </article>`; }).join('')}</div>`
    : `<div class="vacio-grande"><div class="vacio-maniqui">${maniquiHTML({})}</div><h2>Guarda tu primer outfit</h2>
       <p>Arma un look en el probador y tócale “Guardar”. Aquí lo encuentras para repetirlo rápido.</p>
       <button class="btn btn-laton" data-act="ir" data-vista="armario">Ir al probador</button></div>`}
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  RESUMEN (lavandería, préstamos, estadísticas)
// ═══════════════════════════════════════════════════════════
function renderResumen(v) {
  const P = S.prendas;
  const por = e => P.filter(p => p.estado === e);
  const sucias = por('sucia'), prestadas = por('prestada'), danadas = por('danada');
  const usadas = [...P].filter(p => p.usos).sort((a, b) => b.usos - a.usos).slice(0, 5);
  const olvidadas = P.filter(p => p.estado === 'disponible' && (!p.ultimo_uso ? !p.usos : diasDesde(p.ultimo_uso) > 45)).slice(0, 8);
  const conPrecio = P.filter(p => p.precio && p.usos).map(p => ({ p, c: p.precio / p.usos })).sort((a, b) => a.c - b.c);
  const invertido = P.reduce((t, p) => t + (+p.precio || 0), 0);
  // colores agrupados por nombre
  const colores = {}; P.forEach(p => { const n = nombreColor(p.color); (colores[n] ||= { n, c: p.color, k: 0 }).k++; });
  const listaCol = Object.values(colores).sort((a, b) => b.k - a.k);
  const thumb = p => `<button class="mini-prenda" data-act="ficha" data-id="${p.id}" title="${esc(p.nombre)}"><img src="${imagenDe(p)}" alt="${esc(p.nombre)}"></button>`;
  const hist = S.historial.slice(0, 10);

  v.innerHTML = `
  <div class="pagina">
    <header class="pagina-cabeza"><div><h1>Resumen</h1><p>Cómo está tu armario hoy</p></div></header>
    <div class="metricas">
      <div class="metrica"><b>${P.length}</b><span>prendas</span></div>
      <div class="metrica m-disponible"><b>${por('disponible').length}</b><span>listas para usar</span></div>
      <div class="metrica m-sucia"><b>${sucias.length}</b><span>en el cesto</span></div>
      <div class="metrica m-prestada"><b>${prestadas.length}</b><span>prestadas</span></div>
      <div class="metrica m-danada"><b>${danadas.length}</b><span>dañadas</span></div>
    </div>
    <div class="resumen-grid">
      <section class="tarjeta cesto">
        <header><h2>${I.lavar} Cesto de ropa sucia</h2>${sucias.length ? `<button class="btn btn-mini btn-primario" data-act="lavar-todo">Lavé todo</button>` : ''}</header>
        ${sucias.length ? `<div class="cesto-ropa">${sucias.map(p => `<div class="cesto-item">${thumb(p)}<button class="enlace" data-act="estado-rapido" data-id="${p.id}" data-estado="disponible">Limpia</button></div>`).join('')}</div>`
          : '<p class="vacio">El cesto está vacío. Todo limpio.</p>'}
      </section>
      <section class="tarjeta">
        <header><h2>Prestadas</h2></header>
        ${prestadas.length ? `<ul class="lista">${prestadas.map(p => `<li>${thumb(p)}<div><b>${esc(p.nombre)}</b><span>${p.prestado_a ? 'A ' + esc(p.prestado_a) + ' · ' : ''}${p.prestado_desde ? hace(p.prestado_desde).toLowerCase() : ''}${diasDesde(p.prestado_desde) > 10 ? ' <em class="alerta">¡ya va siendo hora!</em>' : ''}</span></div>
          <button class="btn btn-mini" data-act="estado-rapido" data-id="${p.id}" data-estado="disponible">Me la devolvieron</button></li>`).join('')}</ul>`
          : '<p class="vacio">No tienes nada prestado.</p>'}
      </section>
      ${danadas.length ? `<section class="tarjeta">
        <header><h2>Dañadas</h2></header>
        <ul class="lista">${danadas.map(p => `<li>${thumb(p)}<div><b>${esc(p.nombre)}</b><span>${esc(p.notas || 'Sin notas')}</span></div>
          <button class="btn btn-mini" data-act="estado-rapido" data-id="${p.id}" data-estado="disponible">Ya la arreglé</button></li>`).join('')}</ul>
      </section>` : ''}
      <section class="tarjeta">
        <header><h2>Las que más usas</h2></header>
        ${usadas.length ? `<ol class="ranking">${usadas.map(p => `<li>${thumb(p)}<span>${esc(p.nombre)}</span><b>${p.usos}</b></li>`).join('')}</ol>` : '<p class="vacio">Marca outfits como usados para ver estadísticas.</p>'}
      </section>
      <section class="tarjeta">
        <header><h2>Olvidadas</h2></header>
        ${olvidadas.length ? `<p class="nota">No las usas hace más de mes y medio. Dales una oportunidad o considera venderlas o regalarlas.</p><div class="fila-thumbs">${olvidadas.map(thumb).join('')}</div>`
          : '<p class="vacio">Estás rotando bien tu ropa.</p>'}
      </section>
      <section class="tarjeta">
        <header><h2>Colores de tu armario</h2></header>
        ${listaCol.length ? `<div class="barra-colores">${listaCol.map(c => `<span style="flex:${c.k};background:${c.c}" title="${c.n}: ${c.k}"></span>`).join('')}</div>
          <ul class="leyenda">${listaCol.slice(0, 8).map(c => `<li><span class="punto" style="background:${c.c}"></span>${c.n} <b>${c.k}</b></li>`).join('')}</ul>` : '<p class="vacio">Sin prendas todavía.</p>'}
      </section>
      ${conPrecio.length ? `<section class="tarjeta">
        <header><h2>Costo por uso</h2><span class="nota">Invertido: ${cop(invertido)}</span></header>
        <ul class="lista compacta">${conPrecio.slice(0, 6).map(({ p, c }) => `<li>${thumb(p)}<div><b>${esc(p.nombre)}</b><span>${cop(p.precio)} · ${p.usos} usos</span></div><b>${cop(Math.round(c))}</b></li>`).join('')}</ul>
      </section>` : ''}
      <section class="tarjeta historial">
        <header><h2>Lo que te pusiste</h2></header>
        ${hist.length ? `<ul class="lista-historial">${hist.map(h => `<li><span class="fecha">${new Date(h.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <div class="fila-thumbs">${(h.prenda_ids || []).map(prenda).filter(Boolean).map(thumb).join('')}</div></li>`).join('')}</ul>`
          : '<p class="vacio">Cuando uses “Usar hoy”, aquí queda tu historial.</p>'}
      </section>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  PERFIL
// ═══════════════════════════════════════════════════════════
function renderPerfil(v) {
  const p = S.perfil || {};
  v.innerHTML = `
  <div class="pagina perfil">
    <header class="pagina-cabeza"><div><h1>Tu perfil</h1><p>${esc(S.user.email)}</p></div></header>
    <div class="perfil-grid">
      <div class="perfil-preview">${maniquiHTML({}, { id: 'perfil-maniqui' })}<p class="ob-medida">${((p.altura || 170) / 100).toFixed(2)} m</p></div>
      <form class="form tarjeta" id="f-perfil">
        <div class="campos-2">
          <label class="campo"><span>Nombre</span><input name="nombre" value="${esc(p.nombre || '')}"></label>
          <label class="campo"><span>Altura (cm)</span><input name="altura" type="number" min="120" max="230" value="${p.altura || 170}"></label>
        </div>
        <div class="campos-2">
          <label class="campo"><span>Silueta</span><select name="silueta"><option value="masculina" ${p.silueta !== 'femenina' ? 'selected' : ''}>Masculina</option><option value="femenina" ${p.silueta === 'femenina' ? 'selected' : ''}>Femenina</option></select></label>
          <label class="campo"><span>Contextura</span><select name="contextura">${[['delgado', 'Delgada'], ['medio', 'Media'], ['atletico', 'Atlética'], ['robusto', 'Robusta']].map(([k, l]) => `<option value="${k}" ${p.contextura === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        </div>
        <fieldset class="campo"><legend>Tono de piel</legend>
          <div class="swatches">${TONOS_PIEL.map(t => `<label class="swatch ${p.piel === t ? 'activo' : ''}" style="--c:${t}"><input type="radio" name="piel" value="${t}" ${p.piel === t ? 'checked' : ''}><span class="sr">${t}</span></label>`).join('')}</div>
        </fieldset>
        <div class="campos-2">
          <label class="campo"><span>Subtono</span><select name="subtono">${[['frio', 'Frío'], ['calido', 'Cálido'], ['neutro', 'Neutro']].map(([k, l]) => `<option value="${k}" ${p.subtono === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="campo"><span>Ciudad</span><select name="ciudad">${Object.entries(CIUDADES).map(([k, c]) => `<option value="${k}" ${p.ciudad === k ? 'selected' : ''}>${c.nombre}</option>`).join('')}<option value="gps" ${p.ciudad === 'gps' ? 'selected' : ''}>Mi ubicación (GPS)</option></select></label>
        </div>
        <label class="interruptor"><input type="checkbox" name="lavanderia_auto" ${p.lavanderia_auto ? 'checked' : ''}><span class="pista"></span><span>Mandar al cesto la ropa que marco como usada</span></label>
        <p class="error" role="alert"></p>
        <div class="modal-pie"><button class="btn btn-primario">Guardar perfil</button></div>
      </form>
      <section class="tarjeta perfil-datos">
        <h2>Tus datos</h2>
        <p class="nota">${S.store.mode === 'local' ? 'Modo local: haz una copia antes de borrar el navegador o cambiar de celular.' : 'Tu armario está guardado en la nube.'}</p>
        <div class="botonera">
          <button class="btn" data-act="exportar">${I.descargar}<span>Descargar copia</span></button>
          <label class="btn">${I.subir}<span>Importar copia</span><input type="file" accept="application/json" class="sr" id="importar"></label>
          <button class="btn btn-fantasma peligro" data-act="borrar-todo">${I.basura}<span>Vaciar armario</span></button>
        </div>
        <button class="btn btn-bloque" data-act="salir">${I.salir}<span>Cerrar sesión</span></button>
      </section>
    </div>
  </div>`;
  const form = $('#f-perfil');
  form.addEventListener('input', () => {
    const f = new FormData(form);
    const tmp = { ...p, silueta: f.get('silueta'), contextura: f.get('contextura'), piel: f.get('piel') || p.piel };
    $$('.swatch', form).forEach(el => el.classList.toggle('activo', !!el.querySelector('input:checked')));
    $('#perfil-maniqui').outerHTML = maniquiHTML({}, { id: 'perfil-maniqui', perfil: tmp });
    $('.perfil-preview .ob-medida').textContent = ((+f.get('altura') || 170) / 100).toFixed(2) + ' m';
  });
  form.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(form);
    const datos = { nombre: (f.get('nombre') || '').trim(), altura: +f.get('altura'), silueta: f.get('silueta'), contextura: f.get('contextura'),
      piel: f.get('piel') || p.piel, subtono: f.get('subtono'), ciudad: f.get('ciudad'), lavanderia_auto: !!f.get('lavanderia_auto') };
    if (!datos.nombre) return (form.querySelector('.error').textContent = 'El nombre no puede quedar vacío.');
    if (datos.ciudad === 'gps') {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
        datos.lat = +pos.coords.latitude.toFixed(3); datos.lon = +pos.coords.longitude.toFixed(3);
      } catch { form.querySelector('.error').textContent = 'No pudimos leer tu ubicación. Elige una ciudad de la lista.'; return; }
    }
    S.perfil = await S.store.savePerfil({ ...p, ...datos });
    $('.avatar').textContent = iniciales(S.perfil.nombre); $('.avatar').style.setProperty('--piel', S.perfil.piel);
    await actualizarClima(true);
    toast('Perfil guardado.');
  };
  $('#importar').onchange = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (!Array.isArray(json.prendas)) throw new Error();
      if (!(await confirmar('Importar copia', `Se agregarán ${json.prendas.length} prendas a tu armario.`, { si: 'Importar' }))) return;
      await S.store.importar(json); await cargarDatos(); renderVista(); toast('Copia importada.');
    } catch { toast('Ese archivo no es una copia válida de Percha.'); }
  };
}

// ═══════════════════════════════════════════════════════════
//  NAVEGACIÓN Y ACCIONES
// ═══════════════════════════════════════════════════════════
function ir(vista) {
  S.vista = vista; if (vista === 'armario') S.panelMovil = S.panelMovil || 'armario';
  renderVista(); window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
}

const acciones = {
  'auth-modo': b => renderAuth(b.dataset.modo),
  'ver-pass': b => { const i = b.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; b.setAttribute('aria-label', i.type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'); },
  demo: () => entrarDemo(),
  google: async () => { try { await S.store.signInGoogle(); } catch (e) { toast(e.message); } },
  olvide: async () => {
    const email = $('#form-auth [name=email]').value.trim();
    if (!email) return ($('#auth-error').textContent = 'Escribe tu correo y vuelve a tocar “¿Olvidaste tu contraseña?”.');
    try { await S.store.resetPassword(email); toast('Te enviamos un enlace para cambiar la contraseña.'); } catch (e) { $('#auth-error').textContent = e.message; }
  },
  'ob-paso': b => renderOnboarding(+b.dataset.paso),

  ir: (b, e) => { e.preventDefault(); ir(b.dataset.vista); },
  movil: b => { S.vista = 'armario'; S.panelMovil = b.dataset.panel; renderVista(); window.scrollTo({ top: 0 }); },
  puertas: () => {
    S.puertas = !S.puertas; $('#mueble').classList.toggle('abierto', S.puertas); actualizarPuertasAria();
  },
  'abrir-comp': b => {
    S.comp = b.dataset.comp; S.filtro = 'todas'; renderInterior(true);
    const r = $('#mueble')?.getBoundingClientRect();
    if (r && r.top < 0) window.scrollBy({ top: r.top - 70, behavior: reduceMotion() ? 'auto' : 'smooth' });
  },
  'cerrar-comp': () => { S.comp = null; renderInterior(true); },
  filtro: b => { S.filtro = b.dataset.filtro; renderInterior(); },
  probar: b => probar(b.dataset.id, b),
  ficha: b => abrirFicha(b.dataset.id),
  ajustar: b => abrirEditor(prenda(b.dataset.id), null, { ajustar: true }),
  rotar: b => rotar(b.dataset.zona, +b.dataset.dir),
  'quitar-zona': b => { delete S.outfit[b.dataset.zona]; S.razones = null; refrescarArmario(); },
  limpiar: () => { const prev = { ...S.outfit }; S.outfit = {}; S.razones = null; refrescarArmario(); toast('Maniquí vacío.', { accion: 'Deshacer', onAccion: () => { S.outfit = prev; refrescarArmario(); } }); },
  recomendar: () => { const prev = hacerRecomendacion(); if (prev && Object.keys(prev).length) toast('Outfit recomendado.', { accion: 'Deshacer', onAccion: () => { S.outfit = prev; S.razones = null; refrescarArmario(); } }); },
  aleatorio: () => aleatorio(),
  'guardar-outfit': b => b.getAttribute('aria-disabled') === 'true' ? toast('Viste el maniquí primero.') : guardarOutfit(),
  'usar-hoy': b => b.getAttribute('aria-disabled') === 'true' ? toast('Viste el maniquí primero.') : usarHoy(),
  'nueva-prenda': b => abrirEditor(null, b.dataset.comp),

  'filtro-ocasion': b => { filtroOcasion = b.dataset.o; renderVista(); },
  'cargar-outfit': b => {
    const o = S.outfits.find(x => x.id === b.dataset.id);
    S.outfit = Object.fromEntries(Object.entries(o.items || {}).filter(([, id]) => prenda(id)?.estado === 'disponible'));
    S.ocasion = o.ocasion || S.ocasion; S.razones = null; S.vista = 'armario'; S.panelMovil = 'probador';
    guardarProbador(); renderVista();
    const faltan = Object.keys(o.items || {}).length - Object.keys(S.outfit).length;
    if (faltan) toast(`${faltan} ${faltan === 1 ? 'prenda no está disponible' : 'prendas no están disponibles'} y no se puso en el maniquí.`);
  },
  'usar-outfit': b => {
    if (b.getAttribute('aria-disabled') === 'true') return toast('Una prenda de este outfit no está disponible.');
    const o = S.outfits.find(x => x.id === b.dataset.id); usarHoy(o.items, o.id);
  },
  'borrar-outfit': async b => {
    const o = S.outfits.find(x => x.id === b.dataset.id);
    if (!(await confirmar('Eliminar outfit', `¿Eliminar "${o.nombre}"? Las prendas siguen en tu armario.`, { si: 'Eliminar', peligro: true }))) return;
    await S.store.deleteOutfit(o.id); S.outfits = S.outfits.filter(x => x.id !== o.id); renderVista(); toast('Outfit eliminado.');
  },

  'lavar-todo': async () => { const ids = S.prendas.filter(p => p.estado === 'sucia').map(p => p.id); await cambiarEstado(ids, 'disponible'); toast(`${ids.length} prendas de vuelta al armario.`); },
  'estado-rapido': async b => { await cambiarEstado([b.dataset.id], b.dataset.estado); toast('Listo, de vuelta al armario.'); },

  ciudad: () => {
    const p = S.perfil || {};
    const m = abrirModal(`
      <div class="modal-cuerpo">
        <h2>Clima de hoy</h2>
        ${S.clima ? `<div class="clima-grande"><span>${S.clima.icono}</span><div><b>${S.clima.temp}°</b><p>${esc(S.clima.texto)} en ${esc(S.clima.ciudad)}${S.clima.aprox ? ' (aproximado, sin conexión)' : ''}</p>
          <p class="nota">Máx ${S.clima.max}° · mín ${S.clima.min}° · lluvia ${S.clima.lluvia}% · sensación ${S.clima.sensacion}°</p></div></div>` : ''}
        <div class="lista-ciudades">${Object.entries(CIUDADES).map(([k, c]) => `<button class="chip ${p.ciudad === k ? 'activo' : ''}" data-c="${k}">${c.nombre}</button>`).join('')}
          <button class="chip ${p.ciudad === 'gps' ? 'activo' : ''}" data-c="gps">${I.ubicacion} Mi ubicación</button></div>
        <p class="nota">Datos del clima: Open-Meteo.com</p>
        <div class="modal-pie"><button class="btn" data-cerrar-modal>Cerrar</button></div>
      </div>`, { clase: 'modal-chico' });
    m.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => {
      const datos = { ciudad: b.dataset.c };
      if (datos.ciudad === 'gps') {
        try { const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })); datos.lat = +pos.coords.latitude.toFixed(3); datos.lon = +pos.coords.longitude.toFixed(3); }
        catch { return toast('No pudimos leer tu ubicación. Elige una ciudad.'); }
      }
      S.perfil = await S.store.savePerfil({ ...p, ...datos });
      cerrarModal(); await actualizarClima(true); toast(`Clima de ${S.clima.ciudad}: ${S.clima.temp}°`);
    });
  },
  'cerrar-banner': () => { localStorage.setItem('percha_banner_off', '1'); $('.banner-local')?.remove(); },
  'como-supabase': () => abrirModal(`
    <div class="modal-cuerpo">
      <h2>Pasar tu armario a la nube</h2>
      <ol class="pasos">
        <li>Crea un proyecto gratis en <b>supabase.com</b>.</li>
        <li>En <b>SQL Editor</b>, pega y ejecuta el archivo <code>supabase/schema.sql</code>.</li>
        <li>En <b>Project Settings → API</b> copia la URL y la <i>anon key</i>.</li>
        <li>Pégalas en <code>js/config.js</code> y vuelve a cargar la página.</li>
        <li>Crea tu cuenta y usa <b>Perfil → Importar copia</b> con el archivo que descargas aquí abajo.</li>
      </ol>
      <div class="modal-pie"><button class="btn" data-act="exportar">${I.descargar}<span>Descargar copia</span></button><button class="btn btn-primario" data-cerrar-modal>Entendido</button></div>
    </div>`, { clase: 'modal-chico' }),
  exportar: async () => {
    const json = await S.store.exportar();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `percha-copia-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Copia descargada.');
  },
  'borrar-todo': async () => {
    if (!(await confirmar('Vaciar armario', 'Se eliminan todas tus prendas, outfits e historial. Tu perfil se conserva.', { si: 'Vaciar todo', peligro: true }))) return;
    await S.store.borrarTodo(); S.outfit = {}; guardarProbador(); await cargarDatos(); renderVista(); toast('Armario vacío.');
  },
  salir: async () => { await S.store.signOut(); Object.assign(S, { user: null, perfil: null, prendas: [], outfits: [], historial: [], outfit: {}, vista: 'armario', comp: null, puertas: false, clima: null }); renderAuth(); },
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.closest('[aria-disabled="true"]:not([data-act="guardar-outfit"]):not([data-act="usar-hoy"]):not([data-act="usar-outfit"])')) return;
  const fn = acciones[b.dataset.act];
  if (fn) { if (b.tagName === 'A') e.preventDefault(); fn(b, e); }
});
document.addEventListener('change', e => {
  if (e.target.matches('[data-act-change="ocasion"]')) { S.ocasion = e.target.value; S.razones = null; guardarProbador(); }
});
matchMedia('(max-width: 899px)').addEventListener?.('change', () => { if (S.user && S.perfil?.completo) renderVista(); });

iniciarFormas();
boot().catch(err => {
  console.error(err);
  app().innerHTML = `<div class="error-fatal"><h1>Algo salió mal al abrir Percha</h1><p>${esc(err.message)}</p><button class="btn btn-primario" onclick="location.reload()">Volver a intentar</button></div>`;
});
