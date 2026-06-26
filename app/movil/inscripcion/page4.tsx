"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EstudianteSesion = {
  auth_user_id: string;
  participante_id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
};

type ParticipanteDetalle = {
  id: string;
  fecha_nacimiento: string | null;
  sexo: string | null;
  telefono: string | null;
  whatsapp: string | null;
  direccion: string | null;
  es_menor_edad: boolean | null;
  nombre_tutor: string | null;
  telefono_tutor: string | null;
  cedula_tutor: string | null;
};

type RelacionCurso =
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

type RelacionNombre =
  | {
      nombre: string;
    }
  | {
      nombre: string;
    }[]
  | null;

type RelacionHorario =
  | {
      nombre: string;
      dias: string | null;
    }
  | {
      nombre: string;
      dias: string | null;
    }[]
  | null;

type ProgramacionCurso = {
  id: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_disponible: number | null;
  precio_especial: number | null;
  estado: string;
  cursos: RelacionCurso;
  modalidades: RelacionNombre;
  horarios: RelacionHorario;
};

type InscripcionExistente = {
  id: string;
  codigo_inscripcion: string | null;
  estado: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  programaciones_cursos:
    | {
        id: string;
        cursos: RelacionCurso;
        horarios: RelacionHorario;
      }
    | {
        id: string;
        cursos: RelacionCurso;
        horarios: RelacionHorario;
      }[]
    | null;
};

type DocumentoRequerido = {
  id: "cedula_frontal" | "cedula_trasera" | "foto_estudiante";
  nombre: string;
  descripcion: string;
};

const DOCUMENTOS_REQUERIDOS: DocumentoRequerido[] = [
  {
    id: "cedula_frontal",
    nombre: "Cédula frontal",
    descripcion: "Suba una imagen o PDF del lado frontal de la cédula.",
  },
  {
    id: "cedula_trasera",
    nombre: "Cédula trasera",
    descripcion: "Suba una imagen o PDF del lado trasero de la cédula.",
  },
  {
    id: "foto_estudiante",
    nombre: "Foto del estudiante",
    descripcion: "Suba una foto clara del estudiante.",
  },
];

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

function esUuidValido(valor: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    valor,
  );
}

export default function InscripcionMovilPage() {
  const [sesion, setSesion] = useState<EstudianteSesion | null>(null);
  const [programacionId, setProgramacionId] = useState("");
  const [programacion, setProgramacion] = useState<ProgramacionCurso | null>(
    null,
  );

  const [estadoRecibidaId, setEstadoRecibidaId] = useState("");

  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [direccion, setDireccion] = useState("");
  const [esMenorEdad, setEsMenorEdad] = useState(false);
  const [nombreTutor, setNombreTutor] = useState("");
  const [telefonoTutor, setTelefonoTutor] = useState("");
  const [cedulaTutor, setCedulaTutor] = useState("");

  const [tshirtTalla, setTshirtTalla] = useState("");
  const [observacion, setObservacion] = useState("");

  const [archivosDocumentos, setArchivosDocumentos] = useState<Record<string, File | null>>({});

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const sesionGuardada = localStorage.getItem("estudiante_sesion");

    if (!sesionGuardada) {
      setError(
        "Debe iniciar sesión como estudiante antes de realizar una inscripción.",
      );
      return;
    }

    try {
      const datos = JSON.parse(sesionGuardada) as EstudianteSesion;

      if (!datos.participante_id) {
        localStorage.removeItem("estudiante_sesion");
        setError(
          "La sesión del estudiante no es válida. Favor iniciar sesión nuevamente.",
        );
        return;
      }

      setSesion(datos);
      setTelefono(datos.telefono || "");
      setWhatsapp(datos.telefono || "");
      cargarParticipante(datos.participante_id);
    } catch (error) {
      console.error("Error leyendo sesión del estudiante:", error);
      localStorage.removeItem("estudiante_sesion");
      setError(
        "La sesión del estudiante no se pudo leer. Favor iniciar sesión nuevamente.",
      );
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get("programacion") || "";
    setProgramacionId(id);

    if (!id || !esUuidValido(id)) {
      setError(
        "El enlace de inscripción no es válido. Favor verificar el curso seleccionado.",
      );
      return;
    }

    cargarDatos(id);
  }, []);

  async function cargarParticipante(participanteId: string) {
    const { data, error } = await supabase
      .from("participantes")
      .select(
        `
        id,
        fecha_nacimiento,
        sexo,
        telefono,
        whatsapp,
        direccion,
        es_menor_edad,
        nombre_tutor,
        telefono_tutor,
        cedula_tutor
      `,
      )
      .eq("id", participanteId)
      .maybeSingle();

    if (error) {
      console.error("Error cargando datos del participante:", error);
      return;
    }

    const participante = data as ParticipanteDetalle | null;

    if (!participante) return;

    setFechaNacimiento(participante.fecha_nacimiento || "");
    setSexo(participante.sexo || "");
    setTelefono(participante.telefono || "");
    setWhatsapp(participante.whatsapp || participante.telefono || "");
    setDireccion(participante.direccion || "");
    setEsMenorEdad(Boolean(participante.es_menor_edad));
    setNombreTutor(participante.nombre_tutor || "");
    setTelefonoTutor(participante.telefono_tutor || "");
    setCedulaTutor(participante.cedula_tutor || "");
  }

  async function cargarDatos(id: string) {
    setLoading(true);
    setError("");

    const { data: programacionData, error: programacionError } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        fecha_inicio,
        fecha_fin,
        cupo_disponible,
        precio_especial,
        estado,
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
        )
      `,
      )
      .eq("id", id)
      .maybeSingle();

    if (programacionError) {
      console.error("Error cargando programación:", programacionError);
      setError(`Error cargando el curso: ${programacionError.message}`);
      setProgramacion(null);
      setLoading(false);
      return;
    }

    if (!programacionData) {
      setError("No se encontró la programación del curso seleccionada.");
      setProgramacion(null);
      setLoading(false);
      return;
    }

    setProgramacion(programacionData as ProgramacionCurso);

    const { data: estadoData } = await supabase
      .from("estados_inscripcion")
      .select("id, nombre")
      .eq("estado", "Activo")
      .ilike("nombre", "Recibida")
      .limit(1)
      .maybeSingle();

    if (estadoData?.id) {
      setEstadoRecibidaId(estadoData.id);
    }

    setLoading(false);
  }

  function generarCodigoInscripcion() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `INS-${year}-${random}`;
  }

  function generarQrToken() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    const time = fecha.getTime();

    return `QR-${year}-${random}-${time}`;
  }

  function formatearFecha(valor: string | null) {
    if (!valor) return "-";

    const [year, month, day] = valor.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  function normalizarTexto(valor: string | null | undefined) {
    return (valor || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function obtenerDiasComoLista(valor: string | null | undefined) {
    const texto = normalizarTexto(valor);

    if (!texto) return [];

    const dias: string[] = [];
    const textoConEspacios = ` ${texto.replace(/[,.]/g, " ")} `;

    const mapa = [
      { clave: "lunes", tokens: ["lunes", " lu ", "lu-", "l "] },
      { clave: "martes", tokens: ["martes", " ma ", "ma-", "m "] },
      {
        clave: "miercoles",
        tokens: ["miercoles", "miércoles", " mi ", "mi-", "x "],
      },
      { clave: "jueves", tokens: ["jueves", " ju ", "ju-", "j "] },
      { clave: "viernes", tokens: ["viernes", " vi ", "vi-", "v "] },
      { clave: "sabado", tokens: ["sabado", "sábado", " sa ", "sa-", "s "] },
      { clave: "domingo", tokens: ["domingo", " do ", "do-", "d "] },
    ];

    mapa.forEach((dia) => {
      if (dia.tokens.some((token) => textoConEspacios.includes(token))) {
        dias.push(dia.clave);
      }
    });

    return Array.from(new Set(dias));
  }

  function tienenDiasEnComun(
    diasNuevo: string | null | undefined,
    diasExistente: string | null | undefined,
  ) {
    const nuevos = obtenerDiasComoLista(diasNuevo);
    const existentes = obtenerDiasComoLista(diasExistente);

    if (nuevos.length === 0 || existentes.length === 0) {
      return true;
    }

    return nuevos.some((dia) => existentes.includes(dia));
  }

  async function validarInscripcionDuplicada() {
    if (!programacion || !sesion?.participante_id) return false;

    const { data: inscripcionesExistentes, error: inscripcionesError } =
      await supabase
        .from("inscripciones")
        .select(
          `
          id,
          codigo_inscripcion,
          estado,
          participante_id,
          programacion_id,
          programaciones_cursos (
            id,
            cursos (
              nombre,
              descripcion,
              precio
            ),
            horarios (
              nombre,
              dias
            )
          )
        `,
        )
        .eq("participante_id", sesion.participante_id);

    if (inscripcionesError) {
      console.warn("Error validando inscripciones:", inscripcionesError);
      setError(`Error validando duplicidad: ${inscripcionesError.message}`);
      return false;
    }

    const cursoNuevo = obtenerPrimero(programacion.cursos);
    const horarioNuevo = obtenerPrimero(programacion.horarios);
    const nombreCursoNuevo = normalizarTexto(cursoNuevo?.nombre);
    const nombreHorarioNuevo = normalizarTexto(horarioNuevo?.nombre);

    for (const inscripcion of (inscripcionesExistentes ||
      []) as InscripcionExistente[]) {
      const estadoInscripcion = normalizarTexto(inscripcion.estado);

      if (
        estadoInscripcion.includes("anulada") ||
        estadoInscripcion.includes("cancelada")
      ) {
        continue;
      }

      const programacionExistente = obtenerPrimero(
        inscripcion.programaciones_cursos,
      );

      if (!programacionExistente) continue;

      const cursoExistente = obtenerPrimero(programacionExistente.cursos);
      const horarioExistente = obtenerPrimero(programacionExistente.horarios);
      const nombreCursoExistente = normalizarTexto(cursoExistente?.nombre);
      const nombreHorarioExistente = normalizarTexto(horarioExistente?.nombre);

      if (
        nombreCursoNuevo &&
        nombreCursoExistente &&
        nombreCursoNuevo === nombreCursoExistente
      ) {
        setError(
          `Ya tiene una inscripción registrada para el curso ${
            cursoExistente?.nombre || "seleccionado"
          }. Código: ${inscripcion.codigo_inscripcion || "sin código"}.`,
        );
        return false;
      }

      if (
        nombreHorarioNuevo &&
        nombreHorarioExistente &&
        nombreHorarioNuevo === nombreHorarioExistente &&
        tienenDiasEnComun(horarioNuevo?.dias, horarioExistente?.dias)
      ) {
        setError(
          `Ya tiene otro curso inscrito en el mismo horario y día (${
            horarioExistente?.nombre || "horario registrado"
          }). Código: ${inscripcion.codigo_inscripcion || "sin código"}.`,
        );
        return false;
      }
    }

    return true;
  }

  function actualizarArchivoDocumento(documentoId: string, archivo: File | null) {
    setArchivosDocumentos((prev) => ({
      ...prev,
      [documentoId]: archivo,
    }));
  }

  function extensionArchivo(nombre: string) {
    const partes = nombre.split(".");
    return partes.length > 1 ? partes.pop()?.toLowerCase() || "file" : "file";
  }

  function validarArchivoDocumento(archivo: File) {
    const maxSize = 8 * 1024 * 1024;

    if (archivo.size > maxSize) {
      return "Cada documento debe tener un tamaño máximo de 8 MB.";
    }

    const tipoPermitido =
      archivo.type.startsWith("image/") || archivo.type === "application/pdf";

    if (!tipoPermitido) {
      return "Solo se permiten documentos en imagen o PDF.";
    }

    return "";
  }

  function validarDocumentosRequeridos() {
    for (const documento of DOCUMENTOS_REQUERIDOS) {
      const archivo = archivosDocumentos[documento.id];

      if (!archivo) {
        setError(`Debe subir el documento obligatorio: ${documento.nombre}.`);
        return false;
      }

      const errorArchivo = validarArchivoDocumento(archivo);

      if (errorArchivo) {
        setError(`${documento.nombre}: ${errorArchivo}`);
        return false;
      }
    }

    return true;
  }

  async function subirDocumentosInscripcion(
    inscripcionId: string,
    participanteId: string,
  ) {
    for (const documento of DOCUMENTOS_REQUERIDOS) {
      const archivo = archivosDocumentos[documento.id];

      if (!archivo) {
        throw new Error(`Debe subir el documento obligatorio: ${documento.nombre}.`);
      }

      const errorArchivo = validarArchivoDocumento(archivo);

      if (errorArchivo) {
        throw new Error(`${documento.nombre}: ${errorArchivo}`);
      }

      const ext = extensionArchivo(archivo.name);
      const nombreSeguro = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const path = `${inscripcionId}/${documento.id}/${nombreSeguro}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos-participantes")
        .upload(path, archivo, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Error subiendo ${documento.nombre}: ${uploadError.message}`);
      }

      const { data: publicData } = supabase.storage
        .from("documentos-participantes")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("participantes_documentos")
        .insert({
          participante_id: participanteId,
          inscripcion_id: inscripcionId,
          tipo_documento_id: null,
          nombre_documento: documento.nombre,
          archivo_url: publicData.publicUrl,
          archivo_path: path,
          mime_type: archivo.type,
          size_bytes: archivo.size,
          estado: "Pendiente",
          observacion: "Subido durante el proceso de inscripción.",
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        throw new Error(
          `Error guardando ${documento.nombre}: ${insertError.message}`,
        );
      }
    }
  }

  async function guardarInscripcion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!sesion?.participante_id) {
      setError("Debe iniciar sesión como estudiante antes de inscribirse.");
      return;
    }

    if (!programacionId || !esUuidValido(programacionId)) {
      setError("No se encontró la programación del curso.");
      return;
    }

    if (!programacion) {
      setError("No se pudo cargar la información del curso.");
      return;
    }

    if (!fechaNacimiento) {
      setError("Debe digitar su fecha de nacimiento.");
      return;
    }

    if (!sexo) {
      setError("Debe seleccionar el sexo.");
      return;
    }

    if (!telefono.trim()) {
      setError("Debe digitar un teléfono de contacto.");
      return;
    }

    if (!direccion.trim()) {
      setError("Debe digitar su dirección.");
      return;
    }

    if (esMenorEdad) {
      if (!nombreTutor.trim()) {
        setError("Debe digitar el nombre del tutor.");
        return;
      }

      if (!telefonoTutor.trim()) {
        setError("Debe digitar el teléfono del tutor.");
        return;
      }

      if (!cedulaTutor.trim()) {
        setError("Debe digitar la cédula del tutor.");
        return;
      }
    }

    if (!tshirtTalla) {
      setError("Debe seleccionar el tamaño de T-shirt.");
      return;
    }

    if (!validarDocumentosRequeridos()) {
      return;
    }

    const puedeInscribirse = await validarInscripcionDuplicada();

    if (!puedeInscribirse) {
      return;
    }

    setGuardando(true);

    const { error: participanteError } = await supabase
      .from("participantes")
      .update({
        fecha_nacimiento: fechaNacimiento || null,
        sexo: sexo || null,
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || telefono.trim() || null,
        direccion: direccion.trim() || null,
        es_menor_edad: esMenorEdad,
        nombre_tutor: esMenorEdad ? nombreTutor.trim() || null : null,
        telefono_tutor: esMenorEdad ? telefonoTutor.trim() || null : null,
        cedula_tutor: esMenorEdad ? cedulaTutor.trim() || null : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sesion.participante_id);

    if (participanteError) {
      console.error("Error actualizando participante:", participanteError);
      setError(`Error actualizando datos del estudiante: ${participanteError.message}`);
      setGuardando(false);
      return;
    }

    const codigoInscripcion = generarCodigoInscripcion();
    const qrToken = generarQrToken();
    const qrUrl = `${window.location.origin}/movil/qr/${qrToken}`;

    const inscripcionPayload = {
      participante_id: sesion.participante_id,
      programacion_id: programacionId,
      estado_inscripcion_id: estadoRecibidaId || null,
      condicion_participante_id: null,
      metodo_pago_id: null,
      tipo_beca_id: null,
      tshirt_talla: tshirtTalla || null,
      codigo_inscripcion: codigoInscripcion,
      qr_token: qrToken,
      qr_url: qrUrl,
      qr_generado: true,
      fecha_qr_generado: new Date().toISOString(),
      observacion: observacion.trim() || null,
      estado: "Activa",
      updated_at: new Date().toISOString(),
    };

    const { data: inscripcionCreada, error: inscripcionError } = await supabase
      .from("inscripciones")
      .insert(inscripcionPayload)
      .select("id, codigo_inscripcion")
      .single();

    if (inscripcionError) {
      console.error("Error inscripción:", inscripcionError);
      setError(`Error registrando inscripción: ${inscripcionError.message}`);
      setGuardando(false);
      return;
    }

    if (!inscripcionCreada?.id) {
      setError("La inscripción fue registrada, pero no se recibió el ID para subir documentos.");
      setGuardando(false);
      return;
    }

    try {
      await subirDocumentosInscripcion(
        inscripcionCreada.id,
        sesion.participante_id,
      );
    } catch (documentosError) {
      const mensajeError =
        documentosError instanceof Error
          ? documentosError.message
          : "Error subiendo documentos.";

      console.error("Error subiendo documentos de inscripción:", documentosError);
      setError(
        `La inscripción fue creada con el código ${codigoInscripcion}, pero ocurrió un error subiendo documentos: ${mensajeError}. Puede completarlos desde el panel del estudiante.`,
      );
      setGuardando(false);
      return;
    }

    setMensaje(
      `Inscripción y documentos registrados correctamente. Código: ${codigoInscripcion}`,
    );

    setTshirtTalla("");
    setObservacion("");
    setArchivosDocumentos({});

    window.location.href = `/movil/inscripcion/confirmacion?codigo=${codigoInscripcion}`;

    setGuardando(false);
  }

  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-900">
              Inscripción
            </h1>
          </div>

          <Link
            href="/estudiantes/panel"
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
          >
            Panel
          </Link>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Complete los datos requeridos para finalizar la solicitud de inscripción.
        </p>
      </section>

      <section className="space-y-3 px-4 py-4">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando información del curso...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <p>{error}</p>

            {error.toLowerCase().includes("iniciar sesión") && (
              <Link
                href="/estudiantes/login"
                className="mt-3 inline-block rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white hover:bg-red-800"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        )}

        {mensaje && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {sesion && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Estudiante conectado
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              {sesion.nombre_completo}
            </h2>

            <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-black text-slate-800">Cédula:</span>{" "}
                {sesion.cedula || "-"}
              </p>
              <p>
                <span className="font-black text-slate-800">Teléfono:</span>{" "}
                {sesion.telefono || "-"}
              </p>
              <p className="sm:col-span-2">
                <span className="font-black text-slate-800">Correo:</span>{" "}
                {sesion.correo || "-"}
              </p>
            </div>
          </div>
        )}

        {programacion && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Curso seleccionado
            </p>

            <h2 className="mt-1 text-lg font-black text-blue-950">
              {curso?.nombre || "Curso sin nombre"}
            </h2>

            <p className="mt-1 text-sm leading-5 text-blue-800">
              {curso?.descripcion || "Sin descripción"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Inicio
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearFecha(programacion.fecha_inicio)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Fin
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearFecha(programacion.fecha_fin)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Modalidad
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {modalidad?.nombre || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Costo
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearMonto(
                    programacion.precio_especial &&
                      programacion.precio_especial > 0
                      ? programacion.precio_especial
                      : curso?.precio,
                  )}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm font-bold text-blue-900">
              Horario: {horario?.nombre || "-"}
              {horario?.dias ? ` · Días: ${horario.dias}` : ""}
            </p>
          </div>
        )}
      </section>

      <section className="px-4">
        <form
          onSubmit={guardarInscripcion}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Datos complementarios del estudiante
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Estos datos completan su expediente académico para la solicitud.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Fecha de nacimiento
              </label>

              <input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Sexo
              </label>

              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccione</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Teléfono
              </label>

              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono de contacto"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                WhatsApp
              </label>

              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Dirección
            </label>

            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Digite su dirección completa"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center gap-3 text-sm font-black text-slate-800">
              <input
                type="checkbox"
                checked={esMenorEdad}
                onChange={(e) => setEsMenorEdad(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300"
              />
              El estudiante es menor de edad
            </label>
          </div>

          {esMenorEdad && (
            <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <h3 className="text-base font-black text-amber-900">
                  Datos del tutor
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  Complete los datos del padre, madre o tutor responsable.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre del tutor
                </label>

                <input
                  type="text"
                  value={nombreTutor}
                  onChange={(e) => setNombreTutor(e.target.value)}
                  placeholder="Nombre completo del tutor"
                  className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Teléfono del tutor
                  </label>

                  <input
                    type="tel"
                    value={telefonoTutor}
                    onChange={(e) => setTelefonoTutor(e.target.value)}
                    placeholder="Teléfono del tutor"
                    className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cédula del tutor
                  </label>

                  <input
                    type="text"
                    value={cedulaTutor}
                    onChange={(e) => setCedulaTutor(e.target.value)}
                    placeholder="Cédula del tutor"
                    className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-lg font-black text-slate-900">
              Datos de la inscripción
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Estos datos corresponden específicamente al curso seleccionado.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Tamaño de T-shirt
            </label>

            <select
              value={tshirtTalla}
              onChange={(e) => setTshirtTalla(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Seleccione</option>
              <option value="S">S - Small / Pequeña</option>
              <option value="M">M - Medium / Mediana</option>
              <option value="L">L - Large / Grande</option>
              <option value="XL">XL - Extra Large</option>
              <option value="XXL">XXL - Doble Extra Large</option>
            </select>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Seleccione la talla de T-shirt para esta inscripción.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Observación
            </label>

            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Comentario adicional opcional"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-lg font-black text-slate-900">
              Documentos requeridos
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Adjunte la cédula frontal, la cédula trasera y la foto del estudiante para completar la inscripción. Se permiten imágenes o PDF hasta 8 MB.
            </p>
          </div>

          <div className="grid gap-4">
            {DOCUMENTOS_REQUERIDOS.map((documento) => {
              const archivo = archivosDocumentos[documento.id];

              return (
                <div
                  key={documento.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {documento.nombre}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {documento.descripcion}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      Obligatorio
                    </span>
                  </div>

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      actualizarArchivoDocumento(
                        documento.id,
                        e.target.files?.[0] || null,
                      )
                    }
                    className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-blue-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                  />

                  {archivo && (
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      Archivo seleccionado: {archivo.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={guardando || loading || !sesion || !programacion}
            className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white shadow-sm disabled:opacity-60"
          >
            {guardando
              ? "Registrando inscripción y documentos..."
              : "Finalizar inscripción"}
          </button>
        </form>
      </section>
    </main>
  );
}
