import { ErrorBanner } from "@/components/error-banner";
import {
  createDifficultyFormAction,
  deleteDifficultyFormAction,
  listDifficulties,
  listSubjects,
} from "@/app/actions/student-data";

type Props = { searchParams: Promise<{ error?: string }> };

const sev: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export default async function DificuldadesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [subjects, difficulties] = await Promise.all([listSubjects(), listDifficulties()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dificuldades</h1>
        <p className="mt-1 text-sm text-slate-600">
          Regista o que te custa mais. Podes partilhar com o encarregado de educação ou com o
          professor (da turma).
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Novo registo</h2>
        <form action={createDifficultyFormAction} className="mt-4 space-y-4">
          <label className="block text-sm text-slate-700">
            Descrição
            <textarea
              name="description"
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Disciplina (opcional)
            <select name="subjectId" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="">—</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Gravidade
            <select name="severity" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </label>
          <div className="flex flex-col gap-2 text-sm text-slate-800">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="shareWithParent" className="h-4 w-4 rounded" />
              Partilhar com encarregado de educação
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="shareWithTeacher" className="h-4 w-4 rounded" />
              Partilhar com professor (turma)
            </label>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Guardar
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Os teus registos</h2>
        {difficulties.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não há registos.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {difficulties.map((d) => (
              <li key={d.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-slate-900">{d.description}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {d.subject?.name ?? "Sem disciplina"} · {sev[d.severity] ?? d.severity}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {d.shareWithParent ? "Partilhado com encarregado · " : ""}
                  {d.shareWithTeacher ? "Partilhado com professor" : ""}
                  {!d.shareWithParent && !d.shareWithTeacher ? "Só tu vês" : ""}
                </p>
                <form action={deleteDifficultyFormAction} className="mt-2">
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Apagar
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
