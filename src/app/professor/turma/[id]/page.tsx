import Link from "next/link";
import { notFound } from "next/navigation";
import { ErrorBanner } from "@/components/error-banner";
import {
  addHomeworkCommentByTeacherFormAction,
  assignHomeworkFormAction,
  createStudyProgramFormAction,
  enrollStudentByEmailFormAction,
  getClassDetail,
  listClassDifficulties,
  listClassQuestions,
  replyToStudentQuestionFormAction,
  setGoalForStudentInClassFormAction,
} from "@/app/actions/class";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type HomeworkStatus = "PENDENTE" | "EM_CURSO" | "CONCLUIDO";

function statusLabel(status: HomeworkStatus) {
  if (status === "CONCLUIDO") return "Concluido";
  if (status === "EM_CURSO") return "Em curso";
  return "Pendente";
}

function statusBadgeClass(status: HomeworkStatus) {
  if (status === "CONCLUIDO") return "bg-emerald-100 text-emerald-700";
  if (status === "EM_CURSO") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
}

function initials(name: string) {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

function relativeDueLabel(dueAt: Date, status: HomeworkStatus) {
  if (status === "CONCLUIDO") return "entregue";
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.ceil((dueAt.getTime() - Date.now()) / dayMs);
  if (diffDays < 0) return `${Math.abs(diffDays)} d atraso`;
  if (diffDays === 0) return "hoje";
  return `${diffDays} d`;
}

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
  const questions = await listClassQuestions(id);
  const totalStudents = cls.enrollments.length;
  const activeHomeworks = cls.homeworks.filter((h) => h.status !== "CONCLUIDO").length;

  const rows = cls.enrollments
    .map((enrollment) => {
      const studentName = enrollment.student.name ?? enrollment.student.email;
      const studentHomeworks = cls.homeworks.filter((h) => h.studentUserId === enrollment.student.id);
      const completed = studentHomeworks.filter((h) => h.status === "CONCLUIDO").length;
      const progressPct =
        studentHomeworks.length === 0 ? 0 : Math.round((completed / studentHomeworks.length) * 100);
      const latestHomework = studentHomeworks[0] ?? null;

      return {
        id: enrollment.id,
        studentName,
        grade: enrollment.student.gradeYear,
        initials: initials(studentName),
        progressPct,
        latestHomework,
      };
    })
    .sort((a, b) => b.progressPct - a.progressPct);

  return (
    <div className="space-y-6">
      <Link href="/professor" className="duo-btn-soft inline-flex w-fit px-3 py-1.5 text-sm text-teal-900">
        ← Turmas
      </Link>

      <section className="duo-card space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              Turmas / {cls.name}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">
              {cls.year}.º ano · {cls.school?.name ?? "Sem escola"}
            </p>
            <h1 className="mt-2 duo-page-title">
              {totalStudents} alunos, {activeHomeworks} TPC ativos
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Código de entrada da turma:{" "}
              <code className="rounded-lg border border-[#e7e1d8] bg-[#faf7f3] px-2 py-0.5 text-sm">
                {cls.inviteCode}
              </code>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="duo-btn-soft rounded-full px-6 py-2.5">
              Exportar
            </button>
            <button type="button" className="duo-btn-soft rounded-full px-6 py-2.5">
              Plano da turma
            </button>
            <button type="button" className="duo-btn rounded-full px-6 py-2.5">
              Novo TPC
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[#e9e2d9] pb-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e9e2d9] bg-white px-3 py-1.5 font-semibold text-slate-800">
            Alunos <span className="rounded-full bg-[#f3eee7] px-2 py-0.5 text-xs">{totalStudents}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-500">
            TPC <span className="rounded-full bg-[#f3eee7] px-2 py-0.5 text-xs">{cls.homeworks.length}</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-500">
            Plano
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent px-3 py-1.5 text-slate-500">
            Pedidos de ajuda{" "}
            <span className="rounded-full bg-[#f3eee7] px-2 py-0.5 text-xs">{difficulties.length}</span>
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e9e2d9] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#faf7f3] text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Aluno</th>
                <th className="px-4 py-3 font-medium">Progresso semanal</th>
                <th className="px-4 py-3 font-medium">Sequencia</th>
                <th className="px-4 py-3 font-medium">Ultimo TPC</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum aluno entrou ainda com o codigo da turma.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-[#f0ebe3] align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                          {row.initials}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{row.studentName}</p>
                          {row.grade ? (
                            <p className="text-xs text-slate-500">{row.grade}.º ano</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-44 rounded-full bg-[#ece7df]">
                          <div
                            className="h-2 rounded-full bg-[#ff6b4a]"
                            style={{ width: `${Math.max(row.progressPct, 6)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.progressPct}%{" "}
                      {row.latestHomework
                        ? `· ${relativeDueLabel(row.latestHomework.dueAt, row.latestHomework.status)}`
                        : "· sem tarefas"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.latestHomework ? (
                        <>
                          {row.latestHomework.subject?.name ?? "TPC"} · {row.latestHomework.title}
                        </>
                      ) : (
                        "Sem TPC"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.latestHomework ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(row.latestHomework.status)}`}
                        >
                          {statusLabel(row.latestHomework.status)}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Sem atividade
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ErrorBanner message={sp.error} />

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Alunos inscritos</h2>
        <form action={enrollStudentByEmailFormAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="classId" value={cls.id} />
          <label className="text-sm text-slate-700">
            Email do aluno
            <input
              name="email"
              type="email"
              required
              placeholder="aluno@escola.pt"
              className="duo-input mt-1 min-w-[260px]"
            />
          </label>
          <button type="submit" className="duo-btn-soft px-4 py-2">
            Inscrever aluno
          </button>
        </form>
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

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Trabalho para a turma</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cria uma cópia do trabalho para cada aluno inscrito.
        </p>
        <form action={assignHomeworkFormAction} className="mt-4 grid gap-3">
          <input type="hidden" name="classId" value={cls.id} />
          <label className="text-sm text-slate-700">
            Título
            <input name="title" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Disciplina (opcional, cria disciplina da turma)
            <input name="subjectName" placeholder="Ex.: Português" className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Entrega
            <input name="dueAt" type="datetime-local" required className="duo-input" />
          </label>
          <label className="text-sm text-slate-700">
            Notas (opcional)
            <input name="notes" className="duo-input" />
          </label>
          <button type="submit" className="duo-btn w-fit bg-teal-600 hover:bg-teal-700">
            Atribuir a todos
          </button>
        </form>
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">
          Programa de estudo e agendamento
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Cria um programa para um aluno e adiciona logo uma sessão ao plano semanal dele.
        </p>
        {cls.enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Adiciona alunos à turma para poderes criar programas.
          </p>
        ) : (
          <form action={createStudyProgramFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="classId" value={cls.id} />
            <label className="text-sm text-slate-700 sm:col-span-2">
              Aluno
              <select name="studentUserId" required className="duo-select">
                <option value="">Selecionar aluno</option>
                {cls.enrollments.map((e) => (
                  <option key={e.id} value={e.student.id}>
                    {e.student.name ?? e.student.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 sm:col-span-2">
              Título do programa
              <input
                name="title"
                required
                placeholder="Ex.: Revisão de Matemática para teste"
                className="duo-input"
              />
            </label>
            <label className="text-sm text-slate-700">
              Disciplina (opcional)
              <input name="subjectName" placeholder="Ex.: Matemática" className="duo-input" />
            </label>
            <label className="text-sm text-slate-700">
              Notas (opcional)
              <input name="notes" placeholder="Objetivos e foco da sessão" className="duo-input" />
            </label>
            <label className="text-sm text-slate-700">
              Início da sessão
              <input name="startAt" type="datetime-local" required className="duo-input" />
            </label>
            <label className="text-sm text-slate-700">
              Fim da sessão
              <input name="endAt" type="datetime-local" required className="duo-input" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="duo-btn w-fit bg-teal-600 hover:bg-teal-700">
                Criar programa e agendar
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Definir objetivo por aluno</h2>
        <p className="mt-1 text-sm text-slate-600">
          O objetivo fica disponível no espaço do aluno para acompanhamento semanal.
        </p>
        {cls.enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Adiciona alunos para começares a definir metas.</p>
        ) : (
          <form action={setGoalForStudentInClassFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="classId" value={cls.id} />
            <label className="text-sm text-slate-700 sm:col-span-2">
              Aluno
              <select name="studentUserId" required className="duo-select">
                <option value="">Selecionar aluno</option>
                {cls.enrollments.map((e) => (
                  <option key={e.id} value={e.student.id}>
                    {e.student.name ?? e.student.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-700 sm:col-span-2">
              Objetivo
              <input name="title" required className="duo-input" placeholder="Ex.: Melhorar média para 14 valores" />
            </label>
            <label className="text-sm text-slate-700">
              Data alvo (opcional)
              <input name="targetDate" type="date" className="duo-input" />
            </label>
            <label className="text-sm text-slate-700">
              Disciplina (opcional)
              <input name="subjectName" className="duo-input" placeholder="Ex.: Matemática" />
            </label>
            <label className="text-sm text-slate-700 sm:col-span-2">
              Descrição (opcional)
              <input name="description" className="duo-input" placeholder="Critérios de sucesso e passos sugeridos" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="duo-btn w-fit">
                Guardar objetivo
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">
          Dificuldades partilhadas pelos alunos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Só aparecem entradas em que o aluno marcou partilha com o professor. Podes converter cada dificuldade
          em ações concretas com um programa de estudo, comentário num TPC, ou meta personalizada.
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

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Perguntas dos alunos</h2>
        <p className="mt-1 text-sm text-slate-600">Responde às dúvidas e deixa histórico da orientação dada.</p>
        {questions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sem perguntas nesta turma.</p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{q.student.name ?? q.student.email}</p>
                <p className="mt-1 text-slate-800">{q.question}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {q.homework?.title ? `TPC: ${q.homework.title} · ` : ""}
                  {q.status === "RESPONDIDA" ? "Respondida" : "Aberta"}
                </p>
                {q.reply ? (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                    Resposta: {q.reply}
                  </p>
                ) : null}
                {q.status === "ABERTA" ? (
                  <form action={replyToStudentQuestionFormAction} className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="classId" value={cls.id} />
                    <input type="hidden" name="questionId" value={q.id} />
                    <input
                      name="reply"
                      required
                      placeholder="Responder ao aluno..."
                      className="duo-input mt-0 min-w-[280px] flex-1"
                    />
                    <button type="submit" className="duo-btn-soft px-3 py-2 text-sm">
                      Responder
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="duo-card">
        <h2 className="text-base font-semibold text-slate-900">Comentário ao trabalho dos alunos</h2>
        {cls.homeworks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não há TPC para comentar.</p>
        ) : (
          <>
            <form action={addHomeworkCommentByTeacherFormAction} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="classId" value={cls.id} />
              <label className="text-sm text-slate-700 sm:col-span-2">
                Trabalho
                <select name="homeworkId" required className="duo-select">
                  <option value="">Selecionar TPC</option>
                  {cls.homeworks.map((hw) => (
                    <option key={hw.id} value={hw.id}>
                      {hw.title} · {hw.subject?.name ?? "Sem disciplina"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-700 sm:col-span-2">
                Comentário
                <input name="comment" required className="duo-input" placeholder="Feedback específico e próximo passo" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="duo-btn-soft px-4 py-2">
                  Guardar comentário
                </button>
              </div>
            </form>

            <ul className="mt-4 space-y-2 text-sm">
              {cls.homeworks
                .filter((hw) => hw.comments.length > 0)
                .slice(0, 10)
                .map((hw) => (
                  <li key={hw.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{hw.title}</p>
                    {hw.comments.slice(0, 2).map((comment) => (
                      <p key={comment.id} className="mt-1 text-slate-700">
                        {comment.author.name ?? "Professor"}: {comment.comment}
                      </p>
                    ))}
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
