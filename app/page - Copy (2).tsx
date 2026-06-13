import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Fundación Dra. Carmen Pereyra
          </p>

          <h1 className="mt-4 text-3xl font-black text-slate-900 md:text-5xl">
            Sistema de inscripción de cursos
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Bienvenido al sistema de inscripción. Seleccione la opción
            correspondiente para continuar.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <Link
              href="/estudiantes"
              className="rounded-2xl bg-blue-700 px-5 py-5 text-center text-base font-black text-white shadow-sm hover:bg-blue-800"
            >
              Soy estudiante
            </Link>

            <Link
              href="/inscripciones"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-5 text-center text-base font-black text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Administración
            </Link>
          </div>

          <p className="mt-6 text-xs font-semibold text-slate-400">
            Fundación Dra. Carmen Pereyra · Formación y desarrollo
          </p>
        </div>
      </section>
    </main>
  );
}