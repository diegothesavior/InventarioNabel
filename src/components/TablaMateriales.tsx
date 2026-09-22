"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ClaseMaterial, Material } from "@/lib/tipos";
import { cantidad, dinero, normalizar } from "@/lib/formato";
import { descargarCsv, type Columna } from "@/lib/csv";
import { Distintivo, EstadoVacio } from "./ui";

export function TablaMateriales({
  materiales,
  clase,
  esAdmin,
}: {
  materiales: Material[];
  clase: ClaseMaterial;
  esAdmin: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [soloAlerta, setSoloAlerta] = useState(false);
  const [verArchivados, setVerArchivados] = useState(false);

  const ruta = clase === "tela" ? "/telas" : "/insumos";
  const etiquetaTipo = clase === "tela" ? "Tipo de tela" : "Categoría";

  const tipos = useMemo(
    () => [...new Set(materiales.map((m) => m.tipo).filter(Boolean))].sort() as string[],
    [materiales],
  );
  const proveedores = useMemo(
    () => [...new Set(materiales.map((m) => m.proveedor_nombre).filter(Boolean))].sort() as string[],
    [materiales],
  );

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    return materiales.filter((m) => {
      if (!verArchivados && !m.activo) return false;
      if (soloAlerta && !m.bajo_minimo) return false;
      if (tipo && m.tipo !== tipo) return false;
      if (proveedor && m.proveedor_nombre !== proveedor) return false;
      if (!termino) return true;
      const texto = normalizar(
        [m.codigo, m.nombre, m.tipo, m.color, m.composicion, m.ubicacion, m.proveedor_nombre]
          .filter(Boolean)
          .join(" "),
      );
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [materiales, busqueda, tipo, proveedor, soloAlerta, verArchivados]);

  const enAlerta = filtrados.filter((m) => m.bajo_minimo && m.activo).length;
  const hayFiltros = Boolean(busqueda || tipo || proveedor || soloAlerta || verArchivados);

  function exportar() {
    const columnas: Columna<Material>[] = [
      { clave: "codigo", titulo: "Código", valor: (m) => m.codigo },
      { clave: "nombre", titulo: "Nombre", valor: (m) => m.nombre },
      { clave: "tipo", titulo: etiquetaTipo, valor: (m) => m.tipo },
      ...(clase === "tela"
        ? ([
            { clave: "composicion", titulo: "Composición", valor: (m) => m.composicion },
            { clave: "color", titulo: "Color", valor: (m) => m.color },
            { clave: "ancho_cm", titulo: "Ancho (cm)", valor: (m) => m.ancho_cm },
          ] as Columna<Material>[])
        : []),
      { clave: "stock", titulo: "Existencias", valor: (m) => m.stock },
      { clave: "unidad", titulo: "Unidad", valor: (m) => m.unidad },
      { clave: "punto_reposicion", titulo: "Punto de reposición", valor: (m) => m.punto_reposicion },
      { clave: "ubicacion", titulo: "Ubicación", valor: (m) => m.ubicacion },
      { clave: "proveedor", titulo: "Proveedor", valor: (m) => m.proveedor_nombre },
      ...(esAdmin
        ? ([
            { clave: "costo_unitario", titulo: "Costo unitario", valor: (m) => m.costo_unitario },
            { clave: "valor_inventario", titulo: "Valor en inventario", valor: (m) => m.valor_inventario },
          ] as Columna<Material>[])
        : []),
      { clave: "notas", titulo: "Notas", valor: (m) => m.notas },
      { clave: "activo", titulo: "Activo", valor: (m) => (m.activo ? "Sí" : "No") },
    ];
    descargarCsv(clase === "tela" ? "telas" : "insumos", filtrados, columnas);
  }

  if (materiales.length === 0) {
    return (
      <EstadoVacio
        titulo={clase === "tela" ? "Aún no hay telas" : "Aún no hay insumos"}
        descripcion={
          esAdmin
            ? "Puedes crear la primera ficha a mano o traer todo de una vez desde tu hoja de cálculo."
            : "Cuando la administradora cargue el inventario, aparecerá aquí."
        }
        accion={
          esAdmin ? (
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`${ruta}/nueva`} className="boton boton-principal">
                Crear ficha
              </Link>
              <Link href={`/importar?tipo=${clase}`} className="boton boton-secundario">
                Importar desde Excel
              </Link>
            </div>
          ) : undefined
        }
      />
    );
  }

  return (
    <div>
      {/* Buscador y filtros */}
      <div className="sin-imprimir mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="search"
            className="campo md:flex-1"
            placeholder={
              clase === "tela"
                ? "Buscar por código, nombre, color, composición…"
                : "Buscar por código, nombre, categoría, ubicación…"
            }
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" className="boton boton-secundario" onClick={exportar}>
            Exportar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {tipos.length > 0 && (
            <select className="campo w-auto min-w-44" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="">{etiquetaTipo}: todos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}

          {proveedores.length > 0 && (
            <select
              className="campo w-auto min-w-44"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
            >
              <option value="">Proveedor: todos</option>
              {proveedores.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}

          <label className="flex min-h-12 cursor-pointer items-center gap-2 px-1 text-sm">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#1f1c19]"
              checked={soloAlerta}
              onChange={(e) => setSoloAlerta(e.target.checked)}
            />
            Solo bajo mínimo
          </label>

          <label className="flex min-h-12 cursor-pointer items-center gap-2 px-1 text-sm text-humo">
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#1f1c19]"
              checked={verArchivados}
              onChange={(e) => setVerArchivados(e.target.checked)}
            />
            Ver archivados
          </label>

          {hayFiltros && (
            <button
              type="button"
              className="boton-texto"
              onClick={() => {
                setBusqueda("");
                setTipo("");
                setProveedor("");
                setSoloAlerta(false);
                setVerArchivados(false);
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <p className="text-sm text-humo">
          {filtrados.length} {filtrados.length === 1 ? "ficha" : "fichas"}
          {enAlerta > 0 && (
            <>
              {" · "}
              <span className="text-alerta">{enAlerta} bajo el punto de reposicion</span>
            </>
          )}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-grafito">
          Ninguna ficha coincide con lo que buscas.
        </div>
      ) : (
        <>
          {/* Escritorio y tablet */}
          <div className="tarjeta hidden overflow-x-auto md:block">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>{etiquetaTipo}</th>
                  {clase === "tela" && <th>Color</th>}
                  <th className="numerico">Existencias</th>
                  <th>Ubicación</th>
                  <th>Proveedor</th>
                  {esAdmin && <th className="numerico">Costo</th>}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((m) => (
                  <tr key={m.id} className={m.activo ? "" : "opacity-55"}>
                    <td>
                      <Link
                        href={`${ruta}/${m.id}`}
                        className="underline decoration-arena underline-offset-4 hover:decoration-tinta"
                      >
                        {m.codigo}
                      </Link>
                    </td>
                    <td>
                      <span className="block">{m.nombre}</span>
                      {!m.activo && <span className="text-xs text-humo">Archivada</span>}
                    </td>
                    <td className="text-grafito">{m.tipo ?? "—"}</td>
                    {clase === "tela" && <td className="text-grafito">{m.color ?? "—"}</td>}
                    <td className="numerico">
                      <span className={m.bajo_minimo && m.activo ? "text-alerta" : ""}>
                        {cantidad(m.stock, m.unidad)}
                      </span>
                      {m.bajo_minimo && m.activo && (
                        <span className="ml-2 align-middle">
                          <Distintivo tono="alerta">Reponer</Distintivo>
                        </span>
                      )}
                    </td>
                    <td className="text-grafito">{m.ubicacion ?? "—"}</td>
                    <td className="text-grafito">{m.proveedor_nombre ?? "—"}</td>
                    {esAdmin && <td className="numerico">{dinero(m.costo_unitario)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Telefono: fichas en vez de tabla */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtrados.map((m) => (
              <Link
                key={m.id}
                href={`${ruta}/${m.id}`}
                className={`tarjeta block px-5 py-4 ${m.activo ? "" : "opacity-55"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="antetitulo">{m.codigo}</p>
                    <p className="mt-1 text-base">{m.nombre}</p>
                    <p className="text-sm text-humo">
                      {[m.tipo, m.color, m.ubicacion].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-base ${m.bajo_minimo && m.activo ? "text-alerta" : ""}`}>
                      {cantidad(m.stock, m.unidad)}
                    </p>
                    {m.bajo_minimo && m.activo && (
                      <span className="mt-1 inline-block">
                        <Distintivo tono="alerta">Reponer</Distintivo>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
