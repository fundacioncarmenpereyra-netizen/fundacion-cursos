"use client";

import Link from "next/link";
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

export default function AulasMovilPage() {
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
      .select(
        "id, nombre, ubicacion, capacidad, tipo_espacio, estado, created_at"
      )
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

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
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
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
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
        setMostrarFormulario(false);
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
        setMostrarFormulario(false);
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
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-900">
              Aulas / Espacios
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
          Administre aulas físicas, laboratorios, salones y espacios virtuales.
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
            + Nueva aula
          </button>

          <button
            type="button"
            onClick={cargarAulas}
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
              {estaEditando ? "Editar aula / espacio" : "Nueva aula / espacio"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del espacio.
            </p>

            <form onSubmit={guardarAula} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Aula 1"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Ubicación
                </label>

                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ej. Fundación Dra. Carmen Pereyra"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Capacidad
                </label>

                <input
                  type="number"
                  min="0"
                  value={capacidad}
                  onChange={(e) => setCapacidad(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Tipo de espacio
                </label>

                <select
                  value={tipoEspacio}
                  onChange={(e) => setTipoEspacio(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {tiposEspacio.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

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
                    ? "Actualizar espacio"
                    : "Guardar espacio"}
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
              placeholder="Buscar aula, ubicación o tipo"
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
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los tipos</option>
              {tiposEspacio.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Aulas registradas
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {aulasFiltradas.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando aulas / espacios...
          </div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay aulas o espacios registrados.
          </div>
        ) : (
          aulasFiltradas.map((aula) => (
            <article
              key={aula.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900">
                    {aula.nombre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {aula.ubicacion || "Sin ubicación"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    aula.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {aula.estado}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Capacidad
                  </p>
                  <p className="mt-1 text-base font-black text-slate-900">
                    {aula.capacidad ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Tipo
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {aula.tipo_espacio}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(aula)}
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-black text-blue-700 active:scale-[0.99]"
                >
                  Editar
                </button>

                {aula.estado === "Activo" ? (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(aula.id, "Inactivo")}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 active:scale-[0.99]"
                  >
                    Inactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(aula.id, "Activo")}
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