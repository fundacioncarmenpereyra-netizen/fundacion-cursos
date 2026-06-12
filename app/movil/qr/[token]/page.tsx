"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type InscripcionQr = {
  id: string;
  codigo_inscripcion: string | null;
  qr_token: string | null;
  qr_url: string | null;
  fecha_inscripcion: string | null;
  fecha_qr_generado: string | null;
  fecha_ultimo_escaneo: string | null;
  cantidad_escaneos: number | null;
  estado: string | null;
  participantes:
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
  programaciones_cursos:
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
        estado: string | null;
        cursos:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        modalidades:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        horarios:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        aulas:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
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
        cursos:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        modalidades:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        horarios:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
        aulas:
          | {
              nombre: string;
            }
          | {
              nombre: string;
            }[]
          | null;
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
  estados_inscripcion:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
  condiciones_participante:
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

export default function QrInscripcionPage() {
  const params = useParams<{ token: string }>();

  const [token, setToken] = useState("");
  const [inscripcion, setInscripcion] = useState<InscripcionQr | null>(null);
  const [loading, setLoading] = useState(false);
  const [registrandoEscaneo, setRegistrandoEscaneo] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const tokenParam = params?.token;

    const tokenUrl = Array.isArray(tokenParam)
      ? tokenParam[0] || ""
      : tokenParam || "";

    setToken(tokenUrl);

    if (tokenUrl) {
      cargarInscripcion(tokenUrl);
    } else {
      setError("No se recibió el token del QR.");
    }
  }, [params]);

  async function cargarInscripcion(qrToken: string) {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        qr_token,
        qr_url,
        fecha_inscripcion,
        fecha_qr_generado,
        fecha_ultimo_escaneo,
        cantidad_escaneos,
        estado,
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
        )
      `
      )
      .eq("qr_token", qrToken)
      .maybeSingle();

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error cargando inscripción: ${error.message}`);
      setInscripcion(null);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("No se encontró una inscripción con este QR.");
      setInscripcion(null);
      setLoading(false);
      return;
    }

    const detalle = data as InscripcionQr;
    setInscripcion(detalle);
    await registrarEscaneo(detalle);

    setLoading(false);
  }

  async function registrarEscaneo(detalle: InscripcionQr) {
    if (!detalle.id || !detalle.qr_token) return;

    setRegistrandoEscaneo(true);

    const nuevoTotal = Number(detalle.cantidad_escaneos || 0) + 1;
    const ahora = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("inscripciones")
      .update({
        fecha_ultimo_escaneo: ahora,
        cantidad_escaneos: nuevoTotal,
        updated_at: ahora,
      })
      .eq("id", detalle.id);

    if (updateError) {
      console.error("Error actualizando escaneo:", updateError);
      setMensaje(
        "Se abrió la inscripción, pero no se pudo actualizar el contador de escaneo."
      );
      setRegistrandoEscaneo(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("inscripciones_qr_escaneos")
      .insert({
        inscripcion_id: detalle.id,
        qr_token: detalle.qr_token,
        dispositivo: "Móvil / navegador",
        observacion: "Escaneo de QR de inscripción",
      });

    if (insertError) {
      console.error("Error registrando historial QR:", insertError);
    }

    setInscripcion({
      ...detalle,
      fecha_ultimo_escaneo: ahora,
      cantidad_escaneos: nuevoTotal,
    });

    setMensaje("QR validado correctamente.");
    setRegistrandoEscaneo(false);
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

  const participante = obtenerPrimero(inscripcion?.participantes);
  const programacion = obtenerPrimero(inscripcion?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);
  const profesor = obtenerPrimero(programacion?.profesores);
  const estadoInscripcion = obtenerPrimero(inscripcion?.estados_inscripcion);
  const condicion = obtenerPrimero(inscripcion?.condiciones_participante);

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Fundación Dra. Carmen Pereyra
        </p>

        <h1 className="mt-1 text-xl font-black text-slate-900">
          Validación QR
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Consulta rápida de inscripción mediante código QR.
        </p>
      </section>

      <section className="space-y-4 px-4 py-4">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando inscripción...
          </div>
        )}

        {registrandoEscaneo && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
            Registrando escaneo del QR...
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
            <div className="rounded-3xl border border-green-200 bg-green-50 p-5 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">
                ✓
              </div>

              <h2 className="mt-4 text-xl font-black text-green-900">
                QR válido
              </h2>

              <p className="mt-2 text-sm leading-5 text-green-800">
                La inscripción fue encontrada correctamente en el sistema.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Código de inscripción
              </p>

              <p className="mt-2 text-2xl font-black tracking-wide text-blue-950">
                {inscripcion.codigo_inscripcion || "-"}
              </p>

              <p className="mt-2 break-all text-xs font-bold text-blue-700">
                Token QR: {token}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">
                Participante
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Nombre
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {participante?.nombre_completo || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Cédula
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {participante?.cedula || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Teléfono
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {participante?.telefono || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    WhatsApp
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {participante?.whatsapp || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Correo
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {participante?.correo || "-"}
                  </p>
                </div>

                {participante?.es_menor_edad && (
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-amber-500">
                      Tutor
                    </p>
                    <p className="mt-1 text-sm font-black text-amber-900">
                      {participante.nombre_tutor || "-"}
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Tel: {participante.telefono_tutor || "-"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">
                Curso solicitado
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Curso
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-950">
                    {curso?.nombre || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Modalidad
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {modalidad?.nombre || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Condición
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {condicion?.nombre || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Horario
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {horario?.nombre || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Aula / Profesor
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {aula?.nombre || "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {profesor?.nombre_completo || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Inicio
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatearFecha(programacion?.fecha_inicio)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase text-slate-400">
                      Fin
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {formatearFecha(programacion?.fecha_fin)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">
                Estado de inscripción
              </h3>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Estado interno
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {estadoInscripcion?.nombre || "Recibida"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Estado del registro
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {inscripcion.estado || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Fecha inscripción
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearFechaHora(inscripcion.fecha_inscripcion)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Escaneos QR
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">
                    {inscripcion.cantidad_escaneos || 0}
                  </p>
                  <p className="mt-1 text-xs font-bold text-blue-700">
                    Último:{" "}
                    {formatearFechaHora(inscripcion.fecha_ultimo_escaneo)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/movil/inicio"
            className="rounded-2xl bg-blue-700 px-4 py-4 text-center text-base font-black text-white shadow-sm active:scale-[0.99]"
          >
            Volver a cursos
          </Link>

          <Link
            href="/movil/catalogos"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-base font-black text-slate-700 shadow-sm active:scale-[0.99]"
          >
            Ir al menú móvil
          </Link>
        </div>
      </section>
    </main>
  );
}