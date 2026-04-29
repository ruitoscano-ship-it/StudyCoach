import { ErrorBanner } from "@/components/error-banner";
import {
  createMarkFormAction,
  createSubjectFormAction,
  deleteMarkFormAction,
  deleteSubjectFormAction,
  listMarks,
  listSubjects,
} from "@/app/actions/student-data";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NotasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [subjects, marks] = await Promise.all([listSubjects(), listMarks()]);

  const bySubject = subjects.map((s) => {
    const ms = marks.filter((m) => m.subjectId === s.id);
    const wSum = ms.reduce((a, m) => a + m.weight, 0);
    const avg =
      ms.length > 0 && wSum > 0
        ? ms.reduce(
            (a, m) => a + (m.value / m.maxValue) * 20 * m.weight,
            0,
          ) / wSum
        : null;
    return { subject: s, marks: ms, avg };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Disciplinas e médias (ponderação por peso). Escala por defeito 0–20.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Nova disciplina</h2>
        <form action={createSubjectFormAction} className="mt-3 flex flex-wrap gap-2">
          <input
            name="name"
            placeholder="Ex.: Matemática"
            required
            className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Adicionar
          </button>
        </form>
      </section>

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">Adiciona uma disciplina para começar a registar notas.</p>
      ) : (
        <div className="space-y-6">
          {bySubject.map(({ subject, marks: ms, avg }) => (
            <section
              key={subject.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{subject.name}</h2>
                  {avg !== null && (
                    <p className="text-sm text-slate-600">
                      Média aproximada:{" "}
                      <span className="font-semibold tabular-nums text-teal-800">
                        {avg.toFixed(1)} / 20
                      </span>
                    </p>
                  )}
                </div>
                <form action={deleteSubjectFormAction}>
                  <input type="hidden" name="id" value={subject.id} />
                  <button type="submit" className="text-xs text-red-600 hover:underline">
                    Remover disciplina
                  </button>
                </form>
              </div>

              <ul className="mt-4 divide-y divide-slate-100">
                {ms.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span className="text-slate-600">
                      {new Date(m.date).toLocaleDateString("pt-PT")} · {m.type}
                    </span>
                    <span className="font-medium tabular-nums">
                      {m.value}/{m.maxValue}
                    </span>
                    <form action={deleteMarkFormAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="text-xs text-red-600 hover:underline">
                        Apagar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>

              <form action={createMarkFormAction} className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <input type="hidden" name="subjectId" value={subject.id} />
                <label className="text-xs text-slate-600">
                  Data
                  <input
                    name="date"
                    type="date"
                    required
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Nota
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Máx. (defeito 20)
                  <input
                    name="maxValue"
                    type="number"
                    step="0.01"
                    placeholder="20"
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Tipo
                  <select
                    name="type"
                    className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="TESTE">Teste</option>
                    <option value="TRABALHO">Trabalho</option>
                    <option value="ORAL">Oral</option>
                    <option value="PROJETO">Projeto</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </label>
                <label className="col-span-full text-xs text-slate-600 sm:col-span-2">
                  Observações (opcional)
                  <input name="notes" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                </label>
                <div className="col-span-full sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                  >
                    Registar nota
                  </button>
                </div>
              </form>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
