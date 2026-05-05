"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireParent, requireSession } from "@/lib/authz";

export async function acceptGuardianInvite(token: string) {
  const session = await requireParent();
  const trimmed = token.trim();
  if (!trimmed) throw new Error("Convite inválido.");

  const link = await prisma.guardianLink.findFirst({
    where: { inviteToken: trimmed, status: "PENDING" },
  });
  if (!link) throw new Error("Convite não encontrado ou já utilizado.");

  await prisma.guardianLink.update({
    where: { id: link.id },
    data: {
      parentUserId: session.user.id,
      status: "ACCEPTED",
    },
  });

  revalidatePath("/encarregado");
  return { ok: true as const };
}

/** Encarregado já com sessão: aceita convite (ex.: após login). */
export async function acceptInviteFromQuery(token: string) {
  return acceptGuardianInvite(token);
}

export async function acceptGuardianInviteFormAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  try {
    await acceptGuardianInvite(token);
  } catch (e) {
    redirect(
      `/convite?token=${encodeURIComponent(token)}&error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect("/encarregado");
}

export async function listLinkedStudents() {
  const session = await requireParent();
  const links = await prisma.guardianLink.findMany({
    where: {
      parentUserId: session.user.id,
      status: "ACCEPTED",
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          gradeYear: true,
        },
      },
    },
  });
  return links.map((l) => l.student);
}

export async function getParentHomeOverview() {
  const session = await requireParent();
  const links = await prisma.guardianLink.findMany({
    where: {
      parentUserId: session.user.id,
      status: "ACCEPTED",
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          gradeYear: true,
        },
      },
    },
  });
  const students = links.map((l) => l.student);
  const studentIds = students.map((s) => s.id);
  if (studentIds.length === 0) {
    return { students: [], childCards: [], timeline: [], latestDifficulty: null, weekDays: [] as number[] };
  }

  const [homework, studyBlocks, difficulties] = await Promise.all([
    prisma.homework.findMany({
      where: { studentUserId: { in: studentIds } },
      include: { subject: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    prisma.studyBlock.findMany({
      where: { studentUserId: { in: studentIds } },
      orderBy: { startAt: "desc" },
      take: 200,
    }),
    prisma.difficulty.findMany({
      where: {
        studentUserId: { in: studentIds },
        shareWithParent: true,
      },
      include: { subject: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const studentNameById = new Map(
    students.map((s) => [s.id, s.name ?? s.email.split("@")[0] ?? "Aluno"] as const),
  );
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const childCards = students.map((s) => {
    const homeworks = homework.filter((h) => h.studentUserId === s.id);
    const total = homeworks.length;
    const done = homeworks.filter((h) => h.status === "CONCLUIDO").length;
    const pending = homeworks.filter((h) => h.status !== "CONCLUIDO").length;
    const weekBlocks = studyBlocks.filter((b) => b.studentUserId === s.id && b.startAt >= sevenDaysAgo);
    const weekMinutes = weekBlocks.reduce(
      (sum, b) => sum + Math.max(0, Math.round((b.endAt.getTime() - b.startAt.getTime()) / 60000)),
      0,
    );
    const hasRecentHelpRequest = difficulties.some(
      (d) => d.studentUserId === s.id && d.createdAt >= sevenDaysAgo,
    );
    return {
      id: s.id,
      name: studentNameById.get(s.id) ?? "Aluno",
      gradeYear: s.gradeYear,
      totalHomework: total,
      doneHomework: done,
      pendingHomework: pending,
      progressPct: total === 0 ? 0 : Math.round((done / total) * 100),
      weekMinutes,
      hasRecentHelpRequest,
    };
  });

  const timeline = [
    ...difficulties.map((d) => ({
      key: `difficulty:${d.id}`,
      at: d.createdAt,
      color: "amber",
      text: `${studentNameById.get(d.studentUserId) ?? "Aluno"} pediu ajuda em ${d.subject?.name ?? "disciplina"}.`,
    })),
    ...homework.map((h) => ({
      key: `homework:${h.id}`,
      at: h.updatedAt,
      color: h.status === "CONCLUIDO" ? "green" : h.status === "EM_CURSO" ? "blue" : "rose",
      text:
        h.status === "CONCLUIDO"
          ? `${studentNameById.get(h.studentUserId) ?? "Aluno"} concluiu ${h.title}.`
          : `${studentNameById.get(h.studentUserId) ?? "Aluno"} tem ${h.title} ${h.status === "EM_CURSO" ? "em curso" : "pendente"}.`,
    })),
    ...studyBlocks.map((b) => ({
      key: `block:${b.id}`,
      at: b.startAt,
      color: "green",
      text: `${studentNameById.get(b.studentUserId) ?? "Aluno"} estudou: ${b.title}.`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const weekDays = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - (6 - dayIndex));
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return studyBlocks.filter((b) => b.startAt >= dayStart && b.startAt < dayEnd).length;
  });

  return {
    students,
    childCards,
    timeline,
    latestDifficulty: difficulties[0] ?? null,
    weekDays,
  };
}

export async function getStudentSnapshotForParent(studentUserId: string) {
  const session = await requireSession();
  if (session.user.role !== "PARENT") throw new Error("Apenas encarregados.");
  const link = await prisma.guardianLink.findFirst({
    where: {
      parentUserId: session.user.id,
      studentUserId,
      status: "ACCEPTED",
    },
  });
  if (!link) throw new Error("Sem ligação a este aluno.");

  const [marks, homework, difficulties] = await Promise.all([
    prisma.mark.findMany({
      where: { studentUserId },
      include: { subject: true },
      orderBy: { date: "desc" },
      take: 50,
    }),
    prisma.homework.findMany({
      where: { studentUserId },
      include: { subject: true },
      orderBy: { dueAt: "asc" },
      take: 50,
    }),
    prisma.difficulty.findMany({
      where: {
        studentUserId,
        shareWithParent: true,
      },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const studyBlocks = await prisma.studyBlock.findMany({
    where: { studentUserId },
    orderBy: { startAt: "asc" },
    take: 30,
  });

  return {
    marks,
    homework,
    difficulties,
    studyBlocks,
  };
}
