"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Curso = {
  id: string;
  nombre: string;
  precio: number | null;
  estado: string;
};

type Modalidad = {
  id: string;
  nombre: string;
  estado: string;
};

type Horario = {
  id: string;
  nombre: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
};

type Aula = {
  id: string;
  nombre: string;
  capacidad: number | null;
  estado: string;
};

type Profesor = {
  id: string;
  nombre_completo: string;
  estado: string;
};

type ProgramacionCurso = {
  id: string;
  curso_id: string | null;
  modalidad_id: string | null;
  horario_id: string | null;
  aula_id: string | null;
  profesor_id: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_maximo: number | null;
  cupo_disponible: number | null;
  precio_especial: number | null;
  estado: string;
  observacion: string | null;
  created_at: string;
  cursos?: { nombre: string; precio: number | null }[] | null;
  modalidades?: { nombre: string }[] | null;
  horarios?: { nombre: string; dias: string }[] | null;
  aulas?: { nombre: string }[] | null;
  profesores?: { nombre_completo: string }[] | null;
};

const estadosProgramacion = [
  "Programado",
  "Abierto",
  "En curso",
  "Finalizado",
  "Suspendido",
  "Cancelado",
];

export default function ProgramacionesCursosPage() {
  const [programaciones, setProgramaciones] = useState<ProgramacionCurso[]>([]);

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [modalidades, setModalidades] = useState<Modalidad[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [cursoId, setCursoId] = useState("");
  const [modalidadId, setModalidadId] = useState("");
  const [horarioId, setHorarioId] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cupoMaximo, setCupoMaximo] = useState("0");
  const [cupoDisponible, setCupoDisponible] = useState("0");
  const [precioEspecial, setPrecioEspecial] = useState("0");
  const [estado, setEstado] = useState("Programado");
  const [observacion, setObservacion] = useState("");

  const [programacionEditandoId, setProgramacionEditandoId] = useState<
    string | null
  >(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroCurso, setFiltroCurso] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(programacionEditandoId);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");

    const [
      cursosResponse,
      modalidadesResponse,
      horariosResponse,
      aulasResponse,
      profesoresResponse,
      programacionesResponse,
    ] = await Promise.all([
      supabase
        .from("cursos")
        .select("id, nombre, precio, estado")
        .order("nombre", { ascending: true }),

      supabase
        .from("modalidades")
        .select("id, nombre, estado")
        .order("nombre", { ascending: true }),

      supabase
        .from("horarios")
        .select("id, nombre, dias, hora_inicio, hora_fin, estado")
        .order("created_at", { ascending: false }),

      supabase
        .from("aulas")
        .select("id, nombre, capacidad, estado")
        .order("nombre", { ascending: true }),

      supabase
        .from("profesores")
        .select("id, nombre_completo, estado")
        .order("nombre_completo", { ascending: true }),

      supabase
        .from("programaciones_cursos")
        .select(
          `
          id,
          curso_id,
          modalidad_id,
          horario_id,
          aula_id,
          profesor_id,
          fecha_inicio,
          fecha_fin,
          cupo_maximo,
          cupo_disponible,
          precio_especial,
          estado,
          observacion,
          created_at,
          cursos (
            nombre,
            precio
          ),
          modalidades (
            nombre
          ),
          horarios (
            nombre,
            dias
          ),
          aulas (
            nombre
          ),
          profesores (
            nombre_completo
          )
        `
        )
        .order("created_at", { ascending: false }),
    ]);

    if (cursosResponse.error) {
      setError(`Error cargando cursos: ${cursosResponse.error.message}`);
    } else {
      setCursos(cursosResponse.data || []);
    }

    if (modalidadesResponse.error) {
      setError(`Error cargando modalidades: ${modalidadesResponse.error.message}`);
    } else {
      setModalidades(modalidadesResponse.data || []);
    }

    if (horariosResponse.error) {
      setError(`Error cargando horarios: ${horariosResponse.error.message}`);
    } else {
      setHorarios(horariosResponse.data || []);
    }

    if (aulasResponse.error) {
      setError(`Error cargando aulas: ${aulasResponse.error.message}`);
    } else {
      setAulas(aulasResponse.data || []);
    }

    if (profesoresResponse.error) {
      setError(`Error cargando profesores: ${profesoresResponse.error.message}`);
    } else {
      setProfesores(profesoresResponse.data || []);
    }

    if (programacionesResponse.error) {
      console.error("Error Supabase:", programacionesResponse.error);
      setError(`Error Supabase: ${programacionesResponse.error.message}`);
      setProgramaciones([]);
    } else {
      setProgramaciones(
        (programacionesResponse.data || []) as ProgramacionCurso[]
      );
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setCursoId("");
    setModalidadId("");
    setHorarioId("");
    setAulaId("");
    setProfesorId("");
    setFechaInicio("");
    setFechaFin("");
    setCupoMaximo("0");
    setCupoDisponible("0");
    setPrecioEspecial("0");
    setEstado("Programado");
    setObservacion("");
    setProgramacionEditandoId(null);
  }

  function iniciarEdicion(item: ProgramacionCurso) {
    setError("");
    setMensaje("");

    setProgramacionEditandoId(item.id);
    setCursoId(item.curso_id || "");
    setModalidadId(item.modalidad_id || "");
    setHorarioId(item.horario_id || "");
    setAulaId(item.aula_id || "");
    setProfesorId(item.profesor_id || "");
    setFechaInicio(item.fecha_inicio || "");
    setFechaFin(item.fecha_fin || "");
    setCupoMaximo(String(item.cupo_maximo ?? 0));
    setCupoDisponible(String(item.cupo_disponible ?? 0));
    setPrecioEspecial(String(item.precio_especial ?? 0));
    setEstado(item.estado || "Programado");
    setObservacion(item.observacion || "");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  function formatearFecha(fecha: string | null) {
    if (!fecha) return "-";

    const [year, month, day] = fecha.split("-");
    return `${day}/${month}/${year}`;
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  function obtenerPrecioBaseCurso() {
    const curso = cursos.find((item) => item.id === cursoId);
    return Number(curso?.precio || 0);
  }

  function usarPrecioCurso() {
    const precio = obtenerPrecioBaseCurso();
    setPrecioEspecial(String(precio));
  }

  async function guardarProgramacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!cursoId) {
      setError("Debe seleccionar un curso.");
      return;
    }

    if (!modalidadId) {
      setError("Debe seleccionar una modalidad.");
      return;
    }

    if (!horarioId) {
      setError("Debe seleccionar un horario.");
      return;
    }

    if (!aulaId) {
      setError("Debe seleccionar un aula o espacio.");
      return;
    }

    if (!profesorId) {
      setError("Debe seleccionar un profesor.");
      return;
    }

    if (!fechaInicio) {
      setError("La fecha de inicio es obligatoria.");
      return;
    }

    if (!fechaFin) {
      setError("La fecha de finalización es obligatoria.");
      return;
    }

    if (fechaFin < fechaInicio) {
      setError("La fecha de finalización no puede ser menor que la fecha de inicio.");
      return;
    }

    const cupoMaximoNumero = Number(cupoMaximo);
    const cupoDisponibleNumero = Number(cupoDisponible);
    const precioEspecialNumero = Number(precioEspecial);

    if (Number.isNaN(cupoMaximoNumero) || cupoMaximoNumero < 0) {
      setError("El cupo máximo debe ser un número válido.");
      return;
    }

    if (Number.isNaN(cupoDisponibleNumero) || cupoDisponibleNumero < 0) {
      setError("El cupo disponible debe ser un número válido.");
      return;
    }

    if (cupoDisponibleNumero > cupoMaximoNumero) {
      setError("El cupo disponible no puede ser mayor que el cupo máximo.");
      return;
    }

    if (Number.isNaN(precioEspecialNumero) || precioEspecialNumero < 0) {
      setError("El precio especial debe ser un número válido.");
      return;
    }

    setGuardando(true);

    const payload = {
      curso_id: cursoId,
      modalidad_id: modalidadId,
      horario_id: horarioId,
      aula_id: aulaId,
      profesor_id: profesorId,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      cupo_maximo: cupoMaximoNumero,
      cupo_disponible: cupoDisponibleNumero,
      precio_especial: precioEspecialNumero,
      estado,
      observacion: observacion.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && programacionEditandoId) {
      const { data, error } = await supabase
        .from("programaciones_cursos")
        .update(payload)
        .eq("id", programacionEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Programación actualizada correctamente.");
        limpiarFormulario();
        await cargarDatos();
      }
    } else {
      const { error } = await supabase
        .from("programaciones_cursos")
        .insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Programación registrada correctamente.");
        limpiarFormulario();
        await cargarDatos();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("programaciones_cursos")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar estado:", error);
      setError(`Error al actualizar estado: ${error.message}`);
    } else {
      setMensaje("Estado de la programación actualizado correctamente.");

      if (programacionEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarDatos();
    }
  }

  const cursosActivos = cursos.filter((item) => item.estado === "Activo");
  const modalidadesActivas = modalidades.filter((item) => item.estado === "Activo");
  const horariosActivos = horarios.filter((item) => item.estado === "Activo");
  const aulasActivas = aulas.filter((item) => item.estado === "Activo");
  const profesoresActivos = profesores.filter((item) => item.estado === "Activo");

  const programacionesFiltradas = programaciones.filter((item) => {
    const texto = busqueda.toLowerCase();

    const nombreCurso = item.cursos?.[0]?.nombre || "";
    const nombreModalidad = item.modalidades?.[0]?.nombre || "";
    const nombreHorario = item.horarios?.[0]?.nombre || "";
    const nombreAula = item.aulas?.[0]?.nombre || "";
    const nombreProfesor = item.profesores?.[0]?.nombre_completo || "";

    const coincideBusqueda =
      nombreCurso.toLowerCase().includes(texto) ||
      nombreModalidad.toLowerCase().includes(texto) ||
      nombreHorario.toLowerCase().includes(texto) ||
      nombreAula.toLowerCase().includes(texto) ||
      nombreProfesor.toLowerCase().includes(texto) ||
      item.estado.toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideCurso =
      filtroCurso === "Todos" || item.curso_id === filtroCurso;

    return coincideBusqueda && coincideEstado && coincideCurso;
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
                Programaciones de cursos
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Programe cursos con modalidad, horario, aula, profesor, fechas,
                cupos y precio.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarDatos}
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
              {estaEditando ? "Editar programación" : "Nueva programación"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos de la programación seleccionada."
                : "Registre una nueva apertura o grupo de curso."}
            </p>

            <form onSubmit={guardarProgramacion} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Curso
                </label>

                <select
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione un curso</option>
                  {cursosActivos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>

                {cursoId && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span>Precio base: {formatearMonto(obtenerPrecioBaseCurso())}</span>
                    <button
                      type="button"
                      onClick={usarPrecioCurso}
                      className="font-semibold text-blue-700 hover:text-blue-900"
                    >
                      Usar precio
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Modalidad
                  </label>

                  <select
                    value={modalidadId}
                    onChange={(e) => setModalidadId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    {modalidadesActivas.map((modalidad) => (
                      <option key={modalidad.id} value={modalidad.id}>
                        {modalidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Horario
                  </label>

                  <select
                    value={horarioId}
                    onChange={(e) => setHorarioId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    {horariosActivos.map((horario) => (
                      <option key={horario.id} value={horario.id}>
                        {horario.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Aula / espacio
                  </label>

                  <select
                    value={aulaId}
                    onChange={(e) => setAulaId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    {aulasActivas.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.nombre} - Cap. {aula.capacidad ?? 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Profesor
                  </label>

                  <select
                    value={profesorId}
                    onChange={(e) => setProfesorId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Seleccione</option>
                    {profesoresActivos.map((profesor) => (
                      <option key={profesor.id} value={profesor.id}>
                        {profesor.nombre_completo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Fecha inicio
                  </label>

                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Fecha fin
                  </label>

                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cupo máximo
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={cupoMaximo}
                    onChange={(e) => setCupoMaximo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cupo disponible
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={cupoDisponible}
                    onChange={(e) => setCupoDisponible(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Precio
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precioEspecial}
                    onChange={(e) => setPrecioEspecial(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
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
                  {estadosProgramacion.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Observación
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Notas internas de la programación"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
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
                    ? "Actualizar programación"
                    : "Guardar programación"}
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
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Listado de programaciones
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Total registradas: {programacionesFiltradas.length}
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar programación"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos los estados</option>
                {estadosProgramacion.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={filtroCurso}
                onChange={(e) => setFiltroCurso(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos los cursos</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Curso</th>
                    <th className="px-3 py-3 font-semibold">Datos</th>
                    <th className="px-3 py-3 font-semibold">Fechas</th>
                    <th className="px-3 py-3 font-semibold">Cupos</th>
                    <th className="px-3 py-3 font-semibold">Precio</th>
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
                        Cargando programaciones...
                      </td>
                    </tr>
                  ) : programacionesFiltradas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay programaciones registradas.
                      </td>
                    </tr>
                  ) : (
                    programacionesFiltradas.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {item.cursos?.[0]?.nombre || "Sin curso"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.modalidades?.[0]?.nombre || "Sin modalidad"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          <p>{item.horarios?.[0]?.nombre || "Sin horario"}</p>
                          <p className="text-xs">
                            Aula: {item.aulas?.[0]?.nombre || "-"}
                          </p>
                          <p className="text-xs">
                            Profesor:{" "}
                            {item.profesores?.[0]?.nombre_completo || "-"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          <p>Inicio: {formatearFecha(item.fecha_inicio)}</p>
                          <p className="text-xs">
                            Fin: {formatearFecha(item.fecha_fin)}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          <p>Máx: {item.cupo_maximo ?? 0}</p>
                          <p className="text-xs">
                            Disp: {item.cupo_disponible ?? 0}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {formatearMonto(item.precio_especial)}
                        </td>

                        <td className="px-3 py-3">
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
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

                            {item.estado !== "Cancelado" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Cancelado")
                                }
                                className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Programado")
                                }
                                className="rounded-lg border border-green-300 px-3 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                              >
                                Reabrir
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