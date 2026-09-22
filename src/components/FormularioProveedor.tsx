"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Proveedor, ResultadoAccion } from "@/lib/tipos";

function BotonGuardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

export function FormularioProveedor({
  proveedor,
  accion,
}: {
  proveedor?: Proveedor;
  accion: (estado: ResultadoAccion | null, datos: FormData) => Promise<ResultadoAccion>;
}) {
  const [estado, enviar] = useActionState(accion, null);
  const esNuevo = !proveedor;

  return (
    <form action={enviar} className="max-w-2xl space-y-6">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && estado.mensaje && (
        <div className="aviso aviso-exito">{estado.mensaje}</div>
      )}

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Nombre *
        </label>
        <input id="nombre" name="nombre" className="campo" defaultValue={proveedor?.nombre} required />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="etiqueta" htmlFor="contacto">
            Persona de contacto
          </label>
          <input id="contacto" name="contacto" className="campo" defaultValue={proveedor?.contacto ?? ""} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="telefono">
            Telefono
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            className="campo"
            defaultValue={proveedor?.telefono ?? ""}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="email">
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="campo"
            defaultValue={proveedor?.email ?? ""}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="dias_entrega">
            Tiempo de entrega (dias)
          </label>
          <input
            id="dias_entrega"
            name="dias_entrega"
            type="text"
            inputMode="numeric"
            className="campo"
            defaultValue={proveedor?.dias_entrega ?? ""}
          />
        </div>
      </div>

      <div>
        <label className="etiqueta" htmlFor="suministra">
          Que suministra
        </label>
        <input
          id="suministra"
          name="suministra"
          className="campo"
          defaultValue={proveedor?.suministra ?? ""}
          placeholder="Sedas y organzas importadas"
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="notas">
          Notas
        </label>
        <textarea id="notas" name="notas" className="campo" defaultValue={proveedor?.notas ?? ""} />
      </div>

      {!esNuevo && (
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="activo"
            className="h-5 w-5 accent-[#1f1c19]"
            defaultChecked={proveedor?.activo ?? true}
          />
          Proveedor activo
        </label>
      )}

      <div className="flex flex-wrap gap-3 border-t border-arena pt-6">
        <BotonGuardar texto={esNuevo ? "Crear proveedor" : "Guardar cambios"} />
        <Link href="/proveedores" className="boton boton-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
