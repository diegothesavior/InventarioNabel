# Cómo poner en marcha el sistema

Guía para hacerlo sin saber programar. Son cinco pasos y se hace una sola vez.
Calcula una hora la primera vez, con calma.

Vas a necesitar:

- Un computador (no sirve el teléfono para esta parte).
- Un correo electrónico.
- Los archivos de Excel o Google Sheets que ya usan, si quieres cargarlos al final.

Al terminar tendrás una dirección de internet, como
`inventario-nabek.vercel.app`, que el equipo podrá abrir desde cualquier
teléfono, tablet o computador.

---

## Paso 1 · Crear la cuenta de GitHub y copiar el proyecto

GitHub es donde vive el código. Es gratis.

1. Entra a **github.com** y haz clic en **Sign up**. Crea la cuenta con tu correo.
2. Una vez dentro, abre el proyecto que te compartimos.
3. Arriba a la derecha pulsa **Fork** y luego **Create fork**.
   Eso hace *tu propia copia* del proyecto. Todo lo demás se hará sobre esa copia.

> **Si el proyecto ya está en tu cuenta**, sáltate este paso.

---

## Paso 2 · Crear la base de datos (Supabase)

Aquí se guardan las telas, los insumos, las prendas y los usuarios. El plan
gratuito alcanza de sobra para un atelier.

1. Entra a **supabase.com** y pulsa **Start your project**. Inicia sesión con GitHub.
2. Pulsa **New project** y rellena:
   - **Name**: `inventario-nabek`
   - **Database Password**: pulsa **Generate a password** y **guárdala en un lugar seguro**
     (un gestor de contraseñas, o anotada donde solo tú la veas). No la vas a
     necesitar a diario, pero perderla es un problema.
   - **Region**: la más cercana a ustedes. Si están en Colombia, `East US (North Virginia)`.
3. Pulsa **Create new project** y espera unos dos minutos a que termine de prepararse.

### Crear las tablas

1. En el menú de la izquierda entra en **SQL Editor**.
2. Pulsa **New query**.
3. Abre el archivo `supabase/schema.sql` del proyecto en GitHub, pulsa el botón
   de **copiar** y pega todo el contenido en el recuadro de Supabase.
4. Pulsa **Run** (abajo a la derecha).

Debe aparecer un mensaje verde de éxito. Ya están creadas todas las tablas, los
permisos y el espacio para las fotos.

### Copiar las dos llaves

1. Menú de la izquierda → **Project Settings** (el engranaje) → **Data API**.
2. Copia el valor de **Project URL**. Es algo como
   `https://abcdefghijk.supabase.co`. Guárdalo en un bloc de notas.
3. Entra en **Project Settings** → **API Keys**.
4. Copia la clave **anon public**. Es un texto largo. Guárdalo también.
5. En esa misma página, revela y copia la clave **service_role**. Guárdala
   aparte: **esta es secreta**. Sirve para enviar las invitaciones al equipo.
   Nunca la pegues en un correo, un chat ni en el código.

---

## Paso 3 · Publicar la aplicación (Vercel)

1. Entra a **vercel.com** y pulsa **Sign Up**. Elige **Continue with GitHub**.
2. Pulsa **Add New…** → **Project**.
3. Busca tu copia del proyecto en la lista y pulsa **Import**.
4. Antes de publicar, despliega la sección **Environment Variables** y añade
   estas tres, una por una (nombre a la izquierda, valor a la derecha):

   | Nombre | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | el **Project URL** del paso 2 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave **anon public** |
   | `SUPABASE_SERVICE_ROLE_KEY` | la clave **service_role** (la secreta) |

   Escribe los nombres **exactamente** como están en la tabla: mayúsculas,
   guiones bajos y sin espacios.

5. Pulsa **Deploy** y espera un par de minutos.

Cuando termine, Vercel te muestra la dirección de tu aplicación. Ábrela: debe
aparecer la pantalla de **Entrar**.

> **¿Aparece «Falta un paso»?** Entonces alguna de las dos primeras variables
> está mal escrita. Ve a **Settings → Environment Variables**, corrígela, y
> luego a **Deployments → … → Redeploy**.

---

## Paso 4 · Decirle a Supabase cuál es tu dirección

Sin esto, los enlaces que reciba el equipo por correo no funcionarán.

1. Vuelve a Supabase → **Authentication** → **URL Configuration**.
2. En **Site URL** pon la dirección que te dio Vercel, con `https://` delante y
   **sin barra al final**. Por ejemplo: `https://inventario-nabek.vercel.app`
3. En **Redirect URLs** pulsa **Add URL** y añade la misma dirección terminada
   en `/**`. Por ejemplo: `https://inventario-nabek.vercel.app/**`
4. Guarda.

---

## Paso 5 · Entrar por primera vez y crear tu cuenta

1. En Supabase entra en **Authentication** → **Users** → **Add user** →
   **Create new user**.
2. Escribe tu correo y una contraseña (mínimo 8 caracteres). Marca
   **Auto Confirm User** para no tener que confirmar por correo.
3. Pulsa **Create user**.
4. Abre la dirección de tu aplicación y entra con ese correo y esa contraseña.

**La primera persona que entra queda como administradora automáticamente.** Ve
todo, incluidos los costos y los márgenes, y puede invitar al resto.

---

## Invitar al equipo

Ya dentro de la aplicación:

1. Ve a **Equipo** en el menú de arriba.
2. Escribe el nombre y el correo de la persona.
3. Elige qué podrá hacer:
   - **Equipo** — registrar movimientos y actualizar prendas. **No ve costos,
     precios ni márgenes, y no puede borrar nada.** Es lo normal para la mayoría.
   - **Administradora** — todo, incluidos los costos.
4. Pulsa **Enviar invitación**.

La persona recibe un correo con un enlace, elige su contraseña y ya está dentro.
Si no le llega en unos minutos, que revise el correo no deseado.

> ### Importante: el límite de correos
>
> Supabase, en su plan gratuito, solo envía **2 correos por hora**. Si invitas a
> seis personas de golpe, cuatro no recibirán nada.
>
> Tienes dos salidas:
>
> - **La sencilla:** invita de dos en dos, esperando una hora entre tandas.
> - **La definitiva:** conecta un servicio de correo propio. Crea una cuenta
>   gratuita en **resend.com**, y en Supabase ve a **Project Settings → Authentication
>   → SMTP Settings**, activa **Enable Custom SMTP** y pega los datos que te dé
>   Resend. A partir de ahí no hay límite práctico.

---

## Cargar lo que ya tienen en Excel

1. Abre la hoja de cálculo actual en Excel o Google Sheets.
2. **Archivo → Descargar → CSV** (en Excel: *Guardar como → CSV UTF-8*).
3. En la aplicación entra en **Telas** → **Importar**.
4. Sube el archivo. El sistema intenta reconocer solo las columnas; revisa que
   haya acertado y corrige lo que haga falta.
5. Mira la vista previa y pulsa **Importar**.
6. Repite con los insumos.

Lo único obligatorio es que cada fila tenga **código** y **nombre**. Si un
código ya existe, esa ficha se actualiza en vez de duplicarse, así que puedes
importar el mismo archivo corregido las veces que necesites.

Si prefieres empezar de cero, en esa misma pantalla puedes **descargar una
plantilla** con las columnas ya preparadas.

---

## Cosas que conviene saber

**El plan gratuito de Supabase pausa los proyectos que pasan una semana entera
sin usarse.** Con uso diario no ocurre nunca. Si llegara a pasar, entras a
supabase.com y pulsas **Restore project**; no se pierde nada.

**El plan gratuito de Vercel (Hobby) es para uso no comercial.** Para un taller
interno nadie lo persigue, pero si quieres estar formalmente en regla son 20 USD
al mes (plan Pro). La alternativa gratuita para uso comercial es Cloudflare
Pages o Netlify; el código funciona igual en los tres.

**Las copias de seguridad** las hace Supabase solo, a diario. Aun así, una vez
al mes no está de más entrar a cada tabla y pulsar **Exportar**: te queda el
Excel guardado en tu computador.

**Si alguien deja el taller**, entra en **Equipo** y pulsa *Quitar acceso*. Su
historial de movimientos se conserva; simplemente ya no puede entrar.

---

## Si algo no funciona

| Qué ves | Qué hacer |
|---|---|
| «Falta un paso» al abrir la aplicación | Revisa los nombres de las variables en Vercel → Settings → Environment Variables, y vuelve a publicar desde Deployments |
| «El correo o la contraseña no coinciden» | Usa *Recuperar contraseña* en la pantalla de entrar |
| El enlace del correo dice que caducó | Los enlaces duran poco. Pide otro desde *Recuperar contraseña* |
| No llegan las invitaciones | Es el límite de 2 correos por hora. Mira el recuadro de arriba |
| «No tienes permiso para hacer esto» | Esa persona tiene rol *equipo*. Cámbialo en **Equipo** si corresponde |
| La aplicación no carga y Supabase dice *paused* | Entra a supabase.com y pulsa **Restore project** |
