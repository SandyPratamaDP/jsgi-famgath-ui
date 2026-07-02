'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutApi } from '../lib/api';
import { clearAuth, getRole, getDisplayName } from '../lib/auth';
import { BASE_PATH } from '../lib/basePath';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setRole(getRole());
    setDisplayName(getDisplayName() ?? '');
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  const isEo = role === 'eo';

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-72 bg-primary/20 blur-3xl rounded-full" />

      {/* Logout */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {displayName && (
          <span className="text-xs text-base-content/50 hidden sm:inline">{displayName}</span>
        )}
        <button
          onClick={handleLogout}
          title="Keluar"
          className="btn btn-ghost btn-sm gap-1.5 text-base-content/50 hover:text-base-content"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src={`${BASE_PATH}/images/logo.webp`}
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

          <Link
            href="/wahana-scanner"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-base-100 border border-base-300 p-6 shadow-lg hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎢</span>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm">Wahana Scanner</p>
              <p className="text-xs text-base-content/55 mt-0.5">Sea World & Samudera Ancol</p>
            </div>
          </Link>

          {!isEo && (
            <Link
              href="/admin/employees"
              className="col-span-2 group flex items-center justify-center gap-3 rounded-2xl bg-base-100 border border-base-300 p-5 shadow-lg hover:border-secondary/50 hover:bg-secondary/5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/15 border border-secondary/25 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Employee List</p>
                <p className="text-xs text-base-content/55 mt-0.5">Data & upload</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
