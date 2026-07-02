'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadExcel, logoutApi } from '../../../lib/api';
import { clearAuth, getDisplayName } from '../../../lib/auth';
import { BASE_PATH } from '../../../lib/basePath';

type StatusKind = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile]           = useState<File | null>(null);
  const [statusKind, setKind]     = useState<StatusKind>('idle');
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [isDragging, setDragging] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [confirmPending, setConfirmPending] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => { setDisplayName(getDisplayName() ?? ''); }, []);

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  // ── file validation & state setter ──────────────────────────────────────
  const applyFile = (selected: File | null) => {
    if (!selected) return;
    if (!/\.(xlsx|xls)$/i.test(selected.name)) {
      setKind('error');
      setMessage('Hanya file .xlsx atau .xls yang diterima.');
      return;
    }
    setFile(selected);
    setKind('idle');
    setMessage('');
    setConfirmPending(false);
  };

  // ── click-to-browse (via ref, bypasses label issues) ────────────────────
  const handleZoneClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(e.target.files?.[0] ?? null);
  };

  // ── drag-and-drop ────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    applyFile(e.dataTransfer.files?.[0] ?? null);
  }, []);

  // ── upload ───────────────────────────────────────────────────────────────
  const handleUploadClick = () => {
    if (!file) return;
    if (!confirmPending) {
      setConfirmPending(true);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!file) return;
    setConfirmPending(false);
    setLoading(true);
    setKind('uploading');
    setMessage('Mengupload dan memproses file...');

    try {
      const result = await uploadExcel(file);
      setKind('success');
      setMessage(`Import selesai — ${result.count ?? 0} karyawan berhasil diimport.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch {
      setKind('error');
      setMessage('Upload gagal. Periksa format file dan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── drop zone styling ────────────────────────────────────────────────────
  const zoneClass = [
    'flex flex-col items-center justify-center w-full min-h-40 rounded-2xl border-2 border-dashed',
    'cursor-pointer select-none transition-all duration-150',
    isDragging
      ? 'border-primary bg-primary/10 scale-[1.01]'
      : file
        ? 'border-success bg-success/5'
        : 'border-base-300 bg-base-200 hover:border-primary hover:bg-base-300/40',
  ].join(' ');

  return (
    <main className="min-h-screen p-6 bg-base-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body gap-4">

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Image src={`${BASE_PATH}/images/logo.webp`} alt="Logo" width={48} height={48} className="shrink-0" style={{ filter: 'brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 28px rgba(255,255,255,0.35)) drop-shadow(0 0 50px rgba(200,220,255,0.2))' }} />
                <div>
                  <h1 className="card-title text-xl">Excel Upload Dashboard</h1>
                  <p className="text-sm text-base-content/60 mt-1">
                    Upload satu file Excel dengan sheet: Pribadi Local, Pribadi Expat, Bus, dan Data Terakhir Kary.
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

            {/* Hidden file input — triggered via ref */}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleInputChange}
            />

            {/* Drop zone */}
            <div
              className={zoneClass}
              onClick={handleZoneClick}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging ? (
                <p className="text-primary font-semibold text-lg">Lepaskan file di sini ↓</p>
              ) : file ? (
                <div className="text-center space-y-1 px-4">
                  <p className="text-success font-semibold text-base break-all">✓ {file.name}</p>
                  <p className="text-xs text-base-content/50">{(file.size / 1024).toFixed(1)} KB — klik tombol Upload untuk mulai proses</p>
                </div>
              ) : (
                <div className="text-center space-y-2 px-4">
                  <svg className="mx-auto w-10 h-10 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="font-medium text-base-content/80">Drag & drop file .xlsx ke sini</p>
                  <p className="text-sm text-base-content/50">atau klik area ini untuk pilih file</p>
                </div>
              )}
            </div>

            {/* Alert status */}
            {message && (
              <div className={`alert text-sm ${
                statusKind === 'success'   ? 'alert-success'  :
                statusKind === 'error'     ? 'alert-error'    :
                statusKind === 'uploading' ? 'alert-info'     : 'alert-info'
              }`}>
                <span>{message}</span>
              </div>
            )}

            {/* Overwrite warning */}
            {confirmPending && (
              <div className="alert alert-warning text-sm">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>Data karyawan yang namanya sama dengan isi file ini akan <strong>ditimpa</strong> dengan data terbaru. Pastikan file sudah benar sebelum lanjut.</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              {confirmPending ? (
                <>
                  <button className="btn btn-warning" onClick={handleUploadClick} disabled={loading}>
                    {loading && statusKind === 'uploading'
                      ? <><span className="loading loading-spinner loading-sm" /> Mengupload...</>
                      : 'Ya, Lanjutkan Upload'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setConfirmPending(false)} disabled={loading}>
                    Batal
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleUploadClick}
                  disabled={!file || loading}
                >
                  Upload & Import
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
