"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { registerAction, type RegisterState } from "@/app/actions/register";

const initial: RegisterState = {};

export function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(registerAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-900">
        <p className="font-medium">Conta criada com sucesso.</p>
        <p className="mt-1">
          <Link href="/login" className="font-semibold underline">
            Entra aqui
          </Link>{" "}
          para continuar.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="inviteToken" value={token} />
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Palavra-passe (mín. 8 caracteres)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de conta</span>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="radio" name="role" value="STUDENT" defaultChecked className="h-4 w-4" />
            <span>Aluno</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="radio" name="role" value="PARENT" className="h-4 w-4" />
            <span>Encarregado de educação</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input type="radio" name="role" value="TEACHER" className="h-4 w-4" />
            <span>Professor</span>
          </label>
        </div>
      </div>
      <div>
        <label htmlFor="gradeYear" className="mb-1 block text-sm font-medium text-slate-700">
          Ano escolar (só alunos): 1 a 9
        </label>
        <select
          id="gradeYear"
          name="gradeYear"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-teal-500"
          defaultValue=""
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <option key={n} value={n}>
              {n}.º ano
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-teal-600 py-3 text-base font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "A criar…" : "Criar conta"}
      </button>
    </form>
  );
}
