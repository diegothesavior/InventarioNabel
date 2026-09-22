import Link from "next/link";
import { GestionColecciones } from "@/components/GestionColecciones";
import { EncabezadoPagina } from "@/components/ui";
import { listarColecciones } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Colecciones" };

export default async function PaginaColecciones() {
  await exigirAdmin();
  const colecciones = await listarColecciones();

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/prendas" className="boton-texto -ml-3">
          ← Volver a prendas
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Colecciones"
        descripcion="Temporadas y colecciones del atelier."
      />

      <GestionColecciones colecciones={colecciones} />
    </>
  );
}
