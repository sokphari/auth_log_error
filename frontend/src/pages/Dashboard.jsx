import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-slate-500">
          This page is protected by React route guard and Laravel Sanctum middleware.
        </p>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-slate-900">Logged in user</h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Name</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.name}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Email</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.email}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Role</p>
            <p className="mt-1 font-semibold text-slate-900">{user?.role}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Status</p>
            <p className="mt-1 font-semibold text-green-700">
              {user?.is_active ? "Active" : "Disabled"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}