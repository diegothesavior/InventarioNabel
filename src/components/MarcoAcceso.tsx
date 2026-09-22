import type { ReactNode } from "react";
import { MARCA } from "@/lib/config";

/** Marco comun de las pantallas de acceso: sobrio y centrado. */
export function MarcoAcceso({
  titulo,
  descripcion,
  children,
  pie,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <p className="font-display text-2xl tracking-[0.28em] uppercase">{MARCA}</p>
          <p className="antetitulo mt-3">Inventario del atelier</p>
        </div>

        <div className="tarjeta px-7 py-9 sm:px-9">
          <h1 className="font-display text-3xl leading-tight">{titulo}</h1>
          {descripcion && <p className="mt-3 text-sm text-grafito">{descripcion}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {pie && <div className="mt-6 text-center text-sm text-humo">{pie}</div>}
      </div>
    </div>
  );
}
