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
        descripcion="Quién entra al sistema y qué puede hacer cada una."
      />
      <GestionEquipo perfiles={perfiles} yo={yo} />
    </>
  );
}
