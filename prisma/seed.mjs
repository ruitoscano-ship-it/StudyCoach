import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Pass1234!";
const SAMPLE_INVITE_TOKEN = "convite-demo-pendente";

function daysFromNow(days, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const passwordHash = await hash(PASSWORD, 12);

  const teacher = await prisma.user.upsert({
    where: { email: "prof.demo@studycoach.test" },
    update: {
      name: "Prof. Marta Silva",
      role: "TEACHER",
      passwordHash,
    },
    create: {
      name: "Prof. Marta Silva",
      email: "prof.demo@studycoach.test",
      role: "TEACHER",
      passwordHash,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "enc.demo@studycoach.test" },
    update: {
      name: "Ana Santos",
      role: "PARENT",
      passwordHash,
    },
    create: {
      name: "Ana Santos",
      email: "enc.demo@studycoach.test",
      role: "PARENT",
      passwordHash,
    },
  });

  const students = await Promise.all([
    prisma.user.upsert({
      where: { email: "aluno.demo@studycoach.test" },
      update: {
        name: "Tiago Santos",
        role: "STUDENT",
        gradeYear: 5,
        studyWeeklyGoal: 18,
        passwordHash,
      },
      create: {
        name: "Tiago Santos",
        email: "aluno.demo@studycoach.test",
        role: "STUDENT",
        gradeYear: 5,
        studyWeeklyGoal: 18,
        passwordHash,
      },
    }),
    prisma.user.upsert({
      where: { email: "aluna.demo@studycoach.test" },
      update: {
        name: "Ines Costa",
        role: "STUDENT",
        gradeYear: 5,
        studyWeeklyGoal: 15,
        passwordHash,
      },
      create: {
        name: "Ines Costa",
        email: "aluna.demo@studycoach.test",
        role: "STUDENT",
        gradeYear: 5,
        studyWeeklyGoal: 15,
        passwordHash,
      },
    }),
  ]);

  const [studentA, studentB] = students;

  await prisma.$transaction([
    prisma.studyBlock.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.difficulty.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.mark.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.homework.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.subject.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.enrollment.deleteMany({
      where: { studentUserId: { in: [studentA.id, studentB.id] } },
    }),
    prisma.guardianLink.deleteMany({
      where: {
        OR: [
          { studentUserId: { in: [studentA.id, studentB.id] } },
          { parentUserId: parent.id },
          { inviteToken: SAMPLE_INVITE_TOKEN },
        ],
      },
    }),
    prisma.class.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.school.deleteMany({ where: { name: "Escola Demo Study Coach" } }),
  ]);

  const school = await prisma.school.create({
    data: { name: "Escola Demo Study Coach" },
  });

  const cls = await prisma.class.create({
    data: {
      name: "5.o A - Demo",
      year: 5,
      teacherId: teacher.id,
      schoolId: school.id,
      inviteCode: "TURMA5ADEMO",
    },
  });

  await prisma.enrollment.createMany({
    data: [
      { classId: cls.id, studentUserId: studentA.id },
      { classId: cls.id, studentUserId: studentB.id },
    ],
  });

  const [matA, porA, matB] = await Promise.all([
    prisma.subject.create({ data: { name: "Matematica", studentUserId: studentA.id } }),
    prisma.subject.create({ data: { name: "Portugues", studentUserId: studentA.id } }),
    prisma.subject.create({ data: { name: "Matematica", studentUserId: studentB.id } }),
  ]);

  await prisma.mark.createMany({
    data: [
      {
        studentUserId: studentA.id,
        subjectId: matA.id,
        date: daysFromNow(-12),
        value: 17,
        maxValue: 20,
        type: "TESTE",
        notes: "Excelente melhoria.",
      },
      {
        studentUserId: studentA.id,
        subjectId: porA.id,
        date: daysFromNow(-8),
        value: 15,
        maxValue: 20,
        type: "TRABALHO",
        notes: "Boa apresentacao.",
      },
      {
        studentUserId: studentB.id,
        subjectId: matB.id,
        date: daysFromNow(-6),
        value: 13,
        maxValue: 20,
        type: "TESTE",
        notes: "Precisa rever fracoes.",
      },
    ],
  });

  const hwA1 = await prisma.homework.create({
    data: {
      studentUserId: studentA.id,
      classId: cls.id,
      assignedByUserId: teacher.id,
      subjectId: matA.id,
      title: "Ficha de fracoes",
      notes: "Resolver exercicios 1 a 8.",
      dueAt: daysFromNow(2, 18, 0),
      status: "PENDENTE",
    },
  });

  const hwA2 = await prisma.homework.create({
    data: {
      studentUserId: studentA.id,
      classId: cls.id,
      assignedByUserId: teacher.id,
      subjectId: porA.id,
      title: "Leitura e resumo",
      notes: "Resumo de meia pagina.",
      dueAt: daysFromNow(-1, 16, 0),
      status: "CONCLUIDO",
    },
  });

  await prisma.homework.create({
    data: {
      studentUserId: studentB.id,
      classId: cls.id,
      assignedByUserId: teacher.id,
      subjectId: matB.id,
      title: "Treino de tabuada",
      dueAt: daysFromNow(1, 19, 0),
      status: "EM_CURSO",
    },
  });

  await prisma.studyBlock.createMany({
    data: [
      {
        studentUserId: studentA.id,
        title: "Revisao de fracoes",
        startAt: daysFromNow(0, 17, 0),
        endAt: daysFromNow(0, 17, 45),
        homeworkId: hwA1.id,
      },
      {
        studentUserId: studentA.id,
        title: "Leitura em voz alta",
        startAt: daysFromNow(1, 18, 0),
        endAt: daysFromNow(1, 18, 30),
        homeworkId: hwA2.id,
      },
    ],
  });

  await prisma.difficulty.createMany({
    data: [
      {
        studentUserId: studentA.id,
        subjectId: matA.id,
        description: "Ainda confundo simplificacao de fracoes.",
        severity: "MEDIA",
        shareWithParent: true,
        shareWithTeacher: true,
      },
      {
        studentUserId: studentA.id,
        subjectId: porA.id,
        description: "Demoro a organizar ideias no texto.",
        severity: "BAIXA",
        shareWithParent: true,
        shareWithTeacher: false,
      },
      {
        studentUserId: studentB.id,
        subjectId: matB.id,
        description: "Preciso praticar contas mentais.",
        severity: "ALTA",
        shareWithParent: false,
        shareWithTeacher: true,
      },
    ],
  });

  await prisma.guardianLink.create({
    data: {
      parentUserId: parent.id,
      studentUserId: studentA.id,
      status: "ACCEPTED",
      createdByUserId: studentA.id,
    },
  });

  await prisma.guardianLink.create({
    data: {
      parentUserId: null,
      studentUserId: studentB.id,
      status: "PENDING",
      inviteToken: SAMPLE_INVITE_TOKEN,
      createdByUserId: studentB.id,
    },
  });

  console.log("\nSample data ready.\n");
  console.table([
    { role: "Teacher", email: "prof.demo@studycoach.test", password: PASSWORD },
    { role: "Parent", email: "enc.demo@studycoach.test", password: PASSWORD },
    { role: "Student A", email: "aluno.demo@studycoach.test", password: PASSWORD },
    { role: "Student B", email: "aluna.demo@studycoach.test", password: PASSWORD },
  ]);
  console.log(`\nClass invite code: ${cls.inviteCode}`);
  console.log(`Pending parent invite token: ${SAMPLE_INVITE_TOKEN}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
