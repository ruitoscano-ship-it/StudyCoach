import { ErrorBanner } from "@/components/error-banner";
import {
  createStudentActionLogFormAction,
  getStudentProfile,
  listStudentActionLogs,
  updateStudentProfileFormAction,
} from "@/app/actions/student-data";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function PerfilPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [profile, logs] = await Promise.all([getStudentProfile(), listStudentActionLogs()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="duo-page-title">Perfil e ações</h1>
        <p className="mt-1 text-sm text-slate-600">
          Mantém os teus dados atualizados e regista as ações que estás a tomar.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Os meus dados</h2>
        <form action={updateStudentProfileFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Nome
            <input name="name" defaultValue={profile?.name ?? ""} required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Email
            <input value={profile?.email ?? ""} disabled className="duo-input bg-slate-50 text-slate-500" />
          </label>
          <label className="text-sm text-slate-700">
            Ano
            <input
              name="gradeYear"
              type="number"
              min={1}
              max={12}
              defaultValue={profile?.gradeYear ?? ""}
              className="duo-input"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Meta semanal (blocos)
            <input
              name="studyWeeklyGoal"
              type="number"
              min={1}
              max={60}
              defaultValue={profile?.studyWeeklyGoal ?? 15}
              className="duo-input"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="duo-btn">
              Guardar perfil
            </button>
          </div>
        </form>
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Registar ação</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ex.: “Revisei frações durante 30 minutos”, “Pedi ajuda no exercício 5”.
        </p>
        <form action={createStudentActionLogFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Ação
            <input
              name="title"
              required
              placeholder="Ex.: Fiz 20 exercícios de Matemática"
              className="duo-input"
            />
          </label>
          <label className="text-sm text-slate-700 sm:col-span-2">
            Notas (opcional)
            <textarea
              name="notes"
              rows={3}
              placeholder="O que correu bem, o que foi difícil, o que falta..."
              className="duo-textarea"
            />
          </label>
          <label className="text-sm text-slate-700">
            Data e hora (opcional)
            <input name="happenedAt" type="datetime-local" className="duo-input" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="duo-btn">
              Registar ação
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">Histórico de ações</h2>
        {logs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não registaste ações.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="duo-card">
                <p className="font-medium text-slate-900">{log.title}</p>
                {log.notes ? <p className="mt-1 text-sm text-slate-700">{log.notes}</p> : null}
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(log.happenedAt).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
