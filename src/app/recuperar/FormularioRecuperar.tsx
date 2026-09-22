"use client";

import { useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function FormularioRecuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/bienvenida`,
    });

    setCargando(false);
    if (fallo) {
      setError("No se pudo enviar el correo. Revisa la direccion e intenta de nuevo.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="aviso aviso-exito">
        Listo. Revisa tu correo y abre el enlace que te enviamos. Si no aparece en unos
        minutos, mira en la carpeta de correo no deseado.
      </div>
    );
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
      <button type="submit" className="boton boton-principal w-full" disabled={cargando}>
        {cargando ? "Enviando…" : "Enviar enlace"}
      </button>
    </form>
  );
}
