"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ESTADOS_PRENDA } from "@/lib/config";
import { descargarCsv, type Columna } from "@/lib/csv";
import { dinero, fechaCorta, normalizar } from "@/lib/formato";
import type { Prenda } from "@/lib/tipos";
import { Distintivo } from "./ui";

function etiquetaEstado(valor: string) {
  return ESTADOS_PRENDA.find((e) => e.valor === valor)?.etiqueta ?? valor;
}

function tonoEstado(valor: string) {
  if (valor === "disponible") return "bien" as const;
  if (valor === "reservada") return "alerta" as const;
  return "neutro" as const;
}

export function GaleriaTerminadas({ prendas, esAdmin }: { prendas: Prenda[]; esAdmin: boolean }) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [vista, setVista] = useState<"galeria" | "tabla">("galeria");

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda);
    return prendas.filter((p) => {
      if (estado && p.estado !== estado) return false;
      if (!termino) return true;
      const texto = normalizar(
        [p.codigo, p.nombre, p.clienta_nombre, p.coleccion_nombre, p.talla].filter(Boolean).join(" "),
      );
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [prendas, busqueda, estado]);

  function exportar() {
    const columnas: Columna<Prenda>[] = [
      { clave: "codigo", titulo: "Codigo", valor: (p) => p.codigo },
      { clave: "nombre", titulo: "Prenda", valor: (p) => p.nombre },
      { clave: "clienta", titulo: "Clienta", valor: (p) => p.clienta_nombre },
      { clave: "coleccion", titulo: "Coleccion", valor: (p) => p.coleccion_nombre },
      { clave: "estado", titulo: "Estado", valor: (p) => etiquetaEstado(p.estado) },
      { clave: "talla", titulo: "Talla", valor: (p) => p.talla },
      { clave: "entrega_real", titulo: "Entregada el", valor: (p) => p.fecha_entrega_real },
      ...(esAdmin
        ? ([
            { clave: "precio_venta", titulo: "Precio", valor: (p) => p.precio_venta },
            { clave: "costo_materiales", titulo: "Costo de materiales", valor: (p) => p.costo_materiales },
            { clave: "margen", titulo: "Margen", valor: (p) => p.margen },
          ] as Columna<Prenda>[])
        : []),
    ];
    descargarCsv("prendas-terminadas", filtradas, columnas);
  }

  return (
    <div>
      <div className="sin-imprimir mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            className="campo md:flex-1"
            placeholder="Buscar por prenda, clienta o coleccion…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="flex gap-3">
            <div className="flex border border-arena">
              <button
                type="button"
                onClick={() => setVista("galeria")}
                className={`min-h-12 px-4 text-sm ${vista === "galeria" ? "bg-tinta text-hueso" : "bg-papel"}`}
              >
                Galeria
              </button>
              <button
                type="button"
                onClick={() => setVista("tabla")}
                className={`min-h-12 px-4 text-sm ${vista === "tabla" ? "bg-tinta text-hueso" : "bg-papel"}`}
              >
                Lista
              </button>
            </div>
            <button type="button" className="boton boton-secundario" onClick={exportar}>
              Exportar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select className="campo w-auto min-w-48" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS_PRENDA.filter((e) => e.valor !== "en_proceso").map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
          <p className="text-sm text-humo">
            {filtradas.length} {filtradas.length === 1 ? "prenda" : "prendas"}
          </p>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-grafito">
          Ninguna prenda coincide con lo que buscas.
        </div>
      ) : vista === "galeria" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((p) => (
            <Link key={p.id} href={`/prendas/${p.id}`} className="group block">
              <div className="relative aspect-[3/4] w-full overflow-hidden border border-arena bg-lino">
                {p.foto_url ? (
                  <Image
                    src={p.foto_url}
                    alt={p.nombre}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 300px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-sm text-piedra">
                    Sin foto
                  </span>
                )}
                <span className="absolute left-3 top-3">
                  <Distintivo tono={tonoEstado(p.estado)}>{etiquetaEstado(p.estado)}</Distintivo>
                </span>
              </div>

              <div className="mt-3">
                <p className="antetitulo">{p.codigo}</p>
                <p className="mt-1 leading-snug">{p.nombre}</p>
                <p className="text-sm text-humo">
                  {p.clienta_nombre ?? p.coleccion_nombre ?? "—"}
                </p>
                {esAdmin && p.precio_venta !== null && (
                  <p className="mt-1 text-sm">{dinero(p.precio_venta)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="tarjeta overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Prenda</th>
                <th>Para</th>
                <th>Estado</th>
                <th>Entregada</th>
                {esAdmin && <th className="numerico">Precio</th>}
                {esAdmin && <th className="numerico">Margen</th>}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      href={`/prendas/${p.id}`}
                      className="underline decoration-arena underline-offset-4 hover:decoration-tinta"
                    >
                      {p.codigo}
                    </Link>
                  </td>
                  <td>{p.nombre}</td>
                  <td className="text-grafito">{p.clienta_nombre ?? p.coleccion_nombre ?? "—"}</td>
                  <td>
                    <Distintivo tono={tonoEstado(p.estado)}>{etiquetaEstado(p.estado)}</Distintivo>
                  </td>
                  <td className="text-grafito">{fechaCorta(p.fecha_entrega_real)}</td>
                  {esAdmin && <td className="numerico">{dinero(p.precio_venta)}</td>}
                  {esAdmin && (
                    <td className="numerico">
                      {dinero(p.margen)}
                      {p.margen_porcentaje !== null && (
                        <span className="block text-xs text-humo">{p.margen_porcentaje}%</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
