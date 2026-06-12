"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TipoBeca = {
  id: string;
  nombre: string;
  descripcion: string | null;
  porcentaje_descuento: number | null;
  requiere_aprobacion: boolean | null;
  estado: string;
  created_at: string;
};

export default function TiposBecaMovilPage() {
  const [tiposBeca, setTiposBeca] = useState<TipoBeca[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [porcentajeDescuento, setPorcentajeDescuento] = useState("0");
  const [requiereAprobacion, setRequiereAprobacion] = useState(true);
  const [estado, setEstado] = useState("Activo");

  const [tipoBecaEditandoId, setTipoBecaEditandoId] = useState<string | null>(
    null
  );
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroAprobacion, setFiltroAprobacion] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(tipoBecaEditandoId);

  useEffect(() => {
    cargarTiposBeca();
  }, []);

  async function cargarTiposBeca() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("tipos_beca")
      .select(
        "id, nombre, descripcion, porcentaje_descuento, requiere_aprobacion, estado, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setTiposBeca([]);
    } else {
      setTiposBeca(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setPorcentajeDescuento("0");
    setRequiereAprobacion(true);
    setEstado("Activo");
    setTipoBecaEditandoId(null);
    setNombreOriginal("");
  }

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function iniciarEdicion(item: TipoBeca) {
    setError("");
    setMensaje("");

    setTipoBecaEditandoId(item.id);
    setNombre(item.nombre || "");
    setNombreOriginal(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setPorcentajeDescuento(String(item.porcentaje_descuento ?? 0));
    setRequiereAprobacion(Boolean(item.requiere_aprobacion));
    setEstado(item.estado || "Activo");

    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  async function guardarTipoBeca(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del tipo de beca es obligatorio.");
      return;
    }

    const porcentajeNumero = Number(porcentajeDescuento);

    if (
      Number.isNaN(porcentajeNumero) ||
      porcentajeNumero < 0 ||
      porcentajeNumero > 100
    ) {
      setError("El porcentaje de descuento debe estar entre 0 y 100.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = tiposBeca.some((item) => {
        return (
          item.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          item.id !== tipoBecaEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otro tipo de beca con este nombre.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      porcentaje_descuento: porcentajeNumero,
      requiere_aprobacion: requiereAprobacion,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && tipoBecaEditandoId) {
      const { data, error } = await supabase
        .from("tipos_beca")
        .update(payload)
        .eq("id", tipoBecaEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Tipo de beca actualizado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarTiposBeca();
      }
    } else {
      const { error } = await supabase.from("tipos_beca").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Tipo de beca registrado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarTiposBeca();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("tipos_beca")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar estado:", error);
      setError(`Error al actualizar estado: ${error.message}`);
    } else {
      setMensaje(
        nuevoEstado === "Activo"
          ? "Tipo de beca activado correctamente."
          : "Tipo de beca inactivado correctamente."
      );

      if (tipoBecaEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarTiposBeca();
    }
  }

  const tiposBecaFiltrados = tiposBeca.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(texto) ||
      (item.descripcion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideAprobacion =
      filtroAprobacion === "Todos" ||
      (filtroAprobacion === "Si" && item.requiere_aprobacion) ||
      (filtroAprobacion === "No" && !item.requiere_aprobacion);

    return coincideBusqueda && coincideEstado && coincideAprobacion;
  });

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-900">
              Tipos de beca
            </h1>
          </div>

          <Link
            href="/movil/catalogos"
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
          >
            Menú
          </Link>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Administre becas, descuentos y ayudas institucionales.
        </p>
      </section>

      <section className="space-y-3 px-4 py-4">
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={abrirNuevo}
            className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
          >
            + Nueva beca
          </button>

          <button
            type="button"
            onClick={cargarTiposBeca}
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm active:scale-[0.99]"
          >
            Actualizar
          </button>
        </div>
      </section>

      {mostrarFormulario && (
        <section className="px-4 pb-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              {estaEditando ? "Editar tipo de beca" : "Nuevo tipo de beca"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información de la beca o descuento.
            </p>

            <form onSubmit={guardarTipoBeca} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Beca completa, Media beca"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del tipo de beca"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Porcentaje de descuento
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={porcentajeDescuento}
                  onChange={(e) => setPorcentajeDescuento(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={requiereAprobacion}
                  onChange={(e) => setRequiereAprobacion(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300"
                />
                Requiere aprobación administrativa
              </label>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Estado
                </label>

                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-2xl bg-blue-700 px-4 py-3 text-base font-black text-white shadow-sm disabled:opacity-60"
                >
                  {guardando
                    ? estaEditando
                      ? "Actualizando..."
                      : "Guardando..."
                    : estaEditando
                    ? "Actualizar beca"
                    : "Guardar beca"}
                </button>

                <button
                  type="button"
                  onClick={cancelarEdicion}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-base font-black text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="px-4 pb-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-slate-900">
            Buscar y filtrar
          </h2>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar tipo de beca"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
            </select>

            <select
              value={filtroAprobacion}
              onChange={(e) => setFiltroAprobacion(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todas</option>
              <option value="Si">Requieren aprobación</option>
              <option value="No">No requieren aprobación</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Tipos de beca registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {tiposBecaFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando tipos de beca...
          </div>
        ) : tiposBecaFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay tipos de beca registrados.
          </div>
        ) : (
          tiposBecaFiltrados.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900">
                    {item.nombre}
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.descripcion || "Sin descripción"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    item.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.estado}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Descuento
                  </p>

                  <p className="mt-1 text-2xl font-black text-blue-900">
                    {Number(item.porcentaje_descuento || 0)}%
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-3 ${
                    item.requiere_aprobacion ? "bg-amber-50" : "bg-green-50"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Aprobación administrativa
                  </p>

                  <p
                    className={`mt-1 text-base font-black ${
                      item.requiere_aprobacion
                        ? "text-amber-700"
                        : "text-green-700"
                    }`}
                  >
                    {item.requiere_aprobacion
                      ? "Requiere aprobación"
                      : "No requiere aprobación"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(item)}
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-black text-blue-700 active:scale-[0.99]"
                >
                  Editar
                </button>

                {item.estado === "Activo" ? (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(item.id, "Inactivo")}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 active:scale-[0.99]"
                  >
                    Inactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(item.id, "Activo")}
                    className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-black text-green-700 active:scale-[0.99]"
                  >
                    Activar
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}