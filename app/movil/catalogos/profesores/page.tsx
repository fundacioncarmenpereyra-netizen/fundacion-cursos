"use client";

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

export default function ProfesoresPage() {
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

  function iniciarEdicion(profesor: Profesor) {
    setError("");
    setMensaje("");

    setProfesorEditandoId(profesor.id);
    setNombreCompleto(profesor.nombre_completo || "");
    setCedula(profesor.cedula || "");
    setCedulaOriginal(profesor.cedula || "");
    setTelefono(profesor.telefono || "");
    setWhatsapp(profesor.whatsapp || "");
    setCorreo(profesor.correo || "");
    setDireccion(profesor.direccion || "");
    setEspecialidad(profesor.especialidad || "");
    setProfesion(profesor.profesion || "");
    setNivelAcademico(profesor.nivel_academico || "");
    setEstado(profesor.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarProfesor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombreCompleto.trim()) {
      setError("El nombre completo del profesor es obligatorio.");
      return;
    }

    const nombreLimpio = nombreCompleto.trim();
    const cedulaLimpia = cedula.trim();

    if (cedulaLimpia) {
      const cedulaFueCambiada =
        !estaEditando ||
        cedulaLimpia.toLowerCase() !== cedulaOriginal.trim().toLowerCase();

      if (cedulaFueCambiada) {
        const existeCedula = profesores.some((profesor) => {
          return (
            (profesor.cedula || "").trim().toLowerCase() ===
              cedulaLimpia.toLowerCase() &&
            profesor.id !== profesorEditandoId
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
      nombre_completo: nombreLimpio,
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

  const profesoresFiltrados = profesores.filter((profesor) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      profesor.nombre_completo.toLowerCase().includes(texto) ||
      (profesor.cedula || "").toLowerCase().includes(texto) ||
      (profesor.telefono || "").toLowerCase().includes(texto) ||
      (profesor.whatsapp || "").toLowerCase().includes(texto) ||
      (profesor.correo || "").toLowerCase().includes(texto) ||
      (profesor.especialidad || "").toLowerCase().includes(texto) ||
      (profesor.profesion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || profesor.estado === filtroEstado;

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
                Profesores
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre los profesores o facilitadores disponibles para los
                cursos.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarProfesores}
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

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              {estaEditando ? "Editar profesor" : "Nuevo profesor"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del profesor seleccionado."
                : "Registre un profesor para luego asignarlo a los cursos."}
            </p>

            <form onSubmit={guardarProfesor} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre completo
                </label>

                <input
                  type="text"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cédula
                  </label>

                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="000-0000000-0"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>

                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="809-000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    WhatsApp
                  </label>

                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="829-000-0000"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Correo
                  </label>

                  <input
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dirección
                </label>

                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección del profesor"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Especialidad
                  </label>

                  <input
                    type="text"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Ej. Excel, Farmacia, Contabilidad"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Profesión
                  </label>

                  <input
                    type="text"
                    value={profesion}
                    onChange={(e) => setProfesion(e.target.value)}
                    placeholder="Ej. Licenciado, Técnico"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nivel académico
                </label>

                <select
                  value={nivelAcademico}
                  onChange={(e) => setNivelAcademico(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                    ? "Actualizar profesor"
                    : "Guardar profesor"}
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

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Listado de profesores
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {profesoresFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar profesor"
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
                    <th className="px-3 py-3 font-semibold">Profesor</th>
                    <th className="px-3 py-3 font-semibold">Contacto</th>
                    <th className="px-3 py-3 font-semibold">Especialidad</th>
                    <th className="px-3 py-3 font-semibold">Nivel</th>
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
                        Cargando profesores...
                      </td>
                    </tr>
                  ) : profesoresFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay profesores registrados.
                      </td>
                    </tr>
                  ) : (
                    profesoresFiltrados.map((profesor) => (
                      <tr
                        key={profesor.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {profesor.nombre_completo}
                          </p>
                          <p className="text-xs text-slate-500">
                            Cédula: {profesor.cedula || "No registrada"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          <p>Tel: {profesor.telefono || "-"}</p>
                          <p className="text-xs">
                            WhatsApp: {profesor.whatsapp || "-"}
                          </p>
                          <p className="text-xs">
                            {profesor.correo || "Sin correo"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          <p>{profesor.especialidad || "-"}</p>
                          <p className="text-xs">
                            {profesor.profesion || ""}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {profesor.nivel_academico || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              profesor.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {profesor.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(profesor)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {profesor.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(profesor.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(profesor.id, "Activo")
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