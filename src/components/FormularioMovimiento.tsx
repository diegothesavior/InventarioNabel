"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { registrarMovimiento } from "@/lib/acciones/movimientos";
import { cantidad, etiquetaUnidad, normalizar, numero } from "@/lib/formato";
import type { Material, Prenda, TipoMovimiento } from "@/lib/tipos";

const OPCIONES: { valor: TipoMovimiento; titulo: string; ayuda: string }[] = [
  { valor: "entrada", titulo: "Entrada", ayuda: "Llego material nuevo" },
  { valor: "salida", titulo: "Salida", ayuda: "Se uso o se saco del taller" },
  { valor: "ajuste", titulo: "Ajuste", ayuda: "Corregir tras un conteo" },
];

function BotonRegistrar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal w-full sm:w-auto" disabled={pending}>
      {pending ? "Registrando…" : "Registrar movimiento"}
    </button>
  );
}

export function FormularioMovimiento({
  materiales,
  prendas,
  esAdmin,
  materialInicial,
  prendaInicial,
  tipoInicial = "salida",
}: {
  materiales: Material[];
  prendas: Prenda[];
  esAdmin: boolean;
  materialInicial?: string;
  prendaInicial?: string;
  tipoInicial?: TipoMovimiento;
}) {
  const router = useRouter();
  const [estado, enviar] = useActionState(registrarMovimiento, null);
  const [tipo, setTipo] = useState<TipoMovimiento>(tipoInicial);
  const [materialId, setMaterialId] = useState(materialInicial ?? "");
  const [busqueda, setBusqueda] = useState("");
  const [cuanto, setCuanto] = useState("");
  const [version, setVersion] = useState(0);

  const elegido = materiales.find((m) => m.id === materialId);

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda);
    if (!termino) return materiales;
    return materiales.filter((m) =>
      normalizar([m.codigo, m.nombre, m.tipo, m.color].filter(Boolean).join(" ")).includes(termino),
    );
  }, [materiales, busqueda]);

  const telas = visibles.filter((m) => m.clase === "tela");
  const insumos = visibles.filter((m) => m.clase === "insumo");

  // Tras registrar con exito, se limpia el formulario para el siguiente.
  useEffect(() => {
    if (estado?.ok) {
      setCuanto("");
      setVersion((v) => v + 1);
      router.refresh();
    }
  }, [estado, router]);

  const cantidadNumero = Number(cuanto.replace(",", "."));
  const stockResultante =
    elegido && Number.isFinite(cantidadNumero) && cuanto !== ""
      ? elegido.stock + (tipo === "salida" ? -cantidadNumero : cantidadNumero)
      : null;

  return (
    <form action={enviar} key={version} className="max-w-2xl space-y-8">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && (
        <div className="aviso aviso-exito">
          {estado.mensaje} Puedes registrar otro sin salir de esta pantalla.
        </div>
      )}

      {/* Tipo: botones grandes, faciles de tocar en el taller */}
      <fieldset>
        <legend className="etiqueta mb-3">Que paso</legend>
        <input type="hidden" name="tipo" value={tipo} />
        <div className="grid gap-3 sm:grid-cols-3">
          {OPCIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setTipo(o.valor)}
              aria-pressed={tipo === o.valor}
              className={`flex min-h-24 flex-col items-center justify-center gap-1 border px-4 py-4 text-center transition-colors ${
                tipo === o.valor
                  ? "border-tinta bg-tinta text-hueso"
                  : "border-arena bg-papel hover:border-piedra"
              }`}
            >
              <span className="text-sm tracking-[0.14em] uppercase">{o.titulo}</span>
              <span
                className={`text-xs ${tipo === o.valor ? "text-hueso/70" : "text-humo"}`}
              >
                {o.ayuda}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Material */}
      <div className="space-y-3">
        <label className="etiqueta" htmlFor="material_id">
          Material *
        </label>

        {materiales.length > 12 && (
          <input
            type="search"
            className="campo"
            placeholder="Filtrar la lista: codigo, nombre, color…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        )}

        <select
          id="material_id"
          name="material_id"
          className="campo"
          value={materialId}
          onChange={(e) => setMaterialId(e.target.value)}
          required
        >
          <option value="">Elige un material…</option>
          {telas.length > 0 && (
            <optgroup label="Telas">
              {telas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} · {m.nombre} ({numero(m.stock)} {etiquetaUnidad(m.unidad, m.stock)})
                </option>
              ))}
            </optgroup>
          )}
          {insumos.length > 0 && (
            <optgroup label="Insumos">
              {insumos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} · {m.nombre} ({numero(m.stock)} {etiquetaUnidad(m.unidad, m.stock)})
                </option>
              ))}
            </optgroup>
          )}
        </select>

        {elegido && (
          <p className="ayuda">
            Existencias ahora: <b>{cantidad(elegido.stock, elegido.unidad)}</b>
            {elegido.ubicacion && ` · ${elegido.ubicacion}`}
          </p>
        )}
      </div>

      {/* Cantidad */}
      <div className="sm:max-w-xs">
        <label className="etiqueta" htmlFor="cantidad">
          Cantidad {elegido && `(en ${etiquetaUnidad(elegido.unidad)})`} *
        </label>
        <input
          id="cantidad"
          name="cantidad"
          type="text"
          inputMode="decimal"
          className="campo text-lg"
          value={cuanto}
          onChange={(e) => setCuanto(e.target.value)}
          placeholder={tipo === "ajuste" ? "Puede ser negativa: −2" : "0"}
          required
        />
        {tipo === "ajuste" && (
          <p className="ayuda">
            Escribe la diferencia, no el total. Si sobran 2, pon 2; si faltan 2, pon −2.
          </p>
        )}
        {stockResultante !== null && elegido && (
          <p className={`ayuda ${stockResultante < 0 ? "text-alerta" : ""}`}>
            {stockResultante < 0
              ? "No hay suficiente: la operacion dejaria el stock en negativo."
              : `Quedaria en ${cantidad(stockResultante, elegido.unidad)}.`}
          </p>
        )}
      </div>

      {/* Destino */}
      {tipo === "salida" && prendas.length > 0 && (
        <div>
          <label className="etiqueta" htmlFor="prenda_id">
            ¿Para que prenda?
          </label>
          <select id="prenda_id" name="prenda_id" className="campo" defaultValue={prendaInicial ?? ""}>
            <option value="">Sin prenda asignada</option>
            {prendas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
                {p.clienta_nombre ? ` — ${p.clienta_nombre}` : ""}
                {!p.clienta_nombre && p.coleccion_nombre ? ` — ${p.coleccion_nombre}` : ""}
              </option>
            ))}
          </select>
          <p className="ayuda">Asignarla permite saber cuanto material lleva cada prenda.</p>
        </div>
      )}

      <div>
        <label className="etiqueta" htmlFor="motivo">
          Nota {tipo === "ajuste" ? "*" : "(opcional)"}
        </label>
        <input
          id="motivo"
          name="motivo"
          className="campo"
          placeholder={
            tipo === "entrada"
              ? "Compra a proveedor, factura 1024"
              : tipo === "salida"
                ? "Corte de la falda"
                : "Conteo del 14 de marzo"
          }
          required={tipo === "ajuste"}
        />
      </div>

      {esAdmin && tipo === "entrada" && (
        <div className="sm:max-w-xs">
          <label className="etiqueta" htmlFor="costo_unitario">
            Costo por unidad de esta compra
          </label>
          <input
            id="costo_unitario"
            name="costo_unitario"
            type="text"
            inputMode="decimal"
            className="campo"
            placeholder={elegido?.costo_unitario ? String(elegido.costo_unitario) : ""}
          />
          <p className="ayuda">
            Si lo dejas vacio se usa el costo de la ficha. Queda guardado en el movimiento.
          </p>
        </div>
      )}

      <details className="border-t border-arena pt-6">
        <summary className="cursor-pointer text-sm text-humo">
          Registrar con otra fecha
        </summary>
        <div className="mt-4 sm:max-w-xs">
          <label className="etiqueta" htmlFor="fecha">
            Fecha del movimiento
          </label>
          <input id="fecha" name="fecha" type="datetime-local" className="campo" />
          <p className="ayuda">Si lo dejas vacio se usa la fecha y hora de ahora.</p>
        </div>
      </details>

      <div className="border-t border-arena pt-8">
        <BotonRegistrar />
      </div>
    </form>
  );
}
