import Link from "next/link";
import { ErrorBanner } from "@/components/error-banner";
import { createClassFormAction, listTeacherClasses } from "@/app/actions/class";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function ProfessorHome({ searchParams }: Props) {
  const sp = await searchParams;
  const classes = await listTeacherClasses();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Turmas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Cria uma turma, partilha o código com os alunos e atribui trabalhos à turma inteira.
        </p>
      </div>
      <ErrorBanner message={sp.error} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Nova turma</h2>
        <form action={createClassFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 sm:col-span-2">
            Nome da turma
            <input
              name="name"
              required
              placeholder="Ex.: 5.º A"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Ano (1–9)
            <input
              name="year"
              type="number"
              min={1}
              max={9}
              defaultValue={5}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-slate-700">
            Escola (opcional)
            <input
              name="schoolName"
              placeholder="Nome da escola"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Criar turma
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900">As minhas turmas</h2>
        {classes.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não criaste turmas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {classes.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/professor/turma/${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-teal-300"
                >
                  <span className="font-medium text-slate-900">
                    {c.name} ({c.year}.º ano)
                  </span>
                  <span className="text-sm text-slate-600">{c._count.enrollments} alunos</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
