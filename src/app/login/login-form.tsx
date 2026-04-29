"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

const DEMO_PASSWORD = "Pass1234!";
const DEMO_USERS = [
  { label: "Aluno", email: "aluno.demo@studycoach.test" },
  { label: "Encarregado", email: "enc.demo@studycoach.test" },
  { label: "Professor", email: "prof.demo@studycoach.test" },
];

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Email ou palavra-passe incorretos.");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none ring-teal-500 focus:border-teal-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Palavra-passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none ring-teal-500 focus:border-teal-500 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-teal-600 py-3 text-base font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {pending ? "A entrar…" : "Entrar"}
      </button>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
        <p className="text-sm font-semibold text-sky-900">Contas de teste</p>
        <p className="mt-1 text-xs text-sky-800">Palavra-passe para todas: {DEMO_PASSWORD}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_USERS.map((user) => (
            <button
              key={user.email}
              type="button"
              onClick={() => {
                setEmail(user.email);
                setPassword(DEMO_PASSWORD);
                setError(null);
              }}
              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-100"
            >
              {user.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
