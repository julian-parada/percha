# Percha · tu armario virtual

Subes tu ropa, marcas cuál está sucia, prestada o dañada y armas el outfit en un maniquí con tus proporciones. La app te recomienda qué ponerte según el clima de tu ciudad, la ocasión y tu subtono de piel.

Hecho con **HTML + CSS + JavaScript puro** (sin build) y **Supabase** para login, base de datos y fotos.

---

## Qué tiene

| Módulo | Qué hace |
|---|---|
| **Login** | Registro, entrada, recuperar contraseña y Google opcional (Supabase Auth). Sin Supabase funciona en *modo local*. |
| **Onboarding** | 3 pasos: silueta, altura y contextura → tono y subtono (mini test de venas y joyas) → ciudad, estilo y lavandería automática. |
| **Armario animado** | Mueble con puertas que se abren en 3D. Compartimentos por categoría: gorras en repisa, camisetas y buzos colgados en riel, pantalones doblados, zapatera y cajón de accesorios. |
| **Compartimento abierto** | Al abrir uno, las prendas salen ordenadas con filtros por estado (disponibles, sucias, prestadas y dañadas). |
| **Probador** | Maniquí con zonas fijas (cabeza, arriba, encima, abajo, pies, gafas, cadena y reloj). Cada prenda **vuela** a su lugar. Flechas para rotar prendas por zona. |
| **Recomendador** | Usa clima (Open-Meteo), ocasión, armonía de color, subtono y rotación para no repetir lo de ayer. Explica **por qué** eligió cada outfit. |
| **Estados** | Disponible / sucia / prestada (a quién y desde cuándo) / dañada. Las prendas no disponibles no se pueden poner. |
| **Usar hoy** | Registra el historial, suma usos y, si quieres, manda la ropa al cesto de sucias. |
| **Outfits guardados** | Con mini maniquí, ocasión y veces usado. Avisa si una prenda del outfit está sucia. |
| **Resumen** | Cesto de ropa sucia ("Lavé todo"), préstamos con alerta, dañadas, más usadas, olvidadas, colores del armario, costo por uso e historial. |
| **Subir prenda** | Foto desde el celular → quita el fondo en el navegador → recorta → detecta el color y sugiere el nombre. También puedes usar un dibujo sin foto. Tiene ajuste fino de posición y tamaño en el maniquí. |
| **Copia de seguridad** | Exportar e importar en JSON (sirve para pasar del modo local a Supabase). |
| **PWA** | Se puede instalar en el celular ("Agregar a pantalla de inicio"). |

---

## Correrlo en tu PC (2 minutos)

Los módulos JS necesitan un servidor; abrir el `index.html` con doble clic no funciona.

```bash
cd percha
npx serve .          # o:  python -m http.server 8000
```

Abre `http://localhost:3000` (o `:8000`) y toca **"Probar con un armario de ejemplo"**.

> Con Live Server de VS Code también funciona.

---

## Conectar Supabase (para cuentas reales)

1. Crea un proyecto en [supabase.com](https://supabase.com) (gratis).
2. **SQL Editor** → pega todo `supabase/schema.sql` → **Run**.
   Crea las tablas `perfiles`, `prendas`, `outfits` e `historial_uso`, la seguridad RLS (cada usuario ve solo lo suyo), el bucket `prendas` para las fotos y el trigger que crea el perfil al registrarse.
3. **Project Settings → API** → copia `Project URL` y `anon public key`.
4. Pégalas en `js/config.js`:
   ```js
   SUPABASE_URL: 'https://xxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   ```
5. **Authentication → URL Configuration** → agrega la URL donde publiques la app (para los correos de confirmación y de recuperar contraseña).
6. Opcional: **Authentication → Providers → Google** y pon `GOOGLE_AUTH: true` en `config.js`.

La anon key es pública por diseño. La seguridad la dan las políticas RLS del `schema.sql`.

---

## Publicarlo

Es un sitio estático: súbelo tal cual a **Netlify**, **Vercel**, **Cloudflare Pages** o **GitHub Pages**. No necesita build.

---

## Estructura

```
percha/
├── index.html
├── manifest.webmanifest
├── assets/icon.svg
├── css/styles.css          ← identidad visual (laca verde, latón, madera)
├── js/
│   ├── config.js           ← llaves de Supabase
│   ├── app.js              ← pantallas, probador, acciones
│   ├── store.js            ← datos: LocalStore y SupabaseStore (misma interfaz)
│   ├── garments.js         ← tipos, zonas del maniquí, colores y dibujos SVG
│   ├── recommender.js      ← motor de recomendación por reglas
│   ├── weather.js          ← clima (Open-Meteo)
│   ├── images.js           ← quitar fondo, recortar y comprimir
│   └── ui.js               ← íconos, modales y toasts
└── supabase/schema.sql
```

### Cómo encaja una prenda en el maniquí
Cada `tipo` tiene una `zona` (`garments.js → TIPOS`). Cada zona es una caja en el sistema del maniquí (`ZONAS`, viewBox 300×600) con su `z-index`: el buzo (capa 30) va encima de la camiseta (20). La foto sin fondo se recorta a su contenido y se ajusta a la caja con `object-fit: contain`. El ajuste manual se guarda en `prendas.ajuste`.

### Agregar un tipo de prenda nuevo
1. Agrégalo en `TIPOS` con su `zona` y `comp`.
2. (Opcional) Agrega su dibujo en `dibujo()` dentro de `garments.js`.

---

## ⚠️ Antes de venderlo

- **Clima:** la API gratis de Open-Meteo es **solo para uso no comercial**. Si cobras, compra su plan comercial o cambia de proveedor. Solo tienes que editar `js/weather.js`.
- **Quitar fondo:** `@imgly/background-removal` tiene licencia **AGPL**. Para un producto cerrado y de pago, compra la licencia comercial de IMG.LY o cambia a una API como remove.bg o Photoroom (solo cambia `quitarFondo()` en `js/images.js`).
- **Fotos:** el bucket es público para simplificar (solo con el enlace exacto se ven). Si quieres más privacidad, ponlo privado y usa `createSignedUrl`.

## Ideas para la versión 2
- Consejo con IA (Gemini o Claude) mediante una Edge Function de Supabase que reciba el outfit, el perfil y el clima.
- Calendario de outfits de la semana.
- Modo maleta para viajes (por ejemplo, Ocaña → Cúcuta).
- Preguntarle a tu asistente por Telegram "¿qué me pongo hoy?".
- Probador virtual con foto real (IDM-VTON).
