'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { searchWahana, checkinWahana, logoutApi, ApiError } from '../../lib/api';
import { clearAuth } from '../../lib/auth';
import { BASE_PATH } from '../../lib/basePath';

type WahanaKey = 'sea_world' | 'samudera';

type WahanaState = {
  total: number;
  checked_in: number;
  remaining: number;
};

type ScanResult = {
  id: number;
  name: string;
  total_passengers: number;
  additional_members: number;
  checkins: Record<WahanaKey, WahanaState>;
};

const WAHANA_LABELS: Record<WahanaKey, string> = {
  sea_world: 'Sea World',
  samudera: 'Samudera Ancol',
};

export default function WahanaScannerPage() {
  const router = useRouter();
  const [query, setQuery]             = useState('');
  const [searchTerm, setSearchTerm]   = useState('');
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [actionLoading, setActionLoading] = useState<WahanaKey | null>(null);

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  const { data, error, isLoading } = useSWR(
    searchTerm ? ['wahana-search', searchTerm] : null,
    () => searchWahana(searchTerm),
    { revalidateOnFocus: false }
  );

  const results   = data?.data ?? [];
  const candidate = results.length === 1 ? (results[0] ?? null) : null;
  const result    = selectedResult ?? candidate;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSelectedResult(null);
    setErrorMsg('');
    setSearchTerm(query.trim());
  };

  const handleCheckin = async (wahana: WahanaKey) => {
    if (!result) return;
    setActionLoading(wahana);
    setErrorMsg('');

    try {
      const res = await checkinWahana(result.id, wahana);
      setSelectedResult({ ...result, checkins: { ...result.checkins, [wahana]: res.data } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.body?.data) {
        setSelectedResult({ ...result, checkins: { ...result.checkins, [wahana]: err.body.data } });
      } else {
        setErrorMsg('Gagal menyimpan check-in. Coba lagi.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleScanNext = () => {
    setSelectedResult(null);
    setErrorMsg('');
    setQuery('');
    setSearchTerm('');
  };

  return (
    <main className="min-h-screen bg-base-200 px-4 pb-12 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 bg-primary/25 blur-3xl rounded-full" />

      <div className="max-w-sm mx-auto space-y-4 relative">

        {/* Header */}
        <div className="pt-6 pb-2 flex items-center gap-3">
          <Image
            src={`${BASE_PATH}/images/logo.webp`}
            alt="JSGI Family Gathering 2026"
            width={64}
            height={64}
            priority
            className="shrink-0"
            style={{ filter: 'brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 28px rgba(255,255,255,0.35)) drop-shadow(0 0 50px rgba(200,220,255,0.2))' }}
          />
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Wahana Scanner</h1>
            <p className="text-xs text-base-content/55 mt-0.5">Sea World & Samudera Ancol</p>
          </div>
          <Link
            href="/gate-scanner"
            title="Gate Scanner"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/"
            title="Home"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* Scan input area */}
        {!result && (
          <div className="space-y-3">
            <form
              onSubmit={handleSearch}
              className="flex items-center gap-2 bg-base-100 rounded-2xl border border-base-300 shadow-xl px-4 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <svg className="w-4 h-4 text-base-content/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik nama…"
                className="flex-1 bg-transparent outline-none text-sm py-2.5 placeholder:text-base-content/35"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary btn-sm rounded-xl px-5 shrink-0 min-w-[64px]">
                {isLoading
                  ? <span className="loading loading-spinner loading-xs" />
                  : 'Cari'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <p className="text-xs text-error text-center">Pencarian gagal.</p>
        )}
        {!isLoading && !error && results.length === 0 && searchTerm && (
          <p className="text-xs text-base-content/60 text-center">
            Tidak ditemukan untuk &quot;{searchTerm}&quot;
          </p>
        )}

        {/* Multi-result picker */}
        {!isLoading && !error && results.length > 1 && !selectedResult && (
          <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">
            <p className="text-[10px] font-bold text-base-content/55 uppercase tracking-widest px-4 pt-3 pb-1">
              Beberapa hasil — pilih satu
            </p>
            <div className="divide-y divide-base-300">
              {results.map((item: ScanResult) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
                  onClick={() => setSelectedResult(item)}
                >
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-base-content/55 mt-0.5">{item.total_passengers} orang</p>
                  </div>
                  <svg className="w-4 h-4 text-base-content/35 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="alert alert-error text-xs py-2.5 rounded-xl">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Result card */}
        {result && (
          <>
            <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-primary via-blue-400 to-secondary" />
              <div className="p-4 space-y-3">
                <p className="text-xl font-bold leading-tight">{result.name}</p>

                <div className="space-y-1 pt-2 border-t border-base-300">
                  <InfoRow icon="👥" label="Jml. Keluarga" value={`${result.total_passengers} orang`} accent />
                  {result.additional_members > 0 && (
                    <InfoRow icon="➕" label="Tambahan Peserta" value={`${result.additional_members} orang`} />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <WahanaButton
                label={WAHANA_LABELS.sea_world}
                colorClass="btn-primary"
                state={result.checkins.sea_world}
                loading={actionLoading === 'sea_world'}
                onClick={() => handleCheckin('sea_world')}
              />
              <WahanaButton
                label={WAHANA_LABELS.samudera}
                colorClass="btn-secondary"
                state={result.checkins.samudera}
                loading={actionLoading === 'samudera'}
                onClick={() => handleCheckin('samudera')}
              />
            </div>

            <button onClick={handleScanNext} className="btn btn-ghost w-full rounded-2xl">
              Scan Berikutnya
            </button>
          </>
        )}

      </div>
    </main>
  );
}

// ── Result sub-components ───────────────────────────────────────────────────

function WahanaButton({
  label, colorClass, state, loading, onClick,
}: {
  label: string; colorClass: string; state: WahanaState; loading: boolean; onClick: () => void;
}) {
  const isFull = state.remaining <= 0;

  return (
    <button
      onClick={onClick}
      disabled={isFull || loading}
      className={`btn w-full rounded-2xl justify-between ${isFull ? 'btn-disabled opacity-70' : colorClass}`}
    >
      <span>{label}</span>
      {loading
        ? <span className="loading loading-spinner loading-xs" />
        : <span className="badge badge-neutral">{state.remaining}</span>}
    </button>
  );
}

function InfoRow({
  icon, label, value, accent = false,
}: {
  icon: string; label: string; value: string; accent?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${accent ? 'bg-base-200' : ''}`}>
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="text-xs text-base-content/60 w-28 shrink-0">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
    </div>
  );
}
