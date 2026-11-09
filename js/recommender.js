// Recomendador de outfits por reglas: clima, ocasión, armonía de color,
// subtono de piel y rotación (no repetir lo de ayer).
// Funciona sin IA y sin internet. Devuelve el outfit + las razones.
import { TIPOS, OCASIONES, hexToHsl, esNeutro, nombreColor } from './garments.js';

const DIA = 864e5;
const rand = a => a[Math.floor(Math.random() * a.length)];
const difHue = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

function puntajeClima(p, banda) {
  if (!p.clima || p.clima === 'todo' || p.clima === banda) return 2;
  if (banda === 'templado' || p.clima === 'templado') return 0;
  return -5; // calor vs frío
}

function puntajeFormal(p, ocasion) {
  const [a, b] = OCASIONES[ocasion]?.formal || [1, 2];
  const f = p.formalidad || 1;
  if (f >= a && f <= b) return 2;
  return -2.5 * Math.min(Math.abs(f - a), Math.abs(f - b));
}

function puntajeRotacion(p) {
  if (!p.ultimo_uso) return 0.6;
  const dias = (Date.now() - new Date(p.ultimo_uso).getTime()) / DIA;
  if (dias < 2) return -3;
  if (dias < 5) return -1;
  return 0.3;
}

export function armoniaColores(colores) {
  const fuertes = colores.filter(c => !esNeutro(c));
  if (fuertes.length <= 1) return { pts: 3, tipo: fuertes.length ? 'acento' : 'neutros' };
  if (fuertes.length === 2) {
    const [h1] = hexToHsl(fuertes[0]), [h2] = hexToHsl(fuertes[1]);
    const d = difHue(h1, h2);
    if (d < 30) return { pts: 2, tipo: 'analogos' };
    if (d > 150) return { pts: 1.5, tipo: 'complementarios' };
    return { pts: -2.5, tipo: 'choque' };
  }
  return { pts: -4, tipo: 'muchos' };
}

function puntajeSubtono(hex, subtono) {
  if (!subtono || subtono === 'neutro') return 0.4;
  if (esNeutro(hex)) {
    const [h, s, l] = hexToHsl(hex);
    if (subtono === 'calido' && h >= 25 && h <= 50 && l > 0.5) return 1.2; // beige
    return 0.5;
  }
  const [h] = hexToHsl(hex);
  const calido = (h >= 0 && h <= 100) || h >= 340;     // rojos cálidos, naranjas, mostaza, oliva
  if (subtono === 'calido') return calido ? 1.5 : -0.8;
  return calido ? -0.8 : 1.5;                           // frío: azules, verdes fríos, morados
}

const TIPS_CONTEXTURA = {
  delgado: 'Para tu contextura, las capas (camiseta + chaqueta) suman volumen y se ven mejor.',
  medio: 'Tu contextura te deja jugar con casi cualquier corte; cuida que el largo de la camiseta no pase de la cadera.',
  atletico: 'Con contextura atlética, las camisetas de tu talla exacta marcan hombros; evita lo muy ancho arriba.',
  robusto: 'Un tono oscuro arriba y prendas con caída recta estilizan la figura.',
};

/**
 * @param {object} p  { prendas, perfil, clima, ocasion, fijas }  fijas = {zona:id} que el usuario no quiere cambiar
 */
export function recomendar({ prendas, perfil = {}, clima, ocasion = 'universidad', fijas = {} }) {
  const banda = clima?.banda || 'templado';
  const lluvia = (clima?.lluvia ?? 0) >= 55;
  const disp = prendas.filter(p => p.estado === 'disponible');
  const porZona = z => disp.filter(p => TIPOS[p.tipo]?.zona === z);

  const base = p => puntajeClima(p, banda) + puntajeFormal(p, ocasion) + puntajeRotacion(p);
  const candidatos = z => {
    const l = porZona(z).map(p => ({ p, s: base(p) })).sort((a, b) => b.s - a.s);
    return l.filter(x => x.s > -3).slice(0, 8).map(x => x.p);
  };

  const C = {
    torso: candidatos('torso'), capa: candidatos('capa'), piernas: candidatos('piernas'),
    pies: candidatos('pies'), cabeza: candidatos('cabeza'),
  };
  const filtrar = (z, fn) => { const l = C[z].filter(fn); if (l.length) C[z] = l; };
  if (ocasion === 'deporte') { filtrar('piernas', p => ['jogger', 'short'].includes(p.tipo)); filtrar('pies', p => p.tipo === 'tenis'); }
  if (ocasion === 'formal') { C.cabeza = []; filtrar('pies', p => p.tipo !== 'tenis'); filtrar('piernas', p => p.tipo !== 'short' && p.tipo !== 'jogger'); }
  if (banda !== 'calor' && ocasion !== 'deporte') filtrar('piernas', p => p.tipo !== 'short');

  const quiereCapa = banda === 'frio' || lluvia || (ocasion === 'formal' && banda !== 'calor');
  const puedeCapa = banda !== 'calor' || ocasion === 'formal';

  if (!C.torso.length && !C.capa.length) return { outfit: {}, razones: ['No tienes prendas de arriba disponibles. Revisa el cesto de ropa sucia.'], vacio: true };

  let mejor = null;
  for (let i = 0; i < 350; i++) {
    const o = {};
    for (const [z, id] of Object.entries(fijas)) if (id) o[z] = prendas.find(p => p.id === id);
    if (!o.torso && C.torso.length) o.torso = rand(C.torso);
    if (!o.piernas && C.piernas.length) o.piernas = rand(C.piernas);
    if (!o.pies && C.pies.length) o.pies = rand(C.pies);
    if (!o.capa && puedeCapa && C.capa.length && (quiereCapa || Math.random() < 0.35)) o.capa = rand(C.capa);
    if (!o.cabeza && C.cabeza.length && Math.random() < (banda === 'calor' ? 0.6 : 0.4)) o.cabeza = rand(C.cabeza);

    const piezas = Object.values(o).filter(Boolean);
    let s = piezas.reduce((t, p) => t + base(p), 0);
    if (quiereCapa && !o.capa) s -= 4;
    if (lluvia && o.capa?.tipo === 'chaqueta') s += 1.5;
    if (lluvia && o.pies?.tipo === 'botas') s += 1;

    const arriba = o.capa || o.torso;
    const visibles = [arriba, o.capa ? o.torso : null, o.piernas, o.pies, o.cabeza].filter(Boolean).map(p => p.color);
    const arm = armoniaColores(visibles);
    s += arm.pts * 1.6;

    if (arriba && o.piernas) {
      const dl = Math.abs(hexToHsl(arriba.color)[2] - hexToHsl(o.piernas.color)[2]);
      s += dl > 0.18 ? 1 : -0.5;
      if (perfil.contextura === 'robusto' && hexToHsl(arriba.color)[2] < 0.35) s += 0.8;
    }
    if (arriba) s += puntajeSubtono(arriba.color, perfil.subtono);
    if (o.cabeza && o.pies && !esNeutro(o.cabeza.color) && difHue(hexToHsl(o.cabeza.color)[0], hexToHsl(o.pies.color)[0]) < 25) s += 1; // gorra combina con tenis

    s += Math.random() * 1.2;
    if (!mejor || s > mejor.s) mejor = { o, s, arm };
  }

  // Accesorio extra: reloj si está disponible y la ocasión no es deporte
  const reloj = porZona('muneca')[0];
  if (reloj && ocasion !== 'deporte' && !fijas.muneca) mejor.o.muneca = reloj;
  const gafas = porZona('cara')[0];
  if (gafas && banda === 'calor' && clima?.icono === '☀️' && !fijas.cara) mejor.o.cara = gafas;

  const outfit = {};
  for (const [z, p] of Object.entries(mejor.o)) if (p) outfit[z] = p.id;

  // Razones legibles
  const razones = [];
  const t = clima ? `${clima.temp}° en ${clima.ciudad}` : 'Clima templado';
  if (banda === 'calor') razones.push(`🌡️ ${t}: prendas frescas${mejor.o.capa ? '' : ', sin buzo ni chaqueta'}.`);
  else if (banda === 'frio') razones.push(`🧥 ${t}: va con capa encima para el frío.`);
  else razones.push(`🌤️ ${t}: clima templado, ${mejor.o.capa ? 'una capa liviana encima' : 'sin necesidad de abrigo'}.`);
  if (lluvia) razones.push(`☔ ${clima.lluvia}% de probabilidad de lluvia${mejor.o.capa?.tipo === 'chaqueta' ? ': por eso la chaqueta' : ': lleva algo para cubrirte'}.`);

  const arriba = mejor.o.capa || mejor.o.torso;
  const mapa = {
    neutros: 'Todo en tonos neutros: combinación segura que nunca falla.',
    acento: `Base neutra con un solo color protagonista${(() => { const f = Object.values(mejor.o).filter(Boolean).find(p => !esNeutro(p.color)); return f ? ` (el ${nombreColor(f.color)} de ${f.nombre.toLowerCase()})` : ''; })()}.`,
    analogos: 'Colores vecinos en la rueda de color: se ven armónicos.',
    complementarios: 'Colores opuestos en la rueda: contraste fuerte pero equilibrado.',
    choque: 'Ojo: hay dos colores que chocan un poco. Prueba cambiando una prenda.',
    muchos: 'Muchos colores juntos. Puedes cambiar alguna prenda por una neutra.',
  };
  razones.push('🎨 ' + mapa[mejor.arm.tipo]);
  if (arriba && perfil.subtono && perfil.subtono !== 'neutro' && puntajeSubtono(arriba.color, perfil.subtono) > 1) {
    razones.push(`✨ El ${nombreColor(arriba.color)} cerca de la cara favorece tu subtono ${perfil.subtono === 'calido' ? 'cálido' : 'frío'}.`);
  }
  const frescas = Object.values(mejor.o).filter(p => p && (!p.ultimo_uso || (Date.now() - new Date(p.ultimo_uso)) / DIA > 5));
  if (frescas.length >= 3) razones.push('🔄 Prendas que no usas hace días: tu armario rota.');
  razones.push(`📌 Ocasión: ${OCASIONES[ocasion]?.label || ocasion}.`);
  if (perfil.contextura && TIPS_CONTEXTURA[perfil.contextura]) razones.push('💡 ' + TIPS_CONTEXTURA[perfil.contextura]);

  return { outfit, razones, puntaje: mejor.s };
}

// Evalúa un outfit armado a mano (para darle feedback al usuario)
export function evaluarOutfit(outfit, prendas) {
  const get = z => prendas.find(p => p.id === outfit[z]);
  const arriba = get('capa') || get('torso');
  const visibles = [arriba, get('capa') ? get('torso') : null, get('piernas'), get('pies'), get('cabeza')].filter(Boolean).map(p => p.color);
  if (visibles.length < 2) return null;
  return armoniaColores(visibles);
}
