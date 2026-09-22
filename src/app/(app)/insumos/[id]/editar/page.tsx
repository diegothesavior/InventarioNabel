import { PaginaEditarMaterial } from "@/components/PaginasFormularioMaterial";

export const metadata = { title: "Editar ficha" };

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaginaEditarMaterial clase="insumo" id={id} />;
}
