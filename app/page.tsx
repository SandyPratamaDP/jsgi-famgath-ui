export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="card w-full max-w-3xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title">Family Gathering System</h1>
          <p>Use the admin upload, employee master data, and gate scanner pages.</p>
          <div className="grid gap-4 sm:grid-cols-3 mt-6">
            <a href="/admin/upload" className="btn btn-primary">Upload Excel</a>
            <a href="/admin/employees" className="btn btn-secondary">Employee List</a>
            <a href="/gate-scanner" className="btn btn-accent">Gate Scanner</a>
          </div>
        </div>
      </div>
    </main>
  );
}
