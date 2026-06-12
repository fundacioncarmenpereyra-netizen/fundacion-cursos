"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InscripcionBase = {
  id: string;
  codigo_inscripcion: string | null;
  participante_id: string | null;
  participantes:
    | {
        nombre_completo: string;
        es_menor_edad: boolean | null;
      }
    | {
        nombre_completo: string;
        es_menor_edad: boolean | null;
      }[]
    | null;
  programaciones_cursos:
    | {
        cursos:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
      }
    | {
        cursos:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
      }[]
    | null;
};

type TipoDocumento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  aplica_mayor_edad: boolean | null;
  aplica_menor_edad: boolean | null;
  obligatorio_mayor_edad: boolean | null;
  obligatorio_menor_edad: boolean | null;
};

type DocumentoSubido = {
  id: string;
  tipo_documento_id: string | null;
  nombre_documento: string | null;
  archivo_url: string | null;
  archivo_path: string | null;
  estado: string | null;
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

export default function DocumentosInscripcionPage() {
  const [codigo, setCodigo] = useState("");
  const [inscripcion, setInscripcion] = useState<InscripcionBase | null>(null);
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);
  const [documentosSubidos, setDocumentosSubidos] = useState<
    DocumentoSubido[]
  >([]);

  const [tipoDocumentoId, setTipoDocumentoId] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [observacion, setObservacion] = useState("");

  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigoUrl = params.get("codigo") || "";

    setCodigo(codigoUrl);

    if (codigoUrl) {
      cargarDatos(codigoUrl);
    } else {
      setError("No se recibió el código de inscripción.");
    }
  }, []);

  async function cargarDatos(codigoInscripcion: string) {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data: inscripcionData, error: inscripcionError } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        participante_id,
        participantes (
          nombre_completo,
          es_menor_edad
        ),
        programaciones_cursos (
          cursos (
            nombre
          )
        )
      `
      )
      .eq("codigo_inscripcion", codigoInscripcion)
      .maybeSingle();

    if (inscripcionError) {
      console.error("Error inscripción:", inscripcionError);
      setError(`Error cargando inscripción: ${inscripcionError.message}`);
      setInscripcion(null);
      setLoading(false);
      return;
    }

    if (!inscripcionData) {
      setError("No se encontró una inscripción con este código.");
      setInscripcion(null);
      setLoading(false);
      return;
    }

    const detalle = inscripcionData as InscripcionBase;
    setInscripcion(detalle);

    const participante = obtenerPrimero(detalle.participantes);
    const esMenor = Boolean(participante?.es_menor_edad);

    const { data: tiposData, error: tiposError } = await supabase
      .from("tipos_documentos")
      .select(
        `
        id,
        nombre,
        descripcion,
        aplica_mayor_edad,
        aplica_menor_edad,
        obligatorio_mayor_edad,
        obligatorio_menor_edad
      `
      )
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    if (tiposError) {
      console.error("Error tipos documentos:", tiposError);
      setError(`Error cargando tipos de documentos: ${tiposError.message}`);
    } else {
      const filtrados = ((tiposData || []) as TipoDocumento[]).filter(
        (item) =>
          esMenor
            ? Boolean(item.aplica_menor_edad)
            : Boolean(item.aplica_mayor_edad)
      );

      setTiposDocumentos(filtrados);
    }

    await cargarDocumentos(detalle.id);

    setLoading(false);
  }

  async function cargarDocumentos(inscripcionId: string) {
    const { data, error } = await supabase
      .from("participantes_documentos")
      .select(
        `
        id,
        tipo_documento_id,
        nombre_documento,
        archivo_url,
        archivo_path,
        estado,
        fecha_subida,
        tipos_documentos (
          nombre
        )
      `
      )
      .eq("inscripcion_id", inscripcionId)
      .order("fecha_subida", { ascending: false });

    if (error) {
      console.error("Error documentos:", error);
    } else {
      setDocumentosSubidos((data || []) as DocumentoSubido[]);
    }
  }

  function limpiarFormulario() {
    setTipoDocumentoId("");
    setArchivo(null);
    setObservacion("");

    const input = document.getElementById(
      "archivo-documento"
    ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  }

  function extensionArchivo(nombre: string) {
    const partes = nombre.split(".");
    return partes.length > 1 ? partes.pop()?.toLowerCase() || "file" : "file";
  }

  async function subirDocumento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!inscripcion) {
      setError("No se encontró la inscripción.");
      return;
    }

    if (!inscripcion.participante_id) {
      setError("La inscripción no tiene participante asociado.");
      return;
    }

    if (!tipoDocumentoId) {
      setError("Debe seleccionar el tipo de documento.");
      return;
    }

    if (!archivo) {
      setError("Debe seleccionar un archivo.");
      return;
    }

    const maxSize = 8 * 1024 * 1024;

    if (archivo.size > maxSize) {
      setError("El archivo no debe superar 8 MB.");
      return;
    }

    const tipoPermitido =
      archivo.type.startsWith("image/") || archivo.type === "application/pdf";

    if (!tipoPermitido) {
      setError("Solo se permiten imágenes o archivos PDF.");
      return;
    }

    setSubiendo(true);

    const tipoDocumento = tiposDocumentos.find(
      (item) => item.id === tipoDocumentoId
    );

    const ext = extensionArchivo(archivo.name);
    const nombreSeguro = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const path = `${inscripcion.id}/${tipoDocumentoId}/${nombreSeguro}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos-participantes")
      .upload(path, archivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      setError(`Error subiendo archivo: ${uploadError.message}`);
      setSubiendo(false);
      return;
    }

    const { data: publicData } = supabase.storage
      .from("documentos-participantes")
      .getPublicUrl(path);

    const archivoUrl = publicData.publicUrl;

    const { error: insertError } = await supabase
      .from("participantes_documentos")
      .insert({
        participante_id: inscripcion.participante_id,
        inscripcion_id: inscripcion.id,
        tipo_documento_id: tipoDocumentoId,
        nombre_documento: tipoDocumento?.nombre || archivo.name,
        archivo_url: archivoUrl,
        archivo_path: path,
        mime_type: archivo.type,
        size_bytes: archivo.size,
        estado: "Pendiente",
        observacion: observacion.trim() || null,
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error guardando documento:", insertError);
      setError(`Error guardando documento: ${insertError.message}`);
      setSubiendo(false);
      return;
    }

    setMensaje("Documento subido correctamente.");
    limpiarFormulario();
    await cargarDocumentos(inscripcion.id);

    setSubiendo(false);
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

  const participante = obtenerPrimero(inscripcion?.participantes);
  const programacion = obtenerPrimero(inscripcion?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const esMenorEdad = Boolean(participante?.es_menor_edad);

  const documentosObligatorios = useMemo(() => {
    return tiposDocumentos.filter((item) =>
      esMenorEdad
        ? Boolean(item.obligatorio_menor_edad)
        : Boolean(item.obligatorio_mayor_edad)
    );
  }, [tiposDocumentos, esMenorEdad]);

  const obligatoriosPendientes = documentosObligatorios.filter((tipo) => {
    return !documentosSubidos.some(
      (doc) => doc.tipo_documento_id === tipo.id
    );
  });

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Fundación Dra. Carmen Pereyra
        </p>

        <h1 className="mt-1 text-xl font-black text-slate-900">
          Documentos
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Subida de documentos del participante.
        </p>
      </section>

      <section className="space-y-4 px-4 py-4">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando información...
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
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Inscripción
              </p>

              <h2 className="mt-1 text-lg font-black text-blue-950">
                {participante?.nombre_completo || "Participante"}
              </h2>

              <p className="mt-1 text-sm text-blue-800">
                Código: {inscripcion.codigo_inscripcion || codigo}
              </p>

              <p className="mt-1 text-sm text-blue-800">
                Curso: {curso?.nombre || "-"}
              </p>

              <p className="mt-2 text-xs font-bold text-blue-700">
                Tipo: {esMenorEdad ? "Menor de edad" : "Mayor de edad"}
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">
                Documentos obligatorios
              </p>

              {documentosObligatorios.length === 0 ? (
                <p className="mt-2 text-sm text-amber-800">
                  No hay documentos obligatorios configurados.
                </p>
              ) : obligatoriosPendientes.length === 0 ? (
                <p className="mt-2 text-sm font-bold text-green-700">
                  Todos los documentos obligatorios fueron subidos.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {obligatoriosPendientes.map((tipo) => (
                    <div
                      key={tipo.id}
                      className="rounded-2xl bg-white/70 px-3 py-2 text-sm font-bold text-amber-900"
                    >
                      Pendiente: {tipo.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={subirDocumento}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Subir documento
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Seleccione el tipo de documento y adjunte una imagen o PDF.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Tipo de documento
                </label>

                <select
                  value={tipoDocumentoId}
                  onChange={(e) => setTipoDocumentoId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {tiposDocumentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                      {esMenorEdad
                        ? item.obligatorio_menor_edad
                          ? " *"
                          : ""
                        : item.obligatorio_mayor_edad
                        ? " *"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Archivo
                </label>

                <input
                  id="archivo-documento"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Formatos permitidos: imágenes y PDF. Tamaño máximo: 8 MB.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Observación
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Comentario opcional"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={subiendo}
                className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white shadow-sm disabled:opacity-60"
              >
                {subiendo ? "Subiendo documento..." : "Subir documento"}
              </button>
            </form>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-slate-900">
                  Documentos subidos
                </h3>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  {documentosSubidos.length}
                </span>
              </div>

              {documentosSubidos.length === 0 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-center text-sm font-semibold text-slate-500">
                  No hay documentos subidos.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {documentosSubidos.map((doc) => {
                    const tipoDoc = obtenerPrimero(doc.tipos_documentos);

                    return (
                      <div
                        key={doc.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {tipoDoc?.nombre ||
                                doc.nombre_documento ||
                                "Documento"}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Subido: {formatearFechaHora(doc.fecha_subida)}
                            </p>

                            <p className="mt-1 text-xs font-bold text-slate-500">
                              Estado: {doc.estado || "Pendiente"}
                            </p>
                          </div>

                          {doc.archivo_url && (
                            <Link
                              href={doc.archivo_url}
                              target="_blank"
                              className="shrink-0 rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white"
                            >
                              Ver
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href={`/movil/inscripcion/confirmacion?codigo=${codigo}`}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-base font-black text-slate-700 shadow-sm"
              >
                Volver a confirmación
              </Link>

              <Link
                href="/movil/inicio"
                className="rounded-2xl bg-blue-700 px-4 py-4 text-center text-base font-black text-white shadow-sm"
              >
                Ver cursos
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}