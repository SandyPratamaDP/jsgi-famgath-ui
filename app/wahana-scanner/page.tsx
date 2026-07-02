'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { lookupWahanaCode, checkinWahana, logoutApi, ApiError } from '../../lib/api';
import { clearAuth } from '../../lib/auth';
import { BASE_PATH } from '../../lib/basePath';

const SCANNER_ELEMENT_ID = 'wahana-qr-reader';

type WahanaKey = 'sea_world' | 'samudera';

type CheckinState = {
  used: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
};

type ScanResult = {
  id: number;
  name: string;
  total_passengers: number;
  additional_members: number;
  checkins: Record<WahanaKey, CheckinState>;
};

const WAHANA_LABELS: Record<WahanaKey, string> = {
  sea_world: 'Sea World',
  samudera: 'Samudera Ancol',
};

export default function WahanaScannerPage() {
  const router = useRouter();
  const [mode, setMode]               = useState<'idle' | 'scanning'>('idle');
  const [manualCode, setManualCode]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [actionLoading, setActionLoading] = useState<WahanaKey | null>(null);

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  const runLookup = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setErrorMsg('');
    setMode('idle');

    try {
      const res = await lookupWahanaCode(trimmed);
      setResult(res.data);
    } catch (err) {
      setResult(null);
      setErrorMsg(
        err instanceof ApiError && err.status === 404
          ? 'Kode QR tidak ditemukan.'
          : 'Gagal memuat data. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runLookup(manualCode);
  };

  const handleManualCodeChange = (raw: string) => {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    const grouped = clean.match(/.{1,4}/g)?.join('-') ?? clean;
    setManualCode(grouped);
  };

  const handleCheckin = async (wahana: WahanaKey) => {
    if (!result) return;
    setActionLoading(wahana);
    setErrorMsg('');

    try {
      const res = await checkinWahana(result.id, wahana);
      setResult({ ...result, checkins: { ...result.checkins, [wahana]: res.data } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.body?.data) {
        setResult({ ...result, checkins: { ...result.checkins, [wahana]: err.body.data } });
      } else {
        setErrorMsg('Gagal menyimpan check-in. Coba lagi.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleScanNext = () => {
    setResult(null);
    setErrorMsg('');
    setManualCode('');
    setMode('idle');
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
            {mode === 'idle' && (
              <button
                onClick={() => setMode('scanning')}
                className="btn btn-primary w-full rounded-2xl gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M7 12h10" />
                </svg>
                Mulai Scan Kamera
              </button>
            )}

            {mode === 'scanning' && (
              <CameraScanner onDecode={runLookup} onCancel={() => setMode('idle')} />
            )}

            <form
              onSubmit={handleManualSubmit}
              className="flex items-center gap-2 bg-base-100 rounded-2xl border border-base-300 shadow-xl px-4 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <svg className="w-4 h-4 text-base-content/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => handleManualCodeChange(e.target.value)}
                placeholder="Kode manual (8 karakter)…"
                className="flex-1 bg-transparent outline-none text-sm py-2.5 placeholder:text-base-content/35 uppercase tracking-wider"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary btn-sm rounded-xl px-5 shrink-0 min-w-[64px]">
                {loading
                  ? <span className="loading loading-spinner loading-xs" />
                  : 'Cari'}
              </button>
            </form>
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

// ── Camera ────────────────────────────────────────────────────────────────────

function CameraScanner({ onDecode, onCancel }: { onDecode: (code: string) => void; onCancel: () => void }) {
  const instanceRef  = useRef<any>(null);
  const onDecodeRef  = useRef(onDecode);
  onDecodeRef.current = onDecode;
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (cancelled) return;

      const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
      instanceRef.current = instance;

      try {
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => onDecodeRef.current(decodedText),
          () => {}
        );
      } catch {
        if (!cancelled) {
          setPermissionError('Tidak bisa mengakses kamera. Periksa izin kamera browser, atau gunakan input manual di bawah.');
        }
      }
    })();

    return () => {
      cancelled = true;
      const instance = instanceRef.current;
      if (instance) {
        instance.stop().then(() => instance.clear()).catch(() => {});
      }
    };
  }, []);

  return (
    <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg p-4 space-y-3">
      <div id={SCANNER_ELEMENT_ID} className="rounded-xl overflow-hidden" />
      {permissionError && <p className="text-xs text-error text-center">{permissionError}</p>}
      <button onClick={onCancel} className="btn btn-ghost btn-sm w-full">Batal / Tutup Kamera</button>
    </div>
  );
}

// ── Result sub-components ───────────────────────────────────────────────────

function WahanaButton({
  label, colorClass, state, loading, onClick,
}: {
  label: string; colorClass: string; state: CheckinState; loading: boolean; onClick: () => void;
}) {
  if (state.used) {
    const time = state.checked_in_at
      ? new Date(state.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : '';
    return (
      <button disabled className="btn w-full rounded-2xl btn-disabled justify-start gap-2 opacity-70">
        <span>✅</span>
        <span className="flex-1 text-left">{label} — Sudah digunakan{time && ` · ${time}`}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`btn w-full rounded-2xl ${colorClass}`}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : label}
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
