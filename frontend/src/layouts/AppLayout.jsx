import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Laravel Sanctum App</h1>
            <p className="text-xs text-slate-500">Protected React dashboard</p>
          </div>

          <nav className="flex items-center gap-3">
            <Link className="text-sm font-medium text-slate-600 hover:text-blue-600" to="/dashboard">
              Dashboard
            </Link>

            {isAdmin && (
              <Link className="text-sm font-medium text-slate-600 hover:text-blue-600" to="/admin">
                Admin
              </Link>
            )}

            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.name}
            </span>

            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}