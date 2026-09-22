import Link from "next/link";
import { FormularioProveedor } from "@/components/FormularioProveedor";
import { EncabezadoPagina } from "@/components/ui";
import { guardarProveedor } from "@/lib/acciones/proveedores";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Nuevo proveedor" };

export default async function PaginaNuevoProveedor() {
  await exigirAdmin();

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/proveedores" className="boton-texto -ml-3">
          ← Volver a proveedores
        </Link>
      </div>

      <EncabezadoPagina antetitulo="Taller" titulo="Nuevo proveedor" />
      <FormularioProveedor accion={guardarProveedor.bind(null, null)} />
    </>
  );
}
