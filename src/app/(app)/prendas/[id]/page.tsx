import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ControlesPrenda } from "@/components/ControlesPrenda";
import { Aviso, Dato, Distintivo, EncabezadoPagina } from "@/components/ui";
import { ESTADOS_PRENDA, ETAPAS } from "@/lib/config";
import { listarMovimientos, obtenerPrenda } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";
import { cantidad, dinero, fechaCorta, fechaHora } from "@/lib/formato";

export const metadata = { title: "Prenda" };

export default async function PaginaPrenda({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creado?: string }>;
}) {
  const { id } = await params;
  const { creado } = await searchParams;

  const [perfil, prenda] = await Promise.all([perfilActual(), obtenerPrenda(id)]);
  if (!prenda) notFound();

  const materiales = await listarMovimientos({ prendaId: id });
  const esAdmin = perfil.rol === "administradora";
  const usados = materiales.filter((m) => m.tipo === "salida" && !m.anulado);

  const etiquetaEstado =
    ESTADOS_PRENDA.find((e) => e.valor === prenda.estado)?.etiqueta ?? prenda.estado;
  const etiquetaEtapa = ETAPAS.find((e) => e.valor === prenda.etapa)?.etiqueta ?? prenda.etapa;
  const terminada = prenda.estado !== "en_proceso";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={terminada ? "/terminadas" : "/prendas"} className="boton-texto -ml-3">
          ← Volver a {terminada ? "terminadas" : "prendas"}
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo={prenda.codigo}
        titulo={prenda.nombre}
        descripcion={
          [prenda.clienta_nombre, prenda.coleccion_nombre].filter(Boolean).join(" · ") || undefined
        }
        acciones={
          <>
            <Link href={`/movimientos/nuevo?prenda=${prenda.id}`} className="boton boton-principal">
              Asignar material
            </Link>
            <Link href={`/prendas/${prenda.id}/editar`} className="boton boton-secundario">
              Editar
            </Link>
          </>
        }
      />

      {creado === "1" && (
        <div className="mb-8">
          <Aviso tono="exito">
            Prenda creada. Ya puedes asignarle materiales y avanzarla de etapa.
          </Aviso>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-arena bg-lino">
            {prenda.foto_url ? (
              <Image
                src={prenda.foto_url}
                alt={prenda.nombre}
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-full items-center justify-center text-sm text-piedra">
                Sin foto
              </span>
            )}
          </div>

          <div className="tarjeta px-6 py-6">
            <p className="antetitulo">Estado</p>
            <p className="mt-2 font-display text-3xl leading-none">{etiquetaEstado}</p>
            <p className="mt-2 text-sm text-humo">Etapa: {etiquetaEtapa}</p>

            {esAdmin && (
              <dl className="mt-5 space-y-2 border-t border-arena pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-humo">Materiales</dt>
                  <dd>{dinero(prenda.costo_materiales)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-humo">Precio de venta</dt>
                  <dd>{dinero(prenda.precio_venta)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-lino pt-2">
                  <dt className="text-humo">Margen</dt>
                  <dd className={prenda.margen !== null && prenda.margen < 0 ? "text-alerta" : ""}>
                    {dinero(prenda.margen)}
                    {prenda.margen_porcentaje !== null && (
                      <span className="ml-2 text-xs text-humo">{prenda.margen_porcentaje}%</span>
                    )}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <ControlesPrenda prenda={prenda} />

          <section className="border-t border-arena pt-8">
            <h2 className="antetitulo mb-4">Ficha</h2>
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Dato etiqueta="Clienta">{prenda.clienta_nombre ?? "—"}</Dato>
              <Dato etiqueta="Coleccion">{prenda.coleccion_nombre ?? "—"}</Dato>
              <Dato etiqueta="Responsable">{prenda.responsable_nombre ?? "—"}</Dato>
              <Dato etiqueta="Talla o medidas">{prenda.talla ?? "—"}</Dato>
              <Dato etiqueta="Entrega estimada">{fechaCorta(prenda.fecha_estimada_entrega)}</Dato>
              <Dato etiqueta="Entrega real">{fechaCorta(prenda.fecha_entrega_real)}</Dato>
            </dl>

            {prenda.notas && (
              <div className="mt-6 border-l-2 border-arena pl-4 text-grafito">{prenda.notas}</div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="antetitulo">Materiales asignados</h2>
              <Link
                href={`/movimientos/nuevo?prenda=${prenda.id}`}
                className="boton-texto sin-imprimir"
              >
                Asignar mas
              </Link>
            </div>

            {usados.length === 0 ? (
              <div className="tarjeta px-6 py-10 text-center text-grafito">
                Todavia no se ha asignado material a esta prenda. Se asigna registrando una
                salida y eligiendola como destino.
              </div>
            ) : (
              <div className="tarjeta overflow-x-auto">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th className="numerico">Cantidad</th>
                      <th>Fecha</th>
                      <th>Quien</th>
                      {esAdmin && <th className="numerico">Costo</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {usados.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <Link
                            href={`${m.material_clase === "tela" ? "/telas" : "/insumos"}/${m.material_id}`}
                            className="underline decoration-arena underline-offset-4"
                          >
                            {m.material_nombre}
                          </Link>
                          <span className="block text-xs text-humo">{m.material_codigo}</span>
                        </td>
                        <td className="numerico">{cantidad(m.cantidad, m.material_unidad)}</td>
                        <td className="whitespace-nowrap text-grafito">{fechaHora(m.fecha)}</td>
                        <td className="text-grafito">{m.registrado_por_nombre ?? "—"}</td>
                        {esAdmin && <td className="numerico">{dinero(m.costo_total)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  {esAdmin && (
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-right text-humo">
                          Costo total de materiales
                        </td>
                        <td className="numerico">{dinero(prenda.costo_materiales)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </section>

          {prenda.estado === "en_proceso" && (
            <p className="sin-imprimir text-sm text-humo">
              <Distintivo>En proceso</Distintivo>{" "}
              <span className="ml-2">
                Cuando este lista, cambia el estado a «Terminada» y pasara a la seccion de
                prendas terminadas.
              </span>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
