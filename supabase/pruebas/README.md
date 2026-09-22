# Pruebas del esquema

Comprueban, contra un PostgreSQL de verdad, las dos cosas de las que depende
todo lo demas:

1. **Que las cuentas salen** — el stock es la suma de los movimientos, el costo
   queda congelado en cada movimiento, no se puede dejar stock en negativo y
   el margen por prenda se calcula bien.
2. **Que los permisos separan de verdad** — el rol `equipo` recibe los costos
   vacios **desde la base de datos**, no solo ocultos en pantalla, y no puede
   crear fichas, borrar movimientos, leer el historial ni ascenderse a
   administradora.

## Como ejecutarlas

Hace falta PostgreSQL 14 o superior. No toca el proyecto de Supabase: crea una
base de datos desechable con una imitacion minima de lo que Supabase aporta
(`auth.users`, `auth.uid()`, `storage`, y los roles `anon` y `authenticated`).

```bash
createdb prueba_inventario

psql -d prueba_inventario -f supabase/pruebas/00-entorno-de-prueba.sql
psql -d prueba_inventario -f supabase/schema.sql
psql -d prueba_inventario -f supabase/pruebas/01-logica.sql
psql -d prueba_inventario -f supabase/pruebas/02-permisos.sql
```

Cada bloque imprime lo que comprueba. Si algo se rompiera, el propio script
lanza un error con el texto `FALLO:` y se detiene.

En las pruebas, `auth.uid()` lee el ajuste `prueba.usuario`, asi que cambiar de
persona es tan simple como `set prueba.usuario = '<uuid>'`.
