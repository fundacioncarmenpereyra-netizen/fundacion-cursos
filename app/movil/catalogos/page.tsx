import Link from "next/link";

const catalogos = [
  {
    titulo: "Categorías",
    descripcion: "Clasificación de los cursos.",
    href: "/movil/catalogos/categorias",
    icono: "📚",
    estado: "Disponible",
  },
  {
    titulo: "Cursos",
    descripcion: "Cursos registrados en la Fundación.",
    href: "/movil/catalogos/cursos",
    icono: "🎓",
    estado: "Disponible",
  },
  {
    titulo: "Modalidades",
    descripcion: "Presencial, virtual o semipresencial.",
    href: "/movil/catalogos/modalidades",
    icono: "🌐",
    estado: "Disponible",
  },
  {
    titulo: "Horarios",
    descripcion: "Días y horas de clases.",
    href: "/movil/catalogos/horarios",
    icono: "🕒",
    estado: "Disponible",
  },
  {
    titulo: "Aulas / Espacios",
    descripcion: "Aulas físicas y espacios virtuales.",
    href: "/movil/catalogos/aulas",
    icono: "🏫",
    estado: "Disponible",
  },
  {
    titulo: "Profesores",
    descripcion: "Facilitadores de los cursos.",
    href: "/movil/catalogos/profesores",
    icono: "👨‍🏫",
    estado: "Disponible",
  },
  {
    titulo: "Estados de inscripción",
    descripcion: "Flujo del proceso de inscripción.",
    href: "/movil/catalogos/estados-inscripcion",
    icono: "✅",
    estado: "Disponible",
  },
  {
    titulo: "Condiciones",
    descripcion: "Regular, becado o exonerado.",
    href: "/movil/catalogos/condiciones-participante",
    icono: "👥",
    estado: "Disponible",
  },
  {
    titulo: "Métodos de pago",
    descripcion: "Formas de pago aceptadas.",
    href: "/movil/catalogos/metodos-pago",
    icono: "💳",
    estado: "Disponible",
  },
  {
    titulo: "Tipos de beca",
    descripcion: "Becas, ayudas y descuentos.",
    href: "/movil/catalogos/tipos-beca",
    icono: "🎁",
    estado: "Disponible",
  },
  {
    titulo: "Tipos de documentos",
    descripcion: "Documentos para inscripción.",
    href: "/movil/catalogos/tipos-documentos",
    icono: "📄",
    estado: "Disponible",
  },
  {
    titulo: "Programaciones",
    descripcion: "Cursos abiertos, fechas y cupos.",
    href: "/movil/catalogos/programaciones-cursos",
    icono: "📅",
    estado: "Disponible",
  },
];

export default function CatalogosMovilPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
          Fundación Dra. Carmen Pereyra
        </p>

        <h1 className="mt-1 text-xl font-black text-slate-900">
          Catálogos móvil
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Menú rápido para administrar catálogos desde el celular.
        </p>
      </section>

      <section className="px-4 py-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">Versión móvil</p>
          <p className="mt-1 text-xs leading-5 text-blue-800">
            Esta versión está diseñada para pantallas pequeñas. Iremos
            activando cada catálogo uno por uno.
          </p>
        </div>
      </section>

      <section className="space-y-3 px-4 pb-8">
        {catalogos.map((item) => {
          const disponible = item.estado === "Disponible";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl border bg-white p-4 shadow-sm transition active:scale-[0.99] ${
                disponible
                  ? "border-slate-200"
                  : "pointer-events-none border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-2xl text-white shadow-sm">
                  {item.icono}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-black text-slate-900">
                      {item.titulo}
                    </h2>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                        disponible
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.estado}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {item.descripcion}
                  </p>
                </div>

                <div className="shrink-0 text-xl font-black text-slate-400">
                  →
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}