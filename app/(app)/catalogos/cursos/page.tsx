"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type CategoriaCurso = {
  id: string;
  nombre: string;
  estado: string;
};

type Curso = {
  id: string;
  codigo: string | null;
  nombre: string;
  categoria_id: string | null;
  descripcion: string | null;
  duracion: string | null;
  cantidad_horas: number | null;
  precio: number | null;
  permite_beca: boolean | null;
  estado: string;
  created_at: string;
  categorias_cursos?: {
  nombre: string;
   }[] | null;
};

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<CategoriaCurso[]>([]);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [duracion, setDuracion] = useState("");
  const [cantidadHoras, setCantidadHoras] = useState("0");
  const [precio, setPrecio] = useState("0");
  const [permiteBeca, setPermiteBeca] = useState("true");
  const [estado, setEstado] = useState("Activo");

  const [cursoEditandoId, setCursoEditandoId] = useState<string | null>(null);
  const [codigoOriginal, setCodigoOriginal] = useState("");
  const [nombreOriginal, setNombreOriginal] = useState("");
  const [categoriaOriginalId, setCategoriaOriginalId] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroBeca, setFiltroBeca] = useState("Todos");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(cursoEditandoId);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");

    const { data: categoriasData, error: categoriasError } = await supabase
      .from("categorias_cursos")
      .select("id, nombre, estado")
      .order("nombre", { ascending: true });

    if (categoriasError) {
      console.error("Error categorías:", categoriasError);
      setError(`Error al cargar categorías: ${categoriasError.message}`);
      setCategorias([]);
      setLoading(false);
      return;
    }

    setCategorias(categoriasData || []);

    const { data: cursosData, error: cursosError } = await supabase
      .from("cursos")
      .select(
        `
        id,
        codigo,
        nombre,
        categoria_id,
        descripcion,
        duracion,
        cantidad_horas,
        precio,
        permite_beca,
        estado,
        created_at,
        categorias_cursos (
          nombre
        )
      `
      )
      .order("created_at", { ascending: false });

    if (cursosError) {
      console.error("Error cursos:", cursosError);
      setError(`Error al cargar cursos: ${cursosError.message}`);
      setCursos([]);
    } else {
      setCursos(cursosData || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setCodigo("");
    setNombre("");
    setCategoriaId("");
    setDescripcion("");
    setDuracion("");
    setCantidadHoras("0");
    setPrecio("0");
    setPermiteBeca("true");
    setEstado("Activo");

    setCursoEditandoId(null);
    setCodigoOriginal("");
    setNombreOriginal("");
    setCategoriaOriginalId("");
  }

  function iniciarEdicion(curso: Curso) {
    setError("");
    setMensaje("");

    setCursoEditandoId(curso.id);

    setCodigo(curso.codigo || "");
    setCodigoOriginal(curso.codigo || "");

    setNombre(curso.nombre || "");
    setNombreOriginal(curso.nombre || "");

    setCategoriaId(curso.categoria_id || "");
    setCategoriaOriginalId(curso.categoria_id || "");

    setDescripcion(curso.descripcion || "");
    setDuracion(curso.duracion || "");
    setCantidadHoras(String(curso.cantidad_horas ?? 0));
    setPrecio(String(curso.precio ?? 0));
    setPermiteBeca(curso.permite_beca ? "true" : "false");
    setEstado(curso.estado || "Activo");
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarCurso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!codigo.trim()) {
      setError("El código del curso es obligatorio.");
      return;
    }

    if (!nombre.trim()) {
      setError("El nombre del curso es obligatorio.");
      return;
    }

    if (!categoriaId) {
      setError("Debe seleccionar una categoría.");
      return;
    }

    const horasNumero = Number(cantidadHoras);
    const precioNumero = Number(precio);

    if (Number.isNaN(horasNumero) || horasNumero < 0) {
      setError("La cantidad de horas debe ser un número válido.");
      return;
    }

    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número válido.");
      return;
    }

    const codigoLimpio = codigo.trim().toUpperCase();
    const nombreLimpio = nombre.trim();

    const codigoCambio =
      !estaEditando ||
      codigoLimpio.toLowerCase() !== codigoOriginal.trim().toLowerCase();

    if (codigoCambio) {
      const existeCodigo = cursos.some(
        (curso) =>
          (curso.codigo || "").trim().toLowerCase() ===
            codigoLimpio.toLowerCase() && curso.id !== cursoEditandoId
      );

      if (existeCodigo) {
        setError("Ya existe un curso con este código.");
        return;
      }
    }

    const nombreOCategoriaCambio =
      !estaEditando ||
      nombreLimpio.toLowerCase() !== nombreOriginal.trim().toLowerCase() ||
      categoriaId !== categoriaOriginalId;

    if (nombreOCategoriaCambio) {
      const existeNombreMismaCategoria = cursos.some(
        (curso) =>
          curso.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase() &&
          curso.categoria_id === categoriaId &&
          curso.id !== cursoEditandoId
      );

      if (existeNombreMismaCategoria) {
        setError("Ya existe un curso con este nombre en esta categoría.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      codigo: codigoLimpio,
      nombre: nombreLimpio,
      categoria_id: categoriaId,
      descripcion: descripcion.trim() || null,
      duracion: duracion.trim() || null,
      cantidad_horas: horasNumero,
      precio: precioNumero,
      permite_beca: permiteBeca === "true",
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && cursoEditandoId) {
      const { data, error } = await supabase
        .from("cursos")
        .update(payload)
        .eq("id", cursoEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Curso actualizado correctamente.");
        limpiarFormulario();
        await cargarDatos();
      }
    } else {
      const { error } = await supabase.from("cursos").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Curso registrado correctamente.");
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
      .from("cursos")
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
          ? "Curso activado correctamente."
          : "Curso inactivado correctamente."
      );

      if (cursoEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarDatos();
    }
  }

  const categoriasActivas = useMemo(
    () => categorias.filter((cat) => cat.estado === "Activo"),
    [categorias]
  );

  const cursosFiltrados = cursos.filter((curso) => {
    const texto = busqueda.toLowerCase();

    const nombreCategoria = curso.categorias_cursos?.[0]?.nombre || "";

    const coincideBusqueda =
      (curso.codigo || "").toLowerCase().includes(texto) ||
      curso.nombre.toLowerCase().includes(texto) ||
      (curso.descripcion || "").toLowerCase().includes(texto) ||
      nombreCategoria.toLowerCase().includes(texto);

    const coincideCategoria =
      filtroCategoria === "Todas" || curso.categoria_id === filtroCategoria;

    const coincideEstado =
      filtroEstado === "Todos" || curso.estado === filtroEstado;

    const coincideBeca =
      filtroBeca === "Todos" ||
      (filtroBeca === "Si" && curso.permite_beca === true) ||
      (filtroBeca === "No" && curso.permite_beca === false);

    return (
      coincideBusqueda && coincideCategoria && coincideEstado && coincideBeca
    );
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
                Cursos
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre los cursos disponibles para ser ofertados por la
                Fundación.
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
              {estaEditando ? "Editar curso" : "Nuevo curso"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del curso seleccionado."
                : "Registre un curso para luego programarlo con fecha, horario y profesor."}
            </p>

            <form onSubmit={guardarCurso} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Código
                </label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej. TEC-001"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del curso
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Excel Básico"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Categoría
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione una categoría</option>
                  {categoriasActivas.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del curso"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    placeholder="Ej. 4 semanas"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Horas
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={cantidadHoras}
                    onChange={(e) => setCantidadHoras(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Precio RD$
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Permite beca
                  </label>
                  <select
                    value={permiteBeca}
                    onChange={(e) => setPermiteBeca(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
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
                    ? "Actualizar curso"
                    : "Guardar curso"}
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
                  Listado de cursos
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {cursosFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar curso"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100 md:col-span-2"
              />

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todas">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

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
                value={filtroBeca}
                onChange={(e) => setFiltroBeca(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100 md:col-span-2"
              >
                <option value="Todos">Beca: todos</option>
                <option value="Si">Permite beca</option>
                <option value="No">No permite beca</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Código</th>
                    <th className="px-3 py-3 font-semibold">Curso</th>
                    <th className="px-3 py-3 font-semibold">Categoría</th>
                    <th className="px-3 py-3 font-semibold">Horas</th>
                    <th className="px-3 py-3 font-semibold">Precio</th>
                    <th className="px-3 py-3 font-semibold">Beca</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Cargando cursos...
                      </td>
                    </tr>
                  ) : cursosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay cursos registrados.
                      </td>
                    </tr>
                  ) : (
                    cursosFiltrados.map((curso) => (
                      <tr key={curso.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {curso.codigo || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">
                            {curso.nombre}
                          </p>
                          <p className="text-xs text-slate-500">
                            {curso.duracion || "Sin duración"}
                          </p>
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {curso.categorias_cursos?.[0]?.nombre || "Sin categoría"}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {curso.cantidad_horas ?? 0}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          RD${" "}
                          {Number(curso.precio ?? 0).toLocaleString("es-DO", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              curso.permite_beca
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {curso.permite_beca ? "Sí" : "No"}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              curso.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {curso.estado}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(curso)}
                              className="rounded-lg border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              Editar
                            </button>

                            {curso.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(curso.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(curso.id, "Activo")
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