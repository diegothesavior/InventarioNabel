"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ResultadoAccion, TipoMovimiento } from "@/lib/tipos";
import { exito, fallo, numero, texto, traducirError } from "./comun";

const TIPOS: TipoMovimiento[] = ["entrada", "salida", "ajuste"];

/**
 * Registra una entrada, una salida o un ajuste.
 * El stock no se toca nunca directamente: sale de la suma de estos registros.
 */
export async function registrarMovimiento(
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();

  const material_id = texto(datos, "material_id");
  const tipoCrudo = texto(datos, "tipo");
  const cantidad = numero(datos, "cantidad");
  const motivo = texto(datos, "motivo");
  const prenda_id = texto(datos, "prenda_id");
  const fecha = texto(datos, "fecha");

  if (!material_id) return fallo("Elige el material.");
  if (!tipoCrudo || !TIPOS.includes(tipoCrudo as TipoMovimiento))
    return fallo("Elige si es entrada, salida o ajuste.");
  const tipo = tipoCrudo as TipoMovimiento;

  if (cantidad === null) return fallo("Escribe la cantidad.");
  if (tipo !== "ajuste" && cantidad <= 0) return fallo("La cantidad debe ser mayor que cero.");
  if (tipo === "ajuste" && cantidad === 0)
    return fallo("Un ajuste no puede ser de cero. Usa un numero positivo o negativo.");

  const supabase = await crearClienteServidor();

  // Solo la administradora fija costos a mano; al equipo se le copia el del material.
  const costoManual = perfil.rol === "administradora" ? numero(datos, "costo_unitario") : null;

  const { error } = await supabase.from("movimientos").insert({
    material_id,
    tipo,
    cantidad,
    costo_unitario: costoManual,
    prenda_id,
    motivo,
    fecha: fecha ? new Date(fecha).toISOString() : undefined,
    registrado_por: perfil.id,
  });

  if (error) return fallo(traducirError(error));

  revalidatePath("/movimientos");
  revalidatePath("/telas");
  revalidatePath("/insumos");
  revalidatePath(`/telas/${material_id}`);
  revalidatePath(`/insumos/${material_id}`);
  revalidatePath("/");
  if (prenda_id) revalidatePath(`/prendas/${prenda_id}`);

  return exito("Movimiento registrado.");
}

/** Un movimiento no se borra: se anula dejando constancia de por que. */
export async function anularMovimiento(
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede anular movimientos.");

  const id = texto(datos, "id");
  const motivo = texto(datos, "motivo_anulacion");
  if (!id) return fallo("Falta el movimiento.");
  if (!motivo) return fallo("Escribe por que se anula. Queda en el historial.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("movimientos")
    .update({
      anulado: true,
      anulado_en: new Date().toISOString(),
      anulado_por: perfil.id,
      motivo_anulacion: motivo,
    })
    .eq("id", id);

  if (error) return fallo(traducirError(error));

  revalidatePath("/movimientos");
  revalidatePath("/telas");
  revalidatePath("/insumos");
  revalidatePath("/");
  return exito("Movimiento anulado.");
}
