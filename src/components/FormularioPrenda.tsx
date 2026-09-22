"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ESTADOS_PRENDA, ETAPAS } from "@/lib/config";
import type { Clienta, Coleccion, Perfil, Prenda, ResultadoAccion } from "@/lib/tipos";
import { SubirFoto } from "./SubirFoto";

function BotonGuardar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

export function FormularioPrenda({
  prenda,
  clientas,
  colecciones,
  perfiles,
  esAdmin,
  accion,
}: {
  prenda?: Prenda;
  clientas: Clienta[];
  colecciones: Coleccion[];
  perfiles: Perfil[];
  esAdmin: boolean;
  accion: (estado: ResultadoAccion | null, datos: FormData) => Promise<ResultadoAccion>;
}) {
  const [estado, enviar] = useActionState(accion, null);
  const [clienta, setClienta] = useState(prenda?.clienta_id ?? "");
  const [coleccion, setColeccion] = useState(prenda?.coleccion_id ?? "");
  const esNueva = !prenda;

  const sinDestino = !clienta && !coleccion;

  return (
    <form action={enviar} className="max-w-3xl space-y-8">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && estado.mensaje && (
        <div className="aviso aviso-exito">{estado.mensaje}</div>
      )}

      <section className="space-y-5">
        <h2 className="antetitulo">La prenda</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="codigo">
              Codigo *
            </label>
            <input
              id="codigo"
              name="codigo"
              className="campo"
              defaultValue={prenda?.codigo}
              placeholder="PR-001"
              required
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="nombre">
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              className="campo"
              defaultValue={prenda?.nombre}
              placeholder="Vestido de novia con cola"
              required
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="talla">
              Talla o medidas
            </label>
            <input id="talla" name="talla" className="campo" defaultValue={prenda?.talla ?? ""} />
          </div>

          <div>
            <label className="etiqueta" htmlFor="responsable_id">
              Responsable
            </label>
            <select
              id="responsable_id"
              name="responsable_id"
              className="campo"
              defaultValue={prenda?.responsable_id ?? ""}
            >
              <option value="">Sin asignar</option>
              {perfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SubirFoto carpeta="prendas" valorInicial={prenda?.foto_url} />
      </section>

      <section className="space-y-5 border-t border-arena pt-8">
        <h2 className="antetitulo">¿Para quien es?</h2>
        <p className="text-sm text-grafito">
          Rellena una de las dos, o las dos si es una prenda de coleccion hecha para una
          clienta concreta.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="clienta_id">
              Clienta
            </label>
            <select
              id="clienta_id"
              name="clienta_id"
              className="campo"
              value={clienta}
              onChange={(e) => setClienta(e.target.value)}
            >
              <option value="">Sin clienta</option>
              {clientas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            {esAdmin && (
              <p className="ayuda">
                ¿No esta?{" "}
                <Link href="/clientas" className="underline underline-offset-4">
                  Anadir clienta
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className="etiqueta" htmlFor="coleccion_id">
              Coleccion
            </label>
            <select
              id="coleccion_id"
              name="coleccion_id"
              className="campo"
              value={coleccion}
              onChange={(e) => setColeccion(e.target.value)}
            >
              <option value="">Sin coleccion</option>
              {colecciones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.anio ? ` · ${c.anio}` : ""}
                </option>
              ))}
            </select>
            {esAdmin && (
              <p className="ayuda">
                ¿No esta?{" "}
                <Link href="/colecciones" className="underline underline-offset-4">
                  Anadir coleccion
                </Link>
              </p>
            )}
          </div>
        </div>

        {sinDestino && (
          <div className="aviso aviso-info">
            Elige al menos una clienta o una coleccion para poder guardar.
          </div>
        )}
      </section>

      <section className="space-y-5 border-t border-arena pt-8">
        <h2 className="antetitulo">Produccion</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="etapa">
              Etapa
            </label>
            <select id="etapa" name="etapa" className="campo" defaultValue={prenda?.etapa ?? "patronaje"}>
              {ETAPAS.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="etiqueta" htmlFor="estado">
              Estado
            </label>
            <select id="estado" name="estado" className="campo" defaultValue={prenda?.estado ?? "en_proceso"}>
              {ESTADOS_PRENDA.map((e) => (
                <option key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="etiqueta" htmlFor="fecha_estimada_entrega">
              Entrega estimada
            </label>
            <input
              id="fecha_estimada_entrega"
              name="fecha_estimada_entrega"
              type="date"
              className="campo"
              defaultValue={prenda?.fecha_estimada_entrega ?? ""}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="fecha_entrega_real">
              Entrega real
            </label>
            <input
              id="fecha_entrega_real"
              name="fecha_entrega_real"
              type="date"
              className="campo"
              defaultValue={prenda?.fecha_entrega_real ?? ""}
            />
          </div>

          {esAdmin && (
            <div>
              <label className="etiqueta" htmlFor="precio_venta">
                Precio de venta
              </label>
              <input
                id="precio_venta"
                name="precio_venta"
                type="text"
                inputMode="decimal"
                className="campo"
                defaultValue={prenda?.precio_venta ?? ""}
              />
              <p className="ayuda">Con esto se calcula el margen. Solo lo ves tu.</p>
            </div>
          )}
        </div>

        <div>
          <label className="etiqueta" htmlFor="notas">
            Notas
          </label>
          <textarea id="notas" name="notas" className="campo" defaultValue={prenda?.notas ?? ""} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-arena pt-8">
        <BotonGuardar texto={esNueva ? "Crear prenda" : "Guardar cambios"} />
        <Link href={prenda ? `/prendas/${prenda.id}` : "/prendas"} className="boton boton-secundario">
          Cancelar
        </Link>
      </div>

      {!esNueva && (
        <p className="text-sm text-humo">
          Los materiales de esta prenda se asignan registrando salidas en{" "}
          <Link href={`/movimientos/nuevo?prenda=${prenda.id}`} className="underline underline-offset-4">
            Movimientos
          </Link>
          .
        </p>
      )}
    </form>
  );
}
