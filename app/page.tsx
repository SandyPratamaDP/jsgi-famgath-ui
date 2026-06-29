import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-72 bg-primary/20 blur-3xl rounded-full" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/logo.webp"
            alt="JSGI Family Gathering 2026"
            width={220}
            height={220}
            priority
            style={{ filter: 'drop-shadow(0 0 16px rgba(255,255,255,0.5)) drop-shadow(0 0 40px rgba(255,255,255,0.18))' }}
          />
        </div>

        <p className="text-center text-sm text-base-content/55">Pilih menu yang ingin diakses</p>

        {/* Menu cards */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/admin/employees"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-base-100 border border-base-300 p-6 shadow-lg hover:border-secondary/50 hover:bg-secondary/5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Employee List</p>
              <p className="text-xs text-base-content/55 mt-0.5">Data & upload</p>
            </div>
          </Link>

          <Link
            href="/gate-scanner"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-base-100 border border-base-300 p-6 shadow-lg hover:border-accent/50 hover:bg-accent/5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎟</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Gate Scanner</p>
              <p className="text-xs text-base-content/55 mt-0.5">Scan kehadiran</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
