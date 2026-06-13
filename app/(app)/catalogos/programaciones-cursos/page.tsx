"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CatalogoSimple = {
  id: string;
  nombre: string;
};

type Profesor = {
  id: string;
  nombre_completo: string;
};

type Programacion = {
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
  estrategia_formacion: string | null;
  nivel_certificacion: string | null;
  asesor_responsable: string | null;
  estado: string | null;
  observacion: string | null;
  created_at: string | null;
  cursos:
    | {
        nombre: string;
        codigo: string | null;
      }
    | {
        nombre: string;
        codigo: string | null;
      }[]
    | null;
  modalidades:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
  horarios:
    | {
        nombre: string;
        dias: string | null;
      }
    | {
        nombre: string;
        dias: string | null;
      }[]
    | null;
  aulas:
    | {
        nombre: string;
      }
    | {
        nombre: string;
      }[]
    | null;
  profesores:
    | {
        nombre_completo: string;
      }
    | {
        nombre_completo: string;
      }[]
    | null;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function ProgramacionesCursosPage() {
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [cursos, setCursos] = useState<CatalogoSimple[]>([]);
  const [modalidades, setModalidades] = useState<CatalogoSimple[]>([]);
  const [horarios, setHorarios] = useState<CatalogoSimple[]>([]);
  const [aulas, setAulas] = useState<CatalogoSimple[]>([]);
  const [profesores, setProfesores] = useState<Profesor[]>([]);

  const [editandoId, setEditandoId] = useState("");

  const [cursoId, setCursoId] = useState("");
  const [modalidadId, setModalidadId] = useState("");
  const [horarioId, setHorarioId] = useState("");
  const [aulaId, setAulaId] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [cupoMaximo, setCupoMaximo] = useState("");
  const [cupoDisponible, setCupoDisponible] = useState("");
  const [precioEspecial, setPrecioEspecial] = useState("");
  const [estrategiaFormacion, setEstrategiaFormacion] = useState("");
  const [nivelCertificacion, setNivelCertificacion] = useState("");
  const [asesorResponsable, setAsesorResponsable] = useState("");
  const [estado, setEstado] = useState("Abierto");
  const [observacion, setObservacion] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");

    await Promise.all([
      cargarCatalogos(),
      cargarProgramaciones(),
    ]);

    setLoading(false);
  }

  async function cargarCatalogos() {
    const { data: cursosData } = await supabase
      .from("cursos")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setCursos((cursosData || []) as CatalogoSimple[]);

    const { data: modalidadesData } = await supabase
      .from("modalidades")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setModalidades((modalidadesData || []) as CatalogoSimple[]);

    const { data: horariosData } = await supabase
      .from("horarios")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setHorarios((horariosData || []) as CatalogoSimple[]);

    const { data: aulasData } = await supabase
      .from("aulas")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setAulas((aulasData || []) as CatalogoSimple[]);

    const { data: profesoresData } = await supabase
      .from("profesores")
      .select("id, nombre_completo")
      .eq("estado", "Activo")
      .order("nombre_completo", { ascending: true });

    setProfesores((profesoresData || []) as Profesor[]);
  }

  async function cargarProgramaciones() {
    const { data, error } = await supabase
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
        estrategia_formacion,
        nivel_certificacion,
        asesor_responsable,
        estado,
        observacion,
        created_at,
        cursos (
          nombre,
          codigo
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
      .order("fecha_inicio", { ascending: false });

    if (error) {
      console.error("Error cargando programaciones:", error);
      setError(`Error cargando programaciones: ${error.message}`);
      setProgramaciones([]);
    } else {
      setProgramaciones((data || []) as Programacion[]);
    }
  }

  function limpiarFormulario() {
    setEditandoId("");
    setCursoId("");
    setModalidadId("");
    setHorarioId("");
    setAulaId("");
    setProfesorId("");
    setFechaInicio("");
    setFechaFin("");
    setCupoMaximo("");
    setCupoDisponible("");
    setPrecioEspecial("");
    setEstrategiaFormacion("");
    setNivelCertificacion("");
    setAsesorResponsable("");
    setEstado("Abierto");
    setObservacion("");
  }

  function editarProgramacion(item: Programacion) {
    setEditandoId(item.id);
    setCursoId(item.curso_id || "");
    setModalidadId(item.modalidad_id || "");
    setHorarioId(item.horario_id || "");
    setAulaId(item.aula_id || "");
    setProfesorId(item.profesor_id || "");
    setFechaInicio(item.fecha_inicio || "");
    setFechaFin(item.fecha_fin || "");
    setCupoMaximo(item.cupo_maximo !== null ? String(item.cupo_maximo) : "");
    setCupoDisponible(
      item.cupo_disponible !== null ? String(item.cupo_disponible) : ""
    );
    setPrecioEspecial(
      item.precio_especial !== null ? String(item.precio_especial) : ""
    );
    setEstrategiaFormacion(item.estrategia_formacion || "");
    setNivelCertificacion(item.nivel_certificacion || "");
    setAsesorResponsable(item.asesor_responsable || "");
    setEstado(item.estado || "Abierto");
    setObservacion(item.observacion || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function guardarProgramacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!cursoId) {
      setError("Debe seleccionar el curso.");
      return;
    }

    if (!modalidadId) {
      setError("Debe seleccionar la modalidad.");
      return;
    }

    if (!horarioId) {
      setError("Debe seleccionar el horario.");
      return;
    }

    if (!aulaId) {
      setError("Debe seleccionar el aula o lugar.");
      return;
    }

    if (!profesorId) {
      setError("Debe seleccionar el facilitador/profesor.");
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

    if (!cupoMaximo || Number(cupoMaximo) <= 0) {
      setError("Debe indicar el cupo máximo.");
      return;
    }

    const disponible = cupoDisponible || cupoMaximo;

    if (Number(disponible) > Number(cupoMaximo)) {
      setError("El cupo disponible no puede ser mayor al cupo máximo.");
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
      cupo_maximo: Number(cupoMaximo),
      cupo_disponible: Number(disponible),
      precio_especial: precioEspecial ? Number(precioEspecial) : null,
      estrategia_formacion: estrategiaFormacion.trim() || null,
      nivel_certificacion: nivelCertificacion.trim() || null,
      asesor_responsable: asesorResponsable.trim() || null,
      estado,
      observacion: observacion.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("programaciones_cursos")
        .update(payload)
        .eq("id", editandoId);

      if (error) {
        console.error("Error actualizando:", error);
        setError(`Error actualizando programación: ${error.message}`);
        setGuardando(false);
        return;
      }

      setMensaje("Programación actualizada correctamente.");
    } else {
      const { error } = await supabase
        .from("programaciones_cursos")
        .insert(payload);

      if (error) {
        console.error("Error creando:", error);
        setError(`Error creando programación: ${error.message}`);
        setGuardando(false);
        return;
      }

      setMensaje("Programación creada correctamente.");
    }

    limpiarFormulario();
    await cargarProgramaciones();

    setGuardando(false);
  }

  async function cambiarEstado(item: Programacion) {
    const nuevoEstado = item.estado === "Activo" || item.estado === "Abierto"
      ? "Cerrado"
      : "Abierto";

    const { error } = await supabase
      .from("programaciones_cursos")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      console.error("Error cambiando estado:", error);
      setError(`Error cambiando estado: ${error.message}`);
      return;
    }

    setMensaje(`Programación marcada como ${nuevoEstado}.`);
    await cargarProgramaciones();
  }

  function formatearFecha(valor: string | null | undefined) {
    if (!valor) return "-";

    const fechaSolo = valor.includes("T") ? valor.split("T")[0] : valor;
    const [year, month, day] = fechaSolo.split("-");

    if (!year || !month || !day) return valor;

    return `${day}/${month}/${year}`;
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  const programacionesFiltradas = programaciones.filter((item) => {
    const texto = busqueda.toLowerCase().trim();

    const curso = obtenerPrimero(item.cursos);
    const modalidad = obtenerPrimero(item.modalidades);
    const horario = obtenerPrimero(item.horarios);
    const aula = obtenerPrimero(item.aulas);
    const profesor = obtenerPrimero(item.profesores);

    const cadena = [
      curso?.codigo || "",
      curso?.nombre || "",
      modalidad?.nombre || "",
      horario?.nombre || "",
      horario?.dias || "",
      aula?.nombre || "",
      profesor?.nombre_completo || "",
      item.estrategia_formacion || "",
      item.nivel_certificacion || "",
      item.asesor_responsable || "",
      item.estado || "",
    ]
      .join(" ")
      .toLowerCase();

    return cadena.includes(texto);
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Catálogos
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Programaciones de cursos
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Registre la programación del curso y los datos requeridos para los
              remitidos de INFOTEP.
            </p>
          </div>

          <Link
            href="/catalogos"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Volver a catálogos
          </Link>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
          <form
            onSubmit={guardarProgramacion}
            className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-black text-slate-900">
              {editandoId ? "Editar programación" : "Nueva programación"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Los campos de INFOTEP se usarán para generar el reporte de
              remitidos.
            </p>

            <div className="mt-5 space-y-4">
              <CampoSelect
                label="Curso"
                value={cursoId}
                onChange={setCursoId}
                opciones={cursos.map((item) => ({
                  id: item.id,
                  nombre: item.nombre,
                }))}
              />

              <CampoSelect
                label="Modalidad / Vía de formación"
                value={modalidadId}
                onChange={setModalidadId}
                opciones={modalidades}
              />

              <CampoSelect
                label="Horario"
                value={horarioId}
                onChange={setHorarioId}
                opciones={horarios}
              />

              <CampoSelect
                label="Aula / Lugar a impartirse"
                value={aulaId}
                onChange={setAulaId}
                opciones={aulas}
              />

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Facilitador(a) / Profesor
                </label>

                <select
                  value={profesorId}
                  onChange={(e) => setProfesorId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  {profesores.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Fecha inicio
                  </label>

                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
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
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cupo máximo
                  </label>

                  <input
                    type="number"
                    value={cupoMaximo}
                    onChange={(e) => setCupoMaximo(e.target.value)}
                    placeholder="Ejemplo: 25"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cupo disponible
                  </label>

                  <input
                    type="number"
                    value={cupoDisponible}
                    onChange={(e) => setCupoDisponible(e.target.value)}
                    placeholder="Si se deja vacío usa el cupo máximo"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Precio especial
                </label>

                <input
                  type="number"
                  value={precioEspecial}
                  onChange={(e) => setPrecioEspecial(e.target.value)}
                  placeholder="Opcional"
                  min="0"
                  step="0.01"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                <h3 className="text-base font-black text-blue-950">
                  Datos para INFOTEP
                </h3>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-bold text-blue-900">
                      Estrategia de formación
                    </label>

                    <input
                      type="text"
                      value={estrategiaFormacion}
                      onChange={(e) => setEstrategiaFormacion(e.target.value)}
                      placeholder="Ejemplo: Habilitación"
                      className="w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-blue-900">
                      Nivel de certificación
                    </label>

                    <input
                      type="text"
                      value={nivelCertificacion}
                      onChange={(e) => setNivelCertificacion(e.target.value)}
                      placeholder="Ejemplo: Auxiliar"
                      className="w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-bold text-blue-900">
                      Asesor/a responsable
                    </label>

                    <input
                      type="text"
                      value={asesorResponsable}
                      onChange={(e) => setAsesorResponsable(e.target.value)}
                      placeholder="Nombre del asesor responsable"
                      className="w-full rounded-2xl border border-blue-200 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Estado
                </label>

                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Abierto">Abierto</option>
                  <option value="Programado">Programado</option>
                  <option value="Cerrado">Cerrado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Observación
                </label>

                <textarea
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  rows={3}
                  placeholder="Observación general de la programación"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-sm font-black text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
              >
                {guardando
                  ? "Guardando..."
                  : editandoId
                  ? "Actualizar programación"
                  : "Guardar programación"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Buscar
              </label>

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por curso, código, profesor, lugar, estrategia o asesor"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-lg font-black text-slate-900">
                  Listado de programaciones
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Mostrando {programacionesFiltradas.length} registros.
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  Cargando programaciones...
                </div>
              ) : programacionesFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  No hay programaciones registradas.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {programacionesFiltradas.map((item) => {
                    const curso = obtenerPrimero(item.cursos);
                    const modalidad = obtenerPrimero(item.modalidades);
                    const horario = obtenerPrimero(item.horarios);
                    const aula = obtenerPrimero(item.aulas);
                    const profesor = obtenerPrimero(item.profesores);

                    return (
                      <article key={item.id} className="p-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                                {item.estado || "Sin estado"}
                              </span>

                              {curso?.codigo && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                  Código: {curso.codigo}
                                </span>
                              )}

                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                                {modalidad?.nombre || "Modalidad"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black text-slate-900">
                              {curso?.nombre || "Curso sin nombre"}
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              Facilitador(a):{" "}
                              {profesor?.nombre_completo || "-"}
                            </p>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <InfoBox
                                titulo="Inicio"
                                valor={formatearFecha(item.fecha_inicio)}
                              />
                              <InfoBox
                                titulo="Fin"
                                valor={formatearFecha(item.fecha_fin)}
                              />
                              <InfoBox
                                titulo="Horario"
                                valor={horario?.nombre || "-"}
                              />
                              <InfoBox
                                titulo="Días"
                                valor={horario?.dias || "-"}
                              />
                              <InfoBox
                                titulo="Lugar"
                                valor={aula?.nombre || "-"}
                              />
                              <InfoBox
                                titulo="Precio especial"
                                valor={formatearMonto(item.precio_especial)}
                              />
                              <InfoBox
                                titulo="Cupo máximo"
                                valor={String(item.cupo_maximo ?? "-")}
                              />
                              <InfoBox
                                titulo="Cupo disponible"
                                valor={String(item.cupo_disponible ?? "-")}
                              />
                              <InfoBox
                                titulo="Asesor responsable"
                                valor={item.asesor_responsable || "-"}
                              />
                            </div>

                            <div className="mt-3 rounded-2xl bg-blue-50 p-3">
                              <p className="text-[11px] font-bold uppercase text-blue-500">
                                Datos INFOTEP
                              </p>

                              <p className="mt-1 text-sm font-black text-blue-950">
                                Estrategia:{" "}
                                {item.estrategia_formacion || "-"} · Nivel:{" "}
                                {item.nivel_certificacion || "-"}
                              </p>
                            </div>

                            {item.observacion && (
                              <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                                <p className="text-[11px] font-bold uppercase text-slate-400">
                                  Observación
                                </p>
                                <p className="mt-1 text-sm font-black text-slate-900">
                                  {item.observacion}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid min-w-full gap-2 sm:grid-cols-2 xl:min-w-[180px] xl:grid-cols-1">
                            <button
                              type="button"
                              onClick={() => editarProgramacion(item)}
                              className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => cambiarEstado(item)}
                              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                            >
                              Cambiar estado
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  opciones,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opciones: { id: string; nombre: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">Seleccione</option>
        {opciones.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoBox({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">
        {titulo}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">
        {valor}
      </p>
    </div>
  );
}