import { crearClienteServidor } from "@/lib/supabase/servidor";
import type {
  Clienta,
  Coleccion,
  ClaseMaterial,
  EntradaHistorial,
  Material,
  Movimiento,
  Perfil,
  Prenda,
  Proveedor,
} from "@/lib/tipos";

/**
 * Consultas a la base de datos. Todas leen de las vistas, que ya traen el
 * stock calculado y esconden los costos a quien no debe verlos.
 */

export async function listarMateriales(clase: ClaseMaterial): Promise<Material[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("materiales_vista")
    .select("*")
    .eq("clase", clase)
    .order("codigo");
  return (data ?? []) as Material[];
}

export async function obtenerMaterial(id: string): Promise<Material | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("materiales_vista").select("*").eq("id", id).maybeSingle();
  return (data as Material) ?? null;
}

export async function listarProveedores(): Promise<Proveedor[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("proveedores").select("*").order("nombre");
  return (data ?? []) as Proveedor[];
}

export async function listarMovimientos(opciones?: {
  materialId?: string;
  prendaId?: string;
  limite?: number;
}): Promise<Movimiento[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase.from("movimientos_vista").select("*").order("fecha", { ascending: false });

  if (opciones?.materialId) consulta = consulta.eq("material_id", opciones.materialId);
  if (opciones?.prendaId) consulta = consulta.eq("prenda_id", opciones.prendaId);
  if (opciones?.limite) consulta = consulta.limit(opciones.limite);

  const { data } = await consulta;
  return (data ?? []) as Movimiento[];
}

export async function listarPrendas(): Promise<Prenda[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("prendas_vista").select("*").order("creado_en", { ascending: false });
  return (data ?? []) as Prenda[];
}

export async function obtenerPrenda(id: string): Promise<Prenda | null> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("prendas_vista").select("*").eq("id", id).maybeSingle();
  return (data as Prenda) ?? null;
}

export async function listarClientas(): Promise<Clienta[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("clientas").select("*").order("nombre");
  return (data ?? []) as Clienta[];
}

export async function listarColecciones(): Promise<Coleccion[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("colecciones").select("*").order("nombre");
  return (data ?? []) as Coleccion[];
}

export async function listarPerfiles(): Promise<Perfil[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("perfiles").select("*").order("nombre");
  return (data ?? []) as Perfil[];
}

export async function listarHistorial(limite = 200): Promise<EntradaHistorial[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("historial_vista")
    .select("*")
    .order("ocurrido_en", { ascending: false })
    .limit(limite);
  return (data ?? []) as EntradaHistorial[];
}

/** Materiales por debajo de su punto de reposicion. Alimenta las alertas. */
export async function materialesEnAlerta(): Promise<Material[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("materiales_vista")
    .select("*")
    .eq("activo", true)
    .eq("bajo_minimo", true)
    .order("clase")
    .order("codigo");
  return (data ?? []) as Material[];
}

/** Lista corta de materiales para los desplegables de movimientos. */
export async function materialesParaElegir(): Promise<Material[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("materiales_vista")
    .select("*")
    .eq("activo", true)
    .order("clase")
    .order("nombre");
  return (data ?? []) as Material[];
}
