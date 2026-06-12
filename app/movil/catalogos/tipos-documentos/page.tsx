"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type TipoDocumento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  aplica_mayor_edad: boolean | null;
  aplica_menor_edad: boolean | null;
  obligatorio_mayor_edad: boolean | null;
  obligatorio_menor_edad: boolean | null;
  estado: string;
  created_at: string;
};

export default function TiposDocumentosMovilPage() {
  const [documentos, setDocumentos] = useState<TipoDocumento[]>([]);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [aplicaMayorEdad, setAplicaMayorEdad] = useState(true);
  const [aplicaMenorEdad, setAplicaMenorEdad] = useState(true);
  const [obligatorioMayorEdad, setObligatorioMayorEdad] = useState(false);
  const [obligatorioMenorEdad, setObligatorioMenorEdad] = useState(false);
  const [estado, setEstado] = useState("Activo");

  const [documentoEditandoId, setDocumentoEditandoId] = useState<string | null>(
    null
  );
  const [nombreOriginal, setNombreOriginal] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroAplica, setFiltroAplica] = useState("Todos");
  const [filtroObligatorio, setFiltroObligatorio] = useState("Todos");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(documentoEditandoId);

  useEffect(() => {
    cargarDocumentos();
  }, []);

  async function cargarDocumentos() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("tipos_documentos")
      .select(
        "id, nombre, descripcion, aplica_mayor_edad, aplica_menor_edad, obligatorio_mayor_edad, obligatorio_menor_edad, estado, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error Supabase:", error);
      setError(`Error Supabase: ${error.message}`);
      setDocumentos([]);
    } else {
      setDocumentos(data || []);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setNombre("");
    setDescripcion("");
    setAplicaMayorEdad(true);
    setAplicaMenorEdad(true);
    setObligatorioMayorEdad(false);
    setObligatorioMenorEdad(false);
    setEstado("Activo");
    setDocumentoEditandoId(null);
    setNombreOriginal("");
  }

  function abrirNuevo() {
    limpiarFormulario();
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  }

  function iniciarEdicion(item: TipoDocumento) {
    setError("");
    setMensaje("");

    setDocumentoEditandoId(item.id);
    setNombre(item.nombre || "");
    setNombreOriginal(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setAplicaMayorEdad(Boolean(item.aplica_mayor_edad));
    setAplicaMenorEdad(Boolean(item.aplica_menor_edad));
    setObligatorioMayorEdad(Boolean(item.obligatorio_mayor_edad));
    setObligatorioMenorEdad(Boolean(item.obligatorio_menor_edad));
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

  async function guardarDocumento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del tipo de documento es obligatorio.");
      return;
    }

    if (!aplicaMayorEdad && !aplicaMenorEdad) {
      setError("El documento debe aplicar al menos para mayor o menor de edad.");
      return;
    }

    if (obligatorioMayorEdad && !aplicaMayorEdad) {
      setError(
        "No puede ser obligatorio para mayor de edad si no aplica para mayor de edad."
      );
      return;
    }

    if (obligatorioMenorEdad && !aplicaMenorEdad) {
      setError(
        "No puede ser obligatorio para menor de edad si no aplica para menor de edad."
      );
      return;
    }

    const nombreLimpio = nombre.trim();
    const nombreNuevoNormalizado = nombreLimpio.toLowerCase();
    const nombreOriginalNormalizado = nombreOriginal.trim().toLowerCase();

    const nombreFueCambiado =
      !estaEditando || nombreNuevoNormalizado !== nombreOriginalNormalizado;

    if (nombreFueCambiado) {
      const existe = documentos.some((item) => {
        return (
          item.nombre.trim().toLowerCase() === nombreNuevoNormalizado &&
          item.id !== documentoEditandoId
        );
      });

      if (existe) {
        setError("Ya existe otro tipo de documento con este nombre.");
        return;
      }
    }

    setGuardando(true);

    const payload = {
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || null,
      aplica_mayor_edad: aplicaMayorEdad,
      aplica_menor_edad: aplicaMenorEdad,
      obligatorio_mayor_edad: obligatorioMayorEdad,
      obligatorio_menor_edad: obligatorioMenorEdad,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (estaEditando && documentoEditandoId) {
      const { data, error } = await supabase
        .from("tipos_documentos")
        .update(payload)
        .eq("id", documentoEditandoId)
        .select("id");

      if (error) {
        console.error("Error al actualizar:", error);
        setError(`Error al actualizar: ${error.message}`);
      } else if (!data || data.length === 0) {
        setError(
          "No se actualizó ningún registro. Verifique las políticas RLS de actualización en Supabase."
        );
      } else {
        setMensaje("Tipo de documento actualizado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarDocumentos();
      }
    } else {
      const { error } = await supabase.from("tipos_documentos").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Tipo de documento registrado correctamente.");
        limpiarFormulario();
        setMostrarFormulario(false);
        await cargarDocumentos();
      }
    }

    setGuardando(false);
  }

  async function cambiarEstado(id: string, nuevoEstado: string) {
    setError("");
    setMensaje("");

    const { error } = await supabase
      .from("tipos_documentos")
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
          ? "Tipo de documento activado correctamente."
          : "Tipo de documento inactivado correctamente."
      );

      if (documentoEditandoId === id) {
        setEstado(nuevoEstado);
      }

      await cargarDocumentos();
    }
  }

  const documentosFiltrados = documentos.filter((item) => {
    const texto = busqueda.toLowerCase();

    const coincideBusqueda =
      item.nombre.toLowerCase().includes(texto) ||
      (item.descripcion || "").toLowerCase().includes(texto);

    const coincideEstado =
      filtroEstado === "Todos" || item.estado === filtroEstado;

    const coincideAplica =
      filtroAplica === "Todos" ||
      (filtroAplica === "Mayor" && item.aplica_mayor_edad) ||
      (filtroAplica === "Menor" && item.aplica_menor_edad) ||
      (filtroAplica === "Ambos" &&
        item.aplica_mayor_edad &&
        item.aplica_menor_edad);

    const coincideObligatorio =
      filtroObligatorio === "Todos" ||
      (filtroObligatorio === "Mayor" && item.obligatorio_mayor_edad) ||
      (filtroObligatorio === "Menor" && item.obligatorio_menor_edad) ||
      (filtroObligatorio === "Alguno" &&
        (item.obligatorio_mayor_edad || item.obligatorio_menor_edad));

    return coincideBusqueda && coincideEstado && coincideAplica && coincideObligatorio;
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
              Tipos de documentos
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
          Administre documentos requeridos para inscripción de participantes.
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
            + Nuevo documento
          </button>

          <button
            type="button"
            onClick={cargarDocumentos}
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
                ? "Editar tipo de documento"
                : "Nuevo tipo de documento"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete la información del documento.
            </p>

            <form onSubmit={guardarDocumento} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Foto del estudiante"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del documento"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">
                  Aplica para
                </p>

                <div className="mt-3 space-y-3">
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={aplicaMayorEdad}
                      onChange={(e) => {
                        setAplicaMayorEdad(e.target.checked);
                        if (!e.target.checked) {
                          setObligatorioMayorEdad(false);
                        }
                      }}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    Mayor de edad
                  </label>

                  <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={aplicaMenorEdad}
                      onChange={(e) => {
                        setAplicaMenorEdad(e.target.checked);
                        if (!e.target.checked) {
                          setObligatorioMenorEdad(false);
                        }
                      }}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    Menor de edad
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">
                  Documento obligatorio
                </p>

                <div className="mt-3 space-y-3">
                  <label
                    className={`flex items-center gap-3 text-sm font-bold ${
                      aplicaMayorEdad ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={obligatorioMayorEdad}
                      disabled={!aplicaMayorEdad}
                      onChange={(e) => setObligatorioMayorEdad(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    Obligatorio para mayor de edad
                  </label>

                  <label
                    className={`flex items-center gap-3 text-sm font-bold ${
                      aplicaMenorEdad ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={obligatorioMenorEdad}
                      disabled={!aplicaMenorEdad}
                      onChange={(e) => setObligatorioMenorEdad(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300"
                    />
                    Obligatorio para menor de edad
                  </label>
                </div>
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
                    ? "Actualizar documento"
                    : "Guardar documento"}
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
              placeholder="Buscar documento"
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
              value={filtroAplica}
              onChange={(e) => setFiltroAplica(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Aplica a todos</option>
              <option value="Mayor">Aplica mayor edad</option>
              <option value="Menor">Aplica menor edad</option>
              <option value="Ambos">Aplica mayor y menor</option>
            </select>

            <select
              value={filtroObligatorio}
              onChange={(e) => setFiltroObligatorio(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="Todos">Todos los documentos</option>
              <option value="Mayor">Obligatorio mayor edad</option>
              <option value="Menor">Obligatorio menor edad</option>
              <option value="Alguno">Obligatorio en algún caso</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Documentos registrados
          </h2>

          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
            {documentosFiltrados.length}
          </span>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando tipos de documentos...
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            No hay tipos de documentos registrados.
          </div>
        ) : (
          documentosFiltrados.map((item) => (
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
                    {item.descripcion || "Sin descripción"}
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
                <div className="rounded-2xl bg-blue-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-blue-500">
                    Aplica para
                  </p>

                  <p className="mt-1 text-sm font-black text-blue-900">
                    {item.aplica_mayor_edad && item.aplica_menor_edad
                      ? "Mayor y menor de edad"
                      : item.aplica_mayor_edad
                      ? "Mayor de edad"
                      : item.aplica_menor_edad
                      ? "Menor de edad"
                      : "No definido"}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-amber-500">
                    Obligatorio
                  </p>

                  <p className="mt-1 text-sm font-black text-amber-900">
                    {item.obligatorio_mayor_edad &&
                    item.obligatorio_menor_edad
                      ? "Mayor y menor de edad"
                      : item.obligatorio_mayor_edad
                      ? "Mayor de edad"
                      : item.obligatorio_menor_edad
                      ? "Menor de edad"
                      : "No obligatorio"}
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