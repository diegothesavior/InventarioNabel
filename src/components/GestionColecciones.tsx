"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { guardarColeccion } from "@/lib/acciones/catalogos";
import { descargarCsv, type Columna } from "@/lib/csv";
import { normalizar } from "@/lib/formato";
import type { Coleccion } from "@/lib/tipos";

function BotonGuardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

function CamposColeccion({ coleccion }: { coleccion?: Coleccion }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="etiqueta">Nombre *</label>
          <input name="nombre" className="campo" defaultValue={coleccion?.nombre} required />
        </div>
        <div>
          <label className="etiqueta">Ano</label>
          <input
            name="anio"
            type="text"
            inputMode="numeric"
            className="campo"
            defaultValue={coleccion?.anio ?? ""}
            placeholder={String(new Date().getFullYear())}
          />
        </div>
        <div className="sm:col-span-3">
          <label className="etiqueta">Temporada</label>
          <input
            name="temporada"
            className="campo"
            defaultValue={coleccion?.temporada ?? ""}
            placeholder="Primavera / Verano"
          />
        </div>
      </div>
      <div>
        <label className="etiqueta">Notas</label>
        <textarea name="notas" className="campo" defaultValue={coleccion?.notas ?? ""} />
      </div>
    </>
  );
}

function FormularioNueva() {
  const [estado, enviar] = useActionState(guardarColeccion.bind(null, null), null);

  return (
    <form action={enviar} key={estado?.ok ? "limpio" : "datos"} className="max-w-2xl space-y-5">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && <div className="aviso aviso-exito">{estado.mensaje}</div>}
      <CamposColeccion />
      <BotonGuardar texto="Anadir coleccion" />
    </form>
  );
}

function FormularioEditar({ coleccion }: { coleccion: Coleccion }) {
  const accion = useMemo(() => guardarColeccion.bind(null, coleccion.id), [coleccion.id]);
  const [estado, enviar] = useActionState(accion, null);

  return (
    <form action={enviar} className="space-y-5 bg-hueso px-5 py-5">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && <div className="aviso aviso-exito">{estado.mensaje}</div>}
      <CamposColeccion coleccion={coleccion} />
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="activo"
          className="h-5 w-5 accent-[#1f1c19]"
          defaultChecked={coleccion.activo}
        />
        Coleccion activa
      </label>
      <BotonGuardar texto="Guardar cambios" />
    </form>
  );
}

export function GestionColecciones({ colecciones }: { colecciones: Coleccion[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return colecciones;
    return colecciones.filter((c) =>
      normalizar([c.nombre, c.temporada, String(c.anio ?? ""), c.notas].filter(Boolean).join(" ")).includes(
        termino,
      ),
    );
  }, [colecciones, busqueda]);

  function exportar() {
    const columnas: Columna<Coleccion>[] = [
      { clave: "nombre", titulo: "Nombre", valor: (c) => c.nombre },
      { clave: "temporada", titulo: "Temporada", valor: (c) => c.temporada },
      { clave: "anio", titulo: "Ano", valor: (c) => c.anio },
      { clave: "notas", titulo: "Notas", valor: (c) => c.notas },
      { clave: "activo", titulo: "Activa", valor: (c) => (c.activo ? "Si" : "No") },
    ];
    descargarCsv("colecciones", filtradas, columnas);
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="antetitulo mb-4">Anadir coleccion</h2>
        <FormularioNueva />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <h2 className="antetitulo md:flex-1">Colecciones ({colecciones.length})</h2>
          <input
            type="search"
            className="campo md:w-72"
            placeholder="Buscar coleccion…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" className="boton boton-secundario" onClick={exportar}>
            Exportar
          </button>
        </div>

        {filtradas.length === 0 ? (
          <div className="tarjeta px-6 py-12 text-center text-grafito">
            {colecciones.length === 0 ? "Aun no hay colecciones registradas." : "Ninguna coincide."}
          </div>
        ) : (
          <div className="tarjeta divide-y divide-lino">
            {filtradas.map((c) => (
              <details key={c.id} className={c.activo ? "" : "opacity-55"}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <span>{c.nombre}</span>
                    <span className="block text-sm text-humo">
                      {[c.temporada, c.anio].filter(Boolean).join(" · ") || "Sin temporada"}
                      {!c.activo && " · Archivada"}
                    </span>
                  </div>
                </summary>
                <FormularioEditar coleccion={c} />
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
