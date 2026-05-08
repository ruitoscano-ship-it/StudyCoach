"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DifficultySeverity,
  HomeworkStatus,
  MarkType,
} from "@prisma/client";
type GoalStatusInput = "ATIVO" | "CONCLUIDO";

import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/authz";
import { addDays, startOfWeekMonday, toYmd } from "@/lib/dates";

function hasGoalModels() {
  const p = prisma as typeof prisma & { goal?: unknown; goalStep?: unknown };
  return Boolean(p.goal && p.goalStep);
}

function hasActionLogModel() {
  const p = prisma as typeof prisma & { studentActionLog?: unknown };
  return Boolean(p.studentActionLog);
}

function rev() {
  revalidatePath("/aluno");
  revalidatePath("/aluno/objetivos");
  revalidatePath("/aluno/perfil");
}

export async function listSubjects() {
  const session = await requireStudent();
  return prisma.subject.findMany({
    where: { studentUserId: session.user.id },
    orderBy: { name: "asc" },
  });
}

export async function createSubject(name: string) {
  const session = await requireStudent();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Indica o nome da disciplina.");
  await prisma.subject.create({
    data: { name: trimmed, studentUserId: session.user.id },
  });
  rev();
}

export async function deleteSubject(id: string) {
  const session = await requireStudent();
  const s = await prisma.subject.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!s) throw new Error("Disciplina não encontrada.");
  await prisma.subject.delete({ where: { id } });
  rev();
}

export async function listMarks() {
  const session = await requireStudent();
  return prisma.mark.findMany({
    where: { studentUserId: session.user.id },
    include: { subject: true },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function getStudentBenchmarkBySubject(minCohort = 5) {
  const session = await requireStudent();
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { gradeYear: true },
  });
  if (!me?.gradeYear) return [];

  const mySubjects = await prisma.subject.findMany({
    where: { studentUserId: session.user.id },
    select: { name: true },
  });
  const targetNames = Array.from(
    new Set(mySubjects.map((s) => s.name.trim().toLowerCase()).filter(Boolean)),
  );
  if (targetNames.length === 0) return [];

  const cohortMarks = await prisma.mark.findMany({
    where: {
      student: {
        role: "STUDENT",
        gradeYear: me.gradeYear,
      },
      subject: {
        name: { in: targetNames, mode: "insensitive" },
      },
    },
    include: {
      subject: { select: { name: true } },
      student: { select: { id: true } },
    },
    take: 5000,
  });

  const perSubjectPerStudent = new Map<string, Map<string, number[]>>();
  for (const mark of cohortMarks) {
    const key = mark.subject.name.trim().toLowerCase();
    if (!key) continue;
    const normalized20 = mark.maxValue > 0 ? (mark.value / mark.maxValue) * 20 : 0;
    const byStudent = perSubjectPerStudent.get(key) ?? new Map<string, number[]>();
    const marks = byStudent.get(mark.student.id) ?? [];
    marks.push(normalized20);
    byStudent.set(mark.student.id, marks);
    perSubjectPerStudent.set(key, byStudent);
  }

  return targetNames.map((subjectNameKey) => {
    const byStudent = perSubjectPerStudent.get(subjectNameKey) ?? new Map<string, number[]>();
    const studentAverages = Array.from(byStudent.entries()).map(([studentId, values]) => ({
      studentId,
      avg20:
        values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length,
    }));
    const withAvg = studentAverages.filter((entry) => entry.avg20 !== null) as Array<{
      studentId: string;
      avg20: number;
    }>;
    const cohortSize = withAvg.length;
    if (cohortSize < minCohort) {
      return {
        subjectNameKey,
        cohortSize,
        cohortAvg20: null as number | null,
        myAvg20: null as number | null,
      };
    }

    const peers = withAvg.filter((entry) => entry.studentId !== session.user.id);
    const pool = peers.length > 0 ? peers : withAvg;
    const cohortAvg20 = pool.reduce((sum, entry) => sum + entry.avg20, 0) / pool.length;
    const mine = withAvg.find((entry) => entry.studentId === session.user.id) ?? null;

    return {
      subjectNameKey,
      cohortSize,
      cohortAvg20,
      myAvg20: mine?.avg20 ?? null,
    };
  });
}

export async function createMark(data: {
  subjectId: string;
  date: string;
  value: number;
  maxValue?: number;
  type?: MarkType;
  notes?: string;
}) {
  const session = await requireStudent();
  const sub = await prisma.subject.findFirst({
    where: { id: data.subjectId, studentUserId: session.user.id },
  });
  if (!sub) throw new Error("Disciplina inválida.");
  await prisma.mark.create({
    data: {
      studentUserId: session.user.id,
      subjectId: data.subjectId,
      date: new Date(data.date),
      value: data.value,
      maxValue: data.maxValue ?? 20,
      type: data.type ?? "TESTE",
      notes: data.notes?.trim() || null,
    },
  });
  rev();
}

export async function deleteMark(id: string) {
  const session = await requireStudent();
  const m = await prisma.mark.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!m) throw new Error("Nota não encontrada.");
  await prisma.mark.delete({ where: { id } });
  rev();
}

export async function listHomework() {
  const session = await requireStudent();
  return prisma.homework.findMany({
    where: { studentUserId: session.user.id },
    include: { subject: true },
    orderBy: { dueAt: "asc" },
    take: 200,
  });
}

export async function createHomework(data: {
  title: string;
  subjectId?: string;
  dueAt: string;
  notes?: string;
}) {
  const session = await requireStudent();
  if (data.subjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: data.subjectId, studentUserId: session.user.id },
    });
    if (!sub) throw new Error("Disciplina inválida.");
  }
  await prisma.homework.create({
    data: {
      studentUserId: session.user.id,
      title: data.title.trim(),
      subjectId: data.subjectId || null,
      dueAt: new Date(data.dueAt),
      notes: data.notes?.trim() || null,
      status: "PENDENTE",
    },
  });
  rev();
}

export async function updateHomeworkStatus(id: string, status: HomeworkStatus) {
  const session = await requireStudent();
  const h = await prisma.homework.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!h) throw new Error("Trabalho não encontrado.");
  await prisma.homework.update({ where: { id }, data: { status } });
  rev();
}

export async function deleteHomework(id: string) {
  const session = await requireStudent();
  const h = await prisma.homework.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!h) throw new Error("Trabalho não encontrado.");
  await prisma.homework.delete({ where: { id } });
  rev();
}

export async function listStudentQuestions() {
  const session = await requireStudent();
  return prisma.studentQuestion.findMany({
    where: { studentUserId: session.user.id },
    include: {
      homework: { select: { id: true, title: true } },
      repliedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function createStudentQuestion(data: {
  homeworkId?: string;
  question: string;
}) {
  const session = await requireStudent();
  const question = data.question.trim();
  if (!question) throw new Error("Escreve a tua dúvida.");

  let homeworkId: string | null = null;
  if (data.homeworkId) {
    const homework = await prisma.homework.findFirst({
      where: { id: data.homeworkId, studentUserId: session.user.id },
      select: { id: true },
    });
    if (!homework) throw new Error("Trabalho inválido para esta dúvida.");
    homeworkId = homework.id;
  }

  await prisma.studentQuestion.create({
    data: {
      studentUserId: session.user.id,
      homeworkId,
      question,
      status: "ABERTA",
    },
  });
  rev();
}

export async function closeStudentQuestion(questionId: string) {
  const session = await requireStudent();
  const question = await prisma.studentQuestion.findFirst({
    where: { id: questionId, studentUserId: session.user.id },
    select: { id: true },
  });
  if (!question) throw new Error("Dúvida não encontrada.");

  await prisma.studentQuestion.update({
    where: { id: question.id },
    data: { status: "RESPONDIDA" },
  });
  rev();
}

export async function listHomeworkCommentsForStudent() {
  const session = await requireStudent();
  return prisma.homeworkComment.findMany({
    where: { homework: { studentUserId: session.user.id } },
    include: {
      homework: { select: { id: true, title: true } },
      author: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listStudyBlocks(range?: { start: string; end: string }) {
  const session = await requireStudent();
  const start = range?.start ? new Date(range.start) : undefined;
  const end = range?.end ? new Date(range.end) : undefined;
  return prisma.studyBlock.findMany({
    where: {
      studentUserId: session.user.id,
      ...(start && end
        ? {
            AND: [{ startAt: { lt: end } }, { endAt: { gt: start } }],
          }
        : {}),
    },
    include: { homework: true },
    orderBy: { startAt: "asc" },
    take: 500,
  });
}

export async function getStudentHomeDashboard() {
  const session = await requireStudent();
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endToday = addDays(startToday, 1);

  const weekStart = startOfWeekMonday(now);
  const weekEnd = addDays(weekStart, 7);

  const monthAgo = addDays(startToday, -30);

  // Use $queryRaw for profile fields so a stale Webpack-bundled Prisma Client
  // (missing newer User columns) does not throw PrismaClientValidationError.
  let profileRows: Array<{ name: string | null; studyWeeklyGoal: number }> = [];
  let todayBlocks: Array<{
    endAt: Date;
    startAt: Date;
    title: string;
    homework: { subject: { name: string } | null } | null;
  }> = [];
  let nextBlock: {
    endAt: Date;
    startAt: Date;
    title: string;
    homework: { subject: { name: string } | null } | null;
  } | null = null;
  let todayHomework: Array<{
    id: string;
    title: string;
    dueAt: Date;
    status: HomeworkStatus;
    subject: { name: string } | null;
  }> = [];
  let weekBlocks: Array<{ startAt: Date }> = [];
  let recentBlocks: Array<{ startAt: Date }> = [];
  let dbUnavailable = false;

  try {
    [profileRows, todayBlocks, nextBlock, todayHomework, weekBlocks, recentBlocks] =
      await Promise.all([
        prisma.$queryRaw<Array<{ name: string | null; studyWeeklyGoal: number }>>`
          SELECT name, "studyWeeklyGoal" FROM "User" WHERE id = ${session.user.id} LIMIT 1
        `,
        prisma.studyBlock.findMany({
          where: {
            studentUserId: session.user.id,
            AND: [{ startAt: { lt: endToday } }, { endAt: { gt: startToday } }],
          },
          include: { homework: { include: { subject: true } } },
          orderBy: { startAt: "asc" },
        }),
        prisma.studyBlock.findFirst({
          where: { studentUserId: session.user.id, endAt: { gt: now } },
          include: { homework: { include: { subject: true } } },
          orderBy: { startAt: "asc" },
        }),
        prisma.homework.findMany({
          where: {
            studentUserId: session.user.id,
            dueAt: { gte: startToday, lt: endToday },
          },
          include: { subject: true },
          orderBy: { dueAt: "asc" },
        }),
        prisma.studyBlock.findMany({
          where: {
            studentUserId: session.user.id,
            AND: [{ startAt: { lt: weekEnd } }, { endAt: { gt: weekStart } }],
          },
          select: { startAt: true },
          orderBy: { startAt: "asc" },
        }),
        prisma.studyBlock.findMany({
          where: {
            studentUserId: session.user.id,
            startAt: { gte: monthAgo, lt: endToday },
          },
          select: { startAt: true },
        }),
      ]);
  } catch {
    dbUnavailable = true;
  }

  const doneToday = todayBlocks.filter((b) => b.endAt <= now).length;
  const weekCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const block of weekBlocks) {
    const idx = (block.startAt.getDay() + 6) % 7;
    weekCounts[idx] += 1;
  }

  const activeDays = new Set(recentBlocks.map((b) => toYmd(b.startAt)));
  let streakDays = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = addDays(startToday, -i);
    if (activeDays.has(toYmd(day))) {
      streakDays += 1;
    } else if (i > 0) {
      break;
    }
  }

  const student = profileRows[0] ?? null;

  return {
    studentName: student?.name ?? session.user.email ?? "Aluno",
    todayBlocks,
    doneToday,
    nextBlock,
    todayHomework,
    weekCounts,
    thisWeekTotal: weekBlocks.length,
    weeklyGoal: Number(student?.studyWeeklyGoal ?? 15),
    streakDays,
    dbUnavailable,
  };
}

export async function createStudyBlock(data: {
  title: string;
  startAt: string;
  endAt: string;
  homeworkId?: string;
}) {
  const session = await requireStudent();
  if (data.homeworkId) {
    const h = await prisma.homework.findFirst({
      where: { id: data.homeworkId, studentUserId: session.user.id },
    });
    if (!h) throw new Error("Trabalho inválido.");
  }
  await prisma.studyBlock.create({
    data: {
      studentUserId: session.user.id,
      title: data.title.trim(),
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      homeworkId: data.homeworkId || null,
    },
  });
  rev();
}

export async function deleteStudyBlock(id: string) {
  const session = await requireStudent();
  const b = await prisma.studyBlock.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!b) throw new Error("Bloco não encontrado.");
  await prisma.studyBlock.delete({ where: { id } });
  rev();
}

export async function listDifficulties() {
  const session = await requireStudent();
  return prisma.difficulty.findMany({
    where: { studentUserId: session.user.id },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createDifficulty(data: {
  description: string;
  subjectId?: string;
  severity?: DifficultySeverity;
  shareWithParent?: boolean;
  shareWithTeacher?: boolean;
}) {
  const session = await requireStudent();
  if (data.subjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: data.subjectId, studentUserId: session.user.id },
    });
    if (!sub) throw new Error("Disciplina inválida.");
  }
  await prisma.difficulty.create({
    data: {
      studentUserId: session.user.id,
      description: data.description.trim(),
      subjectId: data.subjectId || null,
      severity: data.severity ?? "MEDIA",
      shareWithParent: data.shareWithParent ?? false,
      shareWithTeacher: data.shareWithTeacher ?? false,
    },
  });
  rev();
}

export async function deleteDifficulty(id: string) {
  const session = await requireStudent();
  const d = await prisma.difficulty.findFirst({
    where: { id, studentUserId: session.user.id },
  });
  if (!d) throw new Error("Registo não encontrado.");
  await prisma.difficulty.delete({ where: { id } });
  rev();
}

export async function listGoals() {
  const session = await requireStudent();
  if (!hasGoalModels()) return [];
  return prisma.goal.findMany({
    where: { studentUserId: session.user.id },
    include: {
      subject: true,
      steps: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getStudentProfile() {
  const session = await requireStudent();
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      gradeYear: true,
      studyWeeklyGoal: true,
    },
  });
}

export async function updateStudentProfile(data: {
  name: string;
  gradeYear?: number;
  studyWeeklyGoal?: number;
}) {
  const session = await requireStudent();
  const name = data.name.trim();
  if (!name) throw new Error("Indica o teu nome.");
  if (data.gradeYear && (data.gradeYear < 1 || data.gradeYear > 12)) {
    throw new Error("Ano inválido.");
  }
  if (data.studyWeeklyGoal && (data.studyWeeklyGoal < 1 || data.studyWeeklyGoal > 60)) {
    throw new Error("Meta semanal inválida.");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      gradeYear: data.gradeYear ?? null,
      studyWeeklyGoal: data.studyWeeklyGoal ?? 15,
    },
  });
  if (hasActionLogModel()) {
    await prisma.studentActionLog.create({
      data: {
        studentUserId: session.user.id,
        title: "Perfil atualizado",
        notes: `Nome: ${name}`,
      },
    });
  }
  rev();
}

export async function listStudentActionLogs() {
  const session = await requireStudent();
  if (!hasActionLogModel()) return [];
  return prisma.studentActionLog.findMany({
    where: { studentUserId: session.user.id },
    orderBy: { happenedAt: "desc" },
    take: 200,
  });
}

export async function createStudentActionLog(data: { title: string; notes?: string; happenedAt?: string }) {
  const session = await requireStudent();
  if (!hasActionLogModel()) {
    throw new Error("Registo de ações ainda indisponível. Executa `npm run db:push`.");
  }
  const title = data.title.trim();
  if (!title) throw new Error("Indica a ação que realizaste.");
  const happenedAt =
    data.happenedAt && data.happenedAt.trim() ? new Date(data.happenedAt.trim()) : new Date();
  if (Number.isNaN(happenedAt.getTime())) throw new Error("Data/hora inválida.");

  await prisma.studentActionLog.create({
    data: {
      studentUserId: session.user.id,
      title,
      notes: data.notes?.trim() || null,
      happenedAt,
    },
  });
  rev();
}

export async function createGoal(data: {
  title: string;
  description?: string;
  subjectId?: string;
  targetDate?: string;
}) {
  const session = await requireStudent();
  if (!hasGoalModels()) {
    throw new Error("Objetivos ainda indisponíveis. Executa `npm run db:push`.");
  }
  const title = data.title.trim();
  if (!title) throw new Error("Indica um título para o objetivo.");

  if (data.subjectId) {
    const sub = await prisma.subject.findFirst({
      where: { id: data.subjectId, studentUserId: session.user.id },
    });
    if (!sub) throw new Error("Disciplina inválida.");
  }

  const parsedTarget =
    data.targetDate && data.targetDate.trim() ? new Date(data.targetDate.trim()) : null;
  if (parsedTarget && Number.isNaN(parsedTarget.getTime())) {
    throw new Error("Data alvo inválida.");
  }

  await prisma.goal.create({
    data: {
      studentUserId: session.user.id,
      title,
      description: data.description?.trim() || null,
      subjectId: data.subjectId || null,
      targetDate: parsedTarget,
      status: "ATIVO",
    },
  });
  rev();
}

export async function addGoalStep(data: { goalId: string; title: string }) {
  const session = await requireStudent();
  if (!hasGoalModels()) {
    throw new Error("Objetivos ainda indisponíveis. Executa `npm run db:push`.");
  }
  const title = data.title.trim();
  if (!title) throw new Error("Indica o passo que vais cumprir.");

  const goal = await prisma.goal.findFirst({
    where: { id: data.goalId, studentUserId: session.user.id },
  });
  if (!goal) throw new Error("Objetivo não encontrado.");

  await prisma.goalStep.create({
    data: {
      goalId: goal.id,
      studentUserId: session.user.id,
      title,
    },
  });
  rev();
}

export async function toggleGoalStepDone(data: { stepId: string; done: boolean }) {
  const session = await requireStudent();
  if (!hasGoalModels()) {
    throw new Error("Objetivos ainda indisponíveis. Executa `npm run db:push`.");
  }
  const step = await prisma.goalStep.findFirst({
    where: { id: data.stepId, studentUserId: session.user.id },
  });
  if (!step) throw new Error("Passo não encontrado.");

  await prisma.goalStep.update({
    where: { id: step.id },
    data: {
      done: data.done,
      doneAt: data.done ? new Date() : null,
    },
  });

  const allSteps = await prisma.goalStep.findMany({
    where: { goalId: step.goalId, studentUserId: session.user.id },
    select: { done: true },
  });
  const shouldClose = allSteps.length > 0 && allSteps.every((s) => s.done);
  await prisma.goal.update({
    where: { id: step.goalId },
    data: { status: shouldClose ? "CONCLUIDO" : "ATIVO" },
  });
  rev();
}

export async function updateGoalStatus(data: { goalId: string; status: GoalStatusInput }) {
  const session = await requireStudent();
  if (!hasGoalModels()) {
    throw new Error("Objetivos ainda indisponíveis. Executa `npm run db:push`.");
  }
  const goal = await prisma.goal.findFirst({
    where: { id: data.goalId, studentUserId: session.user.id },
  });
  if (!goal) throw new Error("Objetivo não encontrado.");
  await prisma.goal.update({
    where: { id: goal.id },
    data: { status: data.status },
  });
  rev();
}

export async function deleteGoal(goalId: string) {
  const session = await requireStudent();
  if (!hasGoalModels()) {
    throw new Error("Objetivos ainda indisponíveis. Executa `npm run db:push`.");
  }
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, studentUserId: session.user.id },
  });
  if (!goal) throw new Error("Objetivo não encontrado.");
  await prisma.goal.delete({ where: { id: goalId } });
  rev();
}

function errPath(base: string, e: unknown) {
  const m = e instanceof Error ? e.message : "Erro";
  return `${base}?error=${encodeURIComponent(m)}`;
}

export async function createSubjectFormAction(formData: FormData) {
  try {
    await createSubject(String(formData.get("name") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/notas", e));
  }
  redirect("/aluno/notas");
}

export async function deleteSubjectFormAction(formData: FormData) {
  try {
    await deleteSubject(String(formData.get("id") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/notas", e));
  }
  redirect("/aluno/notas");
}

export async function createMarkFormAction(formData: FormData) {
  try {
    await createMark({
      subjectId: String(formData.get("subjectId") ?? ""),
      date: String(formData.get("date") ?? ""),
      value: parseFloat(String(formData.get("value") ?? "0")),
      maxValue: formData.get("maxValue")
        ? parseFloat(String(formData.get("maxValue")))
        : undefined,
      type: (formData.get("type") as MarkType) || "TESTE",
      notes: String(formData.get("notes") ?? "") || undefined,
    });
  } catch (e) {
    redirect(errPath("/aluno/notas", e));
  }
  redirect("/aluno/notas");
}

export async function deleteMarkFormAction(formData: FormData) {
  try {
    await deleteMark(String(formData.get("id") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/notas", e));
  }
  redirect("/aluno/notas");
}

export async function createHomeworkFormAction(formData: FormData) {
  try {
    const sid = String(formData.get("subjectId") ?? "");
    await createHomework({
      title: String(formData.get("title") ?? ""),
      subjectId: sid || undefined,
      dueAt: String(formData.get("dueAt") ?? ""),
      notes: String(formData.get("notes") ?? "") || undefined,
    });
  } catch (e) {
    redirect(errPath("/aluno/trabalhos", e));
  }
  redirect("/aluno/trabalhos");
}

export async function updateHomeworkStatusFormAction(formData: FormData) {
  try {
    await updateHomeworkStatus(
      String(formData.get("id") ?? ""),
      String(formData.get("status") ?? "PENDENTE") as HomeworkStatus,
    );
  } catch (e) {
    redirect(errPath("/aluno/trabalhos", e));
  }
  redirect("/aluno/trabalhos");
}

export async function deleteHomeworkFormAction(formData: FormData) {
  try {
    await deleteHomework(String(formData.get("id") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/trabalhos", e));
  }
  redirect("/aluno/trabalhos");
}

export async function createStudentQuestionFormAction(formData: FormData) {
  try {
    await createStudentQuestion({
      homeworkId: String(formData.get("homeworkId") ?? "") || undefined,
      question: String(formData.get("question") ?? ""),
    });
  } catch (e) {
    redirect(errPath("/aluno/trabalhos", e));
  }
  redirect("/aluno/trabalhos");
}

export async function closeStudentQuestionFormAction(formData: FormData) {
  try {
    await closeStudentQuestion(String(formData.get("questionId") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/trabalhos", e));
  }
  redirect("/aluno/trabalhos");
}

export async function createStudyBlockFormAction(formData: FormData) {
  try {
    const hw = String(formData.get("homeworkId") ?? "");
    await createStudyBlock({
      title: String(formData.get("title") ?? ""),
      startAt: String(formData.get("startAt") ?? ""),
      endAt: String(formData.get("endAt") ?? ""),
      homeworkId: hw || undefined,
    });
  } catch (e) {
    const qs = new URLSearchParams();
    qs.set("error", e instanceof Error ? e.message : "Erro");
    const w = String(formData.get("weekStart") ?? "");
    if (w) qs.set("weekStart", w);
    redirect(`/aluno/plano?${qs.toString()}`);
  }
  const w = String(formData.get("weekStart") ?? "");
  redirect(w ? `/aluno/plano?weekStart=${encodeURIComponent(w)}` : "/aluno/plano");
}

export async function deleteStudyBlockFormAction(formData: FormData) {
  try {
    await deleteStudyBlock(String(formData.get("id") ?? ""));
  } catch (e) {
    const qs = new URLSearchParams();
    qs.set("error", e instanceof Error ? e.message : "Erro");
    const w = String(formData.get("weekStart") ?? "");
    if (w) qs.set("weekStart", w);
    redirect(`/aluno/plano?${qs.toString()}`);
  }
  const w = String(formData.get("weekStart") ?? "");
  redirect(w ? `/aluno/plano?weekStart=${encodeURIComponent(w)}` : "/aluno/plano");
}

export async function createDifficultyFormAction(formData: FormData) {
  try {
    await createDifficulty({
      description: String(formData.get("description") ?? ""),
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      severity:
        (String(formData.get("severity") ?? "") as DifficultySeverity) || "MEDIA",
      shareWithParent: formData.get("shareWithParent") === "on",
      shareWithTeacher: formData.get("shareWithTeacher") === "on",
    });
  } catch (e) {
    redirect(errPath("/aluno/dificuldades", e));
  }
  redirect("/aluno/dificuldades");
}

export async function deleteDifficultyFormAction(formData: FormData) {
  try {
    await deleteDifficulty(String(formData.get("id") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/dificuldades", e));
  }
  redirect("/aluno/dificuldades");
}

export async function createGoalFormAction(formData: FormData) {
  try {
    await createGoal({
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      subjectId: String(formData.get("subjectId") ?? "") || undefined,
      targetDate: String(formData.get("targetDate") ?? "") || undefined,
    });
  } catch (e) {
    redirect(errPath("/aluno/objetivos", e));
  }
  redirect("/aluno/objetivos");
}

export async function addGoalStepFormAction(formData: FormData) {
  try {
    await addGoalStep({
      goalId: String(formData.get("goalId") ?? ""),
      title: String(formData.get("title") ?? ""),
    });
  } catch (e) {
    redirect(errPath("/aluno/objetivos", e));
  }
  redirect("/aluno/objetivos");
}

export async function toggleGoalStepDoneFormAction(formData: FormData) {
  try {
    await toggleGoalStepDone({
      stepId: String(formData.get("stepId") ?? ""),
      done: String(formData.get("done") ?? "false") === "true",
    });
  } catch (e) {
    redirect(errPath("/aluno/objetivos", e));
  }
  redirect("/aluno/objetivos");
}

export async function updateGoalStatusFormAction(formData: FormData) {
  try {
    await updateGoalStatus({
      goalId: String(formData.get("goalId") ?? ""),
      status: String(formData.get("status") ?? "ATIVO") as GoalStatusInput,
    });
  } catch (e) {
    redirect(errPath("/aluno/objetivos", e));
  }
  redirect("/aluno/objetivos");
}

export async function deleteGoalFormAction(formData: FormData) {
  try {
    await deleteGoal(String(formData.get("goalId") ?? ""));
  } catch (e) {
    redirect(errPath("/aluno/objetivos", e));
  }
  redirect("/aluno/objetivos");
}

export async function updateStudentProfileFormAction(formData: FormData) {
  try {
    const grade = String(formData.get("gradeYear") ?? "");
    const weeklyGoal = String(formData.get("studyWeeklyGoal") ?? "");
    await updateStudentProfile({
      name: String(formData.get("name") ?? ""),
      gradeYear: grade ? parseInt(grade, 10) : undefined,
      studyWeeklyGoal: weeklyGoal ? parseInt(weeklyGoal, 10) : undefined,
    });
  } catch (e) {
    redirect(errPath("/aluno/perfil", e));
  }
  redirect("/aluno/perfil");
}

export async function createStudentActionLogFormAction(formData: FormData) {
  try {
    await createStudentActionLog({
      title: String(formData.get("title") ?? ""),
      notes: String(formData.get("notes") ?? "") || undefined,
      happenedAt: String(formData.get("happenedAt") ?? "") || undefined,
    });
  } catch (e) {
    redirect(errPath("/aluno/perfil", e));
  }
  redirect("/aluno/perfil");
}
