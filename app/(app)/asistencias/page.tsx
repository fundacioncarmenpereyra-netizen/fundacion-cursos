"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
    }
  | {
      nombre: string;
      descripcion: string | null;
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
  fecha_inicio: string | null;
  fecha_fin: string | null;
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
  profesores: RelacionProfesor;
};

type AsistenciaCurso = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  fecha_clase: string;
  estado: string | null;
  observacion: string | null;
  created_at: string | null;
  participantes:
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        tshirt_talla: string | null;
      }
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        tshirt_talla: string | null;
      }[]
    | null;
  inscripciones:
    | {
        codigo_inscripcion: string | null;
        estados_inscripcion: RelacionNombre;
      }
    | {
        codigo_inscripcion: string | null;
        estados_inscripcion: RelacionNombre;
      }[]
    | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ReporteAsistenciasPage() {
  const [programaciones, setProgramaciones] = useState<ProgramacionCurso[]>([]);
  const [programacionId, setProgramacionId] = useState("");
  const [fechaClase, setFechaClase] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [asistencias, setAsistencias] = useState<AsistenciaCurso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarProgramaciones();
  }, []);

  useEffect(() => {
    if (programacionId && fechaClase) {
      cargarAsistencias(programacionId, fechaClase);
    } else {
      setAsistencias([]);
    }
  }, [programacionId, fechaClase]);

  async function cargarProgramaciones() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        fecha_inicio,
        fecha_fin,
        estado,
        cursos (
          nombre,
          descripcion
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
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error("Error programaciones:", error);
      setError(`Error cargando programaciones: ${error.message}`);
      setProgramaciones([]);
    } else {
      const lista = (data || []) as ProgramacionCurso[];
      setProgramaciones(lista);

      if (lista.length > 0 && !programacionId) {
        setProgramacionId(lista[0].id);
      }
    }

    setLoading(false);
  }

  async function cargarAsistencias(idProgramacion: string, fecha: string) {
    setLoadingAsistencia(true);
    setError("");

    const { data, error } = await supabase
      .from("asistencias_cursos")
      .select(
        `
        id,
        inscripcion_id,
        participante_id,
        programacion_id,
        fecha_clase,
        estado,
        observacion,
        created_at,
        participantes (
          nombre_completo,
          cedula,
          telefono,
          tshirt_talla
        ),
        inscripciones (
          codigo_inscripcion,
          estados_inscripcion (
            nombre
          )
        )
      `
      )
      .eq("programacion_id", idProgramacion)
      .eq("fecha_clase", fecha)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error asistencias:", error);
      setError(`Error cargando asistencias: ${error.message}`);
      setAsistencias([]);
    } else {
      setAsistencias((data || []) as AsistenciaCurso[]);
    }

    setLoadingAsistencia(false);
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function formatearFechaHora(valor: string | null | undefined) {
    if (!valor) return "-";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return valor;

    return fecha.toLocaleString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function colorEstado(estado: string | null | undefined) {
    const valor = (estado || "").toLowerCase();

    if (valor.includes("presente")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (valor.includes("ausente")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (valor.includes("tardanza")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (valor.includes("excusa")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  function imprimir() {
    window.print();
  }

  const programacionSeleccionada = programaciones.find(
    (item) => item.id === programacionId
  );

  const curso = obtenerPrimero(programacionSeleccionada?.cursos);
  const modalidad = obtenerPrimero(programacionSeleccionada?.modalidades);
  const horario = obtenerPrimero(programacionSeleccionada?.horarios);
  const aula = obtenerPrimero(programacionSeleccionada?.aulas);
  const profesor = obtenerPrimero(programacionSeleccionada?.profesores);

  const asistenciasFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return asistencias.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const inscripcion = obtenerPrimero(item.inscripciones);

      const cumpleEstado =
        filtroEstado === "Todos" || item.estado === filtroEstado;

      const cadena = [
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.tshirt_talla || "",
        inscripcion?.codigo_inscripcion || "",
        item.estado || "",
        item.observacion || "",
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [asistencias, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    return {
      total: asistencias.length,
      presente: asistencias.filter((item) => item.estado === "Presente").length,
      ausente: asistencias.filter((item) => item.estado === "Ausente").length,
      tardanza: asistencias.filter((item) => item.estado === "Tardanza").length,
      excusa: asistencias.filter((item) => item.estado === "Excusa").length,
    };
  }, [asistencias]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 12mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl space-y-6 print:max-w-none">
        <div className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Reporte de asistencias
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Consulta administrativa de asistencias registradas por los
              profesores.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={imprimir}
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Imprimir / Guardar PDF
            </button>

            <Link
              href="/inscripciones"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Inscripciones
            </Link>

            <Link
              href="/pagos"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Pagos
            </Link>
          </div>
        </div>

        <div className="hidden print:block">
          <div className="border-b-4 border-blue-900 pb-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-800">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900">
              Reporte de Asistencia
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              Fecha de clase: {formatearFecha(fechaClase)}
            </p>
          </div>
        </div>

        {error && (
          <div className="no-print rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_180px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Programación / curso
              </label>

              <select
                value={programacionId}
                onChange={(e) => setProgramacionId(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccione</option>
                {programaciones.map((item) => {
                  const itemCurso = obtenerPrimero(item.cursos);
                  const itemProfesor = obtenerPrimero(item.profesores);

                  return (
                    <option key={item.id} value={item.id}>
                      {itemCurso?.nombre || "Curso"} -{" "}
                      {itemProfesor?.nombre_completo || "Profesor"} -{" "}
                      {formatearFecha(item.fecha_inicio)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Fecha
              </label>

              <input
                type="date"
                value={fechaClase}
                onChange={(e) => setFechaClase(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar estudiante
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula, teléfono o código"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Estado
              </label>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Presente">Presente</option>
                <option value="Ausente">Ausente</option>
                <option value="Tardanza">Tardanza</option>
                <option value="Excusa">Excusa</option>
              </select>
            </div>
          </div>
        </div>

        {programacionSeleccionada && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none">
            <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
              <div>
                <div className="flex flex-wrap gap-2 print:hidden">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                    {programacionSeleccionada.estado || "Sin estado"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {modalidad?.nombre || "Modalidad"}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-900 print:mt-4">
                  {curso?.nombre || "Curso sin nombre"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Profesor:{" "}
                  <span className="font-black">
                    {profesor?.nombre_completo || "-"}
                  </span>
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Fecha de clase:{" "}
                  <span className="font-black">
                    {formatearFecha(fechaClase)}
                  </span>
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox
                  titulo="Inicio"
                  valor={formatearFecha(programacionSeleccionada.fecha_inicio)}
                />
                <InfoBox
                  titulo="Fin"
                  valor={formatearFecha(programacionSeleccionada.fecha_fin)}
                />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Días" valor={horario?.dias || "-"} />
                <InfoBox titulo="Aula" valor={aula?.nombre || "-"} />
                <InfoBox titulo="Modalidad" valor={modalidad?.nombre || "-"} />
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <ResumenCard titulo="Total" valor={resumen.total} />
          <ResumenCard titulo="Presentes" valor={resumen.presente} variante="green" />
          <ResumenCard titulo="Ausentes" valor={resumen.ausente} variante="red" />
          <ResumenCard titulo="Tardanzas" valor={resumen.tardanza} variante="amber" />
          <ResumenCard titulo="Excusas" valor={resumen.excusa} variante="blue" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 px-4 py-4 print:px-0">
            <h2 className="text-lg font-black text-slate-900">
              Detalle de asistencia
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mostrando {asistenciasFiltradas.length} registros.
            </p>
          </div>

          {loading || loadingAsistencia ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Cargando asistencias...
            </div>
          ) : !programacionId ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Seleccione una programación para consultar.
            </div>
          ) : asistenciasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No hay asistencias registradas para esta fecha.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 font-black text-slate-600">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Código
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Cédula
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Teléfono
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      T-shirt
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Observación
                    </th>
                    <th className="px-4 py-3 font-black text-slate-600">
                      Registrado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {asistenciasFiltradas.map((item) => {
                    const participante = obtenerPrimero(item.participantes);
                    const inscripcion = obtenerPrimero(item.inscripciones);

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="px-4 py-3">
                          <p className="font-black text-slate-900">
                            {participante?.nombre_completo || "-"}
                          </p>
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {inscripcion?.codigo_inscripcion || "-"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {participante?.cedula || "-"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {participante?.telefono || "-"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {participante?.tshirt_talla || "-"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              item.estado
                            )}`}
                          >
                            {item.estado || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {item.observacion || "-"}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-600">
                          {formatearFechaHora(item.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoBox({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 print:border print:border-slate-200">
      <p className="text-[11px] font-bold uppercase text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function ResumenCard({
  titulo,
  valor,
  variante = "slate",
}: {
  titulo: string;
  valor: number;
  variante?: "slate" | "green" | "red" | "amber" | "blue";
}) {
  const estilos =
    variante === "green"
      ? "border-green-200 bg-green-50 text-green-900"
      : variante === "red"
      ? "border-red-200 bg-red-50 text-red-900"
      : variante === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : variante === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-3xl border p-5 shadow-sm print:p-3 ${estilos}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black print:text-xl">{valor}</p>
    </div>
  );
}