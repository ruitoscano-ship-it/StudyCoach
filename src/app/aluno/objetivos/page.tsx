import { ErrorBanner } from "@/components/error-banner";
import {
  addGoalStepFormAction,
  createGoalFormAction,
  deleteGoalFormAction,
  listGoals,
  listSubjects,
  toggleGoalStepDoneFormAction,
  updateGoalStatusFormAction,
} from "@/app/actions/student-data";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ObjetivosPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [goals, subjects] = await Promise.all([listGoals(), listSubjects()]);
  const activeGoals = goals.filter((g) => g.status === "ATIVO");
  const doneGoals = goals.filter((g) => g.status === "CONCLUIDO");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="duo-page-title">Objetivos e plano de melhoria</h1>
        <p className="mt-1 text-sm text-slate-600">
          Define metas, divide em passos e acompanha o que falta cumprir.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Novo objetivo</h2>
        <form action={createGoalFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Título
            <input
              name="title"
              required
              placeholder="Ex.: Subir Matemática para 16 valores"
              className="duo-input"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Descrição (opcional)
            <textarea
              name="description"
              rows={3}
              placeholder="Escreve o plano curto: o que vais melhorar e como."
              className="duo-textarea"
            />
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
            Data alvo (opcional)
            <input name="targetDate" type="date" className="duo-input" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="duo-btn">
              Guardar objetivo
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Objetivos ativos ({activeGoals.length})</h2>
        {activeGoals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não tens objetivos ativos.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {activeGoals.map((goal) => {
              const totalSteps = goal.steps.length;
              const doneSteps = goal.steps.filter((s) => s.done).length;
              const pct = totalSteps === 0 ? 0 : Math.round((doneSteps / totalSteps) * 100);
              return (
                <li key={goal.id} className="duo-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{goal.title}</p>
                      <p className="text-sm text-slate-600">
                        {goal.subject?.name ?? "Sem disciplina"} ·{" "}
                        {goal.targetDate
                          ? `Meta para ${new Date(goal.targetDate).toLocaleDateString("pt-PT")}`
                          : "Sem data alvo"}
                      </p>
                      {goal.description ? (
                        <p className="mt-1 text-sm text-slate-700">{goal.description}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <form action={updateGoalStatusFormAction}>
                        <input type="hidden" name="goalId" value={goal.id} />
                        <input type="hidden" name="status" value="CONCLUIDO" />
                        <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm">
                          Marcar concluído
                        </button>
                      </form>
                      <form action={deleteGoalFormAction}>
                        <input type="hidden" name="goalId" value={goal.id} />
                        <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm text-red-600">
                          Remover
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        {doneSteps}/{totalSteps} passos
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {goal.steps.length === 0 ? (
                      <p className="text-sm text-slate-500">Sem passos ainda. Adiciona o primeiro.</p>
                    ) : (
                      goal.steps.map((step) => (
                        <div key={step.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#eee7df] px-3 py-2">
                          <p className={`text-sm ${step.done ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {step.title}
                          </p>
                          <form action={toggleGoalStepDoneFormAction}>
                            <input type="hidden" name="stepId" value={step.id} />
                            <input type="hidden" name="done" value={step.done ? "false" : "true"} />
                            <button type="submit" className="duo-btn-soft px-3 py-1.5 text-xs">
                              {step.done ? "Reabrir" : "Concluir"}
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>

                  <form action={addGoalStepFormAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="goalId" value={goal.id} />
                    <input
                      name="title"
                      required
                      placeholder="Novo passo deste objetivo"
                      className="duo-input mt-0"
                    />
                    <button type="submit" className="duo-btn whitespace-nowrap">
                      Adicionar passo
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Objetivos concluídos ({doneGoals.length})</h2>
        {doneGoals.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum objetivo concluído ainda.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {doneGoals.map((goal) => (
              <li key={goal.id} className="duo-card flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{goal.title}</p>
                  <p className="text-sm text-slate-600">
                    {goal.subject?.name ?? "Sem disciplina"} ·{" "}
                    {goal.targetDate
                      ? `Meta: ${new Date(goal.targetDate).toLocaleDateString("pt-PT")}`
                      : "Sem data alvo"}
                  </p>
                </div>
                <form action={updateGoalStatusFormAction}>
                  <input type="hidden" name="goalId" value={goal.id} />
                  <input type="hidden" name="status" value="ATIVO" />
                  <button type="submit" className="duo-btn-soft px-3 py-1.5 text-sm">
                    Reativar
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
