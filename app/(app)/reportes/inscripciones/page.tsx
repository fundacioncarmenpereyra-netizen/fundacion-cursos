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

type Inscripcion = {
  id: string;
  codigo_inscripcion: string | null;
  fecha_inscripcion: string | null;
  participante_id: string | null;
  programacion_id: string | null;
  estado: string | null;
  participantes:
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
      }
    | {
        nombre_completo: string;
        cedula: string | null;
        telefono: string | null;
        whatsapp: string | null;
        correo: string | null;
      }[]
    | null;
  estados_inscripcion: RelacionNombre;
  programaciones_cursos:
    | {
        fecha_inicio: string | null;
        cursos:
          | {
              codigo: string | null;
              nombre: string;
            }
          | {
              codigo: string | null;
              nombre: string;
            }[]
          | null;
        modalidades: RelacionNombre;
      }
    | {
        fecha_inicio: string | null;
        cursos:
          | {
              codigo: string | null;
              nombre: string;
            }
          | {
              codigo: string | null;
              nombre: string;
            }[]
          | null;
        modalidades: RelacionNombre;
      }[]
    | null;
};

type Documento = {
  id: string;
  inscripcion_id: string | null;
  estado: string | null;
};

type Pago = {
  id: string;
  inscripcion_id: string | null;
  estado: string | null;
  monto: number | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ReporteInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarReporte();
  }, []);

  async function cargarReporte() {
    setLoading(true);
    setError("");

    let query = supabase
      .from("inscripciones")
      .select(
        `
        id,
        codigo_inscripcion,
        fecha_inscripcion,
        participante_id,
        programacion_id,
        estado,
        participantes (
          nombre_completo,
          cedula,
          telefono,
          whatsapp,
          correo
        ),
        estados_inscripcion (
          nombre
        ),
        programaciones_cursos (
          fecha_inicio,
          cursos (
            codigo,
            nombre
          ),
          modalidades (
            nombre
          )
        )
      `
      )
      .order("fecha_inscripcion", { ascending: false });

    if (desde) {
      query = query.gte("fecha_inscripcion", `${desde}T00:00:00`);
    }

    if (hasta) {
      query = query.lte("fecha_inscripcion", `${hasta}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando inscripciones:", error);
      setError(`Error cargando reporte: ${error.message}`);
      setInscripciones([]);
      setLoading(false);
      return;
    }

    const lista = (data || []) as Inscripcion[];
    setInscripciones(lista);

    const ids = lista.map((item) => item.id);

    if (ids.length > 0) {
      const [documentosResponse, pagosResponse] = await Promise.all([
        supabase
          .from("participantes_documentos")
          .select("id, inscripcion_id, estado")
          .in("inscripcion_id", ids),

        supabase
          .from("pagos_inscripciones")
          .select("id, inscripcion_id, estado, monto")
          .in("inscripcion_id", ids),
      ]);

      if (documentosResponse.error) {
        console.error("Error documentos:", documentosResponse.error);
      } else {
        setDocumentos((documentosResponse.data || []) as Documento[]);
      }

      if (pagosResponse.error) {
        console.error("Error pagos:", pagosResponse.error);
      } else {
        setPagos((pagosResponse.data || []) as Pago[]);
      }
    } else {
      setDocumentos([]);
      setPagos([]);
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

  function documentosResumen(inscripcionId: string) {
    const docs = documentos.filter((item) => item.inscripcion_id === inscripcionId);

    if (docs.length === 0) {
      return "Sin documentos";
    }

    const aprobados = docs.filter(
      (item) => (item.estado || "").toLowerCase() === "aprobado"
    ).length;

    return `${aprobados}/${docs.length} aprobados`;
  }

  function pagoResumen(inscripcionId: string) {
    const pagosInscripcion = pagos.filter(
      (item) => item.inscripcion_id === inscripcionId
    );

    if (pagosInscripcion.length === 0) {
      return "Pendiente";
    }

    const pagados = pagosInscripcion.filter(
      (item) => (item.estado || "").toLowerCase() === "pagado"
    );

    const totalPagado = pagados.reduce(
      (total, item) => total + Number(item.monto || 0),
      0
    );

    if (pagados.length === 0) {
      return "Pendiente";
    }

    return `Pagado RD$${totalPagado.toLocaleString("es-DO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function colorEstado(estado: string) {
    const texto = estado.toLowerCase();

    if (texto.includes("aprob")) return "bg-green-100 text-green-700";
    if (texto.includes("rechaz")) return "bg-red-100 text-red-700";
    if (texto.includes("revisión") || texto.includes("revision"))
      return "bg-amber-100 text-amber-700";

    return "bg-blue-100 text-blue-700";
  }

  const estadosDisponibles = useMemo(() => {
    const estados = inscripciones
      .map((item) => obtenerPrimero(item.estados_inscripcion)?.nombre || "Sin estado")
      .filter(Boolean);

    return ["Todos", ...Array.from(new Set(estados))];
  }, [inscripciones]);

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const programacion = obtenerPrimero(item.programaciones_cursos);
      const curso = obtenerPrimero(programacion?.cursos);
      const modalidad = obtenerPrimero(programacion?.modalidades);
      const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "Sin estado";

      const cumpleEstado = estadoFiltro === "Todos" || estado === estadoFiltro;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.whatsapp || "",
        participante?.correo || "",
        curso?.codigo || "",
        curso?.nombre || "",
        modalidad?.nombre || "",
        estado,
        documentosResumen(item.id),
        pagoResumen(item.id),
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [inscripciones, documentos, pagos, busqueda, estadoFiltro]);

  function imprimir() {
    window.print();
  }

  function exportarCSV() {
    const encabezados = [
      "Fecha inscripción",
      "Código inscripción",
      "Participante",
      "Cédula",
      "Teléfono",
      "WhatsApp",
      "Correo",
      "Curso",
      "Modalidad",
      "Fecha inicio",
      "Estado inscripción",
      "Documentos",
      "Pago",
    ];

    const filas = inscripcionesFiltradas.map((item) => {
      const participante = obtenerPrimero(item.participantes);
      const programacion = obtenerPrimero(item.programaciones_cursos);
      const curso = obtenerPrimero(programacion?.cursos);
      const modalidad = obtenerPrimero(programacion?.modalidades);
      const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "Sin estado";

      return [
        formatearFecha(item.fecha_inscripcion),
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        participante?.whatsapp || "",
        participante?.correo || "",
        curso?.nombre || "",
        modalidad?.nombre || "",
        formatearFecha(programacion?.fecha_inicio),
        estado,
        documentosResumen(item.id),
        pagoResumen(item.id),
      ];
    });

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "reporte-inscripciones.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const resumen = {
    total: inscripcionesFiltradas.length,
    aprobadas: inscripcionesFiltradas.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "";
      return estado.toLowerCase().includes("aprob");
    }).length,
    revision: inscripcionesFiltradas.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "";
      return estado.toLowerCase().includes("revisión") || estado.toLowerCase().includes("revision");
    }).length,
    rechazadas: inscripcionesFiltradas.filter((item) => {
      const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "";
      return estado.toLowerCase().includes("rechaz");
    }).length,
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl space-y-6 print:max-w-none">
        <div className="no-print flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">
              Reportes
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Reporte simple de inscripciones
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Seguimiento general de estudiantes inscritos, documentos y pagos.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={imprimir}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
            >
              Imprimir
            </button>

            <button
              type="button"
              onClick={exportarCSV}
              className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700"
            >
              Exportar CSV
            </button>

            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Volver al menú
            </Link>
          </div>
        </div>

        {error && (
          <div className="no-print rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="no-print rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_160px_160px_130px]">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar
              </label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre, cédula, teléfono, curso, código o estado"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Estado
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                {estadosDisponibles.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={cargarReporte}
                className="w-full rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        <div className="no-print grid gap-4 md:grid-cols-4">
          <Resumen titulo="Total" valor={resumen.total} />
          <Resumen titulo="Aprobadas" valor={resumen.aprobadas} variante="green" />
          <Resumen titulo="En revisión" valor={resumen.revision} variante="amber" />
          <Resumen titulo="Rechazadas" valor={resumen.rechazadas} variante="red" />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm print:border-0 print:shadow-none">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-lg font-black text-slate-900">
              Inscripciones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Mostrando {inscripcionesFiltradas.length} registros.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              Cargando reporte...
            </div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className="p-8 text-center text-sm font-semibold text-slate-500">
              No hay inscripciones para mostrar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="border-b border-slate-200 px-3 py-3">Fecha</th>
                    <th className="border-b border-slate-200 px-3 py-3">Código</th>
                    <th className="border-b border-slate-200 px-3 py-3">Participante</th>
                    <th className="border-b border-slate-200 px-3 py-3">Cédula</th>
                    <th className="border-b border-slate-200 px-3 py-3">Teléfono</th>
                    <th className="border-b border-slate-200 px-3 py-3">Curso</th>
                    <th className="border-b border-slate-200 px-3 py-3">Modalidad</th>
                    <th className="border-b border-slate-200 px-3 py-3">Estado</th>
                    <th className="border-b border-slate-200 px-3 py-3">Documentos</th>
                    <th className="border-b border-slate-200 px-3 py-3">Pago</th>
                    <th className="no-print border-b border-slate-200 px-3 py-3">Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {inscripcionesFiltradas.map((item) => {
                    const participante = obtenerPrimero(item.participantes);
                    const programacion = obtenerPrimero(item.programaciones_cursos);
                    const curso = obtenerPrimero(programacion?.cursos);
                    const modalidad = obtenerPrimero(programacion?.modalidades);
                    const estado = obtenerPrimero(item.estados_inscripcion)?.nombre || "Sin estado";

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="border-b border-slate-100 px-3 py-3">
                          {formatearFecha(item.fecha_inscripcion)}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3 font-bold">
                          {item.codigo_inscripcion || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3 font-black text-slate-900">
                          {participante?.nombre_completo || "-"}
                          <p className="text-xs font-semibold text-slate-500">
                            {participante?.correo || ""}
                          </p>
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {participante?.cedula || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {participante?.telefono || participante?.whatsapp || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <span className="font-bold">{curso?.nombre || "-"}</span>
                          {curso?.codigo && (
                            <p className="text-xs text-slate-500">
                              Código: {curso.codigo}
                            </p>
                          )}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {modalidad?.nombre || "-"}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${colorEstado(
                              estado
                            )}`}
                          >
                            {estado}
                          </span>
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {documentosResumen(item.id)}
                        </td>

                        <td className="border-b border-slate-100 px-3 py-3">
                          {pagoResumen(item.id)}
                        </td>

                        <td className="no-print border-b border-slate-100 px-3 py-3">
                          <Link
                            href={`/inscripciones/${item.id}`}
                            target="_blank"
                            className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                          >
                            Ver detalle
                          </Link>
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

function Resumen({
  titulo,
  valor,
  variante = "slate",
}: {
  titulo: string;
  valor: number;
  variante?: "slate" | "green" | "amber" | "red";
}) {
  const estilos =
    variante === "green"
      ? "border-green-200 bg-green-50 text-green-900"
      : variante === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : variante === "red"
      ? "border-red-200 bg-red-50 text-red-900"
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