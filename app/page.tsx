import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          Iron<span className="text-blue-500">Mind</span> AI
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          AI fitness coach — powered by real knowledge.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
  <Link
    href="/chat"
    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
  >
    Start Chatting
  </Link>
  <Link
    href="/login"
    className="rounded-lg border border-gray-700 px-6 py-3 font-semibold text-gray-300 hover:border-gray-500"
  >
    Login
  </Link>
</div>
      </div>
    </div>
  );
}