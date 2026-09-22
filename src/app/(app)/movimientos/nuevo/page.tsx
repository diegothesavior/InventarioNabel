import Link from "next/link";
import { FormularioMovimiento } from "@/components/FormularioMovimiento";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarPrendas, materialesParaElegir } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";
import type { TipoMovimiento } from "@/lib/tipos";

export const metadata = { title: "Registrar movimiento" };

export default async function PaginaNuevoMovimiento({
  searchParams,
}: {
  searchParams: Promise<{ material?: string; prenda?: string; tipo?: string }>;
}) {
  const { material, prenda, tipo } = await searchParams;
  const [perfil, materiales, prendas] = await Promise.all([
    perfilActual(),
    materialesParaElegir(),
    listarPrendas(),
  ]);

  const tipoValido = ["entrada", "salida", "ajuste"].includes(tipo ?? "")
    ? (tipo as TipoMovimiento)
    : "salida";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/movimientos" className="boton-texto -ml-3">
          ← Volver a movimientos
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo="Inventario"
        titulo="Registrar movimiento"
        descripcion="Anota lo que entra o sale. El stock se actualiza solo."
      />

      {materiales.length === 0 ? (
        <EstadoVacio
          titulo="Todavia no hay materiales"
          descripcion="Primero hay que crear las fichas de telas e insumos. Despues se pueden registrar sus movimientos."
          accion={
            perfil.rol === "administradora" ? (
              <Link href="/telas/nueva" className="boton boton-principal">
                Crear la primera tela
              </Link>
            ) : undefined
          }
        />
      ) : (
        <FormularioMovimiento
          materiales={materiales}
          prendas={prendas.filter((p) => p.estado === "en_proceso" || p.estado === "terminada")}
          esAdmin={perfil.rol === "administradora"}
          materialInicial={material}
          prendaInicial={prenda}
          tipoInicial={tipoValido}
        />
      )}
    </>
  );
}
