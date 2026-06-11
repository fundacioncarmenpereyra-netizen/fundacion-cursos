"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

export default function CursosMovilPage() {
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
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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
      setError(`Error cargando categorías: ${categoriasError.message}`);
      setCategorias([]);
    } else {
      setCategorias(categoriasData || []);
    }

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
      setError(`Error Supabase: ${cursosError.message}`);
      setCursos([]);
    } else {
      setCursos((cursosData || []) as Curso[]);
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

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
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
    setPermiteBeca(String(Boolean(curso.permite_beca)));
    setEstado(curso.estado || "Activo");
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(false);
  }

  function formatearMonto(valor: number | null | undefined) {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  }

  async function guardarCurso(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del curso es obligatorio.");
      return;
    }

    if (!categoriaId) {
      setError("Debe seleccionar una categoría.");
      return;
    }

    const cantidadHorasNumero = Number(cantidadHoras);
    const precioNumero = Number(precio);

    if (Number.isNaN(cantidadHorasNumero) || cantidadHorasNumero < 0) {
      setError("La cantidad de horas debe ser un número válido.");
      return;
    }

    if (Number.isNaN(precioNumero) || precioNumero < 0) {
      setError("El precio debe ser un número válido.");
      return;
    }

    const codigoLimpio = codigo.trim();
    const nombreLimpio = nombre.trim();

    if (codigoLimpio) {
      const codigoFueCambiado =
        !estaEditando ||
        codigoLimpio.toLowerCase() !== codigoOriginal.trim().toLowerCase();

      if (codigoFueCambiado) {
        const existeCodigo = cursos.some((curso) => {
          return (
            (curso.codigo || "").trim().toLowerCase() ===
              codigoLimpio.toLowerCase() && curso.id !== cursoEditandoId
          );
        });

        if (existeCodigo) {
          setError("Ya existe un curso con este código.");
          return;
        }
      }
    }

    const nombreFueCambiado =
      !estaEditando ||
      nombreLimpio.toLowerCase() !== nombreOriginal.trim().toLowerCase() ||
      categoriaId !== categoriaOriginalId;

    if (nombreFueCambiado) {
      const existeNombreEnCategoria = cursos.some((curso) => {
        return (
          curso.nombre.trim().toLowerCase() === nombreLimpio.toLowerCase() &&
          curso.categoria_id === categoriaId &&
          curso.id !== cursoEditandoId
        );
      });

      if (existeNombreEnCategoria) {
        setError("Ya existe un curso con este nombre en la misma categoría.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      codigo: codigoLimpio || null,
      nombre: nombreLimpio,
      categoria_id: categoriaId || null,
      descripcion: descripcion.trim() || null,
      duracion: duracion.trim() || null,
      cantidad_horas: cantidadHorasNumero,
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
        setMostrarFormulario(false);
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

  const categoriasActivas = categorias.filter(
    (categoria) => categoria.estado === "Activo"
  );

  const cursosFiltrados = cursos.filter((curso) => {
    const texto = busqueda.toLowerCase();

    const nombreCategoria = curso.categorias_cursos?.[0]?.nombre || "";

    const coincideBusqueda =
      curso.nombre.toLowerCase().includes(texto) ||
      (curso.codigo || "").toLowerCase().includes(texto) ||
      (curso.descripcion || "").toLowerCase().includes(texto) ||
      (curso.duracion || "").toLowerCase().includes(texto) ||
      nombreCategoria.toLowerCase().includes(texto);

    const coincideCategoria =
      filtroCategoria === "Todas" || curso.categoria_id === filtroCategoria;

    const coincideEstado =
      filtroEstado === "Todos" || curso.estado === filtroEstado;

    const coincideBeca =
      filtroBeca === "Todos" ||
      (filtroBeca === "Si" && curso.permite_beca) ||
      (filtroBeca === "No" && !curso.permite_beca);

    return (
      coincideBusqueda && coincideCategoria && coincideEstado && coincideBeca
    );
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
              Cursos
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
          Administre los cursos disponibles para inscripción.
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
            + Nuevo curso
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
              {estaEditando ? "Editar curso" : "Nuevo curso"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del curso.
            </p>

            <form onSubmit={guardarCurso} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Código
                </label>

                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej. CUR-001"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre del curso
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Excel Avanzado"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Categoría
                </label>

                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione una categoría</option>
                  {categoriasActivas.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del curso"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Duración
                </label>

                <input
                  type="text"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  placeholder="Ej. 3 meses / 24 horas"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Cantidad de horas
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cantidadHoras}
                    onChange={(e) => setCantidadHoras(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Precio
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Permite beca
                </label>

                <select
                  value={permiteBeca}
                  onChange={(e) => setPermiteBeca(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="true">Sí permite beca</option>
                  <option value="false">No permite beca</option>
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
                    ? "Actualizar curso"
                    : "Guardar curso"}
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
              placeholder="Buscar curso, código o categoría"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todas">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>

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
              value={filtroBeca}
              onChange={(e) => setFiltroBeca(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos</option>
              <option value="Si">Permiten beca</option>
              <option value="No">No permiten beca</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Cursos registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {cursosFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando cursos...
          </div>
        ) : cursosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay cursos registrados.
          </div>
        ) : (
          cursosFiltrados.map((curso) => (
            <article
              key={curso.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                    {curso.codigo || "Sin código"}
                  </p>

                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    {curso.nombre}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {curso.categorias_cursos?.[0]?.nombre || "Sin categoría"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                    curso.estado === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {curso.estado}
                </span>
              </div>

              <p className="mt-3 text-sm leading-5 text-slate-600">
                {curso.descripcion || "Sin descripción"}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Duración
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {curso.duracion || "-"}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Horas
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {curso.cantidad_horas ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Precio
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formatearMonto(curso.precio)}
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-3 ${
                    curso.permite_beca ? "bg-green-50" : "bg-slate-50"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase text-slate-400">
                    Beca
                  </p>
                  <p
                    className={`mt-1 text-sm font-black ${
                      curso.permite_beca ? "text-green-700" : "text-slate-700"
                    }`}
                  >
                    {curso.permite_beca ? "Permite" : "No permite"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(curso)}
                  className="rounded-2xl border border-blue-300 px-4 py-3 text-sm font-black text-blue-700 active:scale-[0.99]"
                >
                  Editar
                </button>

                {curso.estado === "Activo" ? (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(curso.id, "Inactivo")}
                    className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-700 active:scale-[0.99]"
                  >
                    Inactivar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cambiarEstado(curso.id, "Activo")}
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