"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type RelacionCurso =
  | {
      nombre: string;
      descripcion: string | null;
      precio: number | null;
    }
  | {
      nombre: string;
      descripcion: string | null;
      precio: number | null;
    }[]
  | null;

type RelacionNombre =
  | {
      nombre: string;
    }
  | {
      nombre: string;
    }[]
  | null;

type ProgramacionCurso = {
  id: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  cupo_disponible: number | null;
  precio_especial: number | null;
  estado: string;
  cursos: RelacionCurso;
  modalidades: RelacionNombre;
  horarios: RelacionNombre;
};

type CatalogoSimple = {
  id: string;
  nombre: string;
};

function obtenerPrimero<T>(valor: T | T[] | null | undefined): T | null {
  if (!valor) return null;
  if (Array.isArray(valor)) return valor[0] || null;
  return valor;
}

export default function InscripcionMovilPage() {
  const [programacionId, setProgramacionId] = useState("");
  const [programacion, setProgramacion] = useState<ProgramacionCurso | null>(
    null
  );

  const [condiciones, setCondiciones] = useState<CatalogoSimple[]>([]);
  const [metodosPago, setMetodosPago] = useState<CatalogoSimple[]>([]);
  const [tiposBeca, setTiposBeca] = useState<CatalogoSimple[]>([]);
  const [estadoRecibidaId, setEstadoRecibidaId] = useState("");

  const [nombreCompleto, setNombreCompleto] = useState("");
  const [cedula, setCedula] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [tshirtTalla, setTshirtTalla] = useState("");

  const [nombreTutor, setNombreTutor] = useState("");
  const [telefonoTutor, setTelefonoTutor] = useState("");
  const [cedulaTutor, setCedulaTutor] = useState("");

  const [condicionId, setCondicionId] = useState("");
  const [metodoPagoId, setMetodoPagoId] = useState("");
  const [tipoBecaId, setTipoBecaId] = useState("");
  const [observacion, setObservacion] = useState("");

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("programacion") || "";
    setProgramacionId(id);

    if (id) {
      cargarDatos(id);
    } else {
      setError("No se recibió la programación del curso.");
    }
  }, []);

  async function cargarDatos(id: string) {
    setLoading(true);
    setError("");

    const { data: programacionData, error: programacionError } = await supabase
      .from("programaciones_cursos")
      .select(
        `
        id,
        fecha_inicio,
        fecha_fin,
        cupo_disponible,
        precio_especial,
        estado,
        cursos (
          nombre,
          descripcion,
          precio
        ),
        modalidades (
          nombre
        ),
        horarios (
          nombre
        )
      `
      )
      .eq("id", id)
      .single();

    if (programacionError) {
      console.error("Error programación:", programacionError);
      setError(`Error cargando el curso: ${programacionError.message}`);
      setProgramacion(null);
    } else {
      setProgramacion(programacionData as ProgramacionCurso);
    }

    const { data: condicionesData } = await supabase
      .from("condiciones_participante")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setCondiciones(condicionesData || []);

    const condicionRegular = (condicionesData || []).find(
      (item) => item.nombre.toLowerCase() === "regular"
    );

    if (condicionRegular) {
      setCondicionId(condicionRegular.id);
    }

    const { data: metodosData } = await supabase
      .from("metodos_pago")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setMetodosPago(metodosData || []);

    const { data: becasData } = await supabase
      .from("tipos_beca")
      .select("id, nombre")
      .eq("estado", "Activo")
      .order("nombre", { ascending: true });

    setTiposBeca(becasData || []);

    const { data: estadoData } = await supabase
      .from("estados_inscripcion")
      .select("id, nombre")
      .eq("estado", "Activo")
      .ilike("nombre", "Recibida")
      .limit(1)
      .maybeSingle();

    if (estadoData?.id) {
      setEstadoRecibidaId(estadoData.id);
    }

    setLoading(false);
  }

  function calcularEdad(fecha: string) {
    if (!fecha) return 0;

    const nacimiento = new Date(fecha);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  function generarCodigoInscripcion() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);

    return `INS-${year}-${random}`;
  }

  function generarQrToken() {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    const time = fecha.getTime();

    return `QR-${year}-${random}-${time}`;
  }

  function formatearFecha(valor: string | null) {
    if (!valor) return "-";

    const [year, month, day] = valor.split("-");

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

  async function guardarInscripcion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!programacionId) {
      setError("No se encontró la programación del curso.");
      return;
    }

    if (!nombreCompleto.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }

    if (!fechaNacimiento) {
      setError("La fecha de nacimiento es obligatoria.");
      return;
    }

    if (!telefono.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }

    if (!tshirtTalla) {
      setError("Debe seleccionar el tamaño de T-shirt.");
      return;
    }

    const edad = calcularEdad(fechaNacimiento);
    const esMenorEdad = edad < 18;

    if (esMenorEdad) {
      if (!nombreTutor.trim()) {
        setError("Para menores de edad debe indicar el nombre del tutor.");
        return;
      }

      if (!telefonoTutor.trim()) {
        setError("Para menores de edad debe indicar el teléfono del tutor.");
        return;
      }
    }

    setGuardando(true);

    const participantePayload = {
      nombre_completo: nombreCompleto.trim(),
      cedula: cedula.trim() || null,
      fecha_nacimiento: fechaNacimiento,
      sexo: sexo || null,
      telefono: telefono.trim(),
      whatsapp: whatsapp.trim() || null,
      correo: correo.trim() || null,
      direccion: direccion.trim() || null,
      tshirt_talla: tshirtTalla || null,
      es_menor_edad: esMenorEdad,
      nombre_tutor: esMenorEdad ? nombreTutor.trim() : null,
      telefono_tutor: esMenorEdad ? telefonoTutor.trim() : null,
      cedula_tutor: esMenorEdad ? cedulaTutor.trim() || null : null,
      estado: "Activo",
      updated_at: new Date().toISOString(),
    };

    const { data: participanteData, error: participanteError } = await supabase
      .from("participantes")
      .insert(participantePayload)
      .select("id")
      .single();

    if (participanteError || !participanteData?.id) {
      console.error("Error participante:", participanteError);
      setError(
        `Error registrando participante: ${
          participanteError?.message || "No se recibió el ID del participante."
        }`
      );
      setGuardando(false);
      return;
    }

    const codigoInscripcion = generarCodigoInscripcion();
    const qrToken = generarQrToken();
    const qrUrl = `${window.location.origin}/movil/qr/${qrToken}`;

    const inscripcionPayload = {
      participante_id: participanteData.id,
      programacion_id: programacionId,
      estado_inscripcion_id: estadoRecibidaId || null,
      condicion_participante_id: condicionId || null,
      metodo_pago_id: metodoPagoId || null,
      tipo_beca_id: tipoBecaId || null,
      codigo_inscripcion: codigoInscripcion,
      qr_token: qrToken,
      qr_url: qrUrl,
      qr_generado: true,
      fecha_qr_generado: new Date().toISOString(),
      observacion: observacion.trim() || null,
      estado: "Activa",
      updated_at: new Date().toISOString(),
    };

    const { error: inscripcionError } = await supabase
      .from("inscripciones")
      .insert(inscripcionPayload);

    if (inscripcionError) {
      console.error("Error inscripción:", inscripcionError);
      setError(`Error registrando inscripción: ${inscripcionError.message}`);
      setGuardando(false);
      return;
    }

    setMensaje(
      `Inscripción registrada correctamente. Código: ${codigoInscripcion}`
    );

    setNombreCompleto("");
    setCedula("");
    setFechaNacimiento("");
    setSexo("");
    setTelefono("");
    setWhatsapp("");
    setCorreo("");
    setDireccion("");
    setTshirtTalla("");
    setNombreTutor("");
    setTelefonoTutor("");
    setCedulaTutor("");
    setMetodoPagoId("");
    setTipoBecaId("");
    setObservacion("");

    window.location.href = `/movil/inscripcion/confirmacion?codigo=${codigoInscripcion}`;

    setGuardando(false);
  }

  const curso = obtenerPrimero(programacion?.cursos);
  const modalidad = obtenerPrimero(programacion?.modalidades);
  const horario = obtenerPrimero(programacion?.horarios);

  const edadCalculada = calcularEdad(fechaNacimiento);
  const esMenorEdad = fechaNacimiento ? edadCalculada < 18 : false;

  return (
    <main className="min-h-screen bg-slate-100 pb-24">
      <section className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
              Fundación Dra. Carmen Pereyra
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-900">
              Inscripción
            </h1>
          </div>

          <Link
            href="/movil/inicio"
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700"
          >
            Cursos
          </Link>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Complete sus datos para solicitar la inscripción.
        </p>
      </section>

      <section className="space-y-3 px-4 py-4">
        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
            Cargando información del curso...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {mensaje}
          </div>
        )}

        {programacion && (
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">
              Curso seleccionado
            </p>

            <h2 className="mt-1 text-lg font-black text-blue-950">
              {curso?.nombre || "Curso sin nombre"}
            </h2>

            <p className="mt-1 text-sm leading-5 text-blue-800">
              {curso?.descripcion || "Sin descripción"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Inicio
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearFecha(programacion.fecha_inicio)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Fin
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearFecha(programacion.fecha_fin)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Modalidad
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {modalidad?.nombre || "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/70 p-3">
                <p className="text-[11px] font-bold uppercase text-blue-500">
                  Costo
                </p>
                <p className="mt-1 text-sm font-black text-blue-950">
                  {formatearMonto(
                    programacion.precio_especial &&
                      programacion.precio_especial > 0
                      ? programacion.precio_especial
                      : curso?.precio
                  )}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm font-bold text-blue-900">
              Horario: {horario?.nombre || "-"}
            </p>
          </div>
        )}
      </section>

      <section className="px-4">
        <form
          onSubmit={guardarInscripcion}
          className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Datos del participante
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Complete las informaciones básicas del estudiante.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Nombre completo
            </label>

            <input
              type="text"
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Nombre completo"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Cédula
            </label>

            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Cédula si aplica"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Fecha de nacimiento
            </label>

            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />

            {fechaNacimiento && (
              <p className="mt-2 text-xs font-bold text-slate-500">
                Edad calculada: {edadCalculada} años
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Sexo
            </label>

            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Seleccione</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Teléfono
            </label>

            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              WhatsApp
            </label>

            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Correo
            </label>

            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Dirección
            </label>

            <textarea
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Tamaño de T-shirt
            </label>

            <select
              value={tshirtTalla}
              onChange={(e) => setTshirtTalla(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Seleccione</option>
              <option value="S">S - Small / Pequeña</option>
              <option value="M">M - Medium / Mediana</option>
              <option value="L">L - Large / Grande</option>
              <option value="XL">XL - Extra Large</option>
              <option value="XXL">XXL - Doble Extra Large</option>
            </select>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              Seleccione la talla de T-shirt del participante.
            </p>
          </div>

          {esMenorEdad && (
            <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <h3 className="text-base font-black text-amber-900">
                  Datos del padre, madre o tutor
                </h3>

                <p className="mt-1 text-sm text-amber-800">
                  Obligatorio para participantes menores de edad.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-amber-900">
                  Nombre del tutor
                </label>

                <input
                  type="text"
                  value={nombreTutor}
                  onChange={(e) => setNombreTutor(e.target.value)}
                  placeholder="Nombre del padre, madre o tutor"
                  className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-amber-900">
                  Teléfono del tutor
                </label>

                <input
                  type="text"
                  value={telefonoTutor}
                  onChange={(e) => setTelefonoTutor(e.target.value)}
                  placeholder="Teléfono del tutor"
                  className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-bold text-amber-900">
                  Cédula del tutor
                </label>

                <input
                  type="text"
                  value={cedulaTutor}
                  onChange={(e) => setCedulaTutor(e.target.value)}
                  placeholder="Cédula del tutor"
                  className="w-full rounded-2xl border border-amber-300 px-4 py-3 text-base outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
          )}

          {false && (
            <>
          <div className="border-t border-slate-200 pt-4">
            <h2 className="text-lg font-black text-slate-900">
              Condición y pago
            </h2>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Condición del participante
            </label>

            <select
              value={condicionId}
              onChange={(e) => setCondicionId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Seleccione</option>
              {condiciones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Método de pago
            </label>

            <select
              value={metodoPagoId}
              onChange={(e) => setMetodoPagoId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Pendiente / No aplica</option>
              {metodosPago.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">
              Tipo de beca
            </label>

            <select
              value={tipoBecaId}
              onChange={(e) => setTipoBecaId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">No aplica</option>
              {tiposBeca.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
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
              placeholder="Comentario adicional"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
            />
          </div>

            </>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-2xl bg-blue-700 px-4 py-4 text-base font-black text-white shadow-sm disabled:opacity-60"
          >
            {guardando ? "Registrando inscripción..." : "Enviar inscripción"}
          </button>
        </form>
      </section>
    </main>
  );
}