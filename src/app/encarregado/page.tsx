import Link from "next/link";
import { listLinkedStudents } from "@/app/actions/guardian";

export default async function EncarregadoHome() {
  const students = await listLinkedStudents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Os teus educandos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Vês notas, trabalhos e dificuldades que o aluno escolheu partilhar contigo.
        </p>
      </div>
      {students.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p>Ainda não há ligações. Aceita um convite enviado pelo aluno (link com código).</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {students.map((s) => (
            <li key={s.id}>
              <Link
                href={`/encarregado/aluno/${s.id}`}
                className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300"
              >
                <span className="font-semibold text-slate-900">{s.name ?? s.email}</span>
                {s.gradeYear ? (
                  <span className="ml-2 text-sm text-slate-600">({s.gradeYear}.º ano)</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
