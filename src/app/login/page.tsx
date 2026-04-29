import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-1 text-sm text-slate-600">Acede à tua conta Coach de Estudo.</p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-slate-500">A carregar…</p>}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-slate-600">
          Ainda não tens conta?{" "}
          <Link href="/register" className="font-medium text-teal-700 hover:underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  );
}
