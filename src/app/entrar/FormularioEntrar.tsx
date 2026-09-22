"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function FormularioEntrar({ volver }: { volver?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (fallo) {
      setCargando(false);
      setError(
        fallo.message.includes("Invalid login")
          ? "El correo o la contraseña no coinciden."
          : "No se pudo entrar. Intenta de nuevo en un momento.",
      );
      return;
    }

    router.replace(volver && volver.startsWith("/") ? volver : "/");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {error && <div className="aviso aviso-error">{error}</div>}

      <div>
        <label className="etiqueta" htmlFor="email">
          Correo
        </label>
        <input
          id="email"
          type="email"
          className="campo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="clave">
          Contraseña
        </label>
        <input
          id="clave"
          type="password"
          className="campo"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="boton boton-principal w-full" disabled={cargando}>
        {cargando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
