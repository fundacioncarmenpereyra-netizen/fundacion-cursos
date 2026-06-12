"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Profesor = {
  id: string;
  nombre_completo: string;
  cedula: string | null;
  telefono: string | null;
  whatsapp: string | null;
  correo: string | null;
  direccion: string | null;
  especialidad: string | null;
  profesion: string | null;
  nivel_academico: string | null;
  estado: string;
  created_at: string;
};

const nivelesAcademicos = [
  "Técnico",
  "Universitario",
  "Profesional",
  "Especialidad",
  "Maestría",
  "Doctorado",
  "Otro",
];

export default function ProfesoresMovilPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [profesion, setProfesion] = useState("");
  const [nivelAcademico, setNivelAcademico] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [profesorEditandoId, setProfesorEditandoId] = useState<string | null>(
    null
  );
  const [cedulaOriginal, setCedulaOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroNivel, setFiltroNivel] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(profesorEditandoId);

  useEffect(() => {
    cargarProfesores();
  }, []);

  async function cargarProfesores() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("profesores")
      .select(
        "id, nombre_completo, cedula, telefono, whatsapp, correo, direccion, especialidad, profesion, nivel_academico, estado, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setProfesores([]);
    } else {
      setProfesores(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombreCompleto("");
    setCedula("");
    setTelefono("");
    setWhatsapp("");
    setCorreo("");
    setDireccion("");
    setEspecialidad("");
    setProfesion("");
    setNivelAcademico("");
    setEstado("Activo");

    setProfesorEditandoId(null);
    setCedulaOriginal("");
  }

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function iniciarEdicion(item: Profesor) {
    setError("");
    setMensaje("");

    setProfesorEditandoId(item.id);
    setNombreCompleto(item.nombre_completo || "");
    setCedula(item.cedula || "");
    setCedulaOriginal(item.cedula || "");
    setTelefono(item.telefono || "");
    setWhatsapp(item.whatsapp || "");
    setCorreo(item.correo || "");
    setDireccion(item.direccion || "");
    setEspecialidad(item.especialidad || "");
    setProfesion(item.profesion || "");
    setNivelAcademico(item.nivel_academico || "");
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

  async function guardarProfesor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombreCompleto.trim()) {
      setError("El nombre completo del profesor es obligatorio.");
      return;
    }

    const cedulaLimpia = cedula.trim();

    if (cedulaLimpia) {
      const cedulaFueCambiada =
        !estaEditando ||
        cedulaLimpia.toLowerCase() !== cedulaOriginal.trim().toLowerCase();

      if (cedulaFueCambiada) {
        const existeCedula = profesores.some((item) => {
          return (
            (item.cedula || "").trim().toLowerCase() ===
              cedulaLimpia.toLowerCase() && item.id !== profesorEditandoId
          );
        });

        if (existeCedula) {
          setError("Ya existe un profesor registrado con esta cédula.");
          return;
        }
      }
    }

    setGuardando(true);

    const payload = {
      nombre_completo: nombreCompleto.trim(),
      cedula: cedulaLimpia || null,
      telefono: telefono.trim() || null,
      whatsapp: whatsapp.trim() || null,
      correo: correo.trim() || null,
      direccion: direccion.trim() || null,
      especialidad: especialidad.trim() || null,
      profesion: profesion.trim() || null,
      nivel_academico: nivelAcademico || null,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && profesorEditandoId) {
      const { data, error } = await supabase
        .from("profesores")
        .update(payload)
        .eq("id", profesorEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Profesor actualizado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarProfesores();
      }
    } else {
      const { error } = await supabase.from("profesores").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Profesor registrado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarProfesores();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("profesores")
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
          ? "Profesor activado correctamente."
          : "Profesor inactivado correctamente."
      );

      if (profesorEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarProfesores();
    }
  }

  const profesoresFiltrados = profesores.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre_completo.toLowerCase().includes(texto) ||
      (item.cedula || "").toLowerCase().includes(texto) ||
      (item.telefono || "").toLowerCase().includes(texto) ||
      (item.whatsapp || "").toLowerCase().includes(texto) ||
      (item.correo || "").toLowerCase().includes(texto) ||
      (item.especialidad || "").toLowerCase().includes(texto) ||
      (item.profesion || "").toLowerCase().includes(texto) ||
      (item.nivel_academico || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideNivel =
      filtroNivel === "Todos" || item.nivel_academico === filtroNivel;

    return coincideBusqueda && coincideEstado && coincideNivel;
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
              Profesores
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
          Administre facilitadores disponibles para impartir cursos.
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
            + Nuevo profesor
          </button>

          <button
            type="button"
            onClick={cargarProfesores}
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
              {estaEditando ? "Editar profesor" : "Nuevo profesor"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del facilitador.
            </p>

            <form onSubmit={guardarProfesor} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre completo
                </label>

                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Nombre completo del profesor"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Cédula
                </label>

                <input
                  type="text"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="Cédula"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Teléfono
                  </label>

                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Teléfono"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    WhatsApp
                  </label>

                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Correo
                </label>

                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Dirección
                </label>

                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección"
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Especialidad
                </label>

                <input
                  type="text"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  placeholder="Ej. Informática, Enfermería, Belleza"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Profesión
                </label>

                <input
                  type="text"
                  value={profesion}
                  onChange={(e) => setProfesion(e.target.value)}
                  placeholder="Profesión"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nivel académico
                </label>

                <select
                  value={nivelAcademico}
                  onChange={(e) => setNivelAcademico(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {nivelesAcademicos.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
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
                    ? "Actualizar profesor"
                    : "Guardar profesor"}
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
              placeholder="Buscar profesor, cédula o especialidad"
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
              value={filtroNivel}
              onChange={(e) => setFiltroNivel(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los niveles</option>
              {nivelesAcademicos.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Profesores registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {profesoresFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando profesores...
          </div>
        ) : profesoresFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay profesores registrados.
          </div>
        ) : (
          profesoresFiltrados.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900">
                    {item.nombre_completo}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {item.especialidad || "Sin especialidad"}
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {item.cedula || "Sin cédula"}
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
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Contacto
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    Tel: {item.telefono || "-"}
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    WhatsApp: {item.whatsapp || "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.correo || "Sin correo"}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Formación
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">
                    {item.nivel_academico || "Sin nivel académico"}
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    {item.profesion || "Sin profesión"}
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