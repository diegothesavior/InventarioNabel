"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { descargarCsv, type Columna } from "@/lib/csv";
import { normalizar } from "@/lib/formato";
import type { Proveedor } from "@/lib/tipos";

export function TablaProveedores({
  proveedores,
  esAdmin,
}: {
  proveedores: Proveedor[];
  esAdmin: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [verArchivados, setVerArchivados] = useState(false);

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda);
    return proveedores.filter((p) => {
      if (!verArchivados && !p.activo) return false;
      if (!termino) return true;
      const texto = normalizar(
        [p.nombre, p.contacto, p.suministra, p.email, p.telefono].filter(Boolean).join(" "),
      );
      return termino.split(/\s+/).every((parte) => texto.includes(parte));
    });
  }, [proveedores, busqueda, verArchivados]);

  function exportar() {
    const columnas: Columna<Proveedor>[] = [
      { clave: "nombre", titulo: "Nombre", valor: (p) => p.nombre },
      { clave: "contacto", titulo: "Contacto", valor: (p) => p.contacto },
      { clave: "telefono", titulo: "Teléfono", valor: (p) => p.telefono },
      { clave: "email", titulo: "Correo", valor: (p) => p.email },
      { clave: "suministra", titulo: "Qué suministra", valor: (p) => p.suministra },
      { clave: "dias_entrega", titulo: "Días de entrega", valor: (p) => p.dias_entrega },
      { clave: "notas", titulo: "Notas", valor: (p) => p.notas },
      { clave: "activo", titulo: "Activo", valor: (p) => (p.activo ? "Sí" : "No") },
    ];
    descargarCsv("proveedores", filtrados, columnas);
  }

  return (
    <div>
      <div className="sin-imprimir mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="search"
          className="campo md:flex-1"
          placeholder="Buscar proveedor…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-humo">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[#1f1c19]"
            checked={verArchivados}
            onChange={(e) => setVerArchivados(e.target.checked)}
          />
          Ver archivados
        </label>
        <button type="button" className="boton boton-secundario" onClick={exportar}>
          Exportar
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="tarjeta px-6 py-14 text-center text-grafito">
          Ningún proveedor coincide con la búsqueda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => (
            <div key={p.id} className={`tarjeta flex flex-col px-6 py-6 ${p.activo ? "" : "opacity-55"}`}>
              <h2 className="font-display text-2xl leading-tight">{p.nombre}</h2>
              {p.suministra && <p className="mt-1 text-sm text-humo">{p.suministra}</p>}

              <dl className="mt-5 space-y-2 text-sm">
                {p.contacto && (
                  <div className="flex gap-2">
                    <dt className="text-humo">Contacto</dt>
                    <dd>{p.contacto}</dd>
                  </div>
                )}
                {p.telefono && (
                  <div className="flex gap-2">
                    <dt className="text-humo">Teléfono</dt>
                    <dd>
                      <a href={`tel:${p.telefono}`} className="underline underline-offset-4">
                        {p.telefono}
                      </a>
                    </dd>
                  </div>
                )}
                {p.email && (
                  <div className="flex gap-2">
                    <dt className="text-humo">Correo</dt>
                    <dd className="truncate">
                      <a href={`mailto:${p.email}`} className="underline underline-offset-4">
                        {p.email}
                      </a>
                    </dd>
                  </div>
                )}
                {p.dias_entrega !== null && (
                  <div className="flex gap-2">
                    <dt className="text-humo">Entrega</dt>
                    <dd>{p.dias_entrega} dias</dd>
                  </div>
                )}
              </dl>

              {p.notas && <p className="mt-4 border-l-2 border-arena pl-3 text-sm text-grafito">{p.notas}</p>}

              {esAdmin && (
                <div className="sin-imprimir mt-auto pt-5">
                  <Link href={`/proveedores/${p.id}/editar`} className="boton-texto -ml-3">
                    Editar
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
