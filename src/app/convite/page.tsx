import Link from "next/link";
import { auth } from "@/auth";
import { ErrorBanner } from "@/components/error-banner";
import { acceptGuardianInviteFormAction } from "@/app/actions/guardian";

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ConvitePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim();
  const session = await auth();

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-bold text-slate-900">Convite</h1>
        <p className="mt-2 text-sm text-slate-600">Este link está incompleto. Pede um novo ao aluno.</p>
      </div>
    );
  }

  if (session?.user?.role === "PARENT") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-bold text-slate-900">Aceitar convite</h1>
        <ErrorBanner message={sp.error} />
        <p className="mt-2 text-sm text-slate-600">
          Confirma para ficares ligado à conta do aluno.
        </p>
        <form action={acceptGuardianInviteFormAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Aceitar convite
          </button>
        </form>
      </div>
    );
  }

  if (session) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-bold text-slate-900">Convite</h1>
        <p className="mt-2 text-sm text-slate-600">
          Esta página destina-se a encarregados de educação. Fecha sessão e regista-te ou entra com
          uma conta de encarregado.
        </p>
      </div>
    );
  }

  const reg = `/register?token=${encodeURIComponent(token)}`;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-bold text-slate-900">Convite de encarregado de educação</h1>
      <p className="mt-2 text-sm text-slate-600">
        Um aluno convidou-te a acompanhar o percurso escolar. Cria conta como encarregado ou entra se
        já tiveres.
      </p>
      <ErrorBanner message={sp.error} />
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={reg}
          className="rounded-lg bg-teal-600 py-3 text-center text-sm font-semibold text-white hover:bg-teal-700"
        >
          Registar com este convite
        </Link>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/convite?token=${encodeURIComponent(token)}`)}`}
          className="rounded-lg border border-slate-300 py-3 text-center text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Já tenho conta — entrar
        </Link>
      </div>
    </div>
  );
}
