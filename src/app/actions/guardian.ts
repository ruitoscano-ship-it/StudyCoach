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
