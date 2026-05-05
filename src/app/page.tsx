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
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-3 py-4">
        <header className="duo-card mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff6b4a] text-sm font-bold text-white">
              S
            </span>
            StudyCoach
          </span>
          <div className="flex gap-2 text-sm">
            <Link href="/login" className="duo-btn-soft px-4">
              Entrar
            </Link>
            <Link href="/register" className="duo-btn px-4">
              Registar
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 pb-10">
          <section className="duo-card bg-gradient-to-br from-[#fdf4ee] via-[#fffaf6] to-white p-6 md:p-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#c46858]">
              Aprende melhor, todos os dias
            </p>
            <h1 className="max-w-3xl font-serif text-4xl font-semibold tracking-tight text-[#2b2b2b] md:text-5xl">
              O teu coach digital para escola, família e progresso real
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600">
              StudyCoach ajuda alunos a organizar estudo, professores a orientar turmas e
              encarregados a acompanhar evolução sem stress.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/register" className="duo-btn px-5 py-2.5 text-base">
                Começar agora
              </Link>
              <Link href="/login" className="duo-btn-soft px-5 py-2.5 text-base">
                Já tenho conta
              </Link>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Aluno",
                emoji: "🎯",
                desc: "Vê trabalhos por entregar, organiza blocos de estudo e acompanha notas sem confusão.",
                tone: "from-orange-50/80 to-white border-orange-100",
              },
              {
                title: "Professor",
                emoji: "📚",
                desc: "Cria turmas, atribui tarefas em segundos e monta programas de estudo para cada aluno.",
                tone: "from-teal-50/80 to-white border-teal-100",
              },
              {
                title: "Encarregado",
                emoji: "🤝",
                desc: "Acompanha progresso com clareza e apoia o estudo com informação útil e simples.",
                tone: "from-violet-50/80 to-white border-violet-100",
              },
            ].map((item) => (
              <article
                key={item.title}
                className={`duo-card border bg-gradient-to-br p-5 transition hover:-translate-y-0.5 ${item.tone}`}
              >
                <p className="text-2xl">{item.emoji}</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h2>
                <p className="mt-2 text-sm text-slate-700">{item.desc}</p>
              </article>
            ))}
          </section>

          <section className="duo-card p-5 md:p-6">
            <h3 className="font-serif text-2xl font-semibold text-[#2b2b2b]">Tudo num só lugar</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Notas por disciplina",
                "Trabalhos com estado",
                "Plano semanal de estudo",
                "Dificuldades partilhadas",
              ].map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-[#e7e1d8] bg-[#faf7f3] px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {feature}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
