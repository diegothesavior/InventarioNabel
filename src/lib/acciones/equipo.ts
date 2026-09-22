"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ResultadoAccion, RolUsuario } from "@/lib/tipos";
import { exito, fallo, texto, traducirError } from "./comun";

/** Direccion publica de la app, para que el enlace del correo vuelva aqui. */
async function direccionDelSitio(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host");
  const protocolo = cabeceras.get("x-forwarded-proto") ?? "https";
  return host ? `${protocolo}://${host}` : "http://localhost:3000";
}

/** Invita a una persona por correo. Recibe un enlace para elegir su contraseña. */
export async function invitarPersona(
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede invitar personas.");

  const email = texto(datos, "email")?.toLowerCase();
  const nombre = texto(datos, "nombre");
  const rol = (texto(datos, "rol") ?? "equipo") as RolUsuario;

  if (!email) return fallo("Escribe el correo de la persona.");
  if (!nombre) return fallo("Escribe su nombre.");
  if (rol !== "administradora" && rol !== "equipo") return fallo("Elige un rol valido.");

  let admin;
  try {
    admin = crearClienteAdmin();
  } catch (error) {
    return fallo(
      error instanceof Error
        ? error.message
        : "Falta configurar la clave secreta para enviar invitaciones.",
    );
  }

  const sitio = await direccionDelSitio();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { nombre, rol },
    redirectTo: `${sitio}/bienvenida`,
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      return fallo("Esa persona ya tiene cuenta. Buscala en la lista de abajo.");
    }
    return fallo(traducirError(error));
  }

  revalidatePath("/equipo");
  return exito(`Invitacion enviada a ${email}. Dile que revise su correo.`);
}

export async function cambiarRol(id: string, rol: RolUsuario): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") return fallo("Solo la administradora puede cambiar roles.");
  if (id === perfil.id) return fallo("No puedes cambiarte el rol a ti misma.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update({ rol }).eq("id", id);
  if (error) return fallo(traducirError(error));

  revalidatePath("/equipo");
  return exito("Rol actualizado.");
}

/** Desactivar deja el historial intacto pero cierra el acceso. */
export async function cambiarAcceso(id: string, activo: boolean): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") return fallo("Solo la administradora puede hacer esto.");
  if (id === perfil.id) return fallo("No puedes quitarte el acceso a ti misma.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", id);
  if (error) return fallo(traducirError(error));

  revalidatePath("/equipo");
  return exito(activo ? "Acceso reactivado." : "Acceso desactivado.");
}
