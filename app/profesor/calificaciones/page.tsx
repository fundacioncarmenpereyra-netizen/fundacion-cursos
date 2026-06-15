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
        correo: string | null;
      }
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        correo: string | null;
      }[]
    | null;
  estados_inscripcion: RelacionNombre;
};

type Calificacion = {
  id?: string;
  inscripcion_id: string;
  participante_id: string | null;
  programacion_id: string;
  nota_practica: number | null;
  nota_teorica: number | null;
  nota_final: number | null;
  estado: string | null;
  observacion: string | null;
  evaluado_por: string | null;
};

type FormCalificacion = {
  calificacion_id?: string;
  nota_practica: string;
  nota_teorica: string;
  observacion: string;
  estado: string;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

function ProfesorCalificacionesContenido() {
  const searchParams = useSearchParams();
  const programacionId = searchParams.get("programacion");

  const [profesor, setProfesor] = useState<ProfesorSesion | null>(null);
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [formularios, setFormularios] = useState<Record<string, FormCalificacion>>({});
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programacionId]);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    setMensaje("");

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
      setError("No tiene permiso para calificar esta programación.");
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

    if (idsInscripciones.length === 0) {
      setFormularios({});
      setLoading(false);
      return;
    }

    const { data: calificacionesData, error: calificacionesError } =
      await supabase
        .from("calificaciones_cursos")
        .select(
          `
          id,
          inscripcion_id,
          participante_id,
          programacion_id,
          nota_practica,
          nota_teorica,
          nota_final,
          estado,
          observacion,
          evaluado_por
        `
        )
        .eq("programacion_id", programacionId)
        .in("inscripcion_id", idsInscripciones);

    if (calificacionesError) {
      console.error("Error calificaciones:", calificacionesError);
      setError(
        calificacionesError.message
          ? `Error cargando calificaciones: ${calificacionesError.message}`
          : "Error cargando calificaciones."
      );
      setLoading(false);
      return;
    }

    const calificaciones = (calificacionesData || []) as Calificacion[];

    const formulariosIniciales: Record<string, FormCalificacion> = {};

    listaInscripciones.forEach((inscripcion) => {
      const calificacion = calificaciones.find(
        (item) => item.inscripcion_id === inscripcion.id
      );

      formulariosIniciales[inscripcion.id] = {
        calificacion_id: calificacion?.id,
        nota_practica:
          calificacion?.nota_practica !== null &&
          calificacion?.nota_practica !== undefined
            ? String(calificacion.nota_practica)
            : "",
        nota_teorica:
          calificacion?.nota_teorica !== null &&
          calificacion?.nota_teorica !== undefined
            ? String(calificacion.nota_teorica)
            : "",
        observacion: calificacion?.observacion || "",
        estado: calificacion?.estado || "Pendiente",
      };
    });

    setFormularios(formulariosIniciales);
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
        participante?.correo || "",
        estado,
      ]
        .join(" ")
        .toLowerCase();

      return cadena.includes(texto);
    });
  }, [busqueda, inscripciones]);

  function actualizarFormulario(
    inscripcionId: string,
    campo: keyof FormCalificacion,
    valor: string
  ) {
    setFormularios((prev) => ({
      ...prev,
      [inscripcionId]: {
        ...prev[inscripcionId],
        [campo]: valor,
      },
    }));
  }

  function calcularNotaFinal(notaPractica: string, notaTeorica: string) {
    const practica = Number(notaPractica);
    const teorica = Number(notaTeorica);

    if (Number.isNaN(practica) || Number.isNaN(teorica)) return null;
    if (notaPractica.trim() === "" || notaTeorica.trim() === "") return null;

    return Number(((practica + teorica) / 2).toFixed(2));
  }

  function estadoAutomatico(notaFinal: number | null) {
    if (notaFinal === null) return "Pendiente";
    return notaFinal >= 70 ? "Aprobado" : "Reprobado";
  }

  async function guardarCalificacion(inscripcion: Inscripcion) {
    if (!programacionId || !profesor) return;

    const form = formularios[inscripcion.id];

    if (!form) {
      setError("No se encontró el formulario de calificación.");
      return;
    }

    const notaPractica =
      form.nota_practica.trim() === "" ? null : Number(form.nota_practica);
    const notaTeorica =
      form.nota_teorica.trim() === "" ? null : Number(form.nota_teorica);

    if (
      notaPractica !== null &&
      (Number.isNaN(notaPractica) || notaPractica < 0 || notaPractica > 100)
    ) {
      setError("La nota práctica debe estar entre 0 y 100.");
      return;
    }

    if (
      notaTeorica !== null &&
      (Number.isNaN(notaTeorica) || notaTeorica < 0 || notaTeorica > 100)
    ) {
      setError("La nota teórica debe estar entre 0 y 100.");
      return;
    }

    const notaFinal =
      notaPractica !== null && notaTeorica !== null
        ? Number(((notaPractica + notaTeorica) / 2).toFixed(2))
        : null;

    const estado = estadoAutomatico(notaFinal);

    setGuardandoId(inscripcion.id);
    setError("");
    setMensaje("");

    const payload = {
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      programacion_id: programacionId,
      nota_practica: notaPractica,
      nota_teorica: notaTeorica,
      nota_final: notaFinal,
      estado,
      observacion: form.observacion.trim() || null,
      evaluado_por: profesor.nombre_completo,
      fecha_evaluacion: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("calificaciones_cursos")
      .upsert(payload, {
        onConflict: "inscripcion_id,programacion_id",
      });

    if (upsertError) {
      console.error("Error guardando calificación:", upsertError);
      setError(
        upsertError.message
          ? `Error guardando calificación: ${upsertError.message}`
          : "Error guardando calificación."
      );
      setGuardandoId(null);
      return;
    }

    setFormularios((prev) => ({
      ...prev,
      [inscripcion.id]: {
        ...prev[inscripcion.id],
        estado,
      },
    }));

    setMensaje("Calificación guardada correctamente.");
    setGuardandoId(null);
  }

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

  const curso = obtenerPrimero(programacion?.cursos);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);
  const modalidad = obtenerPrimero(programacion?.modalidades);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Calificaciones del curso
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

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando calificaciones...
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
                  href={`/profesor/estudiantes?programacion=${programacionId}`}
                  className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-center text-sm font-black text-blue-800 shadow-sm hover:bg-blue-50"
                >
                  Ver estudiantes
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox
                  titulo="Fecha inicio"
                  valor={formatearFecha(programacion?.fecha_inicio)}
                />
                <InfoBox
                  titulo="Fecha fin"
                  valor={formatearFecha(programacion?.fecha_fin)}
                />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Aula" valor={aula?.nombre || "-"} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Registrar calificaciones
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
                  <table className="w-full min-w-[1200px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <th className="border-b border-slate-200 px-3 py-3">
                          Estudiante
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Código
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Práctica
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Teórica
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Final
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Estado
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Observación
                        </th>
                        <th className="border-b border-slate-200 px-3 py-3">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {estudiantesFiltrados.map((item) => {
                        const participante = obtenerPrimero(item.participantes);
                        const form = formularios[item.id] || {
                          nota_practica: "",
                          nota_teorica: "",
                          observacion: "",
                          estado: "Pendiente",
                        };

                        const notaFinal = calcularNotaFinal(
                          form.nota_practica,
                          form.nota_teorica
                        );

                        const estado = estadoAutomatico(notaFinal);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="border-b border-slate-100 px-3 py-3">
                              <p className="font-black text-slate-900">
                                {participante?.nombre_completo || "-"}
                              </p>
                              <p className="text-xs font-semibold text-slate-500">
                                Cédula: {participante?.cedula || "-"}
                              </p>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3 font-black text-blue-700">
                              {item.codigo_inscripcion || "-"}
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.nota_practica}
                                onChange={(e) =>
                                  actualizarFormulario(
                                    item.id,
                                    "nota_practica",
                                    e.target.value
                                  )
                                }
                                className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                              />
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.nota_teorica}
                                onChange={(e) =>
                                  actualizarFormulario(
                                    item.id,
                                    "nota_teorica",
                                    e.target.value
                                  )
                                }
                                className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                              />
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <span className="font-black text-slate-900">
                                {notaFinal ?? "-"}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ${
                                  estado === "Aprobado"
                                    ? "bg-green-100 text-green-700"
                                    : estado === "Reprobado"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {estado}
                              </span>
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <input
                                type="text"
                                value={form.observacion}
                                onChange={(e) =>
                                  actualizarFormulario(
                                    item.id,
                                    "observacion",
                                    e.target.value
                                  )
                                }
                                placeholder="Observación"
                                className="w-64 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                              />
                            </td>

                            <td className="border-b border-slate-100 px-3 py-3">
                              <button
                                type="button"
                                disabled={guardandoId === item.id}
                                onClick={() => guardarCalificacion(item)}
                                className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-60"
                              >
                                {guardandoId === item.id
                                  ? "Guardando..."
                                  : "Guardar"}
                              </button>
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
export default function ProfesorCalificacionesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 p-6">
          <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-sm">
            Cargando módulo de calificaciones...
          </div>
        </main>
      }
    >
      <ProfesorCalificacionesContenido />
    </Suspense>
  );
}