\set ON_ERROR_STOP on
\echo '=== 1. Estructura creada ==='
select count(*) as tablas from information_schema.tables where table_schema='public' and table_type='BASE TABLE';
select count(*) as vistas from information_schema.views where table_schema='public';
select count(*) as politicas from pg_policies where schemaname='public';

\echo ''
\echo '=== 2. La primera persona queda como administradora ==='
insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'nabel@atelier.com', '{"nombre":"Nabel"}');
insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'ana@atelier.com', '{"nombre":"Ana","rol":"equipo"}');
select nombre, rol from public.perfiles order by creado_en;

\echo ''
\echo '=== 3. El stock sale de los movimientos ==='
set prueba.usuario = '11111111-1111-1111-1111-111111111111';
insert into public.proveedores (id, nombre) values ('33333333-3333-3333-3333-333333333333','Sedas del Sur');
insert into public.materiales (id, clase, codigo, nombre, unidad, costo_unitario, punto_reposicion, proveedor_id)
values ('44444444-4444-4444-4444-444444444444','tela','TEL-001','Seda marfil','metro', 50000, 5,
        '33333333-3333-3333-3333-333333333333');

insert into public.movimientos (material_id, tipo, cantidad, motivo)
values ('44444444-4444-4444-4444-444444444444','entrada', 20, 'Compra inicial');
insert into public.movimientos (material_id, tipo, cantidad, motivo)
values ('44444444-4444-4444-4444-444444444444','salida', 3.5, 'Corte');
insert into public.movimientos (material_id, tipo, cantidad, motivo)
values ('44444444-4444-4444-4444-444444444444','ajuste', -0.5, 'Conteo');

select stock, ultimo_movimiento is not null as tiene_fecha from public.stock_actual
where material_id='44444444-4444-4444-4444-444444444444';

\echo ''
\echo '=== 4. El costo se congela en el movimiento ==='
select tipo, cantidad, costo_unitario from public.movimientos
where material_id='44444444-4444-4444-4444-444444444444' order by creado_en;

\echo ''
\echo '=== 5. No se permite dejar el stock en negativo ==='
do $$
begin
  insert into public.movimientos (material_id, tipo, cantidad, motivo)
  values ('44444444-4444-4444-4444-444444444444','salida', 100, 'Salida imposible');
  raise exception 'FALLO: la base de datos acepto dejar el stock en negativo';
exception when check_violation then
  raise notice 'Correcto, fue rechazada: %', sqlerrm;
end $$;

\echo ''
\echo '=== 6. Alerta de reposicion y valor de inventario ==='
insert into public.movimientos (material_id, tipo, cantidad, motivo)
values ('44444444-4444-4444-4444-444444444444','salida', 12, 'Corte grande');
select codigo, stock, punto_reposicion, bajo_minimo, valor_inventario, proveedor_nombre
from public.materiales_vista where codigo='TEL-001';

\echo ''
\echo '=== 7. Costo y margen de una prenda ==='
insert into public.clientas (id, nombre) values ('55555555-5555-5555-5555-555555555555','Dona Marta');
insert into public.prendas (id, codigo, nombre, clienta_id, precio_venta)
values ('66666666-6666-6666-6666-666666666666','PR-001','Vestido de gala',
        '55555555-5555-5555-5555-555555555555', 2000000);
insert into public.movimientos (material_id, tipo, cantidad, prenda_id, motivo)
values ('44444444-4444-4444-4444-444444444444','salida', 2, '66666666-6666-6666-6666-666666666666','Falda');
select codigo, clienta_nombre, costo_materiales, precio_venta, margen, margen_porcentaje, materiales_asignados
from public.prendas_vista where codigo='PR-001';

\echo ''
\echo '=== 8. Una prenda necesita clienta o coleccion ==='
do $$
begin
  insert into public.prendas (codigo, nombre) values ('PR-002','Prenda huerfana');
  raise exception 'FALLO: acepto una prenda sin destino';
exception when check_violation then
  raise notice 'Correcto, fue rechazada.';
end $$;

\echo ''
\echo '=== 9. Un movimiento anulado deja de contar ==='
select stock as antes from public.stock_actual where material_id='44444444-4444-4444-4444-444444444444';
update public.movimientos set anulado = true, motivo_anulacion='Error de registro'
where motivo = 'Corte grande';
select stock as despues from public.stock_actual where material_id='44444444-4444-4444-4444-444444444444';

\echo ''
\echo '=== 10. El historial se escribe solo ==='
select tabla, accion, descripcion from public.historial order by id limit 8;
select count(*) as total_historial from public.historial;
