import Link from "next/link";
import { FormularioPrenda } from "@/components/FormularioPrenda";
import { EncabezadoPagina } from "@/components/ui";
import { guardarPrenda } from "@/lib/acciones/prendas";
import { listarClientas, listarColecciones, listarPerfiles } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Nueva prenda" };

export default async function PaginaNuevaPrenda() {
  const [perfil, clientas, colecciones, perfiles] = await Promise.all([
    perfilActual(),
    listarClientas(),
    listarColecciones(),
    listarPerfiles(),
  ]);

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href="/prendas" className="boton-texto -ml-3">
          ← Volver a prendas
        </Link>
      </div>

      <EncabezadoPagina antetitulo="Taller" titulo="Nueva prenda" />

      <FormularioPrenda
        clientas={clientas.filter((c) => c.activo)}
        colecciones={colecciones.filter((c) => c.activo)}
        perfiles={perfiles.filter((p) => p.activo)}
        esAdmin={perfil.rol === "administradora"}
        accion={guardarPrenda.bind(null, null)}
      />
    </>
  );
}
