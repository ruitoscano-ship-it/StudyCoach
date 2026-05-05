import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

const links = [{ href: "/professor", label: "Turmas" }];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Professor";

  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <div className="mx-auto flex w-full max-w-[1200px] gap-3 px-3 py-3">
        <aside className="duo-card hidden w-[238px] shrink-0 p-3 lg:flex lg:flex-col">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
              P
            </span>
            <p className="font-semibold text-slate-900">Study Coach</p>
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-800">
            Área do professor
          </p>
          <nav className="space-y-1 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="app-nav-link">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-[#e7e1d8] bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">{firstName}</p>
            <p className="text-xs text-slate-500">Professor</p>
            <div className="mt-3">
              <SignOutButton />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="duo-card mb-4 flex items-center justify-between p-3 lg:hidden">
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-900">
              Área do professor
            </span>
            <SignOutButton />
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
