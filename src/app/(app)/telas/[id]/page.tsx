import { PaginaFichaMaterial } from "@/components/PaginaFichaMaterial";

export const metadata = { title: "Ficha" };

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ creado?: string }>;
}) {
  const { id } = await params;
  const { creado } = await searchParams;
  return <PaginaFichaMaterial clase="tela" id={id} recienCreado={creado === "1"} />;
}
