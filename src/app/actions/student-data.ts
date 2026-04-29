"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  DifficultySeverity,
  HomeworkStatus,
  MarkType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStudent } from "@/lib/authz";

function rev() {
  revalidatePath("/aluno");
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
