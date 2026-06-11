"use client";

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

export default function TiposDocumentosPage() {
  const [tiposDocumentos, setTiposDocumentos] = useState<TipoDocumento[]>([]);

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

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estaEditando = Boolean(documentoEditandoId);

  useEffect(() => {
    cargarTiposDocumentos();
  }, []);

  async function cargarTiposDocumentos() {
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
      setTiposDocumentos([]);
    } else {
      setTiposDocumentos(data || []);
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
  }

  function cancelarEdicion() {
    limpiarFormulario();
    setError("");
    setMensaje("");
  }

  async function guardarTipoDocumento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del tipo de documento es obligatorio.");
      return;
    }

    if (!aplicaMayorEdad && !aplicaMenorEdad) {
      setError("El documento debe aplicar al menos a mayor o menor de edad.");
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
      const existe = tiposDocumentos.some((item) => {
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
        await cargarTiposDocumentos();
      }
    } else {
      const { error } = await supabase.from("tipos_documentos").insert(payload);

      if (error) {
        console.error("Error al guardar:", error);
        setError(`Error al guardar: ${error.message}`);
      } else {
        setMensaje("Tipo de documento registrado correctamente.");
        limpiarFormulario();
        await cargarTiposDocumentos();
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

      await cargarTiposDocumentos();
    }
  }

  const tiposDocumentosFiltrados = tiposDocumentos.filter((item) => {
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
      (filtroObligatorio === "Ambos" &&
        item.obligatorio_mayor_edad &&
        item.obligatorio_menor_edad);

    return coincideBusqueda && coincideEstado && coincideAplica && coincideObligatorio;
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
                Tipos de documentos
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Administre los documentos requeridos para inscripción de
                participantes mayores y menores de edad.
              </p>
            </div>

            <button
              type="button"
              onClick={cargarTiposDocumentos}
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
              {estaEditando
                ? "Editar tipo de documento"
                : "Nuevo tipo de documento"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {estaEditando
                ? "Modifique los datos del documento seleccionado."
                : "Registre un documento requerido o adicional."}
            </p>

            <form onSubmit={guardarTipoDocumento} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre del documento
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Cédula frontal del estudiante"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Descripción
                </label>

                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del documento"
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">
                  Aplica para
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={aplicaMayorEdad}
                      onChange={(e) => {
                        setAplicaMayorEdad(e.target.checked);
                        if (!e.target.checked) {
                          setObligatorioMayorEdad(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Mayor de edad
                  </label>

                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={aplicaMenorEdad}
                      onChange={(e) => {
                        setAplicaMenorEdad(e.target.checked);
                        if (!e.target.checked) {
                          setObligatorioMenorEdad(false);
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Menor de edad
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-800">
                  Obligatorio para
                </p>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={obligatorioMayorEdad}
                      disabled={!aplicaMayorEdad}
                      onChange={(e) =>
                        setObligatorioMayorEdad(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
                    />
                    Mayor de edad
                  </label>

                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={obligatorioMenorEdad}
                      disabled={!aplicaMenorEdad}
                      onChange={(e) =>
                        setObligatorioMenorEdad(e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 disabled:opacity-50"
                    />
                    Menor de edad
                  </label>
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
                    ? "Actualizar documento"
                    : "Guardar documento"}
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
                  Listado de tipos de documentos
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Total registrados: {tiposDocumentosFiltrados.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar documento"
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
                value={filtroAplica}
                onChange={(e) => setFiltroAplica(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Mayor">Aplica mayor</option>
                <option value="Menor">Aplica menor</option>
                <option value="Ambos">Aplica ambos</option>
              </select>

              <select
                value={filtroObligatorio}
                onChange={(e) => setFiltroObligatorio(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              >
                <option value="Todos">Todos</option>
                <option value="Mayor">Obligatorio mayor</option>
                <option value="Menor">Obligatorio menor</option>
                <option value="Ambos">Obligatorio ambos</option>
              </select>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-3 font-semibold">Documento</th>
                    <th className="px-3 py-3 font-semibold">Descripción</th>
                    <th className="px-3 py-3 font-semibold">Aplica</th>
                    <th className="px-3 py-3 font-semibold">Obligatorio</th>
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
                        Cargando tipos de documentos...
                      </td>
                    </tr>
                  ) : tiposDocumentosFiltrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        No hay tipos de documentos registrados.
                      </td>
                    </tr>
                  ) : (
                    tiposDocumentosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50">
                        <td className="px-3 py-3 font-medium text-slate-900">
                          {item.nombre}
                        </td>

                        <td className="px-3 py-3 text-slate-600">
                          {item.descripcion || "Sin descripción"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.aplica_mayor_edad && (
                              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                Mayor
                              </span>
                            )}

                            {item.aplica_menor_edad && (
                              <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                                Menor
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.obligatorio_mayor_edad && (
                              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                                Mayor
                              </span>
                            )}

                            {item.obligatorio_menor_edad && (
                              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                Menor
                              </span>
                            )}

                            {!item.obligatorio_mayor_edad &&
                              !item.obligatorio_menor_edad && (
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                                  Opcional
                                </span>
                              )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.estado === "Activo"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
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

                            {item.estado === "Activo" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Inactivo")
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Inactivar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(item.id, "Activo")
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