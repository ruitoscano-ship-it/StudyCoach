import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    switch (session.user.role) {
      case "STUDENT":
        redirect("/aluno");
      case "PARENT":
        redirect("/encarregado");
      case "TEACHER":
      case "ADMIN":
        redirect("/professor");
      default:
        break;
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-sky-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <span className="text-lg font-semibold text-sky-900">Coach de Estudo</span>
          <div className="flex gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-sky-100"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-2 font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600"
            >
              Registar
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-4xl flex-1 flex-col justify-center gap-8 px-4 py-16">
        <div className="rounded-3xl border border-sky-200/70 bg-white/80 p-8 shadow-sm">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-700">
            Aprende com mais alegria
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Estuda melhor, em pequenos passos
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Uma app pensada para alunos do 1.o ao 9.o ano, com um visual mais leve e tarefas
            claras para ajudar a manter o foco todos os dias.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            ["Notas", "Acompanha o progresso em cada disciplina."],
            ["Trabalhos de casa", "Vê o que falta entregar e os prazos."],
            ["Plano de estudo", "Organiza blocos de estudo curtos."],
            ["Dificuldades", "Partilha desafios com familia e professores."],
          ].map(([t, d]) => (
            <li
              key={t}
              className="rounded-2xl border border-sky-200/70 bg-white/85 p-5 shadow-sm"
            >
              <h2 className="font-semibold text-sky-900">{t}</h2>
              <p className="mt-1 text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
