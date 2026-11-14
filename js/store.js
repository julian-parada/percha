// Capa de datos. Dos implementaciones con la MISMA interfaz:
//   LocalStore    → todo en localStorage (modo demo / sin internet)
//   SupabaseStore → Auth + Postgres + Storage de Supabase (producción)
import { CONFIG } from './config.js';

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2));
const ahora = () => new Date().toISOString();

async function hash(texto) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    let h = 0; for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) | 0; return 'h' + h;
  }
}

const ls = {
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); }
    catch (e) { throw new Error('El almacenamiento del navegador está lleno. Conecta Supabase para guardar más fotos.'); }
  },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const blobToDataUrl = blob => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob);
});

// ─────────────────────────────────────────────────────────────
class LocalStore {
  mode = 'local';
  _uid = null;

  get _k() { return 'percha_data_' + this._uid; }
  _data() { return ls.get(this._k, { perfil: null, prendas: [], outfits: [], historial: [] }); }
  _save(d) { ls.set(this._k, d); }

  async getSession() {
    const s = ls.get('percha_sesion', null);
    if (!s) return null;
    this._uid = s.id;
    return { user: s };
  }
  async signUp(email, pass, nombre) {
    email = email.trim().toLowerCase();
    const users = ls.get('percha_usuarios', {});
    if (users[email]) throw new Error('Ya existe una cuenta con ese correo. Entra con tu contraseña.');
    const u = { id: uid(), email, nombre, hash: await hash(email + '|' + pass) };
    users[email] = u; ls.set('percha_usuarios', users);
    const ses = { id: u.id, email };
    ls.set('percha_sesion', ses); this._uid = u.id;
    return { user: ses };
  }
  async signIn(email, pass) {
    email = email.trim().toLowerCase();
    const u = ls.get('percha_usuarios', {})[email];
    if (!u || u.hash !== await hash(email + '|' + pass)) throw new Error('Correo o contraseña incorrectos.');
    const ses = { id: u.id, email };
    ls.set('percha_sesion', ses); this._uid = u.id;
    return { user: ses };
  }
  async signInGoogle() { throw new Error('Google solo funciona con Supabase conectado.'); }
  async resetPassword() { throw new Error('En modo local no hay correos. Crea otra cuenta o conecta Supabase.'); }
  async signOut() { ls.del('percha_sesion'); this._uid = null; }

  async getPerfil() { return this._data().perfil; }
  async savePerfil(p) { const d = this._data(); d.perfil = { ...d.perfil, ...p }; this._save(d); return d.perfil; }
  async subirFoto(blob) { return blobToDataUrl(blob); }

  async listPrendas() { return this._data().prendas; }
  async savePrenda(p) {
    const d = this._data();
    const { _blob, ...datos } = p;
    if (_blob) datos.imagen_url = await blobToDataUrl(_blob);
    if (datos.id) {
      const i = d.prendas.findIndex(x => x.id === datos.id);
      d.prendas[i] = { ...d.prendas[i], ...datos };
      this._save(d); return d.prendas[i];
    }
    const nueva = { ...datos, id: uid(), created_at: ahora() };
    d.prendas.push(nueva); this._save(d); return nueva;
  }
  async savePrendasLote(lista) {
    const d = this._data();
    for (const p of lista) d.prendas.push({ ...p, id: uid(), created_at: ahora() });
    this._save(d); return d.prendas;
  }
  async updatePrendas(ids, patch) {
    const d = this._data();
    d.prendas = d.prendas.map(p => ids.includes(p.id) ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p);
    this._save(d); return d.prendas;
  }
  async deletePrenda(id) {
    const d = this._data();
    d.prendas = d.prendas.filter(p => p.id !== id); this._save(d);
  }

  async listOutfits() { return this._data().outfits; }
  async saveOutfit(o) {
    const d = this._data();
    if (o.id) { const i = d.outfits.findIndex(x => x.id === o.id); d.outfits[i] = { ...d.outfits[i], ...o }; this._save(d); return d.outfits[i]; }
    const n = { ...o, id: uid(), created_at: ahora(), usos: 0 }; d.outfits.unshift(n); this._save(d); return n;
  }
  async deleteOutfit(id) { const d = this._data(); d.outfits = d.outfits.filter(o => o.id !== id); this._save(d); }

  async listHistorial() { return this._data().historial; }
  async addHistorial(h) { const d = this._data(); const n = { ...h, id: uid(), fecha: ahora() }; d.historial.unshift(n); d.historial = d.historial.slice(0, 400); this._save(d); return n; }

  async exportar() { return this._data(); }
  async importar(json) { this._save({ perfil: null, prendas: [], outfits: [], historial: [], ...json }); }
  async borrarTodo() { this._save({ perfil: this._data().perfil, prendas: [], outfits: [], historial: [] }); }
}

// ─────────────────────────────────────────────────────────────
class SupabaseStore {
  mode = 'supabase';
  sb = null; _uid = null;

  async init() {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    this.sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    return this;
  }
  _err(error) { if (error) throw new Error(traducir(error.message)); }

  async getSession() {
    const { data } = await this.sb.auth.getSession();
    if (!data.session) return null;
    this._uid = data.session.user.id;
    return { user: { id: data.session.user.id, email: data.session.user.email } };
  }
  async signUp(email, pass, nombre) {
    const { data, error } = await this.sb.auth.signUp({ email, password: pass, options: { data: { nombre } } });
    this._err(error);
    if (!data.session) return { needsConfirm: true };
    this._uid = data.user.id;
    return { user: { id: data.user.id, email: data.user.email } };
  }
  async signIn(email, pass) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password: pass });
    this._err(error);
    this._uid = data.user.id;
    return { user: { id: data.user.id, email: data.user.email } };
  }
  async signInGoogle() {
    const { error } = await this.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.href.split('#')[0] } });
    this._err(error);
  }
  async resetPassword(email) {
    const { error } = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] });
    this._err(error);
  }
  async signOut() { await this.sb.auth.signOut(); this._uid = null; }

  async getPerfil() {
    const { data, error } = await this.sb.from('perfiles').select('*').eq('id', this._uid).maybeSingle();
    this._err(error); return data;
  }
  async savePerfil(p) {
    const { data, error } = await this.sb.from('perfiles').upsert({ ...p, id: this._uid }).select().single();
    this._err(error); return data;
  }

  async subirFoto(blob) { return (await this._subir(blob)).url; }
  async _subir(blob) {
    const ext = blob.type === 'image/png' ? 'png' : 'webp';
    const ruta = `${this._uid}/${uid()}.${ext}`;
    const { error } = await this.sb.storage.from(CONFIG.BUCKET).upload(ruta, blob, { contentType: blob.type, upsert: false });
    this._err(error);
    return { url: this.sb.storage.from(CONFIG.BUCKET).getPublicUrl(ruta).data.publicUrl, ruta };
  }
  async listPrendas() {
    const { data, error } = await this.sb.from('prendas').select('*').order('created_at');
    this._err(error); return data;
  }
  async savePrenda(p) {
    const { _blob, id, created_at, user_id, ...datos } = p;
    if (_blob) { const s = await this._subir(_blob); datos.imagen_url = s.url; datos.imagen_ruta = s.ruta; }
    const q = id
      ? this.sb.from('prendas').update(datos).eq('id', id).select().single()
      : this.sb.from('prendas').insert({ ...datos, user_id: this._uid }).select().single();
    const { data, error } = await q; this._err(error); return data;
  }
  async savePrendasLote(lista) {
    const { error } = await this.sb.from('prendas').insert(lista.map(p => ({ ...p, user_id: this._uid })));
    this._err(error); return this.listPrendas();
  }
  async updatePrendas(ids, patch) {
    if (typeof patch === 'function') {
      const actuales = (await this.listPrendas()).filter(p => ids.includes(p.id));
      await Promise.all(actuales.map(p => this.sb.from('prendas').update(patch(p)).eq('id', p.id)));
    } else {
      const { error } = await this.sb.from('prendas').update(patch).in('id', ids); this._err(error);
    }
    return this.listPrendas();
  }
  async deletePrenda(id) {
    const { data } = await this.sb.from('prendas').select('imagen_ruta').eq('id', id).maybeSingle();
    if (data?.imagen_ruta) await this.sb.storage.from(CONFIG.BUCKET).remove([data.imagen_ruta]);
    const { error } = await this.sb.from('prendas').delete().eq('id', id); this._err(error);
  }

  async listOutfits() {
    const { data, error } = await this.sb.from('outfits').select('*').order('created_at', { ascending: false });
    this._err(error); return data;
  }
  async saveOutfit(o) {
    const { id, created_at, user_id, ...datos } = o;
    const q = id
      ? this.sb.from('outfits').update(datos).eq('id', id).select().single()
      : this.sb.from('outfits').insert({ ...datos, user_id: this._uid }).select().single();
    const { data, error } = await q; this._err(error); return data;
  }
  async deleteOutfit(id) { const { error } = await this.sb.from('outfits').delete().eq('id', id); this._err(error); }

  async listHistorial() {
    const { data, error } = await this.sb.from('historial_uso').select('*').order('fecha', { ascending: false }).limit(400);
    this._err(error); return data;
  }
  async addHistorial(h) {
    const { data, error } = await this.sb.from('historial_uso').insert({ ...h, user_id: this._uid }).select().single();
    this._err(error); return data;
  }

  async exportar() {
    return { perfil: await this.getPerfil(), prendas: await this.listPrendas(), outfits: await this.listOutfits(), historial: await this.listHistorial() };
  }
  async importar(json) {
    if (json.perfil) { const { id, ...p } = json.perfil; await this.savePerfil(p); }
    const limpias = (json.prendas || []).map(({ id, user_id, created_at, ...p }) => p);
    if (limpias.length) await this.savePrendasLote(limpias);
  }
  async borrarTodo() {
    await this.sb.from('historial_uso').delete().eq('user_id', this._uid);
    await this.sb.from('outfits').delete().eq('user_id', this._uid);
    await this.sb.from('prendas').delete().eq('user_id', this._uid);
  }
}

function traducir(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered')) return 'Ya existe una cuenta con ese correo.';
  if (m.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.';
  return msg;
}

export async function crearStore() {
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
    try { return await new SupabaseStore().init(); }
    catch (e) { console.warn('No se pudo conectar Supabase, uso modo local', e); }
  }
  return new LocalStore();
}
