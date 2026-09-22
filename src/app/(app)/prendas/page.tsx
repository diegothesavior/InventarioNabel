import Link from "next/link";
import { TableroPrendas } from "@/components/TableroPrendas";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarPrendas } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Prendas en proceso" };

export default async function PaginaPrendas() {
  const [perfil, todas] = await Promise.all([perfilActual(), listarPrendas()]);
  const enProceso = todas.filter((p) => p.estado === "en_proceso");
  const esAdmin = perfil.rol === "administradora";

  return (
    <>
      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Prendas en proceso"
        descripcion="En qué etapa va cada prenda, quién la lleva y para cuándo es."
        acciones={
          <>
            {esAdmin && (
              <Link href="/clientas" className="boton boton-secundario">
                Clientas
              </Link>
            )}
            {esAdmin && (
              <Link href="/colecciones" className="boton boton-secundario">
                Colecciones
              </Link>
            )}
            <Link href="/prendas/nueva" className="boton boton-principal">
              Nueva prenda
            </Link>
          </>
        }
      />

      {enProceso.length === 0 ? (
        <EstadoVacio
          titulo="No hay prendas en proceso"
          descripcion="Al crear una prenda podrás seguir su etapa y ver cuánto material lleva."
          accion={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/prendas/nueva" className="boton boton-principal">
                Crear la primera
              </Link>
              {todas.length > 0 && (
                <Link href="/terminadas" className="boton boton-secundario">
                  Ver prendas terminadas
                </Link>
              )}
            </div>
          }
        />
      ) : (
        <TableroPrendas prendas={enProceso} esAdmin={esAdmin} />
      )}
    </>
  );
}
