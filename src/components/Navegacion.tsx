"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Perfil } from "@/lib/tipos";
import { MARCA, NOMBRE_APP } from "@/lib/config";

type Enlace = { href: string; texto: string; soloAdmin?: boolean };

const ENLACES: Enlace[] = [
  { href: "/", texto: "Inicio" },
  { href: "/telas", texto: "Telas" },
  { href: "/insumos", texto: "Insumos" },
  { href: "/movimientos", texto: "Movimientos" },
  { href: "/prendas", texto: "Prendas" },
  { href: "/terminadas", texto: "Terminadas" },
  { href: "/proveedores", texto: "Proveedores" },
  { href: "/historial", texto: "Historial", soloAdmin: true },
  { href: "/equipo", texto: "Equipo", soloAdmin: true },
];

export function Navegacion({ perfil }: { perfil: Perfil }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const esAdmin = perfil.rol === "administradora";
  const visibles = ENLACES.filter((e) => !e.soloAdmin || esAdmin);

  const activo = (href: string) =>
    href === "/" ? ruta === "/" : ruta.startsWith(href);

  return (
    <header className="sin-imprimir sticky top-0 z-40 border-b border-arena bg-hueso/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-5 py-4 lg:px-10">
        <Link href="/" className="shrink-0 leading-none">
          <span className="block font-display text-xl tracking-[0.18em] uppercase">
            {MARCA}
          </span>
          <span className="antetitulo mt-1 block">{NOMBRE_APP}</span>
        </Link>

        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {visibles.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                activo(e.href)
                  ? "text-tinta underline decoration-1 underline-offset-[6px]"
                  : "text-humo hover:text-tinta"
              }`}
            >
              {e.texto}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="text-right leading-tight">
            <div className="text-sm">{perfil.nombre}</div>
            <div className="text-xs text-humo">
              {esAdmin ? "Administradora" : "Equipo"}
            </div>
          </div>
          <Link href="/salir" className="boton-texto" prefetch={false}>
            Salir
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label="Menu"
          className="flex h-12 w-12 items-center justify-center border border-arena lg:hidden"
        >
          <span className="relative block h-3 w-5">
            <span
              className={`absolute left-0 h-px w-5 bg-tinta transition-transform ${
                abierto ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-px w-5 bg-tinta transition-opacity ${
                abierto ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-px w-5 bg-tinta transition-transform ${
                abierto ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      {abierto && (
        <div className="border-t border-arena bg-papel lg:hidden">
          <nav className="flex flex-col px-5 py-2">
            {visibles.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className={`border-b border-lino py-4 text-base ${
                  activo(e.href) ? "text-tinta" : "text-grafito"
                }`}
              >
                {e.texto}
              </Link>
            ))}
            <div className="flex items-center justify-between py-4">
              <span className="text-sm text-humo">
                {perfil.nombre} · {esAdmin ? "Administradora" : "Equipo"}
              </span>
              <Link href="/salir" className="boton-texto" prefetch={false}>
                Salir
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
