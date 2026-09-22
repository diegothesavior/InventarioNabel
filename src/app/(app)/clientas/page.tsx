import Link from "next/link";
import { GestionClientas } from "@/components/GestionClientas";
import { EncabezadoPagina } from "@/components/ui";
import { listarClientas } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Clientas" };

export default async function PaginaClientas() {
  await exigirAdmin();
  const clientas = await listarClientas();

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/prendas" className="boton-texto -ml-3">
          ← Volver a prendas
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Clientas"
        descripcion="Para asociar cada prenda a medida con su clienta."
      />

      <GestionClientas clientas={clientas} />
    </>
  );
}
