\echo '=== A. La administradora ve los costos ==='
set prueba.usuario = '11111111-1111-1111-1111-111111111111';
set role authenticated;
select codigo, stock, costo_unitario, valor_inventario from public.materiales_vista where codigo='TEL-001';
reset role;

\echo ''
\echo '=== B. El rol equipo NO ve los costos (llegan vacios desde la base) ==='
set prueba.usuario = '22222222-2222-2222-2222-222222222222';
set role authenticated;
select codigo, stock, costo_unitario, valor_inventario from public.materiales_vista where codigo='TEL-001';

\echo ''
\echo '=== C. El equipo tampoco ve precio ni margen de las prendas ==='
select codigo, costo_materiales, precio_venta, margen from public.prendas_vista where codigo='PR-001';

\echo ''
\echo '=== D. El equipo SI puede registrar un movimiento ==='
insert into public.movimientos (material_id, tipo, cantidad, motivo)
values ('44444444-4444-4444-4444-444444444444','salida', 1, 'Prueba del equipo');
select 'movimiento registrado por el equipo' as resultado;

\echo ''
\echo '=== E. El equipo NO puede crear fichas de material ==='
do $$
begin
  insert into public.materiales (clase, codigo, nombre) values ('tela','TEL-999','Intento');
  raise exception 'FALLO: el equipo pudo crear una ficha';
exception when insufficient_privilege then
  raise notice 'Correcto: bloqueado por permisos.';
end $$;

\echo ''
\echo '=== F. El equipo NO puede borrar movimientos ni anularlos ==='
do $$
declare afectadas int;
begin
  delete from public.movimientos where motivo = 'Prueba del equipo';
  get diagnostics afectadas = row_count;
  if afectadas > 0 then raise exception 'FALLO: el equipo borro % movimientos', afectadas; end if;
  raise notice 'Correcto: el borrado no afecto a ninguna fila.';
end $$;

do $$
declare afectadas int;
begin
  update public.movimientos set anulado = true where motivo = 'Prueba del equipo';
  get diagnostics afectadas = row_count;
  if afectadas > 0 then raise exception 'FALLO: el equipo anulo % movimientos', afectadas; end if;
  raise notice 'Correcto: la anulacion no afecto a ninguna fila.';
end $$;

\echo ''
\echo '=== G. El equipo NO ve el historial ==='
select count(*) as filas_de_historial_visibles from public.historial;

\echo ''
\echo '=== H. El equipo NO puede ascenderse a administradora ==='
do $$
declare afectadas int;
begin
  update public.perfiles set rol='administradora' where id = auth.uid();
  get diagnostics afectadas = row_count;
  if afectadas > 0 then raise exception 'FALLO: el equipo se ascendio a administradora'; end if;
  raise notice 'Correcto: no pudo cambiarse el rol.';
exception when insufficient_privilege or check_violation then
  raise notice 'Correcto: bloqueado por permisos.';
end $$;

\echo ''
\echo '=== I. El equipo SI puede actualizar su propio nombre ==='
update public.perfiles set nombre = 'Ana Maria' where id = auth.uid();
select nombre, rol from public.perfiles where id = auth.uid();

\echo ''
\echo '=== J. El equipo SI puede avanzar una prenda de etapa ==='
update public.prendas set etapa = 'corte' where codigo = 'PR-001';
select codigo, etapa from public.prendas where codigo='PR-001';
reset role;

\echo ''
\echo '=== K. Una persona sin sesion no ve nada ==='
set prueba.usuario = '';
set role anon;
select count(*) as materiales_visibles_sin_sesion from public.materiales;
reset role;
