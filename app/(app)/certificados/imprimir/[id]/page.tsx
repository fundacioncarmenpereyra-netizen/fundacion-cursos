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
      correo: string | null;
    }
  | {
      nombre_completo: string;
      cedula: string | null;
      fecha_nacimiento: string | null;
      sexo: string | null;
      telefono: string | null;
      correo: string | null;
    }[]
  | null;

type RelacionProgramacion =
  | {
      fecha_inicio: string | null;
      fecha_fin: string | null;
      estrategia_formacion: string | null;
      nivel_certificacion: string | null;
      cursos:
        | {
            codigo: string | null;
            nombre: string;
            descripcion: string | null;
            categorias_cursos:
              | {
                  nombre: string;
                }
              | {
                  nombre: string;
                }[]
              | null;
          }
        | {
            codigo: string | null;
            nombre: string;
            descripcion: string | null;
            categorias_cursos:
              | {
                  nombre: string;
                }
              | {
                  nombre: string;
                }[]
              | null;
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
            dias: string | null;
          }
        | {
            nombre: string;
            dias: string | null;
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
      estrategia_formacion: string | null;
      nivel_certificacion: string | null;
      cursos:
        | {
            codigo: string | null;
            nombre: string;
            descripcion: string | null;
            categorias_cursos:
              | {
                  nombre: string;
                }
              | {
                  nombre: string;
                }[]
              | null;
          }
        | {
            codigo: string | null;
            nombre: string;
            descripcion: string | null;
            categorias_cursos:
              | {
                  nombre: string;
                }
              | {
                  nombre: string;
                }[]
              | null;
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
            dias: string | null;
          }
        | {
            nombre: string;
            dias: string | null;
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

type CertificadoDetalle = {
  id: string;
  codigo_certificado: string | null;
  fecha_emision: string | null;
  estado: string | null;
  observacion: string | null;
  inscripcion_id: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  participantes: RelacionParticipante;
  programaciones_cursos: RelacionProgramacion;
  inscripciones:
    | {
        codigo_inscripcion: string | null;
      }
    | {
        codigo_inscripcion: string | null;
      }[]
    | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ImprimirCertificadoPage() {
  const params = useParams<{ id: string }>();

  const [certificado, setCertificado] = useState<CertificadoDetalle | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const idParam = params?.id;
    const certificadoId = Array.isArray(idParam)
      ? idParam[0] || ""
      : idParam || "";

    if (certificadoId) {
      cargarCertificado(certificadoId);
    } else {
      setError("No se recibió el ID del certificado.");
    }
  }, [params]);

  async function cargarCertificado(certificadoId: string) {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("certificados")
      .select(
        `
        id,
        codigo_certificado,
        fecha_emision,
        estado,
        observacion,
        inscripcion_id,
        participante_id,
        programacion_id,
        participantes (
          nombre_completo,
          cedula,
          fecha_nacimiento,
          sexo,
          telefono,
          correo
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          estrategia_formacion,
          nivel_certificacion,
          cursos (
            codigo,
            nombre,
            descripcion,
            categorias_cursos (
              nombre
            )
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
        inscripciones (
          codigo_inscripcion
        )
      `
      )
      .eq("id", certificadoId)
      .maybeSingle();

    if (error) {
      console.error("Error cargando certificado:", error);
      setError(`Error cargando certificado: ${error.message}`);
      setCertificado(null);
    } else {
      setCertificado(data as CertificadoDetalle | null);

      if (!data) {
        setError("No se encontró este certificado.");
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

  function formatearFechaLarga(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    const fecha = new Date(Number(year), Number(month) - 1, Number(day));

    return fecha.toLocaleDateString("es-DO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const participante = obtenerPrimero(certificado?.participantes);
  const programacion = obtenerPrimero(certificado?.programaciones_cursos);
  const curso = obtenerPrimero(programacion?.cursos);
  const categoria = obtenerPrimero(curso?.categorias_cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);
  const aula = obtenerPrimero(programacion?.aulas);
  const profesor = obtenerPrimero(programacion?.profesores);
  const inscripcion = obtenerPrimero(certificado?.inscripciones);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: letter landscape;
            margin: 0;
          }

          body {
            background: white !important;
          }

          main {
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .certificado-hoja {
            width: 11in;
            height: 8.5in;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-6xl space-y-6 print:max-w-none">
        <div className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Imprimir certificado
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Vista imprimible del certificado emitido.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={imprimir}
              className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Imprimir / Guardar PDF
            </button>

            <Link
              href="/certificados"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Volver a certificados
            </Link>
          </div>
        </div>

        {loading && (
          <div className="no-print rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
            Cargando certificado...
          </div>
        )}

        {error && (
          <div className="no-print rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {certificado && (
          <>
            <div className="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">
                Datos del certificado
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <InfoBox
                  titulo="Código certificado"
                  valor={certificado.codigo_certificado || "-"}
                />
                <InfoBox
                  titulo="Participante"
                  valor={participante?.nombre_completo || "-"}
                />
                <InfoBox titulo="Curso" valor={curso?.nombre || "-"} />
                <InfoBox
                  titulo="Estado"
                  valor={certificado.estado || "-"}
                />
              </div>
            </div>

            <section className="certificado-hoja relative mx-auto overflow-hidden rounded-[32px] border-[10px] border-blue-900 bg-white p-10 shadow-xl print:m-0">
              <div className="absolute inset-4 rounded-[24px] border-4 border-amber-500" />
              <div className="absolute inset-8 rounded-[18px] border border-blue-200" />

              <div className="relative z-10 flex h-full flex-col items-center justify-between text-center">
                <header className="w-full">
                  <p className="text-sm font-black uppercase tracking-[0.35em] text-blue-800">
                    Fundación Dra. Carmen Pereyra
                  </p>

                  <h1 className="mt-4 text-5xl font-black uppercase tracking-wide text-blue-950">
                    Certificado
                  </h1>

                  <p className="mt-2 text-xl font-semibold italic text-slate-600">
                    de participación / formación
                  </p>
                </header>

                <section className="w-full">
                  <p className="text-lg font-semibold text-slate-600">
                    Se certifica que
                  </p>

                  <h2 className="mt-5 break-words text-5xl font-black uppercase text-slate-950">
                    {participante?.nombre_completo || "Participante"}
                  </h2>

                  {participante?.cedula && (
                    <p className="mt-3 text-lg font-semibold text-slate-600">
                      Cédula No. {participante.cedula}
                    </p>
                  )}

                  <p className="mx-auto mt-8 max-w-4xl text-xl leading-relaxed text-slate-700">
                    ha completado satisfactoriamente la acción formativa
                  </p>

                  <h3 className="mx-auto mt-4 max-w-4xl text-3xl font-black uppercase text-blue-950">
                    {curso?.nombre || "Curso"}
                  </h3>

                  <p className="mx-auto mt-5 max-w-4xl text-lg leading-relaxed text-slate-600">
                    impartida bajo la modalidad{" "}
                    <span className="font-black">
                      {modalidad?.nombre || "-"}
                    </span>
                    {categoria?.nombre ? (
                      <>
                        {" "}
                        perteneciente a la familia profesional{" "}
                        <span className="font-black">{categoria.nombre}</span>
                      </>
                    ) : null}
                    .
                  </p>

                  <div className="mx-auto mt-8 grid max-w-4xl gap-4 text-left md:grid-cols-3">
                    <MiniDato
                      titulo="Fecha inicio"
                      valor={formatearFecha(programacion?.fecha_inicio)}
                    />

                    <MiniDato
                      titulo="Fecha fin"
                      valor={formatearFecha(programacion?.fecha_fin)}
                    />

                    <MiniDato
                      titulo="Fecha emisión"
                      valor={formatearFecha(certificado.fecha_emision)}
                    />

                    <MiniDato titulo="Horario" valor={horario?.nombre || "-"} />

                    <MiniDato titulo="Lugar" valor={aula?.nombre || "-"} />

                    <MiniDato
                      titulo="Facilitador(a)"
                      valor={profesor?.nombre_completo || "-"}
                    />
                  </div>
                </section>

                <footer className="w-full">
                  <div className="grid grid-cols-3 items-end gap-8">
                    <div className="text-center">
                      <div className="mx-auto h-px w-56 bg-slate-900" />
                      <p className="mt-2 text-sm font-black text-slate-900">
                        Presidencia
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Fundación Dra. Carmen Pereyra
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Código certificado
                      </p>

                      <p className="mt-1 text-sm font-black text-blue-950">
                        {certificado.codigo_certificado || "-"}
                      </p>

                      {inscripcion?.codigo_inscripcion && (
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Inscripción: {inscripcion.codigo_inscripcion}
                        </p>
                      )}

                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Emitido el{" "}
                        {formatearFechaLarga(certificado.fecha_emision)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="mx-auto h-px w-56 bg-slate-900" />
                      <p className="mt-2 text-sm font-black text-slate-900">
                        Coordinación Académica
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Formación Técnica
                      </p>
                    </div>
                  </div>
                </footer>
              </div>
            </section>
          </>
        )}
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

function MiniDato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">{valor}</p>
    </div>
  );
}