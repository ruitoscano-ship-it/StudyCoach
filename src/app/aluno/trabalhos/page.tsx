import { ErrorBanner } from "@/components/error-banner";
import {
  createHomeworkFormAction,
  deleteHomeworkFormAction,
  listHomework,
  listSubjects,
  updateHomeworkStatusFormAction,
} from "@/app/actions/student-data";

type Props = { searchParams: Promise<{ error?: string }> };

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_CURSO: "Em curso",
  CONCLUIDO: "Concluído",
};

export default async function TrabalhosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [subjects, homeworks] = await Promise.all([listSubjects(), listHomework()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trabalhos de casa</h1>
        <p className="mt-1 text-sm text-slate-600">Prazos e estado de cada trabalho.</p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Novo trabalho</h2>
        <form action={createHomeworkFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Título
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
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
          <label className="text-sm text-slate-700">
            Entrega
            <input
              name="dueAt"
              type="datetime-local"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Observações (opcional)
            <input name="notes" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Adicionar
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Lista</h2>
        {homeworks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não há trabalhos.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {homeworks.map((h) => (
              <li
                key={h.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{h.title}</p>
                  <p className="text-sm text-slate-600">
                    {h.subject?.name ?? "Sem disciplina"} ·{" "}
                    {new Date(h.dueAt).toLocaleString("pt-PT", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-xs text-slate-500">{statusLabels[h.status] ?? h.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form
                    action={updateHomeworkStatusFormAction}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="id" value={h.id} />
                    <select
                      name="status"
                      defaultValue={h.status}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_CURSO">Em curso</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                    <button type="submit" className="text-sm text-teal-700 hover:underline">
                      Guardar
                    </button>
                  </form>
                  <form action={deleteHomeworkFormAction}>
                    <input type="hidden" name="id" value={h.id} />
                    <button type="submit" className="text-sm text-red-600 hover:underline">
                      Apagar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
