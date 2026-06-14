"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginEstudiantePage() {
  const router = useRouter();

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function iniciarSesion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio) {
      setError("Debe digitar su correo electrónico.");
      return;
    }

    if (!clave) {
      setError("Debe digitar su contraseña.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correoLimpio,
      password: clave,
    });

    if (error) {
      console.error("Error iniciando sesión:", error);
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const authUserId = data.user?.id;

    if (!authUserId) {
      setError("No se pudo validar el usuario.");
      setLoading(false);
      return;
    }

    const { data: participante, error: participanteError } = await supabase
      .from("participantes")
      .select("id, nombre_completo, cedula, telefono, correo, estado")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (participanteError) {
      console.error("Error buscando participante:", participanteError);
      setError(`Error buscando estudiante: ${participanteError.message}`);
      setLoading(false);
      return;
    }

    if (!participante) {
      setError(
        "El usuario existe, pero no tiene un perfil de estudiante vinculado."
      );
      setLoading(false);
      return;
    }

    if ((participante.estado || "").toLowerCase() !== "activo") {
      setError("Este usuario de estudiante no está activo.");
      setLoading(false);
      return;
    }

    localStorage.setItem(
      "estudiante_sesion",
      JSON.stringify({
        auth_user_id: authUserId,
        participante_id: participante.id,
        nombre_completo: participante.nombre_completo,
        cedula: participante.cedula,
        telefono: participante.telefono,
        correo: participante.correo,
      })
    );

    router.push("/estudiantes/panel");

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Fundación Dra. Carmen Pereyra
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Acceso estudiantes
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Inicie sesión con su correo electrónico y contraseña.
          </p>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Correo electrónico
              </label>

              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Contraseña
              </label>

              <input
                type="password"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                placeholder="Digite su contraseña"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Validando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-600">
              ¿Todavía no tiene usuario?
            </p>

            <Link
              href="/estudiantes/registro"
              className="mt-2 inline-block text-sm font-black text-blue-700 hover:underline"
            >
              Crear usuario
            </Link>
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/estudiantes"
            className="text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            Volver al portal de estudiantes
          </Link>
        </div>
      </section>
    </main>
  );
}