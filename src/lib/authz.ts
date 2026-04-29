import { auth } from "@/auth";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado.");
  }
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  const r = session.user.role;
  if (!roles.includes(r)) {
    throw new Error("Sem permissão.");
  }
  return session;
}

export async function requireStudent() {
  return requireRole("STUDENT");
}

export async function requireParent() {
  return requireRole("PARENT");
}

export async function requireTeacher() {
  return requireRole("TEACHER", "ADMIN");
}

/** Garante que o utilizador atual pode agir em nome deste aluno (é o próprio ou encarregado aceite). */
export async function assertCanAccessStudent(studentUserId: string) {
  const session = await requireSession();
  if (session.user.id === studentUserId) return;
  if (session.user.role !== "PARENT") {
    throw new Error("Sem permissão.");
  }
  const link = await prisma.guardianLink.findFirst({
    where: {
      parentUserId: session.user.id,
      studentUserId,
      status: "ACCEPTED",
    },
  });
  if (!link) throw new Error("Sem permissão para ver este aluno.");
}

/** Professor da turma ou admin. */
export async function assertTeacherOwnsClass(classId: string) {
  const session = await requireSession();
  if (session.user.role === "ADMIN") return;
  if (session.user.role !== "TEACHER") throw new Error("Sem permissão.");
  const c = await prisma.class.findUnique({
    where: { id: classId },
    select: { teacherId: true },
  });
  if (!c?.teacherId || c.teacherId !== session.user.id) {
    throw new Error("Esta turma não é sua.");
  }
}
