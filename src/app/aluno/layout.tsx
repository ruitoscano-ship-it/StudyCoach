import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/aluno", label: "Início" },
  { href: "/aluno/notas", label: "Notas" },
  { href: "/aluno/trabalhos", label: "Trabalhos" },
  { href: "/aluno/plano", label: "Plano" },
  { href: "/aluno/objetivos", label: "Objetivos" },
  { href: "/aluno/perfil", label: "Perfil" },
  { href: "/aluno/dificuldades", label: "Dificuldades" },
  { href: "/aluno/turma", label: "Turma" },
];

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Aluno";
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto flex w-full max-w-[1200px] gap-3 px-3 py-3">
        <aside className="duo-card hidden w-[238px] shrink-0 p-3 lg:flex lg:flex-col">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff6b4a] text-sm font-bold text-white">
              S
            </span>
            <p className="font-semibold text-slate-900">Study Coach</p>
          </div>
          <nav className="space-y-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="app-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-[#e7e1d8] bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">{firstName}</p>
            <p className="text-xs text-slate-500">Área de estudante</p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="duo-card mb-4 flex items-center justify-between p-3 lg:hidden">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-900">
              Área do aluno
            </span>
            <SignOutButton />
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
