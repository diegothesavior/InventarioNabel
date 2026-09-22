import { TablaHistorial } from "@/components/TablaHistorial";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarHistorial } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";

export const metadata = { title: "Historial" };

export default async function PaginaHistorial() {
  await exigirAdmin();
  const entradas = await listarHistorial(500);

  return (
    <>
      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Historial"
        descripcion="Quién cambió qué y cuándo. Lo registra la base de datos automáticamente."
      />

      {entradas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay cambios registrados"
          descripcion="En cuanto el equipo empiece a trabajar, aquí quedará constancia de todo."
        />
      ) : (
        <TablaHistorial entradas={entradas} />
      )}
    </>
  );
}
