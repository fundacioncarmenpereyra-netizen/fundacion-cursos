"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function EstudiantesPage() {
  const [codigo, setCodigo] = useState("");

  const codigoLimpio = codigo.trim().toUpperCase();

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-xl">
                <Image
                  src="/logo-fundacion.png"
                  alt="Logo Fundación Dra. Carmen Pereyra"
                  width={88}
                  height={88}
                  className="h-full w-full rounded-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Fundación Dra. Carmen Pereyra
                </p>

                <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">
                  Inscríbete en nuestros cursos de formación
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
                  Consulta los cursos disponibles, realiza tu inscripción desde
                  tu celular y sube los documentos requeridos de forma rápida y
                  segura.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:flex">
              <Link
                href="/movil/inicio"
                className="rounded-2xl bg-white px-5 py-4 text-center text-base font-black text-blue-900 shadow-lg hover:bg-blue-50"
              >
                Ver cursos disponibles
              </Link>

              <a
                href="#consultar"
                className="rounded-2xl border border-white/30 bg-white/10 px-5 py-4 text-center text-base font-black text-white shadow-lg hover:bg-white/20"
              >
                Ya tengo código
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            📚
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Elige tu curso
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revisa los cursos disponibles, horarios, modalidad, cupos y fecha de
            inicio.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl">
            📝
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Completa tus datos
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Llena el formulario de inscripción desde tu celular. Si eres menor
            de edad, se pedirán los datos del tutor.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
            📎
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Sube documentos
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Después de inscribirte, podrás subir foto, cédula, autorización del
            tutor o comprobante de pago.
          </p>
        </div>
      </section>

      <section id="consultar" className="mx-auto max-w-5xl px-4 pb-8">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1fr_360px] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                Consulta de inscripción
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-900">
                ¿Ya tienes un código de inscripción?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Escribe tu código para ver tu confirmación o subir documentos.
                Ejemplo: INS-2026-123456.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <label className="mb-1 block text-sm font-bold text-slate-700">
                Código de inscripción
              </label>

              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="INS-2026-123456"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-base uppercase outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />

              <div className="mt-3 grid gap-2">
                <Link
                  href={
                    codigoLimpio
                      ? `/movil/inscripcion/confirmacion?codigo=${codigoLimpio}`
                      : "#consultar"
                  }
                  className={`rounded-2xl px-4 py-3 text-center text-sm font-black shadow-sm ${
                    codigoLimpio
                      ? "bg-blue-700 text-white hover:bg-blue-800"
                      : "bg-slate-300 text-slate-500"
                  }`}
                >
                  Ver confirmación
                </Link>

                <Link
                  href={
                    codigoLimpio
                      ? `/movil/inscripcion/documentos?codigo=${codigoLimpio}`
                      : "#consultar"
                  }
                  className={`rounded-2xl px-4 py-3 text-center text-sm font-black shadow-sm ${
                    codigoLimpio
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-slate-300 text-slate-500"
                  }`}
                >
                  Subir documentos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-lg font-black text-amber-900">
            Información importante
          </h2>

          <div className="mt-3 grid gap-3 text-sm leading-6 text-amber-800 md:grid-cols-2">
            <p>
              Después de enviar tu inscripción, recibirás un código que debes
              guardar para consultar tu solicitud.
            </p>

            <p>
              La Fundación revisará tus datos y documentos para aprobar o dar
              seguimiento a tu inscripción.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <Image
                src="/logo-fundacion.png"
                alt="Logo Fundación Dra. Carmen Pereyra"
                width={40}
                height={40}
                className="h-full w-full rounded-full object-contain"
              />
            </div>

            <p className="text-sm font-black text-slate-900">
              Fundación Dra. Carmen Pereyra
            </p>
          </div>

          <p className="text-xs font-semibold text-slate-500">
            Sistema de inscripción de cursos
          </p>
        </div>
      </footer>
    </main>
  );
}