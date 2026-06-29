'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { searchEmployees, updateEmployee } from '../../lib/api';

export default function GateScannerPage() {
  const [query, setQuery]                       = useState('');
  const [searchTerm, setSearchTerm]             = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [statusMsg, setStatusMsg]               = useState('');
  const [switchedFromBus, setSwitchedFromBus]   = useState(false);

  const { data, error, isLoading } = useSWR(
    searchTerm ? ['search', searchTerm] : null,
    () => searchEmployees(searchTerm),
    { revalidateOnFocus: false }
  );

  const employees = data?.data ?? [];
  const candidate = employees.length === 1 ? (employees[0] ?? null) : null;
  const employee  = selectedEmployee ?? candidate;

  const canSwitchTransport = employee && employee.transport_type === 'bus' && !employee.is_pic_bus;
  const showQr = employee && (employee.transport_type === 'private_car' || employee.is_pic_bus);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSelectedEmployee(null);
    setSwitchedFromBus(false);
    setStatusMsg('');
    setSearchTerm(query.trim());
  };

  const handleSwitchToCar = async () => {
    if (!employee) return;
    setStatusMsg('Menyimpan…');
    try {
      const res = await updateEmployee(employee.id, {
        total_vehicles: 1,
        transport_type: 'private_car',
      });
      setSelectedEmployee(res.data);
      setSwitchedFromBus(true);
      setStatusMsg('');
    } catch {
      setStatusMsg('Gagal menyimpan. Coba lagi.');
    }
  };

  return (
    <main className="min-h-screen bg-base-200 px-4 pb-12 relative overflow-hidden">
      {/* Ambient blue glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48 bg-primary/25 blur-3xl rounded-full" />

      <div className="max-w-sm mx-auto space-y-4 relative">

        {/* Header */}
        <div className="pt-8 pb-2 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-3 shadow-lg">
            <span className="text-3xl">🎟</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Gate Scanner</h1>
          <p className="text-xs text-base-content/60 mt-1">Family Gathering 2026</p>
        </div>

        {/* Unified search pill */}
        <div>
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
              placeholder="Ketik nama atau NIK…"
              className="flex-1 bg-transparent outline-none text-sm py-2.5 placeholder:text-base-content/35"
              autoComplete="off"
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-sm rounded-xl px-5 shrink-0 min-w-[64px]">
              {isLoading
                ? <span className="loading loading-spinner loading-xs" />
                : 'Cari'}
            </button>
          </form>

          {statusMsg && <p className="text-xs text-base-content/60 text-center mt-2">{statusMsg}</p>}
          {error    && <p className="text-xs text-error text-center mt-2">Pencarian gagal.</p>}
          {!isLoading && !error && employees.length === 0 && searchTerm && (
            <p className="text-xs text-base-content/60 text-center mt-2">
              Tidak ditemukan untuk &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Multi-result picker */}
        {!isLoading && !error && employees.length > 1 && !selectedEmployee && (
          <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">
            <p className="text-[10px] font-bold text-base-content/55 uppercase tracking-widest px-4 pt-3 pb-1">
              Beberapa hasil — pilih satu
            </p>
            <div className="divide-y divide-base-300">
              {employees.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-primary/10 active:bg-primary/20 transition-colors text-left"
                  onClick={() => setSelectedEmployee(item)}
                >
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-base-content/55 mt-0.5">{item.nik}</p>
                  </div>
                  <svg className="w-4 h-4 text-base-content/35 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Employee result card */}
        {employee && (
          <>
            {employee.transport_type === 'private_car'
              ? <PrivateCarCard employee={employee} switched={switchedFromBus} />
              : <BusCard employee={employee} />}

            {/* Emergency switch */}
            {canSwitchTransport && (
              <div className="rounded-2xl bg-warning/10 border border-warning/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/20 border border-warning/30 flex items-center justify-center shrink-0">
                    <span className="text-lg leading-none">⚠️</span>
                  </div>
                  <p className="font-semibold text-sm">Alih ke Kendaraan Pribadi</p>
                </div>
                <p className="text-xs text-base-content/75 leading-relaxed">
                  Gunakan jika penumpang bus tiba dengan kendaraan sendiri di hari-H.
                  Headcount akan mengikuti data karyawan.
                </p>
                <button className="btn btn-warning btn-sm w-full rounded-xl" onClick={handleSwitchToCar}>
                  Konfirmasi Pindah ke Mobil Pribadi
                </button>
              </div>
            )}

            {/* QR Code */}
            {showQr && (
              <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg p-5 flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-base-content/55 uppercase tracking-widest">
                  QR Masuk Ancol
                </p>
                <div className="p-3 bg-white rounded-2xl shadow-md">
                  <img
                    src="/images/ancol-qr.png"
                    alt="Ancol QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-xs text-base-content/60 text-center">
                  Tunjukkan QR ini saat verifikasi pintu masuk
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function PrivateCarCard({ employee, switched }: { employee: any; switched?: boolean }) {
  return (
    <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${switched ? 'from-warning via-orange-400 to-amber-300' : 'from-primary via-blue-400 to-secondary'}`} />
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip color="primary">🚗 Mobil Pribadi</Chip>
          {switched && <Chip color="warning">⚠️ Pindahan Bus</Chip>}
        </div>

        {switched && (
          <div className="rounded-xl bg-warning/10 border border-warning/25 px-3 py-2 text-xs text-base-content/80 leading-relaxed">
            Karyawan ini dialihkan dari bus ke kendaraan pribadi pada hari-H.
          </div>
        )}

        <div>
          <p className="text-xl font-bold leading-tight">{employee.name}</p>
          <p className="text-sm text-base-content/60 mt-0.5">{employee.nik}</p>
        </div>

        <div className="space-y-1 pt-2 border-t border-base-300">
          <InfoRow icon="👥" label="Headcount" value={`${employee.total_passengers ?? 1} orang`} accent />
        </div>
      </div>
    </div>
  );
}

function BusCard({ employee }: { employee: any }) {
  return (
    <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-secondary via-cyan-400 to-accent" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Chip color="secondary">🚌 Bus</Chip>
          {employee.is_pic_bus && <Chip color="accent">⭐ PIC Bus</Chip>}
        </div>

        <div>
          <p className="text-xl font-bold leading-tight">{employee.name}</p>
          <p className="text-sm text-base-content/60 mt-0.5">{employee.nik}</p>
        </div>

        <div className="space-y-1 pt-2 border-t border-base-300">
          {employee.bus_number != null && (
            <InfoRow icon="🚌" label="Nomor Bus" value={`Bus ${employee.bus_number}`} accent />
          )}
          {employee.total_bus_passengers != null && (
            <InfoRow icon="📋" label="Manifest" value={`${employee.total_bus_passengers} penumpang`} />
          )}
          {employee.pickup_point && (
            <InfoRow icon="📍" label="Titik Jemputan" value={employee.pickup_point} />
          )}
        </div>
      </div>
    </div>
  );
}

const chipStyles: Record<string, string> = {
  primary:   'bg-primary/15 text-primary border-primary/25',
  secondary: 'bg-secondary/15 text-secondary border-secondary/25',
  accent:    'bg-accent/15 text-accent border-accent/25',
  warning:   'bg-warning/15 text-warning border-warning/25',
};

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold border rounded-full px-3 py-1 ${chipStyles[color] ?? ''}`}>
      {children}
    </span>
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
