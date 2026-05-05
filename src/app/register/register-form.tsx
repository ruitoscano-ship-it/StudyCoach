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
      <div className="rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-lime-950">
        <p className="font-semibold">Conta criada com sucesso.</p>
        <p className="mt-1">
          <Link href="/login" className="font-semibold text-[#ff6b4a] underline">
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
        <p className="rounded-2xl border border-[#f3d8cf] bg-[#fff4ef] px-3 py-2 text-sm text-orange-950" role="alert">
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
          className="duo-input mt-0 py-2.5 text-base"
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
          className="duo-input mt-0 py-2.5 text-base"
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
          className="duo-input mt-0 py-2.5 text-base"
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de conta</span>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#e7e1d8] bg-white p-3 hover:bg-[#faf7f3]">
            <input type="radio" name="role" value="STUDENT" defaultChecked className="h-4 w-4" />
            <span>Aluno</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#e7e1d8] bg-white p-3 hover:bg-[#faf7f3]">
            <input type="radio" name="role" value="PARENT" className="h-4 w-4" />
            <span>Encarregado de educação</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-[#e7e1d8] bg-white p-3 hover:bg-[#faf7f3]">
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
          className="duo-select mt-0 py-2.5 text-base"
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
        className="duo-btn mt-2 py-3 text-base disabled:opacity-60"
      >
        {pending ? "A criar…" : "Criar conta"}
      </button>
    </form>
  );
}
