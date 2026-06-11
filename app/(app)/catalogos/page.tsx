import Link from "next/link";

const catalogos = [
  {
    titulo: "Categorías de cursos",
    descripcion: "Clasificación general de los cursos.",
    href: "/catalogos/categorias",
    icono: "📚",
  },
  {
    titulo: "Cursos",
    descripcion: "Registro de cursos disponibles.",
    href: "/catalogos/cursos",
    icono: "🎓",
  },
  {
    titulo: "Modalidades",
    descripcion: "Presencial, virtual o semipresencial.",
    href: "/catalogos/modalidades",
    icono: "🌐",
  },
  {
    titulo: "Horarios",
    descripcion: "Días, horas y jornadas de clases.",
    href: "/catalogos/horarios",
    icono: "🕒",
  },
  {
    titulo: "Aulas / espacios",
    descripcion: "Aulas físicas, laboratorios y espacios virtuales.",
    href: "/catalogos/aulas",
    icono: "🏫",
  },
  {
    titulo: "Profesores",
    descripcion: "Facilitadores disponibles para impartir cursos.",
    href: "/catalogos/profesores",
    icono: "👨‍🏫",
  },
  {
    titulo: "Estados de inscripción",
    descripcion: "Estados del proceso de inscripción.",
    href: "/catalogos/estados-inscripcion",
    icono: "✅",
  },
  {
    titulo: "Condiciones del participante",
    descripcion: "Regular, becado, exonerado o pendiente.",
    href: "/catalogos/condiciones-participante",
    icono: "👥",
  },
  {
    titulo: "Métodos de pago",
    descripcion: "Formas de pago aceptadas por la Fundación.",
    href: "/catalogos/metodos-pago",
    icono: "💳",
  },
  {
    titulo: "Tipos de beca",
    descripcion: "Becas, descuentos y ayudas institucionales.",
    href: "/catalogos/tipos-beca",
    icono: "🎁",
  },
  {
    titulo: "Tipos de documentos",
    descripcion: "Documentos requeridos para inscripción.",
    href: "/catalogos/tipos-documentos",
    icono: "📄",
  },
  {
    titulo: "Programaciones de cursos",
    descripcion: "Apertura de grupos, fechas, cupos y profesores.",
    href: "/catalogos/programaciones-cursos",
    icono: "📅",
  },
];

export default function CatalogosPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Fundación Dra. Carmen Pereyra
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Módulo de catálogos
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Administre las informaciones base del sistema de inscripción,
            cursos, profesores, documentos, becas, pagos y programaciones.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {catalogos.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-2xl text-white shadow-sm">
                  {item.icono}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700">
                    {item.titulo}
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.descripcion}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Abrir catálogo
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-base font-bold text-blue-900">
            Flujo recomendado
          </h2>

          <p className="mt-2 text-sm text-blue-800">
            Primero registre categorías, cursos, modalidades, horarios, aulas y
            profesores. Luego cree la programación del curso para que pueda estar
            disponible en el formulario móvil de inscripción.
          </p>
        </section>
      </div>
    </main>
  );
}