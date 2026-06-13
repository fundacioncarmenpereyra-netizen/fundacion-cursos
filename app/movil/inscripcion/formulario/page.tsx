"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
      precio_especial: number | null;
      cursos:
        | {
            nombre: string;
            descripcion: string | null;
            precio: number | null;
            cantidad_horas: number | null;
            duracion: string | null;
          }
        | {
            nombre: string;
            descripcion: string | null;
            precio: number | null;
            cantidad_horas: number | null;
            duracion: string | null;
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
      precio_especial: number | null;
      cursos:
        | {
            nombre: string;
            descripcion: string | null;
            precio: number | null;
            cantidad_horas: number | null;
            duracion: string | null;
          }
        | {
            nombre: string;
            descripcion: string | null;
            precio: number | null;
            cantidad_horas: number | null;
            duracion: string | null;
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

type InscripcionFormulario = {
  id: string;
  codigo_inscripcion: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  observacion: string | null;
  participantes: RelacionParticipante;
  programaciones_cursos: RelacionProgramacion;
  estados_inscripcion: RelacionNombre;
  condiciones_participante: RelacionNombre;
  metodos_pago: RelacionNombre;
  tipos_beca: RelacionNombre;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function FormularioInscripcionImprimirPage() {
  const [codigo, setCodigo] = useState("");
  const [inscripcion, setInscripcion] =
    useState<InscripcionFormulario | null>(null);
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
        fecha_inscripcion,
        estado,
        observacion,
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
          cedula_tutor
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
          precio_especial,
          cursos (
            nombre,
            descripcion,
            precio,
            cantidad_horas,
            duracion
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
      )
      .eq("codigo_inscripcion", codigoInscripcion)
      .maybeSingle();

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error cargando formulario: ${error.message}`);
      setInscripcion(null);
    } else {
      setInscripcion(data as InscripcionFormulario | null);

      if (!data) {
        setError("No se encontró una inscripción con este código.");
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

      <section className="no-print mx-auto mb-4 flex max-w-4xl flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">
            Formulario imprimible
          </p>
          <p className="text-sm text-slate-500">
            Revise el documento y presione imprimir.
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
            href={`/movil/inscripcion/confirmacion?codigo=${codigo}`}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm"
          >
            Volver
          </Link>
        </div>
      </section>

      {loading && (
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Cargando formulario...
        </div>
      )}

      {error && (
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {inscripcion && (
        <section className="mx-auto max-w-4xl bg-white p-8 text-slate-900 print:max-w-none print:p-0">
          <div className="border-b-4 border-blue-900 pb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-800">
                  Fundación Dra. Carmen Pereyra
                </p>

                <h1 className="mt-2 text-2xl font-black text-slate-900">
                  Formulario de Inscripción
                </h1>

                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Sistema de inscripción de cursos
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-500">
                  Código
                </p>
                <p className="text-lg font-black text-blue-900">
                  {inscripcion.codigo_inscripcion || codigo}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Fecha: {formatearFechaHora(inscripcion.fecha_inscripcion)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-b border-slate-300 pb-5 text-sm">
            <Campo label="Estado de inscripción" valor={estadoInscripcion?.nombre || "Recibida"} />
            <Campo label="Estado del registro" valor={inscripcion.estado} />
            <Campo label="Condición" valor={condicion?.nombre} />
            <Campo label="Método de pago" valor={metodoPago?.nombre || "Pendiente"} />
          </div>

          <Seccion titulo="1. Datos del participante">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Campo label="Nombre completo" valor={participante?.nombre_completo} />
              <Campo label="Cédula" valor={participante?.cedula} />
              <Campo label="Fecha de nacimiento" valor={formatearFecha(participante?.fecha_nacimiento)} />
              <Campo label="Sexo" valor={participante?.sexo} />
              <Campo label="Teléfono" valor={participante?.telefono} />
              <Campo label="WhatsApp" valor={participante?.whatsapp} />
              <Campo label="Correo" valor={participante?.correo} />
              <Campo label="Tamaño T-shirt" valor={participante?.tshirt_talla} />
              <Campo label="Menor de edad" valor={participante?.es_menor_edad ? "Sí" : "No"} />
            </div>

            <div className="mt-3 text-sm">
              <Campo label="Dirección" valor={participante?.direccion} />
            </div>
          </Seccion>

          {participante?.es_menor_edad && (
            <Seccion titulo="2. Datos del padre, madre o tutor">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <Campo label="Nombre del tutor" valor={participante.nombre_tutor} />
                <Campo label="Teléfono del tutor" valor={participante.telefono_tutor} />
                <Campo label="Cédula del tutor" valor={participante.cedula_tutor} />
              </div>
            </Seccion>
          )}

          <Seccion titulo={participante?.es_menor_edad ? "3. Curso solicitado" : "2. Curso solicitado"}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Campo label="Curso" valor={curso?.nombre} />
              <Campo label="Modalidad" valor={modalidad?.nombre} />
              <Campo label="Horario" valor={horario?.nombre} />
              <Campo label="Días" valor={horario?.dias} />
              <Campo label="Aula" valor={aula?.nombre} />
              <Campo label="Profesor" valor={profesor?.nombre_completo} />
              <Campo label="Fecha inicio" valor={formatearFecha(programacion?.fecha_inicio)} />
              <Campo label="Fecha fin" valor={formatearFecha(programacion?.fecha_fin)} />
              <Campo label="Duración" valor={curso?.duracion} />
              <Campo label="Cantidad de horas" valor={curso?.cantidad_horas ? String(curso.cantidad_horas) : "-"} />
              <Campo label="Costo" valor={formatearMonto(precioCurso)} />
              <Campo label="Tipo de beca" valor={tipoBeca?.nombre || "No aplica"} />
            </div>

            <div className="mt-3 text-sm">
              <Campo label="Descripción del curso" valor={curso?.descripcion} />
            </div>
          </Seccion>

          <Seccion titulo={participante?.es_menor_edad ? "4. Observaciones" : "3. Observaciones"}>
            <div className="min-h-16 rounded-xl border border-slate-300 p-3 text-sm">
              {inscripcion.observacion || "Sin observaciones."}
            </div>
          </Seccion>

          <Seccion titulo={participante?.es_menor_edad ? "5. Declaración y firma" : "4. Declaración y firma"}>
            <p className="text-sm leading-6 text-slate-700">
              Declaro que las informaciones suministradas en este formulario son
              correctas y autorizo a la Fundación Dra. Carmen Pereyra a revisar
              la documentación correspondiente para fines de inscripción y
              seguimiento académico.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
              <div>
                <div className="border-t border-slate-900 pt-2 text-center font-bold">
                  Firma del participante
                </div>
              </div>

              <div>
                <div className="border-t border-slate-900 pt-2 text-center font-bold">
                  Firma padre/madre/tutor
                </div>
                <p className="mt-1 text-center text-xs text-slate-500">
                  Si aplica
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
              <div>
                <div className="border-t border-slate-900 pt-2 text-center font-bold">
                  Fecha
                </div>
              </div>

              <div>
                <div className="border-t border-slate-900 pt-2 text-center font-bold">
                  Recibido por la Fundación
                </div>
              </div>
            </div>
          </Seccion>

          <div className="mt-6 border-t border-slate-300 pt-3 text-center text-xs font-semibold text-slate-500">
            Fundación Dra. Carmen Pereyra · Formulario generado desde el sistema
            de inscripción
          </div>
        </section>
      )}
    </main>
  );
}

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="mb-3 rounded-xl bg-blue-900 px-4 py-2 text-sm font-black uppercase tracking-wide text-white">
        {titulo}
      </h2>
      {children}
    </section>
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
    <div className="rounded-xl border border-slate-300 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 min-h-5 font-bold text-slate-900">{valor || "-"}</p>
    </div>
  );
}