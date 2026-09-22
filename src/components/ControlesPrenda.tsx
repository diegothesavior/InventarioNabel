"use client";

import { useState, useTransition } from "react";
import { cambiarEstado, cambiarEtapa } from "@/lib/acciones/prendas";
import { ESTADOS_PRENDA, ETAPAS } from "@/lib/config";
import type { EstadoPrenda, EtapaPrenda, Prenda } from "@/lib/tipos";

/**
 * Avanzar la prenda sin abrir el formulario: un toque en la etapa,
 * un toque en el estado. Es lo que mas se hace desde la tablet.
 */
export function ControlesPrenda({ prenda }: { prenda: Prenda }) {
  const [pendiente, empezar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function moverEtapa(etapa: EtapaPrenda) {
    if (etapa === prenda.etapa) return;
    setError(null);
    empezar(async () => {
      const resultado = await cambiarEtapa(prenda.id, etapa);
      if (!resultado.ok) setError(resultado.error);
    });
  }

  function moverEstado(estado: EstadoPrenda) {
    setError(null);
    empezar(async () => {
      const resultado = await cambiarEstado(prenda.id, estado);
      if (!resultado.ok) setError(resultado.error);
    });
  }

  const indiceActual = ETAPAS.findIndex((e) => e.valor === prenda.etapa);

  return (
    <div className="sin-imprimir space-y-6">
      {error && <div className="aviso aviso-error">{error}</div>}

      <div>
        <p className="antetitulo mb-3">Etapa</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {ETAPAS.map((etapa, indice) => {
            const actual = etapa.valor === prenda.etapa;
            const pasada = indice < indiceActual;
            return (
              <button
                key={etapa.valor}
                type="button"
                disabled={pendiente}
                onClick={() => moverEtapa(etapa.valor)}
                aria-pressed={actual}
                className={`min-h-14 border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                  actual
                    ? "border-tinta bg-tinta text-hueso"
                    : pasada
                      ? "border-arena bg-lino text-grafito"
                      : "border-arena bg-papel text-humo hover:border-piedra"
                }`}
              >
                {etapa.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="antetitulo mb-3 block" htmlFor="estado-prenda">
          Estado
        </label>
        <select
          id="estado-prenda"
          className="campo sm:max-w-xs"
          value={prenda.estado}
          disabled={pendiente}
          onChange={(e) => moverEstado(e.target.value as EstadoPrenda)}
        >
          {ESTADOS_PRENDA.map((e) => (
            <option key={e.valor} value={e.valor}>
              {e.etiqueta}
            </option>
          ))}
        </select>
        <p className="ayuda">
          Al marcarla como entregada se guarda la fecha de hoy como entrega real.
        </p>
      </div>
    </div>
  );
}
