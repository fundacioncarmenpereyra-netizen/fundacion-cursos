"use client";

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

export default function MetodosPagoPage() {
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

  function iniciarEdicion(item: MetodoPago) {
    setError("");
    setMensaje("");

    setMetodoEditandoId(item.id);
    setNombre(item.nombre || "");
    setNombreOriginal(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setRequiereReferencia(Boolean(item.requiere_referencia));
    setEstado(item.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
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
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Fundación Dra. Carmen Pereyra
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Métodos de pago
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre las formas de pago disponibles para cursos,
                inscripciones y otros servicios.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarMetodos}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Actualizar
            </button>
          </div>

          {mensaje && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {estaEditando ? "Editar método de pago" : "Nuevo método de pago"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del método seleccionado."
                : "Registre una forma de pago para el sistema."}
            </p>

            <form onSubmit={guardarMetodo} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del método
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Efectivo, Transferencia bancaria"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del método de pago"
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={requiereReferencia}
                  onChange={(e) => setRequiereReferencia(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Requiere número de referencia o comprobante
              </label>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Estado
                </label>

                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {guardando
                    ? estaEditando
                      ? "Actualizando..."
                      : "Guardando..."
                    : estaEditando
                    ? "Actualizar método"
                    : "Guardar método"}
                </button>

                {estaEditando && (
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Listado de métodos
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {metodosFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar método"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Activo">Activos</option>
                <option value="Inactivo">Inactivos</option>
              </select>

              <select
                value={filtroReferencia}
                onChange={(e) => setFiltroReferencia(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Si">Requieren referencia</option>
                <option value="No">No requieren referencia</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Nombre</th>
                    <th className="px-3 py-3 font-semibold">Descripción</th>
                    <th className="px-3 py-3 font-semibold">Referencia</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Cargando métodos de pago...
                      </td>
                    </tr>
                  ) : metodosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay métodos de pago registrados.
                      </td>
                    </tr>
                  ) : (
                    metodosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {item.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {item.descripcion || "Sin descripción"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.requiere_referencia
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {item.requiere_referencia ? "Sí" : "No"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(item)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {item.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Activo")
                                }
                                className="rounded-lg border border-green-300 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                              >
                                Activar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}