import { MarcoAcceso } from "@/components/MarcoAcceso";
import { FormularioClaveNueva } from "./FormularioClaveNueva";

export const metadata = { title: "Elegir contraseña" };

export default function PaginaBienvenida() {
  return (
    <MarcoAcceso
      titulo="Elige tu contraseña"
      descripcion="Solo la necesitas una vez. Después entrarás con tu correo y esta contraseña."
    >
      <FormularioClaveNueva />
    </MarcoAcceso>
  );
}
