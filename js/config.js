// ─────────────────────────────────────────────────────────────
//  Configuración de Percha
//  Si dejas SUPABASE_URL vacío, la app funciona en "modo local":
//  las cuentas y la ropa se guardan en este navegador (ideal para
//  probar). Cuando pegues tus llaves de Supabase, todo pasa a la nube.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  APP_NAME: 'Percha',

  // Supabase → Project Settings → API
  SUPABASE_URL: 'https://fwjciqtavtectxicinkc.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_CMjrfIvY86Dl8pJ5V8xN1w_BO9dryoX',
  BUCKET: 'prendas',

  // Muestra el botón "Continuar con Google" (actívalo en Supabase → Auth → Providers)
  GOOGLE_AUTH: false,

  // Ciudad por defecto si el usuario no elige otra
  CIUDAD_DEFECTO: 'ocana',
};
