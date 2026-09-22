import Link from "next/link";
import { TablaMateriales } from "./TablaMateriales";
import { EncabezadoPagina } from "./ui";
import { listarMateriales } from "@/lib/datos";
import { perfilActual } from "@/lib/supabase/sesion";
import type { ClaseMaterial } from "@/lib/tipos";

export async function PaginaListaMateriales({ clase }: { clase: ClaseMaterial }) {
  const [perfil, materiales] = await Promise.all([perfilActual(), listarMateriales(clase)]);
  const esAdmin = perfil.rol === "administradora";
  const esTela = clase === "tela";

  return (
    <>
      <EncabezadoPagina
        antetitulo="Inventario"
        titulo={esTela ? "Telas" : "Insumos"}
        descripcion={
          esTela
            ? "Cada tela con sus metros disponibles, su ubicación y su punto de reposición."
            : "Botones, cierres, hilos, entretelas, pedrería y todo lo demás."
        }
        acciones={
          esAdmin ? (
            <>
              <Link href={`/importar?tipo=${clase}`} className="boton boton-secundario">
                Importar
              </Link>
              <Link href={esTela ? "/telas/nueva" : "/insumos/nueva"} className="boton boton-principal">
                {esTela ? "Nueva tela" : "Nuevo insumo"}
              </Link>
            </>
          ) : (
            <Link href="/movimientos/nuevo" className="boton boton-principal">
              Registrar movimiento
            </Link>
          )
        }
      />

      <TablaMateriales materiales={materiales} clase={clase} esAdmin={esAdmin} />
    </>
  );
}
