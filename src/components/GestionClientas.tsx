"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { guardarClienta } from "@/lib/acciones/catalogos";
import { descargarCsv, type Columna } from "@/lib/csv";
import { fechaCorta, normalizar } from "@/lib/formato";
import type { Clienta } from "@/lib/tipos";

function BotonGuardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

function CamposClienta({ clienta }: { clienta?: Clienta }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="etiqueta">Nombre *</label>
          <input name="nombre" className="campo" defaultValue={clienta?.nombre} required />
        </div>
        <div>
          <label className="etiqueta">Teléfono</label>
          <input name="telefono" type="tel" className="campo" defaultValue={clienta?.telefono ?? ""} />
        </div>
        <div>
          <label className="etiqueta">Correo</label>
          <input name="email" type="email" className="campo" defaultValue={clienta?.email ?? ""} />
        </div>
      </div>
      <div>
        <label className="etiqueta">Notas</label>
        <textarea name="notas" className="campo" defaultValue={clienta?.notas ?? ""} />
      </div>
    </>
  );
}

function FormularioNueva() {
  const [estado, enviar] = useActionState(guardarClienta.bind(null, null), null);

  return (
    <form action={enviar} key={estado?.ok ? "limpio" : "datos"} className="max-w-2xl space-y-5">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && <div className="aviso aviso-exito">{estado.mensaje}</div>}
      <CamposClienta />
      <BotonGuardar texto="Añadir clienta" />
    </form>
  );
}

function FormularioEditar({ clienta }: { clienta: Clienta }) {
  const accion = useMemo(() => guardarClienta.bind(null, clienta.id), [clienta.id]);
  const [estado, enviar] = useActionState(accion, null);

  return (
    <form action={enviar} className="space-y-5 bg-hueso px-5 py-5">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && <div className="aviso aviso-exito">{estado.mensaje}</div>}
      <CamposClienta clienta={clienta} />
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="activo"
          className="h-5 w-5 accent-[#1f1c19]"
          defaultChecked={clienta.activo}
        />
        Clienta activa
      </label>
      <BotonGuardar texto="Guardar cambios" />
    </form>
  );
}

export function GestionClientas({ clientas }: { clientas: Clienta[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return clientas;
    return clientas.filter((c) =>
      normalizar([c.nombre, c.telefono, c.email, c.notas].filter(Boolean).join(" ")).includes(termino),
    );
  }, [clientas, busqueda]);

  function exportar() {
    const columnas: Columna<Clienta>[] = [
      { clave: "nombre", titulo: "Nombre", valor: (c) => c.nombre },
      { clave: "telefono", titulo: "Teléfono", valor: (c) => c.telefono },
      { clave: "email", titulo: "Correo", valor: (c) => c.email },
      { clave: "notas", titulo: "Notas", valor: (c) => c.notas },
      { clave: "activo", titulo: "Activa", valor: (c) => (c.activo ? "Sí" : "No") },
    ];
    descargarCsv("clientas", filtradas, columnas);
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="antetitulo mb-4">Añadir clienta</h2>
        <FormularioNueva />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
          <h2 className="antetitulo md:flex-1">Clientas ({clientas.length})</h2>
          <input
            type="search"
            className="campo md:w-72"
            placeholder="Buscar clienta…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" className="boton boton-secundario" onClick={exportar}>
            Exportar
          </button>
        </div>

        {filtradas.length === 0 ? (
          <div className="tarjeta px-6 py-12 text-center text-grafito">
            {clientas.length === 0 ? "Aún no hay clientas registradas." : "Ninguna coincide."}
          </div>
        ) : (
          <div className="tarjeta divide-y divide-lino">
            {filtradas.map((c) => (
              <details key={c.id} className={c.activo ? "" : "opacity-55"}>
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                  <div>
                    <span>{c.nombre}</span>
                    <span className="block text-sm text-humo">
                      {[c.telefono, c.email].filter(Boolean).join(" · ") || "Sin contacto"}
                      {!c.activo && " · Archivada"}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm text-humo">{fechaCorta(c.creado_en)}</span>
                </summary>
                <FormularioEditar clienta={c} />
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
