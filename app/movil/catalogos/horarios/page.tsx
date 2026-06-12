"use client";

import Link from "next/link";
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

export default function HorariosMovilPage() {
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function iniciarEdicion(item: Horario) {
    setError("");
    setMensaje("");

    setHorarioEditandoId(item.id);
    setNombre(item.nombre || "");
    setDias(item.dias || "");
    setHoraInicio((item.hora_inicio || "").slice(0, 5));
    setHoraFin((item.hora_fin || "").slice(0, 5));
    setJornada(item.jornada || "");
    setEstado(item.estado || "Activo");

    setDiasOriginal(item.dias || "");
    setHoraInicioOriginal((item.hora_inicio || "").slice(0, 5));
    setHoraFinOriginal((item.hora_fin || "").slice(0, 5));

    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  function formatearHora(valor: string) {
    if (!valor) return "-";

    const hora = valor.slice(0, 5);
    const [hh, mm] = hora.split(":");
    const numeroHora = Number(hh);

    if (Number.isNaN(numeroHora)) return hora;

    const periodo = numeroHora >= 12 ? "p.m." : "a.m.";
    const hora12 = numeroHora % 12 || 12;

    return `${hora12}:${mm} ${periodo}`;
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
      setError("Debe indicar los días del horario.");
      return;
    }

    if (!horaInicio) {
      setError("Debe indicar la hora de inicio.");
      return;
    }

    if (!horaFin) {
      setError("Debe indicar la hora de fin.");
      return;
    }

    if (horaFin <= horaInicio) {
      setError("La hora de fin debe ser mayor que la hora de inicio.");
      return;
    }

    if (!jornada) {
      setError("Debe seleccionar una jornada.");
      return;
    }

    const diasLimpio = dias.trim();
    const horarioFueCambiado =
      !estaEditando ||
      diasLimpio.toLowerCase() !== diasOriginal.trim().toLowerCase() ||
      horaInicio !== horaInicioOriginal ||
      horaFin !== horaFinOriginal;

    if (horarioFueCambiado) {
      const existe = horarios.some((item) => {
        return (
          item.dias.trim().toLowerCase() === diasLimpio.toLowerCase() &&
          item.hora_inicio.slice(0, 5) === horaInicio &&
          item.hora_fin.slice(0, 5) === horaFin &&
          item.id !== horarioEditandoId
        );
      });

      if (existe) {
        setError("Ya existe un horario con esos días y horas.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombre.trim(),
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
        setMostrarFormulario(false);
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
        setMostrarFormulario(false);
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

  const horariosFiltrados = horarios.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(texto) ||
      item.dias.toLowerCase().includes(texto) ||
      item.jornada.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideJornada =
      filtroJornada === "Todas" || item.jornada === filtroJornada;

    return coincideBusqueda && coincideEstado && coincideJornada;
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
              Horarios
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
          Administre días, horas y jornadas de clases.
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
            + Nuevo horario
          </button>

          <button
            type="button"
            onClick={cargarHorarios}
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
              {estaEditando ? "Editar horario" : "Nuevo horario"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del horario.
            </p>

            <form onSubmit={guardarHorario} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre del horario
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Lunes y miércoles 6:00 p.m. a 8:00 p.m."
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Días
                </label>

                <input
                  type="text"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  placeholder="Ej. Lunes y miércoles"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Hora inicio
                  </label>

                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Hora fin
                  </label>

                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Jornada
                </label>

                <select
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {jornadas.map((item) => (
                    <option key={item} value={item}>
                      {item}
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
                    ? "Actualizar horario"
                    : "Guardar horario"}
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
              placeholder="Buscar horario, días o jornada"
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
              value={filtroJornada}
              onChange={(e) => setFiltroJornada(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todas">Todas las jornadas</option>
              {jornadas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Horarios registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {horariosFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando horarios...
          </div>
        ) : horariosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay horarios registrados.
          </div>
        ) : (
          horariosFiltrados.map((item) => (
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
                    {item.dias}
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

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Inicio
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearHora(item.hora_inicio)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Fin
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearHora(item.hora_fin)}
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Jornada
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">
                    {item.jornada}
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