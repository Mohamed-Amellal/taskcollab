export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-white to-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-zinc-100 bg-white/90 p-12 shadow-lg shadow-zinc-200/60">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                MVP ready
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
                Keep teams aligned with Task-Collab
              </h1>
              <p className="mt-4 text-lg text-zinc-600">
                Plan projects, assign tasks, and move work forward with a simple, focused workflow.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  href="/login"
                >
                  Sign in
                </a>
                <a
                  className="rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:border-zinc-300"
                  href="/register"
                >
                  Create account
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Why teams choose Task-Collab
              </h2>
              <ul className="mt-6 space-y-4 text-sm text-zinc-600">
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
                  Shared workspaces with clear roles.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
                  Projects that stay focused and organized.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
                  Task board with assignments and priorities.
                </li>
                <li className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-zinc-900" />
                  Secure JWT authentication.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
