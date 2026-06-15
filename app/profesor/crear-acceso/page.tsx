"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CrearAccesoProfesorPage() {
  const [cedula, setCedula] = useState("");
  const [clave, setClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function limpiarCedula(valor: string) {
    return valor.replace(/\D/g, "");
  }

  async function crearAcceso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMensaje("");
    setError("");

    const cedulaLimpia = limpiarCedula(cedula);

    if (!cedulaLimpia) {
      setError("Debe digitar su cédula.");
      return;
    }

    if (clave.length < 6) {
      setError("La clave debe tener mínimo 6 caracteres.");
      return;
    }

    if (clave !== confirmarClave) {
      setError("La clave y la confirmación no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("crear_acceso_profesor", {
        p_cedula: cedulaLimpia,
        p_clave: clave,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.ok === false) {
        throw new Error(data.mensaje || "No se pudo crear el acceso.");
      }

      setMensaje(
        data?.mensaje ||
          "Acceso creado correctamente. Ya puede iniciar sesión."
      );

      setCedula("");
      setClave("");
      setConfirmarClave("");
    } catch (err) {
      const mensaje =
        err instanceof Error
          ? err.message
          : "Error creando el acceso del profesor.";

      setError(mensaje);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-gradient-to-br from-blue-950 via-blue-800 to-slate-900 p-8 text-white md:p-10">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
              Acceso profesores
            </p>

            <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
              Crear clave de acceso
            </h1>

            <p className="mt-5 text-sm font-semibold leading-relaxed text-blue-100 md:text-base">
              Digite su cédula y cree una clave personal para entrar al panel
              del profesor.
            </p>

            <div className="mt-8 rounded-3xl bg-white/10 p-5 ring-1 ring-white/20">
              <p className="text-sm font-bold text-blue-50">
                Para poder crear acceso, el profesor debe estar registrado y
                activo en el catálogo de profesores.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-10">
            <h2 className="text-2xl font-black text-slate-900">
              Crear mi acceso
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Use su número de cédula sin importar si lo escribe con guiones.
            </p>

            {mensaje && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={crearAcceso} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Cédula
                </label>

                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Ej. 402-2272602-4"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nueva clave
                </label>

                <input
                  type="password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Confirmar clave
                </label>

                <input
                  type="password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  placeholder="Repita la clave"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Creando acceso..." : "Crear acceso"}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/profesor/login";
                }}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
              >
                Ya tengo acceso
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/profesor";
                }}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-200"
              >
                Volver al módulo de profesores
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}