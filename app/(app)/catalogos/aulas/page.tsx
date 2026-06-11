"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Aula = {
  id: string;
  nombre: string;
  ubicacion: string | null;
  capacidad: number | null;
  tipo_espacio: string;
  estado: string;
  created_at: string;
};

const tiposEspacio = ["Aula física", "Laboratorio", "Salón", "Aula virtual"];

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);

  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [capacidad, setCapacidad] = useState("0");
  const [tipoEspacio, setTipoEspacio] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [aulaEditandoId, setAulaEditandoId] = useState<string | null>(null);
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(aulaEditandoId);

  useEffect(() => {
    cargarAulas();
  }, []);

  async function cargarAulas() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("aulas")
      .select("id, nombre, ubicacion, capacidad, tipo_espacio, estado, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setAulas([]);
    } else {
      setAulas(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setUbicacion("");
    setCapacidad("0");
    setTipoEspacio("");
    setEstado("Activo");
    setAulaEditandoId(null);
    setNombreOriginal("");
  }

  function iniciarEdicion(aula: Aula) {
    setError("");
    setMensaje("");

    setAulaEditandoId(aula.id);
    setNombre(aula.nombre);
    setNombreOriginal(aula.nombre);
    setUbicacion(aula.ubicacion || "");
    setCapacidad(String(aula.capacidad ?? 0));
    setTipoEspacio(aula.tipo_espacio || "");
    setEstado(aula.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarAula(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del aula o espacio es obligatorio.");
      return;
    }

    if (!tipoEspacio) {
      setError("Debe seleccionar un tipo de espacio.");
      return;
    }

    const capacidadNumero = Number(capacidad);

    if (Number.isNaN(capacidadNumero) || capacidadNumero < 0) {
      setError("La capacidad debe ser un número válido.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = aulas.some((aula) => {
        return (
          aula.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          aula.id !== aulaEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otra aula o espacio con este nombre.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      ubicacion: ubicacion.trim() || null,
      capacidad: capacidadNumero,
      tipo_espacio: tipoEspacio,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && aulaEditandoId) {
      const { data, error } = await supabase
        .from("aulas")
        .update(payload)
        .eq("id", aulaEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Aula o espacio actualizado correctamente.");
        limpiarFormulario();
        await cargarAulas();
      }
    } else {
      const { error } = await supabase.from("aulas").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Aula o espacio registrado correctamente.");
        limpiarFormulario();
        await cargarAulas();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("aulas")
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
          ? "Aula o espacio activado correctamente."
          : "Aula o espacio inactivado correctamente."
      );

      if (aulaEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarAulas();
    }
  }

  const aulasFiltradas = aulas.filter((aula) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      aula.nombre.toLowerCase().includes(texto) ||
      (aula.ubicacion || "").toLowerCase().includes(texto) ||
      aula.tipo_espacio.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || aula.estado === filtroEstado;

    const coincideTipo =
      filtroTipo === "Todos" || aula.tipo_espacio === filtroTipo;

    return coincideBusqueda && coincideEstado && coincideTipo;
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
                Aulas / Espacios
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre las aulas físicas, laboratorios, salones y espacios virtuales.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarAulas}
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
              {estaEditando ? "Editar aula / espacio" : "Nueva aula / espacio"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del espacio seleccionado."
                : "Registre un espacio donde se impartirán los cursos."}
            </p>

            <form onSubmit={guardarAula} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Aula 1"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ubicación
                </label>

                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej. Fundación Dra. Carmen Pereyra"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Capacidad
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={capacidad}
                    onChange={(e) => setCapacidad(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Tipo
                  </label>

                  <select
                    value={tipoEspacio}
                    onChange={(e) => setTipoEspacio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    {tiposEspacio.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
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
                    ? "Actualizar espacio"
                    : "Guardar espacio"}
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
                  Listado de aulas / espacios
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {aulasFiltradas.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar espacio"
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
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos los tipos</option>
                {tiposEspacio.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Nombre</th>
                    <th className="px-3 py-3 font-semibold">Ubicación</th>
                    <th className="px-3 py-3 font-semibold">Capacidad</th>
                    <th className="px-3 py-3 font-semibold">Tipo</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Cargando aulas / espacios...
                      </td>
                    </tr>
                  ) : aulasFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay aulas o espacios registrados.
                      </td>
                    </tr>
                  ) : (
                    aulasFiltradas.map((aula) => (
                      <tr key={aula.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {aula.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {aula.ubicacion || "Sin ubicación"}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {aula.capacidad ?? 0}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {aula.tipo_espacio}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              aula.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {aula.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(aula)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {aula.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() => cambiarEstado(aula.id, "Inactivo")}
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => cambiarEstado(aula.id, "Activo")}
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