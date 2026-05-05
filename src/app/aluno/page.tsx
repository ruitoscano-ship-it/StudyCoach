import Link from "next/link";
import { getStudentHomeDashboard } from "@/app/actions/student-data";

const statusTone: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-900",
  EM_CURSO: "bg-sky-100 text-sky-900",
  CONCLUIDO: "bg-lime-100 text-lime-900",
};

const weekday = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default async function AlunoHome() {
  const data = await getStudentHomeDashboard();
  const firstName = data.studentName.split(" ")[0];
  const now = new Date();
  const dateLabel = now.toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const nextDurationMin = data.nextBlock
    ? Math.max(
        5,
        Math.round(
          (new Date(data.nextBlock.endAt).getTime() -
            new Date(data.nextBlock.startAt).getTime()) /
            60000,
        ),
      )
    : 25;
  const progressPct =
    data.todayBlocks.length === 0
      ? 0
      : Math.round((data.doneToday / data.todayBlocks.length) * 100);

  return (
    <div className="space-y-4">
      {data.dbUnavailable ? (
        <p className="rounded-2xl border border-[#f3d8cf] bg-[#fff4ef] px-4 py-3 text-sm font-medium text-orange-950">
          Não foi possível ligar à base de dados agora. O painel está em modo limitado.
        </p>
      ) : null}
      <section className="duo-card bg-gradient-to-br from-[#fdf4ee] via-[#fffaf6] to-white p-4 md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{dateLabel}</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[40px] leading-none font-semibold text-[#2b2b2b]">
              Olá, {firstName} 👋
            </h1>
            <p className="mt-1 text-[14px] text-slate-600">
              Hoje tens {data.todayBlocks.length} blocos pequenos - começa pelo mais curto.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="duo-badge bg-amber-100 text-amber-900">{data.streakDays} dias seguidos</span>
            <span className="duo-badge bg-lime-100 text-lime-900">{data.thisWeekTotal} esta semana</span>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.58fr_1fr]">
        <article className="duo-card border-[#f3d8cf] bg-gradient-to-br from-[#fff4ef] via-[#fff9f7] to-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c46858]">
            O teu próximo bloco
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-[44px] leading-none font-semibold text-[#262626]">
                {data.nextBlock?.homework?.subject?.name ?? "Estudo"} · {nextDurationMin} min
              </h2>
              <p className="mt-1.5 text-[14px] text-slate-700">
                {data.nextBlock?.title ??
                  "Cria um bloco no teu plano para aparecer aqui automaticamente."}
              </p>
              <div className="mt-3.5 flex flex-wrap gap-2">
                <Link href="/aluno/plano" className="duo-btn px-5 py-2.5">
                  Começar agora
                </Link>
                <Link href="/aluno/plano" className="duo-btn-soft">
                  Ver detalhe
                </Link>
              </div>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-[7px] border-[#f3e3dc] text-4xl font-semibold text-[#f36f4c]">
              {data.doneToday}/{Math.max(1, data.todayBlocks.length)}
            </div>
          </div>
        </article>

        <aside className="duo-card">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Hoje</h3>
            <p className="text-[12px] text-slate-500">
              {data.doneToday} / {data.todayBlocks.length || 0} blocos
            </p>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2.5 grid grid-cols-5 gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-8 rounded-lg ${
                  i < data.doneToday
                    ? "bg-orange-400"
                    : i < data.todayBlocks.length
                      ? "bg-orange-100"
                      : "bg-slate-100"
                }`}
              />
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-lime-50 px-3 py-2 text-sm text-lime-900">
            Vais bem! Mais {Math.max(0, data.todayBlocks.length - data.doneToday)} blocos e fechas o
            dia.
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-serif text-4xl font-semibold text-[#2b2b2b]">Trabalhos de hoje</h2>
          <span className="text-sm text-slate-500">Hoje · {data.todayHomework.length}</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.todayHomework.length === 0 ? (
            <p className="duo-card text-sm text-slate-500">Sem trabalhos para hoje. Bom ritmo 👏</p>
          ) : (
            data.todayHomework.map((h) => (
              <article key={h.id} className="duo-card flex items-center justify-between rounded-2xl p-3.5">
                <div>
                  <p className="font-semibold text-slate-900">{h.title}</p>
                  <p className="text-sm text-slate-600">
                    {h.subject?.name ?? "Sem disciplina"} ·{" "}
                    {new Date(h.dueAt).toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className={`duo-badge ${statusTone[h.status] ?? "bg-slate-100 text-slate-700"}`}>
                  {h.status.replace("_", " ")}
                </span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <article className="duo-card border-[#f2e4b7] bg-[#fff9e8]">
          <h3 className="font-semibold text-amber-900">Algo difícil hoje?</h3>
          <p className="mt-1 text-sm text-amber-900/80">
            Conta ao professor ou aos pais - vamos ajudar-te. Sem stress.
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/aluno/dificuldades" className="duo-btn bg-amber-500 hover:bg-amber-600">
              Partilhar dificuldade
            </Link>
            <Link href="/aluno" className="duo-btn-soft">
              Mais tarde
            </Link>
          </div>
        </article>

        <article className="duo-card">
          <h3 className="font-semibold text-slate-900">Esta semana</h3>
          <div className="mt-3 grid grid-cols-7 items-end gap-1.5">
            {data.weekCounts.map((n, i) => (
              <div key={weekday[i]} className="flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-lg bg-orange-400"
                  style={{ height: `${Math.max(16, n * 14)}px`, opacity: n === 0 ? 0.25 : 1 }}
                />
                <span className="text-[11px] text-slate-500">{weekday[i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            {data.thisWeekTotal} blocos esta semana · meta {data.weeklyGoal}
          </p>
        </article>
      </section>
    </div>
  );
}
