import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-screen bg-[var(--cloud)] lg:grid-cols-[minmax(360px,0.9fr)_minmax(480px,1.1fr)]">
      <section className="relative min-h-64 overflow-hidden bg-[var(--midnight)] lg:min-h-screen">
        <Image
          src="/background.png"
          alt="Con đường từ tư duy độc lập đến cộng tác cùng AI"
          fill
          sizes="(max-width: 1024px) 100vw, 45vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--midnight)] via-[var(--midnight)]/20 to-transparent" />
        <div className="absolute inset-x-6 bottom-7 max-w-xl text-white lg:inset-x-12 lg:bottom-12">
          <p className="utility-label mb-3 text-[var(--electric)]">
            THINK → VERIFY → AI
          </p>
          <p className="m-0 text-2xl font-bold tracking-[-0.04em] lg:text-4xl">
            Giữ quyền quyết định trong mỗi lần dùng AI.
          </p>
        </div>
      </section>

      <div className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-8">
          <Link
            href="/"
            className="mb-8 inline-flex min-h-11 items-center text-sm font-bold text-[var(--ink-muted)] hover:text-[var(--horizon)]"
          >
            Think First{" "}
            <span className="ml-1 text-[var(--sunrise-ink)]">/ AI Later</span>
          </Link>
          {children}
        </div>
      </div>
    </main>
  )
}
