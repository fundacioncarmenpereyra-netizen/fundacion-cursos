"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EstadoInscripcion = {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number | null;
  estado: string;
  created_at: string;
};

export default function EstadosInscripcionPage() {
  const [estados, setEstados] = useState<EstadoInscripcion[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [orden, setOrden] = useState("0");
  const [estado, setEstado] = useState("Activo");

  const [estadoEditandoId, setEstadoEditandoId] = useState<string | null>(null);
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(estadoEditandoId);

  useEffect(() => {
    cargarEstados();
  }, []);

  async function cargarEstados() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("estados_inscripcion")
      .select("id, nombre, descripcion, orden, estado, created_at")
      .order("orden", { ascending: true });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setEstados([]);
    } else {
      setEstados(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setOrden("0");
    setEstado("Activo");
    setEstadoEditandoId(null);
    setNombreOriginal("");
  }

  function iniciarEdicion(item: EstadoInscripcion) {
    setError("");
    setMensaje("");

    setEstadoEditandoId(item.id);
    setNombre(item.nombre || "");
    setNombreOriginal(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setOrden(String(item.orden ?? 0));
    setEstado(item.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarEstado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del estado es obligatorio.");
      return;
    }

    const ordenNumero = Number(orden);

    if (Number.isNaN(ordenNumero) || ordenNumero < 0) {
      setError("El orden debe ser un número válido.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = estados.some((item) => {
        return (
          item.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          item.id !== estadoEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otro estado de inscripción con este nombre.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      orden: ordenNumero,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && estadoEditandoId) {
      const { data, error } = await supabase
        .from("estados_inscripcion")
        .update(payload)
        .eq("id", estadoEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Estado de inscripción actualizado correctamente.");
        limpiarFormulario();
        await cargarEstados();
      }
    } else {
      const { error } = await supabase
        .from("estados_inscripcion")
        .insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Estado de inscripción registrado correctamente.");
        limpiarFormulario();
        await cargarEstados();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("estados_inscripcion")
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
          ? "Estado activado correctamente."
          : "Estado inactivado correctamente."
      );

      if (estadoEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarEstados();
    }
  }

  const estadosFiltrados = estados.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(texto) ||
      (item.descripcion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    return coincideBusqueda && coincideEstado;
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
                Estados de inscripción
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre las etapas del proceso de inscripción de los
                participantes.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarEstados}
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
              {estaEditando
                ? "Editar estado de inscripción"
                : "Nuevo estado de inscripción"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del estado seleccionado."
                : "Registre un estado para controlar las inscripciones."}
            </p>

            <form onSubmit={guardarEstado} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del estado
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Aprobada"
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
                  placeholder="Descripción del estado"
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Orden
                </label>

                <input
                  type="number"
                  min="0"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

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
                    ? "Actualizar estado"
                    : "Guardar estado"}
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
                  Listado de estados
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {estadosFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar estado"
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
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Orden</th>
                    <th className="px-3 py-3 font-semibold">Nombre</th>
                    <th className="px-3 py-3 font-semibold">Descripción</th>
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
                        Cargando estados...
                      </td>
                    </tr>
                  ) : estadosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay estados registrados.
                      </td>
                    </tr>
                  ) : (
                    estadosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {item.orden ?? 0}
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-900">
                          {item.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {item.descripcion || "Sin descripción"}
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