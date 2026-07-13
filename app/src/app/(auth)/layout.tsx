import Link from "next/link"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--midnight)] px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.04] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur">
        <Link
          href="/"
          className="mb-8 inline-block text-sm font-bold tracking-wide text-white/70 hover:text-white"
        >
          THINK FIRST{" "}
          <span className="text-[var(--insight-orange)]">/ AI LATER</span>
        </Link>
        {children}
      </div>
    </main>
  )
}
