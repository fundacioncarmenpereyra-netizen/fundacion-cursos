"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profesor = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  codigo_acceso: string | null;
  acceso_activo: boolean | null;
};

export default function AccesoProfesorPage() {
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function acceder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!codigo.trim()) {
      setError("Debe indicar el código de profesor.");
      return;
    }

    if (!clave.trim()) {
      setError("Debe indicar la clave de acceso.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("profesores")
      .select(
        `
        id,
        nombre_completo,
        cedula,
        telefono,
        correo,
        codigo_acceso,
        acceso_activo
      `
      )
      .eq("codigo_acceso", codigo.trim())
      .eq("clave_acceso", clave.trim())
      .eq("acceso_activo", true)
      .maybeSingle();

    if (error) {
      console.error("Error acceso profesor:", error);
      setError(`Error verificando acceso: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("Código o clave incorrecta, o acceso inactivo.");
      setLoading(false);
      return;
    }

    const profesor = data as Profesor;

    await supabase
      .from("profesores")
      .update({
        ultimo_acceso: new Date().toISOString(),
      })
      .eq("id", profesor.id);

    localStorage.setItem(
      "profesor_sesion",
      JSON.stringify({
        id: profesor.id,
        nombre_completo: profesor.nombre_completo,
        cedula: profesor.cedula,
        telefono: profesor.telefono,
        correo: profesor.correo,
        codigo_acceso: profesor.codigo_acceso,
      })
    );

    window.location.href = "/profesor/inicio";

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-4 text-3xl font-black text-slate-900">
              Acceso profesor
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Ingrese su código y clave para acceder a sus cursos asignados.
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={acceder} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Código de profesor
              </label>

              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ejemplo: PROF001"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base font-bold uppercase outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Clave
              </label>

              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Clave de acceso"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Verificando acceso..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Nota
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este acceso es exclusivo para profesores autorizados. Desde aquí
              podrá consultar sus cursos y registrar asistencia.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}