import Link from "next/link";

const accesos = [
  {
    titulo: "Estudiantes",
    descripcion:
      "Consulta cursos disponibles, realiza tu inscripción, sube documentos y revisa tu estado.",
    href: "/estudiantes/panel",
    icono: "👩‍🎓",
    color: "from-blue-600 to-blue-900",
    boton: "Volver al panel",
  },
  {
    titulo: "Administradores",
    descripcion:
      "Gestiona inscripciones, pagos, asistencias, remitidos INFOTEP, aprobaciones y certificados.",
    href: "/dashboard",
    icono: "🛠️",
    color: "from-slate-700 to-slate-950",
    boton: "Entrar a administración",
  },
  {
    titulo: "Profesores",
    descripcion:
      "Acceso para consultar cursos asignados y registrar asistencia de los participantes.",
    href: "/profesor",
    icono: "👨‍🏫",
    color: "from-emerald-600 to-emerald-900",
    boton: "Entrar como profesor",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center space-y-8">
        <div className="overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-950 via-blue-800 to-slate-950 p-6 text-white shadow-2xl md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-200">
                Sistema de Gestión Académica
              </p>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Fundación Dra. Carmen Pereyra
              </h1>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-relaxed text-blue-100 md:text-lg">
                Plataforma para administrar inscripciones, documentos, pagos,
                asistencias, remitidos INFOTEP, aprobaciones académicas y
                certificados.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase text-white ring-1 ring-white/20">
                  Inscripciones
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase text-white ring-1 ring-white/20">
                  INFOTEP
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase text-white ring-1 ring-white/20">
                  Certificados
                </span>

                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase text-white ring-1 ring-white/20">
                  Asistencias
                </span>
              </div>
            </div>

            <div className="rounded-[30px] bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
              <p className="text-sm font-black uppercase tracking-wide text-blue-100">
                Flujo del sistema
              </p>

              <div className="mt-4 space-y-3">
                {[
                  "Registro y acceso del estudiante",
                  "Subida y aprobación de documentos",
                  "Registro de pagos",
                  "Control de asistencia",
                  "Remitidos INFOTEP",
                  "Aprobación para certificado",
                  "Emisión e impresión de certificado",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-black text-blue-900">
                      {index + 1}
                    </span>

                    <span className="text-sm font-bold text-white">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-900">
              Seleccione su tipo de acceso
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Cada perfil tiene su propio menú y funciones disponibles.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {accesos.map((acceso) => (
              <Link
                key={acceso.href}
                href={acceso.href}
                className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`bg-gradient-to-br ${acceso.color} p-6 text-white`}
                >
                  <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-white/15 text-4xl ring-1 ring-white/20 transition group-hover:scale-105">
                    {acceso.icono}
                  </div>

                  <h3 className="mt-5 text-2xl font-black">
                    {acceso.titulo}
                  </h3>
                </div>

                <div className="p-6">
                  <p className="min-h-[72px] text-sm font-semibold leading-relaxed text-slate-600">
                    {acceso.descripcion}
                  </p>

                  <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-900 transition group-hover:bg-blue-700 group-hover:text-white">
                    {acceso.boton}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">
              Para estudiantes
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-950">
              El estudiante debe entrar a su panel para inscribirse, consultar su proceso, subir sus
              documentos y acceder a su formulario.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-sm font-black uppercase tracking-wide text-slate-700">
              Para administradores
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              Administración tendrá control completo del expediente académico,
              pagos, asistencias, INFOTEP y certificados.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
              Para profesores
            </p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              El profesor podrá entrar con su código, consultar sus cursos y
              registrar asistencia por fecha.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}