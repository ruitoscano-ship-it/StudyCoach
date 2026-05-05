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
        <p className="rounded-2xl border border-[#f3d8cf] bg-[#fff4ef] px-3 py-2 text-sm text-orange-950" role="alert">
          {err}
        </p>
      ) : null}
      {url ? (
        <div className="rounded-2xl border border-[#e7e1d8] bg-[#faf7f3] p-3">
          <p className="text-xs font-medium text-slate-600">Link do convite</p>
          <p className="mt-1 break-all text-sm text-slate-900">{url}</p>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(url)}
            className="mt-2 text-sm font-semibold text-[#ff6b4a] hover:underline"
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
        className="duo-btn-soft border-teal-300 text-teal-900 hover:bg-teal-50 disabled:opacity-60"
      >
        {pending ? "A gerar…" : "Gerar novo convite"}
      </button>
      <p className="text-xs text-slate-500">
        Cada novo convite cria um link. O encarregado usa o último que enviares.
      </p>
    </div>
  );
}
