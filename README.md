# Inventario · Nabek Martins

Sistema de inventario para el atelier de alta costura Nabek Martins. Telas,
insumos, prendas, movimientos y proveedores, en español, pensado para usarse
desde el computador, la tablet y el teléfono dentro del taller.

**Si lo que buscas es ponerlo en marcha o aprender a usarlo:**

- 📘 [Cómo poner en marcha el sistema](docs/DESPLIEGUE.md) — paso a paso, sin conocimientos técnicos.
- 📗 [Manual del taller](docs/MANUAL-DEL-EQUIPO.md) — cómo se usa en el día a día.
- 📙 [Handoff](docs/HANDOFF.md) — en qué punto está el proyecto, qué decisiones se tomaron y qué falta.

---

## Qué hace

- **Telas e insumos** con foto, proveedor, ubicación, costo y punto de reposición.
- **Movimientos** de entrada, salida y ajuste. El stock se calcula a partir de
  ellos: no se edita a mano nunca.
- **Alertas** cuando un material baja de su punto de reposición.
- **Prendas** en proceso por etapa, con los materiales que lleva cada una, su
  costo real y su margen; y el archivo de prendas terminadas.
- **Proveedores, clientas y colecciones.**
- **Dos roles**: administradora (todo) y equipo (registra movimientos y avanza
  prendas, sin ver costos ni borrar nada).
- **Exportar** cualquier tabla a Excel/CSV e **importar** desde las hojas de
  cálculo que ya se usan.
- **Historial** automático de quién cambió qué y cuándo.

## Decisiones de arquitectura

Tres decisiones explican casi todo el código. Están tomadas pensando en los
módulos que vienen después (producción y organización documental), para no
tener que rehacer nada.

**1. Telas e insumos son una sola tabla.** `materiales` con un campo `clase`
(`tela` o `insumo`). En pantalla son dos módulos, como pide el taller; por
debajo comparten el motor de stock, las alertas, los movimientos, la
importación y la exportación, escritos una sola vez.

**2. El stock no existe como dato.** Es la suma de los movimientos
(vista `stock_actual`). No hay un número que pueda quedar desincronizado, y
cualquier cifra se puede explicar movimiento a movimiento. Un *trigger* impide
dejarlo en negativo y nada se borra: los movimientos se anulan con motivo.

**3. Los costos los filtra la base de datos, no la interfaz.** Las vistas
devuelven `null` en las columnas de dinero cuando quien pregunta no es
administradora. Ocultarlos en la pantalla habría sido más fácil y menos seguro.

Y una cuarta, menor: una prenda en proceso y una terminada son la **misma
fila**, que avanza de estado. Su historial y su costo la acompañan hasta el
final.

## Stack

| | |
|---|---|
| Aplicación | Next.js 15 (App Router) · React 19 · TypeScript |
| Base de datos, acceso y fotos | Supabase (PostgreSQL + Auth + Storage) |
| Estilos | Tailwind CSS 4 |
| Publicación | Vercel |

Todo tiene plan gratuito suficiente para arrancar. Las salvedades están
explicadas al final del [manual de despliegue](docs/DESPLIEGUE.md).

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y pega ahí las llaves de tu proyecto de Supabase
npm run dev
```

El esquema de la base de datos está en [`supabase/schema.sql`](supabase/schema.sql):
se pega entero en el SQL Editor de Supabase y se puede volver a ejecutar sin
romper nada.

## Pruebas

Las [pruebas del esquema](supabase/pruebas/README.md) comprueban contra un
PostgreSQL real que las cuentas salen y que los permisos separan de verdad lo
que ve cada rol.

```bash
npm run typecheck   # tipos
npm run build       # compilación completa
```

## Estructura

```
src/
  app/            Rutas. (app)/ son las páginas con sesión iniciada.
  components/     Componentes de interfaz.
  lib/
    acciones/     Server Actions: todo lo que escribe en la base de datos.
    datos.ts      Consultas de lectura.
    csv.ts        Exportación e importación de hojas de cálculo.
    formato.ts    Fechas, cantidades y dinero en español.
    config.ts     Ajustes del taller (moneda, unidades, etapas).
supabase/
  schema.sql      Tablas, vistas, permisos y disparadores.
  pruebas/        Pruebas del esquema.
docs/             Manuales en español.
```

## Lo que viene después

El inventario es el primer módulo. La base de datos y la navegación están
preparadas para sumar **gestión de producción** (cronograma, tiempos por prenda,
reuniones) y **organización documental** sin tocar lo ya construido.
