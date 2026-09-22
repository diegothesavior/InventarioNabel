import { Navegacion } from "@/components/Navegacion";
import { perfilActual } from "@/lib/supabase/sesion";
import { MARCA } from "@/lib/config";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const perfil = await perfilActual();

  return (
    <div className="flex min-h-screen flex-col">
      <Navegacion perfil={perfil} />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-10 lg:px-10 lg:py-14">
        {children}
      </main>
      <footer className="sin-imprimir border-t border-arena px-5 py-6 text-center text-xs tracking-[0.18em] uppercase text-piedra lg:px-10">
        {MARCA} · Atelier
      </footer>
    </div>
  );
}
