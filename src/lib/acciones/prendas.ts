"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { perfilActual } from "@/lib/supabase/sesion";
import type { EstadoPrenda, EtapaPrenda, ResultadoAccion } from "@/lib/tipos";
import { exito, fallo, numero, texto, traducirError } from "./comun";

const ETAPAS: EtapaPrenda[] = ["patronaje", "corte", "confeccion", "prueba", "acabados"];
const ESTADOS: EstadoPrenda[] = ["en_proceso", "terminada", "disponible", "reservada", "entregada"];

function refrescar(id?: string) {
  revalidatePath("/prendas");
  revalidatePath("/terminadas");
  revalidatePath("/");
  if (id) revalidatePath(`/prendas/${id}`);
}

export async function guardarPrenda(
  id: string | null,
  _estadoPrevio: ResultadoAccion | null,
  datos: FormData,
): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  const esAdmin = perfil.rol === "administradora";

  const codigo = texto(datos, "codigo");
  const nombre = texto(datos, "nombre");
  const clienta_id = texto(datos, "clienta_id");
  const coleccion_id = texto(datos, "coleccion_id");
  const etapa = texto(datos, "etapa") as EtapaPrenda | null;
  const estado = texto(datos, "estado") as EstadoPrenda | null;

  if (!codigo) return fallo("El código de la prenda es obligatorio.");
  if (!nombre) return fallo("El nombre de la prenda es obligatorio.");
  if (!clienta_id && !coleccion_id)
    return fallo("Indica para quién es: una clienta, una colección o las dos.");
  if (etapa && !ETAPAS.includes(etapa)) return fallo("Elige una etapa válida.");
  if (estado && !ESTADOS.includes(estado)) return fallo("Elige un estado válido.");

  const campos: Record<string, unknown> = {
    codigo,
    nombre,
    clienta_id,
    coleccion_id,
    etapa: etapa ?? "patronaje",
    estado: estado ?? "en_proceso",
    responsable_id: texto(datos, "responsable_id"),
    talla: texto(datos, "talla"),
    fecha_estimada_entrega: texto(datos, "fecha_estimada_entrega"),
    fecha_entrega_real: texto(datos, "fecha_entrega_real"),
    foto_url: texto(datos, "foto_url"),
    notas: texto(datos, "notas"),
  };

  // El precio de venta solo lo toca la administradora.
  if (esAdmin) campos.precio_venta = numero(datos, "precio_venta");

  const supabase = await crearClienteServidor();

  if (id) {
    const { error } = await supabase.from("prendas").update(campos).eq("id", id);
    if (error) return fallo(traducirError(error));
    refrescar(id);
    return exito("Cambios guardados.");
  }

  const { data, error } = await supabase
    .from("prendas")
    .insert({ ...campos, creado_por: perfil.id })
    .select("id")
    .single();

  if (error) return fallo(traducirError(error));

  refrescar();
  redirect(`/prendas/${data.id}?creado=1`);
}

/** Avanzar o retroceder de etapa desde la ficha, sin abrir el formulario. */
export async function cambiarEtapa(id: string, etapa: EtapaPrenda): Promise<ResultadoAccion> {
  await perfilActual();
  if (!ETAPAS.includes(etapa)) return fallo("Etapa no válida.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("prendas").update({ etapa }).eq("id", id);
  if (error) return fallo(traducirError(error));

  refrescar(id);
  return exito("Etapa actualizada.");
}

export async function cambiarEstado(id: string, estado: EstadoPrenda): Promise<ResultadoAccion> {
  await perfilActual();
  if (!ESTADOS.includes(estado)) return fallo("Estado no válido.");

  const campos: Record<string, unknown> = { estado };
  // Al entregarla se guarda la fecha real si no estaba puesta.
  if (estado === "entregada") campos.fecha_entrega_real = new Date().toISOString().slice(0, 10);

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("prendas").update(campos).eq("id", id);
  if (error) return fallo(traducirError(error));

  refrescar(id);
  return exito("Estado actualizado.");
}

export async function eliminarPrenda(id: string): Promise<ResultadoAccion> {
  const perfil = await perfilActual();
  if (perfil.rol !== "administradora") return fallo("Solo la administradora puede eliminar prendas.");

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("prendas").delete().eq("id", id);
  if (error) return fallo(traducirError(error));

  refrescar();
  redirect("/prendas");
}
