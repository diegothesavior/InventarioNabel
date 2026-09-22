import { MarcoAcceso } from "@/components/MarcoAcceso";

export const metadata = { title: "Falta conectar la base de datos" };

export default function PaginaConfiguracionPendiente() {
  return (
    <MarcoAcceso
      titulo="Falta un paso"
      descripcion="La aplicacion todavia no esta conectada a su base de datos."
    >
      <div className="space-y-4 text-sm leading-relaxed text-grafito">
        <p>
          Para que funcione hay que darle dos datos de Supabase. Estan en el manual de
          instalacion, en el paso <b>«Conectar la aplicacion con la base de datos»</b>:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <code className="bg-lino px-1">NEXT_PUBLIC_SUPABASE_URL</code>
          </li>
          <li>
            <code className="bg-lino px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          </li>
        </ul>
        <p>
          Se pegan en Vercel, en <b>Settings → Environment Variables</b>, y despues se
          vuelve a publicar la aplicacion desde <b>Deployments</b>.
        </p>
      </div>
    </MarcoAcceso>
  );
}
