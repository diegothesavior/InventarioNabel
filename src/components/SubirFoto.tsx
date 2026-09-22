"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

/**
 * Sube una foto al almacenamiento de Supabase y deja la direccion en un
 * campo oculto para que el formulario la guarde.
 */
export function SubirFoto({
  nombreCampo = "foto_url",
  valorInicial,
  carpeta,
  etiqueta = "Foto",
}: {
  nombreCampo?: string;
  valorInicial?: string | null;
  carpeta: string;
  etiqueta?: string;
}) {
  const [url, setUrl] = useState<string | null>(valorInicial ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  async function alElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);

    if (!archivo.type.startsWith("image/")) {
      setError("Elige una imagen (JPG, PNG o WEBP).");
      return;
    }
    if (archivo.size > 8 * 1024 * 1024) {
      setError("La foto pesa demasiado. El limite son 8 MB.");
      return;
    }

    setSubiendo(true);
    const supabase = crearClienteNavegador();
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`;

    const { error: fallo } = await supabase.storage
      .from("fotos")
      .upload(ruta, archivo, { cacheControl: "31536000", upsert: false });

    setSubiendo(false);

    if (fallo) {
      setError("No se pudo subir la foto. Revisa tu conexion e intentalo otra vez.");
      return;
    }

    const { data } = supabase.storage.from("fotos").getPublicUrl(ruta);
    setUrl(data.publicUrl);
  }

  return (
    <div>
      <span className="etiqueta">{etiqueta}</span>
      <input type="hidden" name={nombreCampo} value={url ?? ""} />

      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-arena bg-lino">
          {url ? (
            <Image src={url} alt="" fill sizes="112px" className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center text-center text-xs text-piedra">
              Sin foto
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={alElegir}
            className="hidden"
          />
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
          >
            {subiendo ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
          </button>
          {url && (
            <button type="button" className="boton-texto self-start" onClick={() => setUrl(null)}>
              Quitar foto
            </button>
          )}
          <p className="ayuda">Desde el telefono puedes tomarla en el momento.</p>
        </div>
      </div>

      {error && <p className="ayuda text-alerta">{error}</p>}
    </div>
  );
}
