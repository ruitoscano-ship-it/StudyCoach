import { ErrorBanner } from "@/components/error-banner";
import { joinClassFormAction } from "@/app/actions/class";
import { requireStudent } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAppBaseUrl } from "@/lib/url";
import { InviteSection } from "./invite-section";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function TurmaPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await requireStudent();
  const enrollments = await prisma.enrollment.findMany({
    where: { studentUserId: session.user.id },
    include: { class: true },
  });

  const pending = await prisma.guardianLink.findFirst({
    where: {
      studentUserId: session.user.id,
      status: "PENDING",
      parentUserId: null,
    },
    orderBy: { createdAt: "desc" },
  });

  const base = await getAppBaseUrl();
  const initialUrl =
    pending?.inviteToken != null
      ? `${base.replace(/\/$/, "")}/convite?token=${pending.inviteToken}`
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="duo-page-title">Turma e família</h1>
        <p className="mt-1 text-sm text-slate-600">
          Junta-te a uma turma com o código do professor. Convida o teu encarregado de educação com
          um link.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Entrar na turma</h2>
        <p className="mt-1 text-sm text-slate-600">
          Pede o código ao professor e cola aqui.
        </p>
        <form action={joinClassFormAction} className="mt-4 flex flex-wrap gap-2">
          <input
            name="code"
            placeholder="Código da turma"
            required
            className="duo-input mt-0 min-w-[200px] flex-1"
          />
          <button type="submit" className="duo-btn">
            Entrar
          </button>
        </form>
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">As minhas turmas</h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não estás inscrito em nenhuma turma.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {enrollments.map((e) => (
              <li key={e.id} className="text-sm text-slate-800">
                {e.class.name} ({e.class.year}.º ano)
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Convidar encarregado de educação</h2>
        <p className="mt-2 text-sm text-slate-600">
          Gera um link e envia à pessoa responsável. Ela regista-se como encarregado e aceita o
          convite.
        </p>
        <InviteSection initialUrl={initialUrl} />
      </section>
    </div>
  );
}
