"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfesorSesion = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  codigo_acceso: string | null;
};

type RelacionNombre =
  | {
      nombre: string;
    }
  | {
      nombre: string;
    }[]
  | null;

type RelacionCurso =
  | {
      nombre: string;
      descripcion: string | null;
      precio: number | null;
    }
  | {
      nombre: string;
      descripcion: string | null;
      precio: number | null;
    }[]
  | null;

type ProgramacionProfesor = {
  id: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_maximo: number | null;
  cupo_disponible: number | null;
  estado: string | null;
  cursos: RelacionCurso;
  modalidades: RelacionNombre;
  horarios:
    | {
        nombre: string;
        dias: string | null;
      }
    | {
        nombre: string;
        dias: string | null;
      }[]
    | null;
  aulas: RelacionNombre;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ProfesorInicioPage() {
  const [profesor, setProfesor] = useState<ProfesorSesion | null>(null);
  const [programaciones, setProgramaciones] = useState<ProgramacionProfesor[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sesion = localStorage.getItem("profesor_sesion");

    if (!sesion) {
      window.location.href = "/profesor";
      return;
    }

    const profesorData = JSON.parse(sesion) as ProfesorSesion;
    setProfesor(profesorData);
    cargarProgramaciones(profesorData.id);
  }, []);

  async function cargarProgramaciones(profesorId: string) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        fecha_inicio,
        fecha_fin,
        cupo_maximo,
        cupo_disponible,
        estado,
        cursos (
          nombre,
          descripcion,
          precio
        ),
        modalidades (
          nombre
        ),
        horarios (
          nombre,
          dias
        ),
        aulas (
          nombre
        )
      `
      )
      .eq("profesor_id", profesorId)
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error("Error programaciones profesor:", error);
      setError(`Error cargando cursos asignados: ${error.message}`);
      setProgramaciones([]);
    } else {
      setProgramaciones((data || []) as ProgramacionProfesor[]);
    }

    setLoading(false);
  }

  function cerrarSesion() {
    localStorage.removeItem("profesor_sesion");
    window.location.href = "/profesor";
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Portal del profesor
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Bienvenido, {profesor?.nombre_completo || "Profesor"}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarSesion}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">
            Mis cursos asignados
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Seleccione un curso para registrar asistencia de sus estudiantes.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando cursos asignados...
          </div>
        ) : programaciones.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            No tiene cursos asignados actualmente.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {programaciones.map((programacion) => {
              const curso = obtenerPrimero(programacion.cursos);
              const modalidad = obtenerPrimero(programacion.modalidades);
              const horario = obtenerPrimero(programacion.horarios);
              const aula = obtenerPrimero(programacion.aulas);

              return (
                <article
                  key={programacion.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {programacion.estado || "Sin estado"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {modalidad?.nombre || "Modalidad"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-slate-900">
                    {curso?.nombre || "Curso sin nombre"}
                  </h3>

                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {curso?.descripcion || "Sin descripción"}
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoBox
                      titulo="Fecha inicio"
                      valor={formatearFecha(programacion.fecha_inicio)}
                    />
                    <InfoBox
                      titulo="Fecha fin"
                      valor={formatearFecha(programacion.fecha_fin)}
                    />
                    <InfoBox
                      titulo="Horario"
                      valor={horario?.nombre || "-"}
                    />
                    <InfoBox titulo="Días" valor={horario?.dias || "-"} />
                    <InfoBox titulo="Aula" valor={aula?.nombre || "-"} />
                    <InfoBox
                      titulo="Cupos"
                      valor={`${programacion.cupo_disponible ?? "-"} / ${
                        programacion.cupo_maximo ?? "-"
                      }`}
                    />
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Link
                      href={`/profesor/asistencias?programacion=${programacion.id}`}
                      className="rounded-2xl bg-green-600 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-green-700"
                    >
                      Registrar asistencia
                    </Link>

                    <Link
                      href={`/profesor/asistencias?programacion=${programacion.id}`}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                      Ver estudiantes
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function InfoBox({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">{valor}</p>
    </div>
  );
}