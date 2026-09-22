import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listarMovimientos, obtenerMaterial } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";
import { cantidad, dinero, etiquetaUnidad, fechaHora, numero } from "@/lib/formato";
import type { ClaseMaterial } from "@/lib/tipos";
import { Aviso, Dato, Distintivo, EncabezadoPagina } from "./ui";

export async function PaginaFichaMaterial({
  clase,
  id,
  recienCreado,
}: {
  clase: ClaseMaterial;
  id: string;
  recienCreado?: boolean;
}) {
  const [perfil, material] = await Promise.all([perfilActual(), obtenerMaterial(id)]);
  if (!material || material.clase !== clase) notFound();

  const movimientos = await listarMovimientos({ materialId: id, limite: 50 });
  const esAdmin = perfil.rol === "administradora";
  const esTela = clase === "tela";
  const ruta = esTela ? "/telas" : "/insumos";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={ruta} className="boton-texto -ml-3">
          ← Volver a {esTela ? "telas" : "insumos"}
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo={material.codigo}
        titulo={material.nombre}
        acciones={
          <>
            <Link
              href={`/movimientos/nuevo?material=${material.id}`}
              className="boton boton-principal"
            >
              Registrar movimiento
            </Link>
            {esAdmin && (
              <Link href={`${ruta}/${material.id}/editar`} className="boton boton-secundario">
                Editar ficha
              </Link>
            )}
          </>
        }
      />

      {recienCreado && (
        <div className="mb-8">
          <Aviso tono="exito">Ficha creada. Ya puedes registrar entradas y salidas.</Aviso>
        </div>
      )}

      {!material.activo && (
        <div className="mb-8">
          <Aviso tono="info">
            Esta ficha está archivada: no aparece en los listados salvo que se pidan los
            archivados.
          </Aviso>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        {/* Columna izquierda: foto y existencias */}
        <div className="space-y-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-arena bg-lino">
            {material.foto_url ? (
              <Image
                src={material.foto_url}
                alt={material.nombre}
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

          <div className={`tarjeta px-6 py-6 ${material.bajo_minimo ? "border-alerta/40 bg-alerta-suave" : ""}`}>
            <p className="antetitulo">Existencias</p>
            <p
              className={`mt-2 font-display text-5xl leading-none ${
                material.bajo_minimo ? "text-alerta" : ""
              }`}
            >
              {numero(material.stock)}
            </p>
            <p className="mt-1 text-sm text-humo">{etiquetaUnidad(material.unidad, material.stock)}</p>

            {material.bajo_minimo && (
              <p className="mt-4 text-sm text-alerta">
                Por debajo del punto de reposicion ({numero(material.punto_reposicion)}).
                Conviene pedir mas.
              </p>
            )}

            {esAdmin && material.valor_inventario !== null && (
              <p className="mt-4 border-t border-arena pt-4 text-sm text-grafito">
                Valor en inventario: <b>{dinero(material.valor_inventario)}</b>
              </p>
            )}
          </div>
        </div>

        {/* Columna derecha: datos y movimientos */}
        <div className="space-y-10">
          <section>
            <h2 className="antetitulo mb-4">Ficha</h2>
            <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Dato etiqueta={esTela ? "Tipo de tela" : "Categoría"}>{material.tipo ?? "—"}</Dato>
              {esTela && <Dato etiqueta="Composición">{material.composicion ?? "—"}</Dato>}
              {esTela && <Dato etiqueta="Color">{material.color ?? "—"}</Dato>}
              {esTela && (
                <Dato etiqueta="Ancho">
                  {material.ancho_cm ? `${numero(material.ancho_cm)} cm` : "—"}
                </Dato>
              )}
              <Dato etiqueta="Unidad">{etiquetaUnidad(material.unidad)}</Dato>
              <Dato etiqueta="Ubicación">{material.ubicacion ?? "—"}</Dato>
              <Dato etiqueta="Proveedor">
                {material.proveedor_nombre ? (
                  <Link href="/proveedores" className="underline underline-offset-4">
                    {material.proveedor_nombre}
                  </Link>
                ) : (
                  "—"
                )}
              </Dato>
              <Dato etiqueta="Punto de reposición">{numero(material.punto_reposicion)}</Dato>
              {esAdmin && (
                <Dato etiqueta={`Costo por ${esTela ? "metro" : "unidad"}`}>
                  {dinero(material.costo_unitario)}
                </Dato>
              )}
            </dl>

            {material.notas && (
              <div className="mt-6 border-l-2 border-arena pl-4 text-grafito">{material.notas}</div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="antetitulo">Movimientos</h2>
              <Link href={`/movimientos?material=${material.id}`} className="boton-texto sin-imprimir">
                Ver todos
              </Link>
            </div>

            {movimientos.length === 0 ? (
              <div className="tarjeta px-6 py-10 text-center text-grafito">
                Todavía no hay movimientos de este material.
              </div>
            ) : (
              <div className="tarjeta overflow-x-auto">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th className="numerico">Cantidad</th>
                      <th>Destino</th>
                      <th>Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.id} className={m.anulado ? "opacity-50 line-through" : ""}>
                        <td className="whitespace-nowrap text-grafito">{fechaHora(m.fecha)}</td>
                        <td>
                          <Distintivo tono={m.tipo === "salida" ? "alerta" : m.tipo === "entrada" ? "bien" : "neutro"}>
                            {m.tipo}
                          </Distintivo>
                        </td>
                        <td className="numerico">
                          {m.tipo === "salida" ? "−" : m.cantidad_efectiva < 0 ? "−" : "+"}
                          {cantidad(Math.abs(m.cantidad), m.material_unidad)}
                        </td>
                        <td className="text-grafito">
                          {m.prenda_id ? (
                            <Link href={`/prendas/${m.prenda_id}`} className="underline underline-offset-4">
                              {m.prenda_nombre}
                            </Link>
                          ) : (
                            m.motivo ?? "—"
                          )}
                        </td>
                        <td className="text-grafito">{m.registrado_por_nombre ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
