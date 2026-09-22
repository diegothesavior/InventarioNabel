import Link from "next/link";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { FormularioRecuperar } from "./FormularioRecuperar";

export const metadata = { title: "Recuperar contraseña" };

export default function PaginaRecuperar() {
  return (
    <MarcoAcceso
      titulo="Recuperar contraseña"
      descripcion="Te enviamos un enlace al correo para que elijas una contraseña nueva."
      pie={
        <Link href="/entrar" className="underline underline-offset-4">
          Volver a entrar
        </Link>
      }
    >
      <FormularioRecuperar />
    </MarcoAcceso>
  );
}
