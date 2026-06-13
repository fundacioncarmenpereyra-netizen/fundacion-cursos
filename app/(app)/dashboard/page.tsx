import Link from "next/link";

type Modulo = {
  titulo: string;
  descripcion: string;
  href: string;
  icono: string;
  color: string;
  recomendado?: string;
};

const modulosPrincipales: Modulo[] = [
  {
    titulo: "Inscripciones",
    descripcion: "Consultar solicitudes, aprobar estudiantes y revisar documentos.",
    href: "/inscripciones",
    icono: "📝",
    color: "from-blue-600 to-blue-800",
    recomendado: "Inicio del proceso",
  },
  {
    titulo: "Pagos",
    descripcion: "Registrar pagos, validar estados y generar recibos.",
    href: "/pagos",
    icono: "💳",
    color: "from-emerald-600 to-emerald-800",
  },
  {
    titulo: "Asistencias",
    descripcion: "Ver asistencia por curso, fecha y participante.",
    href: "/asistencias",
    icono: "✅",
    color: "from-cyan-600 to-cyan-800",
  },
  {
    titulo: "Remitidos INFOTEP",
    descripcion: "Generar lista de remitidos a inicio de acción formativa.",
    href: "/remitidos",
    icono: "📋",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    titulo: "Aprobación certificados",
    descripcion: "Validar documentos, pagos, asistencia y remitidos antes de certificar.",
    href: "/certificados/aprobacion",
    icono: "🎓",
    color: "from-amber-500 to-orange-700",
    recomendado: "Antes de emitir",
  },
  {
    titulo: "Certificados",
    descripcion: "Emitir, anular e imprimir certificados de los estudiantes.",
    href: "/certificados",
    icono: "🏅",
    color: "from-purple-600 to-purple-800",
  },
  {
    titulo: "Catálogos",
    descripcion: "Mantener cursos, profesores, horarios, aulas y demás configuraciones.",
    href: "/catalogos",
    icono: "⚙️",
    color: "from-slate-700 to-slate-950",
  },
  {
    titulo: "Portal estudiantes",
    descripcion: "Acceso público para inscripción, consulta y documentos.",
    href: "/estudiantes",
    icono: "👩‍🎓",
    color: "from-pink-600 to-rose-800",
  },
];

const flujo = [
  "Inscripción",
  "Documentos",
  "Pago",
  "Asistencia",
  "Remitido INFOTEP",
  "Aprobación",
  "Certificado",
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] bg-gradient-to-r from-blue-950 via-blue-800 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
                Fundación Dra. Carmen Pereyra
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Panel Administrativo
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-blue-100 md:text-base">
                Menú principal para administrar inscripciones, pagos,
                asistencias, remitidos INFOTEP, aprobaciones y certificados.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[340px]">
              <Link
                href="/"
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Inicio general
              </Link>

              <Link
                href="/profesor"
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Acceso profesor
              </Link>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Flujo recomendado del proceso
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Use este orden para mantener el expediente académico completo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {flujo.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-700 text-[10px] text-white">
                    {index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-slate-900">
              Módulos administrativos
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Seleccione el módulo que desea trabajar.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
            {modulosPrincipales.map((modulo) => (
              <Link
                key={modulo.href}
                href={modulo.href}
                className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className={`grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br ${modulo.color} text-3xl shadow-md transition group-hover:scale-105`}
                >
                  {modulo.icono}
                </div>

                <div className="mt-5 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-slate-900">
                    {modulo.titulo}
                  </h3>

                  {modulo.recomendado && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase text-blue-700">
                      {modulo.recomendado}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
                  {modulo.descripcion}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700">
                  Entrar al módulo
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">👩‍🎓</div>
            <h3 className="mt-3 text-lg font-black text-slate-900">
              Acceso estudiantes
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Portal para cursos disponibles, inscripción, consulta y documentos.
            </p>
            <Link
              href="/estudiantes"
              className="mt-4 block rounded-2xl bg-blue-700 px-4 py-3 text-center text-sm font-black text-white hover:bg-blue-800"
            >
              Ir al portal estudiantes
            </Link>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">👨‍🏫</div>
            <h3 className="mt-3 text-lg font-black text-slate-900">
              Acceso profesores
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Entrada de profesores para ver cursos asignados y registrar asistencia.
            </p>
            <Link
              href="/profesor"
              className="mt-4 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-black text-white hover:bg-slate-800"
            >
              Ir al acceso profesor
            </Link>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-3xl">⚙️</div>
            <h3 className="mt-3 text-lg font-black text-slate-900">
              Configuración
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Mantenimiento de cursos, aulas, profesores, horarios y catálogos.
            </p>
            <Link
              href="/catalogos"
              className="mt-4 block rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
            >
              Ir a catálogos
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}