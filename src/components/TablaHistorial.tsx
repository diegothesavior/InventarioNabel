"use client";

import { useMemo, useState } from "react";
import { descargarCsv, type Columna } from "@/lib/csv";
import { fechaHora, normalizar } from "@/lib/formato";
import type { EntradaHistorial } from "@/lib/tipos";
import { Distintivo } from "./ui";

const NOMBRES_TABLA: Record<string, string> = {
  materiales: "Material",
  movimientos: "Movimiento",
  proveedores: "Proveedor",
  prendas: "Prenda",
  clientas: "Clienta",
  colecciones: "Colección",
};

export function TablaHistorial({ entradas }: { entradas: EntradaHistorial[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [tabla, setTabla] = useState("");

  const tablas = useMemo(() => [...new Set(entradas.map((e) => e.tabla))].sort(), [entradas]);

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda);
    return entradas.filter((e) => {
      if (tabla && e.tabla !== tabla) return false;
      if (!termino) return true;
      const texto = normalizar([e.descripcion, e.usuario_nombre, e.accion].filter(Boolean).join(" "));
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [entradas, busqueda, tabla]);

  function exportar() {
    const columnas: Columna<EntradaHistorial>[] = [
      { clave: "ocurrido_en", titulo: "Fecha", valor: (e) => fechaHora(e.ocurrido_en) },
      { clave: "tabla", titulo: "Qué", valor: (e) => NOMBRES_TABLA[e.tabla] ?? e.tabla },
      { clave: "descripcion", titulo: "Registro", valor: (e) => e.descripcion },
      { clave: "accion", titulo: "Acción", valor: (e) => e.accion },
      { clave: "usuario", titulo: "Quién", valor: (e) => e.usuario_nombre },
    ];
    descargarCsv("historial", filtradas, columnas);
  }

  return (
    <div>
      <div className="sin-imprimir mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          className="campo md:flex-1"
          placeholder="Buscar por registro o persona…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <select className="campo w-auto min-w-44" value={tabla} onChange={(e) => setTabla(e.target.value)}>
          <option value="">Todo</option>
          {tablas.map((t) => (
            <option key={t} value={t}>
              {NOMBRES_TABLA[t] ?? t}
            </option>
          ))}
        </select>
        <button type="button" className="boton boton-secundario" onClick={exportar}>
          Exportar
        </button>
      </div>

      {filtradas.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-grafito">
          No hay cambios que coincidan.
        </div>
      ) : (
        <div className="tarjeta overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Cuándo</th>
                <th>Quién</th>
                <th>Qué</th>
                <th>Registro</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap text-grafito">{fechaHora(e.ocurrido_en)}</td>
                  <td>{e.usuario_nombre ?? "—"}</td>
                  <td className="text-grafito">{NOMBRES_TABLA[e.tabla] ?? e.tabla}</td>
                  <td>{e.descripcion ?? "—"}</td>
                  <td>
                    <Distintivo
                      tono={e.accion === "eliminado" ? "alerta" : e.accion === "creado" ? "bien" : "neutro"}
                    >
                      {e.accion}
                    </Distintivo>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
