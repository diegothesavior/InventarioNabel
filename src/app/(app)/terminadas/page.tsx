import Link from "next/link";
import { GaleriaTerminadas } from "@/components/GaleriaTerminadas";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarPrendas } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Prendas terminadas" };

export default async function PaginaTerminadas() {
  const [perfil, todas] = await Promise.all([perfilActual(), listarPrendas()]);
  const terminadas = todas.filter((p) => p.estado !== "en_proceso");

  return (
    <>
      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Prendas terminadas"
        descripcion="El archivo del atelier: qué hay disponible, qué está reservado y qué se entregó."
        acciones={
          <Link href="/prendas" className="boton boton-secundario">
            Ver prendas en proceso
          </Link>
        }
      />

      {terminadas.length === 0 ? (
        <EstadoVacio
          titulo="Aún no hay prendas terminadas"
          descripcion="Cuando una prenda en proceso cambie a «Terminada», aparecerá aquí con su foto y su precio."
          accion={
            <Link href="/prendas" className="boton boton-principal">
              Ver prendas en proceso
            </Link>
          }
        />
      ) : (
        <GaleriaTerminadas prendas={terminadas} esAdmin={perfil.rol === "administradora"} />
      )}
    </>
  );
}
