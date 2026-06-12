"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MetodoPago = {
  id: string;
  nombre: string;
  descripcion: string | null;
  requiere_referencia: boolean | null;
  estado: string;
  created_at: string;
};

export default function MetodosPagoMovilPage() {
  const [metodos, setMetodos] = useState<MetodoPago[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [requiereReferencia, setRequiereReferencia] = useState(false);
  const [estado, setEstado] = useState("Activo");

  const [metodoEditandoId, setMetodoEditandoId] = useState<string | null>(null);
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroReferencia, setFiltroReferencia] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(metodoEditandoId);

  useEffect(() => {
    cargarMetodos();
  }, []);

  async function cargarMetodos() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("metodos_pago")
      .select("id, nombre, descripcion, requiere_referencia, estado, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setMetodos([]);
    } else {
      setMetodos(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setRequiereReferencia(false);
    setEstado("Activo");
    setMetodoEditandoId(null);
    setNombreOriginal("");
  }

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function iniciarEdicion(item: MetodoPago) {
    setError("");
    setMensaje("");

    setMetodoEditandoId(item.id);
    setNombre(item.nombre || "");
    setNombreOriginal(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setRequiereReferencia(Boolean(item.requiere_referencia));
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

  async function guardarMetodo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del método de pago es obligatorio.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = metodos.some((item) => {
        return (
          item.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          item.id !== metodoEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otro método de pago con este nombre.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      requiere_referencia: requiereReferencia,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && metodoEditandoId) {
      const { data, error } = await supabase
        .from("metodos_pago")
        .update(payload)
        .eq("id", metodoEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Método de pago actualizado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarMetodos();
      }
    } else {
      const { error } = await supabase.from("metodos_pago").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Método de pago registrado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarMetodos();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("metodos_pago")
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
          ? "Método de pago activado correctamente."
          : "Método de pago inactivado correctamente."
      );

      if (metodoEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarMetodos();
    }
  }

  const metodosFiltrados = metodos.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(texto) ||
      (item.descripcion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideReferencia =
      filtroReferencia === "Todos" ||
      (filtroReferencia === "Si" && item.requiere_referencia) ||
      (filtroReferencia === "No" && !item.requiere_referencia);

    return coincideBusqueda && coincideEstado && coincideReferencia;
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
              Métodos de pago
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
          Administre las formas de pago aceptadas por la Fundación.
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
            + Nuevo método
          </button>

          <button
            type="button"
            onClick={cargarMetodos}
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
              {estaEditando ? "Editar método de pago" : "Nuevo método de pago"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del método de pago.
            </p>

            <form onSubmit={guardarMetodo} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Efectivo, Transferencia, Link de pago"
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
                  placeholder="Descripción del método de pago"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={requiereReferencia}
                  onChange={(e) => setRequiereReferencia(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300"
                />
                Requiere referencia o comprobante
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
                    ? "Actualizar método"
                    : "Guardar método"}
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
              placeholder="Buscar método de pago"
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
              value={filtroReferencia}
              onChange={(e) => setFiltroReferencia(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos</option>
              <option value="Si">Requieren referencia</option>
              <option value="No">No requieren referencia</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Métodos registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {metodosFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando métodos de pago...
          </div>
        ) : metodosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay métodos de pago registrados.
          </div>
        ) : (
          metodosFiltrados.map((item) => (
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

              <div className="mt-4">
                <div
                  className={`rounded-2xl p-3 ${
                    item.requiere_referencia ? "bg-blue-50" : "bg-slate-50"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Referencia / comprobante
                  </p>

                  <p
                    className={`mt-1 text-base font-black ${
                      item.requiere_referencia
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {item.requiere_referencia
                      ? "Requiere referencia"
                      : "No requiere referencia"}
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