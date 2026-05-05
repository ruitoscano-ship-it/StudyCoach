"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

const DEMO_PASSWORD = "Pass1234!";
const DEMO_USERS = [
  { label: "Student", email: "aluno.demo@studycoach.test" },
  { label: "Parent", email: "enc.demo@studycoach.test" },
  { label: "Teacher", email: "prof.demo@studycoach.test" },
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
          className="duo-input mt-0 py-2.5 text-base"
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
          className="duo-input mt-0 py-2.5 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="duo-btn mt-2 py-3 text-base disabled:opacity-60"
      >
        {pending ? "A entrar…" : "Entrar"}
      </button>
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
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
              className="rounded-xl border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 hover:bg-sky-100"
            >
              {user.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
