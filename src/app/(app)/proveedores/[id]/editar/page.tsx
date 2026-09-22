import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioProveedor } from "@/components/FormularioProveedor";
import { EncabezadoPagina } from "@/components/ui";
import { guardarProveedor } from "@/lib/acciones/proveedores";
import { listarProveedores } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Editar proveedor" };

export default async function PaginaEditarProveedor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const proveedor = (await listarProveedores()).find((p) => p.id === id);
  if (!proveedor) notFound();

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/proveedores" className="boton-texto -ml-3">
          ← Volver a proveedores
        </Link>
      </div>

      <EncabezadoPagina antetitulo="Taller" titulo={proveedor.nombre} />
      <FormularioProveedor proveedor={proveedor} accion={guardarProveedor.bind(null, id)} />
    </>
  );
}
