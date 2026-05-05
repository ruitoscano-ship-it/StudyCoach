import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { ErrorBanner } from "@/components/error-banner";
import { acceptGuardianInviteFormAction } from "@/app/actions/guardian";

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f6f2] px-3 py-8">
      <div className="mx-auto max-w-md">
        <div className="duo-card p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}

export default async function ConvitePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim();
  const session = await auth();

  if (!token) {
    return (
      <Shell>
        <h1 className="duo-page-title text-2xl">Convite</h1>
        <p className="mt-2 text-sm text-slate-600">Este link está incompleto. Pede um novo ao aluno.</p>
      </Shell>
    );
  }

  if (session?.user?.role === "PARENT") {
    return (
      <Shell>
        <h1 className="duo-page-title text-2xl">Aceitar convite</h1>
        <ErrorBanner message={sp.error} />
        <p className="mt-2 text-sm text-slate-600">Confirma para ficares ligado à conta do aluno.</p>
        <form action={acceptGuardianInviteFormAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="duo-btn w-full py-3 text-sm">
            Aceitar convite
          </button>
        </form>
      </Shell>
    );
  }

  if (session) {
    return (
      <Shell>
        <h1 className="duo-page-title text-2xl">Convite</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta página destina-se a encarregados de educação. Fecha sessão e regista-te ou entra com
          uma conta de encarregado.
        </p>
      </Shell>
    );
  }

  const reg = `/register?token=${encodeURIComponent(token)}`;

  return (
    <Shell>
      <h1 className="duo-page-title text-2xl">Convite de encarregado de educação</h1>
      <p className="mt-2 text-sm text-slate-600">
        Um aluno convidou-te a acompanhar o percurso escolar. Cria conta como encarregado ou entra se
        já tiveres.
      </p>
      <ErrorBanner message={sp.error} />
      <div className="mt-6 flex flex-col gap-2">
        <Link href={reg} className="duo-btn py-3 text-center text-sm">
          Registar com este convite
        </Link>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/convite?token=${encodeURIComponent(token)}`)}`}
          className="duo-btn-soft py-3 text-center text-sm"
        >
          Já tenho conta — entrar
        </Link>
      </div>
    </Shell>
  );
}
