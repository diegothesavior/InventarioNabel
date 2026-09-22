import { LOCALE, MONEDA } from "./config";

/** Dinero: $ 120.000 */
export function dinero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: MONEDA,
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Cantidad con su unidad: 12,5 metros */
export function cantidad(valor: number | null | undefined, unidad?: string | null): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const numero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(valor);
  return unidad ? `${numero} ${etiquetaUnidad(unidad, valor)}` : numero;
}

export function numero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 }).format(valor);
}

const UNIDADES_TEXTO: Record<string, [string, string]> = {
  metro: ["metro", "metros"],
  unidad: ["unidad", "unidades"],
  par: ["par", "pares"],
  rollo: ["rollo", "rollos"],
  gramo: ["gramo", "gramos"],
  kilo: ["kilo", "kilos"],
  cono: ["cono", "conos"],
  metro2: ["m²", "m²"],
};

export function etiquetaUnidad(unidad: string, valor = 2): string {
  const par = UNIDADES_TEXTO[unidad];
  if (!par) return unidad;
  return Math.abs(valor) === 1 ? par[0] : par[1];
}

/** 14 de marzo de 2026 */
export function fechaLarga(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

/** 14/03/2026 */
export function fechaCorta(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** 14/03/2026, 09:30 */
export function fechaHora(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** "hace 3 días" */
export function haceTiempo(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(d.getTime())) return "—";
  const segundos = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const tramos: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  let anterior = 1;
  for (const [limite, unidad] of tramos) {
    if (Math.abs(segundos) < limite) {
      return rtf.format(Math.round(segundos / anterior), unidad);
    }
    anterior = limite;
  }
  return rtf.format(Math.round(segundos / 31557600), "year");
}

/** Quita tildes y pasa a minusculas, para buscar sin preocuparse de acentos. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
