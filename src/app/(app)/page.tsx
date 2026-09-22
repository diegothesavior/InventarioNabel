import Link from "next/link";
import { EncabezadoPagina, Distintivo, Indicador } from "@/components/ui";
import {
  listarMateriales,
  listarMovimientos,
  listarPrendas,
  materialesEnAlerta,
} from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";
import { cantidad, dinero, fechaCorta, haceTiempo } from "@/lib/formato";

export const metadata = { title: "Inicio" };

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos dias";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function PaginaInicio() {
  const perfil = await perfilActual();
  const esAdmin = perfil.rol === "administradora";

  const [telas, insumos, alertas, movimientos, prendas] = await Promise.all([
    listarMateriales("tela"),
    listarMateriales("insumo"),
    materialesEnAlerta(),
    listarMovimientos({ limite: 8 }),
    listarPrendas(),
  ]);

  const telasActivas = telas.filter((t) => t.activo);
  const insumosActivos = insumos.filter((i) => i.activo);
  const enProceso = prendas.filter((p) => p.estado === "en_proceso");

  const valorInventario = esAdmin
    ? [...telasActivas, ...insumosActivos].reduce((suma, m) => suma + (m.valor_inventario ?? 0), 0)
    : null;

  const proximasEntregas = enProceso
    .filter((p) => p.fecha_estimada_entrega)
    .sort((a, b) => (a.fecha_estimada_entrega! < b.fecha_estimada_entrega! ? -1 : 1))
    .slice(0, 5);

  return (
    <>
      <EncabezadoPagina
        antetitulo={saludo()}
        titulo={perfil.nombre || "Atelier"}
        descripcion="Asi esta el taller hoy."
        acciones={
          <Link href="/movimientos/nuevo" className="boton boton-principal">
            Registrar movimiento
          </Link>
        }
      />

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta="Telas" valor={String(telasActivas.length)} detalle="referencias activas" href="/telas" />
        <Indicador
          etiqueta="Insumos"
          valor={String(insumosActivos.length)}
          detalle="referencias activas"
          href="/insumos"
        />
        <Indicador
          etiqueta="Por reponer"
          valor={String(alertas.length)}
          detalle={alertas.length === 1 ? "material bajo minimo" : "materiales bajo minimo"}
          tono={alertas.length > 0 ? "alerta" : "neutro"}
          href="/telas"
        />
        {esAdmin ? (
          <Indicador
            etiqueta="Valor del inventario"
            valor={dinero(valorInventario)}
            detalle="telas e insumos activos"
          />
        ) : (
          <Indicador
            etiqueta="Prendas en proceso"
            valor={String(enProceso.length)}
            detalle="en el taller"
            href="/prendas"
          />
        )}
      </div>

      {/* Alertas de reposicion */}
      <section className="mt-14">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-arena pb-3">
          <h2 className="font-display text-2xl">Hay que reponer</h2>
          {alertas.length > 0 && (
            <span className="text-sm text-humo">
              {alertas.length} {alertas.length === 1 ? "material" : "materiales"}
            </span>
          )}
        </div>

        {alertas.length === 0 ? (
          <div className="tarjeta px-6 py-10 text-center text-grafito">
            Todo por encima de su punto de reposicion. Nada urgente por comprar.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {alertas.map((m) => (
              <Link
                key={m.id}
                href={`${m.clase === "tela" ? "/telas" : "/insumos"}/${m.id}`}
                className="tarjeta border-alerta/40 bg-alerta-suave px-5 py-5 transition-colors hover:border-alerta"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="antetitulo">{m.codigo}</p>
                    <p className="mt-1">{m.nombre}</p>
                    {m.proveedor_nombre && (
                      <p className="mt-1 text-sm text-humo">Proveedor: {m.proveedor_nombre}</p>
                    )}
                  </div>
                  <Distintivo tono="alerta">{m.clase === "tela" ? "Tela" : "Insumo"}</Distintivo>
                </div>
                <p className="mt-4 text-sm text-alerta">
                  Quedan <b>{cantidad(m.stock, m.unidad)}</b> · minimo {cantidad(m.punto_reposicion, m.unidad)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        {/* Ultimos movimientos */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-arena pb-3">
            <h2 className="font-display text-2xl">Ultimos movimientos</h2>
            <Link href="/movimientos" className="boton-texto">
              Ver todos
            </Link>
          </div>

          {movimientos.length === 0 ? (
            <div className="tarjeta px-6 py-10 text-center text-grafito">
              Todavia no se ha registrado ningun movimiento.
            </div>
          ) : (
            <ul className="divide-y divide-lino">
              {movimientos.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <Link
                      href={`${m.material_clase === "tela" ? "/telas" : "/insumos"}/${m.material_id}`}
                      className="underline decoration-arena underline-offset-4 hover:decoration-tinta"
                    >
                      {m.material_nombre}
                    </Link>
                    <p className="text-sm text-humo">
                      {m.registrado_por_nombre ?? "—"} · {haceTiempo(m.fecha)}
                      {m.prenda_nombre ? ` · ${m.prenda_nombre}` : m.motivo ? ` · ${m.motivo}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm tabular-nums ${
                      m.cantidad_efectiva < 0 ? "text-alerta" : "text-bien"
                    } ${m.anulado ? "line-through opacity-50" : ""}`}
                  >
                    {m.cantidad_efectiva > 0 ? "+" : "−"}
                    {cantidad(Math.abs(m.cantidad), m.material_unidad)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Proximas entregas */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-arena pb-3">
            <h2 className="font-display text-2xl">Proximas entregas</h2>
            <Link href="/prendas" className="boton-texto">
              Ver prendas
            </Link>
          </div>

          {proximasEntregas.length === 0 ? (
            <div className="tarjeta px-6 py-10 text-center text-grafito">
              No hay prendas con fecha de entrega prevista.
            </div>
          ) : (
            <ul className="divide-y divide-lino">
              {proximasEntregas.map((p) => {
                const atrasada =
                  p.fecha_estimada_entrega! < new Date().toISOString().slice(0, 10);
                return (
                  <li key={p.id} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <Link href={`/prendas/${p.id}`} className="underline decoration-arena underline-offset-4">
                        {p.nombre}
                      </Link>
                      <p className="text-sm text-humo">
                        {p.clienta_nombre ?? p.coleccion_nombre ?? "—"} · {p.etapa}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm ${atrasada ? "text-alerta" : "text-grafito"}`}>
                      {fechaCorta(p.fecha_estimada_entrega)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
