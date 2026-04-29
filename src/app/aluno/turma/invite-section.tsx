"use client";

import { useState } from "react";
import { createGuardianInviteAction } from "@/app/actions/register";

export function InviteSection({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setErr(null);
    setPending(true);
    try {
      const r = await createGuardianInviteAction();
      if ("ok" in r && r.ok) setUrl(r.url);
      else setErr("Não foi possível gerar o convite.");
    } catch {
      setErr("Não foi possível gerar o convite.");
    }
    setPending(false);
  }

  return (
    <div className="mt-4 space-y-3">
      {err ? (
        <p className="text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
      {url ? (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-600">Link do convite</p>
          <p className="mt-1 break-all text-sm text-slate-900">{url}</p>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(url)}
            className="mt-2 text-sm font-medium text-teal-700 hover:underline"
          >
            Copiar
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Ainda não há convite pendente.</p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => void generate()}
        className="rounded-lg border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-60"
      >
        {pending ? "A gerar…" : "Gerar novo convite"}
      </button>
      <p className="text-xs text-slate-500">
        Cada novo convite cria um link. O encarregado usa o último que enviares.
      </p>
    </div>
  );
}
