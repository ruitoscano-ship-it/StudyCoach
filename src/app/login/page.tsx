import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center px-3 py-8">
        <div className="mx-auto grid w-full max-w-4xl gap-3 md:grid-cols-[1.05fr_1fr]">
          <section className="duo-card hidden p-6 md:block md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff6b4a] text-sm font-bold text-white">
                S
              </span>
              <p className="font-semibold text-slate-900">Study Coach</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c46858]">
              Coach de estudo
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#2b2b2b]">
              Uma experiência simples, clara e motivadora
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Plataforma para estudantes, professores e encarregados acompanharem progresso e
              estudo semanal no mesmo espaço.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              <li>• Rotinas semanais com foco</li>
              <li>• Comunicação entre escola e família</li>
              <li>• Acompanhamento por perfil</li>
            </ul>
          </section>

          <div className="duo-card p-6 md:p-8">
            <h1 className="duo-page-title text-2xl">Entrar</h1>
            <p className="mt-1 text-sm text-slate-600">Acede à tua conta Coach de Estudo.</p>
            <p className="mt-3 text-xs font-medium text-slate-500">Password demo (todas): Pass1234!</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/login?demo=teacher"
                className="duo-btn-soft rounded-xl px-3 py-1.5 text-xs font-semibold text-teal-800"
              >
                Exemplo Teacher
              </Link>
              <Link
                href="/login?demo=student"
                className="duo-btn-soft rounded-xl px-3 py-1.5 text-xs font-semibold text-orange-900"
              >
                Exemplo Student
              </Link>
              <Link
                href="/login?demo=parent"
                className="duo-btn-soft rounded-xl px-3 py-1.5 text-xs font-semibold text-violet-900"
              >
                Exemplo Parent
              </Link>
            </div>
            <div className="mt-6">
              <Suspense fallback={<p className="text-sm text-slate-500">A carregar…</p>}>
                <LoginForm />
              </Suspense>
            </div>
            <p className="mt-6 text-center text-sm text-slate-600">
              Ainda não tens conta?{" "}
              <Link href="/register" className="font-semibold text-[#ff6b4a] hover:underline">
                Registar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
