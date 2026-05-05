import Link from "next/link";
import { ErrorBanner } from "@/components/error-banner";
import {
  createStudyBlockFormAction,
  deleteStudyBlockFormAction,
  listHomework,
  listStudyBlocks,
} from "@/app/actions/student-data";
import { addDays, parseWeekStartParam, toYmd } from "@/lib/dates";

type Props = {
  searchParams: Promise<{ error?: string; weekStart?: string }>;
};

export default async function PlanoPage({ searchParams }: Props) {
  const sp = await searchParams;
  const weekStart = parseWeekStartParam(sp.weekStart);
  const rangeEnd = addDays(weekStart, 7);
  rangeEnd.setHours(0, 0, 0, 0);

  const [blocks, homeworks] = await Promise.all([
    listStudyBlocks({
      start: weekStart.toISOString(),
      end: rangeEnd.toISOString(),
    }),
    listHomework(),
  ]);

  const prev = addDays(weekStart, -7);
  const next = addDays(weekStart, 7);
  const weekLabel = `${toYmd(weekStart)} — ${toYmd(addDays(weekStart, 6))}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="duo-page-title">Plano de estudo</h1>
        <p className="mt-1 text-sm text-slate-600">Blocos desta semana (segunda a domingo).</p>
      </div>
      <ErrorBanner message={sp.error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/aluno/plano?weekStart=${toYmd(prev)}`}
          className="duo-btn-soft px-3 py-2 text-sm"
        >
          ← Semana anterior
        </Link>
        <p className="text-sm font-medium text-slate-800">{weekLabel}</p>
        <Link
          href={`/aluno/plano?weekStart=${toYmd(next)}`}
          className="duo-btn-soft px-3 py-2 text-sm"
        >
          Próxima semana →
        </Link>
      </div>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Novo bloco</h2>
        <form action={createStudyBlockFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="weekStart" value={toYmd(weekStart)} />
          <label className="text-sm text-slate-700 sm:col-span-2">
            Título
            <input name="title" required placeholder="Ex.: Estudo Matemática" className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Início
            <input name="startAt" type="datetime-local" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Fim
            <input name="endAt" type="datetime-local" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Ligar a trabalho (opcional)
            <select name="homeworkId" className="duo-select">
              <option value="">—</option>
              {homeworks.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="duo-btn">
              Adicionar bloco
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Esta semana</h2>
        {blocks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sem blocos nesta semana.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="duo-card flex flex-col justify-between gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium text-slate-900">{b.title}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(b.startAt).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}{" "}
                    —{" "}
                    {new Date(b.endAt).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  {b.homework ? (
                    <p className="text-xs text-slate-500">Trabalho: {b.homework.title}</p>
                  ) : null}
                </div>
                <form action={deleteStudyBlockFormAction}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="weekStart" value={toYmd(weekStart)} />
                  <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm text-red-600">
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
