'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { fetchEmployees } from '../../../lib/api';

type Tab = 'bus' | 'private_car';

export default function EmployeesPage() {
  const [tab, setTab]       = useState<Tab>('bus');
  const [search, setSearch] = useState('');

  const { data, error, isLoading } = useSWR('employees', fetchEmployees, {
    refreshInterval: 10000,
  });

  const all  = data?.data ?? [];
  const buses = all.filter((e: any) => e.transport_type === 'bus');
  const cars  = all.filter((e: any) => e.transport_type === 'private_car');

  const baseList = tab === 'bus' ? buses : cars;
  const employees = useMemo(() => {
    if (!search.trim()) return baseList;
    const q = search.toLowerCase();
    return baseList.filter((e: any) => e.name.toLowerCase().includes(q));
  }, [baseList, search]);

  return (
    <main className="min-h-screen p-6 bg-base-200">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.webp"
              alt="Logo"
              width={48}
              height={48}
              className="shrink-0"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.4)) drop-shadow(0 0 18px rgba(255,255,255,0.15))' }}
            />
            <div>
              <h1 className="text-xl font-bold">Master Employee Data</h1>
              <p className="text-sm text-base-content/60 mt-0.5">Data karyawan, tipe transport, PIC bus, dan kehadiran.</p>
            </div>
          </div>
          <Link href="/admin/upload" className="btn btn-primary btn-sm gap-2 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Excel
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-base-100 border border-base-300 rounded-xl p-1 w-fit">
          <TabButton active={tab === 'bus'} onClick={() => { setTab('bus'); setSearch(''); }}>
            🚌 Bus
            {!isLoading && <CountBadge count={buses.length} active={tab === 'bus'} />}
          </TabButton>
          <TabButton active={tab === 'private_car'} onClick={() => { setTab('private_car'); setSearch(''); }}>
            🚗 Kendaraan Pribadi
            {!isLoading && <CountBadge count={cars.length} active={tab === 'private_car'} />}
          </TabButton>
        </div>

        {/* Table container */}
        <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg overflow-hidden">

          {/* Search bar */}
          <div className="px-4 pt-4 pb-3 border-b border-base-300">
            <div className="flex items-center gap-2 bg-base-200 rounded-xl border border-base-300 px-3 py-2 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all max-w-sm">
              <svg className="w-4 h-4 text-base-content/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-base-content/35"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-base-content/40 hover:text-base-content/70 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M18 6 6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <span className="loading loading-dots loading-lg text-primary" />
              </div>
            ) : error ? (
              <p className="text-center text-error py-10 text-sm">Gagal memuat data karyawan.</p>
            ) : employees.length === 0 ? (
              <p className="text-center text-base-content/50 py-10 text-sm">
                {search ? `Tidak ditemukan untuk "${search}"` : 'Tidak ada data.'}
              </p>
            ) : tab === 'bus' ? (
              <BusTable employees={employees} />
            ) : (
              <CarTable employees={employees} />
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-primary text-primary-content shadow'
          : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
      }`}
    >
      {children}
    </button>
  );
}

function CountBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
      active ? 'bg-primary-content/20 text-primary-content' : 'bg-base-200 text-base-content/50'
    }`}>
      {count}
    </span>
  );
}

function TransportBadge({ type }: { type: string }) {
  if (type === 'private_car') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
        🚗 Pribadi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
      🚌 Bus
    </span>
  );
}

function BusTable({ employees }: { employees: any[] }) {
  return (
    <table className="table table-zebra w-full text-sm">
      <thead>
        <tr className="text-xs text-base-content/55 uppercase tracking-wide">
          <th>Nama</th>
          <th className="text-center">Jml. Keluarga</th>
          <th>Jenis Kendaraan</th>
          <th>No. Bus</th>
          <th>PIC Bus</th>
          <th>Titik Jemputan</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((e: any) => (
          <tr key={e.id}>
            <td className="font-medium">{e.name}</td>
            <td className="text-center font-semibold">{e.total_passengers ?? 1}</td>
            <td><TransportBadge type={e.transport_type} /></td>
            <td>
              {e.bus_number != null
                ? <span className="font-semibold text-secondary">Bus {e.bus_number}</span>
                : <span className="text-base-content/30">—</span>}
            </td>
            <td>
              {e.is_pic_bus
                ? <span className="text-xs font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">⭐ PIC</span>
                : <span className="text-base-content/30 text-xs">—</span>}
            </td>
            <td className="text-base-content/70">{e.pickup_point ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CarTable({ employees }: { employees: any[] }) {
  return (
    <table className="table table-zebra w-full text-sm">
      <thead>
        <tr className="text-xs text-base-content/55 uppercase tracking-wide">
          <th>Nama</th>
          <th className="text-center">Jml. Keluarga</th>
          <th>Jenis Kendaraan</th>
          <th className="text-center">Jml. Kendaraan</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((e: any) => (
          <tr key={e.id}>
            <td className="font-medium">{e.name}</td>
            <td className="text-center font-semibold">{e.total_passengers ?? 1}</td>
            <td><TransportBadge type={e.transport_type} /></td>
            <td className="text-center font-semibold">{e.total_vehicles ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
