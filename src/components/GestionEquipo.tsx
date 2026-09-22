"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { cambiarAcceso, cambiarRol, invitarPersona } from "@/lib/acciones/equipo";
import { fechaCorta } from "@/lib/formato";
import type { Perfil, RolUsuario } from "@/lib/tipos";
import { Distintivo } from "./ui";

function BotonInvitar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="boton boton-principal" disabled={pending}>
      {pending ? "Enviando…" : "Enviar invitacion"}
    </button>
  );
}

export function GestionEquipo({ perfiles, yo }: { perfiles: Perfil[]; yo: Perfil }) {
  const [estado, enviar] = useActionState(invitarPersona, null);
  const [pendiente, empezar] = useTransition();

  return (
    <div className="space-y-14">
      <section>
        <h2 className="antetitulo mb-4">Invitar a alguien</h2>

        <form action={enviar} key={estado?.ok ? "limpio" : "con-datos"} className="max-w-2xl space-y-5">
          {estado && !estado.ok && <div className="aviso aviso-error">{estado.error}</div>}
          {estado && estado.ok && <div className="aviso aviso-exito">{estado.mensaje}</div>}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="nombre">
                Nombre *
              </label>
              <input id="nombre" name="nombre" className="campo" required />
            </div>
            <div>
              <label className="etiqueta" htmlFor="email">
                Correo *
              </label>
              <input id="email" name="email" type="email" className="campo" required />
            </div>
          </div>

          <fieldset>
            <legend className="etiqueta mb-3">Que podra hacer</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="tarjeta flex cursor-pointer gap-3 px-4 py-4">
                <input type="radio" name="rol" value="equipo" defaultChecked className="mt-1 h-5 w-5 accent-[#1f1c19]" />
                <span>
                  <span className="block">Equipo</span>
                  <span className="block text-sm text-humo">
                    Registrar movimientos y actualizar prendas. No ve costos ni borra nada.
                  </span>
                </span>
              </label>
              <label className="tarjeta flex cursor-pointer gap-3 px-4 py-4">
                <input type="radio" name="rol" value="administradora" className="mt-1 h-5 w-5 accent-[#1f1c19]" />
                <span>
                  <span className="block">Administradora</span>
                  <span className="block text-sm text-humo">
                    Todo: crear y editar fichas, ver costos y margenes, invitar personas.
                  </span>
                </span>
              </label>
            </div>
          </fieldset>

          <BotonInvitar />
          <p className="ayuda">
            Recibira un correo con un enlace para elegir su contraseña. Si no llega en unos
            minutos, que revise la carpeta de correo no deseado.
          </p>
        </form>
      </section>

      <section>
        <h2 className="antetitulo mb-4">Personas con acceso</h2>

        <div className="tarjeta overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Desde</th>
                <th className="sin-imprimir" />
              </tr>
            </thead>
            <tbody>
              {perfiles.map((p) => {
                const soyYo = p.id === yo.id;
                return (
                  <tr key={p.id} className={p.activo ? "" : "opacity-55"}>
                    <td>
                      {p.nombre || "—"}
                      {soyYo && <span className="ml-2 text-xs text-humo">(tu)</span>}
                      {!p.activo && <span className="block text-xs text-humo">Sin acceso</span>}
                    </td>
                    <td className="text-grafito">{p.email ?? "—"}</td>
                    <td>
                      {soyYo ? (
                        <Distintivo>{p.rol === "administradora" ? "Administradora" : "Equipo"}</Distintivo>
                      ) : (
                        <select
                          className="campo w-auto min-w-40"
                          value={p.rol}
                          disabled={pendiente}
                          onChange={(e) =>
                            empezar(async () => {
                              await cambiarRol(p.id, e.target.value as RolUsuario);
                            })
                          }
                        >
                          <option value="equipo">Equipo</option>
                          <option value="administradora">Administradora</option>
                        </select>
                      )}
                    </td>
                    <td className="text-grafito">{fechaCorta(p.creado_en)}</td>
                    <td className="sin-imprimir text-right">
                      {!soyYo && (
                        <button
                          type="button"
                          className="boton-texto"
                          disabled={pendiente}
                          onClick={() =>
                            empezar(async () => {
                              await cambiarAcceso(p.id, !p.activo);
                            })
                          }
                        >
                          {p.activo ? "Quitar acceso" : "Devolver acceso"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
