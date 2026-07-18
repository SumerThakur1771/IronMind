import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-app grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="bg-mesh pointer-events-none absolute inset-0" />
      <div className="relative z-10">
        <p className="text-gradient text-7xl font-black tracking-tight sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
        <p className="mt-2 font-light text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-7 py-3 font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-blue-500/25"
          >
            Back to home
          </Link>
          <Link
            href="/chat"
            className="inline-block rounded-full border border-white/15 bg-white/5 px-7 py-3 font-medium text-gray-200 transition-colors hover:border-white/30 hover:text-white"
          >
            Chat with IronMind
          </Link>
        </div>
      </div>
    </main>
  );
}
