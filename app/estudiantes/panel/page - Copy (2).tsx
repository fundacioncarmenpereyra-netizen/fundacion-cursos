"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type EstudianteSesion = {
  auth_user_id: string;
  participante_id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  correo: string | null;
};

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

type Inscripcion = {
  id: string;
  codigo_inscripcion: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  qr_token: string | null;
  estados_inscripcion: RelacionNombre;
  programaciones_cursos:
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
        cursos: RelacionCurso;
        modalidades: RelacionNombre;
        horarios: RelacionHorario;
      }
    | {
        fecha_inicio: string | null;
        fecha_fin: string | null;
        cursos: RelacionCurso;
        modalidades: RelacionNombre;
        horarios: RelacionHorario;
      }[]
    | null;
};

type Documento = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  estado: string | null;
  nombre_documento: string | null;
  archivo_url: string | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function PanelEstudiantePage() {
  const router = useRouter();

  const [sesion, setSesion] = useState<EstudianteSesion | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarSesion();
  }, []);

  async function cargarSesion() {
    setLoading(true);
    setError("");

    const sesionGuardada = localStorage.getItem("estudiante_sesion");

    if (!sesionGuardada) {
      router.push("/estudiantes/login");
      return;
    }

    try {
      const datos = JSON.parse(sesionGuardada) as EstudianteSesion;

      if (!datos.participante_id) {
        localStorage.removeItem("estudiante_sesion");
        router.push("/estudiantes/login");
        return;
      }

      setSesion(datos);
      await cargarInscripciones(datos.participante_id);
    } catch (error) {
      console.error("Error leyendo sesión del estudiante:", error);
      localStorage.removeItem("estudiante_sesion");
      router.push("/estudiantes/login");
      return;
    }

    setLoading(false);
  }

  async function cargarInscripciones(participanteId: string) {
    const { data, error } = await supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        fecha_inscripcion,
        estado,
        qr_token,
        estados_inscripcion (
          nombre
        ),
        programaciones_cursos (
          fecha_inicio,
          fecha_fin,
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
          )
        )
      `
      )
      .eq("participante_id", participanteId)
      .order("fecha_inscripcion", { ascending: false });

    if (error) {
      console.error("Error cargando inscripciones:", error);
      setError(`Error cargando inscripciones: ${error.message}`);
      setInscripciones([]);
      setDocumentos([]);
      return;
    }

    const lista = (data || []) as Inscripcion[];
    setInscripciones(lista);

    const ids = lista.map((item) => item.id);

    if (ids.length === 0) {
      setDocumentos([]);
      return;
    }

    const { data: documentosData, error: documentosError } = await supabase
      .from("participantes_documentos")
      .select("id, inscripcion_id, participante_id, estado, nombre_documento, archivo_url")
      .in("inscripcion_id", ids);

    if (documentosError) {
      console.error("Error cargando documentos:", documentosError);
      setDocumentos([]);
      return;
    }

    setDocumentos((documentosData || []) as Documento[]);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    localStorage.removeItem("estudiante_sesion");
    router.push("/estudiantes/login");
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function colorEstado(estado: string) {
    const texto = estado.toLowerCase();

    if (texto.includes("aprob")) return "bg-green-100 text-green-700";
    if (texto.includes("rechaz")) return "bg-red-100 text-red-700";
    if (texto.includes("pend")) return "bg-amber-100 text-amber-700";
    if (texto.includes("revision") || texto.includes("revisión")) {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-700";
  }

  function documentosDeInscripcion(inscripcionId: string) {
    return documentos.filter((item) => item.inscripcion_id === inscripcionId);
  }

  function resumenDocumentos(inscripcionId: string) {
    const docs = documentosDeInscripcion(inscripcionId);

    if (docs.length === 0) {
      return {
        texto: "Documentos pendientes",
        clase: "bg-amber-100 text-amber-700",
        boton: "Subir documentos",
        botonClase: "bg-amber-600 hover:bg-amber-700",
      };
    }

    const aprobados = docs.filter(
      (item) => (item.estado || "").toLowerCase() === "aprobado"
    ).length;

    const rechazados = docs.filter(
      (item) => (item.estado || "").toLowerCase() === "rechazado"
    ).length;

    if (rechazados > 0) {
      return {
        texto: `${rechazados} rechazado(s)`,
        clase: "bg-red-100 text-red-700",
        boton: "Completar documentos",
        botonClase: "bg-red-600 hover:bg-red-700",
      };
    }

    if (aprobados === docs.length) {
      return {
        texto: `${aprobados}/${docs.length} aprobados`,
        clase: "bg-green-100 text-green-700",
        boton: "Ver documentos",
        botonClase: "bg-green-700 hover:bg-green-800",
      };
    }

    return {
      texto: `${aprobados}/${docs.length} aprobados`,
      clase: "bg-blue-100 text-blue-700",
      boton: "Completar documentos",
      botonClase: "bg-blue-700 hover:bg-blue-800",
    };
  }

  const totalInscripciones = inscripciones.length;

  const aprobadas = inscripciones.filter((item) => {
    const estado =
      obtenerPrimero(item.estados_inscripcion)?.nombre || item.estado || "";
    return estado.toLowerCase().includes("aprob");
  }).length;

  const pendientes = inscripciones.filter((item) => {
    const estado =
      obtenerPrimero(item.estados_inscripcion)?.nombre || item.estado || "";
    return (
      estado.toLowerCase().includes("pend") ||
      estado.toLowerCase().includes("revision") ||
      estado.toLowerCase().includes("revisión")
    );
  }).length;

  const tieneDocumentosPendientes = useMemo(() => {
    return inscripciones.some((item) => {
      const resumen = resumenDocumentos(item.id);
      return (
        resumen.boton === "Subir documentos" ||
        resumen.boton === "Completar documentos"
      );
    });
  }, [inscripciones, documentos]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Cargando panel del estudiante...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] bg-gradient-to-r from-blue-950 via-blue-800 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
                Fundación Dra. Carmen Pereyra
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Panel del estudiante
              </h1>

              <p className="mt-3 text-sm font-semibold text-blue-100 md:text-base">
                Bienvenido(a), {sesion?.nombre_completo || "estudiante"}.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
              <Link
                href="/movil/inicio"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-blue-900 hover:bg-blue-50"
              >
                Cursos disponibles
              </Link>

              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Salir del sistema
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {tieneDocumentosPendientes && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-bold text-amber-800">
            Tiene documentos pendientes por subir o completar. Revise la columna
            de documentos en sus inscripciones y presione el botón correspondiente.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <ResumenCard titulo="Mis inscripciones" valor={totalInscripciones} />
          <ResumenCard titulo="Aprobadas" valor={aprobadas} variante="green" />
          <ResumenCard titulo="Pendientes" valor={pendientes} variante="amber" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              Datos del estudiante
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <InfoLinea titulo="Nombre" valor={sesion?.nombre_completo || "-"} />
              <InfoLinea titulo="Cédula" valor={sesion?.cedula || "-"} />
              <InfoLinea titulo="Teléfono" valor={sesion?.telefono || "-"} />
              <InfoLinea titulo="Correo" valor={sesion?.correo || "-"} />
            </div>
          </div>

          <Link
            href="/movil/inicio"
            className="rounded-[28px] border border-blue-100 bg-blue-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">📚</div>

            <h3 className="mt-4 text-xl font-black text-slate-900">
              Cursos disponibles
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Seleccione un curso disponible para realizar una nueva inscripción.
            </p>

            <p className="mt-5 text-sm font-black text-blue-700">
              Ver cursos →
            </p>
          </Link>

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="text-4xl">🧾</div>

            <h3 className="mt-4 text-xl font-black text-slate-900">
              Seguimiento
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-600">
              Revise el estado de sus inscripciones, documentos y formularios.
            </p>

            <p className="mt-5 text-sm font-black text-emerald-700">
              Mis inscripciones
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Mis inscripciones
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Historial de cursos donde está inscrito.
            </p>
          </div>

          {inscripciones.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">
                Aún no tiene inscripciones registradas.
              </p>

              <Link
                href="/movil/inicio"
                className="mt-4 inline-block rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                Ver cursos disponibles
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="border-b border-slate-200 px-4 py-3">
                      Fecha
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Código
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Curso
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Horario
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Estado
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Documentos
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {inscripciones.map((item) => {
                    const programacion = obtenerPrimero(
                      item.programaciones_cursos
                    );
                    const curso = obtenerPrimero(programacion?.cursos);
                    const horario = obtenerPrimero(programacion?.horarios);
                    const estado =
                      obtenerPrimero(item.estados_inscripcion)?.nombre ||
                      item.estado ||
                      "Sin estado";
                    const resumenDocs = resumenDocumentos(item.id);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-4 py-3">
                          {formatearFecha(item.fecha_inscripcion)}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3 font-bold">
                          {item.codigo_inscripcion || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3">
                          <p className="font-black text-slate-900">
                            {curso?.nombre || "-"}
                          </p>

                          <p className="text-xs font-semibold text-slate-500">
                            Código curso: {curso?.codigo || "-"}
                          </p>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3">
                          <p>{horario?.nombre || "-"}</p>

                          <p className="text-xs font-semibold text-slate-500">
                            {horario?.dias || ""}
                          </p>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${colorEstado(
                              estado
                            )}`}
                          >
                            {estado}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${resumenDocs.clase}`}
                          >
                            {resumenDocs.texto}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {item.codigo_inscripcion && (
                              <>
                                <Link
                                  href={`/movil/inscripcion/documentos?codigo=${item.codigo_inscripcion}`}
                                  className={`rounded-xl px-3 py-2 text-xs font-black text-white ${resumenDocs.botonClase}`}
                                >
                                  {resumenDocs.boton}
                                </Link>

                                <Link
                                  href={`/movil/inscripcion/formulario?codigo=${item.codigo_inscripcion}`}
                                  target="_blank"
                                  className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                                >
                                  Formulario
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoLinea({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 break-words font-black text-slate-800">{valor}</p>
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
  variante?: "slate" | "green" | "amber";
}) {
  const estilos =
    variante === "green"
      ? "border-green-200 bg-green-50 text-green-900"
      : variante === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-slate-200 bg-white text-slate-900";

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${estilos}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>

      <p className="mt-2 text-4xl font-black">{valor}</p>
    </div>
  );
}
