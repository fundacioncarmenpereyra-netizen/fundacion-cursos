"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RelacionParticipante =
  | {
      nombre_completo: string;
      cedula: string | null;
      telefono: string | null;
      whatsapp: string | null;
      correo: string | null;
      es_menor_edad: boolean | null;
      nombre_tutor: string | null;
      telefono_tutor: string | null;
    }
  | {
      nombre_completo: string;
      cedula: string | null;
      telefono: string | null;
      whatsapp: string | null;
      correo: string | null;
      es_menor_edad: boolean | null;
      nombre_tutor: string | null;
      telefono_tutor: string | null;
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

type RelacionProgramacion =
  | {
      fecha_inicio: string | null;
      fecha_fin: string | null;
      estado: string | null;
      cursos: RelacionNombre;
      modalidades: RelacionNombre;
      horarios: RelacionNombre;
      aulas: RelacionNombre;
      profesores:
        | {
            nombre_completo: string;
          }
        | {
            nombre_completo: string;
          }[]
        | null;
    }
  | {
      fecha_inicio: string | null;
      fecha_fin: string | null;
      estado: string | null;
      cursos: RelacionNombre;
      modalidades: RelacionNombre;
      horarios: RelacionNombre;
      aulas: RelacionNombre;
      profesores:
        | {
            nombre_completo: string;
          }
        | {
            nombre_completo: string;
          }[]
        | null;
    }[]
  | null;

type Inscripcion = {
  id: string;
  codigo_inscripcion: string | null;
  qr_token: string | null;
  qr_url: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  observacion: string | null;
  cantidad_escaneos: number | null;
  fecha_ultimo_escaneo: string | null;
  estado_inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  participantes: RelacionParticipante;
  programaciones_cursos: RelacionProgramacion;
  estados_inscripcion: RelacionNombre;
  condiciones_participante: RelacionNombre;
  metodos_pago: RelacionNombre;
  tipos_beca: RelacionNombre;
};

type EstadoInscripcion = {
  id: string;
  nombre: string;
  orden: number | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [estados, setEstados] = useState<EstadoInscripcion[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [actualizandoId, setActualizandoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data: estadosData, error: estadosError } = await supabase
      .from("estados_inscripcion")
      .select("id, nombre, orden")
      .eq("estado", "Activo")
      .order("orden", { ascending: true });

    if (estadosError) {
      console.error("Error estados:", estadosError);
      setError(`Error cargando estados: ${estadosError.message}`);
    } else {
      setEstados((estadosData || []) as EstadoInscripcion[]);
    }

    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        qr_token,
        qr_url,
        fecha_inscripcion,
        estado,
        observacion,
        cantidad_escaneos,
        fecha_ultimo_escaneo,
        estado_inscripcion_id,
        participante_id,
        programacion_id,
        participantes (
          nombre_completo,
          cedula,
          telefono,
          whatsapp,
          correo,
          es_menor_edad,
          nombre_tutor,
          telefono_tutor
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          estado,
          cursos (
            nombre
          ),
          modalidades (
            nombre
          ),
          horarios (
            nombre
          ),
          aulas (
            nombre
          ),
          profesores (
            nombre_completo
          )
        ),
        estados_inscripcion (
          nombre
        ),
        condiciones_participante (
          nombre
        ),
        metodos_pago (
          nombre
        ),
        tipos_beca (
          nombre
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error inscripciones:", error);
      setError(`Error cargando inscripciones: ${error.message}`);
      setInscripciones([]);
    } else {
      setInscripciones((data || []) as Inscripcion[]);
    }

    setLoading(false);
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

  function colorEstado(nombre: string | null | undefined) {
    const estado = (nombre || "").toLowerCase();

    if (estado.includes("aprobada")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (estado.includes("rechazada")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (estado.includes("revisión") || estado.includes("revision")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (estado.includes("espera")) {
      return "bg-purple-100 text-purple-700 border-purple-200";
    }

    if (estado.includes("cancelada")) {
      return "bg-slate-200 text-slate-700 border-slate-300";
    }

    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  async function cambiarEstadoInscripcion(
    inscripcionId: string,
    nombreEstado: string
  ) {
    const estado = estados.find(
      (item) => item.nombre.toLowerCase() === nombreEstado.toLowerCase()
    );

    if (!estado) {
      setError(`No se encontró el estado "${nombreEstado}".`);
      return;
    }

    setActualizandoId(inscripcionId);
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("inscripciones")
      .update({
        estado_inscripcion_id: estado.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inscripcionId);

    if (error) {
      console.error("Error actualizando estado:", error);
      setError(`Error actualizando estado: ${error.message}`);
    } else {
      setMensaje(`Inscripción marcada como ${estado.nombre}.`);
      await cargarDatos();
    }

    setActualizandoId("");
  }

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const programacion = obtenerPrimero(item.programaciones_cursos);
      const curso = obtenerPrimero(programacion?.cursos);
      const estadoInscripcion = obtenerPrimero(item.estados_inscripcion);
      const condicion = obtenerPrimero(item.condiciones_participante);

      const nombreEstado = estadoInscripcion?.nombre || "Sin estado";

      const cumpleEstado =
        filtroEstado === "Todos" || nombreEstado === filtroEstado;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        curso?.nombre || "",
        nombreEstado,
        condicion?.nombre || "",
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [inscripciones, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    const total = inscripciones.length;

    const recibidas = inscripciones.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion);
      return (estado?.nombre || "").toLowerCase().includes("recibida");
    }).length;

    const aprobadas = inscripciones.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion);
      return (estado?.nombre || "").toLowerCase().includes("aprobada");
    }).length;

    const rechazadas = inscripciones.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion);
      return (estado?.nombre || "").toLowerCase().includes("rechazada");
    }).length;

    return {
      total,
      recibidas,
      aprobadas,
      rechazadas,
    };
  }, [inscripciones]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Inscripciones
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Panel administrativo para revisar, aprobar o rechazar solicitudes
              de inscripción.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/catalogos"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Catálogos
            </Link>

            <Link
              href="/movil/inicio"
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Vista móvil
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Total
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {resumen.total}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-500">
              Recibidas
            </p>
            <p className="mt-2 text-3xl font-black text-blue-900">
              {resumen.recibidas}
            </p>
          </div>

          <div className="rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-green-500">
              Aprobadas
            </p>
            <p className="mt-2 text-3xl font-black text-green-900">
              {resumen.aprobadas}
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-red-500">
              Rechazadas
            </p>
            <p className="mt-2 text-3xl font-black text-red-900">
              {resumen.rechazadas}
            </p>
          </div>
        </div>

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

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_240px_160px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, código, cédula, teléfono o curso"
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
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={cargarDatos}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Solicitudes recibidas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Mostrando {inscripcionesFiltradas.length} registros.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Cargando inscripciones...
            </div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No hay inscripciones para mostrar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {inscripcionesFiltradas.map((item) => {
                const participante = obtenerPrimero(item.participantes);
                const programacion = obtenerPrimero(item.programaciones_cursos);
                const curso = obtenerPrimero(programacion?.cursos);
                const modalidad = obtenerPrimero(programacion?.modalidades);
                const horario = obtenerPrimero(programacion?.horarios);
                const aula = obtenerPrimero(programacion?.aulas);
                const profesor = obtenerPrimero(programacion?.profesores);
                const estadoInscripcion = obtenerPrimero(
                  item.estados_inscripcion
                );
                const condicion = obtenerPrimero(item.condiciones_participante);
                const metodoPago = obtenerPrimero(item.metodos_pago);
                const tipoBeca = obtenerPrimero(item.tipos_beca);

                const nombreEstado =
                  estadoInscripcion?.nombre || "Sin estado";

                return (
                  <article key={item.id} className="p-4 md:p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              nombreEstado
                            )}`}
                          >
                            {nombreEstado}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {item.codigo_inscripcion || "Sin código"}
                          </span>

                          {participante?.es_menor_edad && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              Menor de edad
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {participante?.nombre_completo || "Sin participante"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {curso?.nombre || "Curso no definido"} ·{" "}
                          {modalidad?.nombre || "Modalidad no definida"}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Contacto
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {participante?.telefono || "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {participante?.correo || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Fecha solicitud
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {formatearFechaHora(item.fecha_inscripcion)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Curso inicia:{" "}
                              {formatearFecha(programacion?.fecha_inicio)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Condición
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {condicion?.nombre || "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Beca: {tipoBeca?.nombre || "No aplica"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl bg-blue-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-blue-500">
                              Horario
                            </p>
                            <p className="mt-1 text-sm font-black text-blue-950">
                              {horario?.nombre || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-blue-500">
                              Aula / Profesor
                            </p>
                            <p className="mt-1 text-sm font-black text-blue-950">
                              {aula?.nombre || "-"}
                            </p>
                            <p className="mt-1 text-xs text-blue-700">
                              {profesor?.nombre_completo || "-"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-blue-500">
                              QR
                            </p>
                            <p className="mt-1 text-sm font-black text-blue-950">
                              Escaneos: {item.cantidad_escaneos || 0}
                            </p>
                            <p className="mt-1 text-xs text-blue-700">
                              Último:{" "}
                              {formatearFechaHora(item.fecha_ultimo_escaneo)}
                            </p>
                          </div>
                        </div>

                        {participante?.es_menor_edad && (
                          <div className="mt-3 rounded-2xl bg-amber-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-amber-500">
                              Tutor
                            </p>
                            <p className="mt-1 text-sm font-black text-amber-900">
                              {participante.nombre_tutor || "-"}
                            </p>
                            <p className="mt-1 text-xs text-amber-800">
                              Teléfono: {participante.telefono_tutor || "-"}
                            </p>
                          </div>
                        )}

                        {item.observacion && (
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Observación
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {item.observacion}
                            </p>
                          </div>
                        )}

                        <p className="mt-3 text-xs text-slate-500">
                          Método de pago: {metodoPago?.nombre || "Pendiente"}
                        </p>
                      </div>

                      <div className="grid min-w-full gap-2 sm:grid-cols-2 xl:min-w-[220px] xl:grid-cols-1">
                        <button
                          type="button"
                          disabled={actualizandoId === item.id}
                          onClick={() =>
                            cambiarEstadoInscripcion(item.id, "Aprobada")
                          }
                          className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          Aprobar
                        </button>

                        <button
                          type="button"
                          disabled={actualizandoId === item.id}
                          onClick={() =>
                            cambiarEstadoInscripcion(item.id, "En revisión")
                          }
                          className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                        >
                          En revisión
                        </button>

                        <button
                          type="button"
                          disabled={actualizandoId === item.id}
                          onClick={() =>
                            cambiarEstadoInscripcion(item.id, "Rechazada")
                          }
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                        >
                          Rechazar
                        </button>

                        {item.qr_url && (
                          <Link
                            href={item.qr_url}
                            target="_blank"
                            className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700 shadow-sm hover:bg-blue-100"
                          >
                            Ver QR
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}