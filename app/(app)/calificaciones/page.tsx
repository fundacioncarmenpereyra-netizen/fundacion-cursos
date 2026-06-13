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
      codigo: string | null;
      nombre: string;
    }
  | {
      codigo: string | null;
      nombre: string;
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
  profesores: RelacionProfesor;
};

type Inscripcion = {
  id: string;
  participante_id: string | null;
  programacion_id: string | null;
  codigo_inscripcion: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
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
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  nota_practica: number | null;
  nota_teorica: number | null;
  nota_final: number | null;
  estado: string | null;
  observacion: string | null;
  evaluado_por: string | null;
  fecha_evaluacion: string | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

function calcularNotaFinal(practica: string, teorica: string) {
  const notaPractica = practica === "" ? null : Number(practica);
  const notaTeorica = teorica === "" ? null : Number(teorica);

  if (notaPractica === null && notaTeorica === null) return null;
  if (notaPractica !== null && notaTeorica === null) return notaPractica;
  if (notaPractica === null && notaTeorica !== null) return notaTeorica;

  return Number((((notaPractica || 0) + (notaTeorica || 0)) / 2).toFixed(2));
}

function estadoPorNota(notaFinal: number | null) {
  if (notaFinal === null) return "Pendiente";
  return notaFinal >= 70 ? "Aprobado" : "Reprobado";
}

export default function CalificacionesPage() {
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [programacionId, setProgramacionId] = useState("");
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [evaluadoPor, setEvaluadoPor] = useState("");
  const [fechaEvaluacion, setFechaEvaluacion] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [notasPracticas, setNotasPracticas] = useState<Record<string, string>>(
    {}
  );
  const [notasTeoricas, setNotasTeoricas] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [guardandoId, setGuardandoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarProgramaciones();
  }, []);

  useEffect(() => {
    if (programacionId) {
      cargarDetalle(programacionId);
    } else {
      limpiarDetalle();
    }
  }, [programacionId]);

  function limpiarDetalle() {
    setInscripciones([]);
    setCalificaciones([]);
    setNotasPracticas({});
    setNotasTeoricas({});
    setObservaciones({});
  }

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
          codigo,
          nombre
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
      console.error("Error cargando programaciones:", error);
      setError(`Error cargando programaciones: ${error.message}`);
      setProgramaciones([]);
    } else {
      const lista = (data || []) as Programacion[];
      setProgramaciones(lista);

      if (lista.length > 0) {
        setProgramacionId(lista[0].id);
      }
    }

    setLoading(false);
  }

  async function cargarDetalle(idProgramacion: string) {
    setLoadingDetalle(true);
    setError("");
    setMensaje("");
    limpiarDetalle();

    const { data: inscripcionesData, error: inscripcionesError } =
      await supabase
        .from("inscripciones")
        .select(
          `
          id,
          participante_id,
          programacion_id,
          codigo_inscripcion,
          fecha_inscripcion,
          estado,
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
        .eq("programacion_id", idProgramacion)
        .order("fecha_inscripcion", { ascending: true });

    if (inscripcionesError) {
      console.error("Error cargando inscripciones:", inscripcionesError);
      setError(`Error cargando inscripciones: ${inscripcionesError.message}`);
      setLoadingDetalle(false);
      return;
    }

    const listaInscripciones = (inscripcionesData || []) as Inscripcion[];
    setInscripciones(listaInscripciones);

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
          evaluado_por,
          fecha_evaluacion
        `
        )
        .eq("programacion_id", idProgramacion);

    if (calificacionesError) {
      console.error("Error cargando calificaciones:", calificacionesError);
      setError(
        `Error cargando calificaciones: ${calificacionesError.message}`
      );
      setCalificaciones([]);
    } else {
      const listaCalificaciones =
        (calificacionesData || []) as Calificacion[];

      setCalificaciones(listaCalificaciones);

      const practicas: Record<string, string> = {};
      const teoricas: Record<string, string> = {};
      const obs: Record<string, string> = {};

      listaCalificaciones.forEach((item) => {
        if (!item.inscripcion_id) return;

        practicas[item.inscripcion_id] =
          item.nota_practica !== null && item.nota_practica !== undefined
            ? String(item.nota_practica)
            : "";

        teoricas[item.inscripcion_id] =
          item.nota_teorica !== null && item.nota_teorica !== undefined
            ? String(item.nota_teorica)
            : "";

        obs[item.inscripcion_id] = item.observacion || "";
      });

      setNotasPracticas(practicas);
      setNotasTeoricas(teoricas);
      setObservaciones(obs);
    }

    setLoadingDetalle(false);
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function calificacionDe(inscripcionId: string) {
    return calificaciones.find((item) => item.inscripcion_id === inscripcionId);
  }

  function validarNota(valor: string) {
    if (valor === "") return true;

    const numero = Number(valor);

    return !Number.isNaN(numero) && numero >= 0 && numero <= 100;
  }

  function colorEstado(valor: string | null | undefined) {
    const estado = (valor || "").toLowerCase();

    if (estado.includes("aprobado")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (estado.includes("reprobado")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (estado.includes("revisión") || estado.includes("revision")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  async function guardarCalificacion(inscripcion: Inscripcion) {
    if (!programacionId) return;

    if (!inscripcion.participante_id) {
      setError("La inscripción no tiene participante vinculado.");
      return;
    }

    const practica = notasPracticas[inscripcion.id] || "";
    const teorica = notasTeoricas[inscripcion.id] || "";
    const observacion = observaciones[inscripcion.id] || "";

    if (!validarNota(practica)) {
      setError("La nota práctica debe estar entre 0 y 100.");
      return;
    }

    if (!validarNota(teorica)) {
      setError("La nota teórica debe estar entre 0 y 100.");
      return;
    }

    const notaFinal = calcularNotaFinal(practica, teorica);
    const estado = estadoPorNota(notaFinal);
    const existente = calificacionDe(inscripcion.id);

    const payload = {
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      programacion_id: programacionId,
      nota_practica: practica === "" ? null : Number(practica),
      nota_teorica: teorica === "" ? null : Number(teorica),
      nota_final: notaFinal,
      estado,
      observacion: observacion.trim() || null,
      evaluado_por: evaluadoPor.trim() || null,
      fecha_evaluacion: fechaEvaluacion || new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    };

    setGuardandoId(inscripcion.id);
    setError("");
    setMensaje("");

    if (existente) {
      const { error } = await supabase
        .from("calificaciones_cursos")
        .update(payload)
        .eq("id", existente.id);

      if (error) {
        console.error("Error actualizando calificación:", error);
        setError(`Error actualizando calificación: ${error.message}`);
        setGuardandoId("");
        return;
      }
    } else {
      const { error } = await supabase
        .from("calificaciones_cursos")
        .insert(payload);

      if (error) {
        console.error("Error creando calificación:", error);
        setError(`Error creando calificación: ${error.message}`);
        setGuardandoId("");
        return;
      }
    }

    const participante = obtenerPrimero(inscripcion.participantes);

    setMensaje(
      `Calificación guardada para ${
        participante?.nombre_completo || "participante"
      }. Estado: ${estado}.`
    );

    await cargarDetalle(programacionId);
    setGuardandoId("");
  }

  async function guardarTodos() {
    if (!programacionId) return;

    const confirmar = window.confirm(
      "¿Desea guardar las calificaciones visibles?"
    );

    if (!confirmar) return;

    setLoadingDetalle(true);
    setError("");
    setMensaje("");

    for (const inscripcion of inscripcionesFiltradas) {
      if (!inscripcion.participante_id) continue;

      const practica = notasPracticas[inscripcion.id] || "";
      const teorica = notasTeoricas[inscripcion.id] || "";
      const observacion = observaciones[inscripcion.id] || "";

      if (!validarNota(practica) || !validarNota(teorica)) {
        setError(
          "Hay una o más notas fuera del rango permitido. Revise que estén entre 0 y 100."
        );
        setLoadingDetalle(false);
        return;
      }

      const notaFinal = calcularNotaFinal(practica, teorica);
      const estado = estadoPorNota(notaFinal);

      const payload = {
        inscripcion_id: inscripcion.id,
        participante_id: inscripcion.participante_id,
        programacion_id: programacionId,
        nota_practica: practica === "" ? null : Number(practica),
        nota_teorica: teorica === "" ? null : Number(teorica),
        nota_final: notaFinal,
        estado,
        observacion: observacion.trim() || null,
        evaluado_por: evaluadoPor.trim() || null,
        fecha_evaluacion:
          fechaEvaluacion || new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("calificaciones_cursos").upsert(
        payload,
        {
          onConflict: "inscripcion_id,programacion_id",
        }
      );

      if (error) {
        console.error("Error guardando lote:", error);
        setError(`Error guardando calificaciones: ${error.message}`);
        setLoadingDetalle(false);
        return;
      }
    }

    setMensaje("Calificaciones guardadas correctamente.");
    await cargarDetalle(programacionId);
    setLoadingDetalle(false);
  }

  function imprimir() {
    window.print();
  }

  function exportarCSV() {
    const encabezados = [
      "Código inscripción",
      "Participante",
      "Cédula",
      "Teléfono",
      "Nota práctica",
      "Nota teórica",
      "Nota final",
      "Estado",
      "Evaluado por",
      "Fecha evaluación",
      "Observación",
    ];

    const filas = inscripcionesFiltradas.map((item) => {
      const participante = obtenerPrimero(item.participantes);
      const calificacion = calificacionDe(item.id);
      const practica = notasPracticas[item.id] || "";
      const teorica = notasTeoricas[item.id] || "";
      const notaFinal = calcularNotaFinal(practica, teorica);

      return [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        practica,
        teorica,
        notaFinal ?? "",
        calificacion?.estado || estadoPorNota(notaFinal),
        calificacion?.evaluado_por || evaluadoPor || "",
        calificacion?.fecha_evaluacion || fechaEvaluacion || "",
        observaciones[item.id] || "",
      ];
    });

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "calificaciones.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const programacionSeleccionada = programaciones.find(
    (item) => item.id === programacionId
  );

  const curso = obtenerPrimero(programacionSeleccionada?.cursos);
  const modalidad = obtenerPrimero(programacionSeleccionada?.modalidades);
  const horario = obtenerPrimero(programacionSeleccionada?.horarios);
  const aula = obtenerPrimero(programacionSeleccionada?.aulas);
  const profesor = obtenerPrimero(programacionSeleccionada?.profesores);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const calificacion = calificacionDe(item.id);
      const practica = notasPracticas[item.id] || "";
      const teorica = notasTeoricas[item.id] || "";
      const notaFinal = calcularNotaFinal(practica, teorica);
      const estado = calificacion?.estado || estadoPorNota(notaFinal);

      const cumpleEstado = filtroEstado === "Todos" || estado === filtroEstado;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        estado,
        practica,
        teorica,
        notaFinal ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [
    inscripciones,
    calificaciones,
    busqueda,
    filtroEstado,
    notasPracticas,
    notasTeoricas,
  ]);

  const resumen = useMemo(() => {
    const total = inscripciones.length;

    const aprobados = inscripciones.filter((item) => {
      const calificacion = calificacionDe(item.id);
      const practica = notasPracticas[item.id] || "";
      const teorica = notasTeoricas[item.id] || "";
      const notaFinal = calcularNotaFinal(practica, teorica);
      const estado = calificacion?.estado || estadoPorNota(notaFinal);
      return estado === "Aprobado";
    }).length;

    const reprobados = inscripciones.filter((item) => {
      const calificacion = calificacionDe(item.id);
      const practica = notasPracticas[item.id] || "";
      const teorica = notasTeoricas[item.id] || "";
      const notaFinal = calcularNotaFinal(practica, teorica);
      const estado = calificacion?.estado || estadoPorNota(notaFinal);
      return estado === "Reprobado";
    }).length;

    const pendientes = total - aprobados - reprobados;

    return {
      total,
      aprobados,
      reprobados,
      pendientes,
    };
  }, [inscripciones, calificaciones, notasPracticas, notasTeoricas]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl space-y-6 print:max-w-none">
        <div className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Calificaciones
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Registro de notas prácticas, teóricas y nota final por estudiante.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={imprimir}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
            >
              Imprimir
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700"
            >
              Exportar CSV
            </button>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Volver al menú
            </Link>
          </div>
        </div>

        {mensaje && (
          <div className="no-print rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="no-print rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_180px]">
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
                      {itemCurso?.codigo ? `${itemCurso.codigo} - ` : ""}
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
                Evaluado por
              </label>

              <input
                type="text"
                value={evaluadoPor}
                onChange={(e) => setEvaluadoPor(e.target.value)}
                placeholder="Nombre del evaluador"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Fecha evaluación
              </label>

              <input
                type="date"
                value={fechaEvaluacion}
                onChange={(e) => setFechaEvaluacion(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={guardarTodos}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                Guardar visibles
              </button>
            </div>
          </div>
        </div>

        {programacionSeleccionada && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:border-0 print:shadow-none">
            <div className="grid gap-4 lg:grid-cols-[1fr_460px]">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                    {programacionSeleccionada.estado || "Sin estado"}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                    {modalidad?.nombre || "Modalidad"}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-900">
                  {curso?.nombre || "Curso sin nombre"}
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Código: {curso?.codigo || "-"} · Facilitador(a):{" "}
                  {profesor?.nombre_completo || "-"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox
                  titulo="Fecha inicio"
                  valor={formatearFecha(programacionSeleccionada.fecha_inicio)}
                />
                <InfoBox
                  titulo="Fecha fin"
                  valor={formatearFecha(programacionSeleccionada.fecha_fin)}
                />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Lugar" valor={aula?.nombre || "-"} />
              </div>
            </div>
          </div>
        )}

        <div className="no-print grid gap-4 md:grid-cols-4">
          <ResumenCard titulo="Total" valor={resumen.total} />
          <ResumenCard
            titulo="Aprobados"
            valor={resumen.aprobados}
            variante="green"
          />
          <ResumenCard
            titulo="Reprobados"
            valor={resumen.reprobados}
            variante="red"
          />
          <ResumenCard
            titulo="Pendientes"
            valor={resumen.pendientes}
            variante="amber"
          />
        </div>

        <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar estudiante
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula, teléfono, correo, código o estado"
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
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Reprobado">Reprobado</option>
                <option value="En revisión">En revisión</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Lista de estudiantes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mostrando {inscripcionesFiltradas.length} registros.
            </p>
          </div>

          {loading || loadingDetalle ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Cargando información...
            </div>
          ) : !programacionId ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Seleccione una programación.
            </div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No hay estudiantes para mostrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-3">
                      Participante
                    </th>
                    <th className="border-b border-slate-200 px-3 py-3">
                      Cédula
                    </th>
                    <th className="border-b border-slate-200 px-3 py-3">
                      Teléfono
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
                    <th className="no-print border-b border-slate-200 px-3 py-3">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {inscripcionesFiltradas.map((item) => {
                    const participante = obtenerPrimero(item.participantes);
                    const practica = notasPracticas[item.id] || "";
                    const teorica = notasTeoricas[item.id] || "";
                    const notaFinal = calcularNotaFinal(practica, teorica);
                    const calificacion = calificacionDe(item.id);
                    const estado = calificacion?.estado || estadoPorNota(notaFinal);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3">
                          <p className="font-black text-slate-900">
                            {participante?.nombre_completo || "-"}
                          </p>

                          <p className="text-xs font-semibold text-slate-500">
                            {item.codigo_inscripcion || "-"}
                          </p>
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {participante?.cedula || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {participante?.telefono || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={practica}
                            onChange={(e) =>
                              setNotasPracticas((actual) => ({
                                ...actual,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={teorica}
                            onChange={(e) =>
                              setNotasTeoricas((actual) => ({
                                ...actual,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <span className="text-lg font-black text-slate-900">
                            {notaFinal ?? "-"}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              estado
                            )}`}
                          >
                            {estado}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <input
                            type="text"
                            value={observaciones[item.id] || ""}
                            onChange={(e) =>
                              setObservaciones((actual) => ({
                                ...actual,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Observación"
                            className="w-full min-w-[180px] rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="no-print border-b border-slate-100 px-3 py-3">
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              disabled={guardandoId === item.id}
                              onClick={() => guardarCalificacion(item)}
                              className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800 disabled:opacity-60"
                            >
                              {guardandoId === item.id
                                ? "Guardando..."
                                : "Guardar"}
                            </button>

                            <Link
                              href={`/inscripciones/${item.id}`}
                              target="_blank"
                              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-xs font-black text-slate-700 hover:bg-slate-50"
                            >
                              Detalle
                            </Link>
                          </div>
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
  variante?: "slate" | "green" | "red" | "amber";
}) {
  const estilos =
    variante === "green"
      ? "border-green-200 bg-green-50 text-green-900"
      : variante === "red"
      ? "border-red-200 bg-red-50 text-red-900"
      : variante === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
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