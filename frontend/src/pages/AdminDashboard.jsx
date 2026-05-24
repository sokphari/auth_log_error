export default function AdminDashboard() {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
      <p className="mt-2 text-slate-500">
        Only admin users can access this page.
      </p>
    </div>
  );
}