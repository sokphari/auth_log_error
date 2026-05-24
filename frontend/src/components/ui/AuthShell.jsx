export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-soft lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-blue-600 to-slate-950 p-10 text-white lg:block">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                  Laravel 10 + Sanctum
                </div>

                <h1 className="mt-10 text-4xl font-bold leading-tight">
                  Secure authentication with professional error logging.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
                  Protected routes, API tokens, role authorization, rate limiting, and Telegram error alerts.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-blue-100">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  ✅ Sanctum protected API routes
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  ✅ Frontend route guard
                </div>
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                  ✅ Telegram error monitoring
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}