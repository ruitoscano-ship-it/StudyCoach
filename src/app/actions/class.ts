"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStudent, requireTeacher } from "@/lib/authz";

export async function joinClassByCode(code: string) {
  const session = await requireStudent();
  const trimmed = code.trim();
  if (!trimmed) throw new Error("Indica o código da turma.");

  const cls = await prisma.class.findUnique({
    where: { inviteCode: trimmed },
  });
  if (!cls) throw new Error("Código não encontrado.");

  await prisma.enrollment.upsert({
    where: {
      classId_studentUserId: {
        classId: cls.id,
        studentUserId: session.user.id,
      },
    },
    create: {
      classId: cls.id,
      studentUserId: session.user.id,
    },
    update: {},
  });

  revalidatePath("/aluno");
  revalidatePath("/professor");
  return { ok: true as const, className: cls.name };
}

export async function createClass(data: { name: string; year: number; schoolName?: string }) {
  const session = await requireTeacher();
  const name = data.name.trim();
  if (!name) throw new Error("Indica o nome da turma.");
  if (data.year < 1 || data.year > 9) throw new Error("Ano deve ser entre 1 e 9.");

  let schoolId: string | null = null;
  if (data.schoolName?.trim()) {
    const school = await prisma.school.create({
      data: { name: data.schoolName.trim() },
    });
    schoolId = school.id;
  }

  const cls = await prisma.class.create({
    data: {
      name,
      year: data.year,
      teacherId: session.user.id,
      schoolId,
    },
  });

  revalidatePath("/professor");
  return cls;
}

export async function listTeacherClasses() {
  const session = await requireTeacher();
  return prisma.class.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getClassDetail(classId: string) {
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  return prisma.class.findUnique({
    where: { id: classId },
    include: {
      enrollments: {
        include: {
          student: {
            select: { id: true, name: true, email: true, gradeYear: true },
          },
        },
      },
      homeworks: {
        where: { classId },
        select: {
          id: true,
          title: true,
          dueAt: true,
          status: true,
          studentUserId: true,
          subject: { select: { name: true } },
          comments: {
            orderBy: { createdAt: "desc" },
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
            take: 10,
          },
        },
        orderBy: { dueAt: "desc" },
      },
      school: true,
    },
  });
}

export async function assignHomeworkToClass(
  classId: string,
  data: {
    title: string;
    dueAt: string;
    subjectName?: string;
    notes?: string;
  },
) {
  const session = await requireTeacher();
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: true },
  });
  if (!cls) throw new Error("Turma não encontrada.");

  const dueAt = new Date(data.dueAt);
  const title = data.title.trim();
  if (!title) throw new Error("Indica o título do trabalho.");

  let subjectId: string | null = null;
  if (data.subjectName?.trim()) {
    const sub = await prisma.subject.create({
      data: {
        name: data.subjectName.trim(),
        classId: cls.id,
      },
    });
    subjectId = sub.id;
  }

  await prisma.$transaction(
    cls.enrollments.map((e) =>
      prisma.homework.create({
        data: {
          studentUserId: e.studentUserId,
          classId: cls.id,
          assignedByUserId: session.user.id,
          title,
          dueAt,
          notes: data.notes?.trim() || null,
          subjectId,
          status: "PENDENTE",
        },
      }),
    ),
  );

  revalidatePath("/professor");
  revalidatePath("/aluno");
}

export async function listClassDifficulties(classId: string) {
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    select: { studentUserId: true },
  });
  const ids = enrollments.map((e) => e.studentUserId);
  if (ids.length === 0) return [];

  return prisma.difficulty.findMany({
    where: {
      studentUserId: { in: ids },
      shareWithTeacher: true,
    },
    include: {
      subject: true,
      student: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listClassQuestions(classId: string) {
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  return prisma.studentQuestion.findMany({
    where: {
      student: {
        enrollments: {
          some: { classId },
        },
      },
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      homework: { select: { id: true, title: true } },
      repliedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function enrollStudentByEmail(classId: string, email: string) {
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Indica o email do aluno.");

  const student = await prisma.user.findFirst({
    where: { email: normalizedEmail, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) throw new Error("Aluno não encontrado com este email.");

  await prisma.enrollment.upsert({
    where: {
      classId_studentUserId: {
        classId,
        studentUserId: student.id,
      },
    },
    create: {
      classId,
      studentUserId: student.id,
    },
    update: {},
  });

  revalidatePath(`/professor/turma/${classId}`);
  revalidatePath("/professor");
}

export async function replyToStudentQuestion(
  classId: string,
  data: { questionId: string; reply: string },
) {
  const session = await requireTeacher();
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const reply = data.reply.trim();
  if (!reply) throw new Error("Indica a resposta ao aluno.");

  const question = await prisma.studentQuestion.findUnique({
    where: { id: data.questionId },
    include: {
      student: {
        select: {
          enrollments: {
            where: { classId },
            select: { id: true },
          },
        },
      },
    },
  });
  if (!question || question.student.enrollments.length === 0) {
    throw new Error("Pergunta não encontrada nesta turma.");
  }

  await prisma.studentQuestion.update({
    where: { id: question.id },
    data: {
      reply,
      status: "RESPONDIDA",
      repliedAt: new Date(),
      repliedByUserId: session.user.id,
    },
  });

  revalidatePath(`/professor/turma/${classId}`);
  revalidatePath("/aluno/trabalhos");
}

export async function addHomeworkCommentByTeacher(
  classId: string,
  data: { homeworkId: string; comment: string },
) {
  const session = await requireTeacher();
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const comment = data.comment.trim();
  if (!comment) throw new Error("Escreve o comentário.");

  const homework = await prisma.homework.findFirst({
    where: { id: data.homeworkId, classId },
    select: { id: true },
  });
  if (!homework) throw new Error("Trabalho não encontrado na turma.");

  await prisma.homeworkComment.create({
    data: {
      homeworkId: homework.id,
      authorUserId: session.user.id,
      comment,
    },
  });

  revalidatePath(`/professor/turma/${classId}`);
  revalidatePath("/aluno/trabalhos");
}

export async function setGoalForStudentInClass(
  classId: string,
  data: {
    studentUserId: string;
    title: string;
    description?: string;
    targetDate?: string;
    subjectName?: string;
  },
) {
  const session = await requireTeacher();
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const studentId = data.studentUserId.trim();
  if (!studentId) throw new Error("Seleciona um aluno.");
  const title = data.title.trim();
  if (!title) throw new Error("Indica o objetivo.");

  const enrollment = await prisma.enrollment.findFirst({
    where: { classId, studentUserId: studentId },
    select: { id: true },
  });
  if (!enrollment) throw new Error("O aluno não está inscrito nesta turma.");

  let subjectId: string | null = null;
  if (data.subjectName?.trim()) {
    const subject = await prisma.subject.create({
      data: {
        name: data.subjectName.trim(),
        classId,
        studentUserId: studentId,
      },
    });
    subjectId = subject.id;
  }

  const targetDate =
    data.targetDate && data.targetDate.trim() ? new Date(data.targetDate.trim()) : null;
  if (targetDate && Number.isNaN(targetDate.getTime())) throw new Error("Data alvo inválida.");

  await prisma.goal.create({
    data: {
      studentUserId: studentId,
      title,
      description: data.description?.trim() || null,
      targetDate,
      subjectId,
      status: "ATIVO",
      createdByTeacherId: session.user.id,
    },
  });

  revalidatePath(`/professor/turma/${classId}`);
  revalidatePath("/aluno/objetivos");
}

export async function createStudyProgramAndScheduleForStudent(
  classId: string,
  data: {
    studentUserId: string;
    title: string;
    startAt: string;
    endAt: string;
    notes?: string;
    subjectName?: string;
  },
) {
  const session = await requireTeacher();
  const { assertTeacherOwnsClass } = await import("@/lib/authz");
  await assertTeacherOwnsClass(classId);

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { enrollments: true },
  });
  if (!cls) throw new Error("Turma não encontrada.");

  const studentId = data.studentUserId.trim();
  if (!studentId) throw new Error("Seleciona um aluno.");
  const enrolled = cls.enrollments.some((e) => e.studentUserId === studentId);
  if (!enrolled) throw new Error("O aluno selecionado não pertence a esta turma.");

  const title = data.title.trim();
  if (!title) throw new Error("Indica o título do programa.");

  const startAt = new Date(data.startAt);
  const endAt = new Date(data.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Datas inválidas.");
  }
  if (endAt <= startAt) throw new Error("A hora de fim deve ser depois do início.");

  let subjectId: string | null = null;
  if (data.subjectName?.trim()) {
    const created = await prisma.subject.create({
      data: {
        name: data.subjectName.trim(),
        classId: cls.id,
      },
    });
    subjectId = created.id;
  }

  await prisma.$transaction(async (tx) => {
    const hw = await tx.homework.create({
      data: {
        studentUserId: studentId,
        classId: cls.id,
        assignedByUserId: session.user.id,
        title,
        notes: data.notes?.trim() || null,
        subjectId,
        dueAt: endAt,
        status: "PENDENTE",
      },
    });

    await tx.studyBlock.create({
      data: {
        studentUserId: studentId,
        title: `Sessão: ${title}`,
        startAt,
        endAt,
        homeworkId: hw.id,
      },
    });
  });

  revalidatePath("/professor");
  revalidatePath(`/professor/turma/${classId}`);
  revalidatePath("/aluno");
  revalidatePath("/aluno/plano");
  revalidatePath("/aluno/trabalhos");
}

export async function joinClassFormAction(formData: FormData) {
  try {
    await joinClassByCode(String(formData.get("code") ?? ""));
  } catch (e) {
    redirect(
      `/aluno/turma?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect("/aluno/turma");
}

export async function createClassFormAction(formData: FormData) {
  try {
    const cls = await createClass({
      name: String(formData.get("name") ?? ""),
      year: parseInt(String(formData.get("year") ?? "1"), 10),
      schoolName: String(formData.get("schoolName") ?? "") || undefined,
    });
    redirect(`/professor/turma/${cls.id}`);
  } catch (e) {
    redirect(
      `/professor?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
}

export async function assignHomeworkFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await assignHomeworkToClass(classId, {
      title: String(formData.get("title") ?? ""),
      dueAt: String(formData.get("dueAt") ?? ""),
      subjectName: String(formData.get("subjectName") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
    });
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}

export async function createStudyProgramFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await createStudyProgramAndScheduleForStudent(classId, {
      studentUserId: String(formData.get("studentUserId") ?? ""),
      title: String(formData.get("title") ?? ""),
      startAt: String(formData.get("startAt") ?? ""),
      endAt: String(formData.get("endAt") ?? ""),
      notes: String(formData.get("notes") ?? "") || undefined,
      subjectName: String(formData.get("subjectName") ?? "") || undefined,
    });
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}

export async function enrollStudentByEmailFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await enrollStudentByEmail(classId, String(formData.get("email") ?? ""));
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}

export async function replyToStudentQuestionFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await replyToStudentQuestion(classId, {
      questionId: String(formData.get("questionId") ?? ""),
      reply: String(formData.get("reply") ?? ""),
    });
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}

export async function addHomeworkCommentByTeacherFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await addHomeworkCommentByTeacher(classId, {
      homeworkId: String(formData.get("homeworkId") ?? ""),
      comment: String(formData.get("comment") ?? ""),
    });
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}

export async function setGoalForStudentInClassFormAction(formData: FormData) {
  const classId = String(formData.get("classId") ?? "");
  try {
    await setGoalForStudentInClass(classId, {
      studentUserId: String(formData.get("studentUserId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? "") || undefined,
      targetDate: String(formData.get("targetDate") ?? "") || undefined,
      subjectName: String(formData.get("subjectName") ?? "") || undefined,
    });
  } catch (e) {
    redirect(
      `/professor/turma/${classId}?error=${encodeURIComponent(e instanceof Error ? e.message : "Erro")}`,
    );
  }
  redirect(`/professor/turma/${classId}`);
}
