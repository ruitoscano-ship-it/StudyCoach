import Link from "next/link";
import { auth } from "@/auth";
import { listHomework, listMarks } from "@/app/actions/student-data";

export default async function AlunoHome() {
  const session = await auth();
  const [marks, hw] = await Promise.all([listMarks(), listHomework()]);
  const recentMarks = marks.slice(0, 3);
  const dueSoon = hw
    .filter((h) => h.status !== "CONCLUIDO")
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-sky-200/70 bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Painel rapido</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Olá{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-slate-600">
          Aqui tens o teu resumo de hoje. Vamos estudar passo a passo.
        </p>
      </div>

      <section className="rounded-2xl border border-sky-200/70 bg-white/85 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-sky-900">Ultimas notas</h2>
          <Link href="/aluno/notas" className="text-sm font-medium text-sky-700 hover:underline">
            Ver todas
          </Link>
        </div>
        {recentMarks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Ainda não há notas registadas.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recentMarks.map((m) => (
              <li key={m.id} className="flex justify-between text-sm">
                <span className="text-slate-700">{m.subject.name}</span>
                <span className="font-medium tabular-nums text-slate-900">
                  {m.value}/{m.maxValue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-sky-200/70 bg-white/85 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-sky-900">Missoes por entregar</h2>
          <Link href="/aluno/trabalhos" className="text-sm font-medium text-sky-700 hover:underline">
            Trabalhos
          </Link>
        </div>
        {dueSoon.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nada pendente — ou ainda não registaste trabalhos.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {dueSoon.map((h) => (
              <li key={h.id} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between">
                <span className="text-slate-700">{h.title}</span>
                <span className="text-slate-500">
                  {new Date(h.dueAt).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/aluno/plano"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600"
        >
          Ver plano da semana
        </Link>
        <Link
          href="/aluno/dificuldades"
          className="rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-semibold text-sky-900 hover:bg-sky-50"
        >
          Registar dificuldade
        </Link>
      </div>
    </div>
  );
}
