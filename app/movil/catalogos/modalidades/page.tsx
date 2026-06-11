"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Modalidad = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
};

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [modalidadEditandoId, setModalidadEditandoId] = useState<string | null>(
    null
  );
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(modalidadEditandoId);

  useEffect(() => {
    cargarModalidades();
  }, []);

  async function cargarModalidades() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("modalidades")
      .select("id, nombre, descripcion, estado, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setModalidades([]);
    } else {
      setModalidades(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setEstado("Activo");
    setModalidadEditandoId(null);
    setNombreOriginal("");
  }

  function iniciarEdicion(modalidad: Modalidad) {
    setError("");
    setMensaje("");

    setModalidadEditandoId(modalidad.id);
    setNombre(modalidad.nombre);
    setNombreOriginal(modalidad.nombre);
    setDescripcion(modalidad.descripcion || "");
    setEstado(modalidad.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarModalidad(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre de la modalidad es obligatorio.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = modalidades.some((mod) => {
        return (
          mod.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          mod.id !== modalidadEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otra modalidad con este nombre.");
        return;
      }
    }

    setGuardando(true);

    if (estaEditando && modalidadEditandoId) {
      const { data, error } = await supabase
        .from("modalidades")
        .update({
          nombre: nombreLimpio,
          descripcion: descripcion.trim() || null,
          estado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", modalidadEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Modalidad actualizada correctamente.");
        limpiarFormulario();
        await cargarModalidades();
      }
    } else {
      const { error } = await supabase.from("modalidades").insert({
        nombre: nombreLimpio,
        descripcion: descripcion.trim() || null,
        estado,
      });

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Modalidad registrada correctamente.");
        limpiarFormulario();
        await cargarModalidades();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("modalidades")
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
          ? "Modalidad activada correctamente."
          : "Modalidad inactivada correctamente."
      );

      if (modalidadEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarModalidades();
    }
  }

  const modalidadesFiltradas = modalidades.filter((mod) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      mod.nombre.toLowerCase().includes(texto) ||
      (mod.descripcion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || mod.estado === filtroEstado;

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
                Modalidades
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre las formas en que pueden impartirse los cursos de la
                Fundación.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarModalidades}
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
              {estaEditando ? "Editar modalidad" : "Nueva modalidad"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos de la modalidad seleccionada."
                : "Registre una nueva modalidad para los cursos."}
            </p>

            <form onSubmit={guardarModalidad} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre de la modalidad
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Presencial"
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
                  placeholder="Descripción de la modalidad"
                  rows={4}
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
                    ? "Actualizar modalidad"
                    : "Guardar modalidad"}
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
                  Listado de modalidades
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registradas: {modalidadesFiltradas.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o descripción"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Activo">Activas</option>
                <option value="Inactivo">Inactivas</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
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
                        colSpan={4}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Cargando modalidades...
                      </td>
                    </tr>
                  ) : modalidadesFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay modalidades registradas.
                      </td>
                    </tr>
                  ) : (
                    modalidadesFiltradas.map((mod) => (
                      <tr key={mod.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {mod.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {mod.descripcion || "Sin descripción"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              mod.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {mod.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(mod)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {mod.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(mod.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(mod.id, "Activo")
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