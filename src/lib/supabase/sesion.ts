import { redirect } from "next/navigation";
import { crearClienteServidor } from "./servidor";
import type { Perfil } from "@/lib/tipos";

/**
 * Devuelve el perfil de quien esta usando la app.
 * Si no hay sesion, manda al inicio de sesion.
 */
export async function perfilActual(): Promise<Perfil> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!perfil) redirect("/entrar?error=sin-perfil");
  if (!perfil.activo) redirect("/entrar?error=inactivo");

  return perfil as Perfil;
}

/** Igual que perfilActual, pero exige rol de administradora. */
export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") redirect("/?error=sin-permiso");
  return perfil;
}
