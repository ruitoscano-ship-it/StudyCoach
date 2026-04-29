import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/error-banner";
import {
  assignHomeworkFormAction,
  getClassDetail,
  listClassDifficulties,
} from "@/app/actions/class";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function TurmaDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  let cls;
  try {
    cls = await getClassDetail(id);
  } catch {
    notFound();
  }
  if (!cls) notFound();

  const difficulties = await listClassDifficulties(id);

  return (
    <div className="space-y-8">
      <Link href="/professor" className="text-sm text-teal-700 hover:underline">
        ← Turmas
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {cls.name} · {cls.year}.º ano
        </h1>
        {cls.school ? (
          <p className="text-sm text-slate-600">{cls.school.name}</p>
        ) : null}
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium">Código para alunos:</span>{" "}
          <code className="rounded bg-slate-100 px-2 py-0.5 text-sm">{cls.inviteCode}</code>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Os alunos colam este código em «Turma» na área de aluno.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Alunos inscritos</h2>
        {cls.enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nenhum aluno entrou ainda com o código.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {cls.enrollments.map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span>{e.student.name ?? e.student.email}</span>
                {e.student.gradeYear ? (
                  <span className="text-slate-600">{e.student.gradeYear}.º ano</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Trabalho para a turma</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cria uma cópia do trabalho para cada aluno inscrito.
        </p>
        <form action={assignHomeworkFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="classId" value={cls.id} />
          <label className="text-sm text-slate-700">
            Título
            <input
              name="title"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Disciplina (opcional, cria disciplina da turma)
            <input
              name="subjectName"
              placeholder="Ex.: Português"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
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
          <label className="text-sm text-slate-700">
            Notas (opcional)
            <input name="notes" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <button
            type="submit"
            className="w-fit rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Atribuir a todos
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          Dificuldades partilhadas pelos alunos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Só aparecem entradas em que o aluno marcou partilha com o professor.
        </p>
        {difficulties.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Nada a mostrar.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {difficulties.map((d) => (
              <li key={d.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="font-medium text-slate-900">{d.student.name ?? d.student.id}</p>
                <p className="text-slate-800">{d.description}</p>
                <p className="text-slate-600">
                  {d.subject?.name ?? "—"} · {d.severity}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
