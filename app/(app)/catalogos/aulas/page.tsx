"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Aula = {
  id: string;
  nombre: string;
  capacidad: number | null;
  ubicacion: string | null;
  tipo_lugar: string | null;
  direccion: string | null;
  sector: string | null;
  municipio: string | null;
  provincia: string | null;
  referencia: string | null;
  estado: string | null;
  created_at: string | null;
};

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [editandoId, setEditandoId] = useState("");

  const [nombre, setNombre] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [tipoLugar, setTipoLugar] = useState("");
  const [direccion, setDireccion] = useState("");
  const [sector, setSector] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [provincia, setProvincia] = useState("");
  const [referencia, setReferencia] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarAulas();
  }, []);

  async function cargarAulas() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("aulas")
      .select(
        `
        id,
        nombre,
        capacidad,
        ubicacion,
        tipo_lugar,
        direccion,
        sector,
        municipio,
        provincia,
        referencia,
        estado,
        created_at
      `
      )
      .order("nombre", { ascending: true });

    if (error) {
      console.error("Error cargando aulas:", error);
      setError(`Error cargando aulas/lugares: ${error.message}`);
      setAulas([]);
    } else {
      setAulas((data || []) as Aula[]);
    }

    setLoading(false);
  }

  function limpiarFormulario() {
    setEditandoId("");
    setNombre("");
    setCapacidad("");
    setUbicacion("");
    setTipoLugar("");
    setDireccion("");
    setSector("");
    setMunicipio("");
    setProvincia("");
    setReferencia("");
    setEstado("Activo");
  }

  function editarAula(aula: Aula) {
    setEditandoId(aula.id);
    setNombre(aula.nombre || "");
    setCapacidad(aula.capacidad ? String(aula.capacidad) : "");
    setUbicacion(aula.ubicacion || "");
    setTipoLugar(aula.tipo_lugar || "");
    setDireccion(aula.direccion || "");
    setSector(aula.sector || "");
    setMunicipio(aula.municipio || "");
    setProvincia(aula.provincia || "");
    setReferencia(aula.referencia || "");
    setEstado(aula.estado || "Activo");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function guardarAula(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!nombre.trim()) {
      setError("El nombre del aula o lugar es obligatorio.");
      return;
    }

    setGuardando(true);

    const payload = {
      nombre: nombre.trim(),
      capacidad: capacidad ? Number(capacidad) : null,
      ubicacion: ubicacion.trim() || null,
      tipo_lugar: tipoLugar.trim() || null,
      direccion: direccion.trim() || null,
      sector: sector.trim() || null,
      municipio: municipio.trim() || null,
      provincia: provincia.trim() || null,
      referencia: referencia.trim() || null,
      estado,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("aulas")
        .update(payload)
        .eq("id", editandoId);

      if (error) {
        console.error("Error actualizando aula:", error);
        setError(`Error actualizando aula/lugar: ${error.message}`);
        setGuardando(false);
        return;
      }

      setMensaje("Aula/lugar actualizado correctamente.");
    } else {
      const { error } = await supabase.from("aulas").insert(payload);

      if (error) {
        console.error("Error creando aula:", error);
        setError(`Error creando aula/lugar: ${error.message}`);
        setGuardando(false);
        return;
      }

      setMensaje("Aula/lugar creado correctamente.");
    }

    limpiarFormulario();
    await cargarAulas();

    setGuardando(false);
  }

  async function cambiarEstado(aula: Aula) {
    const nuevoEstado = aula.estado === "Activo" ? "Inactivo" : "Activo";

    const { error } = await supabase
      .from("aulas")
      .update({
        estado: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", aula.id);

    if (error) {
      console.error("Error cambiando estado:", error);
      setError(`Error cambiando estado: ${error.message}`);
      return;
    }

    setMensaje(`Aula/lugar marcado como ${nuevoEstado}.`);
    await cargarAulas();
  }

  function formatearFecha(valor: string | null) {
    if (!valor) return "-";

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) return valor;

    return fecha.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const aulasFiltradas = aulas.filter((aula) => {
    const texto = busqueda.toLowerCase().trim();

    const cadena = [
      aula.nombre || "",
      aula.ubicacion || "",
      aula.tipo_lugar || "",
      aula.direccion || "",
      aula.sector || "",
      aula.municipio || "",
      aula.provincia || "",
      aula.referencia || "",
      aula.estado || "",
    ]
      .join(" ")
      .toLowerCase();

    return cadena.includes(texto);
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
            Catálogos
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-900">
            Aulas / Lugares
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Registre las aulas, centros o lugares donde se impartirán las
            acciones formativas. Esta información será usada en los reportes de
            INFOTEP.
          </p>
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

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={guardarAula}
            className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-black text-slate-900">
              {editandoId ? "Editar aula/lugar" : "Nueva aula/lugar"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              El nombre será usado como “Lugar a impartirse” en el formulario de
              remitidos INFOTEP.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Nombre del aula o lugar
                </label>

                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ejemplo: Politécnico Las Caobas"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Tipo de lugar
                </label>

                <select
                  value={tipoLugar}
                  onChange={(e) => setTipoLugar(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Seleccione</option>
                  <option value="Aula">Aula</option>
                  <option value="Centro educativo">Centro educativo</option>
                  <option value="Centro comunitario">Centro comunitario</option>
                  <option value="Institución">Institución</option>
                  <option value="Oficina">Oficina</option>
                  <option value="Virtual">Virtual</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Capacidad
                  </label>

                  <input
                    type="number"
                    value={capacidad}
                    onChange={(e) => setCapacidad(e.target.value)}
                    placeholder="Ejemplo: 25"
                    min="0"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
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
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Ubicación interna
                </label>

                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="Ejemplo: 2do nivel, aula 3"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Dirección
                </label>

                <textarea
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección completa del lugar"
                  rows={2}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Sector
                  </label>

                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Ejemplo: Las Caobas"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    Municipio
                  </label>

                  <input
                    type="text"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                    placeholder="Ejemplo: Santo Domingo Oeste"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Provincia
                </label>

                <input
                  type="text"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  placeholder="Ejemplo: Santo Domingo"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Referencia
                </label>

                <textarea
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Referencia para llegar al lugar"
                  rows={2}
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
                  ? "Actualizar aula/lugar"
                  : "Guardar aula/lugar"}
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
                placeholder="Buscar por nombre, dirección, sector, municipio o provincia"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-4">
                <h2 className="text-lg font-black text-slate-900">
                  Listado de aulas/lugares
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Mostrando {aulasFiltradas.length} registros.
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  Cargando aulas/lugares...
                </div>
              ) : aulasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">
                  No hay aulas/lugares registrados.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {aulasFiltradas.map((aula) => (
                    <article key={aula.id} className="p-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${
                                aula.estado === "Activo"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {aula.estado || "Sin estado"}
                            </span>

                            {aula.tipo_lugar && (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                                {aula.tipo_lugar}
                              </span>
                            )}

                            {aula.capacidad !== null &&
                              aula.capacidad !== undefined && (
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                                  Capacidad: {aula.capacidad}
                                </span>
                              )}
                          </div>

                          <h3 className="mt-3 text-xl font-black text-slate-900">
                            {aula.nombre}
                          </h3>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <InfoBox
                              titulo="Ubicación interna"
                              valor={aula.ubicacion || "-"}
                            />

                            <InfoBox
                              titulo="Dirección"
                              valor={aula.direccion || "-"}
                            />

                            <InfoBox
                              titulo="Sector"
                              valor={aula.sector || "-"}
                            />

                            <InfoBox
                              titulo="Municipio"
                              valor={aula.municipio || "-"}
                            />

                            <InfoBox
                              titulo="Provincia"
                              valor={aula.provincia || "-"}
                            />

                            <InfoBox
                              titulo="Creado"
                              valor={formatearFecha(aula.created_at)}
                            />
                          </div>

                          {aula.referencia && (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                              <p className="text-[11px] font-bold uppercase text-slate-400">
                                Referencia
                              </p>
                              <p className="mt-1 text-sm font-black text-slate-900">
                                {aula.referencia}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid min-w-full gap-2 sm:grid-cols-2 xl:min-w-[180px] xl:grid-cols-1">
                          <button
                            type="button"
                            onClick={() => editarAula(aula)}
                            className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-800"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(aula)}
                            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            {aula.estado === "Activo"
                              ? "Desactivar"
                              : "Activar"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
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