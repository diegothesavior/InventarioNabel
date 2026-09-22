"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ResultadoAccion } from "@/lib/tipos";
import { booleano, exito, fallo, numero, texto, traducirError } from "./comun";

/** Clientas y colecciones: fichas cortas que dan destino a cada prenda. */

export async function guardarClienta(
  id: string | null,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede gestionar las clientas.");

  const campos = {
    nombre: texto(datos, "nombre"),
    telefono: texto(datos, "telefono"),
    email: texto(datos, "email"),
    notas: texto(datos, "notas"),
  };
  if (!campos.nombre) return fallo("El nombre de la clienta es obligatorio.");

  const supabase = await crearClienteServidor();
  const { error } = id
    ? await supabase
        .from("clientas")
        .update({ ...campos, activo: booleano(datos, "activo") })
        .eq("id", id)
    : await supabase.from("clientas").insert({ ...campos, creado_por: perfil.id });

  if (error) return fallo(traducirError(error));

  revalidatePath("/clientas");
  revalidatePath("/prendas");
  return exito(id ? "Clienta actualizada." : "Clienta creada.");
}

export async function guardarColeccion(
  id: string | null,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede gestionar las colecciones.");

  const campos = {
    nombre: texto(datos, "nombre"),
    temporada: texto(datos, "temporada"),
    anio: numero(datos, "anio"),
    notas: texto(datos, "notas"),
  };
  if (!campos.nombre) return fallo("El nombre de la colección es obligatorio.");
  if (campos.anio !== null && (campos.anio < 1900 || campos.anio > 2200))
    return fallo("Revisa el ano de la colección.");

  const supabase = await crearClienteServidor();
  const { error } = id
    ? await supabase
        .from("colecciones")
        .update({ ...campos, activo: booleano(datos, "activo") })
        .eq("id", id)
    : await supabase.from("colecciones").insert({ ...campos, creado_por: perfil.id });

  if (error) return fallo(traducirError(error));

  revalidatePath("/colecciones");
  revalidatePath("/prendas");
  return exito(id ? "Colección actualizada." : "Colección creada.");
}
