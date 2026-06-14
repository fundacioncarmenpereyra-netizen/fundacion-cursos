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

type Inscripcion = {
  id: string;
  participante_id: string | null;
  programacion_id: string | null;
  codigo_inscripcion: string | null;
  observacion: string | null;
  estado: string | null;
  fecha_inscripcion: string | null;
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
  programaciones_cursos:
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
        cursos: RelacionCurso;
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
      }
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
        cursos: RelacionCurso;
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
      }[]
    | null;
};

type ConteosRelacionados = {
  documentos: number;
  escaneosQr: number;
  pagos: number;
  asistencias: number;
  calificaciones: number;
  certificados: number;
  aprobaciones: number;
  remitidos: number;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function EliminarInscripcionPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Inscripcion | null>(null);
  const [conteos, setConteos] = useState<ConteosRelacionados | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [motivo, setMotivo] = useState("");
  const [realizadoPor, setRealizadoPor] = useState("");
  const [confirmacion, setConfirmacion] = useState("");

  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarInscripciones();
  }, []);

  async function cargarInscripciones() {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        participante_id,
        programacion_id,
        codigo_inscripcion,
        observacion,
        estado,
        fecha_inscripcion,
        participantes (
          nombre_completo,
          cedula,
          telefono,
          correo
        ),
        estados_inscripcion (
          nombre
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          cursos (
            codigo,
            nombre
          ),
          horarios (
            nombre,
            dias
          )
        )
      `
      )
      .order("fecha_inscripcion", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error cargando inscripciones:", error);
      setError(`Error cargando inscripciones: ${error.message}`);
      setInscripciones([]);
    } else {
      setInscripciones((data || []) as Inscripcion[]);
    }

    setLoading(false);
  }

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return inscripciones;

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const programacion = obtenerPrimero(item.programaciones_cursos);
      const curso = obtenerPrimero(programacion?.cursos);
      const horario = obtenerPrimero(programacion?.horarios);
      const estado =
        obtenerPrimero(item.estados_inscripcion)?.nombre || item.estado || "";

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        curso?.codigo || "",
        curso?.nombre || "",
        horario?.nombre || "",
        horario?.dias || "",
        estado,
      ]
        .join(" ")
        .toLowerCase();

      return cadena.includes(texto);
    });
  }, [busqueda, inscripciones]);

  async function seleccionarInscripcion(item: Inscripcion) {
    setSeleccionada(item);
    setConteos(null);
    setConfirmacion("");
    setMensaje("");
    setError("");

    await cargarConteos(item);
  }

  async function cargarConteos(item: Inscripcion) {
    const inscripcionId = item.id;
    const participanteId = item.participante_id;

    const [
      documentosRes,
      qrRes,
      pagosRes,
      asistenciasRes,
      calificacionesRes,
      certificadosRes,
      aprobacionesRes,
      remitidosRes,
    ] = await Promise.all([
      supabase
        .from("participantes_documentos")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("inscripciones_qr_escaneos")
        .select("id", { count: "exact", head: true })
        .eq("inscripcion_id", inscripcionId),

      supabase
        .from("pagos_inscripciones")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("asistencias_cursos")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("calificaciones_cursos")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("certificados")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("aprobaciones_certificados")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("remitidos_infotep")
        .select("id", { count: "exact", head: true })
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),
    ]);

    setConteos({
      documentos: documentosRes.count || 0,
      escaneosQr: qrRes.count || 0,
      pagos: pagosRes.count || 0,
      asistencias: asistenciasRes.count || 0,
      calificaciones: calificacionesRes.count || 0,
      certificados: certificadosRes.count || 0,
      aprobaciones: aprobacionesRes.count || 0,
      remitidos: remitidosRes.count || 0,
    });
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  async function crearRespaldo(item: Inscripcion) {
    const inscripcionId = item.id;
    const participanteId = item.participante_id;

    const [
      documentos,
      escaneosQr,
      pagos,
      asistencias,
      calificaciones,
      certificados,
      aprobaciones,
      remitidos,
    ] = await Promise.all([
      supabase
        .from("participantes_documentos")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("inscripciones_qr_escaneos")
        .select("*")
        .eq("inscripcion_id", inscripcionId),

      supabase
        .from("pagos_inscripciones")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("asistencias_cursos")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("calificaciones_cursos")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("certificados")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("aprobaciones_certificados")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),

      supabase
        .from("remitidos_infotep")
        .select("*")
        .or(
          `inscripcion_id.eq.${inscripcionId}${
            participanteId ? `,participante_id.eq.${participanteId}` : ""
          }`
        ),
    ]);

    return {
      inscripcion: item,
      relacionados: {
        documentos: documentos.data || [],
        escaneos_qr: escaneosQr.data || [],
        pagos: pagos.data || [],
        asistencias: asistencias.data || [],
        calificaciones: calificaciones.data || [],
        certificados: certificados.data || [],
        aprobaciones_certificados: aprobaciones.data || [],
        remitidos_infotep: remitidos.data || [],
      },
    };
  }

  async function registrarAuditoria(
    item: Inscripcion,
    accion: "Anular inscripción" | "Eliminar inscripción",
    respaldo: unknown
  ) {
    const { error } = await supabase.from("auditoria_inscripciones").insert({
      inscripcion_id: item.id,
      codigo_inscripcion: item.codigo_inscripcion,
      participante_id: item.participante_id,
      programacion_id: item.programacion_id,
      accion,
      motivo: motivo.trim() || null,
      realizado_por: realizadoPor.trim() || null,
      datos_respaldo: respaldo,
    });

    if (error) {
      throw new Error(`No se pudo guardar auditoría: ${error.message}`);
    }
  }

  async function anularInscripcion() {
    if (!seleccionada) return;

    if (!motivo.trim()) {
      setError("Debe indicar el motivo de la anulación.");
      return;
    }

    const confirmar = window.confirm(
      "¿Está seguro de anular esta inscripción? Esta acción mantiene el historial."
    );

    if (!confirmar) return;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const respaldo = await crearRespaldo(seleccionada);

      await registrarAuditoria(
        seleccionada,
        "Anular inscripción",
        respaldo
      );

      const { error } = await supabase
        .from("inscripciones")
        .update({
          estado: "Anulada",
          observacion: seleccionada.observacion
            ? `${seleccionada.observacion}\n\nAnulada: ${motivo.trim()}`
            : `Anulada: ${motivo.trim()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", seleccionada.id);

      if (error) {
        throw new Error(`No se pudo anular: ${error.message}`);
      }

      setMensaje("Inscripción anulada correctamente.");
      setSeleccionada(null);
      setConteos(null);
      setMotivo("");
      setConfirmacion("");
      await cargarInscripciones();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error anulando inscripción.";
      setError(mensaje);
    }

    setProcesando(false);
  }

  async function eliminarInscripcion() {
    if (!seleccionada) return;

    if (!motivo.trim()) {
      setError("Debe indicar el motivo de la eliminación.");
      return;
    }

    if (confirmacion.trim().toUpperCase() !== "ELIMINAR") {
      setError("Debe escribir ELIMINAR para confirmar la eliminación definitiva.");
      return;
    }

    const confirmar = window.confirm(
      "Esta acción eliminará definitivamente la inscripción y sus datos relacionados. ¿Desea continuar?"
    );

    if (!confirmar) return;

    setProcesando(true);
    setError("");
    setMensaje("");

    try {
      const { data, error } = await supabase.rpc("eliminar_inscripcion_admin", {
        p_inscripcion_id: seleccionada.id,
        p_motivo: motivo.trim(),
        p_realizado_por: realizadoPor.trim() || "Administrador",
      });

      if (error) {
        throw new Error(`No se pudo eliminar la inscripción: ${error.message}`);
      }

      const respuesta = data as {
        ok?: boolean;
        mensaje?: string;
        codigo_inscripcion?: string | null;
      } | null;

      if (respuesta?.ok === false) {
        throw new Error(
          respuesta.mensaje || "No se pudo eliminar la inscripción."
        );
      }

      setMensaje(
        respuesta?.mensaje || "Inscripción eliminada definitivamente."
      );
      setSeleccionada(null);
      setConteos(null);
      setMotivo("");
      setConfirmacion("");

      await cargarInscripciones();
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error eliminando inscripción.";
      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  }

  function resumenSeleccionado() {
    if (!seleccionada) return null;

    const participante = obtenerPrimero(seleccionada.participantes);
    const programacion = obtenerPrimero(seleccionada.programaciones_cursos);
    const curso = obtenerPrimero(programacion?.cursos);
    const horario = obtenerPrimero(programacion?.horarios);
    const estado =
      obtenerPrimero(seleccionada.estados_inscripcion)?.nombre ||
      seleccionada.estado ||
      "Sin estado";

    return {
      participante,
      programacion,
      curso,
      horario,
      estado,
    };
  }

  const detalle = resumenSeleccionado();

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[32px] bg-gradient-to-r from-red-950 via-red-800 to-slate-900 p-6 text-white shadow-xl md:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">
              Administración
            </p>

            <h1 className="mt-3 text-3xl font-black md:text-5xl">
              Anular / eliminar inscripción
            </h1>

            <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-red-100 md:text-base">
              Use este módulo con cuidado. Para operaciones normales se
              recomienda anular. La eliminación definitiva debe usarse solo para
              pruebas o errores.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-red-900 hover:bg-red-50"
            >
              Volver al dashboard
            </Link>

            <Link
              href="/inscripciones"
              className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
            >
              Ver inscripciones
            </Link>
          </div>
        </div>

        {mensaje && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Buscar inscripción
                </label>

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Código, nombre, cédula, correo, curso o teléfono"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <button
                type="button"
                onClick={cargarInscripciones}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Actualizar
              </button>
            </div>

            <div className="mt-5 overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  Cargando inscripciones...
                </div>
              ) : inscripcionesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  No hay resultados.
                </div>
              ) : (
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="border-b border-slate-200 px-3 py-3">
                        Fecha
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3">
                        Código
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3">
                        Estudiante
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3">
                        Curso
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3">
                        Estado
                      </th>
                      <th className="border-b border-slate-200 px-3 py-3">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {inscripcionesFiltradas.map((item) => {
                      const participante = obtenerPrimero(item.participantes);
                      const programacion = obtenerPrimero(
                        item.programaciones_cursos
                      );
                      const curso = obtenerPrimero(programacion?.cursos);
                      const estado =
                        obtenerPrimero(item.estados_inscripcion)?.nombre ||
                        item.estado ||
                        "Sin estado";

                      const activa = seleccionada?.id === item.id;

                      return (
                        <tr
                          key={item.id}
                          className={activa ? "bg-red-50" : "hover:bg-slate-50"}
                        >
                          <td className="border-b border-slate-100 px-3 py-3">
                            {formatearFecha(item.fecha_inscripcion)}
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3 font-black">
                            {item.codigo_inscripcion || "-"}
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3">
                            <p className="font-black text-slate-900">
                              {participante?.nombre_completo || "-"}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {participante?.cedula || "-"} ·{" "}
                              {participante?.correo || "-"}
                            </p>
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3">
                            <p className="font-bold text-slate-800">
                              {curso?.nombre || "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {curso?.codigo || ""}
                            </p>
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {estado}
                            </span>
                          </td>

                          <td className="border-b border-slate-100 px-3 py-3">
                            <button
                              type="button"
                              onClick={() => seleccionarInscripcion(item)}
                              className="rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white hover:bg-red-800"
                            >
                              Seleccionar
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

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">
              Detalle seleccionado
            </h2>

            {!seleccionada || !detalle ? (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                Seleccione una inscripción para ver el detalle.
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <InfoLinea
                    titulo="Código"
                    valor={seleccionada.codigo_inscripcion || "-"}
                  />
                  <InfoLinea
                    titulo="Estudiante"
                    valor={detalle.participante?.nombre_completo || "-"}
                  />
                  <InfoLinea
                    titulo="Cédula"
                    valor={detalle.participante?.cedula || "-"}
                  />
                  <InfoLinea
                    titulo="Correo"
                    valor={detalle.participante?.correo || "-"}
                  />
                  <InfoLinea
                    titulo="Curso"
                    valor={detalle.curso?.nombre || "-"}
                  />
                  <InfoLinea
                    titulo="Horario"
                    valor={detalle.horario?.nombre || "-"}
                  />
                  <InfoLinea titulo="Estado" valor={detalle.estado} />
                </div>

                {conteos && (
                  <div className="grid grid-cols-2 gap-3">
                    <Conteo titulo="Documentos" valor={conteos.documentos} />
                    <Conteo titulo="QR" valor={conteos.escaneosQr} />
                    <Conteo titulo="Pagos" valor={conteos.pagos} />
                    <Conteo titulo="Asistencias" valor={conteos.asistencias} />
                    <Conteo titulo="Calificaciones" valor={conteos.calificaciones} />
                    <Conteo titulo="Certificados" valor={conteos.certificados} />
                    <Conteo titulo="Aprobaciones" valor={conteos.aprobaciones} />
                    <Conteo titulo="Remitidos" valor={conteos.remitidos} />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Realizado por
                  </label>

                  <input
                    type="text"
                    value={realizadoPor}
                    onChange={(e) => setRealizadoPor(e.target.value)}
                    placeholder="Nombre del administrador"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Motivo
                  </label>

                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Explique el motivo de la anulación o eliminación"
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  Recomendación: use “Anular inscripción” para mantener el
                  historial. Use “Eliminar definitivamente” solo para registros
                  de prueba o errores.
                </div>

                <button
                  type="button"
                  disabled={procesando}
                  onClick={anularInscripcion}
                  className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  Anular inscripción
                </button>

                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <label className="mb-1 block text-sm font-bold text-red-800">
                    Para eliminar definitivamente escriba ELIMINAR
                  </label>

                  <input
                    type="text"
                    value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)}
                    placeholder="ELIMINAR"
                    className="w-full rounded-2xl border border-red-300 px-4 py-3 text-sm font-black uppercase outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    disabled={procesando}
                    onClick={eliminarInscripcion}
                    className="mt-3 w-full rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white hover:bg-red-800 disabled:opacity-60"
                  >
                    Eliminar definitivamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoLinea({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {valor}
      </p>
    </div>
  );
}

function Conteo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-xs font-black uppercase text-slate-400">{titulo}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{valor}</p>
    </div>
  );
}