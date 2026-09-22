import type { ResultadoAccion } from "@/lib/tipos";

/** Traduce los errores de la base de datos a algo que se entienda. */
export function traducirError(error: { message: string; code?: string }): string {
  const m = error.message || "";

  if (error.code === "23505" || m.includes("duplicate key")) {
    if (m.includes("codigo")) return "Ya existe un registro con ese código. Usa otro.";
    if (m.includes("nombre")) return "Ya existe un registro con ese nombre.";
    return "Ese registro ya existe.";
  }
  if (error.code === "23503") {
    return "No se puede borrar: hay movimientos o prendas que dependen de este registro.";
  }
  if (error.code === "42501" || m.includes("row-level security")) {
    return "No tienes permiso para hacer esto. Pídelo a la administradora.";
  }
  if (m.includes("No hay suficiente stock")) {
    return m.replace(/^.*?No hay suficiente/, "No hay suficiente");
  }
  if (m.includes("prendas_tiene_destino")) {
    return "La prenda debe tener una clienta o una colección.";
  }
  return m || "Algo salió mal. Inténtalo de nuevo.";
}

export function fallo(mensaje: string): ResultadoAccion {
  return { ok: false, error: mensaje };
}

export function exito(mensaje?: string): ResultadoAccion {
  return { ok: true, mensaje };
}

/** Lee un texto del formulario; devuelve null si viene vacio. */
export function texto(datos: FormData, campo: string): string | null {
  const valor = datos.get(campo);
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio === "" ? null : limpio;
}

/** Lee un numero del formulario, aceptando coma decimal. */
export function numero(datos: FormData, campo: string): number | null {
  const valor = texto(datos, campo);
  if (valor === null) return null;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function booleano(datos: FormData, campo: string): boolean {
  return datos.get(campo) === "on" || datos.get(campo) === "true";
}
