import Link from "next/link";
import type { ReactNode } from "react";

/** Encabezado de pagina: antetitulo, titulo y acciones a la derecha. */
export function EncabezadoPagina({
  antetitulo,
  titulo,
  descripcion,
  acciones,
}: {
  antetitulo?: string;
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 border-b border-arena pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        {antetitulo && <p className="antetitulo mb-2">{antetitulo}</p>}
        <h1 className="titulo-seccion">{titulo}</h1>
        {descripcion && <p className="mt-2 max-w-xl text-grafito">{descripcion}</p>}
      </div>
      {acciones && <div className="sin-imprimir flex flex-wrap gap-3">{acciones}</div>}
    </div>
  );
}

/** Mensaje cuando una tabla esta vacia, con una salida clara. */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center gap-4 px-6 py-16 text-center">
      <h2 className="font-display text-2xl">{titulo}</h2>
      {descripcion && <p className="max-w-md text-grafito">{descripcion}</p>}
      {accion}
    </div>
  );
}

export function Distintivo({
  tono = "neutro",
  children,
}: {
  tono?: "neutro" | "alerta" | "bien";
  children: ReactNode;
}) {
  return <span className={`distintivo distintivo-${tono}`}>{children}</span>;
}

/** Dato suelto: etiqueta arriba, valor abajo. Se usa en las fichas. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="antetitulo mb-1">{etiqueta}</dt>
      <dd className="text-[0.975rem]">{children ?? "—"}</dd>
    </div>
  );
}

/** Recuadro con un numero grande. Para el panel de inicio. */
export function Indicador({
  etiqueta,
  valor,
  detalle,
  href,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  href?: string;
  tono?: "neutro" | "alerta";
}) {
  const contenido = (
    <div
      className={`tarjeta h-full px-6 py-7 transition-colors ${
        href ? "hover:border-piedra" : ""
      } ${tono === "alerta" ? "border-alerta/40 bg-alerta-suave" : ""}`}
    >
      <p className="antetitulo">{etiqueta}</p>
      <p
        className={`mt-3 font-display text-4xl leading-none ${
          tono === "alerta" ? "text-alerta" : ""
        }`}
      >
        {valor}
      </p>
      {detalle && <p className="mt-2 text-sm text-humo">{detalle}</p>}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {contenido}
    </Link>
  ) : (
    contenido
  );
}

export function Aviso({
  tono = "info",
  children,
}: {
  tono?: "info" | "error" | "exito";
  children: ReactNode;
}) {
  return <div className={`aviso aviso-${tono}`}>{children}</div>;
}
