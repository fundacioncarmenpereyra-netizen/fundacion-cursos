"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type RelacionParticipante =
  | {
      nombre_completo: string;
      cedula: string | null;
      fecha_nacimiento: string | null;
      sexo: string | null;
      telefono: string | null;
      whatsapp: string | null;
      correo: string | null;
      direccion: string | null;
      tshirt_talla: string | null;
      es_menor_edad: boolean | null;
      nombre_tutor: string | null;
      telefono_tutor: string | null;
      cedula_tutor: string | null;
      estado: string | null;
    }
  | {
      nombre_completo: string;
      cedula: string | null;
      fecha_nacimiento: string | null;
      sexo: string | null;
      telefono: string | null;
      whatsapp: string | null;
      correo: string | null;
      direccion: string | null;
      tshirt_talla: string | null;
      es_menor_edad: boolean | null;
      nombre_tutor: string | null;
      telefono_tutor: string | null;
      cedula_tutor: string | null;
      estado: string | null;
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
      cupo_maximo: number | null;
      cupo_disponible: number | null;
      precio_especial: number | null;
      cursos:
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
      cupo_maximo: number | null;
      cupo_disponible: number | null;
      precio_especial: number | null;
      cursos:
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

type InscripcionDetalle = {
  id: string;
  codigo_inscripcion: string | null;
  qr_token: string | null;
  qr_url: string | null;
  qr_generado: boolean | null;
  fecha_qr_generado: string | null;
  fecha_ultimo_escaneo: string | null;
  cantidad_escaneos: number | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  observacion: string | null;
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

type EscaneoQr = {
  id: string;
  fecha_escaneo: string | null;
  dispositivo: string | null;
  observacion: string | null;
};

type DocumentoParticipante = {
  id: string;
  nombre_documento: string | null;
  archivo_url: string | null;
  archivo_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  estado: string | null;
  observacion: string | null;
  fecha_subida: string | null;
  tipos_documentos:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

function esUuidValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    valor
  );
}

export default function DetalleInscripcionPage() {
  const params = useParams<{ id: string }>();

  const [id, setId] = useState("");
  const [inscripcion, setInscripcion] = useState<InscripcionDetalle | null>(
    null
  );
  const [estados, setEstados] = useState<EstadoInscripcion[]>([]);
  const [escaneos, setEscaneos] = useState<EscaneoQr[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoParticipante[]>([]);
  const [loading, setLoading] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [actualizandoDocumentoId, setActualizandoDocumentoId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const idParam = params?.id;
    const idUrl = Array.isArray(idParam) ? idParam[0] || "" : idParam || "";

    setId(idUrl);

    if (idUrl) {
      cargarDatos(idUrl);
    } else {
      setError("No se recibió el ID, código o QR de la inscripción.");
    }
  }, [params]);

  async function cargarDatos(inscripcionId: string) {
    setLoading(true);
    setError("");
    setMensaje("");
    setInscripcion(null);
    setEscaneos([]);
    setDocumentos([]);

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

    let query = supabase.from("inscripciones").select(
      `
        id,
        codigo_inscripcion,
        qr_token,
        qr_url,
        qr_generado,
        fecha_qr_generado,
        fecha_ultimo_escaneo,
        cantidad_escaneos,
        fecha_inscripcion,
        estado,
        observacion,
        estado_inscripcion_id,
        participante_id,
        programacion_id,
        participantes (
          nombre_completo,
          cedula,
          fecha_nacimiento,
          sexo,
          telefono,
          whatsapp,
          correo,
          direccion,
          tshirt_talla,
          es_menor_edad,
          nombre_tutor,
          telefono_tutor,
          cedula_tutor,
          estado
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          estado,
          cupo_maximo,
          cupo_disponible,
          precio_especial,
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
    );

    if (esUuidValido(inscripcionId)) {
      query = query.eq("id", inscripcionId);
    } else if (inscripcionId.startsWith("QR-")) {
      query = query.eq("qr_token", inscripcionId);
    } else {
      query = query.eq("codigo_inscripcion", inscripcionId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("Error inscripción:", error);
      setError(`Error cargando inscripción: ${error.message}`);
      setInscripcion(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("No se encontró esta inscripción.");
      setInscripcion(null);
      setLoading(false);
      return;
    }

    const detalle = data as InscripcionDetalle;
    setInscripcion(detalle);

    const inscripcionRealId = detalle.id;

    const { data: escaneosData, error: escaneosError } = await supabase
      .from("inscripciones_qr_escaneos")
      .select("id, fecha_escaneo, dispositivo, observacion")
      .eq("inscripcion_id", inscripcionRealId)
      .order("fecha_escaneo", { ascending: false });

    if (escaneosError) {
      console.error("Error escaneos:", escaneosError);
    } else {
      setEscaneos((escaneosData || []) as EscaneoQr[]);
    }

    const { data: documentosData, error: documentosError } = await supabase
      .from("participantes_documentos")
      .select(
        `
        id,
        nombre_documento,
        archivo_url,
        archivo_path,
        mime_type,
        size_bytes,
        estado,
        observacion,
        fecha_subida,
        tipos_documentos (
          nombre
        )
      `
      )
      .eq("inscripcion_id", inscripcionRealId)
      .order("fecha_subida", { ascending: false });

    if (documentosError) {
      console.error("Error documentos:", documentosError);
    } else {
      setDocumentos((documentosData || []) as DocumentoParticipante[]);
    }

    setLoading(false);
  }

  async function cambiarEstado(nombreEstado: string) {
    if (!inscripcion?.id) return;

    const estado = estados.find(
      (item) => item.nombre.toLowerCase() === nombreEstado.toLowerCase()
    );

    if (!estado) {
      setError(`No se encontró el estado "${nombreEstado}".`);
      return;
    }

    setActualizando(true);
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("inscripciones")
      .update({
        estado_inscripcion_id: estado.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inscripcion.id);

    if (error) {
      console.error("Error actualizando:", error);
      setError(`Error actualizando inscripción: ${error.message}`);
    } else {
      setMensaje(`Inscripción marcada como ${estado.nombre}.`);
      await cargarDatos(inscripcion.id);
    }

    setActualizando(false);
  }

  async function cambiarEstadoDocumento(
    documentoId: string,
    nuevoEstado: "Pendiente" | "Aprobado" | "Rechazado"
  ) {
    if (!inscripcion?.id) return;

    let observacionDocumento: string | null = null;

    if (nuevoEstado === "Rechazado") {
      const motivo = window.prompt(
        "Indique el motivo del rechazo del documento:"
      );

      observacionDocumento = motivo?.trim() || "Documento rechazado.";
    }

    setActualizandoDocumentoId(documentoId);
    setError("");
    setMensaje("");

    const payload: {
      estado: string;
      updated_at: string;
      observacion?: string | null;
    } = {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    };

    if (nuevoEstado === "Rechazado") {
      payload.observacion = observacionDocumento;
    }

    if (nuevoEstado === "Aprobado") {
      payload.observacion = null;
    }

    const { error } = await supabase
      .from("participantes_documentos")
      .update(payload)
      .eq("id", documentoId);

    if (error) {
      console.error("Error actualizando documento:", error);
      setError(`Error actualizando documento: ${error.message}`);
    } else {
      setMensaje(`Documento marcado como ${nuevoEstado}.`);
      await cargarDatos(inscripcion.id);
    }

    setActualizandoDocumentoId("");
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

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  function formatearTamano(bytes: number | null | undefined) {
    if (!bytes) return "-";

    const mb = bytes / 1024 / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
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

  function colorEstadoDocumento(nombre: string | null | undefined) {
    const estado = (nombre || "").toLowerCase();

    if (estado.includes("aprobado")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (estado.includes("rechazado")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  const participante = obtenerPrimero(inscripcion?.participantes);
  const programacion = obtenerPrimero(inscripcion?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);
  const profesor = obtenerPrimero(programacion?.profesores);
  const estadoInscripcion = obtenerPrimero(inscripcion?.estados_inscripcion);
  const condicion = obtenerPrimero(inscripcion?.condiciones_participante);
  const metodoPago = obtenerPrimero(inscripcion?.metodos_pago);
  const tipoBeca = obtenerPrimero(inscripcion?.tipos_beca);

  const precioCurso =
    programacion?.precio_especial && programacion.precio_especial > 0
      ? programacion.precio_especial
      : curso?.precio || 0;

  const nombreEstado = estadoInscripcion?.nombre || "Sin estado";

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Detalle de inscripción
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Consulta completa de la solicitud, datos del participante,
              documentos y validación QR.
            </p>
          </div>

          <Link
            href="/inscripciones"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Volver al listado
          </Link>
        </div>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando inscripción...
          </div>
        )}

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

        {inscripcion && (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                        nombreEstado
                      )}`}
                    >
                      {nombreEstado}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                      {inscripcion.codigo_inscripcion || "Sin código"}
                    </span>

                    {inscripcion.qr_token && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                        QR activo
                      </span>
                    )}

                    {participante?.es_menor_edad && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                        Menor de edad
                      </span>
                    )}
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-slate-900">
                    {participante?.nombre_completo || "Sin participante"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {curso?.nombre || "Curso no definido"} ·{" "}
                    {modalidad?.nombre || "Modalidad no definida"}
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Solicitud registrada:{" "}
                    {formatearFechaHora(inscripcion.fecha_inscripcion)}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-1">
                  <button
                    type="button"
                    disabled={actualizando}
                    onClick={() => cambiarEstado("Aprobada")}
                    className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                  >
                    Aprobar
                  </button>

                  <button
                    type="button"
                    disabled={actualizando}
                    onClick={() => cambiarEstado("En revisión")}
                    className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                  >
                    En revisión
                  </button>

                  <button
                    type="button"
                    disabled={actualizando}
                    onClick={() => cambiarEstado("Rechazada")}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    Rechazar
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {inscripcion.codigo_inscripcion && (
                  <>
                    <Link
                      href={`/movil/inscripcion/formulario?codigo=${inscripcion.codigo_inscripcion}`}
                      target="_blank"
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-slate-800"
                    >
                      Formulario
                    </Link>

                    <Link
                      href={`/movil/inscripcion/documentos?codigo=${inscripcion.codigo_inscripcion}`}
                      target="_blank"
                      className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
                    >
                      Subir documentos
                    </Link>
                  </>
                )}

                <Link
                  href="/pagos"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Pagos
                </Link>

                <Link
                  href="/remitidos"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Remitidos INFOTEP
                </Link>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">
                  Datos del participante
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Campo label="Nombre" valor={participante?.nombre_completo} />
                  <Campo label="Cédula" valor={participante?.cedula} />
                  <Campo
                    label="Fecha nacimiento"
                    valor={formatearFecha(participante?.fecha_nacimiento)}
                  />
                  <Campo label="Sexo" valor={participante?.sexo} />
                  <Campo label="Teléfono" valor={participante?.telefono} />
                  <Campo label="WhatsApp" valor={participante?.whatsapp} />
                  <Campo label="Correo" valor={participante?.correo} />
                  <Campo
                    label="Tamaño T-shirt"
                    valor={participante?.tshirt_talla}
                  />
                  <Campo label="Estado" valor={participante?.estado} />
                </div>

                <div className="mt-3">
                  <Campo label="Dirección" valor={participante?.direccion} />
                </div>

                {participante?.es_menor_edad && (
                  <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="text-base font-black text-amber-900">
                      Datos del padre, madre o tutor
                    </h4>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Campo
                        label="Nombre tutor"
                        valor={participante.nombre_tutor}
                        variante="amber"
                      />
                      <Campo
                        label="Teléfono tutor"
                        valor={participante.telefono_tutor}
                        variante="amber"
                      />
                      <Campo
                        label="Cédula tutor"
                        valor={participante.cedula_tutor}
                        variante="amber"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">
                  Curso solicitado
                </h3>

                <div className="mt-4 space-y-3">
                  <Campo label="Curso" valor={curso?.nombre} variante="blue" />
                  <Campo label="Descripción" valor={curso?.descripcion} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Campo label="Modalidad" valor={modalidad?.nombre} />
                    <Campo label="Horario" valor={horario?.nombre} />
                    <Campo label="Días" valor={horario?.dias} />
                    <Campo label="Aula/Lugar" valor={aula?.nombre} />
                    <Campo
                      label="Profesor"
                      valor={profesor?.nombre_completo}
                    />
                    <Campo
                      label="Estado programación"
                      valor={programacion?.estado}
                    />
                    <Campo
                      label="Fecha inicio"
                      valor={formatearFecha(programacion?.fecha_inicio)}
                    />
                    <Campo
                      label="Fecha fin"
                      valor={formatearFecha(programacion?.fecha_fin)}
                    />
                    <Campo
                      label="Cupo máximo"
                      valor={String(programacion?.cupo_maximo ?? "-")}
                    />
                    <Campo
                      label="Cupo disponible"
                      valor={String(programacion?.cupo_disponible ?? "-")}
                    />
                    <Campo label="Costo" valor={formatearMonto(precioCurso)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">
                  Condición, pago y beca
                </h3>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Campo label="Estado inscripción" valor={nombreEstado} />
                  <Campo label="Estado registro" valor={inscripcion.estado} />
                  <Campo label="Condición" valor={condicion?.nombre} />
                  <Campo
                    label="Método de pago"
                    valor={metodoPago?.nombre || "Pendiente"}
                  />
                  <Campo
                    label="Tipo de beca"
                    valor={tipoBeca?.nombre || "No aplica"}
                  />
                </div>

                <div className="mt-3">
                  <Campo label="Observación" valor={inscripcion.observacion} />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-900">
                  Código QR
                </h3>

                <div className="mt-4 grid gap-3">
                  <Campo
                    label="Código inscripción"
                    valor={inscripcion.codigo_inscripcion}
                    variante="blue"
                  />

                  <Campo label="QR Token" valor={inscripcion.qr_token} />

                  <Campo
                    label="QR generado"
                    valor={inscripcion.qr_generado ? "Sí" : "No"}
                  />

                  <Campo
                    label="Fecha generación QR"
                    valor={formatearFechaHora(inscripcion.fecha_qr_generado)}
                  />

                  <Campo
                    label="Cantidad de escaneos"
                    valor={String(inscripcion.cantidad_escaneos || 0)}
                  />

                  <Campo
                    label="Último escaneo"
                    valor={formatearFechaHora(
                      inscripcion.fecha_ultimo_escaneo
                    )}
                  />

                  {inscripcion.qr_url && (
                    <Link
                      href={inscripcion.qr_url}
                      target="_blank"
                      className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
                    >
                      Abrir QR
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Documentos del participante
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Archivos subidos por el estudiante durante el proceso de
                    inscripción.
                  </p>
                </div>

                {inscripcion.codigo_inscripcion && (
                  <Link
                    href={`/movil/inscripcion/documentos?codigo=${inscripcion.codigo_inscripcion}`}
                    target="_blank"
                    className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
                  >
                    Subir / agregar documentos
                  </Link>
                )}
              </div>

              {documentos.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No hay documentos subidos para esta inscripción.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {documentos.map((doc) => {
                    const tipoDocumento = obtenerPrimero(doc.tipos_documentos);
                    const estadoDocumento = doc.estado || "Pendiente";

                    return (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {tipoDocumento?.nombre ||
                                doc.nombre_documento ||
                                "Documento"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Subido: {formatearFechaHora(doc.fecha_subida)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Tamaño: {formatearTamano(doc.size_bytes)}
                            </p>

                            <span
                              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-black ${colorEstadoDocumento(
                                estadoDocumento
                              )}`}
                            >
                              {estadoDocumento}
                            </span>
                          </div>

                          {doc.archivo_url && (
                            <Link
                              href={doc.archivo_url}
                              target="_blank"
                              className="shrink-0 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                            >
                              Ver
                            </Link>
                          )}
                        </div>

                        {doc.observacion && (
                          <div className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold text-slate-600">
                            {doc.observacion}
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            disabled={actualizandoDocumentoId === doc.id}
                            onClick={() =>
                              cambiarEstadoDocumento(doc.id, "Aprobado")
                            }
                            className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            Aprobar
                          </button>

                          <button
                            type="button"
                            disabled={actualizandoDocumentoId === doc.id}
                            onClick={() =>
                              cambiarEstadoDocumento(doc.id, "Rechazado")
                            }
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Rechazar
                          </button>

                          <button
                            type="button"
                            disabled={actualizandoDocumentoId === doc.id}
                            onClick={() =>
                              cambiarEstadoDocumento(doc.id, "Pendiente")
                            }
                            className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-60"
                          >
                            Pendiente
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">
                Historial de escaneos QR
              </h3>

              {escaneos.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  No hay escaneos registrados.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {escaneos.map((escaneo) => (
                    <div
                      key={escaneo.id}
                      className="grid gap-2 p-4 md:grid-cols-3"
                    >
                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {formatearFechaHora(escaneo.fecha_escaneo)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          Dispositivo
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {escaneo.dispositivo || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase text-slate-400">
                          Observación
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {escaneo.observacion || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Campo({
  label,
  valor,
  variante = "slate",
}: {
  label: string;
  valor: string | number | null | undefined;
  variante?: "slate" | "blue" | "amber";
}) {
  const estilos =
    variante === "blue"
      ? "bg-blue-50 text-blue-950"
      : variante === "amber"
      ? "bg-amber-100 text-amber-950"
      : "bg-slate-50 text-slate-900";

  const labelEstilos =
    variante === "blue"
      ? "text-blue-500"
      : variante === "amber"
      ? "text-amber-500"
      : "text-slate-400";

  return (
    <div className={`rounded-2xl p-3 ${estilos}`}>
      <p className={`text-[11px] font-bold uppercase ${labelEstilos}`}>
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{valor || "-"}</p>
    </div>
  );
}