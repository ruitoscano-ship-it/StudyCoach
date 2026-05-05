"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ label = "Sair" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}
      className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-900"
    >
      {label}
    </button>
  );
}
