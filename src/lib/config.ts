/**
 * Ajustes generales. Todo lo que el taller podria querer cambiar sin tocar
 * el resto del codigo vive aqui.
 */
export const MARCA = "Nabek Martins";
export const NOMBRE_APP = "Inventario";

/** Moneda y formato de numeros. Se cambia con variables de entorno. */
export const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "es-CO";
export const MONEDA = process.env.NEXT_PUBLIC_MONEDA || "COP";

/** Unidades de medida disponibles al crear un material. */
export const UNIDADES = [
  { valor: "metro", etiqueta: "Metros" },
  { valor: "unidad", etiqueta: "Unidades" },
  { valor: "par", etiqueta: "Pares" },
  { valor: "rollo", etiqueta: "Rollos" },
  { valor: "gramo", etiqueta: "Gramos" },
  { valor: "kilo", etiqueta: "Kilos" },
  { valor: "cono", etiqueta: "Conos" },
  { valor: "metro2", etiqueta: "Metros cuadrados" },
] as const;

/** Sugerencias de categoria para insumos (el campo admite cualquier texto). */
export const CATEGORIAS_INSUMO = [
  "Botones",
  "Cierres",
  "Hilos",
  "Entretelas",
  "Pedreria",
  "Encajes",
  "Cintas",
  "Forros",
  "Elasticos",
  "Broches",
  "Etiquetas",
  "Otros",
];

/** Sugerencias de tipo para telas (el campo admite cualquier texto). */
export const TIPOS_TELA = [
  "Seda",
  "Lino",
  "Algodon",
  "Lana",
  "Tul",
  "Organza",
  "Gasa",
  "Crepe",
  "Satin",
  "Terciopelo",
  "Encaje",
  "Otros",
];

export const ETAPAS = [
  { valor: "patronaje", etiqueta: "Patronaje" },
  { valor: "corte", etiqueta: "Corte" },
  { valor: "confeccion", etiqueta: "Confeccion" },
  { valor: "prueba", etiqueta: "Prueba" },
  { valor: "acabados", etiqueta: "Acabados" },
] as const;

export const ESTADOS_PRENDA = [
  { valor: "en_proceso", etiqueta: "En proceso" },
  { valor: "terminada", etiqueta: "Terminada" },
  { valor: "disponible", etiqueta: "Disponible" },
  { valor: "reservada", etiqueta: "Reservada" },
  { valor: "entregada", etiqueta: "Entregada" },
] as const;
