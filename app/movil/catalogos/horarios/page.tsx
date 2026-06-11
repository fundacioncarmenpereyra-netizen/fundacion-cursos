"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Horario = {
  id: string;
  nombre: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  jornada: string;
  estado: string;
  created_at: string;
};

const jornadas = ["Matutina", "Vespertina", "Nocturna", "Fin de semana"];

export default function HorariosPage() {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [nombre, setNombre] = useState("");
  const [dias, setDias] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [jornada, setJornada] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [horarioEditandoId, setHorarioEditandoId] = useState<string | null>(
    null
  );

  const [diasOriginal, setDiasOriginal] = useState("");
  const [horaInicioOriginal, setHoraInicioOriginal] = useState("");
  const [horaFinOriginal, setHoraFinOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroJornada, setFiltroJornada] = useState("Todas");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(horarioEditandoId);

  useEffect(() => {
    cargarHorarios();
  }, []);

  async function cargarHorarios() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("horarios")
      .select(
        "id, nombre, dias, hora_inicio, hora_fin, jornada, estado, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setHorarios([]);
    } else {
      setHorarios(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDias("");
    setHoraInicio("");
    setHoraFin("");
    setJornada("");
    setEstado("Activo");

    setHorarioEditandoId(null);
    setDiasOriginal("");
    setHoraInicioOriginal("");
    setHoraFinOriginal("");
  }

  function iniciarEdicion(horario: Horario) {
    setError("");
    setMensaje("");

    setHorarioEditandoId(horario.id);
    setNombre(horario.nombre);
    setDias(horario.dias);
    setHoraInicio(horario.hora_inicio?.slice(0, 5) || "");
    setHoraFin(horario.hora_fin?.slice(0, 5) || "");
    setJornada(horario.jornada || "");
    setEstado(horario.estado || "Activo");

    setDiasOriginal(horario.dias);
    setHoraInicioOriginal(horario.hora_inicio?.slice(0, 5) || "");
    setHoraFinOriginal(horario.hora_fin?.slice(0, 5) || "");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  function formatearHora(hora: string) {
    if (!hora) return "-";

    const [h, m] = hora.split(":");
    const fecha = new Date();
    fecha.setHours(Number(h), Number(m || 0));

    return fecha.toLocaleTimeString("es-DO", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function guardarHorario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del horario es obligatorio.");
      return;
    }

    if (!dias.trim()) {
      setError("Los días del horario son obligatorios.");
      return;
    }

    if (!horaInicio) {
      setError("La hora de inicio es obligatoria.");
      return;
    }

    if (!horaFin) {
      setError("La hora de finalización es obligatoria.");
      return;
    }

    if (horaFin <= horaInicio) {
      setError("La hora de finalización debe ser mayor que la hora de inicio.");
      return;
    }

    if (!jornada) {
      setError("Debe seleccionar una jornada.");
      return;
    }

    const nombreLimpio = nombre.trim();
    const diasLimpio = dias.trim();

    const horarioCambio =
      !estaEditando ||
      diasLimpio.toLowerCase() !== diasOriginal.trim().toLowerCase() ||
      horaInicio !== horaInicioOriginal ||
      horaFin !== horaFinOriginal;

    if (horarioCambio) {
      const existe = horarios.some((horario) => {
        return (
          horario.dias.trim().toLowerCase() === diasLimpio.toLowerCase() &&
          horario.hora_inicio.slice(0, 5) === horaInicio &&
          horario.hora_fin.slice(0, 5) === horaFin &&
          horario.id !== horarioEditandoId
        );
      });

      if (existe) {
        setError("Ya existe un horario con esos días y horas.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      dias: diasLimpio,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      jornada,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && horarioEditandoId) {
      const { data, error } = await supabase
        .from("horarios")
        .update(payload)
        .eq("id", horarioEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Horario actualizado correctamente.");
        limpiarFormulario();
        await cargarHorarios();
      }
    } else {
      const { error } = await supabase.from("horarios").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Horario registrado correctamente.");
        limpiarFormulario();
        await cargarHorarios();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("horarios")
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
          ? "Horario activado correctamente."
          : "Horario inactivado correctamente."
      );

      if (horarioEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarHorarios();
    }
  }

  const horariosFiltrados = horarios.filter((horario) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      horario.nombre.toLowerCase().includes(texto) ||
      horario.dias.toLowerCase().includes(texto) ||
      horario.jornada.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || horario.estado === filtroEstado;

    const coincideJornada =
      filtroJornada === "Todas" || horario.jornada === filtroJornada;

    return coincideBusqueda && coincideEstado && coincideJornada;
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
                Horarios
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre los días y horas disponibles para impartir los cursos
                de la Fundación.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarHorarios}
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
              {estaEditando ? "Editar horario" : "Nuevo horario"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del horario seleccionado."
                : "Registre un nuevo horario para los cursos."}
            </p>

            <form onSubmit={guardarHorario} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del horario
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sábados 9:00 a.m. a 12:00 p.m."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Días
                </label>

                <input
                  type="text"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  placeholder="Ej. Sábados"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hora inicio
                  </label>

                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hora fin
                  </label>

                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Jornada
                </label>

                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione una jornada</option>
                  {jornadas.map((j) => (
                    <option key={j} value={j}>
                      {j}
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
                    ? "Actualizar horario"
                    : "Guardar horario"}
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
                  Listado de horarios
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {horariosFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar horario"
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
                value={filtroJornada}
                onChange={(e) => setFiltroJornada(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todas">Todas las jornadas</option>
                {jornadas.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Nombre</th>
                    <th className="px-3 py-3 font-semibold">Días</th>
                    <th className="px-3 py-3 font-semibold">Inicio</th>
                    <th className="px-3 py-3 font-semibold">Fin</th>
                    <th className="px-3 py-3 font-semibold">Jornada</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Cargando horarios...
                      </td>
                    </tr>
                  ) : horariosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay horarios registrados.
                      </td>
                    </tr>
                  ) : (
                    horariosFiltrados.map((horario) => (
                      <tr
                        key={horario.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {horario.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {horario.dias}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {formatearHora(horario.hora_inicio)}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {formatearHora(horario.hora_fin)}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {horario.jornada}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              horario.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {horario.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(horario)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {horario.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(horario.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(horario.id, "Activo")
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