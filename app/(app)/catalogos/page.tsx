import Link from "next/link";

const catalogos = [
  {
    titulo: "Categorías de cursos",
    descripcion: "Clasificación general de los cursos. También se usa como Familia Profesional para INFOTEP.",
    href: "/catalogos/categorias",
    icono: "📚",
    color: "from-blue-600 to-blue-800",
  },
  {
    titulo: "Cursos",
    descripcion: "Registro de cursos disponibles, código interno y datos académicos.",
    href: "/catalogos/cursos",
    icono: "🎓",
    color: "from-purple-600 to-purple-800",
  },
  {
    titulo: "Modalidades",
    descripcion: "Presencial, virtual o semipresencial. También se usa como Vía de formación.",
    href: "/catalogos/modalidades",
    icono: "🌐",
    color: "from-cyan-600 to-cyan-800",
  },
  {
    titulo: "Horarios",
    descripcion: "Días, horas y jornadas de clases.",
    href: "/catalogos/horarios",
    icono: "🕒",
    color: "from-amber-500 to-orange-700",
  },
  {
    titulo: "Aulas / Lugares",
    descripcion: "Aulas, centros, laboratorios y lugares donde se impartirán los cursos.",
    href: "/catalogos/aulas",
    icono: "🏫",
    color: "from-emerald-600 to-emerald-800",
  },
  {
    titulo: "Profesores",
    descripcion: "Facilitadores disponibles para impartir cursos y registrar asistencias.",
    href: "/catalogos/profesores",
    icono: "👨‍🏫",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    titulo: "Estados de inscripción",
    descripcion: "Estados del proceso de inscripción del participante.",
    href: "/catalogos/estados-inscripcion",
    icono: "✅",
    color: "from-green-600 to-green-800",
  },
  {
    titulo: "Condiciones del participante",
    descripcion: "Regular, becado, exonerado o pendiente.",
    href: "/catalogos/condiciones-participante",
    icono: "👥",
    color: "from-pink-600 to-rose-800",
  },
  {
    titulo: "Métodos de pago",
    descripcion: "Formas de pago aceptadas por la Fundación.",
    href: "/catalogos/metodos-pago",
    icono: "💳",
    color: "from-teal-600 to-teal-800",
  },
  {
    titulo: "Tipos de beca",
    descripcion: "Becas, descuentos y ayudas institucionales.",
    href: "/catalogos/tipos-beca",
    icono: "🎁",
    color: "from-fuchsia-600 to-fuchsia-800",
  },
  {
    titulo: "Tipos de documentos",
    descripcion: "Documentos requeridos para inscripción y validación.",
    href: "/catalogos/tipos-documentos",
    icono: "📄",
    color: "from-slate-600 to-slate-900",
  },
  {
    titulo: "Programaciones de cursos",
    descripcion: "Apertura de grupos, fechas, cupos, profesor y datos INFOTEP.",
    href: "/catalogos/programaciones-cursos",
    icono: "📅",
    color: "from-blue-700 to-slate-900",
  },
];

const flujo = [
  "Categorías",
  "Cursos",
  "Modalidades",
  "Horarios",
  "Aulas / Lugares",
  "Profesores",
  "Programaciones",
];

export default function CatalogosPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] bg-gradient-to-r from-blue-950 via-blue-800 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-200">
                Fundación Dra. Carmen Pereyra
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Módulo de catálogos
              </h1>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-blue-100 md:text-base">
                Administre las informaciones base del sistema: cursos,
                profesores, documentos, becas, pagos, aulas, horarios y
                programaciones.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Volver al menú
              </Link>

              <Link
                href="/"
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Inicio general
              </Link>

              <Link
                href="/inscripciones"
                className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-black text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                Inscripciones
              </Link>

              <Link
                href="/catalogos/programaciones-cursos"
                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-blue-900 hover:bg-blue-50"
              >
                Programaciones
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Flujo recomendado para crear un curso
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Complete los catálogos en este orden para que el curso esté
                disponible en inscripción.
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
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {catalogos.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className={`grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br ${item.color} text-3xl shadow-md transition group-hover:scale-105`}
              >
                {item.icono}
              </div>

              <h2 className="mt-5 text-lg font-black text-slate-900 group-hover:text-blue-700">
                {item.titulo}
              </h2>

              <p className="mt-2 min-h-[72px] text-sm font-semibold leading-relaxed text-slate-500">
                {item.descripcion}
              </p>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                  Abrir catálogo
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[28px] border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-blue-700">
              INFOTEP
            </p>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-950">
              Categoría será Familia Profesional, Modalidad será Vía de
              formación y Aula/Lugar será Lugar a impartirse.
            </p>
          </div>

          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
              Inscripción
            </p>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              Para que un curso aparezca al estudiante, debe tener programación
              activa con cupos disponibles.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <p className="text-sm font-black uppercase tracking-wide text-slate-700">
              Administración
            </p>

            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
              Desde el menú administrativo podrá acceder a inscripciones, pagos,
              asistencias, remitidos y certificados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}