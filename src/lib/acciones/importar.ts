"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ClaseMaterial } from "@/lib/tipos";
import { traducirError } from "./comun";

export type FilaMaterial = {
  codigo: string;
  nombre: string;
  tipo?: string | null;
  unidad?: string | null;
  composicion?: string | null;
  color?: string | null;
  ancho_cm?: number | null;
  costo_unitario?: number | null;
  ubicacion?: string | null;
  punto_reposicion?: number | null;
  proveedor?: string | null;
  stock_inicial?: number | null;
  notas?: string | null;
};

export type ResultadoImportacion = {
  ok: boolean;
  creados: number;
  actualizados: number;
  proveedoresCreados: number;
  error?: string;
  problemas: string[];
};

/**
 * Trae de golpe las fichas de una hoja de calculo.
 * Si un codigo ya existe, se actualiza en vez de duplicarse.
 * Las existencias iniciales entran como movimientos, nunca como stock a mano.
 */
export async function importarMateriales(
  clase: ClaseMaterial,
  _estadoPrevio: ResultadoImportacion | null,
  datos: FormData,
): Promise<ResultadoImportacion> {
  const vacio = { creados: 0, actualizados: 0, proveedoresCreados: 0, problemas: [] };

  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return { ok: false, ...vacio, error: "Solo la administradora puede importar datos." };

  let filas: FilaMaterial[];
  try {
    filas = JSON.parse(String(datos.get("filas") ?? "[]"));
  } catch {
    return { ok: false, ...vacio, error: "No se pudo leer el archivo. Intentalo de nuevo." };
  }

  if (!Array.isArray(filas) || filas.length === 0)
    return { ok: false, ...vacio, error: "No hay filas para importar." };
  if (filas.length > 2000)
    return { ok: false, ...vacio, error: "Son demasiadas filas de una vez. Importa hasta 2000." };

  const supabase = await crearClienteServidor();
  const problemas: string[] = [];

  // 1. Proveedores: se crean los que aun no existan.
  const { data: proveedoresExistentes } = await supabase.from("proveedores").select("id, nombre");
  const porNombre = new Map(
    (proveedoresExistentes ?? []).map((p) => [p.nombre.trim().toLowerCase(), p.id]),
  );

  const nombresNuevos = [
    ...new Set(
      filas
        .map((f) => f.proveedor?.trim())
        .filter((n): n is string => Boolean(n) && !porNombre.has(n!.toLowerCase())),
    ),
  ];

  let proveedoresCreados = 0;
  if (nombresNuevos.length > 0) {
    const { data: insertados, error } = await supabase
      .from("proveedores")
      .insert(nombresNuevos.map((nombre) => ({ nombre, creado_por: perfil.id })))
      .select("id, nombre");

    if (error) {
      problemas.push(`No se pudieron crear algunos proveedores: ${traducirError(error)}`);
    } else {
      proveedoresCreados = insertados?.length ?? 0;
      (insertados ?? []).forEach((p) => porNombre.set(p.nombre.trim().toLowerCase(), p.id));
    }
  }

  // 2. Materiales: se separa lo que ya existe de lo nuevo.
  const { data: existentes } = await supabase
    .from("materiales")
    .select("id, codigo")
    .eq("clase", clase);
  const idPorCodigo = new Map((existentes ?? []).map((m) => [m.codigo.trim().toLowerCase(), m.id]));

  let creados = 0;
  let actualizados = 0;

  for (const [indice, fila] of filas.entries()) {
    const numeroFila = indice + 2; // +1 por la cabecera, +1 porque las hojas empiezan en 1
    const codigo = fila.codigo?.trim();
    const nombre = fila.nombre?.trim();

    if (!codigo || !nombre) {
      problemas.push(`Fila ${numeroFila}: falta el codigo o el nombre. Se omitio.`);
      continue;
    }

    const campos = {
      clase,
      codigo,
      nombre,
      tipo: fila.tipo?.trim() || null,
      unidad: fila.unidad?.trim() || (clase === "tela" ? "metro" : "unidad"),
      composicion: clase === "tela" ? fila.composicion?.trim() || null : null,
      color: clase === "tela" ? fila.color?.trim() || null : null,
      ancho_cm: clase === "tela" ? (fila.ancho_cm ?? null) : null,
      costo_unitario: fila.costo_unitario ?? null,
      ubicacion: fila.ubicacion?.trim() || null,
      punto_reposicion: fila.punto_reposicion ?? 0,
      notas: fila.notas?.trim() || null,
      proveedor_id: fila.proveedor?.trim()
        ? (porNombre.get(fila.proveedor.trim().toLowerCase()) ?? null)
        : null,
    };

    const existente = idPorCodigo.get(codigo.toLowerCase());

    if (existente) {
      const { error } = await supabase.from("materiales").update(campos).eq("id", existente);
      if (error) {
        problemas.push(`Fila ${numeroFila} (${codigo}): ${traducirError(error)}`);
        continue;
      }
      actualizados++;
      continue;
    }

    const { data: creado, error } = await supabase
      .from("materiales")
      .insert({ ...campos, creado_por: perfil.id })
      .select("id")
      .single();

    if (error) {
      problemas.push(`Fila ${numeroFila} (${codigo}): ${traducirError(error)}`);
      continue;
    }

    creados++;
    idPorCodigo.set(codigo.toLowerCase(), creado.id);

    if (fila.stock_inicial && fila.stock_inicial > 0) {
      const { error: falloMovimiento } = await supabase.from("movimientos").insert({
        material_id: creado.id,
        tipo: "entrada",
        cantidad: fila.stock_inicial,
        costo_unitario: campos.costo_unitario,
        motivo: "Existencia inicial (importacion)",
        registrado_por: perfil.id,
      });
      if (falloMovimiento) {
        problemas.push(
          `Fila ${numeroFila} (${codigo}): la ficha se creo pero no se pudo registrar su existencia inicial.`,
        );
      }
    }
  }

  revalidatePath(clase === "tela" ? "/telas" : "/insumos");
  revalidatePath("/movimientos");
  revalidatePath("/proveedores");
  revalidatePath("/");

  return { ok: true, creados, actualizados, proveedoresCreados, problemas };
}
