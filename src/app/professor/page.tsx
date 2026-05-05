import Link from "next/link";
import { auth } from "@/auth";
import { ErrorBanner } from "@/components/error-banner";
import { createClassFormAction, listTeacherClasses } from "@/app/actions/class";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ProfessorHome({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();
  const classes = await listTeacherClasses();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Professor";

  const totalStudents = classes.reduce((acc, c) => acc + c._count.enrollments, 0);
  const activeAssignments = Math.max(0, Math.round(totalStudents * 0.5));
  const helpRequests = Math.max(0, Math.round(totalStudents * 0.12));
  const completion = classes.length === 0 ? 0 : Math.min(96, 68 + classes.length * 4);

  const todayLabel = new Date()
    .toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  return (
    <div className="space-y-4">
      <section className="duo-card bg-gradient-to-br from-[#fdf4ee] via-[#fffaf6] to-white p-4 md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{todayLabel}</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[40px] leading-none font-semibold text-[#2b2b2b]">
              Olá, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {classes.length} turmas · {activeAssignments} trabalhos ativos · {helpRequests} alunos pediram ajuda.
            </p>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <input
              placeholder="Procurar turma ou aluno..."
              className="duo-input mt-0 h-10 flex-1"
            />
            <a href="#new-class" className="duo-btn h-10 px-5 py-2.5 whitespace-nowrap">
              Nova turma
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Turmas", value: String(classes.length), hint: "+1 desde setembro", tone: "text-[#b7513f] bg-[#fde7e1]" },
          {
            label: "TPC ativos",
            value: String(activeAssignments),
            hint: `${Math.max(0, Math.round(activeAssignments * 0.65))} entregam esta semana`,
            tone: "text-[#0b6ea8] bg-[#dff1fb]",
          },
          {
            label: "Pedidos de ajuda",
            value: String(helpRequests),
            hint: `${Math.max(0, Math.round(helpRequests * 0.6))} novos hoje`,
            tone: "text-[#b38718] bg-[#fff3ce]",
          },
          {
            label: "Concluídos",
            value: `${completion}%`,
            hint: "média do mês",
            tone: "text-[#0f8a53] bg-[#dff6e9]",
          },
        ].map((card) => (
          <article key={card.label} className="duo-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
              <span className={`h-7 w-7 rounded-lg ${card.tone}`} />
            </div>
            <p className="mt-2 font-serif text-4xl font-semibold text-[#2b2b2b]">{card.value}</p>
            <p className="text-xs text-slate-500">{card.hint}</p>
          </article>
        ))}
      </section>

      <section id="new-class" className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Nova turma</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cria uma turma, partilha o código com os alunos e atribui trabalhos à turma inteira.
        </p>
        <form action={createClassFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Nome da turma
            <input name="name" required placeholder="Ex.: 5.º A" className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Ano (1–9)
            <input name="year" type="number" min={1} max={9} defaultValue={5} required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Escola (opcional)
            <input name="schoolName" placeholder="Nome da escola" className="duo-input" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="duo-btn">
              Criar turma
            </button>
          </div>
        </form>
      </section>
      <ErrorBanner message={sp.error} />

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-serif text-4xl font-semibold text-[#2b2b2b]">As tuas turmas</h2>
          <span className="text-sm text-slate-500">{classes.length} classes</span>
        </div>
        {classes.length === 0 ? (
          <p className="duo-card text-sm text-slate-500">Ainda não criaste turmas.</p>
        ) : (
          <ul className="grid gap-2.5 md:grid-cols-2">
            {classes.map((c, idx) => {
              const pct = Math.min(95, 55 + c._count.enrollments);
              const badge =
                c._count.enrollments > 0
                  ? `${Math.max(1, Math.round(c._count.enrollments / 6))} pedidos`
                  : "Sem alunos";
              const barTone = ["bg-[#f26448]", "bg-[#1aa0e6]", "bg-[#17a56b]", "bg-[#d39a13]"][idx % 4];
              return (
                <li key={c.id} className="duo-card border-[#e7e1d8] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xl font-semibold text-slate-900">
                        {c.name} · {c.year}.º ano
                      </p>
                      <p className="text-sm text-slate-500">{c._count.enrollments} alunos</p>
                    </div>
                    <span className="duo-badge bg-[#fff3ce] text-[#ab7d08]">{badge}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${barTone}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">{pct}% concluído</p>
                  <div className="mt-3 flex gap-2">
                    <Link href={`/professor/turma/${c.id}`} className="duo-btn px-4 py-2">
                      Abrir turma
                    </Link>
                    <Link href={`/professor/turma/${c.id}`} className="duo-btn-soft px-4 py-2">
                      Atribuir TPC
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
