'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAncolQr, uploadAncolQr, logoutApi, AncolQrCategory } from '../../../lib/api';
import { clearAuth, getDisplayName } from '../../../lib/auth';
import { BASE_PATH } from '../../../lib/basePath';

const CATEGORIES: { key: AncolQrCategory; label: string; hint: string }[] = [
  { key: 'local',       label: 'Local',       hint: 'QR masuk untuk karyawan local' },
  { key: 'expat',       label: 'Expat',       hint: 'QR masuk untuk karyawan expat' },
  { key: 'operational', label: 'Operational', hint: 'QR multi-entry untuk karyawan operational' },
];

export default function AncolQrPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => { setDisplayName(getDisplayName() ?? ''); }, []);

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  return (
    <main className="min-h-screen p-6 bg-base-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Image src={`${BASE_PATH}/images/logo.webp`} alt="Logo" width={48} height={48} className="shrink-0" style={{ filter: 'brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 28px rgba(255,255,255,0.35)) drop-shadow(0 0 50px rgba(200,220,255,0.2))' }} />
                <div>
                  <h1 className="card-title text-xl">QR Masuk Ancol</h1>
                  <p className="text-sm text-base-content/60 mt-1">
                    Kelola QR gate-entry per kategori karyawan — dipakai di Gate Scanner dan tiket PDF.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {displayName && (
                  <span className="text-xs text-base-content/50 hidden sm:inline">{displayName}</span>
                )}
                <Link href="/" className="btn btn-ghost btn-sm text-base-content/60" title="Home">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm gap-1 text-base-content/60">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Keluar
                </button>
                <Link href="/admin/employees" className="btn btn-ghost btn-sm gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Employee List
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CATEGORIES.map((c) => (
                <QrCategoryCard key={c.key} category={c.key} label={c.label} hint={c.hint} />
              ))}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function QrCategoryCard({ category, label, hint }: { category: AncolQrCategory; label: string; hint: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [qrSrc, setQrSrc]   = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [file, setFile]     = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const loadCurrent = () => {
    setMissing(false);
    fetchAncolQr(category)
      .then((blob) => setQrSrc(URL.createObjectURL(blob)))
      .catch(() => setMissing(true));
  };

  useEffect(() => {
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus('idle');
    setMessage('');
    setPreview(selected ? URL.createObjectURL(selected) : null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      await uploadAncolQr(category, file);
      setStatus('success');
      setMessage('QR berhasil diperbarui.');
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      loadCurrent();
    } catch {
      setStatus('error');
      setMessage('Gagal upload QR. Coba lagi.');
    }
  };

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-3">
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-base-content/55">{hint}</p>
      </div>

      <div className="aspect-square rounded-xl bg-base-200 border border-base-300 flex items-center justify-center overflow-hidden">
        {preview
          ? <img src={preview} alt={`Preview QR ${label}`} className="w-full h-full object-contain" />
          : qrSrc
            ? <img src={qrSrc} alt={`QR ${label}`} className="w-full h-full object-contain" />
            : <span className="text-xs text-base-content/40 px-2 text-center">{missing ? 'Belum ada QR' : 'Memuat…'}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleFileChange}
        className="file-input file-input-sm w-full"
      />

      {message && (
        <p className={`text-xs ${status === 'error' ? 'text-error' : 'text-success'}`}>{message}</p>
      )}

      <button
        className="btn btn-primary btn-sm w-full"
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
      >
        {status === 'uploading'
          ? <><span className="loading loading-spinner loading-xs" /> Mengupload...</>
          : 'Upload / Ganti QR'}
      </button>
    </div>
  );
}
