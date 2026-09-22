# Handoff · Inventario Nabek Martins

Documento de traspaso. Está escrito para dos lectoras a la vez: **tú**, que vas
a seguir con este proyecto, y **tu Claude**, que necesita entender en treinta
segundos qué hay construido y por qué está hecho así.

La forma más rápida de empezar está al final, en *§11 Cómo seguir desde aquí*.

---

## 1 · Qué es esto y en qué punto está

Sistema de inventario para el atelier de alta costura **Nabek Martins**. Es el
primer módulo de un sistema más grande: después vienen **gestión de producción**
(cronograma, tiempos por prenda, reuniones) y **organización documental**. La
arquitectura ya está pensada para sumarlos sin rehacer nada.

El equipo son más de 6 personas, no técnicas, que hoy trabajan con
Excel/Google Sheets. Toda la interfaz está en español.

**Estado:** el código está terminado y compila. **Todavía no está desplegado.**
Nadie lo ha usado con datos reales. Ese es el siguiente paso.

- Rama: `claude/nabek-martins-inventory-xrxb9e`
- Dos commits: *Etapa 1* (telas, insumos, movimientos, proveedores) y *Etapa 2*
  (prendas, clientas, colecciones, manuales).
- No hay Pull Request abierto.

---

## 2 · Decisiones de producto ya tomadas

Estas cuatro respuestas del cliente condicionan todo el diseño. No hay que
volver a preguntarlas.

| Pregunta | Respuesta | Qué implicó |
|---|---|---|
| ¿A medida o por colecciones? | **Ambas** | Una prenda puede apuntar a una clienta, a una colección, o a las dos. Existe `clientas` y `colecciones`, y la restricción es que haya al menos una |
| ¿Cuántas referencias de telas? | **Decenas (menos de 100)** | No hace falta paginación ni búsqueda en servidor: las tablas se filtran en el navegador, que es instantáneo y más simple |
| ¿Quién actualiza el inventario? | **Una sola persona** centraliza la carga | Aun así los dos roles están implementados, porque el resto del equipo consulta y puede registrar movimientos |
| ¿Costos y márgenes desde ya? | **Sí, completos** | Costo de materiales por prenda, precio de venta, margen y porcentaje. Todo visible solo para la administradora |

---

## 3 · Stack y por qué

| Pieza | Elección | Razón |
|---|---|---|
| Aplicación | Next.js 15 (App Router), React 19, TypeScript | Un solo proyecto sirve computador, tablet y teléfono. Es lo que más gente sabe mantener |
| Base de datos, acceso y fotos | Supabase (PostgreSQL + Auth + Storage) | Los tres servicios en uno. Postgres permite calcular stock y costos sin trucos |
| Estilos | Tailwind CSS 4 | Diseño propio sin parecer plantilla corporativa |
| Publicación | Vercel | Cada cambio en GitHub se publica solo |

Se descartaron Airtable y Notion porque no permiten roles con costos ocultos ni
stock calculado, y un servidor propio porque exige mantenimiento mensual y
conocimiento técnico que el taller no tiene.

---

## 4 · Las cuatro decisiones de arquitectura

**Esto es lo importante del traspaso.** Si se rompe alguna, el sistema deja de
tener sentido. Fueron aprobadas explícitamente por el cliente.

### 4.1 · Telas e insumos son una sola tabla

`materiales`, con un campo `clase` que vale `tela` o `insumo`. En pantalla son
dos módulos separados, como pidió el taller. Por debajo comparten **un único
motor**: stock, alertas, movimientos, importación y exportación, escritos una
sola vez.

Es lo que evita duplicar todo el trabajo cuando lleguen los módulos siguientes.
*No conviertas esto en dos tablas.*

### 4.2 · El stock no existe como dato

No hay ninguna columna `stock`. Es la suma de los movimientos, calculada por la
vista `stock_actual`. Consecuencias:

- No hay un número que pueda quedar desincronizado.
- Cualquier cifra se explica movimiento a movimiento.
- Un *trigger* impide dejarlo en negativo, con un mensaje en español.
- Nada se borra: los movimientos se **anulan** con motivo, y dejan de contar.

*Nunca añadas una columna de stock editable, por muy cómodo que parezca.*

### 4.3 · Los costos los filtra la base de datos, no la interfaz

Las vistas (`materiales_vista`, `movimientos_vista`, `prendas_vista`) devuelven
`null` en las columnas de dinero cuando quien pregunta no es administradora:

```sql
case when public.es_admin() then m.costo_unitario end as costo_unitario
```

Al rol `equipo` los costos **no le llegan**. No están ocultos con un `if` en el
componente: no salen del servidor. Está probado (ver §8).

*Si añades una columna de dinero nueva, tiene que pasar por este mismo filtro.*

### 4.4 · Una prenda en proceso y una terminada son la misma fila

Hay una sola tabla `prendas` con un campo `estado` que avanza:
`en_proceso` → `terminada` → `disponible` / `reservada` / `entregada`.

Dos pantallas (`/prendas` y `/terminadas`), un solo registro. Así el historial,
los materiales consumidos y el costo la acompañan hasta el final.

---

## 5 · Qué está construido

| Ruta | Qué es | Quién entra |
|---|---|---|
| `/` | Panel de inicio: alertas de reposición, últimos movimientos, próximas entregas, valor del inventario | Todas |
| `/telas`, `/insumos` | Listado con buscador, filtros, foto y alertas. Tabla en escritorio, tarjetas en teléfono | Todas |
| `/telas/[id]`, `/insumos/[id]` | Ficha con existencias, datos e historial de movimientos | Todas |
| `/telas/nueva`, `/telas/[id]/editar` | Alta y edición de fichas | Administradora |
| `/movimientos` | Todas las entradas y salidas, con filtros por tipo y fecha | Todas |
| `/movimientos/nuevo` | **La pantalla más usada.** Entrada / salida / ajuste con botones grandes | Todas |
| `/prendas` | Tablero por etapa, o vista de lista | Todas |
| `/prendas/[id]` | Ficha con materiales asignados, costo y margen; etapa y estado con un toque | Todas |
| `/terminadas` | Galería de prendas terminadas con estado y precio | Todas |
| `/proveedores` | Fichas de contacto y tiempos de entrega | Todas (edita la admin) |
| `/clientas`, `/colecciones` | Catálogos cortos con edición en línea | Administradora |
| `/importar` | Importación desde Excel/CSV con emparejado automático de columnas | Administradora |
| `/historial` | Quién cambió qué y cuándo | Administradora |
| `/equipo` | Invitar personas, cambiar roles, quitar accesos | Administradora |
| `/entrar`, `/recuperar`, `/bienvenida` | Acceso, recuperación y elección de contraseña | Público |

Todas las tablas tienen buscador, filtros y botón **Exportar** a CSV.

---

## 6 · Mapa del repositorio

```
src/
  app/
    (app)/          Páginas con sesión iniciada. El layout trae la navegación.
    entrar/         Acceso, recuperación, bienvenida, cierre de sesión.
  components/       Componentes de interfaz. Los "Tabla*" y "Formulario*"
                    son de cliente; los "Pagina*" son de servidor.
  lib/
    acciones/       Server Actions: TODO lo que escribe en la base de datos.
    datos.ts        Consultas de lectura. Siempre leen de las vistas.
    csv.ts          Exportación e importación de hojas de cálculo.
    formato.ts      Fechas, cantidades y dinero en español.
    config.ts       Ajustes del taller: moneda, unidades, etapas, categorías.
    tipos.ts        Tipos de TypeScript compartidos.
    supabase/       Conexiones (navegador, servidor, admin) y sesión.
  middleware.ts     Refresca la sesión y protege las páginas privadas.
supabase/
  schema.sql        Tablas, vistas, permisos y disparadores. Se puede volver
                    a ejecutar sin romper nada.
  pruebas/          Pruebas del esquema contra un PostgreSQL real.
docs/
  DESPLIEGUE.md     Puesta en marcha paso a paso, para alguien no técnico.
  MANUAL-DEL-EQUIPO.md  Uso diario, imprimible para el taller.
  HANDOFF.md        Este documento.
```

---

## 7 · Qué hay que hacer para que esto exista de verdad

**Nada de esto se ha hecho todavía.** Está detallado, con capturas de qué botón
pulsar, en [`docs/DESPLIEGUE.md`](DESPLIEGUE.md). Resumen:

1. Crear cuenta de GitHub y hacer *Fork* del proyecto.
2. Crear un proyecto gratuito en Supabase y ejecutar `supabase/schema.sql` en
   su SQL Editor. Copiar tres llaves.
3. Importar el proyecto en Vercel y pegar esas tres llaves como variables de
   entorno.
4. En Supabase, configurar *Site URL* y *Redirect URLs* con la dirección que dé
   Vercel. Sin esto los correos de invitación no funcionan.
5. Crear el primer usuario desde Supabase y entrar. **La primera persona que
   entra queda como administradora automáticamente.**

Después, desde la aplicación: invitar al equipo e importar las hojas de cálculo
actuales.

### Dos límites reales, dichos sin adornos

- **Supabase gratuito envía solo 2 correos por hora.** Invitar a seis personas
  de golpe no funciona: cuatro no reciben nada. O se invita de dos en dos, o se
  conecta una cuenta gratuita de Resend como SMTP propio (10 minutos, explicado
  en el manual). Recomendado lo segundo.
- **El plan gratuito de Vercel (Hobby) es para uso no comercial.** Para un
  taller interno nadie lo persigue, pero estar formalmente en regla son 20
  USD/mes. La alternativa gratuita que sí permite uso comercial es Cloudflare
  Pages o Netlify; el código funciona igual en las tres.
- **Supabase pausa los proyectos gratuitos tras una semana sin uso.** Con uso
  diario no ocurre. Si pasara, se reactiva con un botón y no se pierde nada.

---

## 8 · Qué se verificó, y cómo repetirlo

No es código escrito a ojo. Se levantó un PostgreSQL real y se ejecutó el
esquema contra él. **Así se encontró un error que habría hecho fallar el script
entero en Supabase** (un índice usaba `unaccent()`, que Postgres no admite en
índices porque no es `IMMUTABLE`). Ya está corregido.

Después se comprobó, con 22 pruebas:

- **Lógica** — el stock sale de los movimientos; el costo queda congelado en
  cada movimiento; el sistema rechaza dejar stock en negativo; el margen por
  prenda se calcula bien; anular un movimiento lo saca de las cuentas; el
  historial se escribe solo.
- **Permisos** — al rol `equipo` los costos le llegan **vacíos desde la base de
  datos**; no puede crear fichas, borrar movimientos, leer el historial ni
  ascenderse a administradora; sí puede registrar movimientos, avanzar prendas
  y cambiar su propio nombre; sin sesión no se ve absolutamente nada.

Para repetirlas hace falta PostgreSQL 14 o superior. No toca el proyecto de
Supabase: crea una base desechable con una imitación mínima de lo que Supabase
aporta.

```bash
createdb prueba_inventario
psql -d prueba_inventario -f supabase/pruebas/00-entorno-de-prueba.sql
psql -d prueba_inventario -f supabase/schema.sql
psql -d prueba_inventario -f supabase/pruebas/01-logica.sql
psql -d prueba_inventario -f supabase/pruebas/02-permisos.sql
```

Si algo se rompiera, el propio script se detiene con un error que empieza por
`FALLO:`.

Además: `npm run typecheck` y `npm run build` pasan limpios.

**Las tildes de la interfaz** se corrigieron en una pasada aparte: 193 líneas en
43 archivos. Se hizo solo sobre las zonas de texto —nunca sobre identificadores,
clases CSS, rutas ni campos de base de datos— y se comprobó después, línea a
línea, que **ninguna difería de la anterior salvo por las tildes y las eñes**.

---

## 9 · Pendientes, en orden

### 1. Confirmar la moneda

Está puesto peso colombiano (`COP`) con formato `es-CO`, **a falta de
confirmación**. Si es otra, se cambia con dos variables de entorno en Vercel,
sin tocar código:

```
NEXT_PUBLIC_MONEDA=COP
NEXT_PUBLIC_LOCALE=es-CO
```

### 2. Desplegar y cargar los datos reales

Ver §7. Lo normal es que al cargar el inventario de verdad aparezcan dos o tres
campos que faltan o sobran. Es esperable y es barato cambiarlo.

### 3. Decidir si se abre un Pull Request

La rama está subida. No hay PR abierto.

### 4. Los módulos siguientes

**Gestión de producción** (cronograma, tiempos por prenda, reuniones) y
**organización documental**. La base está preparada: `prendas` ya tiene etapa,
responsable y fechas, y el historial registra cada cambio con su fecha, que es
la materia prima para medir tiempos por etapa.

---

## 10 · Convenciones del código

Para que lo que se añada no desentone con lo que hay:

- **Todo en español**: nombres de variables, funciones, campos, rutas y textos.
  `crearMaterial`, `punto_reposicion`, `/movimientos/nuevo`.
- **Sin tildes en el código y en el SQL** (nombres de variables, campos y
  comentarios). **Con tildes en todo lo que lee la persona.** Si añades textos,
  respétalo: es lo que distingue una interfaz cuidada de una descuidada.
- **Todo lo que escribe en la base de datos es un Server Action**, en
  `src/lib/acciones/`. Devuelven siempre `ResultadoAccion`, que es
  `{ok:true}` o `{ok:false, error}` con el error ya traducido a algo que una
  persona entienda (`traducirError` en `acciones/comun.ts`).
- **Las lecturas van en `src/lib/datos.ts`** y siempre consultan las **vistas**,
  nunca las tablas directamente. Es lo que garantiza el filtro de costos.
- **Los permisos se comprueban dos veces**: en el Server Action (para dar un
  mensaje claro) y en la base de datos con RLS (que es la que manda de verdad).
- **Estilos con los tokens del tema**, definidos en `src/app/globals.css`:
  `bg-hueso`, `text-tinta`, `border-arena`, `font-display`. Nada de colores
  sueltos. Las clases `.boton`, `.campo`, `.tarjeta`, `.tabla` ya están hechas.
- **Botones de 48 px de alto como mínimo**: se usa con las manos ocupadas y a
  veces con guantes.
- **Nada se borra**: las fichas se archivan (`activo = false`) y los movimientos
  se anulan con motivo.

---

## 11 · Cómo seguir desde aquí

Abre el proyecto con tu Claude y empieza con un mensaje parecido a este:

> Estoy retomando el sistema de inventario del atelier Nabek Martins. Lee
> primero `docs/HANDOFF.md`, que tiene el contexto completo y las decisiones de
> arquitectura que no hay que romper. Después dime qué harías primero.

Tu Claude leerá este documento y tendrá todo lo que hay en la cabeza de quien lo
construyó.

Si prefieres ir al grano, estas son las tres cosas por las que empezar, en este
orden:

1. **Desplegar** siguiendo [`docs/DESPLIEGUE.md`](DESPLIEGUE.md), invitar al
   equipo y cargar las hojas de cálculo actuales.
2. **Confirmar la moneda** (§9.1). Son dos variables de entorno.
3. **Usarlo una semana** antes de añadir nada. Los ajustes que de verdad hacen
   falta solo aparecen usándolo.

---

## 12 · Trampas conocidas

Cosas que parecen buena idea y no lo son:

- **Añadir una columna `stock` editable.** Rompe la decisión 4.2 y con ella la
  confianza en las cifras. Si hay que corregir existencias, se registra un
  **ajuste**, que queda explicado y con nombre.
- **Ocultar los costos con un `if` en el componente.** Los costos se filtran en
  la base de datos (4.3). Un `if` en React se salta abriendo las herramientas
  del navegador.
- **Separar telas e insumos en dos tablas.** Duplica el motor de stock y todo lo
  que venga después (4.1).
- **Duplicar la prenda al terminarla.** Es la misma fila avanzando de estado
  (4.4); duplicarla parte su historial y su costo en dos.
- **Borrar en lugar de archivar o anular.** El taller necesita poder reconstruir
  qué pasó y quién lo hizo.
- **Un buscar y reemplazar sobre todo el proyecto.** Los nombres de variables y
  campos van sin tildes y los textos con ellas, así que un reemplazo a ciegas
  rompe el código. Cuando haga falta, se hace solo sobre las zonas de texto y
  se comprueba después que ninguna línea cambió salvo por las tildes.
