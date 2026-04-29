import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const links = [
  { href: "/aluno", label: "Início" },
  { href: "/aluno/notas", label: "Notas" },
  { href: "/aluno/trabalhos", label: "Trabalhos" },
  { href: "/aluno/plano", label: "Plano" },
  { href: "/aluno/dificuldades", label: "Dificuldades" },
  { href: "/aluno/turma", label: "Turma" },
];

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-sky-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="font-semibold text-sky-900">Area do aluno</span>
          <nav className="flex flex-wrap gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-2 py-1.5 text-slate-700 hover:bg-sky-100"
              >
                {l.label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
