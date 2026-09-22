import { GestionEquipo } from "@/components/GestionEquipo";
import { EncabezadoPagina } from "@/components/ui";
import { listarPerfiles } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Equipo" };

export default async function PaginaEquipo() {
  const yo = await exigirAdmin();
  const perfiles = await listarPerfiles();

  return (
    <>
      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Equipo"
        descripcion="Quien entra al sistema y que puede hacer cada una."
      />
      <GestionEquipo perfiles={perfiles} yo={yo} />
    </>
  );
}
