-- ════════════════════════════════════════════════════════════
--  PERCHA · esquema de base de datos para Supabase
--  Pégalo completo en Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════

-- ─── Perfiles (1 por usuario) ───────────────────────────────
create table if not exists public.perfiles (
  id              uuid primary key references auth.users on delete cascade,
  nombre          text,
  silueta         text default 'masculina' check (silueta in ('masculina','femenina')),
  altura          smallint check (altura between 100 and 250),
  contextura      text default 'medio' check (contextura in ('delgado','medio','atletico','robusto')),
  piel            text,
  subtono         text default 'neutro' check (subtono in ('frio','calido','neutro')),
  estilo          text[] default '{}',
  ciudad          text default 'ocana',
  lat             numeric,
  lon             numeric,
  lavanderia_auto boolean default true,
  completo        boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Foto del cuerpo como maniquí (si la tabla ya existía, estas líneas agregan las columnas)
alter table public.perfiles add column if not exists foto_url text;
alter table public.perfiles add column if not exists foto_cal jsonb;

-- Crea el perfil automáticamente al registrarse
create or replace function public.crear_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists al_registrarse on auth.users;
create trigger al_registrarse after insert on auth.users
  for each row execute function public.crear_perfil();

-- ─── Prendas ────────────────────────────────────────────────
create table if not exists public.prendas (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users on delete cascade,
  nombre         text not null,
  tipo           text not null,
  color          text not null default '#777777',
  formalidad     smallint default 1 check (formalidad between 1 and 3),
  clima          text default 'todo' check (clima in ('calor','templado','frio','todo')),
  estado         text default 'disponible' check (estado in ('disponible','sucia','prestada','danada')),
  prestado_a     text,
  prestado_desde timestamptz,
  precio         numeric check (precio >= 0),
  notas          text default '',
  usos           integer default 0,
  ultimo_uso     timestamptz,
  imagen_url     text,
  imagen_ruta    text,
  ajuste         jsonb,
  medidas        jsonb,          -- { "largo": 70, "pecho": 55, "cintura": 40, "talla": "M" } en cm
  created_at     timestamptz default now()
);
-- Si la tabla ya existía:
alter table public.prendas add column if not exists medidas jsonb;
create index if not exists prendas_user_idx on public.prendas (user_id);

-- ─── Outfits guardados ──────────────────────────────────────
create table if not exists public.outfits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  nombre      text not null,
  ocasion     text,
  items       jsonb not null default '{}',   -- { "torso": "<id prenda>", "piernas": "<id>", ... }
  usos        integer default 0,
  ultimo_uso  timestamptz,
  created_at  timestamptz default now()
);
create index if not exists outfits_user_idx on public.outfits (user_id);

-- ─── Historial de uso ───────────────────────────────────────
create table if not exists public.historial_uso (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  fecha       timestamptz default now(),
  prenda_ids  uuid[] not null,
  outfit_id   uuid references public.outfits on delete set null
);
create index if not exists historial_user_idx on public.historial_uso (user_id, fecha desc);

-- ─── Seguridad: cada usuario solo ve lo suyo ────────────────
alter table public.perfiles      enable row level security;
alter table public.prendas       enable row level security;
alter table public.outfits       enable row level security;
alter table public.historial_uso enable row level security;

drop policy if exists "perfil propio" on public.perfiles;
create policy "perfil propio" on public.perfiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "prendas propias" on public.prendas;
create policy "prendas propias" on public.prendas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "outfits propios" on public.outfits;
create policy "outfits propios" on public.outfits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "historial propio" on public.historial_uso;
create policy "historial propio" on public.historial_uso for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Storage: fotos de prendas ──────────────────────────────
-- Cada usuario sube a su carpeta:  prendas/<user_id>/<archivo>.webp
insert into storage.buckets (id, name, public)
values ('prendas', 'prendas', true)
on conflict (id) do nothing;

drop policy if exists "ver fotos" on storage.objects;
create policy "ver fotos" on storage.objects for select
  using (bucket_id = 'prendas');

drop policy if exists "subir fotos propias" on storage.objects;
create policy "subir fotos propias" on storage.objects for insert to authenticated
  with check (bucket_id = 'prendas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "borrar fotos propias" on storage.objects;
create policy "borrar fotos propias" on storage.objects for delete to authenticated
  using (bucket_id = 'prendas' and (storage.foldername(name))[1] = auth.uid()::text);
