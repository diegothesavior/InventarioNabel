"use client";

import Link from "next/link";
import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { importarMateriales, type FilaMaterial } from "@/lib/acciones/importar";
import { aNumero, emparejarColumnas, generarCsv, leerCsv } from "@/lib/csv";
import type { ClaseMaterial } from "@/lib/tipos";

type Campo = {
  clave: keyof FilaMaterial;
  titulo: string;
  alias?: string[];
  obligatorio?: boolean;
  numerico?: boolean;
};

const COMUNES: Campo[] = [
  { clave: "codigo", titulo: "Código", alias: ["referencia", "ref", "id", "código interno"], obligatorio: true },
  { clave: "nombre", titulo: "Nombre", alias: ["descripcion", "material", "articulo"], obligatorio: true },
  { clave: "unidad", titulo: "Unidad", alias: ["unidad de medida", "medida", "um"] },
  { clave: "stock_inicial", titulo: "Existencias", alias: ["cantidad", "stock", "metros", "metros disponibles", "disponible", "existencia"], numerico: true },
  { clave: "costo_unitario", titulo: "Costo unitario", alias: ["costo", "precio", "costo por metro", "precio unitario", "valor"], numerico: true },
  { clave: "punto_reposicion", titulo: "Punto de reposición", alias: ["minimo", "stock mínimo", "reposicion", "alerta"], numerico: true },
  { clave: "ubicacion", titulo: "Ubicación", alias: ["lugar", "estante", "bodega", "ubicación física"] },
  { clave: "proveedor", titulo: "Proveedor", alias: ["proveedora", "suministra"] },
  { clave: "notas", titulo: "Notas", alias: ["observaciones", "comentarios"] },
];

const DE_TELA: Campo[] = [
  { clave: "tipo", titulo: "Tipo de tela", alias: ["tipo", "familia", "clase"] },
  { clave: "composicion", titulo: "Composición", alias: ["material", "fibra"] },
  { clave: "color", titulo: "Color", alias: ["tono"] },
  { clave: "ancho_cm", titulo: "Ancho (cm)", alias: ["ancho"], numerico: true },
];

const DE_INSUMO: Campo[] = [{ clave: "tipo", titulo: "Categoría", alias: ["tipo", "familia", "grupo"] }];

function BotonImportar({ cantidad }: { cantidad: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending || cantidad === 0}>
      {pending ? "Importando…" : `Importar ${cantidad} ${cantidad === 1 ? "ficha" : "fichas"}`}
    </button>
  );
}

export function Importador({ clase }: { clase: ClaseMaterial }) {
  const campos = useMemo(
    () => [...(clase === "tela" ? DE_TELA : DE_INSUMO), ...COMUNES],
    [clase],
  );

  const [estado, enviar] = useActionState(importarMateriales.bind(null, clase), null);
  const [cabeceras, setCabeceras] = useState<string[]>([]);
  const [filasCrudas, setFilasCrudas] = useState<string[][]>([]);
  const [mapa, setMapa] = useState<Record<string, number>>({});
  const [errorLectura, setErrorLectura] = useState<string | null>(null);
  const entradaArchivo = useRef<HTMLInputElement>(null);

  function procesar(texto: string) {
    setErrorLectura(null);
    const { cabeceras: cab, filas } = leerCsv(texto);

    if (cab.length === 0 || filas.length === 0) {
      setErrorLectura("El archivo parece vacío. Revisa que tenga una fila de títulos y al menos un dato.");
      setCabeceras([]);
      setFilasCrudas([]);
      return;
    }

    setCabeceras(cab);
    setFilasCrudas(filas);
    setMapa(emparejarColumnas(cab, campos.map((c) => ({ clave: String(c.clave), titulo: c.titulo, alias: c.alias }))));
  }

  async function alSubirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    procesar(await archivo.text());
  }

  const filasListas: FilaMaterial[] = useMemo(() => {
    if (filasCrudas.length === 0) return [];

    return filasCrudas
      .map((fila) => {
        const objeto: Record<string, string | number | null> = {};
        for (const campo of campos) {
          const indice = mapa[String(campo.clave)];
          const valor = indice === undefined ? "" : (fila[indice] ?? "");
          objeto[String(campo.clave)] = campo.numerico ? aNumero(valor) : valor.trim() || null;
        }
        return objeto as unknown as FilaMaterial;
      })
      .filter((f) => f.codigo && f.nombre);
  }, [filasCrudas, mapa, campos]);

  const sinCodigoONombre = filasCrudas.length - filasListas.length;

  function descargarPlantilla() {
    const csv = generarCsv(
      [Object.fromEntries(campos.map((c) => [c.clave, ""]))],
      campos.map((c) => ({ clave: String(c.clave), titulo: c.titulo, valor: () => "" })),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `plantilla-${clase === "tela" ? "telas" : "insumos"}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  // ---- Resultado -------------------------------------------------------
  if (estado?.ok) {
    const ruta = clase === "tela" ? "/telas" : "/insumos";
    return (
      <div className="max-w-2xl space-y-6">
        <div className="aviso aviso-exito">
          Importación terminada: <b>{estado.creados}</b> fichas creadas,{" "}
          <b>{estado.actualizados}</b> actualizadas
          {estado.proveedoresCreados > 0 && <> y {estado.proveedoresCreados} proveedores nuevos</>}.
        </div>

        {estado.problemas.length > 0 && (
          <div className="tarjeta px-6 py-5">
            <h2 className="antetitulo mb-3">Filas que no entraron</h2>
            <ul className="space-y-1 text-sm text-grafito">
              {estado.problemas.slice(0, 30).map((p, i) => (
                <li key={i}>· {p}</li>
              ))}
            </ul>
            {estado.problemas.length > 30 && (
              <p className="ayuda">Y {estado.problemas.length - 30} mas.</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={ruta} className="boton boton-principal">
            Ver el inventario
          </Link>
          <button type="button" className="boton boton-secundario" onClick={() => location.reload()}>
            Importar otro archivo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Paso 1: archivo */}
      <section className="max-w-3xl">
        <h2 className="antetitulo mb-4">1 · Elige el archivo</h2>

        <div className="tarjeta px-6 py-7">
          <p className="text-grafito">
            Desde Excel o Google Sheets: <b>Archivo → Descargar → CSV</b>. Después sube ese
            archivo aquí. La primera fila debe tener los títulos de las columnas.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <input
              ref={entradaArchivo}
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={alSubirArchivo}
              className="hidden"
            />
            <button
              type="button"
              className="boton boton-principal"
              onClick={() => entradaArchivo.current?.click()}
            >
              Elegir archivo CSV
            </button>
            <button type="button" className="boton boton-secundario" onClick={descargarPlantilla}>
              Descargar plantilla
            </button>
          </div>

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-humo">
              O pegar los datos copiados de la hoja
            </summary>
            <textarea
              className="campo mt-3 min-h-40 font-mono text-sm"
              placeholder="Pega aquí las celdas copiadas, con la fila de títulos incluida"
              onChange={(e) => e.target.value.trim() && procesar(e.target.value)}
            />
          </details>

          {errorLectura && <p className="ayuda text-alerta">{errorLectura}</p>}
        </div>
      </section>

      {/* Paso 2: emparejar columnas */}
      {cabeceras.length > 0 && (
        <section className="max-w-3xl">
          <h2 className="antetitulo mb-4">2 · Revisa las columnas</h2>
          <p className="mb-5 text-grafito">
            Esto es lo que entendimos de tu archivo. Corrige lo que no cuadre; lo que no
            necesites, déjalo en «No importar».
          </p>

          <div className="tarjeta divide-y divide-lino">
            {campos.map((campo) => (
              <div key={String(campo.clave)} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span>{campo.titulo}</span>
                  {campo.obligatorio && <span className="ml-1 text-alerta">*</span>}
                </div>
                <select
                  className="campo w-full sm:w-64"
                  value={mapa[String(campo.clave)] ?? ""}
                  onChange={(e) =>
                    setMapa((previo) => {
                      const copia = { ...previo };
                      if (e.target.value === "") delete copia[String(campo.clave)];
                      else copia[String(campo.clave)] = Number(e.target.value);
                      return copia;
                    })
                  }
                >
                  <option value="">No importar</option>
                  {cabeceras.map((c, i) => (
                    <option key={i} value={i}>
                      {c || `Columna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paso 3: revisar y confirmar */}
      {filasCrudas.length > 0 && (
        <section>
          <h2 className="antetitulo mb-4">3 · Comprueba y confirma</h2>

          <p className="mb-4 text-grafito">
            Se importarán <b>{filasListas.length}</b> fichas.
            {sinCodigoONombre > 0 && (
              <span className="text-alerta">
                {" "}
                {sinCodigoONombre} {sinCodigoONombre === 1 ? "fila quedará fuera" : "filas quedarán fuera"} por
                no tener codigo o nombre.
              </span>
            )}{" "}
            Si un codigo ya existe en el sistema, esa ficha se actualiza en vez de duplicarse.
          </p>

          {filasListas.length > 0 && (
            <div className="tarjeta mb-6 overflow-x-auto">
              <table className="tabla">
                <thead>
                  <tr>
                    {campos
                      .filter((c) => mapa[String(c.clave)] !== undefined)
                      .map((c) => (
                        <th key={String(c.clave)}>{c.titulo}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {filasListas.slice(0, 5).map((fila, i) => (
                    <tr key={i}>
                      {campos
                        .filter((c) => mapa[String(c.clave)] !== undefined)
                        .map((c) => (
                          <td key={String(c.clave)} className={c.numerico ? "numerico" : ""}>
                            {String(fila[c.clave] ?? "—")}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filasListas.length > 5 && (
                <p className="px-5 py-3 text-sm text-humo">
                  Vista previa de las primeras 5 de {filasListas.length}.
                </p>
              )}
            </div>
          )}

          <form action={enviar}>
            <input type="hidden" name="filas" value={JSON.stringify(filasListas)} />
            {estado && !estado.ok && estado.error && (
              <div className="aviso aviso-error mb-5">{estado.error}</div>
            )}
            <BotonImportar cantidad={filasListas.length} />
          </form>
        </section>
      )}
    </div>
  );
}
