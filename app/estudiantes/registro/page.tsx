"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegistroEstudiantePage() {
  const router = useRouter();

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  function limpiarCedula(valor: string) {
    return valor.replaceAll("-", "").trim();
  }

  function validarCorreo(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  async function registrarEstudiante(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    const nombre = nombreCompleto.trim();
    const cedulaLimpia = limpiarCedula(cedula);
    const telefonoLimpio = telefono.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (!nombre) {
      setError("Debe digitar el nombre completo.");
      return;
    }

    if (!cedulaLimpia) {
      setError("Debe digitar la cédula.");
      return;
    }

    if (!telefonoLimpio) {
      setError("Debe digitar el teléfono.");
      return;
    }

    if (!correoLimpio) {
      setError("Debe digitar el correo electrónico.");
      return;
    }

    if (!validarCorreo(correoLimpio)) {
      setError("Debe digitar un correo electrónico válido.");
      return;
    }

    if (!clave) {
      setError("Debe digitar una contraseña.");
      return;
    }

    if (clave.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    if (clave !== confirmarClave) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { data: participanteExistente, error: errorParticipante } =
      await supabase
        .from("participantes")
        .select("id, correo, cedula")
        .or(`correo.eq.${correoLimpio},cedula.eq.${cedulaLimpia}`)
        .maybeSingle();

    if (errorParticipante) {
      console.error("Error verificando participante:", errorParticipante);
      setError(`Error verificando estudiante: ${errorParticipante.message}`);
      setLoading(false);
      return;
    }

    if (participanteExistente) {
      setError(
        "Ya existe un estudiante registrado con ese correo o esa cédula. Favor iniciar sesión."
      );
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correoLimpio,
      password: clave,
      options: {
        data: {
          nombre_completo: nombre,
          cedula: cedulaLimpia,
          telefono: telefonoLimpio,
        },
      },
    });

    if (authError) {
      console.error("Error creando usuario:", authError);
      setError(`Error creando usuario: ${authError.message}`);
      setLoading(false);
      return;
    }

    const authUserId = authData.user?.id;

    if (!authUserId) {
      setError(
        "No se pudo obtener el usuario creado. Revise la configuración de Supabase Auth."
      );
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("participantes").insert({
      auth_user_id: authUserId,
      nombre_completo: nombre,
      cedula: cedulaLimpia,
      telefono: telefonoLimpio,
      whatsapp: telefonoLimpio,
      correo: correoLimpio,
      estado: "Activo",
    });

    if (insertError) {
      console.error("Error creando participante:", insertError);
      setError(`Error guardando estudiante: ${insertError.message}`);
      setLoading(false);
      return;
    }

    setMensaje("Registro creado correctamente. Ya puede iniciar sesión.");

    setTimeout(() => {
      router.push("/estudiantes/login");
    }, 1200);

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Fundación Dra. Carmen Pereyra
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Registro de estudiante
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Cree su usuario usando su correo electrónico y una contraseña.
          </p>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          {mensaje && (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={registrarEstudiante} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Digite su nombre completo"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Cédula
                </label>
                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="00000000000"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="8090000000"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

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

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Contraseña
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
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmarClave}
                  onChange={(e) => setConfirmarClave(e.target.value)}
                  placeholder="Repita la contraseña"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Creando usuario..." : "Crear usuario"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm font-semibold text-slate-600">
              ¿Ya tiene usuario?
            </p>

            <Link
              href="/estudiantes/login"
              className="mt-2 inline-block text-sm font-black text-blue-700 hover:underline"
            >
              Iniciar sesión
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