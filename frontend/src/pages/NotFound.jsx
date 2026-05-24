import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <h1 className="text-3xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-slate-500">Page not found.</p>

        <Link className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}