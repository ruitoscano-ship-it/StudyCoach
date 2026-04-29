"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ label = "Sair" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
    >
      {label}
    </button>
  );
}
