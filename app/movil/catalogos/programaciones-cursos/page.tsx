"use client";

import Link from "next/link";
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
  estado: string;
};

type Aula = {
  id: string;
  nombre: string;
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
  cursos?: {
    nombre: string;
    precio: number | null;
  }[] | null;
  modalidades?: {
    nombre: string;
  }[] | null;
  horarios?: {
    nombre: string;
    dias: string;
  }[] | null;
  aulas?: {
    nombre: string;
  }[] | null;
  profesores?: {
    nombre_completo: string;
  }[] | null;
};

const estadosProgramacion = [
  "Programado",
  "Abierto",
  "En curso",
  "Finalizado",
  "Suspendido",
  "Cancelado",
];

export default function ProgramacionesCursosMovilPage() {
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

    const { data: cursosData, error: cursosError } = await supabase
      .from("cursos")
      .select("id, nombre, precio, estado")
      .order("nombre", { ascending: true });

    if (cursosError) {
      setError(`Error cargando cursos: ${cursosError.message}`);
      setCursos([]);
    } else {
      setCursos(cursosData || []);
    }

    const { data: modalidadesData, error: modalidadesError } = await supabase
      .from("modalidades")
      .select("id, nombre, estado")
      .order("nombre", { ascending: true });

    if (modalidadesError) {
      setError(`Error cargando modalidades: ${modalidadesError.message}`);
      setModalidades([]);
    } else {
      setModalidades(modalidadesData || []);
    }

    const { data: horariosData, error: horariosError } = await supabase
      .from("horarios")
      .select("id, nombre, dias, estado")
      .order("created_at", { ascending: false });

    if (horariosError) {
      setError(`Error cargando horarios: ${horariosError.message}`);
      setHorarios([]);
    } else {
      setHorarios(horariosData || []);
    }

    const { data: aulasData, error: aulasError } = await supabase
      .from("aulas")
      .select("id, nombre, estado")
      .order("nombre", { ascending: true });

    if (aulasError) {
      setError(`Error cargando aulas: ${aulasError.message}`);
      setAulas([]);
    } else {
      setAulas(aulasData || []);
    }

    const { data: profesoresData, error: profesoresError } = await supabase
      .from("profesores")
      .select("id, nombre_completo, estado")
      .order("nombre_completo", { ascending: true });

    if (profesoresError) {
      setError(`Error cargando profesores: ${profesoresError.message}`);
      setProfesores([]);
    } else {
      setProfesores(profesoresData || []);
    }

    const { data: programacionesData, error: programacionesError } =
      await supabase
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
        .order("created_at", { ascending: false });

    if (programacionesError) {
      console.error("Error programaciones:", programacionesError);
      setError(`Error Supabase: ${programacionesError.message}`);
      setProgramaciones([]);
    } else {
      setProgramaciones((programacionesData || []) as ProgramacionCurso[]);
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

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
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

    setMostrarFormulario(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  function usarPrecioCurso() {
    const cursoSeleccionado = cursos.find((item) => item.id === cursoId);
    setPrecioEspecial(String(cursoSeleccionado?.precio ?? 0));
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  function formatearFecha(valor: string | null) {
    if (!valor) return "-";

    const [year, month, day] = valor.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
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
      setError("Debe indicar la fecha de inicio.");
      return;
    }

    if (!fechaFin) {
      setError("Debe indicar la fecha de fin.");
      return;
    }

    if (fechaFin < fechaInicio) {
      setError("La fecha de fin no puede ser menor que la fecha de inicio.");
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
        setMostrarFormulario(false);
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
        setMostrarFormulario(false);
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
      setMensaje(`Programación actualizada a ${nuevoEstado}.`);

      if (programacionEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarDatos();
    }
  }

  const cursosActivos = cursos.filter((item) => item.estado === "Activo");
  const modalidadesActivas = modalidades.filter(
    (item) => item.estado === "Activo"
  );
  const horariosActivos = horarios.filter((item) => item.estado === "Activo");
  const aulasActivas = aulas.filter((item) => item.estado === "Activo");
  const profesoresActivos = profesores.filter(
    (item) => item.estado === "Activo"
  );

  const programacionesFiltradas = programaciones.filter((item) => {
    const texto = busqueda.toLowerCase();

    const nombreCurso = item.cursos?.[0]?.nombre || "";
    const nombreModalidad = item.modalidades?.[0]?.nombre || "";
    const nombreHorario = item.horarios?.[0]?.nombre || "";
    const diasHorario = item.horarios?.[0]?.dias || "";
    const nombreAula = item.aulas?.[0]?.nombre || "";
    const nombreProfesor = item.profesores?.[0]?.nombre_completo || "";

    const coincideBusqueda =
      nombreCurso.toLowerCase().includes(texto) ||
      nombreModalidad.toLowerCase().includes(texto) ||
      nombreHorario.toLowerCase().includes(texto) ||
      diasHorario.toLowerCase().includes(texto) ||
      nombreAula.toLowerCase().includes(texto) ||
      nombreProfesor.toLowerCase().includes(texto) ||
      (item.observacion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideCurso =
      filtroCurso === "Todos" || item.curso_id === filtroCurso;

    return coincideBusqueda && coincideEstado && coincideCurso;
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
              Programaciones
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
          Administre grupos, fechas, cupos, profesores y precios especiales.
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
            + Nueva programación
          </button>

          <button
            type="button"
            onClick={cargarDatos}
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
              {estaEditando
                ? "Editar programación"
                : "Nueva programación"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete los datos del grupo o apertura del curso.
            </p>

            <form onSubmit={guardarProgramacion} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Curso
                </label>

                <select
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {cursosActivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={usarPrecioCurso}
                className="w-full rounded-2xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700"
              >
                Usar precio del curso seleccionado
              </button>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Modalidad
                </label>

                <select
                  value={modalidadId}
                  onChange={(e) => setModalidadId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {modalidadesActivas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Horario
                </label>

                <select
                  value={horarioId}
                  onChange={(e) => setHorarioId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {horariosActivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Aula / Espacio
                </label>

                <select
                  value={aulaId}
                  onChange={(e) => setAulaId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {aulasActivas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Profesor
                </label>

                <select
                  value={profesorId}
                  onChange={(e) => setProfesorId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {profesoresActivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Fecha inicio
                  </label>

                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Fecha fin
                  </label>

                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cupo máximo
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={cupoMaximo}
                    onChange={(e) => setCupoMaximo(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cupo disponible
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={cupoDisponible}
                    onChange={(e) => setCupoDisponible(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Precio especial
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={precioEspecial}
                  onChange={(e) => setPrecioEspecial(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
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
                  {estadosProgramacion.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Observación
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Observación interna"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
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
                    ? "Actualizar programación"
                    : "Guardar programación"}
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
              placeholder="Buscar curso, profesor, aula o modalidad"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los cursos</option>
              {cursos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los estados</option>
              {estadosProgramacion.map((item) => (
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
            Programaciones registradas
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {programacionesFiltradas.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando programaciones...
          </div>
        ) : programacionesFiltradas.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay programaciones registradas.
          </div>
        ) : (
          programacionesFiltradas.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-black text-slate-900">
                    {item.cursos?.[0]?.nombre || "Sin curso"}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {item.profesores?.[0]?.nombre_completo || "Sin profesor"}
                  </p>

                  <p className="mt-1 text-xs font-bold text-blue-700">
                    {item.modalidades?.[0]?.nombre || "Sin modalidad"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    item.estado === "Abierto"
                      ? "bg-green-100 text-green-700"
                      : item.estado === "Cancelado" ||
                        item.estado === "Suspendido"
                      ? "bg-red-100 text-red-700"
                      : item.estado === "Finalizado"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-blue-100 text-blue-700"
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
                    {formatearFecha(item.fecha_inicio)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Fin
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearFecha(item.fecha_fin)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Cupos
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">
                    {item.cupo_disponible ?? 0} / {item.cupo_maximo ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-green-500">
                    Precio
                  </p>
                  <p className="mt-1 text-sm font-black text-green-900">
                    {formatearMonto(item.precio_especial)}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase text-slate-400">
                  Horario / Aula
                </p>

                <p className="mt-1 text-sm font-black text-slate-900">
                  {item.horarios?.[0]?.nombre || "Sin horario"}
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {item.aulas?.[0]?.nombre || "Sin aula"}
                </p>
              </div>

              {item.observacion && (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                  {item.observacion}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(item)}
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-black text-blue-700 active:scale-[0.99]"
                >
                  Editar
                </button>

                {item.estado === "Cancelado" ? (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(item.id, "Programado")}
                    className="rounded-2xl border border-green-300 px-4 py-3 text-sm font-black text-green-700 active:scale-[0.99]"
                  >
                    Reabrir
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(item.id, "Cancelado")}
                    className="rounded-2xl border border-red-300 px-4 py-3 text-sm font-black text-red-700 active:scale-[0.99]"
                  >
                    Cancelar
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