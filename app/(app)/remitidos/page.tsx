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
      categorias_cursos: RelacionNombre;
    }
  | {
      codigo: string | null;
      nombre: string;
      categorias_cursos: RelacionNombre;
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
  estrategia_formacion: string | null;
  nivel_certificacion: string | null;
  asesor_responsable: string | null;
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

type Remitido = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  codigo_remision: string | null;
  fecha_remision: string | null;
  estado: string | null;
  observacion: string | null;
  enviado_por: string | null;
  fecha_sesion_informativa: string | null;
  observacion_participante: string | null;
};

type EstadoRemitido =
  | "Pendiente"
  | "Remitido"
  | "Observado"
  | "Corregido"
  | "Aceptado"
  | "Rechazado";

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function RemitidosInfotepPage() {
  const [programaciones, setProgramaciones] = useState<ProgramacionCurso[]>([]);
  const [programacionId, setProgramacionId] = useState("");
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [remitidos, setRemitidos] = useState<Remitido[]>([]);

  const [fechaRemision, setFechaRemision] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [enviadoPor, setEnviadoPor] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

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
      setInscripciones([]);
      setRemitidos([]);
    }
  }, [programacionId]);

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
        estrategia_formacion,
        nivel_certificacion,
        asesor_responsable,
        estado,
        cursos (
          codigo,
          nombre,
          categorias_cursos (
            nombre
          )
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
      console.error("Error inscripciones:", inscripcionesError);
      setError(`Error cargando inscripciones: ${inscripcionesError.message}`);
      setInscripciones([]);
    } else {
      setInscripciones((inscripcionesData || []) as Inscripcion[]);
    }

    const { data: remitidosData, error: remitidosError } = await supabase
      .from("remitidos_infotep")
      .select(
        `
        id,
        inscripcion_id,
        participante_id,
        programacion_id,
        codigo_remision,
        fecha_remision,
        estado,
        observacion,
        enviado_por,
        fecha_sesion_informativa,
        observacion_participante
      `
      )
      .eq("programacion_id", idProgramacion);

    if (remitidosError) {
      console.error("Error remitidos:", remitidosError);
      setError(`Error cargando remitidos: ${remitidosError.message}`);
      setRemitidos([]);
    } else {
      setRemitidos((remitidosData || []) as Remitido[]);
    }

    setLoadingDetalle(false);
  }

  function generarCodigoRemision() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `REM-INFOTEP-${year}-${random}`;
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function remitidoPorInscripcion(inscripcionId: string) {
    return remitidos.find((item) => item.inscripcion_id === inscripcionId);
  }

  function colorEstado(valor: string | null | undefined) {
    const estado = (valor || "").toLowerCase();

    if (estado.includes("aceptado") || estado.includes("remitido")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (estado.includes("rechazado")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (estado.includes("observado")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (estado.includes("corregido")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  async function guardarRemitido(
    inscripcion: Inscripcion,
    estado: EstadoRemitido
  ) {
    if (!programacionId) return;

    if (!fechaRemision) {
      setError("Debe indicar la fecha de remisión.");
      return;
    }

    const participante = obtenerPrimero(inscripcion.participantes);

    if (!inscripcion.participante_id) {
      setError("La inscripción no tiene participante vinculado.");
      return;
    }

    setGuardandoId(inscripcion.id);
    setError("");
    setMensaje("");

    const existente = remitidoPorInscripcion(inscripcion.id);

    const payload = {
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      programacion_id: programacionId,
      codigo_remision: existente?.codigo_remision || generarCodigoRemision(),
      fecha_remision: fechaRemision,
      estado,
      enviado_por: enviadoPor.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (existente) {
      const { error } = await supabase
        .from("remitidos_infotep")
        .update(payload)
        .eq("id", existente.id);

      if (error) {
        console.error("Error actualizando remitido:", error);
        setError(`Error actualizando remitido: ${error.message}`);
        setGuardandoId("");
        return;
      }

      setMensaje(
        `Remisión actualizada para ${participante?.nombre_completo || "participante"}.`
      );
    } else {
      const { error } = await supabase.from("remitidos_infotep").insert(payload);

      if (error) {
        console.error("Error creando remitido:", error);
        setError(`Error creando remitido: ${error.message}`);
        setGuardandoId("");
        return;
      }

      setMensaje(
        `Participante remitido correctamente: ${
          participante?.nombre_completo || "participante"
        }.`
      );
    }

    await cargarDetalle(programacionId);
    setGuardandoId("");
  }

  async function actualizarCampoRemitido(
    remitidoId: string,
    campo: "fecha_sesion_informativa" | "observacion_participante" | "observacion",
    valor: string
  ) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("remitidos_infotep")
      .update({
        [campo]: valor || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", remitidoId);

    if (error) {
      console.error("Error actualizando campo remitido:", error);
      setError(`Error actualizando remitido: ${error.message}`);
      return;
    }

    setRemitidos((actual) =>
      actual.map((item) =>
        item.id === remitidoId
          ? {
              ...item,
              [campo]: valor || null,
            }
          : item
      )
    );
  }

  async function remitirTodos() {
    if (!programacionId) return;

    if (!fechaRemision) {
      setError("Debe indicar la fecha de remisión.");
      return;
    }

    const confirmar = window.confirm(
      "¿Desea marcar todos los participantes como remitidos?"
    );

    if (!confirmar) return;

    setLoadingDetalle(true);
    setError("");
    setMensaje("");

    const payload = inscripciones
      .filter((item) => item.participante_id)
      .map((item) => {
        const existente = remitidoPorInscripcion(item.id);

        return {
          inscripcion_id: item.id,
          participante_id: item.participante_id,
          programacion_id: programacionId,
          codigo_remision: existente?.codigo_remision || generarCodigoRemision(),
          fecha_remision: fechaRemision,
          estado: "Remitido",
          enviado_por: enviadoPor.trim() || null,
          updated_at: new Date().toISOString(),
        };
      });

    const { error } = await supabase.from("remitidos_infotep").upsert(payload, {
      onConflict: "inscripcion_id,programacion_id",
    });

    if (error) {
      console.error("Error remitiendo todos:", error);
      setError(`Error remitiendo participantes: ${error.message}`);
      setLoadingDetalle(false);
      return;
    }

    setMensaje("Todos los participantes fueron marcados como remitidos.");
    await cargarDetalle(programacionId);

    setLoadingDetalle(false);
  }

  function imprimir() {
    window.print();
  }

  const programacionSeleccionada = programaciones.find(
    (item) => item.id === programacionId
  );

  const curso = obtenerPrimero(programacionSeleccionada?.cursos);
  const categoria = obtenerPrimero(curso?.categorias_cursos);
  const modalidad = obtenerPrimero(programacionSeleccionada?.modalidades);
  const horario = obtenerPrimero(programacionSeleccionada?.horarios);
  const aula = obtenerPrimero(programacionSeleccionada?.aulas);
  const profesor = obtenerPrimero(programacionSeleccionada?.profesores);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const remitido = remitidoPorInscripcion(item.id);
      const estadoRemitido = remitido?.estado || "Pendiente";

      const cumpleEstado =
        filtroEstado === "Todos" || estadoRemitido === filtroEstado;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        estadoRemitido,
        remitido?.observacion_participante || "",
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [inscripciones, remitidos, busqueda, filtroEstado]);

  const remitidosParaImprimir = inscripciones.filter((item) => {
    const remitido = remitidoPorInscripcion(item.id);
    return remitido && remitido.estado !== "Rechazado";
  });

  const resumen = useMemo(() => {
    return {
      inscritos: inscripciones.length,
      pendientes: inscripciones.filter(
        (item) => !remitidoPorInscripcion(item.id)
      ).length,
      remitidos: remitidos.filter((item) => item.estado === "Remitido").length,
      aceptados: remitidos.filter((item) => item.estado === "Aceptado").length,
      observados: remitidos.filter((item) => item.estado === "Observado").length,
      rechazados: remitidos.filter((item) => item.estado === "Rechazado").length,
    };
  }, [inscripciones, remitidos]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 10mm;
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
              Remitidos INFOTEP
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Generación y control de la Lista de Remitidos a Inicio de Acción
              Formativa.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={imprimir}
              className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Imprimir formato
            </button>

            <Link
              href="/certificados"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Certificados
            </Link>

            <Link
              href="/inscripciones"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Inscripciones
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
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_220px_160px]">
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
                Fecha remisión
              </label>

              <input
                type="date"
                value={fechaRemision}
                onChange={(e) => setFechaRemision(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Enviado por
              </label>

              <input
                type="text"
                value={enviadoPor}
                onChange={(e) => setEnviadoPor(e.target.value)}
                placeholder="Nombre de quien remite"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={remitirTodos}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700"
              >
                Remitir todos
              </button>
            </div>
          </div>
        </div>

        {programacionSeleccionada && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
            <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
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
                  Código: {curso?.codigo || "-"} · Familia profesional:{" "}
                  {categoria?.nombre || "-"}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Facilitador(a): {profesor?.nombre_completo || "-"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox
                  titulo="Fecha inicio"
                  valor={formatearFecha(programacionSeleccionada.fecha_inicio)}
                />
                <InfoBox titulo="Días" valor={horario?.dias || "-"} />
                <InfoBox titulo="Horario" valor={horario?.nombre || "-"} />
                <InfoBox titulo="Lugar" valor={aula?.nombre || "-"} />
                <InfoBox
                  titulo="Estrategia"
                  valor={programacionSeleccionada.estrategia_formacion || "-"}
                />
                <InfoBox
                  titulo="Nivel"
                  valor={programacionSeleccionada.nivel_certificacion || "-"}
                />
              </div>
            </div>
          </div>
        )}

        <div className="no-print grid gap-4 md:grid-cols-6">
          <ResumenCard titulo="Inscritos" valor={resumen.inscritos} />
          <ResumenCard titulo="Pendientes" valor={resumen.pendientes} variante="amber" />
          <ResumenCard titulo="Remitidos" valor={resumen.remitidos} variante="green" />
          <ResumenCard titulo="Aceptados" valor={resumen.aceptados} variante="green" />
          <ResumenCard titulo="Observados" valor={resumen.observados} variante="amber" />
          <ResumenCard titulo="Rechazados" valor={resumen.rechazados} variante="red" />
        </div>

        <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar participante
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula, teléfono, correo o código"
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
                <option value="Remitido">Remitido</option>
                <option value="Observado">Observado</option>
                <option value="Corregido">Corregido</option>
                <option value="Aceptado">Aceptado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="no-print rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Participantes para remitir
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
              No hay participantes para mostrar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inscripcionesFiltradas.map((item) => {
                const participante = obtenerPrimero(item.participantes);
                const estadoInscripcion = obtenerPrimero(
                  item.estados_inscripcion
                );
                const remitido = remitidoPorInscripcion(item.id);
                const estadoRemitido = remitido?.estado || "Pendiente";

                return (
                  <article key={item.id} className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              estadoRemitido
                            )}`}
                          >
                            {estadoRemitido}
                          </span>

                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                            {estadoInscripcion?.nombre || "Sin estado"}
                          </span>

                          {remitido?.codigo_remision && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {remitido.codigo_remision}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {participante?.nombre_completo || "Sin participante"}
                        </h3>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <InfoBox
                            titulo="Código inscripción"
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
                            titulo="Fecha SI"
                            valor={formatearFecha(
                              remitido?.fecha_sesion_informativa
                            )}
                          />
                        </div>

                        {remitido && (
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                                Fecha sesión informativa / SI
                              </label>

                              <input
                                type="date"
                                value={
                                  remitido.fecha_sesion_informativa || ""
                                }
                                onChange={(e) =>
                                  actualizarCampoRemitido(
                                    remitido.id,
                                    "fecha_sesion_informativa",
                                    e.target.value
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                                Observación participante
                              </label>

                              <input
                                type="text"
                                value={
                                  remitido.observacion_participante || ""
                                }
                                onChange={(e) =>
                                  actualizarCampoRemitido(
                                    remitido.id,
                                    "observacion_participante",
                                    e.target.value
                                  )
                                }
                                placeholder="Observación"
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid h-fit gap-2">
                        <button
                          type="button"
                          disabled={guardandoId === item.id}
                          onClick={() => guardarRemitido(item, "Remitido")}
                          className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          {guardandoId === item.id
                            ? "Guardando..."
                            : "Marcar remitido"}
                        </button>

                        {(["Pendiente", "Observado", "Corregido", "Aceptado", "Rechazado"] as EstadoRemitido[]).map(
                          (estado) => (
                            <button
                              key={estado}
                              type="button"
                              disabled={guardandoId === item.id}
                              onClick={() => guardarRemitido(item, estado)}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                            >
                              {estado}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <section className="hidden print:block">
          <div className="text-[11px] text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-900 pb-2">
              <div>
                <p className="font-bold">RT-03-PT-ONA-016-2025</p>
                <p>Edición 15</p>
              </div>

              <div className="text-center">
                <h1 className="text-lg font-black">
                  LISTA DE REMITIDOS A INICIO DE ACCIÓN FORMATIVA
                </h1>
              </div>

              <div className="w-[120px]" />
            </div>

            <h2 className="mt-3 text-center text-sm font-black">
              IDENTIFICACIÓN DEL CURSO
            </h2>

            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
              <p>
                <span className="font-black">Código:</span>{" "}
                {curso?.codigo || ""}
              </p>

              <p>
                <span className="font-black">Acción formativa:</span>{" "}
                {curso?.nombre || ""}
              </p>

              <p>
                <span className="font-black">Familia Profesional:</span>{" "}
                {categoria?.nombre || ""}
              </p>

              <p>
                <span className="font-black">
                  Estrategia de Formación y/o Nivel de Certificación:
                </span>{" "}
                {[
                  programacionSeleccionada?.estrategia_formacion || "",
                  programacionSeleccionada?.nivel_certificacion || "",
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </p>

              <p>
                <span className="font-black">Vía de formación:</span>{" "}
                {modalidad?.nombre || ""}
              </p>

              <p>
                <span className="font-black">Lugar a impartirse:</span>{" "}
                {aula?.nombre || ""}
              </p>

              <p>
                <span className="font-black">Fecha Inicio:</span>{" "}
                {formatearFecha(programacionSeleccionada?.fecha_inicio)}
              </p>

              <p>
                <span className="font-black">Días:</span>{" "}
                {horario?.dias || ""}
              </p>

              <p>
                <span className="font-black">Horario:</span>{" "}
                {horario?.nombre || ""}
              </p>

              <p>
                <span className="font-black">Facilitador(a):</span>{" "}
                {profesor?.nombre_completo || ""}
              </p>
            </div>

            <h2 className="mt-4 text-center text-sm font-black">
              REMITIDOS
            </h2>

            <table className="mt-2 w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="border border-slate-900 px-1 py-1">No.</th>
                  <th className="border border-slate-900 px-1 py-1">
                    Apellidos y nombres
                  </th>
                  <th className="border border-slate-900 px-1 py-1">
                    No. de Cédula
                  </th>
                  <th className="border border-slate-900 px-1 py-1">
                    Observaciones
                  </th>
                  <th className="border border-slate-900 px-1 py-1">SI</th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: 25 }).map((_, index) => {
                  const inscripcion = remitidosParaImprimir[index];
                  const participante = obtenerPrimero(
                    inscripcion?.participantes
                  );
                  const remitido = inscripcion
                    ? remitidoPorInscripcion(inscripcion.id)
                    : null;

                  return (
                    <tr key={index}>
                      <td className="h-6 border border-slate-900 px-1 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-slate-900 px-1">
                        {participante?.nombre_completo || ""}
                      </td>
                      <td className="border border-slate-900 px-1 text-center">
                        {participante?.cedula || ""}
                      </td>
                      <td className="border border-slate-900 px-1">
                        {remitido?.observacion_participante || ""}
                      </td>
                      <td className="border border-slate-900 px-1 text-center">
                        {formatearFecha(remitido?.fecha_sesion_informativa)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-6 grid grid-cols-2 gap-10">
              <p>
                <span className="font-black">Asesor/a responsable:</span>{" "}
                {programacionSeleccionada?.asesor_responsable || ""}
              </p>

              <p>
                <span className="font-black">Fecha remisión:</span>{" "}
                {formatearFecha(fechaRemision)}
              </p>
            </div>
          </div>
        </section>
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