import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/** Conexion a Supabase desde el servidor (paginas y acciones). */
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(nuevas) {
          try {
            nuevas.forEach(({ name, value, options }) => almacen.set(name, value, options));
          } catch {
            // Al renderizar un Server Component no se pueden escribir cookies.
            // El middleware ya refresco la sesion, asi que se puede ignorar.
          }
        },
      },
    },
  );
}

/**
 * Conexion con permisos de administracion (clave secreta del servidor).
 * Solo se usa para invitar personas al equipo. Nunca llega al navegador.
 */
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) {
    throw new Error(
      "Falta la variable SUPABASE_SERVICE_ROLE_KEY. Sin ella no se pueden enviar invitaciones.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
