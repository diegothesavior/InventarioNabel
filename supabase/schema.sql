-- =====================================================================
--  Nabek Martins - Inventario del atelier
--  Esquema de base de datos (PostgreSQL / Supabase)
--
--  Como usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
--  Es seguro ejecutarlo mas de una vez.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ---------------------------------------------------------------------
-- 1. Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('administradora', 'equipo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type clase_material as enum ('tela', 'insumo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('entrada', 'salida', 'ajuste');
exception when duplicate_object then null; end $$;

do $$ begin
  create type etapa_prenda as enum ('patronaje', 'corte', 'confeccion', 'prueba', 'acabados');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_prenda as enum ('en_proceso', 'terminada', 'disponible', 'reservada', 'entregada');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Perfiles (cada miembro del equipo)
-- ---------------------------------------------------------------------
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null default '',
  email       text,
  rol         rol_usuario not null default 'equipo',
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

comment on table public.perfiles is 'Miembros del taller. El rol decide que puede ver y hacer cada una.';

-- Helpers de permisos. SECURITY DEFINER para que no dependan de las
-- politicas de la propia tabla perfiles (evita recursion infinita).
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'administradora' and activo
  );
$$;

create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles where id = auth.uid() and activo
  );
$$;

-- Al crearse un usuario nuevo en Supabase se crea su perfil automaticamente.
-- La PRIMERA persona que entra queda como administradora: asi no hace falta
-- tocar la base de datos a mano para arrancar.
create or replace function public.crear_perfil_para_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hay_alguien boolean;
  rol_inicial rol_usuario;
begin
  select exists (select 1 from public.perfiles) into hay_alguien;

  if not hay_alguien then
    rol_inicial := 'administradora';
  else
    rol_inicial := coalesce(
      (new.raw_user_meta_data ->> 'rol')::rol_usuario,
      'equipo'
    );
  end if;

  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    rol_inicial
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil_para_usuario();

-- ---------------------------------------------------------------------
-- 3. Proveedores
-- ---------------------------------------------------------------------
create table if not exists public.proveedores (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  contacto        text,
  telefono        text,
  email           text,
  suministra      text,
  dias_entrega    integer check (dias_entrega is null or dias_entrega >= 0),
  notas           text,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  creado_por      uuid references public.perfiles(id),
  actualizado_en  timestamptz not null default now()
);

create unique index if not exists proveedores_nombre_unico
  on public.proveedores (lower(nombre));

-- ---------------------------------------------------------------------
-- 4. Materiales (telas e insumos en una sola tabla)
--    En pantalla son dos modulos; por debajo comparten el motor de
--    stock, movimientos, alertas, importacion y exportacion.
-- ---------------------------------------------------------------------
create table if not exists public.materiales (
  id                uuid primary key default gen_random_uuid(),
  clase             clase_material not null,
  codigo            text not null,
  nombre            text not null,
  tipo              text,                 -- telas: seda, lino... / insumos: categoria
  unidad            text not null default 'unidad',
  proveedor_id      uuid references public.proveedores(id) on delete set null,
  costo_unitario    numeric(12,2) check (costo_unitario is null or costo_unitario >= 0),
  ubicacion         text,
  punto_reposicion  numeric(12,2) not null default 0 check (punto_reposicion >= 0),
  foto_url          text,
  notas             text,
  activo            boolean not null default true,

  -- especificos de telas
  composicion       text,
  color             text,
  ancho_cm          numeric(6,1) check (ancho_cm is null or ancho_cm > 0),

  creado_en         timestamptz not null default now(),
  creado_por        uuid references public.perfiles(id),
  actualizado_en    timestamptz not null default now()
);

create unique index if not exists materiales_codigo_unico
  on public.materiales (lower(codigo));
create index if not exists materiales_clase_idx on public.materiales (clase, activo);
create index if not exists materiales_proveedor_idx on public.materiales (proveedor_id);
create index if not exists materiales_busqueda_idx
  on public.materiales using gin (
    to_tsvector('simple',
      unaccent(coalesce(codigo,'') || ' ' || coalesce(nombre,'') || ' ' ||
               coalesce(tipo,'') || ' ' || coalesce(color,'') || ' ' ||
               coalesce(composicion,'') || ' ' || coalesce(ubicacion,''))
    )
  );

-- ---------------------------------------------------------------------
-- 5. Clientas y colecciones (el atelier trabaja de las dos formas)
-- ---------------------------------------------------------------------
create table if not exists public.clientas (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  telefono        text,
  email           text,
  notas           text,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  creado_por      uuid references public.perfiles(id),
  actualizado_en  timestamptz not null default now()
);

create table if not exists public.colecciones (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  temporada       text,
  anio            integer,
  notas           text,
  activo          boolean not null default true,
  creado_en       timestamptz not null default now(),
  creado_por      uuid references public.perfiles(id),
  actualizado_en  timestamptz not null default now()
);

create unique index if not exists colecciones_nombre_unico
  on public.colecciones (lower(nombre));

-- ---------------------------------------------------------------------
-- 6. Prendas
--    En proceso y terminadas son la MISMA fila: la prenda avanza de
--    estado y se lleva consigo su historial y su costo.
-- ---------------------------------------------------------------------
create table if not exists public.prendas (
  id                      uuid primary key default gen_random_uuid(),
  codigo                  text not null,
  nombre                  text not null,
  clienta_id              uuid references public.clientas(id) on delete set null,
  coleccion_id            uuid references public.colecciones(id) on delete set null,
  etapa                   etapa_prenda not null default 'patronaje',
  estado                  estado_prenda not null default 'en_proceso',
  responsable_id          uuid references public.perfiles(id) on delete set null,
  talla                   text,
  fecha_estimada_entrega  date,
  fecha_entrega_real      date,
  precio_venta            numeric(12,2) check (precio_venta is null or precio_venta >= 0),
  foto_url                text,
  notas                   text,
  creado_en               timestamptz not null default now(),
  creado_por              uuid references public.perfiles(id),
  actualizado_en          timestamptz not null default now(),

  constraint prendas_tiene_destino check (clienta_id is not null or coleccion_id is not null)
);

create unique index if not exists prendas_codigo_unico on public.prendas (lower(codigo));
create index if not exists prendas_estado_idx on public.prendas (estado, etapa);
create index if not exists prendas_entrega_idx on public.prendas (fecha_estimada_entrega);

-- ---------------------------------------------------------------------
-- 7. Movimientos
--    El stock NO se edita a mano: es la suma de los movimientos.
--    Un movimiento no se borra, se anula (queda el rastro).
-- ---------------------------------------------------------------------
create table if not exists public.movimientos (
  id              uuid primary key default gen_random_uuid(),
  material_id     uuid not null references public.materiales(id) on delete restrict,
  tipo            tipo_movimiento not null,
  cantidad        numeric(12,2) not null,
  -- costo congelado en el momento del movimiento: aunque despues suba el
  -- precio de la tela, el costo de la prenda sigue siendo el real.
  costo_unitario  numeric(12,2) check (costo_unitario is null or costo_unitario >= 0),
  prenda_id       uuid references public.prendas(id) on delete set null,
  motivo          text,
  fecha           timestamptz not null default now(),
  registrado_por  uuid references public.perfiles(id),
  anulado         boolean not null default false,
  anulado_en      timestamptz,
  anulado_por     uuid references public.perfiles(id),
  motivo_anulacion text,
  creado_en       timestamptz not null default now(),

  cantidad_efectiva numeric(12,2)
    generated always as (case when tipo = 'salida' then -cantidad else cantidad end) stored,

  constraint movimientos_cantidad_valida check (
    (tipo in ('entrada','salida') and cantidad > 0) or
    (tipo = 'ajuste' and cantidad <> 0)
  )
);

create index if not exists movimientos_material_idx on public.movimientos (material_id, fecha desc);
create index if not exists movimientos_prenda_idx on public.movimientos (prenda_id);
create index if not exists movimientos_fecha_idx on public.movimientos (fecha desc);

-- Al registrar un movimiento sin costo, se copia el costo actual del material.
create or replace function public.completar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.costo_unitario is null then
    select costo_unitario into new.costo_unitario
    from public.materiales where id = new.material_id;
  end if;

  if new.registrado_por is null then
    new.registrado_por := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists antes_de_insertar_movimiento on public.movimientos;
create trigger antes_de_insertar_movimiento
  before insert on public.movimientos
  for each row execute function public.completar_movimiento();

-- No se permite dejar el stock en negativo: avisa con un mensaje claro.
create or replace function public.validar_stock_no_negativo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  stock_resultante numeric;
  nombre_material text;
  unidad_material text;
begin
  if new.anulado then
    return new;
  end if;

  select coalesce(sum(cantidad_efectiva), 0) into stock_resultante
  from public.movimientos
  where material_id = new.material_id and not anulado and id <> new.id;

  stock_resultante := stock_resultante + new.cantidad_efectiva;

  if stock_resultante < 0 then
    select nombre, unidad into nombre_material, unidad_material
    from public.materiales where id = new.material_id;

    raise exception 'No hay suficiente stock de "%": la operacion lo dejaria en % %.',
      nombre_material, stock_resultante, unidad_material
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_stock on public.movimientos;
create trigger validar_stock
  after insert or update on public.movimientos
  for each row execute function public.validar_stock_no_negativo();

-- ---------------------------------------------------------------------
-- 8. Historial (quien cambio que y cuando)
--    Lo escribe la base de datos, no la aplicacion: no se puede olvidar.
-- ---------------------------------------------------------------------
create table if not exists public.historial (
  id            bigserial primary key,
  tabla         text not null,
  registro_id   text not null,
  accion        text not null check (accion in ('creado','actualizado','eliminado')),
  descripcion   text,
  datos_antes   jsonb,
  datos_despues jsonb,
  usuario_id    uuid references public.perfiles(id),
  ocurrido_en   timestamptz not null default now()
);

create index if not exists historial_tabla_idx on public.historial (tabla, ocurrido_en desc);
create index if not exists historial_registro_idx on public.historial (registro_id);
create index if not exists historial_fecha_idx on public.historial (ocurrido_en desc);

create or replace function public.registrar_en_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fila           jsonb;
  identificador  text;
  etiqueta       text;
  accion_texto   text;
begin
  if tg_op = 'DELETE' then
    fila := to_jsonb(old);
    accion_texto := 'eliminado';
  elsif tg_op = 'UPDATE' then
    fila := to_jsonb(new);
    accion_texto := 'actualizado';
  else
    fila := to_jsonb(new);
    accion_texto := 'creado';
  end if;

  identificador := coalesce(fila ->> 'id', '');
  etiqueta := coalesce(fila ->> 'nombre', fila ->> 'codigo', fila ->> 'motivo', identificador);

  -- No guardamos ruido: si un UPDATE no cambio nada real, se ignora.
  if tg_op = 'UPDATE' and to_jsonb(old) - 'actualizado_en' = to_jsonb(new) - 'actualizado_en' then
    return new;
  end if;

  insert into public.historial (tabla, registro_id, accion, descripcion, datos_antes, datos_despues, usuario_id)
  values (
    tg_table_name,
    identificador,
    accion_texto,
    etiqueta,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end,
    auth.uid()
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Mantiene actualizado_en al dia sin que nadie tenga que acordarse.
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['proveedores','materiales','clientas','colecciones','prendas','movimientos']
  loop
    execute format('drop trigger if exists historial_%1$s on public.%1$s', t);
    execute format(
      'create trigger historial_%1$s after insert or update or delete on public.%1$s
       for each row execute function public.registrar_en_historial()', t);

    if t <> 'movimientos' then
      execute format('drop trigger if exists tocar_%1$s on public.%1$s', t);
      execute format(
        'create trigger tocar_%1$s before update on public.%1$s
         for each row execute function public.tocar_actualizado_en()', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. Vistas
--    El stock se CALCULA, nunca se guarda. Y los costos solo se sirven
--    a la administradora: para el rol equipo llegan vacios desde la
--    propia base de datos, no solo ocultos en la pantalla.
-- ---------------------------------------------------------------------
create or replace view public.stock_actual
with (security_invoker = on) as
select
  m.id                                   as material_id,
  coalesce(sum(mv.cantidad_efectiva), 0) as stock,
  max(mv.fecha)                          as ultimo_movimiento
from public.materiales m
left join public.movimientos mv
  on mv.material_id = m.id and not mv.anulado
group by m.id;

create or replace view public.materiales_vista
with (security_invoker = on) as
select
  m.id,
  m.clase,
  m.codigo,
  m.nombre,
  m.tipo,
  m.unidad,
  m.proveedor_id,
  p.nombre as proveedor_nombre,
  case when public.es_admin() then m.costo_unitario end as costo_unitario,
  m.ubicacion,
  m.punto_reposicion,
  m.foto_url,
  m.notas,
  m.activo,
  m.composicion,
  m.color,
  m.ancho_cm,
  m.creado_en,
  m.actualizado_en,
  s.stock,
  s.ultimo_movimiento,
  (s.stock <= m.punto_reposicion) as bajo_minimo,
  case when public.es_admin() then m.costo_unitario * s.stock end as valor_inventario
from public.materiales m
left join public.stock_actual s on s.material_id = m.id
left join public.proveedores p on p.id = m.proveedor_id;

create or replace view public.movimientos_vista
with (security_invoker = on) as
select
  mv.id,
  mv.material_id,
  m.codigo   as material_codigo,
  m.nombre   as material_nombre,
  m.clase    as material_clase,
  m.unidad   as material_unidad,
  mv.tipo,
  mv.cantidad,
  mv.cantidad_efectiva,
  case when public.es_admin() then mv.costo_unitario end as costo_unitario,
  case when public.es_admin() then mv.costo_unitario * abs(mv.cantidad) end as costo_total,
  mv.prenda_id,
  pr.codigo  as prenda_codigo,
  pr.nombre  as prenda_nombre,
  mv.motivo,
  mv.fecha,
  mv.registrado_por,
  perf.nombre as registrado_por_nombre,
  mv.anulado,
  mv.anulado_en,
  mv.motivo_anulacion
from public.movimientos mv
join public.materiales m on m.id = mv.material_id
left join public.prendas pr on pr.id = mv.prenda_id
left join public.perfiles perf on perf.id = mv.registrado_por;

-- Costo de materiales y margen por prenda.
create or replace view public.prendas_vista
with (security_invoker = on) as
select
  pr.id,
  pr.codigo,
  pr.nombre,
  pr.clienta_id,
  c.nombre  as clienta_nombre,
  pr.coleccion_id,
  col.nombre as coleccion_nombre,
  pr.etapa,
  pr.estado,
  pr.responsable_id,
  perf.nombre as responsable_nombre,
  pr.talla,
  pr.fecha_estimada_entrega,
  pr.fecha_entrega_real,
  case when public.es_admin() then pr.precio_venta end as precio_venta,
  pr.foto_url,
  pr.notas,
  pr.creado_en,
  pr.actualizado_en,
  case when public.es_admin() then coalesce(costos.costo_materiales, 0) end as costo_materiales,
  case when public.es_admin() and pr.precio_venta is not null
       then pr.precio_venta - coalesce(costos.costo_materiales, 0) end as margen,
  case when public.es_admin() and pr.precio_venta is not null and pr.precio_venta > 0
       then round(((pr.precio_venta - coalesce(costos.costo_materiales, 0)) / pr.precio_venta) * 100, 1)
       end as margen_porcentaje,
  coalesce(costos.materiales_asignados, 0) as materiales_asignados
from public.prendas pr
left join public.clientas c on c.id = pr.clienta_id
left join public.colecciones col on col.id = pr.coleccion_id
left join public.perfiles perf on perf.id = pr.responsable_id
left join lateral (
  select
    sum(mv.cantidad * coalesce(mv.costo_unitario, 0)) as costo_materiales,
    count(*)                                          as materiales_asignados
  from public.movimientos mv
  where mv.prenda_id = pr.id and mv.tipo = 'salida' and not mv.anulado
) costos on true;

create or replace view public.historial_vista
with (security_invoker = on) as
select
  h.id,
  h.tabla,
  h.registro_id,
  h.accion,
  h.descripcion,
  h.usuario_id,
  perf.nombre as usuario_nombre,
  h.ocurrido_en
from public.historial h
left join public.perfiles perf on perf.id = h.usuario_id;

-- ---------------------------------------------------------------------
-- 10. Permisos (Row Level Security)
--     Regla general: todo el equipo ve el inventario y registra
--     movimientos; solo la administradora crea, edita y borra fichas,
--     y solo ella ve dinero.
-- ---------------------------------------------------------------------
alter table public.perfiles     enable row level security;
alter table public.proveedores  enable row level security;
alter table public.materiales   enable row level security;
alter table public.clientas     enable row level security;
alter table public.colecciones  enable row level security;
alter table public.prendas      enable row level security;
alter table public.movimientos  enable row level security;
alter table public.historial    enable row level security;

-- perfiles
drop policy if exists perfiles_lectura on public.perfiles;
create policy perfiles_lectura on public.perfiles
  for select to authenticated using (public.es_miembro());

drop policy if exists perfiles_actualiza_propio on public.perfiles;
create policy perfiles_actualiza_propio on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and rol = (select rol from public.perfiles where id = auth.uid()));

drop policy if exists perfiles_admin on public.perfiles;
create policy perfiles_admin on public.perfiles
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Catalogos: lee todo el equipo, escribe la administradora.
do $$
declare t text;
begin
  foreach t in array array['proveedores','materiales','clientas','colecciones']
  loop
    execute format('drop policy if exists %1$s_lectura on public.%1$s', t);
    execute format(
      'create policy %1$s_lectura on public.%1$s
       for select to authenticated using (public.es_miembro())', t);

    execute format('drop policy if exists %1$s_escritura_admin on public.%1$s', t);
    execute format(
      'create policy %1$s_escritura_admin on public.%1$s
       for all to authenticated using (public.es_admin()) with check (public.es_admin())', t);
  end loop;
end $$;

-- prendas: el equipo puede crear y actualizar (avanzar etapas), no borrar.
drop policy if exists prendas_lectura on public.prendas;
create policy prendas_lectura on public.prendas
  for select to authenticated using (public.es_miembro());

drop policy if exists prendas_insertar on public.prendas;
create policy prendas_insertar on public.prendas
  for insert to authenticated with check (public.es_miembro());

drop policy if exists prendas_actualizar on public.prendas;
create policy prendas_actualizar on public.prendas
  for update to authenticated using (public.es_miembro()) with check (public.es_miembro());

drop policy if exists prendas_borrar_admin on public.prendas;
create policy prendas_borrar_admin on public.prendas
  for delete to authenticated using (public.es_admin());

-- movimientos: el equipo registra; nadie borra; solo la administradora anula.
drop policy if exists movimientos_lectura on public.movimientos;
create policy movimientos_lectura on public.movimientos
  for select to authenticated using (public.es_miembro());

drop policy if exists movimientos_insertar on public.movimientos;
create policy movimientos_insertar on public.movimientos
  for insert to authenticated with check (public.es_miembro());

drop policy if exists movimientos_anular_admin on public.movimientos;
create policy movimientos_anular_admin on public.movimientos
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- historial: solo lo lee la administradora. Nadie lo escribe a mano.
drop policy if exists historial_lectura_admin on public.historial;
create policy historial_lectura_admin on public.historial
  for select to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------
-- 11. Fotos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists fotos_lectura_publica on storage.objects;
create policy fotos_lectura_publica on storage.objects
  for select using (bucket_id = 'fotos');

drop policy if exists fotos_subida_equipo on storage.objects;
create policy fotos_subida_equipo on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos' and public.es_miembro());

drop policy if exists fotos_actualizar_equipo on storage.objects;
create policy fotos_actualizar_equipo on storage.objects
  for update to authenticated using (bucket_id = 'fotos' and public.es_miembro());

drop policy if exists fotos_borrar_admin on storage.objects;
create policy fotos_borrar_admin on storage.objects
  for delete to authenticated using (bucket_id = 'fotos' and public.es_admin());

-- ---------------------------------------------------------------------
-- 12. Listo.
-- ---------------------------------------------------------------------
