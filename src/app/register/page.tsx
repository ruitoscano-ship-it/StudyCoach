import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col justify-center px-3 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="duo-card p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff6b4a] text-sm font-bold text-white">
                S
              </span>
              <p className="font-semibold text-slate-900">Study Coach</p>
            </div>
            <h1 className="duo-page-title text-2xl">Registar</h1>
            <p className="mt-1 text-sm text-slate-600">
              Cria a tua conta (aluno, encarregado ou professor).
            </p>
            <div className="mt-6">
              <Suspense fallback={<p className="text-sm text-slate-500">A carregar…</p>}>
                <RegisterForm />
              </Suspense>
            </div>
            <p className="mt-6 text-center text-sm text-slate-600">
              Já tens conta?{" "}
              <Link href="/login" className="font-semibold text-[#ff6b4a] hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
