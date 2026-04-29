"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const baseSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["STUDENT", "PARENT", "TEACHER"]),
  inviteToken: z.string().optional(),
});

export type RegisterState = { ok?: boolean; error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const gyRaw = formData.get("gradeYear");
  const gradeYearParsed =
    typeof gyRaw === "string" && gyRaw !== "" ? parseInt(gyRaw, 10) : undefined;

  const parsed = baseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    inviteToken: formData.get("inviteToken") || undefined,
  });

  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique o formulário." };
  }

  const { name, email, password, role, inviteToken } = parsed.data;
  const gradeYear =
    gradeYearParsed !== undefined && !Number.isNaN(gradeYearParsed)
      ? gradeYearParsed
      : undefined;
  const emailNorm = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existing) {
    return { error: "Já existe uma conta com este email." };
  }

  if (role === "STUDENT") {
    if (!gradeYear || gradeYear < 1 || gradeYear > 9) {
      return { error: "Indique o ano escolar (1.º a 9.º)." };
    }
  }

  if (role !== "STUDENT" && gradeYear) {
    return { error: "Ano escolar só se aplica a alunos." };
  }

  if (inviteToken && role !== "PARENT") {
    return { error: "Este convite é apenas para encarregados de educação." };
  }

  let pendingLinkId: string | null = null;
  if (inviteToken) {
    const link = await prisma.guardianLink.findFirst({
      where: { inviteToken, status: "PENDING" },
    });
    if (!link) {
      return { error: "Convite inválido ou já utilizado." };
    }
    pendingLinkId = link.id;
  }

  const passwordHash = await hashPassword(password);

  try {
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email: emailNorm,
          passwordHash,
          role: role as Role,
          gradeYear: role === "STUDENT" ? gradeYear : null,
        },
      });

      if (pendingLinkId) {
        await tx.guardianLink.update({
          where: { id: pendingLinkId },
          data: {
            parentUserId: u.id,
            status: "ACCEPTED",
          },
        });
      }
    });
  } catch {
    return { error: "Não foi possível criar a conta." };
  }

  return { ok: true };
}

export async function createGuardianInviteAction(): Promise<
  { ok: true; url: string; token: string } | { error: string }
> {
  const { requireStudent } = await import("@/lib/authz");
  const session = await requireStudent();

  const token = randomBytes(24).toString("hex");

  await prisma.guardianLink.create({
    data: {
      studentUserId: session.user.id,
      parentUserId: null,
      status: "PENDING",
      inviteToken: token,
      createdByUserId: session.user.id,
    },
  });

  const base =
    process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/convite?token=${token}`;

  return { ok: true, url, token };
}
