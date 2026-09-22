import Link from "next/link";
import { Importador } from "@/components/Importador";
import { EncabezadoPagina } from "@/components/ui";
import { exigirAdmin } from "@/lib/supabase/sesion";
import type { ClaseMaterial } from "@/lib/tipos";

export const metadata = { title: "Importar" };

export default async function PaginaImportar({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  await exigirAdmin();
  const { tipo } = await searchParams;
  const clase: ClaseMaterial = tipo === "insumo" ? "insumo" : "tela";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={clase === "tela" ? "/telas" : "/insumos"} className="boton-texto -ml-3">
          ← Volver
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo="Inventario"
        titulo={clase === "tela" ? "Importar telas" : "Importar insumos"}
        descripcion="Trae de una vez lo que ya tienes en Excel o Google Sheets."
        acciones={
          <Link
            href={`/importar?tipo=${clase === "tela" ? "insumo" : "tela"}`}
            className="boton boton-secundario"
          >
            {clase === "tela" ? "Importar insumos" : "Importar telas"}
          </Link>
        }
      />

      <Importador clase={clase} key={clase} />
    </>
  );
}
