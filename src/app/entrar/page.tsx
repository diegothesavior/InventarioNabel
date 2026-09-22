import Link from "next/link";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { FormularioEntrar } from "./FormularioEntrar";

export const metadata = { title: "Entrar" };

const MENSAJES: Record<string, string> = {
  "sin-perfil": "Tu cuenta existe pero aun no tiene perfil en el taller. Avisa a la administradora.",
  inactivo: "Tu acceso esta desactivado. Habla con la administradora del taller.",
  salida: "Has cerrado la sesion.",
};

export default async function PaginaEntrar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string; error?: string }>;
}) {
  const { volver, error } = await searchParams;
  const mensaje = error ? MENSAJES[error] : undefined;

  return (
    <MarcoAcceso
      titulo="Entrar"
      descripcion="Usa el correo con el que te invitaron al taller."
      pie={
        <>
          ¿Olvidaste tu contraseña?{" "}
          <Link href="/recuperar" className="underline underline-offset-4">
            Recuperarla
          </Link>
        </>
      }
    >
      {mensaje && (
        <div className={`aviso mb-6 ${error === "salida" ? "aviso-info" : "aviso-error"}`}>
          {mensaje}
        </div>
      )}
      <FormularioEntrar volver={volver} />
    </MarcoAcceso>
  );
}
