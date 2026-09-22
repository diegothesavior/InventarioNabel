"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { anularMovimiento } from "@/lib/acciones/movimientos";
import { descargarCsv, type Columna } from "@/lib/csv";
import { cantidad, dinero, fechaHora, normalizar } from "@/lib/formato";
import type { Movimiento } from "@/lib/tipos";
import { Distintivo } from "./ui";

export function TablaMovimientos({
  movimientos,
  esAdmin,
}: {
  movimientos: Movimiento[];
  esAdmin: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [verAnulados, setVerAnulados] = useState(false);
  const [anulando, setAnulando] = useState<Movimiento | null>(null);

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    return movimientos.filter((m) => {
      if (!verAnulados && m.anulado) return false;
      if (tipo && m.tipo !== tipo) return false;
      if (desde && m.fecha < desde) return false;
      if (hasta && m.fecha > `${hasta}T23:59:59`) return false;
      if (!termino) return true;
      const texto = normalizar(
        [m.material_codigo, m.material_nombre, m.prenda_nombre, m.prenda_codigo, m.motivo, m.registrado_por_nombre]
          .filter(Boolean)
          .join(" "),
      );
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [movimientos, busqueda, tipo, desde, hasta, verAnulados]);

  function exportar() {
    const columnas: Columna<Movimiento>[] = [
      { clave: "fecha", titulo: "Fecha", valor: (m) => fechaHora(m.fecha) },
      { clave: "tipo", titulo: "Tipo", valor: (m) => m.tipo },
      { clave: "material_codigo", titulo: "Código material", valor: (m) => m.material_codigo },
      { clave: "material_nombre", titulo: "Material", valor: (m) => m.material_nombre },
      { clave: "cantidad", titulo: "Cantidad", valor: (m) => m.cantidad_efectiva },
      { clave: "unidad", titulo: "Unidad", valor: (m) => m.material_unidad },
      { clave: "prenda", titulo: "Prenda", valor: (m) => m.prenda_nombre },
      { clave: "motivo", titulo: "Nota", valor: (m) => m.motivo },
      { clave: "registrado_por", titulo: "Registrado por", valor: (m) => m.registrado_por_nombre },
      ...(esAdmin
        ? ([
            { clave: "costo_unitario", titulo: "Costo unitario", valor: (m) => m.costo_unitario },
            { clave: "costo_total", titulo: "Costo total", valor: (m) => m.costo_total },
          ] as Columna<Movimiento>[])
        : []),
      { clave: "anulado", titulo: "Anulado", valor: (m) => (m.anulado ? "Sí" : "No") },
    ];
    descargarCsv("movimientos", filtrados, columnas);
  }

  return (
    <div>
      <div className="sin-imprimir mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            className="campo md:flex-1"
            placeholder="Buscar por material, prenda, nota o persona…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" className="boton boton-secundario" onClick={exportar}>
            Exportar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select className="campo w-auto min-w-40" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-humo">
            Desde
            <input type="date" className="campo w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm text-humo">
            Hasta
            <input type="date" className="campo w-auto" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>

          {esAdmin && (
            <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-humo">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[#1f1c19]"
                checked={verAnulados}
                onChange={(e) => setVerAnulados(e.target.checked)}
              />
              Ver anulados
            </label>
          )}
        </div>

        <p className="text-sm text-humo">
          {filtrados.length} {filtrados.length === 1 ? "movimiento" : "movimientos"}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-grafito">
          No hay movimientos que coincidan.
        </div>
      ) : (
        <div className="tarjeta overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Material</th>
                <th className="numerico">Cantidad</th>
                <th>Destino / nota</th>
                <th>Quién</th>
                {esAdmin && <th className="numerico">Costo</th>}
                {esAdmin && <th className="sin-imprimir" />}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id} className={m.anulado ? "opacity-50" : ""}>
                  <td className="whitespace-nowrap text-grafito">{fechaHora(m.fecha)}</td>
                  <td>
                    <Distintivo
                      tono={m.tipo === "salida" ? "alerta" : m.tipo === "entrada" ? "bien" : "neutro"}
                    >
                      {m.tipo}
                    </Distintivo>
                  </td>
                  <td>
                    <Link
                      href={`${m.material_clase === "tela" ? "/telas" : "/insumos"}/${m.material_id}`}
                      className="underline decoration-arena underline-offset-4 hover:decoration-tinta"
                    >
                      {m.material_nombre}
                    </Link>
                    <span className="block text-xs text-humo">{m.material_codigo}</span>
                  </td>
                  <td className={`numerico ${m.anulado ? "line-through" : ""}`}>
                    {m.cantidad_efectiva > 0 ? "+" : "−"}
                    {cantidad(Math.abs(m.cantidad), m.material_unidad)}
                  </td>
                  <td className="text-grafito">
                    {m.prenda_id ? (
                      <Link href={`/prendas/${m.prenda_id}`} className="underline underline-offset-4">
                        {m.prenda_nombre}
                      </Link>
                    ) : null}
                    {m.prenda_id && m.motivo ? " · " : null}
                    {m.motivo}
                    {m.anulado && (
                      <span className="block text-xs text-alerta">
                        Anulado: {m.motivo_anulacion}
                      </span>
                    )}
                  </td>
                  <td className="text-grafito">{m.registrado_por_nombre ?? "—"}</td>
                  {esAdmin && <td className="numerico">{dinero(m.costo_total)}</td>}
                  {esAdmin && (
                    <td className="sin-imprimir text-right">
                      {!m.anulado && (
                        <button type="button" className="boton-texto" onClick={() => setAnulando(m)}>
                          Anular
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {anulando && <DialogoAnular movimiento={anulando} alCerrar={() => setAnulando(null)} />}
    </div>
  );
}

function DialogoAnular({
  movimiento,
  alCerrar,
}: {
  movimiento: Movimiento;
  alCerrar: () => void;
}) {
  const [estado, enviar] = useActionState(anularMovimiento, null);

  // Se cierra solo cuando la anulacion ha ido bien.
  useEffect(() => {
    if (estado?.ok) alCerrar();
  }, [estado, alCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="tarjeta w-full max-w-md px-6 py-7">
        <h2 className="font-display text-2xl">Anular movimiento</h2>
        <p className="mt-2 text-sm text-grafito">
          {movimiento.material_nombre} · {cantidad(movimiento.cantidad, movimiento.material_unidad)}{" "}
          del {fechaHora(movimiento.fecha)}.
        </p>
        <p className="mt-3 text-sm text-humo">
          El movimiento no se borra: queda marcado como anulado y deja de contar para el stock.
        </p>

        <form action={enviar} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={movimiento.id} />
          {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}

          <div>
            <label className="etiqueta" htmlFor="motivo_anulacion">
              ¿Por qué se anula? *
            </label>
            <input
              id="motivo_anulacion"
              name="motivo_anulacion"
              className="campo"
              placeholder="Se registró por error"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="boton boton-peligro">
              Anular
            </button>
            <button type="button" className="boton boton-secundario" onClick={alCerrar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
