import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentSnapshotForParent } from "@/app/actions/guardian";

type Props = { params: Promise<{ id: string }> };

export default async function EncarregadoAlunoPage({ params }: Props) {
  const { id } = await params;
  let data;
  try {
    data = await getStudentSnapshotForParent(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Link href="/encarregado" className="text-sm text-teal-700 hover:underline">
        ← Voltar
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Notas (recentes)</h2>
        {data.marks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sem notas registadas.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.marks.map((m) => (
              <li key={m.id} className="flex justify-between gap-2">
                <span>
                  {m.subject.name} · {new Date(m.date).toLocaleDateString("pt-PT")}
                </span>
                <span className="tabular-nums font-medium">
                  {m.value}/{m.maxValue}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Trabalhos</h2>
        {data.homework.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sem trabalhos.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.homework.map((h) => (
              <li key={h.id} className="flex flex-col sm:flex-row sm:justify-between">
                <span>{h.title}</span>
                <span className="text-slate-600">
                  {new Date(h.dueAt).toLocaleString("pt-PT", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Dificuldades partilhadas</h2>
        {data.difficulties.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nada partilhado ou o aluno ainda não marcou partilha contigo.
          </p>
        ) : (
          <ul className="mt-3 space-y-3 text-sm">
            {data.difficulties.map((d) => (
              <li key={d.id} className="border-b border-slate-100 pb-3 last:border-0">
                <p className="text-slate-900">{d.description}</p>
                <p className="text-slate-600">
                  {d.subject?.name ?? "Sem disciplina"} · {d.severity}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Plano (blocos recentes)</h2>
        {data.studyBlocks.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Sem blocos.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.studyBlocks.map((b) => (
              <li key={b.id}>
                <span className="font-medium">{b.title}</span>
                <span className="text-slate-600">
                  {" "}
                  — {new Date(b.startAt).toLocaleString("pt-PT", { dateStyle: "short" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
