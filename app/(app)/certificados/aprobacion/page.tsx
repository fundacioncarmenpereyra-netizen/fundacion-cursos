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

type Documento = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  estado: string | null;
};

type Pago = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  monto: number | null;
  estado: string | null;
};

type Asistencia = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  fecha_clase: string | null;
  estado: string | null;
};

type Remitido = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  estado: string | null;
};

type Aprobacion = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  estado: string | null;
  observacion: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
};

type Certificado = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  codigo_certificado: string | null;
  estado: string | null;
};

type EstadoAprobacion = "Pendiente" | "Aprobado" | "Observado" | "Rechazado";

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function AprobacionCertificadosPage() {
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [programacionId, setProgramacionId] = useState("");
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [remitidos, setRemitidos] = useState<Remitido[]>([]);
  const [aprobaciones, setAprobaciones] = useState<Aprobacion[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);

  const [aprobadoPor, setAprobadoPor] = useState("");
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
      limpiarDetalle();
    }
  }, [programacionId]);

  function limpiarDetalle() {
    setInscripciones([]);
    setDocumentos([]);
    setPagos([]);
    setAsistencias([]);
    setRemitidos([]);
    setAprobaciones([]);
    setCertificados([]);
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

    const idsInscripciones = listaInscripciones.map((item) => item.id);

    if (idsInscripciones.length === 0) {
      setLoadingDetalle(false);
      return;
    }

    const [
      documentosResponse,
      pagosResponse,
      asistenciasResponse,
      remitidosResponse,
      aprobacionesResponse,
      certificadosResponse,
    ] = await Promise.all([
      supabase
        .from("participantes_documentos")
        .select("id, inscripcion_id, participante_id, estado")
        .in("inscripcion_id", idsInscripciones),

      supabase
        .from("pagos_inscripciones")
        .select("id, inscripcion_id, participante_id, monto, estado")
        .in("inscripcion_id", idsInscripciones),

      supabase
        .from("asistencias_cursos")
        .select(
          "id, inscripcion_id, participante_id, programacion_id, fecha_clase, estado"
        )
        .eq("programacion_id", idProgramacion),

      supabase
        .from("remitidos_infotep")
        .select("id, inscripcion_id, participante_id, programacion_id, estado")
        .eq("programacion_id", idProgramacion),

      supabase
        .from("aprobaciones_certificados")
        .select(
          "id, inscripcion_id, participante_id, programacion_id, estado, observacion, aprobado_por, fecha_aprobacion"
        )
        .eq("programacion_id", idProgramacion),

      supabase
        .from("certificados")
        .select(
          "id, inscripcion_id, participante_id, programacion_id, codigo_certificado, estado"
        )
        .eq("programacion_id", idProgramacion),
    ]);

    if (documentosResponse.error) {
      console.error("Error documentos:", documentosResponse.error);
      setError(`Error cargando documentos: ${documentosResponse.error.message}`);
    } else {
      setDocumentos((documentosResponse.data || []) as Documento[]);
    }

    if (pagosResponse.error) {
      console.error("Error pagos:", pagosResponse.error);
      setError(`Error cargando pagos: ${pagosResponse.error.message}`);
    } else {
      setPagos((pagosResponse.data || []) as Pago[]);
    }

    if (asistenciasResponse.error) {
      console.error("Error asistencias:", asistenciasResponse.error);
      setError(
        `Error cargando asistencias: ${asistenciasResponse.error.message}`
      );
    } else {
      setAsistencias((asistenciasResponse.data || []) as Asistencia[]);
    }

    if (remitidosResponse.error) {
      console.error("Error remitidos:", remitidosResponse.error);
      setError(`Error cargando remitidos: ${remitidosResponse.error.message}`);
    } else {
      setRemitidos((remitidosResponse.data || []) as Remitido[]);
    }

    if (aprobacionesResponse.error) {
      console.error("Error aprobaciones:", aprobacionesResponse.error);
      setError(
        `Error cargando aprobaciones: ${aprobacionesResponse.error.message}`
      );
    } else {
      setAprobaciones((aprobacionesResponse.data || []) as Aprobacion[]);
    }

    if (certificadosResponse.error) {
      console.error("Error certificados:", certificadosResponse.error);
      setError(
        `Error cargando certificados: ${certificadosResponse.error.message}`
      );
    } else {
      setCertificados((certificadosResponse.data || []) as Certificado[]);
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

  function documentosDe(inscripcionId: string) {
    return documentos.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function pagosDe(inscripcionId: string) {
    return pagos.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function asistenciasDe(inscripcionId: string) {
    return asistencias.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function remitidoDe(inscripcionId: string) {
    return remitidos.find((item) => item.inscripcion_id === inscripcionId);
  }

  function aprobacionDe(inscripcionId: string) {
    return aprobaciones.find((item) => item.inscripcion_id === inscripcionId);
  }

  function certificadoDe(inscripcionId: string) {
    return certificados.find((item) => item.inscripcion_id === inscripcionId);
  }

  function estadoInscripcionAprobada(inscripcion: Inscripcion) {
    const estado = obtenerPrimero(inscripcion.estados_inscripcion);
    const nombre = (estado?.nombre || "").toLowerCase();

    return nombre.includes("aprobada") || nombre.includes("aprobado");
  }

  function documentosOk(inscripcionId: string) {
    const docs = documentosDe(inscripcionId);

    if (docs.length === 0) {
      return {
        ok: false,
        texto: "Sin documentos",
        detalle: "0 documentos",
      };
    }

    const aprobados = docs.filter(
      (item) => (item.estado || "").toLowerCase() === "aprobado"
    ).length;

    return {
      ok: aprobados === docs.length,
      texto: `${aprobados}/${docs.length}`,
      detalle:
        aprobados === docs.length
          ? "Documentos aprobados"
          : "Documentos pendientes",
    };
  }

  function pagoOk(inscripcionId: string) {
    const pagosInscripcion = pagosDe(inscripcionId);

    const pagados = pagosInscripcion.filter(
      (item) => (item.estado || "").toLowerCase() === "pagado"
    );

    const totalPagado = pagados.reduce(
      (total, item) => total + Number(item.monto || 0),
      0
    );

    return {
      ok: pagados.length > 0,
      texto: pagados.length > 0 ? "Pagado" : "Pendiente",
      detalle: `RD$${totalPagado.toLocaleString("es-DO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
    };
  }

  function asistenciaOk(inscripcionId: string) {
    const lista = asistenciasDe(inscripcionId);

    if (lista.length === 0) {
      return {
        ok: false,
        texto: "Sin asistencia",
        detalle: "0 clases",
      };
    }

    const presentes = lista.filter((item) => {
      const estado = (item.estado || "").toLowerCase();
      return estado === "presente" || estado === "tardanza";
    }).length;

    const porcentaje = Math.round((presentes / lista.length) * 100);

    return {
      ok: porcentaje >= 70,
      texto: `${porcentaje}%`,
      detalle: `${presentes}/${lista.length} clases`,
    };
  }

  function remitidoOk(inscripcionId: string) {
    const remitido = remitidoDe(inscripcionId);
    const estado = remitido?.estado || "Pendiente";

    return {
      ok:
        estado === "Remitido" ||
        estado === "Aceptado" ||
        estado === "Corregido",
      texto: estado,
      detalle: remitido ? "Registrado" : "Sin remisión",
    };
  }

  function puedeAprobar(inscripcion: Inscripcion) {
    return (
      estadoInscripcionAprobada(inscripcion) &&
      documentosOk(inscripcion.id).ok &&
      pagoOk(inscripcion.id).ok &&
      asistenciaOk(inscripcion.id).ok &&
      remitidoOk(inscripcion.id).ok
    );
  }

  function colorEstado(valor: string | null | undefined) {
    const estado = (valor || "").toLowerCase();

    if (estado.includes("aprobado")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (estado.includes("rechazado")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    if (estado.includes("observado")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  async function cambiarAprobacion(
    inscripcion: Inscripcion,
    estado: EstadoAprobacion
  ) {
    if (!programacionId) return;

    if (!inscripcion.participante_id) {
      setError("La inscripción no tiene participante vinculado.");
      return;
    }

    let observacion: string | null = null;

    if (estado === "Observado" || estado === "Rechazado") {
      const motivo = window.prompt(`Indique la observación para ${estado}:`);
      observacion = motivo?.trim() || `${estado} sin detalle.`;
    }

    if (estado === "Aprobado" && !puedeAprobar(inscripcion)) {
      const confirmar = window.confirm(
        "Este participante todavía tiene requisitos pendientes. ¿Desea aprobarlo de todos modos?"
      );

      if (!confirmar) return;
    }

    const existente = aprobacionDe(inscripcion.id);

    const payload = {
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      programacion_id: programacionId,
      estado,
      observacion,
      aprobado_por: aprobadoPor.trim() || null,
      fecha_aprobacion: estado === "Aprobado" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    setGuardandoId(inscripcion.id);
    setError("");
    setMensaje("");

    if (existente) {
      const { error } = await supabase
        .from("aprobaciones_certificados")
        .update(payload)
        .eq("id", existente.id);

      if (error) {
        console.error("Error actualizando aprobación:", error);
        setError(`Error actualizando aprobación: ${error.message}`);
        setGuardandoId("");
        return;
      }
    } else {
      const { error } = await supabase
        .from("aprobaciones_certificados")
        .insert(payload);

      if (error) {
        console.error("Error creando aprobación:", error);
        setError(`Error creando aprobación: ${error.message}`);
        setGuardandoId("");
        return;
      }
    }

    const participante = obtenerPrimero(inscripcion.participantes);
    setMensaje(
      `${participante?.nombre_completo || "Participante"} marcado como ${estado}.`
    );

    await cargarDetalle(programacionId);
    setGuardandoId("");
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
      const aprobacion = aprobacionDe(item.id);
      const estadoAprobacion = aprobacion?.estado || "Pendiente";

      const cumpleEstado =
        filtroEstado === "Todos" || estadoAprobacion === filtroEstado;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.correo || "",
        estadoAprobacion,
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [inscripciones, aprobaciones, busqueda, filtroEstado]);

  const resumen = useMemo(() => {
    return {
      inscritos: inscripciones.length,
      listos: inscripciones.filter((item) => puedeAprobar(item)).length,
      aprobados: aprobaciones.filter((item) => item.estado === "Aprobado")
        .length,
      observados: aprobaciones.filter((item) => item.estado === "Observado")
        .length,
      rechazados: aprobaciones.filter((item) => item.estado === "Rechazado")
        .length,
      certificados: certificados.filter((item) => item.estado !== "Anulado")
        .length,
    };
  }, [inscripciones, documentos, pagos, asistencias, remitidos, aprobaciones, certificados]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Aprobación para certificados
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Valide documentos, pagos, asistencia y remitidos antes de emitir
              certificados.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/certificados"
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Ir a certificados
            </Link>

            <Link
              href="/remitidos"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Remitidos
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
          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
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
                Aprobado por
              </label>

              <input
                type="text"
                value={aprobadoPor}
                onChange={(e) => setAprobadoPor(e.target.value)}
                placeholder="Nombre del responsable"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {programacionSeleccionada && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

        <div className="grid gap-4 md:grid-cols-6">
          <ResumenCard titulo="Inscritos" valor={resumen.inscritos} />
          <ResumenCard titulo="Listos" valor={resumen.listos} variante="green" />
          <ResumenCard
            titulo="Aprobados"
            valor={resumen.aprobados}
            variante="green"
          />
          <ResumenCard
            titulo="Observados"
            valor={resumen.observados}
            variante="amber"
          />
          <ResumenCard
            titulo="Rechazados"
            valor={resumen.rechazados}
            variante="red"
          />
          <ResumenCard
            titulo="Certificados"
            valor={resumen.certificados}
            variante="blue"
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar estudiante
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
                Estado aprobación
              </label>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Observado">Observado</option>
                <option value="Rechazado">Rechazado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Validación de estudiantes
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
            <div className="divide-y divide-slate-100">
              {inscripcionesFiltradas.map((item) => {
                const participante = obtenerPrimero(item.participantes);
                const estadoInscripcion = obtenerPrimero(
                  item.estados_inscripcion
                );
                const aprobacion = aprobacionDe(item.id);
                const certificado = certificadoDe(item.id);

                const docs = documentosOk(item.id);
                const pago = pagoOk(item.id);
                const asistencia = asistenciaOk(item.id);
                const remitido = remitidoOk(item.id);
                const inscripcionOk = estadoInscripcionAprobada(item);
                const listo = puedeAprobar(item);

                return (
                  <article key={item.id} className="p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstado(
                              aprobacion?.estado || "Pendiente"
                            )}`}
                          >
                            {aprobacion?.estado || "Pendiente"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              listo
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {listo ? "Listo para certificado" : "Con pendientes"}
                          </span>

                          {certificado && (
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                              Certificado emitido
                            </span>
                          )}
                        </div>

                        <h3 className="mt-3 text-xl font-black text-slate-900">
                          {participante?.nombre_completo || "Sin participante"}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Código: {item.codigo_inscripcion || "-"} · Cédula:{" "}
                          {participante?.cedula || "-"} · Estado inscripción:{" "}
                          {estadoInscripcion?.nombre || "-"}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-5">
                          <ValidacionBox
                            titulo="Inscripción"
                            ok={inscripcionOk}
                            valor={estadoInscripcion?.nombre || "-"}
                          />

                          <ValidacionBox
                            titulo="Documentos"
                            ok={docs.ok}
                            valor={docs.texto}
                            detalle={docs.detalle}
                          />

                          <ValidacionBox
                            titulo="Pago"
                            ok={pago.ok}
                            valor={pago.texto}
                            detalle={pago.detalle}
                          />

                          <ValidacionBox
                            titulo="Asistencia"
                            ok={asistencia.ok}
                            valor={asistencia.texto}
                            detalle={asistencia.detalle}
                          />

                          <ValidacionBox
                            titulo="INFOTEP"
                            ok={remitido.ok}
                            valor={remitido.texto}
                            detalle={remitido.detalle}
                          />
                        </div>

                        {aprobacion?.observacion && (
                          <div className="mt-3 rounded-2xl bg-amber-50 p-3">
                            <p className="text-[11px] font-bold uppercase text-amber-500">
                              Observación
                            </p>
                            <p className="mt-1 text-sm font-black text-amber-950">
                              {aprobacion.observacion}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="grid h-fit gap-2">
                        <button
                          type="button"
                          disabled={guardandoId === item.id}
                          onClick={() => cambiarAprobacion(item, "Aprobado")}
                          className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
                        >
                          {guardandoId === item.id
                            ? "Guardando..."
                            : "Aprobar certificado"}
                        </button>

                        <button
                          type="button"
                          disabled={guardandoId === item.id}
                          onClick={() => cambiarAprobacion(item, "Observado")}
                          className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                        >
                          Observar
                        </button>

                        <button
                          type="button"
                          disabled={guardandoId === item.id}
                          onClick={() => cambiarAprobacion(item, "Rechazado")}
                          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                        >
                          Rechazar
                        </button>

                        {certificado ? (
                          <Link
                            href={`/certificados/imprimir/${certificado.id}`}
                            target="_blank"
                            className="rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700 shadow-sm hover:bg-blue-100"
                          >
                            Imprimir certificado
                          </Link>
                        ) : (
                          <Link
                            href="/certificados"
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Emitir en certificados
                          </Link>
                        )}

                        <Link
                          href={`/inscripciones/${item.id}`}
                          target="_blank"
                          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                          Ver inscripción
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

function ValidacionBox({
  titulo,
  valor,
  detalle,
  ok,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  ok: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        ok
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}
    >
      <p className="text-[10px] font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-black">{valor}</p>

      {detalle && <p className="mt-1 text-xs font-semibold">{detalle}</p>}
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