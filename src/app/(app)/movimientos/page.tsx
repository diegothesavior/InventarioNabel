import Link from "next/link";
import { TablaMovimientos } from "@/components/TablaMovimientos";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarMovimientos, obtenerMaterial } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Movimientos" };

export default async function PaginaMovimientos({
  searchParams,
}: {
  searchParams: Promise<{ material?: string }>;
}) {
  const { material } = await searchParams;
  const [perfil, movimientos] = await Promise.all([
    perfilActual(),
    listarMovimientos({ materialId: material, limite: 1000 }),
  ]);
  const ficha = material ? await obtenerMaterial(material) : null;

  return (
    <>
      <EncabezadoPagina
        antetitulo="Inventario"
        titulo="Movimientos"
        descripcion={
          ficha
            ? `Entradas y salidas de ${ficha.nombre}.`
            : "Todo lo que entra y sale del taller. El stock se calcula a partir de aquí."
        }
        acciones={
          <Link href="/movimientos/nuevo" className="boton boton-principal">
            Registrar movimiento
          </Link>
        }
      />

      {ficha && (
        <div className="sin-imprimir mb-6">
          <Link href="/movimientos" className="boton-texto -ml-3">
            ← Ver todos los movimientos
          </Link>
        </div>
      )}

      {movimientos.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay movimientos"
          descripcion="Cada entrada y cada salida de material se registra aquí. El stock sale de esta lista."
          accion={
            <Link href="/movimientos/nuevo" className="boton boton-principal">
              Registrar el primero
            </Link>
          }
        />
      ) : (
        <TablaMovimientos movimientos={movimientos} esAdmin={perfil.rol === "administradora"} />
      )}
    </>
  );
}
