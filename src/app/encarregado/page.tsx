import Link from "next/link";
import { auth } from "@/auth";
import { getParentHomeOverview } from "@/app/actions/guardian";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function timelineDotClass(color: string) {
  if (color === "amber") return "bg-amber-200";
  if (color === "blue") return "bg-sky-200";
  if (color === "rose") return "bg-rose-200";
  return "bg-emerald-200";
}

export default async function EncarregadoHome() {
  const session = await auth();
  const overview = await getParentHomeOverview();
  const students = overview.students;
  const firstName = session?.user?.name?.split(" ")[0] ?? "Encarregado";
  const todayLabel = new Date()
    .toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  const linkedCount = students.length;
  const pendingItems = overview.childCards.reduce((sum, s) => sum + s.pendingHomework, 0);
  const sharedUpdates = overview.timeline.length;
  const avgProgress =
    overview.childCards.length === 0
      ? 0
      : Math.round(
          overview.childCards.reduce((sum, s) => sum + s.progressPct, 0) / overview.childCards.length,
        );

  return (
    <div className="space-y-5">
      <section className="duo-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{todayLabel}</p>
            <h1 className="mt-2 font-serif text-5xl leading-none font-semibold text-[#2b2b2b]">Olá, {firstName}</h1>
            <p className="mt-2 text-base text-slate-600">
              {linkedCount === 0
                ? "Ainda sem educandos ligados."
                : `${linkedCount} educandos ligados · progresso médio ${avgProgress}% esta semana.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="duo-btn-soft rounded-full px-6 py-2.5">
              Mensagem à professora
            </button>
            <button type="button" className="duo-btn-soft rounded-full px-6 py-2.5">
              Resumo semanal
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[2.2fr_1.1fr]">
        <div className="space-y-3">
          {overview.childCards.length === 0 ? (
            <div className="duo-card border-amber-200 bg-amber-50 text-sm text-amber-950">
              <p>Ainda não há ligações. Aceita um convite enviado pelo aluno (link com código).</p>
            </div>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {overview.childCards.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/encarregado/aluno/${child.id}`}
                    className={`duo-card block border-l-4 p-4 transition hover:opacity-95 ${child.hasRecentHelpRequest ? "border-l-emerald-500" : "border-l-[#ff6b4a]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-700">
                          {initials(child.name)}
                        </span>
                        <div>
                          <p className="text-2xl font-semibold text-slate-900">{child.name}</p>
                          <p className="text-sm text-slate-500">
                            {child.gradeYear ? `${child.gradeYear}.º ano` : "Ano não definido"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`duo-badge ${child.hasRecentHelpRequest ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}
                      >
                        {child.hasRecentHelpRequest ? "Pediu ajuda" : "Em dia"}
                      </span>
                    </div>
                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Progresso semanal
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-[#ece7df]">
                        <div
                          className="h-2 rounded-full bg-[#ff6b4a]"
                          style={{ width: `${Math.max(6, child.progressPct)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500">{child.progressPct}%</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>{child.doneHomework}/{child.totalHomework || 0} TPC</span>
                      <span>{child.pendingHomework} por fazer</span>
                      <span>{formatMinutes(child.weekMinutes)} esta semana</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-4xl font-semibold text-[#2b2b2b]">Esta semana, em casa</h2>
              <span className="text-sm text-slate-500">{sharedUpdates} momentos</span>
            </div>
            <div className="duo-card p-0">
              {overview.timeline.length === 0 ? (
                <p className="p-4 text-sm text-slate-500">Sem atividade recente para mostrar.</p>
              ) : (
                <ul className="divide-y divide-[#eee7de]">
                  {overview.timeline.map((event) => (
                    <li key={event.key} className="flex items-center gap-3 px-4 py-3">
                      <p className="w-[92px] shrink-0 text-xs uppercase tracking-[0.15em] text-slate-500">
                        {event.at.toLocaleDateString("pt-PT", { weekday: "short" })} ·{" "}
                        {event.at.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <span className={`h-7 w-7 rounded-lg ${timelineDotClass(event.color)}`} />
                      <p className="text-sm text-slate-700">{event.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <article className="duo-card border-amber-200 bg-[#fff6da]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Alerta partilhado</p>
            {overview.latestDifficulty ? (
              <>
                <p className="mt-2 text-lg font-semibold text-amber-900">Um educando partilhou uma dificuldade</p>
                <p className="mt-2 text-sm text-amber-900/90">
                  &quot;{overview.latestDifficulty.description}&quot;
                </p>
                <p className="mt-2 text-sm text-amber-900/90">
                  Em {overview.latestDifficulty.subject?.name ?? "disciplina geral"} ·{" "}
                  {overview.latestDifficulty.createdAt.toLocaleString("pt-PT")}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-amber-900">Sem novos pedidos de ajuda partilhados.</p>
            )}
          </article>

          <article className="duo-card">
            <p className="text-lg font-semibold text-slate-900">Hábito de estudo · família</p>
            <p className="mt-1 text-xs text-slate-500">Blocos concluídos por dia · semana atual</p>
            <div className="mt-4 grid grid-cols-7 items-end gap-2">
              {overview.weekDays.map((value, idx) => {
                const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
                const max = Math.max(...overview.weekDays, 1);
                return (
                  <div key={`${labels[idx]}-${idx}`} className="flex flex-col items-center gap-2">
                    <div className="flex h-20 w-full items-end rounded-md bg-[#f6f2ec] p-1">
                      <div
                        className="w-full rounded-sm bg-[#8ed0ae]"
                        style={{ height: `${Math.max(8, Math.round((value / max) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{labels[idx]}</span>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="duo-card">
            <p className="text-sm text-slate-600">
              {linkedCount} educandos ligados · {pendingItems} tarefas por concluir.
            </p>
            <p className="mt-1 text-sm text-slate-600">Progresso médio da semana: {avgProgress}%.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
