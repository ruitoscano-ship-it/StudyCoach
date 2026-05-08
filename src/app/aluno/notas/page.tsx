import { ErrorBanner } from "@/components/error-banner";
import {
  createMarkFormAction,
  createSubjectFormAction,
  deleteMarkFormAction,
  deleteSubjectFormAction,
  getStudentBenchmarkBySubject,
  listMarks,
  listSubjects,
} from "@/app/actions/student-data";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NotasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [subjects, marks, benchmarks] = await Promise.all([
    listSubjects(),
    listMarks(),
    getStudentBenchmarkBySubject(5),
  ]);
  const benchmarkByName = new Map(benchmarks.map((b) => [b.subjectNameKey, b]));

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
    const benchmark = benchmarkByName.get(s.name.trim().toLowerCase()) ?? null;
    return { subject: s, marks: ms, avg, benchmark };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="duo-page-title">Notas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Disciplinas e médias (ponderação por peso). Escala por defeito 0–20.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Nova disciplina</h2>
        <form action={createSubjectFormAction} className="mt-3 flex flex-wrap gap-2">
          <input
            name="name"
            placeholder="Ex.: Matemática"
            required
            className="duo-input mt-0 min-w-[200px] flex-1"
          />
          <button type="submit" className="duo-btn">
            Adicionar
          </button>
        </form>
      </section>

      {subjects.length === 0 ? (
        <p className="text-sm text-slate-500">Adiciona uma disciplina para começar a registar notas.</p>
      ) : (
        <div className="space-y-4">
          {bySubject.map(({ subject, marks: ms, avg, benchmark }) => (
            <section
              key={subject.id}
              className="duo-card"
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
                  {benchmark && benchmark.cohortAvg20 !== null && avg !== null ? (
                    <p className="text-sm text-slate-600">
                      Comparação com média ({benchmark.cohortSize} alunos):{" "}
                      <span className="font-semibold tabular-nums text-slate-900">
                        {benchmark.cohortAvg20.toFixed(1)} / 20
                      </span>{" "}
                      ·{" "}
                      <span
                        className={`font-semibold ${
                          avg - benchmark.cohortAvg20 >= 0 ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {avg - benchmark.cohortAvg20 >= 0 ? "+" : ""}
                        {(avg - benchmark.cohortAvg20).toFixed(1)}
                      </span>
                    </p>
                  ) : benchmark && benchmark.cohortSize > 0 && benchmark.cohortSize < 5 ? (
                    <p className="text-xs text-slate-500">
                      Comparação indisponível (precisa de pelo menos 5 alunos com notas nesta disciplina).
                    </p>
                  ) : null}
                </div>
                <form action={deleteSubjectFormAction}>
                  <input type="hidden" name="id" value={subject.id} />
                  <button type="submit" className="duo-btn-soft px-3 py-1 text-xs text-red-600">
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
                      <button type="submit" className="duo-btn-soft px-3 py-1 text-xs text-red-600">
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
                    className="duo-input py-1.5"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Nota
                  <input
                    name="value"
                    type="number"
                    step="0.01"
                    required
                    className="duo-input py-1.5"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Máx. (defeito 20)
                  <input
                    name="maxValue"
                    type="number"
                    step="0.01"
                    placeholder="20"
                    className="duo-input py-1.5"
                  />
                </label>
                <label className="text-xs text-slate-600">
                  Tipo
                  <select
                    name="type"
                    className="duo-select py-1.5"
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
                  <input name="notes" className="duo-input py-1.5" />
                </label>
                <div className="col-span-full sm:col-span-2">
                  <button type="submit" className="duo-btn">
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
