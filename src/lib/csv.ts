/**
 * Exportar e importar tablas en formato CSV (se abre en Excel, Numbers y
 * Google Sheets). Sin librerias externas: son pocas reglas y asi no
 * dependemos de nada que pueda quedar sin mantenimiento.
 */

export type Columna<T> = {
  clave: string;
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
};

function escapar(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",;\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Genera el texto CSV. Se usa punto y coma porque es lo que espera Excel
 * en configuraciones en espanol, y se antepone el BOM para que las tildes
 * y la n con tilde se vean bien al abrirlo.
 */
export function generarCsv<T>(filas: T[], columnas: Columna<T>[]): string {
  const cabecera = columnas.map((c) => escapar(c.titulo)).join(";");
  const cuerpo = filas.map((fila) =>
    columnas.map((c) => escapar(c.valor(fila))).join(";"),
  );
  return "﻿" + [cabecera, ...cuerpo].join("\r\n");
}

/** Descarga el CSV en el navegador. */
export function descargarCsv<T>(nombreArchivo: string, filas: T[], columnas: Columna<T>[]) {
  const csv = generarCsv(filas, columnas);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  const fecha = new Date().toISOString().slice(0, 10);
  enlace.href = url;
  enlace.download = `${nombreArchivo}-${fecha}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/**
 * Lee un CSV pegado o subido. Acepta separador ; o , (detecta cual usa el
 * archivo), comillas y saltos de linea dentro de las celdas.
 */
export function leerCsv(texto: string): { cabeceras: string[]; filas: string[][] } {
  const limpio = texto.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const separador = detectarSeparador(limpio);

  const filas: string[][] = [];
  let campo = "";
  let fila: string[] = [];
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];

    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(campo.trim());
      campo = "";
    } else if (c === "\n") {
      fila.push(campo.trim());
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }

  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo.trim());
    filas.push(fila);
  }

  const utiles = filas.filter((f) => f.some((celda) => celda !== ""));
  if (utiles.length === 0) return { cabeceras: [], filas: [] };

  return { cabeceras: utiles[0], filas: utiles.slice(1) };
}

function detectarSeparador(texto: string): string {
  const primeraLinea = texto.split("\n")[0] || "";
  const puntoYComa = (primeraLinea.match(/;/g) || []).length;
  const coma = (primeraLinea.match(/,/g) || []).length;
  const tabulador = (primeraLinea.match(/\t/g) || []).length;
  if (tabulador > puntoYComa && tabulador > coma) return "\t";
  return coma > puntoYComa ? "," : ";";
}

/** Convierte "12,5" o "$ 12.500" en un numero. Tolera formatos mezclados. */
export function aNumero(valor: string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).replace(/[^\d,.\-]/g, "").trim();
  if (limpio === "" || limpio === "-") return null;

  const ultimaComa = limpio.lastIndexOf(",");
  const ultimoPunto = limpio.lastIndexOf(".");
  let normalizado = limpio;

  if (ultimaComa > -1 && ultimoPunto > -1) {
    // El separador decimal es el que aparece mas a la derecha.
    if (ultimaComa > ultimoPunto) {
      normalizado = limpio.replace(/\./g, "").replace(",", ".");
    } else {
      normalizado = limpio.replace(/,/g, "");
    }
  } else if (ultimaComa > -1) {
    const decimales = limpio.length - ultimaComa - 1;
    normalizado = decimales === 3 ? limpio.replace(/,/g, "") : limpio.replace(",", ".");
  } else if (ultimoPunto > -1) {
    const decimales = limpio.length - ultimoPunto - 1;
    // "12.500" con tres decimales suele ser separador de miles.
    normalizado = decimales === 3 ? limpio.replace(/\./g, "") : limpio;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/** Empareja cabeceras del archivo con los campos esperados, sin tildes ni mayusculas. */
export function emparejarColumnas(
  cabeceras: string[],
  campos: { clave: string; titulo: string; alias?: string[] }[],
): Record<string, number> {
  const normalizar = (t: string) =>
    t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const indicePorTexto = new Map<string, number>();
  cabeceras.forEach((c, i) => {
    const clave = normalizar(c);
    if (clave && !indicePorTexto.has(clave)) indicePorTexto.set(clave, i);
  });

  const resultado: Record<string, number> = {};
  for (const campo of campos) {
    const candidatos = [campo.clave, campo.titulo, ...(campo.alias || [])];
    for (const candidato of candidatos) {
      const i = indicePorTexto.get(normalizar(candidato));
      if (i !== undefined) {
        resultado[campo.clave] = i;
        break;
      }
    }
  }
  return resultado;
}
