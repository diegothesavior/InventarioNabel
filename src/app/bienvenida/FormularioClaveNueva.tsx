"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function FormularioClaveNueva() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [sesionLista, setSesionLista] = useState<boolean | null>(null);

  // El enlace del correo trae la sesion en la direccion; Supabase la guarda sola.
  useEffect(() => {
    const supabase = crearClienteNavegador();
    supabase.auth.getSession().then(({ data }) => {
      setSesionLista(Boolean(data.session));
      const metadatos = data.session?.user?.user_metadata as { nombre?: string } | undefined;
      if (metadatos?.nombre) setNombre(metadatos.nombre);
    });
  }, []);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (clave !== repetida) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.updateUser({
      password: clave,
      data: nombre.trim() ? { nombre: nombre.trim() } : undefined,
    });

    if (fallo) {
      setCargando(false);
      setError("No se pudo guardar. Pide un enlace nuevo e intentalo otra vez.");
      return;
    }

    if (nombre.trim()) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from("perfiles").update({ nombre: nombre.trim() }).eq("id", data.user.id);
      }
    }

    router.replace("/");
    router.refresh();
  }

  if (sesionLista === false) {
    return (
      <div className="aviso aviso-error">
        Este enlace ya no es valido o caduco. Pide uno nuevo desde <b>Recuperar contraseña</b>.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      {error && <div className="aviso aviso-error">{error}</div>}

      <div>
        <label className="etiqueta" htmlFor="nombre">
          Tu nombre
        </label>
        <input
          id="nombre"
          className="campo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Como quieres aparecer en el historial"
          required
        />
      </div>

      <div>
        <label className="etiqueta" htmlFor="clave">
          Contraseña nueva
        </label>
        <input
          id="clave"
          type="password"
          className="campo"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="new-password"
          required
        />
        <p className="ayuda">Minimo 8 caracteres.</p>
      </div>

      <div>
        <label className="etiqueta" htmlFor="repetida">
          Repite la contraseña
        </label>
        <input
          id="repetida"
          type="password"
          className="campo"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      <button
        type="submit"
        className="boton boton-principal w-full"
        disabled={cargando || sesionLista === null}
      >
        {cargando ? "Guardando…" : "Guardar y entrar"}
      </button>
    </form>
  );
}
