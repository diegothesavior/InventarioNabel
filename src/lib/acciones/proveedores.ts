"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ResultadoAccion } from "@/lib/tipos";
import { booleano, exito, fallo, numero, texto, traducirError } from "./comun";

export async function guardarProveedor(
  id: string | null,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora")
    return fallo("Solo la administradora puede gestionar proveedores.");

  const campos = {
    nombre: texto(datos, "nombre"),
    contacto: texto(datos, "contacto"),
    telefono: texto(datos, "telefono"),
    email: texto(datos, "email"),
    suministra: texto(datos, "suministra"),
    dias_entrega: numero(datos, "dias_entrega"),
    notas: texto(datos, "notas"),
  };

  if (!campos.nombre) return fallo("El nombre del proveedor es obligatorio.");
  if (campos.dias_entrega !== null && campos.dias_entrega < 0)
    return fallo("Los días de entrega no pueden ser negativos.");

  const supabase = await crearClienteServidor();

  const { error } = id
    ? await supabase
        .from("proveedores")
        .update({ ...campos, activo: booleano(datos, "activo") })
        .eq("id", id)
    : await supabase.from("proveedores").insert({ ...campos, creado_por: perfil.id });

  if (error) return fallo(traducirError(error));

  revalidatePath("/proveedores");
  return exito(id ? "Proveedor actualizado." : "Proveedor creado.");
}

export async function archivarProveedor(id: string, archivar: boolean): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") return fallo("Solo la administradora puede archivar.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("proveedores").update({ activo: !archivar }).eq("id", id);
  if (error) return fallo(traducirError(error));

  revalidatePath("/proveedores");
  return exito(archivar ? "Proveedor archivado." : "Proveedor reactivado.");
}
