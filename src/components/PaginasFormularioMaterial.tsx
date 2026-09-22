import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioMaterial } from "./FormularioMaterial";
import { EncabezadoPagina } from "./ui";
import { listarProveedores, obtenerMaterial } from "@/lib/datos";
import { exigirAdmin } from "@/lib/supabase/sesion";
import { actualizarMaterial, crearMaterial } from "@/lib/acciones/materiales";
import type { ClaseMaterial } from "@/lib/tipos";

export async function PaginaNuevoMaterial({ clase }: { clase: ClaseMaterial }) {
  await exigirAdmin();
  const proveedores = await listarProveedores();
  const esTela = clase === "tela";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={esTela ? "/telas" : "/insumos"} className="boton-texto -ml-3">
          ← Volver
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo="Inventario"
        titulo={esTela ? "Nueva tela" : "Nuevo insumo"}
        descripcion="Los campos con * son obligatorios. El resto se puede completar despues."
      />

      <FormularioMaterial
        clase={clase}
        proveedores={proveedores.filter((p) => p.activo)}
        accion={crearMaterial.bind(null, clase)}
      />
    </>
  );
}

export async function PaginaEditarMaterial({
  clase,
  id,
}: {
  clase: ClaseMaterial;
  id: string;
}) {
  await exigirAdmin();
  const [material, proveedores] = await Promise.all([obtenerMaterial(id), listarProveedores()]);
  if (!material || material.clase !== clase) notFound();

  const ruta = clase === "tela" ? "/telas" : "/insumos";

  return (
    <>
      <div className="sin-imprimir mb-6">
        <Link href={`${ruta}/${id}`} className="boton-texto -ml-3">
          ← Volver a la ficha
        </Link>
      </div>

      <EncabezadoPagina
        antetitulo={material.codigo}
        titulo="Editar ficha"
        descripcion="Las existencias no se editan aqui: se corrigen con un movimiento de ajuste."
      />

      <FormularioMaterial
        clase={clase}
        material={material}
        proveedores={proveedores.filter((p) => p.activo || p.id === material.proveedor_id)}
        accion={actualizarMaterial.bind(null, clase, id)}
      />
    </>
  );
}
