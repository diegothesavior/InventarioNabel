import Link from "next/link";
import { TablaProveedores } from "@/components/TablaProveedores";
import { EncabezadoPagina, EstadoVacio } from "@/components/ui";
import { listarProveedores } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";

export const metadata = { title: "Proveedores" };

export default async function PaginaProveedores() {
  const [perfil, proveedores] = await Promise.all([perfilActual(), listarProveedores()]);
  const esAdmin = perfil.rol === "administradora";

  return (
    <>
      <EncabezadoPagina
        antetitulo="Taller"
        titulo="Proveedores"
        descripcion="Quien nos surte, como contactarlo y cuanto tarda en entregar."
        acciones={
          esAdmin ? (
            <Link href="/proveedores/nuevo" className="boton boton-principal">
              Nuevo proveedor
            </Link>
          ) : undefined
        }
      />

      {proveedores.length === 0 ? (
        <EstadoVacio
          titulo="Aun no hay proveedores"
          descripcion="Al registrarlos podras asociarlos a cada tela e insumo y saber a quien pedir."
          accion={
            esAdmin ? (
              <Link href="/proveedores/nuevo" className="boton boton-principal">
                Crear el primero
              </Link>
            ) : undefined
          }
        />
      ) : (
        <TablaProveedores proveedores={proveedores} esAdmin={esAdmin} />
      )}
    </>
  );
}
