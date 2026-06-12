"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CursoRelacion =
  | {
      nombre: string;
      descripcion: string | null;
      duracion: string | null;
      cantidad_horas: number | null;
      precio: number | null;
      estado: string;
    }
  | {
      nombre: string;
      descripcion: string | null;
      duracion: string | null;
      cantidad_horas: number | null;
      precio: number | null;
      estado: string;
    }[]
  | null;

type RelacionNombre =
  | {
      nombre: string;
    }
  | {
      nombre: string;
    }[]
  | null;

type RelacionHorario =
  | {
      nombre: string;
      dias: string;
    }
  | {
      nombre: string;
      dias: string;
    }[]
  | null;

type RelacionProfesor =
  | {
      nombre_completo: string;
    }
  | {
      nombre_completo: string;
    }[]
  | null;

type ProgramacionCurso = {
  id: string;
  curso_id: string | null;
  modalidad_id: string | null;
  horario_id: string | null;
  aula_id: string | null;
  profesor_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_maximo: number | null;
  cupo_disponible: number | null;
  precio_especial: number | null;
  estado: string;
  observacion: string | null;
  cursos: CursoRelacion;
  modalidades: RelacionNombre;
  horarios: RelacionHorario;
  aulas: RelacionNombre;
  profesores: RelacionProfesor;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function InicioMovilPage() {
  const [programaciones, setProgramaciones] = useState<ProgramacionCurso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarCursosDisponibles();
  }, []);

  async function cargarCursosDisponibles() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        curso_id,
        modalidad_id,
        horario_id,
        aula_id,
        profesor_id,
        fecha_inicio,
        fecha_fin,
        cupo_maximo,
        cupo_disponible,
        precio_especial,
        estado,
        observacion,
        cursos!inner (
          nombre,
          descripcion,
          duracion,
          cantidad_horas,
          precio,
          estado
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
        ),
        profesores (
          nombre_completo
        )
      `
      )
      .eq("cursos.estado", "Activo")
      .in("estado", ["Programado", "Abierto"])
      .gt("cupo_disponible", 0)
      .order("fecha_inicio", { ascending: true });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setProgramaciones([]);
    } else {
      setProgramaciones((data || []) as ProgramacionCurso[]);
    }

    setLoading(false);
  }

  function formatearFecha(valor: string | null) {
    if (!valor) return "-";

    const [year, month, day] = valor.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  const cursosFiltrados = programaciones.filter((item) => {
    const texto = busqueda.toLowerCase();

    const curso = obtenerPrimero(item.cursos);
    const modalidad = obtenerPrimero(item.modalidades);
    const horario = obtenerPrimero(item.horarios);
    const profesor = obtenerPrimero(item.profesores);

    const nombreCurso = curso?.nombre || "";
    const descripcionCurso = curso?.descripcion || "";
    const nombreModalidad = modalidad?.nombre || "";
    const nombreHorario = horario?.nombre || "";
    const nombreProfesor = profesor?.nombre_completo || "";

    return (
      nombreCurso.toLowerCase().includes(texto) ||
      descripcionCurso.toLowerCase().includes(texto) ||
      nombreModalidad.toLowerCase().includes(texto) ||
      nombreHorario.toLowerCase().includes(texto) ||
      nombreProfesor.toLowerCase().includes(texto)
    );
  });

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Fundación Dra. Carmen Pereyra
        </p>

        <h1 className="mt-1 text-xl font-black text-slate-900">
          Cursos disponibles
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Seleccione el curso de su interés para iniciar su inscripción.
        </p>
      </section>

      <section className="px-4 py-4">
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-black text-blue-900">
            Inscripción móvil
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-800">
            Aquí se muestran los cursos activos con programación abierta o
            programada y cupos disponibles.
          </p>
        </div>
      </section>

      <section className="space-y-3 px-4 pb-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-bold text-slate-700">
            Buscar curso
          </label>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por curso, modalidad o profesor"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="button"
          onClick={cargarCursosDisponibles}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
        >
          Actualizar cursos
        </button>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Cursos encontrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {cursosFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando cursos disponibles...
          </div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay cursos disponibles en este momento.
          </div>
        ) : (
          cursosFiltrados.map((item) => {
            const curso = obtenerPrimero(item.cursos);
            const modalidad = obtenerPrimero(item.modalidades);
            const horario = obtenerPrimero(item.horarios);
            const aula = obtenerPrimero(item.aulas);
            const profesor = obtenerPrimero(item.profesores);

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      {modalidad?.nombre || "Modalidad no definida"}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900">
                      {curso?.nombre || "Curso sin nombre"}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {curso?.descripcion || "Sin descripción"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                      item.estado === "Abierto"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.estado}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Inicio
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatearFecha(item.fecha_inicio)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Fin
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatearFecha(item.fecha_fin)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-blue-500">
                      Cupos
                    </p>
                    <p className="mt-1 text-sm font-black text-blue-900">
                      {item.cupo_disponible ?? 0} disponibles
                    </p>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-green-500">
                      Costo
                    </p>
                    <p className="mt-1 text-sm font-black text-green-900">
                      {formatearMonto(
                        item.precio_especial && item.precio_especial > 0
                          ? item.precio_especial
                          : curso?.precio
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Horario
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-900">
                    {horario?.nombre || "Horario no definido"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {horario?.dias || ""}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Profesor / Aula
                  </p>

                  <p className="mt-1 text-sm font-black text-slate-900">
                    {profesor?.nombre_completo || "Profesor no definido"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {aula?.nombre || "Aula no definida"}
                  </p>
                </div>

                <Link
                  href={`/movil/inscripcion?programacion=${item.id}`}
                  className="mt-4 block rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm active:scale-[0.99]"
                >
                  Inscribirme
                </Link>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}