"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CATEGORIAS_INSUMO, TIPOS_TELA, UNIDADES } from "@/lib/config";
import type { ClaseMaterial, Material, Proveedor, ResultadoAccion } from "@/lib/tipos";
import { SubirFoto } from "./SubirFoto";

function BotonGuardar({ texto = "Guardar" }: { texto?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Guardando…" : texto}
    </button>
  );
}

export function FormularioMaterial({
  clase,
  material,
  proveedores,
  accion,
}: {
  clase: ClaseMaterial;
  material?: Material;
  proveedores: Proveedor[];
  accion: (estado: ResultadoAccion | null, datos: FormData) => Promise<ResultadoAccion>;
}) {
  const [estado, enviar] = useActionState(accion, null);
  const esTela = clase === "tela";
  const esNuevo = !material;
  const ruta = esTela ? "/telas" : "/insumos";
  const sugerencias = esTela ? TIPOS_TELA : CATEGORIAS_INSUMO;

  return (
    <form action={enviar} className="max-w-3xl space-y-8">
      {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
      {estado && estado.ok && estado.mensaje && (
        <div className="aviso aviso-exito">{estado.mensaje}</div>
      )}

      <section className="space-y-5">
        <h2 className="antetitulo">Identificacion</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="codigo">
              Codigo *
            </label>
            <input
              id="codigo"
              name="codigo"
              className="campo"
              defaultValue={material?.codigo}
              placeholder={esTela ? "TEL-001" : "INS-001"}
              required
            />
            <p className="ayuda">Como la identifican en el taller. No se puede repetir.</p>
          </div>

          <div>
            <label className="etiqueta" htmlFor="nombre">
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              className="campo"
              defaultValue={material?.nombre}
              placeholder={esTela ? "Seda salvaje marfil" : "Boton nacar 12 mm"}
              required
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="tipo">
              {esTela ? "Tipo de tela" : "Categoria"}
            </label>
            <input
              id="tipo"
              name="tipo"
              className="campo"
              list="sugerencias-tipo"
              defaultValue={material?.tipo ?? ""}
            />
            <datalist id="sugerencias-tipo">
              {sugerencias.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="etiqueta" htmlFor="unidad">
              Unidad de medida
            </label>
            <select
              id="unidad"
              name="unidad"
              className="campo"
              defaultValue={material?.unidad ?? (esTela ? "metro" : "unidad")}
            >
              {UNIDADES.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>

        {esTela && (
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="etiqueta" htmlFor="composicion">
                Composicion
              </label>
              <input
                id="composicion"
                name="composicion"
                className="campo"
                defaultValue={material?.composicion ?? ""}
                placeholder="100% seda"
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="color">
                Color
              </label>
              <input
                id="color"
                name="color"
                className="campo"
                defaultValue={material?.color ?? ""}
                placeholder="Marfil"
              />
            </div>
            <div>
              <label className="etiqueta" htmlFor="ancho_cm">
                Ancho (cm)
              </label>
              <input
                id="ancho_cm"
                name="ancho_cm"
                type="text"
                inputMode="decimal"
                className="campo"
                defaultValue={material?.ancho_cm ?? ""}
                placeholder="140"
              />
            </div>
          </div>
        )}

        <SubirFoto carpeta={esTela ? "telas" : "insumos"} valorInicial={material?.foto_url} />
      </section>

      <section className="space-y-5 border-t border-arena pt-8">
        <h2 className="antetitulo">Abastecimiento</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="proveedor_id">
              Proveedor
            </label>
            <select
              id="proveedor_id"
              name="proveedor_id"
              className="campo"
              defaultValue={material?.proveedor_id ?? ""}
            >
              <option value="">Sin asignar</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="etiqueta" htmlFor="costo_unitario">
              Costo por {esTela ? "metro" : "unidad"}
            </label>
            <input
              id="costo_unitario"
              name="costo_unitario"
              type="text"
              inputMode="decimal"
              className="campo"
              defaultValue={material?.costo_unitario ?? ""}
            />
            <p className="ayuda">Solo lo ve la administradora.</p>
          </div>

          <div>
            <label className="etiqueta" htmlFor="ubicacion">
              Ubicacion fisica
            </label>
            <input
              id="ubicacion"
              name="ubicacion"
              className="campo"
              defaultValue={material?.ubicacion ?? ""}
              placeholder="Estante B, cajon 3"
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="punto_reposicion">
              Punto de reposicion
            </label>
            <input
              id="punto_reposicion"
              name="punto_reposicion"
              type="text"
              inputMode="decimal"
              className="campo"
              defaultValue={material?.punto_reposicion ?? 0}
            />
            <p className="ayuda">Cuando queden menos, aparece la alerta.</p>
          </div>
        </div>

        {esNuevo && (
          <div className="sm:max-w-xs">
            <label className="etiqueta" htmlFor="stock_inicial">
              Existencias actuales
            </label>
            <input
              id="stock_inicial"
              name="stock_inicial"
              type="text"
              inputMode="decimal"
              className="campo"
              placeholder="0"
            />
            <p className="ayuda">
              Se guarda como un movimiento de entrada llamado «Existencia inicial».
            </p>
          </div>
        )}
      </section>

      <section className="space-y-5 border-t border-arena pt-8">
        <div>
          <label className="etiqueta" htmlFor="notas">
            Notas
          </label>
          <textarea id="notas" name="notas" className="campo" defaultValue={material?.notas ?? ""} />
        </div>

        {!esNuevo && (
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="activo"
              className="h-5 w-5 accent-[#1f1c19]"
              defaultChecked={material?.activo ?? true}
            />
            Activa en el inventario
          </label>
        )}
      </section>

      <div className="flex flex-wrap gap-3 border-t border-arena pt-8">
        <BotonGuardar texto={esNuevo ? "Crear ficha" : "Guardar cambios"} />
        <Link href={material ? `${ruta}/${material.id}` : ruta} className="boton boton-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
