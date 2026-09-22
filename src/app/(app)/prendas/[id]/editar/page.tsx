import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioPrenda } from "@/components/FormularioPrenda";
import { EncabezadoPagina } from "@/components/ui";
import { guardarPrenda } from "@/lib/acciones/prendas";
import { listarClientas, listarColecciones, listarPerfiles, obtenerPrenda } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Editar prenda" };

export default async function PaginaEditarPrenda({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [perfil, prenda, clientas, colecciones, perfiles] = await Promise.all([
    perfilActual(),
    obtenerPrenda(id),
    listarClientas(),
    listarColecciones(),
    listarPerfiles(),
  ]);

  if (!prenda) notFound();

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={`/prendas/${id}`} className="boton-texto -ml-3">
          ← Volver a la prenda
        </Link>
      </div>

      <EncabezadoPagina antetitulo={prenda.codigo} titulo="Editar prenda" />

      <FormularioPrenda
        prenda={prenda}
        clientas={clientas.filter((c) => c.activo || c.id === prenda.clienta_id)}
        colecciones={colecciones.filter((c) => c.activo || c.id === prenda.coleccion_id)}
        perfiles={perfiles.filter((p) => p.activo || p.id === prenda.responsable_id)}
        esAdmin={perfil.rol === "administradora"}
        accion={guardarPrenda.bind(null, id)}
      />
    </>
  );
}
