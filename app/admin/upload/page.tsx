'use client';

import { useCallback, useRef, useState } from 'react';
import { uploadExcel, downloadBulkPdf } from '../../../lib/api';

type StatusKind = 'idle' | 'uploading' | 'success' | 'error';

export default function UploadPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [statusKind, setKind]     = useState<StatusKind>('idle');
  const [message, setMessage]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [isDragging, setDragging] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

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
  const handleSubmit = async () => {
    if (!file) return;
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

  // ── bulk PDF ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setLoading(true);
    setKind('idle');
    setMessage('');
    try {
      const blob = await downloadBulkPdf();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'family-gathering-tickets.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setKind('error');
      setMessage('Gagal generate PDF. Pastikan data sudah diimport terlebih dahulu.');
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

            <div>
              <h1 className="card-title text-xl">Excel Upload Dashboard</h1>
              <p className="text-sm text-base-content/60 mt-1">
                Upload satu file Excel dengan sheet: Pribadi Local, Pribadi Expat, Bus, dan Data Terakhir Kary.
              </p>
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

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!file || loading}
              >
                {loading && statusKind === 'uploading'
                  ? <><span className="loading loading-spinner loading-sm" /> Mengupload...</>
                  : 'Upload & Import'}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleDownload}
                disabled={loading}
              >
                {loading && statusKind !== 'uploading'
                  ? <><span className="loading loading-spinner loading-sm" /> Generating PDF...</>
                  : 'Generate & Download All PDFs'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
