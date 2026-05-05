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

const statusStyles: Record<string, string> = {
  PENDENTE: "bg-amber-100 text-amber-900",
  EM_CURSO: "bg-sky-100 text-sky-900",
  CONCLUIDO: "bg-lime-100 text-lime-900",
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

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Novo trabalho</h2>
        <form action={createHomeworkFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Título
            <input name="title" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Disciplina (opcional)
            <select name="subjectId" className="duo-select">
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
            <input name="dueAt" type="datetime-local" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Observações (opcional)
            <input name="notes" className="duo-input" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="duo-btn">
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
                className="duo-card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
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
                  <p
                    className={`duo-badge mt-2 ${statusStyles[h.status] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {statusLabels[h.status] ?? h.status}
                  </p>
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
                      className="duo-select mt-0 min-w-[140px] py-1"
                    >
                      <option value="PENDENTE">Pendente</option>
                      <option value="EM_CURSO">Em curso</option>
                      <option value="CONCLUIDO">Concluído</option>
                    </select>
                    <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm text-teal-700">
                      Guardar
                    </button>
                  </form>
                  <form action={deleteHomeworkFormAction}>
                    <input type="hidden" name="id" value={h.id} />
                    <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm text-red-600">
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
