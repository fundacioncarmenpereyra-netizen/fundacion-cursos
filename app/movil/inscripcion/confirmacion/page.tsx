"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type InscripcionDetalle = {
  id: string;
  codigo_inscripcion: string | null;
  qr_token: string | null;
  qr_url: string | null;
  qr_generado: boolean | null;
  fecha_qr_generado: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  participantes:
    | {
        nombre_completo: string;
        telefono: string | null;
        correo: string | null;
      }
    | {
        nombre_completo: string;
        telefono: string | null;
        correo: string | null;
      }[]
    | null;
  programaciones_cursos:
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
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
      }
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
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
      }[]
    | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ConfirmacionInscripcionPage() {
  const [codigo, setCodigo] = useState("");
  const [inscripcion, setInscripcion] = useState<InscripcionDetalle | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigoUrl = params.get("codigo") || "";

    setCodigo(codigoUrl);

    if (codigoUrl) {
      cargarInscripcion(codigoUrl);
    } else {
      setError("No se recibió el código de inscripción.");
    }
  }, []);

  async function cargarInscripcion(codigoInscripcion: string) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        qr_token,
        qr_url,
        qr_generado,
        fecha_qr_generado,
        fecha_inscripcion,
        estado,
        participantes (
          nombre_completo,
          telefono,
          correo
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          cursos (
            nombre
          ),
          modalidades (
            nombre
          ),
          horarios (
            nombre
          )
        )
      `
      )
      .eq("codigo_inscripcion", codigoInscripcion)
      .maybeSingle();

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error cargando inscripción: ${error.message}`);
      setInscripcion(null);
    } else {
      setInscripcion(data as InscripcionDetalle | null);

      if (!data) {
        setError("No se encontró una inscripción con este código.");
      }
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

  const participante = obtenerPrimero(inscripcion?.participantes);
  const programacion = obtenerPrimero(inscripcion?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);

  const codigoDisponible = inscripcion?.codigo_inscripcion || codigo;

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Fundación Dra. Carmen Pereyra
        </p>

        <h1 className="mt-1 text-xl font-black text-slate-900">
          Confirmación
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Resultado de la solicitud de inscripción.
        </p>
      </section>

      <section className="space-y-4 px-4 py-4">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando confirmación...
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
                Inscripción recibida correctamente
              </h2>

              <p className="mt-2 text-sm leading-5 text-green-800">
                Su solicitud fue registrada en el sistema de la Fundación.
                Guarde este código para consultar su inscripción.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-center shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Código de inscripción
              </p>

              <p className="mt-2 text-2xl font-black tracking-wide text-blue-950">
                {codigoDisponible}
              </p>
            </div>

            {inscripcion.qr_url && (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  QR de inscripción
                </p>

                <p className="mt-2 text-sm leading-5 text-slate-600">
                  Su QR fue generado correctamente. Puede abrirlo para validarlo
                  o presentarlo cuando sea requerido.
                </p>

                <Link
                  href={inscripcion.qr_url}
                  target="_blank"
                  className="mt-4 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white shadow-sm active:scale-[0.99]"
                >
                  Abrir QR
                </Link>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">
                Datos del participante
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

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Teléfono
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {participante?.telefono || "-"}
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
                      Estado
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {inscripcion.estado || "-"}
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

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Fecha de solicitud
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearFecha(inscripcion.fecha_inscripcion)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">
                Próximo paso
              </p>

              <p className="mt-1 text-sm leading-5 text-amber-800">
                La Fundación revisará su solicitud. Presente este código cuando
                sea requerido. También puede subir los documentos solicitados.
              </p>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-3">

{codigoDisponible && (
  <Link
    href={`/movil/inscripcion/formulario?codigo=${codigoDisponible}`}
    className="rounded-2xl bg-slate-900 px-4 py-4 text-center text-base font-black text-white shadow-sm active:scale-[0.99]"
  >
    Imprimir formulario
  </Link>
)}
          {codigoDisponible && (
            <Link
              href={`/movil/inscripcion/documentos?codigo=${codigoDisponible}`}
              className="rounded-2xl bg-green-600 px-4 py-4 text-center text-base font-black text-white shadow-sm active:scale-[0.99]"
            >
              Subir documentos
            </Link>
          )}

          <Link
            href="/movil/inicio"
            className="rounded-2xl bg-blue-700 px-4 py-4 text-center text-base font-black text-white shadow-sm active:scale-[0.99]"
          >
            Ver otros cursos
          </Link>

          <Link
            href="/estudiantes/panel"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-base font-black text-slate-700 shadow-sm active:scale-[0.99]"
          >
            Ir al Panel Principal
          </Link>
        </div>
      </section>
    </main>
  );
}