"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ETAPAS } from "@/lib/config";
import { descargarCsv, type Columna } from "@/lib/csv";
import { dinero, fechaCorta, normalizar } from "@/lib/formato";
import type { Prenda } from "@/lib/tipos";
import { Distintivo } from "./ui";

const HOY = () => new Date().toISOString().slice(0, 10);

function etiquetaEtapa(valor: string) {
  return ETAPAS.find((e) => e.valor === valor)?.etiqueta ?? valor;
}

export function TableroPrendas({ prendas, esAdmin }: { prendas: Prenda[]; esAdmin: boolean }) {
  const [vista, setVista] = useState<"tablero" | "tabla">("tablero");
  const [busqueda, setBusqueda] = useState("");
  const [responsable, setResponsable] = useState("");
  const [destino, setDestino] = useState("");

  const responsables = useMemo(
    () => [...new Set(prendas.map((p) => p.responsable_nombre).filter(Boolean))].sort() as string[],
    [prendas],
  );

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda);
    return prendas.filter((p) => {
      if (responsable && p.responsable_nombre !== responsable) return false;
      if (destino === "clienta" && !p.clienta_id) return false;
      if (destino === "coleccion" && !p.coleccion_id) return false;
      if (!termino) return true;
      const texto = normalizar(
        [p.codigo, p.nombre, p.clienta_nombre, p.coleccion_nombre, p.responsable_nombre, p.talla]
          .filter(Boolean)
          .join(" "),
      );
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [prendas, busqueda, responsable, destino]);

  function exportar() {
    const columnas: Columna<Prenda>[] = [
      { clave: "codigo", titulo: "Código", valor: (p) => p.codigo },
      { clave: "nombre", titulo: "Prenda", valor: (p) => p.nombre },
      { clave: "clienta", titulo: "Clienta", valor: (p) => p.clienta_nombre },
      { clave: "coleccion", titulo: "Colección", valor: (p) => p.coleccion_nombre },
      { clave: "etapa", titulo: "Etapa", valor: (p) => etiquetaEtapa(p.etapa) },
      { clave: "responsable", titulo: "Responsable", valor: (p) => p.responsable_nombre },
      { clave: "talla", titulo: "Talla", valor: (p) => p.talla },
      { clave: "entrega", titulo: "Entrega estimada", valor: (p) => p.fecha_estimada_entrega },
      ...(esAdmin
        ? ([
            { clave: "costo_materiales", titulo: "Costo de materiales", valor: (p) => p.costo_materiales },
            { clave: "precio_venta", titulo: "Precio de venta", valor: (p) => p.precio_venta },
            { clave: "margen", titulo: "Margen", valor: (p) => p.margen },
          ] as Columna<Prenda>[])
        : []),
    ];
    descargarCsv("prendas-en-proceso", filtradas, columnas);
  }

  return (
    <div>
      <div className="sin-imprimir mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            className="campo md:flex-1"
            placeholder="Buscar por prenda, clienta, colección o responsable…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="flex gap-3">
            <div className="flex border border-arena">
              <button
                type="button"
                onClick={() => setVista("tablero")}
                className={`min-h-12 px-4 text-sm ${vista === "tablero" ? "bg-tinta text-hueso" : "bg-papel"}`}
              >
                Tablero
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
          {responsables.length > 0 && (
            <select
              className="campo w-auto min-w-44"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
            >
              <option value="">Responsable: todas</option>
              {responsables.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
          <select className="campo w-auto min-w-44" value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">A medida y colección</option>
            <option value="clienta">Solo a medida</option>
            <option value="coleccion">Solo colecciones</option>
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
      ) : vista === "tablero" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {ETAPAS.map((etapa) => {
            const deEtapa = filtradas.filter((p) => p.etapa === etapa.valor);
            return (
              <section key={etapa.valor}>
                <div className="mb-3 flex items-baseline justify-between border-b border-arena pb-2">
                  <h2 className="font-display text-lg">{etapa.etiqueta}</h2>
                  <span className="text-sm text-humo">{deEtapa.length}</span>
                </div>

                {deEtapa.length === 0 ? (
                  <p className="py-6 text-center text-sm text-piedra">Vacío</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {deEtapa.map((p) => (
                      <TarjetaPrenda key={p.id} prenda={p} esAdmin={esAdmin} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="tarjeta overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Prenda</th>
                <th>Para</th>
                <th>Etapa</th>
                <th>Responsable</th>
                <th>Entrega</th>
                {esAdmin && <th className="numerico">Costo</th>}
                {esAdmin && <th className="numerico">Margen</th>}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => {
                const atrasada = Boolean(p.fecha_estimada_entrega && p.fecha_estimada_entrega < HOY());
                return (
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
                      <Distintivo>{etiquetaEtapa(p.etapa)}</Distintivo>
                    </td>
                    <td className="text-grafito">{p.responsable_nombre ?? "—"}</td>
                    <td className={atrasada ? "text-alerta" : "text-grafito"}>
                      {fechaCorta(p.fecha_estimada_entrega)}
                    </td>
                    {esAdmin && <td className="numerico">{dinero(p.costo_materiales)}</td>}
                    {esAdmin && (
                      <td className="numerico">
                        {p.margen === null ? "—" : dinero(p.margen)}
                        {p.margen_porcentaje !== null && (
                          <span className="block text-xs text-humo">{p.margen_porcentaje}%</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TarjetaPrenda({ prenda, esAdmin }: { prenda: Prenda; esAdmin: boolean }) {
  const atrasada = Boolean(prenda.fecha_estimada_entrega && prenda.fecha_estimada_entrega < HOY());

  return (
    <Link href={`/prendas/${prenda.id}`} className="tarjeta block transition-colors hover:border-piedra">
      {prenda.foto_url && (
        <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-arena bg-lino">
          <Image
            src={prenda.foto_url}
            alt={prenda.nombre}
            fill
            sizes="(max-width: 1280px) 50vw, 260px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="px-4 py-4">
        <p className="antetitulo">{prenda.codigo}</p>
        <p className="mt-1 leading-snug">{prenda.nombre}</p>
        <p className="mt-1 text-sm text-humo">
          {prenda.clienta_nombre ?? prenda.coleccion_nombre ?? "—"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {prenda.fecha_estimada_entrega && (
            <span className={atrasada ? "text-alerta" : "text-grafito"}>
              {atrasada ? "Atrasada: " : "Entrega "}
              {fechaCorta(prenda.fecha_estimada_entrega)}
            </span>
          )}
        </div>

        {prenda.responsable_nombre && (
          <p className="mt-2 text-sm text-humo">{prenda.responsable_nombre}</p>
        )}

        {esAdmin && prenda.costo_materiales !== null && prenda.costo_materiales > 0 && (
          <p className="mt-3 border-t border-lino pt-2 text-sm text-grafito">
            Materiales: {dinero(prenda.costo_materiales)}
          </p>
        )}
      </div>
    </Link>
  );
}
