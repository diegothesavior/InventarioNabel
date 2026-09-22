import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Mantiene viva la sesion en cada visita y protege las paginas privadas.
 * Quien no ha entrado va siempre a /entrar.
 */
const PUBLICAS = ["/entrar", "/recuperar", "/bienvenida", "/configuracion-pendiente"];

export async function middleware(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ruta = peticion.nextUrl.pathname;

  // Si la app aun no esta conectada a Supabase, se explica que falta.
  if (!url || !clave) {
    if (ruta === "/configuracion-pendiente") return respuesta;
    return NextResponse.redirect(new URL("/configuracion-pendiente", peticion.url));
  }

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(nuevas) {
        nuevas.forEach(({ name, value }) => peticion.cookies.set(name, value));
        respuesta = NextResponse.next({ request: peticion });
        nuevas.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esPublica = PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));

  if (!user && !esPublica) {
    const destino = new URL("/entrar", peticion.url);
    if (ruta !== "/") destino.searchParams.set("volver", ruta);
    return NextResponse.redirect(destino);
  }

  if (user && ruta === "/entrar") {
    return NextResponse.redirect(new URL("/", peticion.url));
  }

  return respuesta;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
