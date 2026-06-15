"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ProfesorSesion = {
  id?: string;
  profesor_id?: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  especialidad?: string | null;
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
    }
  | {
      nombre: string;
      descripcion: string | null;
    }[]
  | null;

type Programacion = {
  id: string;
  profesor_id: string | null;
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
};

type Inscripcion = {
  id: string;
  codigo_inscripcion: string | null;
  estado: string | null;
  fecha_inscripcion: string | null;
  participante_id: string | null;
  participantes:
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
      }
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
      }[]
    | null;
  estados_inscripcion: RelacionNombre;
};

type Documento = {
  id: string;
  participante_id: string | null;
  inscripcion_id: string | null;
  estado: string | null;
};

type Asistencia = {
  id: string;
  participante_id: string | null;
  inscripcion_id: string | null;
  presente: boolean | null;
  estado: string | null;
  fecha_asistencia: string | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

function ProfesorEstudiantesContenido() {
  const searchParams = useSearchParams();
  const programacionId = searchParams.get("programacion");

  const [profesor, setProfesor] = useState<ProfesorSesion | null>(null);
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programacionId]);

  async function cargarDatos() {
    setLoading(true);
    setError("");

    if (!programacionId) {
      setError("No se recibió el ID de la programación.");
      setLoading(false);
      return;
    }

    const sesion = localStorage.getItem("profesor_sesion");

    if (!sesion) {
      window.location.href = "/profesor/login";
      return;
    }

    let profesorData: ProfesorSesion;
    let profesorId: string | undefined;

    try {
      profesorData = JSON.parse(sesion) as ProfesorSesion;
      profesorId = profesorData.profesor_id || profesorData.id;

      if (!profesorId) {
        localStorage.removeItem("profesor_sesion");
        window.location.href = "/profesor/login";
        return;
      }

      setProfesor({
        ...profesorData,
        id: profesorId,
        profesor_id: profesorId,
      });
    } catch (err) {
      localStorage.removeItem("profesor_sesion");
      window.location.href = "/profesor/login";
      return;
    }

    const { data: programacionData, error: programacionError } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        profesor_id,
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
        )
      `
      )
      .eq("id", programacionId)
      .eq("profesor_id", profesorId)
      .maybeSingle();

    if (programacionError) {
      console.error("Error programación:", programacionError);
      setError(
        programacionError.message
          ? `Error cargando programación: ${programacionError.message}`
          : "Error cargando la programación."
      );
      setLoading(false);
      return;
    }

    if (!programacionData) {
      setError("No tiene permiso para ver los estudiantes de esta programación.");
      setLoading(false);
      return;
    }

    setProgramacion(programacionData as Programacion);

    const { data: inscripcionesData, error: inscripcionesError } =
      await supabase
        .from("inscripciones")
        .select(
          `
          id,
          codigo_inscripcion,
          estado,
          fecha_inscripcion,
          participante_id,
          participantes (
            nombre_completo,
            cedula,
            telefono,
            whatsapp,
            correo
          ),
          estados_inscripcion (
            nombre
          )
        `
        )
        .eq("programacion_id", programacionId)
        .order("fecha_inscripcion", { ascending: true });

    if (inscripcionesError) {
      console.error("Error inscripciones:", inscripcionesError);
      setError(
        inscripcionesError.message
          ? `Error cargando estudiantes: ${inscripcionesError.message}`
          : "Error cargando estudiantes."
      );
      setLoading(false);
      return;
    }

    const listaInscripciones = (inscripcionesData || []) as Inscripcion[];
    setInscripciones(listaInscripciones);

    const idsInscripciones = listaInscripciones.map((item) => item.id);
    const idsParticipantes = listaInscripciones
      .map((item) => item.participante_id)
      .filter(Boolean) as string[];

    if (idsInscripciones.length > 0) {
      const { data: documentosData } = await supabase
        .from("participantes_documentos")
        .select("id, participante_id, inscripcion_id, estado")
        .in("inscripcion_id", idsInscripciones);

      setDocumentos((documentosData || []) as Documento[]);

      const { data: asistenciasData } = await supabase
        .from("asistencias_cursos")
        .select("id, participante_id, inscripcion_id, presente, estado, fecha_asistencia")
        .eq("programacion_id", programacionId)
        .in("participante_id", idsParticipantes);

      setAsistencias((asistenciasData || []) as Asistencia[]);
    } else {
      setDocumentos([]);
      setAsistencias([]);
    }

    setLoading(false);
  }

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return inscripciones;

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const estado =
        obtenerPrimero(item.estados_inscripcion)?.nombre || item.estado || "";

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.whatsapp || "",
        participante?.correo || "",
        estado,
      ]
        .join(" ")
        .toLowerCase();

      return cadena.includes(texto);
    });
  }, [busqueda, inscripciones]);

  function cerrarSesion() {
    localStorage.removeItem("profesor_sesion");
    window.location.href = "/profesor/login";
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function resumenDocumentos(inscripcionId: string) {
    const docs = documentos.filter((doc) => doc.inscripcion_id === inscripcionId);

    if (docs.length === 0) return "Sin documentos";

    const aprobados = docs.filter((doc) => doc.estado === "Aprobado").length;
    const rechazados = docs.filter((doc) => doc.estado === "Rechazado").length;
    const pendientes = docs.filter((doc) => doc.estado === "Pendiente").length;

    if (rechazados > 0) return `${rechazados} rechazado(s)`;
    if (pendientes > 0) return "En revisión";

    return `${aprobados}/${docs.length} aprobados`;
  }

  function resumenAsistencia(inscripcionId: string, participanteId: string | null) {
    const registros = asistencias.filter((item) => {
      if (item.inscripcion_id === inscripcionId) return true;
      if (participanteId && item.participante_id === participanteId) return true;
      return false;
    });

    if (registros.length === 0) return "Sin asistencia";

    const presentes = registros.filter(
      (item) => item.presente === true || item.estado === "Presente"
    ).length;

    return `${presentes}/${registros.length} presente(s)`;
  }

  const curso = obtenerPrimero(programacion?.cursos);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);
  const modalidad = obtenerPrimero(programacion?.modalidades);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Estudiantes del curso
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Profesor: {profesor?.nombre_completo || "Profesor"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/profesor/inicio"
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Volver al portal
            </Link>

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando estudiantes...
          </div>
        ) : !error && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {programacion?.estado || "Sin estado"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {modalidad?.nombre || "Modalidad"}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-slate-900">
                    {curso?.nombre || "Curso sin nombre"}
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    {curso?.descripcion || "Sin descripción"}
                  </p>
                </div>

                <Link
                  href={`/profesor/asistencias?programacion=${programacionId}`}
                  className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
                >
                  Registrar asistencia
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox titulo="Fecha inicio" valor={formatearFecha(programacion?.fecha_inicio)} />
                <InfoBox titulo="Fecha fin" valor={formatearFecha(programacion?.fecha_fin)} />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Aula" valor={aula?.nombre || "-"} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Lista de estudiantes
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Total inscritos: {inscripciones.length}
                  </p>
                </div>

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre, cédula, correo o teléfono"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100 md:max-w-md"
                />
              </div>

              <div className="mt-5 overflow-x-auto">
                {estudiantesFiltrados.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    No hay estudiantes para mostrar.
                  </div>
                ) : (
                  <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-3">
                          Código
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Estudiante
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Contacto
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Estado
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Documentos
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Asistencia
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {estudiantesFiltrados.map((item) => {
                        const participante = obtenerPrimero(item.participantes);
                        const estado =
                          obtenerPrimero(item.estados_inscripcion)?.nombre ||
                          item.estado ||
                          "Sin estado";

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="border-b border-slate-100 px-3 py-3 font-black text-blue-700">
                              {item.codigo_inscripcion || "-"}
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <p className="font-black text-slate-900">
                                {participante?.nombre_completo || "-"}
                              </p>
                              <p className="text-xs font-semibold text-slate-500">
                                Cédula: {participante?.cedula || "-"}
                              </p>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <p className="font-semibold text-slate-700">
                                {participante?.telefono || "-"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {participante?.correo || "-"}
                              </p>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                {estado}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              {resumenDocumentos(item.id)}
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              {resumenAsistencia(item.id, item.participante_id)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
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
export default function ProfesorEstudiantesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-6">
          <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
            Cargando módulo de estudiantes...
          </div>
        </main>
      }
    >
      <ProfesorEstudiantesContenido />
    </Suspense>
  );
}