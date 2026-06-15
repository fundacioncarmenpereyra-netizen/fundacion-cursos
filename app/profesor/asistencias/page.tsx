"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProfesorSesion = {
  id?: string;
  profesor_id?: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
  codigo_acceso?: string | null;
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

type InscripcionCurso = {
  id: string;
  participante_id: string | null;
  codigo_inscripcion: string | null;
  estado: string | null;
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
  estados_inscripcion: RelacionNombre;
};

type AsistenciaCurso = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  fecha_clase: string;
  estado: string | null;
  observacion: string | null;
};

type EstadoAsistencia = "Presente" | "Ausente" | "Tardanza" | "Excusa";

type AsistenciaFormulario = {
  estado: EstadoAsistencia;
  observacion: string;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ProfesorAsistenciasPage() {
  const [profesor, setProfesor] = useState<ProfesorSesion | null>(null);
  const [programacionId, setProgramacionId] = useState("");
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [inscripciones, setInscripciones] = useState<InscripcionCurso[]>([]);
  const [asistencias, setAsistencias] = useState<AsistenciaCurso[]>([]);
  const [formulario, setFormulario] = useState<
    Record<string, AsistenciaFormulario>
  >({});

  const [fechaClase, setFechaClase] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sesion = localStorage.getItem("profesor_sesion");

    if (!sesion) {
      window.location.href = "/profesor/login";
      return;
    }

    try {
      const profesorData = JSON.parse(sesion) as ProfesorSesion;
      const profesorId = profesorData.profesor_id || profesorData.id;

      if (!profesorId) {
        localStorage.removeItem("profesor_sesion");
        window.location.href = "/profesor/login";
        return;
      }

      const sesionNormalizada: ProfesorSesion = {
        ...profesorData,
        id: profesorId,
        profesor_id: profesorId,
      };

      setProfesor(sesionNormalizada);

      const params = new URLSearchParams(window.location.search);
      const id = params.get("programacion") || "";

      if (!id) {
        setError("No se recibió la programación del curso.");
        return;
      }

      setProgramacionId(id);
      cargarDatos(id, profesorId, fechaClase);
    } catch {
      localStorage.removeItem("profesor_sesion");
      window.location.href = "/profesor/login";
    }
  }, []);

  useEffect(() => {
    const profesorId = profesor?.profesor_id || profesor?.id;

    if (programacionId && profesorId) {
      cargarAsistencias(programacionId, fechaClase);
    }
  }, [fechaClase, programacionId, profesor]);

  async function cargarDatos(
    idProgramacion: string,
    idProfesor: string,
    fecha: string
  ) {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data: programacionData, error: programacionError } = await supabase
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
        )
      `
      )
      .eq("id", idProgramacion)
      .eq("profesor_id", idProfesor)
      .maybeSingle();

    if (programacionError) {
      console.error("Error programación:", programacionError);
      setError(
        programacionError.message
          ? `Error cargando programación: ${programacionError.message}`
          : "Error cargando la programación. Verifique que el curso esté asignado al profesor."
      );
      setLoading(false);
      return;
    }

    if (!programacionData) {
      setError("Esta programación no está asignada a este profesor.");
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
          participante_id,
          codigo_inscripcion,
          estado,
          participantes (
            nombre_completo,
            cedula,
            telefono,
            tshirt_talla
          ),
          estados_inscripcion (
            nombre
          )
        `
        )
        .eq("programacion_id", idProgramacion)
        .order("fecha_inscripcion", { ascending: true });

    if (inscripcionesError) {
      console.error("Error inscripciones:", inscripcionesError);
      setError(
        `Error cargando estudiantes inscritos: ${inscripcionesError.message}`
      );
      setInscripciones([]);
    } else {
      const lista = (inscripcionesData || []) as InscripcionCurso[];
      setInscripciones(lista);

      const inicial: Record<string, AsistenciaFormulario> = {};

      lista.forEach((item) => {
        inicial[item.id] = {
          estado: "Presente",
          observacion: "",
        };
      });

      setFormulario(inicial);
    }

    await cargarAsistencias(idProgramacion, fecha);

    setLoading(false);
  }

  async function cargarAsistencias(idProgramacion: string, fecha: string) {
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
        observacion
      `
      )
      .eq("programacion_id", idProgramacion)
      .eq("fecha_clase", fecha);

    if (error) {
      console.error("Error asistencias:", error);
      setError(`Error cargando asistencias: ${error.message}`);
      setAsistencias([]);
      return;
    }

    const lista = (data || []) as AsistenciaCurso[];
    setAsistencias(lista);

    setFormulario((actual) => {
      const nuevo = { ...actual };

      lista.forEach((asis) => {
        if (asis.inscripcion_id) {
          nuevo[asis.inscripcion_id] = {
            estado: (asis.estado || "Presente") as EstadoAsistencia,
            observacion: asis.observacion || "",
          };
        }
      });

      return nuevo;
    });
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

  function cambiarEstado(inscripcionId: string, estado: EstadoAsistencia) {
    setFormulario((actual) => ({
      ...actual,
      [inscripcionId]: {
        estado,
        observacion: actual[inscripcionId]?.observacion || "",
      },
    }));
  }

  function cambiarObservacion(inscripcionId: string, observacion: string) {
    setFormulario((actual) => ({
      ...actual,
      [inscripcionId]: {
        estado: actual[inscripcionId]?.estado || "Presente",
        observacion,
      },
    }));
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

  async function guardarAsistencia() {
    if (!programacionId) {
      setError("No se encontró la programación.");
      return;
    }

    if (!fechaClase) {
      setError("Debe seleccionar la fecha de clase.");
      return;
    }

    if (inscripciones.length === 0) {
      setError("No hay estudiantes para guardar asistencia.");
      return;
    }

    setGuardando(true);
    setError("");
    setMensaje("");

    const payload = inscripciones
      .filter((item) => item.participante_id)
      .map((item) => ({
        inscripcion_id: item.id,
        participante_id: item.participante_id,
        programacion_id: programacionId,
        fecha_clase: fechaClase,
        estado: formulario[item.id]?.estado || "Presente",
        observacion: formulario[item.id]?.observacion?.trim() || null,
        updated_at: new Date().toISOString(),
      }));

    const { error } = await supabase.from("asistencias_cursos").upsert(payload, {
      onConflict: "inscripcion_id,programacion_id,fecha_clase",
    });

    if (error) {
      console.error("Error guardando asistencia:", error);
      setError(`Error guardando asistencia: ${error.message}`);
      setGuardando(false);
      return;
    }

    setMensaje("Asistencia guardada correctamente.");
    await cargarAsistencias(programacionId, fechaClase);

    setGuardando(false);
  }

  function marcarTodos(estado: EstadoAsistencia) {
    const nuevo: Record<string, AsistenciaFormulario> = {};

    inscripciones.forEach((item) => {
      nuevo[item.id] = {
        estado,
        observacion: formulario[item.id]?.observacion || "",
      };
    });

    setFormulario(nuevo);
  }

  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const cadena = [
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        item.codigo_inscripcion || "",
      ]
        .join(" ")
        .toLowerCase();

      return cadena.includes(texto);
    });
  }, [inscripciones, busqueda]);

  const resumen = useMemo(() => {
    let presente = 0;
    let ausente = 0;
    let tardanza = 0;
    let excusa = 0;

    inscripciones.forEach((item) => {
      const estado = formulario[item.id]?.estado || "Presente";

      if (estado === "Presente") presente++;
      if (estado === "Ausente") ausente++;
      if (estado === "Tardanza") tardanza++;
      if (estado === "Excusa") excusa++;
    });

    return {
      total: inscripciones.length,
      presente,
      ausente,
      tardanza,
      excusa,
    };
  }, [inscripciones, formulario]);

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Registro de asistencia
            </h1>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Profesor: {profesor?.nombre_completo || "-"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/profesor/inicio"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Mis cursos
            </Link>

            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {mensaje && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {programacion && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                    {programacion.estado || "Sin estado"}
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

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
                <InfoBox
                  titulo="Inicio"
                  valor={formatearFecha(programacion.fecha_inicio)}
                />
                <InfoBox
                  titulo="Fin"
                  valor={formatearFecha(programacion.fecha_fin)}
                />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Días" valor={horario?.dias || "-"} />
                <InfoBox titulo="Aula" valor={aula?.nombre || "-"} />
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

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[220px_1fr_420px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Fecha de clase
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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:pt-6">
              <button
                type="button"
                onClick={() => marcarTodos("Presente")}
                className="rounded-2xl bg-blue-700 px-3 py-3 text-xs font-black text-white hover:bg-blue-800"
              >
                Todos presentes
              </button>

              <button
                type="button"
                onClick={() => marcarTodos("Ausente")}
                className="rounded-2xl bg-red-600 px-3 py-3 text-xs font-black text-white hover:bg-red-700"
              >
                Todos ausentes
              </button>

              <button
                type="button"
                onClick={() => marcarTodos("Tardanza")}
                className="rounded-2xl bg-amber-500 px-3 py-3 text-xs font-black text-white hover:bg-amber-600"
              >
                Tardanza
              </button>

              <button
                type="button"
                onClick={() => marcarTodos("Excusa")}
                className="rounded-2xl bg-blue-600 px-3 py-3 text-xs font-black text-white hover:bg-blue-700"
              >
                Excusa
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Estudiantes inscritos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mostrando {inscripcionesFiltradas.length} estudiantes.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Cargando estudiantes...
            </div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No hay estudiantes para mostrar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inscripcionesFiltradas.map((item) => {
                const participante = obtenerPrimero(item.participantes);
                const estadoInscripcion = obtenerPrimero(
                  item.estados_inscripcion
                );
                const estadoActual = formulario[item.id]?.estado || "Presente";
                const asistenciaExistente = asistencias.find(
                  (asis) => asis.inscripcion_id === item.id
                );

                return (
                  <article key={item.id} className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              estadoActual
                            )}`}
                          >
                            {estadoActual}
                          </span>

                          {asistenciaExistente && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              Guardado
                            </span>
                          )}

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                            {estadoInscripcion?.nombre || "Sin estado"}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {participante?.nombre_completo || "Sin nombre"}
                        </h3>

                        <div className="mt-3 grid gap-3 sm:grid-cols-4">
                          <InfoBox
                            titulo="Código"
                            valor={item.codigo_inscripcion || "-"}
                          />
                          <InfoBox
                            titulo="Cédula"
                            valor={participante?.cedula || "-"}
                          />
                          <InfoBox
                            titulo="Teléfono"
                            valor={participante?.telefono || "-"}
                          />
                          <InfoBox
                            titulo="T-shirt"
                            valor={participante?.tshirt_talla || "-"}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                          {(
                            [
                              "Presente",
                              "Ausente",
                              "Tardanza",
                              "Excusa",
                            ] as EstadoAsistencia[]
                          ).map((estado) => (
                            <button
                              key={estado}
                              type="button"
                              onClick={() => cambiarEstado(item.id, estado)}
                              className={`rounded-2xl border px-3 py-3 text-xs font-black ${
                                estadoActual === estado
                                  ? colorEstado(estado)
                                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              {estado}
                            </button>
                          ))}
                        </div>

                        <textarea
                          value={formulario[item.id]?.observacion || ""}
                          onChange={(e) =>
                            cambiarObservacion(item.id, e.target.value)
                          }
                          placeholder="Observación opcional"
                          rows={2}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
            <button
              type="button"
              disabled={guardando || loading}
              onClick={guardarAsistencia}
              className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
            >
              {guardando ? "Guardando asistencia..." : "Guardar asistencia"}
            </button>
          </div>
        </div>
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
    <div className={`rounded-3xl border p-5 shadow-sm ${estilos}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black">{valor}</p>
    </div>
  );
}
