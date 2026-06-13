"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type RelacionNombre =
  | {
      nombre: string;
    }
  | {
      nombre: string;
    }[]
  | null;

type PagoDetalle = {
  id: string;
  monto: number | null;
  referencia: string | null;
  fecha_pago: string | null;
  estado: string | null;
  observacion: string | null;
  created_at: string | null;
  metodos_pago: RelacionNombre;
  inscripciones:
    | {
        codigo_inscripcion: string | null;
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
        programaciones_cursos:
          | {
              fecha_inicio: string | null;
              fecha_fin: string | null;
              cursos:
                | {
                    nombre: string;
                    precio: number | null;
                  }
                | {
                    nombre: string;
                    precio: number | null;
                  }[]
                | null;
              modalidades: RelacionNombre;
              horarios: RelacionNombre;
            }
          | {
              fecha_inicio: string | null;
              fecha_fin: string | null;
              cursos:
                | {
                    nombre: string;
                    precio: number | null;
                  }
                | {
                    nombre: string;
                    precio: number | null;
                  }[]
                | null;
              modalidades: RelacionNombre;
              horarios: RelacionNombre;
            }[]
          | null;
      }
    | {
        codigo_inscripcion: string | null;
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
        programaciones_cursos:
          | {
              fecha_inicio: string | null;
              fecha_fin: string | null;
              cursos:
                | {
                    nombre: string;
                    precio: number | null;
                  }
                | {
                    nombre: string;
                    precio: number | null;
                  }[]
                | null;
              modalidades: RelacionNombre;
              horarios: RelacionNombre;
            }
          | {
              fecha_inicio: string | null;
              fecha_fin: string | null;
              cursos:
                | {
                    nombre: string;
                    precio: number | null;
                  }
                | {
                    nombre: string;
                    precio: number | null;
                  }[]
                | null;
              modalidades: RelacionNombre;
              horarios: RelacionNombre;
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

export default function ReciboPagoPage() {
  const params = useParams<{ id: string }>();

  const [pagoId, setPagoId] = useState("");
  const [pago, setPago] = useState<PagoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const idParam = params?.id;
    const idUrl = Array.isArray(idParam) ? idParam[0] || "" : idParam || "";

    setPagoId(idUrl);

    if (idUrl) {
      cargarPago(idUrl);
    } else {
      setError("No se recibió el ID del pago.");
    }
  }, [params]);

  async function cargarPago(id: string) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("pagos_inscripciones")
      .select(
        `
        id,
        monto,
        referencia,
        fecha_pago,
        estado,
        observacion,
        created_at,
        metodos_pago (
          nombre
        ),
        inscripciones (
          codigo_inscripcion,
          fecha_inscripcion,
          participantes (
            nombre_completo,
            cedula,
            telefono,
            correo
          ),
          programaciones_cursos (
            fecha_inicio,
            fecha_fin,
            cursos (
              nombre,
              precio
            ),
            modalidades (
              nombre
            ),
            horarios (
              nombre
            )
          )
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error cargando pago:", error);
      setError(`Error cargando recibo: ${error.message}`);
      setPago(null);
    } else {
      setPago(data as PagoDetalle | null);

      if (!data) {
        setError("No se encontró este pago.");
      }
    }

    setLoading(false);
  }

  function imprimir() {
    window.print();
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

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

  const metodo = obtenerPrimero(pago?.metodos_pago);
  const inscripcion = obtenerPrimero(pago?.inscripciones);
  const participante = obtenerPrimero(inscripcion?.participantes);
  const programacion = obtenerPrimero(inscripcion?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);

  return (
    <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 12mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>

      <section className="no-print mx-auto mb-4 flex max-w-3xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">
            Recibo imprimible
          </p>
          <p className="text-sm text-slate-500">
            Puede imprimirlo o guardarlo como PDF.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={imprimir}
            className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm"
          >
            Imprimir / Guardar PDF
          </button>

          <Link
            href="/pagos"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm"
          >
            Volver a pagos
          </Link>
        </div>
      </section>

      {loading && (
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Cargando recibo...
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {pago && (
        <section className="mx-auto max-w-3xl bg-white p-8 text-slate-900 print:max-w-none print:p-0">
          <div className="border-b-4 border-blue-900 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-800">
                  Fundación Dra. Carmen Pereyra
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-900">
                  Recibo de Pago
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Sistema de inscripción de cursos
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Recibo No.
                </p>
                <p className="text-lg font-black text-blue-900">
                  {pago.id.slice(0, 8).toUpperCase()}
                </p>

                <p className="mt-2 text-xs font-bold uppercase text-slate-500">
                  Estado
                </p>
                <p className="text-sm font-black text-slate-900">
                  {pago.estado || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-300 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Hemos recibido de
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {participante?.nombre_completo || "-"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Campo label="Cédula" valor={participante?.cedula} />
              <Campo label="Teléfono" valor={participante?.telefono} />
              <Campo label="Correo" valor={participante?.correo} />
              <Campo
                label="Código inscripción"
                valor={inscripcion?.codigo_inscripcion}
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-300 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Concepto
            </p>

            <p className="mt-2 text-lg font-black text-slate-900">
              Pago de inscripción del curso {curso?.nombre || "-"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Campo label="Curso" valor={curso?.nombre} />
              <Campo label="Modalidad" valor={modalidad?.nombre} />
              <Campo label="Horario" valor={horario?.nombre} />
              <Campo
                label="Fecha inicio"
                valor={formatearFecha(programacion?.fecha_inicio)}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                Monto recibido
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {formatearMonto(pago.monto)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-300 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Detalle del pago
              </p>

              <div className="mt-3 space-y-2 text-sm">
                <Campo label="Método" valor={metodo?.nombre} />
                <Campo label="Referencia" valor={pago.referencia} />
                <Campo
                  label="Fecha de pago"
                  valor={formatearFecha(pago.fecha_pago)}
                />
              </div>
            </div>
          </div>

          {pago.observacion && (
            <div className="mt-5 rounded-2xl border border-slate-300 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Observación
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {pago.observacion}
              </p>
            </div>
          )}

          <div className="mt-12 grid grid-cols-2 gap-10 text-sm">
            <div>
              <div className="border-t border-slate-900 pt-2 text-center font-bold">
                Recibido por
              </div>
            </div>

            <div>
              <div className="border-t border-slate-900 pt-2 text-center font-bold">
                Firma participante
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-300 pt-3 text-center text-xs font-semibold text-slate-500">
            Fundación Dra. Carmen Pereyra · Recibo generado desde el sistema
          </div>
        </section>
      )}
    </main>
  );
}

function Campo({
  label,
  valor,
}: {
  label: string;
  valor: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-900">{valor || "-"}</p>
    </div>
  );
}