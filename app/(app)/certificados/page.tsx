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
  horarios: RelacionNombre;
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

type Certificado = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  codigo_certificado: string | null;
  fecha_emision: string | null;
  estado: string | null;
  observacion: string | null;
};

type Pago = {
  id: string;
  inscripcion_id: string | null;
  monto: number | null;
  estado: string | null;
};

type Documento = {
  id: string;
  inscripcion_id: string | null;
  estado: string | null;
};

type Asistencia = {
  id: string;
  inscripcion_id: string | null;
  estado: string | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function CertificadosPage() {
  const [programaciones, setProgramaciones] = useState<ProgramacionCurso[]>([]);
  const [programacionId, setProgramacionId] = useState("");
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [emitiendoId, setEmitiendoId] = useState("");
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
      setCertificados([]);
      setPagos([]);
      setDocumentos([]);
      setAsistencias([]);
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
        estado,
        cursos (
          nombre,
          descripcion
        ),
        modalidades (
          nombre
        ),
        horarios (
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

    const { data: certificadosData, error: certificadosError } = await supabase
      .from("certificados")
      .select(
        `
        id,
        inscripcion_id,
        participante_id,
        programacion_id,
        codigo_certificado,
        fecha_emision,
        estado,
        observacion
      `
      )
      .eq("programacion_id", idProgramacion);

    if (certificadosError) {
      console.error("Error certificados:", certificadosError);
      setError(`Error cargando certificados: ${certificadosError.message}`);
      setCertificados([]);
    } else {
      setCertificados((certificadosData || []) as Certificado[]);
    }

    const { data: pagosData } = await supabase
      .from("pagos_inscripciones")
      .select("id, inscripcion_id, monto, estado")
      .neq("estado", "Anulado");

    setPagos((pagosData || []) as Pago[]);

    const { data: documentosData } = await supabase
      .from("participantes_documentos")
      .select("id, inscripcion_id, estado");

    setDocumentos((documentosData || []) as Documento[]);

    const { data: asistenciasData } = await supabase
      .from("asistencias_cursos")
      .select("id, inscripcion_id, estado")
      .eq("programacion_id", idProgramacion);

    setAsistencias((asistenciasData || []) as Asistencia[]);

    setLoadingDetalle(false);
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function generarCodigoCertificado() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `CERT-${year}-${random}`;
  }

  function certificadoPorInscripcion(inscripcionId: string) {
    return certificados.find(
      (item) =>
        item.inscripcion_id === inscripcionId && item.estado !== "Anulado"
    );
  }

  function pagosPorInscripcion(inscripcionId: string) {
    return pagos.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function documentosPorInscripcion(inscripcionId: string) {
    return documentos.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function asistenciasPorInscripcion(inscripcionId: string) {
    return asistencias.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function resumenAsistencia(inscripcionId: string) {
    const lista = asistenciasPorInscripcion(inscripcionId);
    const total = lista.length;
    const presente = lista.filter((item) => item.estado === "Presente").length;
    const tardanza = lista.filter((item) => item.estado === "Tardanza").length;
    const excusa = lista.filter((item) => item.estado === "Excusa").length;
    const ausente = lista.filter((item) => item.estado === "Ausente").length;

    const asistenciasValidas = presente + tardanza + excusa;
    const porcentaje = total > 0 ? Math.round((asistenciasValidas / total) * 100) : 0;

    return {
      total,
      presente,
      tardanza,
      excusa,
      ausente,
      porcentaje,
    };
  }

  function estadoPago(inscripcionId: string) {
    const totalPagado = pagosPorInscripcion(inscripcionId).reduce(
      (total, pago) => total + Number(pago.monto || 0),
      0
    );

    return totalPagado > 0 ? "Con pago" : "Sin pago";
  }

  function estadoDocumentos(inscripcionId: string) {
    const lista = documentosPorInscripcion(inscripcionId);

    if (lista.length === 0) return "Sin documentos";

    const rechazados = lista.filter((item) => item.estado === "Rechazado").length;
    const pendientes = lista.filter((item) => item.estado !== "Aprobado").length;

    if (rechazados > 0) return "Con rechazados";
    if (pendientes > 0) return "Pendientes";
    return "Aprobados";
  }

  function colorBadge(valor: string) {
    const texto = valor.toLowerCase();

    if (
      texto.includes("aprobado") ||
      texto.includes("emitido") ||
      texto.includes("con pago") ||
      texto.includes("aprobada")
    ) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (
      texto.includes("rechazado") ||
      texto.includes("rechazada") ||
      texto.includes("sin pago") ||
      texto.includes("anulado")
    ) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (texto.includes("pendiente") || texto.includes("documentos")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  async function emitirCertificado(inscripcion: Inscripcion) {
    if (!programacionId) return;

    const existente = certificadoPorInscripcion(inscripcion.id);

    if (existente) {
      setError("Este estudiante ya tiene un certificado emitido.");
      return;
    }

    const participante = obtenerPrimero(inscripcion.participantes);

    const confirmar = window.confirm(
      `¿Desea emitir certificado para ${participante?.nombre_completo || "este estudiante"}?`
    );

    if (!confirmar) return;

    setEmitiendoId(inscripcion.id);
    setError("");
    setMensaje("");

    const { error } = await supabase.from("certificados").insert({
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      programacion_id: programacionId,
      codigo_certificado: generarCodigoCertificado(),
      fecha_emision: new Date().toISOString().split("T")[0],
      estado: "Emitido",
      observacion: null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error emitiendo certificado:", error);
      setError(`Error emitiendo certificado: ${error.message}`);
      setEmitiendoId("");
      return;
    }

    setMensaje("Certificado emitido correctamente.");
    await cargarDetalle(programacionId);

    setEmitiendoId("");
  }

  async function anularCertificado(certificadoId: string) {
    const motivo = window.prompt("Indique el motivo de anulación:");

    if (!motivo?.trim()) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("certificados")
      .update({
        estado: "Anulado",
        observacion: motivo.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", certificadoId);

    if (error) {
      console.error("Error anulando certificado:", error);
      setError(`Error anulando certificado: ${error.message}`);
      return;
    }

    setMensaje("Certificado anulado correctamente.");

    if (programacionId) {
      await cargarDetalle(programacionId);
    }
  }

  const programacionSeleccionada = programaciones.find(
    (item) => item.id === programacionId
  );

  const curso = obtenerPrimero(programacionSeleccionada?.cursos);
  const profesor = obtenerPrimero(programacionSeleccionada?.profesores);
  const modalidad = obtenerPrimero(programacionSeleccionada?.modalidades);
  const horario = obtenerPrimero(programacionSeleccionada?.horarios);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const certificado = certificadoPorInscripcion(item.id);

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        certificado?.codigo_certificado || "",
      ]
        .join(" ")
        .toLowerCase();

      return cadena.includes(texto);
    });
  }, [inscripciones, certificados, busqueda]);

  const resumen = useMemo(() => {
    const emitidos = certificados.filter((item) => item.estado === "Emitido").length;
    const anulados = certificados.filter((item) => item.estado === "Anulado").length;

    return {
      inscritos: inscripciones.length,
      emitidos,
      anulados,
      pendientes: Math.max(inscripciones.length - emitidos, 0),
    };
  }, [inscripciones, certificados]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Certificados
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Emisión y control de certificados por curso y participante.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/asistencias"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Asistencias
            </Link>

            <Link
              href="/inscripciones"
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Inscripciones
            </Link>
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
          <div className="grid gap-3 md:grid-cols-[1fr_260px]">
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
                Buscar
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula o código"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {programacionSeleccionada && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Profesor:{" "}
                  <span className="font-black">
                    {profesor?.nombre_completo || "-"}
                  </span>
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
                <InfoBox titulo="Modalidad" valor={modalidad?.nombre || "-"} />
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <ResumenCard titulo="Inscritos" valor={resumen.inscritos} />
          <ResumenCard titulo="Emitidos" valor={resumen.emitidos} variante="green" />
          <ResumenCard titulo="Pendientes" valor={resumen.pendientes} variante="amber" />
          <ResumenCard titulo="Anulados" valor={resumen.anulados} variante="red" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Participantes
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
                const certificado = certificadoPorInscripcion(item.id);
                const asistencia = resumenAsistencia(item.id);
                const pagoEstado = estadoPago(item.id);
                const documentosEstado = estadoDocumentos(item.id);

                return (
                  <article key={item.id} className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorBadge(
                              estadoInscripcion?.nombre || "Sin estado"
                            )}`}
                          >
                            {estadoInscripcion?.nombre || "Sin estado"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorBadge(
                              pagoEstado
                            )}`}
                          >
                            {pagoEstado}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorBadge(
                              documentosEstado
                            )}`}
                          >
                            Docs: {documentosEstado}
                          </span>

                          {certificado ? (
                            <span className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                              {certificado.codigo_certificado}
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                              Sin certificado
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {participante?.nombre_completo || "Sin participante"}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Código inscripción: {item.codigo_inscripcion || "-"}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <InfoBox
                            titulo="Cédula"
                            valor={participante?.cedula || "-"}
                          />
                          <InfoBox
                            titulo="Teléfono"
                            valor={participante?.telefono || "-"}
                          />
                          <InfoBox
                            titulo="Correo"
                            valor={participante?.correo || "-"}
                          />
                          <InfoBox
                            titulo="Asistencia"
                            valor={`${asistencia.porcentaje}% (${asistencia.presente}/${asistencia.total})`}
                          />
                        </div>
                      </div>

                      <div className="grid h-fit gap-2">
                        {certificado ? (
                          <>
                            <Link
                              href={`/certificados/imprimir/${certificado.id}`}
                              target="_blank"
                              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
                            >
                              Imprimir certificado
                            </Link>

                            {certificado.estado !== "Anulado" && (
                              <button
                                type="button"
                                onClick={() =>
                                  anularCertificado(certificado.id)
                                }
                                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700"
                              >
                                Anular certificado
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={emitiendoId === item.id}
                            onClick={() => emitirCertificado(item)}
                            className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                          >
                            {emitiendoId === item.id
                              ? "Emitiendo..."
                              : "Emitir certificado"}
                          </button>
                        )}

                        <Link
                          href={`/inscripciones/${item.id}`}
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Ver detalle
                        </Link>
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