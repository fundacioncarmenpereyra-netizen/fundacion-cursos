"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RelacionParticipante =
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
      precio_especial: number | null;
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

type Inscripcion = {
  id: string;
  codigo_inscripcion: string | null;
  participante_id: string | null;
  metodo_pago_id: string | null;
  fecha_inscripcion: string | null;
  estado: string | null;
  participantes: RelacionParticipante;
  programaciones_cursos: RelacionProgramacion;
  estados_inscripcion: RelacionNombre;
  condiciones_participante: RelacionNombre;
  metodos_pago: RelacionNombre;
};

type PagoInscripcion = {
  id: string;
  inscripcion_id: string | null;
  participante_id: string | null;
  metodo_pago_id: string | null;
  monto: number | null;
  referencia: string | null;
  fecha_pago: string | null;
  estado: string | null;
  observacion: string | null;
  comprobante_url: string | null;
  created_at: string | null;
  metodos_pago:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
};

type MetodoPago = {
  id: string;
  nombre: string;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function PagosInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [pagos, setPagos] = useState<PagoInscripcion[]>([]);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("Todos");

  const [inscripcionSeleccionadaId, setInscripcionSeleccionadaId] =
    useState("");
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [monto, setMonto] = useState("");
  const [referencia, setReferencia] = useState("");
  const [fechaPago, setFechaPago] = useState("");
  const [estadoPago, setEstadoPago] = useState("Pagado");
  const [observacion, setObservacion] = useState("");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    setMensaje("");

    const { data: metodosData, error: metodosError } = await supabase
      .from("metodos_pago")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    if (metodosError) {
      console.error("Error métodos:", metodosError);
      setError(`Error cargando métodos de pago: ${metodosError.message}`);
    } else {
      setMetodosPago((metodosData || []) as MetodoPago[]);
    }

    const { data: inscripcionesData, error: inscripcionesError } =
      await supabase
        .from("inscripciones")
        .select(
          `
          id,
          codigo_inscripcion,
          participante_id,
          metodo_pago_id,
          fecha_inscripcion,
          estado,
          participantes (
            nombre_completo,
            cedula,
            telefono,
            correo
          ),
          programaciones_cursos (
            fecha_inicio,
            fecha_fin,
            precio_especial,
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
          ),
          estados_inscripcion (
            nombre
          ),
          condiciones_participante (
            nombre
          ),
          metodos_pago (
            nombre
          )
        `
        )
        .order("created_at", { ascending: false });

    if (inscripcionesError) {
      console.error("Error inscripciones:", inscripcionesError);
      setError(`Error cargando inscripciones: ${inscripcionesError.message}`);
      setInscripciones([]);
    } else {
      setInscripciones((inscripcionesData || []) as Inscripcion[]);
    }

    const { data: pagosData, error: pagosError } = await supabase
      .from("pagos_inscripciones")
      .select(
        `
        id,
        inscripcion_id,
        participante_id,
        metodo_pago_id,
        monto,
        referencia,
        fecha_pago,
        estado,
        observacion,
        comprobante_url,
        created_at,
        metodos_pago (
          nombre
        )
      `
      )
      .order("created_at", { ascending: false });

    if (pagosError) {
      console.error("Error pagos:", pagosError);
      setError(`Error cargando pagos: ${pagosError.message}`);
      setPagos([]);
    } else {
      setPagos((pagosData || []) as PagoInscripcion[]);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setInscripcionSeleccionadaId("");
    setMetodoPagoId("");
    setMonto("");
    setReferencia("");
    setFechaPago("");
    setEstadoPago("Pagado");
    setObservacion("");
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

  function formatearMonto(valor: number | string | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  function obtenerPrecioInscripcion(inscripcion: Inscripcion) {
    const programacion = obtenerPrimero(inscripcion.programaciones_cursos);
    const curso = obtenerPrimero(programacion?.cursos);

    if (programacion?.precio_especial && programacion.precio_especial > 0) {
      return Number(programacion.precio_especial);
    }

    return Number(curso?.precio || 0);
  }

  function obtenerPagosPorInscripcion(inscripcionId: string) {
    return pagos.filter((pago) => pago.inscripcion_id === inscripcionId);
  }

  function obtenerTotalPagado(inscripcionId: string) {
    return obtenerPagosPorInscripcion(inscripcionId)
      .filter((pago) => pago.estado !== "Anulado")
      .reduce((total, pago) => total + Number(pago.monto || 0), 0);
  }

  function obtenerEstadoPago(inscripcion: Inscripcion) {
    const precio = obtenerPrecioInscripcion(inscripcion);
    const pagado = obtenerTotalPagado(inscripcion.id);

    if (pagado <= 0) return "Pendiente";
    if (precio > 0 && pagado >= precio) return "Pagado";
    return "Parcial";
  }

  function colorEstadoPago(estado: string) {
    const valor = estado.toLowerCase();

    if (valor.includes("pagado")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (valor.includes("parcial")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    if (valor.includes("anulado")) {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  function seleccionarInscripcion(inscripcion: Inscripcion) {
    const participante = obtenerPrimero(inscripcion.participantes);
    const precio = obtenerPrecioInscripcion(inscripcion);
    const totalPagado = obtenerTotalPagado(inscripcion.id);
    const pendiente = Math.max(precio - totalPagado, 0);

    setInscripcionSeleccionadaId(inscripcion.id);
    setMetodoPagoId(inscripcion.metodo_pago_id || "");
    setMonto(String(pendiente || precio || ""));
    setReferencia("");
    setFechaPago(new Date().toISOString().split("T")[0]);
    setEstadoPago("Pagado");
    setObservacion(
      `Pago inscripción ${inscripcion.codigo_inscripcion || ""} - ${
        participante?.nombre_completo || ""
      }`.trim()
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function guardarPago(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!inscripcionSeleccionadaId) {
      setError("Debe seleccionar una inscripción.");
      return;
    }

    if (!monto || Number(monto) <= 0) {
      setError("Debe indicar un monto válido.");
      return;
    }

    if (!fechaPago) {
      setError("Debe indicar la fecha del pago.");
      return;
    }

    const inscripcion = inscripciones.find(
      (item) => item.id === inscripcionSeleccionadaId
    );

    if (!inscripcion) {
      setError("No se encontró la inscripción seleccionada.");
      return;
    }

    setGuardando(true);

    const { error } = await supabase.from("pagos_inscripciones").insert({
      inscripcion_id: inscripcion.id,
      participante_id: inscripcion.participante_id,
      metodo_pago_id: metodoPagoId || null,
      monto: Number(monto),
      referencia: referencia.trim() || null,
      fecha_pago: fechaPago,
      estado: estadoPago,
      observacion: observacion.trim() || null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error guardando pago:", error);
      setError(`Error guardando pago: ${error.message}`);
      setGuardando(false);
      return;
    }

    setMensaje("Pago registrado correctamente.");
    limpiarFormulario();
    await cargarDatos();

    setGuardando(false);
  }

  async function anularPago(pagoId: string) {
    const confirmar = window.confirm("¿Seguro que desea anular este pago?");

    if (!confirmar) return;

    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("pagos_inscripciones")
      .update({
        estado: "Anulado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pagoId);

    if (error) {
      console.error("Error anulando pago:", error);
      setError(`Error anulando pago: ${error.message}`);
      return;
    }

    setMensaje("Pago anulado correctamente.");
    await cargarDatos();
  }

  const inscripcionSeleccionada = inscripciones.find(
    (item) => item.id === inscripcionSeleccionadaId
  );

  const inscripcionesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return inscripciones.filter((item) => {
      const participante = obtenerPrimero(item.participantes);
      const programacion = obtenerPrimero(item.programaciones_cursos);
      const curso = obtenerPrimero(programacion?.cursos);
      const estadoPagoActual = obtenerEstadoPago(item);

      const cumpleEstado =
        filtroEstadoPago === "Todos" || estadoPagoActual === filtroEstadoPago;

      const cadena = [
        item.codigo_inscripcion || "",
        participante?.nombre_completo || "",
        participante?.cedula || "",
        participante?.telefono || "",
        curso?.nombre || "",
        estadoPagoActual,
      ]
        .join(" ")
        .toLowerCase();

      return cumpleEstado && cadena.includes(texto);
    });
  }, [inscripciones, pagos, busqueda, filtroEstadoPago]);

  const resumen = useMemo(() => {
    const totalInscripciones = inscripciones.length;

    const totalPagado = pagos
      .filter((pago) => pago.estado !== "Anulado")
      .reduce((total, pago) => total + Number(pago.monto || 0), 0);

    const pendientes = inscripciones.filter(
      (item) => obtenerEstadoPago(item) === "Pendiente"
    ).length;

    const parciales = inscripciones.filter(
      (item) => obtenerEstadoPago(item) === "Parcial"
    ).length;

    const pagadas = inscripciones.filter(
      (item) => obtenerEstadoPago(item) === "Pagado"
    ).length;

    return {
      totalInscripciones,
      totalPagado,
      pendientes,
      parciales,
      pagadas,
    };
  }, [inscripciones, pagos]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Pagos de inscripciones
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Registro y control de pagos realizados por los participantes.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/inscripciones"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Inscripciones
            </Link>

            <Link
              href="/catalogos"
              className="rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-blue-800"
            >
              Catálogos
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <ResumenCard titulo="Inscripciones" valor={resumen.totalInscripciones} />
          <ResumenCard titulo="Total pagado" valor={formatearMonto(resumen.totalPagado)} />
          <ResumenCard titulo="Pendientes" valor={resumen.pendientes} variante="slate" />
          <ResumenCard titulo="Parciales" valor={resumen.parciales} variante="amber" />
          <ResumenCard titulo="Pagadas" valor={resumen.pagadas} variante="green" />
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

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={guardarPago}
            className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-black text-slate-900">
              Registrar pago
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Seleccione una inscripción desde el listado y complete los datos
              del pago.
            </p>

            {inscripcionSeleccionada ? (
              <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-black uppercase text-blue-500">
                  Inscripción seleccionada
                </p>

                <p className="mt-1 text-sm font-black text-blue-950">
                  {inscripcionSeleccionada.codigo_inscripcion}
                </p>

                <p className="mt-1 text-sm text-blue-800">
                  {
                    obtenerPrimero(inscripcionSeleccionada.participantes)
                      ?.nombre_completo
                  }
                </p>

                <p className="mt-2 text-xs font-bold text-blue-700">
                  Costo: {formatearMonto(obtenerPrecioInscripcion(inscripcionSeleccionada))}
                </p>

                <p className="mt-1 text-xs font-bold text-blue-700">
                  Pagado: {formatearMonto(obtenerTotalPagado(inscripcionSeleccionada.id))}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Ninguna inscripción seleccionada.
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Método de pago
                </label>

                <select
                  value={metodoPagoId}
                  onChange={(e) => setMetodoPagoId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {metodosPago.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Monto pagado
                </label>

                <input
                  type="number"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Referencia
                </label>

                <input
                  type="text"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Número de recibo, transferencia o comprobante"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Fecha de pago
                </label>

                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Estado del pago
                </label>

                <select
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Pagado">Pagado</option>
                  <option value="Parcial">Parcial</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Observación
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Comentario del pago"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-2xl bg-green-600 px-4 py-4 text-sm font-black text-white shadow-sm hover:bg-green-700 disabled:opacity-60"
              >
                {guardando ? "Guardando pago..." : "Registrar pago"}
              </button>

              <button
                type="button"
                onClick={limpiarFormulario}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Limpiar formulario
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-[1fr_220px_150px]">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Buscar
                  </label>

                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por código, nombre, cédula, teléfono o curso"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Estado pago
                  </label>

                  <select
                    value={filtroEstadoPago}
                    onChange={(e) => setFiltroEstadoPago(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={cargarDatos}
                    className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-lg font-black text-slate-900">
                  Inscripciones y pagos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mostrando {inscripcionesFiltradas.length} registros.
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  Cargando información...
                </div>
              ) : inscripcionesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  No hay registros para mostrar.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {inscripcionesFiltradas.map((item) => {
                    const participante = obtenerPrimero(item.participantes);
                    const programacion = obtenerPrimero(
                      item.programaciones_cursos
                    );
                    const curso = obtenerPrimero(programacion?.cursos);
                    const modalidad = obtenerPrimero(programacion?.modalidades);
                    const estadoInscripcion = obtenerPrimero(
                      item.estados_inscripcion
                    );

                    const precio = obtenerPrecioInscripcion(item);
                    const totalPagado = obtenerTotalPagado(item.id);
                    const pendiente = Math.max(precio - totalPagado, 0);
                    const estadoPagoActual = obtenerEstadoPago(item);
                    const pagosItem = obtenerPagosPorInscripcion(item.id);

                    return (
                      <article key={item.id} className="p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${colorEstadoPago(
                                  estadoPagoActual
                                )}`}
                              >
                                {estadoPagoActual}
                              </span>

                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                {item.codigo_inscripcion || "Sin código"}
                              </span>

                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                                {estadoInscripcion?.nombre || "Sin estado"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black text-slate-900">
                              {participante?.nombre_completo ||
                                "Sin participante"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              {curso?.nombre || "Curso no definido"} ·{" "}
                              {modalidad?.nombre || "Modalidad no definida"}
                            </p>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <InfoBox titulo="Costo" valor={formatearMonto(precio)} />
                              <InfoBox titulo="Pagado" valor={formatearMonto(totalPagado)} />
                              <InfoBox titulo="Pendiente" valor={formatearMonto(pendiente)} />
                            </div>

                            {pagosItem.length > 0 && (
                              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50">
                                <div className="border-b border-slate-200 px-3 py-2">
                                  <p className="text-xs font-black uppercase text-slate-500">
                                    Historial de pagos
                                  </p>
                                </div>

                                <div className="divide-y divide-slate-200">
                                  {pagosItem.map((pago) => {
                                    const metodo = obtenerPrimero(
                                      pago.metodos_pago
                                    );

                                    return (
                                      <div
                                        key={pago.id}
                                        className="grid gap-2 px-3 py-3 md:grid-cols-[1fr_120px_90px]"
                                      >
                                        <div>
                                          <p className="text-sm font-black text-slate-900">
                                            {formatearMonto(pago.monto)}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">
                                            {metodo?.nombre || "Método no definido"} ·{" "}
                                            {formatearFecha(pago.fecha_pago)}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">
                                            Ref.: {pago.referencia || "-"}
                                          </p>
                                        </div>

                                        <span
                                          className={`h-fit rounded-full border px-3 py-1 text-center text-xs font-black ${colorEstadoPago(
                                            pago.estado || "Pendiente"
                                          )}`}
                                        >
                                          {pago.estado || "Pendiente"}
                                        </span>

                                        <div className="grid gap-2">
  <Link
    href={`/pagos/recibo/${pago.id}`}
    target="_blank"
    className="h-fit rounded-xl bg-blue-700 px-3 py-2 text-center text-xs font-black text-white hover:bg-blue-800"
  >
    Recibo
  </Link>

  {pago.estado !== "Anulado" && (
    <button
      type="button"
      onClick={() => anularPago(pago.id)}
      className="h-fit rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700"
    >
      Anular
    </button>
  )}
</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="grid min-w-full gap-2 sm:grid-cols-2 xl:min-w-[180px] xl:grid-cols-1">
                            <button
                              type="button"
                              onClick={() => seleccionarInscripcion(item)}
                              className="rounded-2xl bg-green-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-green-700"
                            >
                              Registrar pago
                            </button>

                            <Link
                              href={`/inscripciones/${item.id}`}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
  variante = "blue",
}: {
  titulo: string;
  valor: string | number;
  variante?: "blue" | "green" | "amber" | "slate";
}) {
  const estilos =
    variante === "green"
      ? "border-green-200 bg-green-50 text-green-900"
      : variante === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : variante === "slate"
      ? "border-slate-200 bg-white text-slate-900"
      : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${estilos}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-2xl font-black">{valor}</p>
    </div>
  );
}

function InfoBox({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black text-slate-900">{valor}</p>
    </div>
  );
}