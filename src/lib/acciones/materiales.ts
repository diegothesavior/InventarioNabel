"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ClaseMaterial, ResultadoAccion } from "@/lib/tipos";
import { booleano, exito, fallo, numero, texto, traducirError } from "./comun";

function rutaDe(clase: ClaseMaterial) {
  return clase === "tela" ? "/telas" : "/insumos";
}

function leerCampos(datos: FormData, clase: ClaseMaterial) {
  return {
    clase,
    codigo: texto(datos, "codigo"),
    nombre: texto(datos, "nombre"),
    tipo: texto(datos, "tipo"),
    unidad: texto(datos, "unidad") ?? (clase === "tela" ? "metro" : "unidad"),
    proveedor_id: texto(datos, "proveedor_id"),
    costo_unitario: numero(datos, "costo_unitario"),
    ubicacion: texto(datos, "ubicacion"),
    punto_reposicion: numero(datos, "punto_reposicion") ?? 0,
    foto_url: texto(datos, "foto_url"),
    notas: texto(datos, "notas"),
    composicion: clase === "tela" ? texto(datos, "composicion") : null,
    color: clase === "tela" ? texto(datos, "color") : null,
    ancho_cm: clase === "tela" ? numero(datos, "ancho_cm") : null,
  };
}

function validar(campos: ReturnType<typeof leerCampos>): string | null {
  if (!campos.codigo) return "El código es obligatorio.";
  if (!campos.nombre) return "El nombre es obligatorio.";
  if (campos.costo_unitario !== null && campos.costo_unitario < 0)
    return "El costo no puede ser negativo.";
  if (campos.punto_reposicion < 0) return "El punto de reposición no puede ser negativo.";
  return null;
}

export async function crearMaterial(
  clase: ClaseMaterial,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede crear fichas nuevas.");

  const campos = leerCampos(datos, clase);
  const problema = validar(campos);
  if (problema) return fallo(problema);

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("materiales")
    .insert({ ...campos, creado_por: perfil.id })
    .select("id")
    .single();

  if (error) return fallo(traducirError(error));

  // Stock inicial: se registra como un movimiento de entrada, nunca a mano.
  const inicial = numero(datos, "stock_inicial");
  if (inicial && inicial > 0) {
    const { error: falloMovimiento } = await supabase.from("movimientos").insert({
      material_id: data.id,
      tipo: "entrada",
      cantidad: inicial,
      costo_unitario: campos.costo_unitario,
      motivo: "Existencia inicial",
      registrado_por: perfil.id,
    });
    if (falloMovimiento) return fallo(traducirError(falloMovimiento));
  }

  revalidatePath(rutaDe(clase));
  redirect(`${rutaDe(clase)}/${data.id}?creado=1`);
}

export async function actualizarMaterial(
  clase: ClaseMaterial,
  id: string,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede editar las fichas.");

  const campos = leerCampos(datos, clase);
  const problema = validar(campos);
  if (problema) return fallo(problema);

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("materiales")
    .update({ ...campos, activo: booleano(datos, "activo") })
    .eq("id", id);

  if (error) return fallo(traducirError(error));

  revalidatePath(rutaDe(clase));
  revalidatePath(`${rutaDe(clase)}/${id}`);
  return exito("Cambios guardados.");
}

/** No se borra: se archiva. El historial y los movimientos se conservan. */
export async function archivarMaterial(
  clase: ClaseMaterial,
  id: string,
  archivar: boolean,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") return fallo("Solo la administradora puede archivar.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("materiales").update({ activo: !archivar }).eq("id", id);
  if (error) return fallo(traducirError(error));

  revalidatePath(rutaDe(clase));
  revalidatePath(`${rutaDe(clase)}/${id}`);
  return exito(archivar ? "Material archivado." : "Material reactivado.");
}
