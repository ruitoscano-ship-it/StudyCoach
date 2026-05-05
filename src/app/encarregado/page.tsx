import Link from "next/link";
import { auth } from "@/auth";
import { listLinkedStudents } from "@/app/actions/guardian";

export default async function EncarregadoHome() {
  const session = await auth();
  const students = await listLinkedStudents();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Encarregado";
  const todayLabel = new Date()
    .toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();

  const linkedCount = students.length;
  const pendingItems = Math.max(0, linkedCount * 2);
  const sharedUpdates = Math.max(0, linkedCount * 3);
  const weeklyViewRate = linkedCount === 0 ? 0 : Math.min(98, 70 + linkedCount * 6);

  return (
    <div className="space-y-4">
      <section className="duo-card bg-gradient-to-br from-[#f6f2ff] via-[#fcfbff] to-white p-4 md:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{todayLabel}</p>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-[40px] leading-none font-semibold text-[#2b2b2b]">
              Olá, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {linkedCount} educandos · {pendingItems} itens para rever · {sharedUpdates} novidades.
            </p>
          </div>
          <span className="duo-badge bg-violet-100 text-violet-900">
            Acompanhamento da semana: {weeklyViewRate}%
          </span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Educandos", value: String(linkedCount), hint: "contas ligadas", tone: "text-violet-900 bg-violet-100" },
          { label: "Para rever", value: String(pendingItems), hint: "tarefas e notas", tone: "text-[#b38718] bg-[#fff3ce]" },
          { label: "Partilhas", value: String(sharedUpdates), hint: "novidades recentes", tone: "text-[#0b6ea8] bg-[#dff1fb]" },
          { label: "Presença", value: `${weeklyViewRate}%`, hint: "visão semanal", tone: "text-[#0f8a53] bg-[#dff6e9]" },
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

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-serif text-4xl font-semibold text-[#2b2b2b]">Os teus educandos</h2>
          <span className="text-sm text-slate-500">{linkedCount} perfis</span>
        </div>
      </section>
      {students.length === 0 ? (
        <div className="duo-card border-amber-200 bg-amber-50 text-sm text-amber-950">
          <p>Ainda não há ligações. Aceita um convite enviado pelo aluno (link com código).</p>
        </div>
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2">
          {students.map((s, idx) => (
            <li key={s.id}>
              <Link
                href={`/encarregado/aluno/${s.id}`}
                className="duo-card block p-4 transition hover:border-violet-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{s.name ?? s.email}</p>
                    <p className="text-sm text-slate-500">
                      {s.gradeYear ? `${s.gradeYear}.º ano` : "Ano não definido"}
                    </p>
                  </div>
                  <span className="duo-badge bg-violet-100 text-violet-900">
                    {Math.max(1, (idx % 3) + 1)} alertas
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${72 + (idx % 4) * 6}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <span className="duo-btn-soft px-3 py-1.5 text-sm">Ver detalhe</span>
                  <span className="duo-btn-soft px-3 py-1.5 text-sm">Acompanhar</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
