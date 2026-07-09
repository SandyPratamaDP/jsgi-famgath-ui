'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { fetchEmployees, blastTicketEmail, sendEmployeeEmail, updateEmployee, downloadEmployeePdf, downloadEmployeeImage, downloadEmployeeQr, downloadBlankTicketForm, logoutApi } from '../../../lib/api';
import { clearAuth, getDisplayName } from '../../../lib/auth';
import { BASE_PATH } from '../../../lib/basePath';

type Tab = 'bus' | 'private_car' | 'operational';

// Must match the menu's `w-48` Tailwind class below.
const MENU_WIDTH = 192;

export default function EmployeesPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<Tab>('bus');
  const [search, setSearch]     = useState('');
  const [blastLoading, setBlastLoading] = useState(false);
  const [blastMessage, setBlastMessage] = useState('');
  const [blastIsError, setBlastIsError] = useState(false);
  const [blankLoading, setBlankLoading] = useState(false);
  const [blankError, setBlankError] = useState(false);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => { setDisplayName(getDisplayName() ?? ''); }, []);

  const { data, error, isLoading } = useSWR('employees', fetchEmployees, {
    refreshInterval: 10000,
  });

  const handleLogout = async () => {
    await logoutApi();
    clearAuth();
    router.replace('/login');
  };

  const handleBlastEmail = async () => {
    if (!window.confirm('Kirim email tiket ke semua karyawan yang belum pernah menerima email? Aksi ini tidak bisa dibatalkan.')) {
      return;
    }
    setBlastLoading(true);
    setBlastMessage('');
    setBlastIsError(false);
    try {
      const result = await blastTicketEmail();
      setBlastMessage(`Blast email dimulai untuk ${result.count ?? 0} karyawan.`);
    } catch {
      setBlastIsError(true);
      setBlastMessage('Gagal memulai blast email. Pastikan PDF sudah selesai di-generate.');
    } finally {
      setBlastLoading(false);
    }
  };

  const handleDownloadBlankTicket = async () => {
    setBlankLoading(true);
    setBlankError(false);
    try {
      const blob = await downloadBlankTicketForm();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'tiket_kosong.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setBlankError(true);
    } finally {
      setBlankLoading(false);
    }
  };

  const all  = data?.data ?? [];
  const buses = all.filter((e: any) => e.transport_type === 'bus');
  const cars  = all.filter((e: any) => e.transport_type === 'private_car');
  const operationals = all.filter((e: any) => e.transport_type === 'operational');

  const baseList = tab === 'bus' ? buses : tab === 'private_car' ? cars : operationals;
  const employees = useMemo(() => {
    if (!search.trim()) return baseList;
    const q = search.toLowerCase();
    return baseList.filter((e: any) => e.name.toLowerCase().includes(q));
  }, [baseList, search]);

  const totals = useMemo(() => {
    // Operational entries are a logistics roster, not family-gathering attendees —
    // exclude them from the headcount-facing totals.
    const nonOperational = all.filter((e: any) => e.transport_type !== 'operational');
    return {
      karyawan:  nonOperational.length,
      keluarga:  nonOperational.reduce((sum: number, e: any) => sum + (e.total_passengers ?? 1), 0),
      tambahan:  all.reduce((sum: number, e: any) => sum + (e.additional_members ?? 0), 0),
      belowTwo:  all.filter((e: any) => e.has_below_two_children).length,
    };
  }, [all]);

  const ticketStats = useMemo(() => {
    // Only these employees ever get an individual ticket file generated — regular
    // bus riders share their PIC's manifest ticket and have no pdf_filename of their own.
    const eligible = all.filter((e: any) =>
      e.transport_type === 'private_car' || e.transport_type === 'operational' || e.is_pic_bus);
    return {
      generated: eligible.filter((e: any) => !!e.pdf_filename).length,
      eligible:  eligible.length,
    };
  }, [all]);

  // Blast Email attaches the generated PDF — block it until every eligible employee's
  // ticket has finished generating (and there's at least one to send), otherwise early
  // sends would go out with no attachment, or against an empty/not-yet-uploaded dataset.
  const ticketsReady = ticketStats.eligible > 0 && ticketStats.generated >= ticketStats.eligible;

  return (
    <main className="min-h-screen p-6 bg-base-200">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Image
              src={`${BASE_PATH}/images/logo.webp`}
              alt="Logo"
              width={48}
              height={48}
              className="shrink-0"
              style={{ filter: 'brightness(1.15) drop-shadow(0 0 4px rgba(255,255,255,0.95)) drop-shadow(0 0 12px rgba(255,255,255,0.7)) drop-shadow(0 0 28px rgba(255,255,255,0.35)) drop-shadow(0 0 50px rgba(200,220,255,0.2))' }}
            />
            <div>
              <h1 className="text-xl font-bold">Master Employee Data</h1>
              <p className="text-sm text-base-content/60 mt-0.5">Data karyawan, tipe transport, PIC bus, dan kehadiran.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {displayName && (
              <span className="text-xs text-base-content/50 hidden sm:inline">{displayName}</span>
            )}
            <Link href="/" className="btn btn-ghost btn-sm sm:gap-1 px-2 sm:px-3 text-base-content/60" title="Home">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm sm:gap-1 px-2 sm:px-3 text-base-content/60" title="Keluar">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
            <button
              className="btn btn-secondary btn-sm sm:gap-2 px-2 sm:px-3"
              onClick={handleBlastEmail}
              disabled={blastLoading || !ticketsReady}
              title={
                ticketsReady
                  ? 'Blast Email'
                  : ticketStats.eligible === 0
                    ? 'Belum ada tiket yang perlu digenerate'
                    : `Tunggu semua tiket selesai digenerate (${ticketStats.generated}/${ticketStats.eligible})`
              }
            >
              {blastLoading ? (
                <><span className="loading loading-spinner loading-xs" /> <span className="hidden sm:inline">Mengirim...</span></>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Blast Email</span>
                </>
              )}
            </button>
            <Link href="/admin/ancol-qr" className="btn btn-secondary btn-sm sm:gap-2 px-2 sm:px-3" title="QR Ancol">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2m10-16h2a2 2 0 012 2v2m-4 14h2a2 2 0 002-2v-2M7 12h10" />
              </svg>
              <span className="hidden sm:inline">QR Ancol</span>
            </Link>
            <button
              className="btn btn-secondary btn-sm sm:gap-2 px-2 sm:px-3"
              onClick={handleDownloadBlankTicket}
              disabled={blankLoading}
              title="Cetak Tiket Kosong"
            >
              {blankLoading ? (
                <><span className="loading loading-spinner loading-xs" /> <span className="hidden sm:inline">Mencetak...</span></>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                  </svg>
                  <span className="hidden sm:inline">Tiket Kosong</span>
                </>
              )}
            </button>
            <Link href="/admin/upload" className="btn btn-primary btn-sm sm:gap-2 px-2 sm:px-3" title="Upload Excel">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="hidden sm:inline">Upload Excel</span>
            </Link>
          </div>
        </div>

        {/* Blast email result */}
        {blastMessage && (
          <div className={`alert text-sm py-2 ${blastIsError ? 'alert-error' : 'alert-success'}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>{blastMessage}</span>
            <button onClick={() => setBlastMessage('')} className="ml-auto text-base-content/50 hover:text-base-content">✕</button>
          </div>
        )}

        {/* Blank ticket error */}
        {blankError && (
          <div className="alert alert-error text-sm py-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span>Gagal mencetak tiket kosong.</span>
            <button onClick={() => setBlankError(false)} className="ml-auto text-base-content/50 hover:text-base-content">✕</button>
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatTile icon="👥" iconClass="bg-primary/15 text-primary" label="Total Karyawan" value={totals.karyawan} loading={isLoading} />
          <StatTile icon="👪" iconClass="bg-secondary/15 text-secondary" label="Total Anggota Keluarga" value={totals.keluarga} loading={isLoading} />
          <StatTile icon="➕" iconClass="bg-info/15 text-info" label="Total Tambahan Peserta" value={totals.tambahan} loading={isLoading} />
          <StatTile icon="👶" iconClass="bg-warning/15 text-warning" label="Total Anak <2 Tahun" value={totals.belowTwo} loading={isLoading} />
          <TicketProgressTile generated={ticketStats.generated} eligible={ticketStats.eligible} loading={isLoading} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-base-100 border border-base-300 rounded-xl p-1 w-fit">
          <TabButton active={tab === 'bus'} onClick={() => { setTab('bus'); setSearch(''); }}>
            <span>🚌</span><span className="hidden sm:inline">Bus</span>
            {!isLoading && <CountBadge count={buses.length} active={tab === 'bus'} />}
          </TabButton>
          <TabButton active={tab === 'private_car'} onClick={() => { setTab('private_car'); setSearch(''); }}>
            <span>🚗</span><span className="hidden sm:inline">Kendaraan Pribadi</span>
            {!isLoading && <CountBadge count={cars.length} active={tab === 'private_car'} />}
          </TabButton>
          <TabButton active={tab === 'operational'} onClick={() => { setTab('operational'); setSearch(''); }}>
            <span>⚙️</span><span className="hidden sm:inline">Operational</span>
            {!isLoading && <CountBadge count={operationals.length} active={tab === 'operational'} />}
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

function StatTile({ icon, iconClass, label, value, loading }: {
  icon: string; iconClass: string; label: string; value: number; loading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${iconClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-base-content/55 uppercase tracking-wide truncate">{label}</p>
        {loading
          ? <span className="loading loading-dots loading-sm text-base-content/40" />
          : <p className="text-2xl font-bold leading-tight">{value.toLocaleString('id-ID')}</p>}
      </div>
    </div>
  );
}

function TicketProgressTile({ generated, eligible, loading }: {
  generated: number; eligible: number; loading: boolean;
}) {
  const done = eligible > 0 && generated >= eligible;
  return (
    <div className="rounded-2xl bg-base-100 border border-base-300 shadow-lg p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${done ? 'bg-success/15 text-success' : 'bg-accent/15 text-accent'}`}>
        🎫
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-base-content/55 uppercase tracking-wide truncate">Tiket Tergenerate</p>
        {loading
          ? <span className="loading loading-dots loading-sm text-base-content/40" />
          : (
            <p className="text-2xl font-bold leading-tight">
              {generated.toLocaleString('id-ID')}<span className="text-base-content/40">/{eligible.toLocaleString('id-ID')}</span>
            </p>
          )}
      </div>
    </div>
  );
}

// Dot before an employee's name: green once their individual ticket PDF/image has
// finished generating, yellow while the async job (kicked off right after upload)
// is still working through the queue. No dot at all for employees who never get
// an individual ticket (regular bus riders share their PIC's manifest ticket).
function TicketStatusDot({ employee }: { employee: any }) {
  const eligible = employee.transport_type === 'private_car'
    || employee.transport_type === 'operational'
    || employee.is_pic_bus;
  if (!eligible) return null;

  const generated = !!employee.pdf_filename;
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${generated ? 'bg-success' : 'bg-warning animate-pulse'}`}
      title={generated ? 'Tiket sudah tergenerate' : 'Tiket sedang menunggu digenerate'}
    />
  );
}

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

function AdditionalMembersBadge({ count }: { count: number }) {
  if (!count) return <span className="text-base-content/30 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
      +{count}
    </span>
  );
}

function BelowTwoBadge({ has }: { has: boolean }) {
  if (!has) return <span className="text-base-content/30 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
      👶 &lt;2 Thn
    </span>
  );
}

function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}*****@${domain}`;
}

function MaskedEmail({ email }: { email?: string | null }) {
  const masked = maskEmail(email);
  if (!masked) return <span className="text-base-content/30 text-xs">—</span>;
  return <span className="text-base-content/60 text-xs">{masked}</span>;
}

function EmailSentBadge({ sentAt }: { sentAt?: string | null }) {
  if (!sentAt) return null;
  const title = `Terkirim ${new Date(sentAt).toLocaleString('id-ID')}`;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20 shrink-0"
      title={title}
    >
      ✓ Terkirim
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
  if (type === 'operational') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
        ⚙️ Operational
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
      🚌 Bus
    </span>
  );
}

function EmployeeActionsMenu({ employee, showTicketFiles, showSendEmail }: {
  employee: any; showTicketFiles: boolean; showSendEmail: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Menu is portaled + position:fixed so it's never clipped by the scrollable
  // table wrapper or the rounded card's overflow-hidden.
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideMenu    = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
        setOpen(false);
      }
    };
    const handleReposition = () => setOpen(false);

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open]);

  const toggleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Prefer right-aligning the menu with the trigger (like a native dropdown),
      // but clamp so it never runs off either edge — the trigger can sit near the
      // left edge of the screen in the mobile card layout, not just the far right
      // like in the desktop table.
      const desiredLeft = rect.right - MENU_WIDTH;
      const left = Math.min(Math.max(desiredLeft, 8), window.innerWidth - MENU_WIDTH - 8);
      setMenuPos({ top: rect.bottom + 4, left });
    }
    setOpen((v) => !v);
  };

  const download = async (
    fetcher: (id: number) => Promise<Blob>,
    key: string,
    suffix: string,
    ext: string,
  ) => {
    setOpen(false);
    setBusy(key);
    try {
      const blob = await fetcher(employee.id);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${employee.name.replace(/\s+/g, '_').toLowerCase()}_${suffix}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  const handleSendEmail = async () => {
    setOpen(false);
    if (!window.confirm(`Kirim/kirim ulang email tiket ke ${employee.name}?`)) return;
    setBusy('email');
    setFeedback(null);
    try {
      await sendEmployeeEmail(employee.id);
      setFeedback({ ok: true, text: 'Terkirim' });
    } catch {
      setFeedback({ ok: false, text: 'Gagal kirim' });
    } finally {
      setBusy(null);
    }
  };

  const canSwitchTransport = employee.transport_type === 'bus' || employee.transport_type === 'private_car';
  const switchTarget = employee.transport_type === 'bus' ? 'private_car' : 'bus';
  const switchTargetLabel = switchTarget === 'private_car' ? 'Kendaraan Pribadi' : 'Bus';

  const handleSwitchTransport = async () => {
    setOpen(false);
    if (!window.confirm(`Pindahkan ${employee.name} ke ${switchTargetLabel}?`)) return;
    setBusy('switch');
    setFeedback(null);
    try {
      // Manual admin reassignment, not a gate-scanner anomaly — never carry the warning flag.
      // Vehicle count follows the new category: 1 for pribadi, 0 for bus.
      await updateEmployee(employee.id, {
        transport_type: switchTarget,
        switched_from_bus: false,
        total_vehicles: switchTarget === 'private_car' ? 1 : 0,
      });
      await mutate('employees');
      setFeedback({ ok: true, text: 'Dipindahkan' });
    } catch {
      setFeedback({ ok: false, text: 'Gagal pindah' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {feedback && (
        <span className={`text-[10px] font-semibold ${feedback.ok ? 'text-success' : 'text-error'}`}>
          {feedback.text}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className="btn btn-outline btn-xs px-2.5 border-base-300 hover:border-primary hover:bg-primary/10"
        title="Aksi tiket"
      >
        {busy
          ? <span className="loading loading-spinner loading-xs" />
          : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
            </svg>
          )}
      </button>

      {open && menuPos && createPortal(
        <ul
          ref={menuRef}
          style={{ position: 'fixed', top: menuPos.top, left: menuPos.left }}
          className="menu menu-sm z-[100] bg-base-100 rounded-box border border-base-300 shadow-lg w-48 p-1"
        >
          {showTicketFiles && (
            <>
              <li>
                <button onClick={() => download(downloadEmployeePdf, 'pdf', 'ticket', 'pdf')} disabled={busy === 'pdf'}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
                  </svg>
                  Download PDF
                </button>
              </li>
              <li>
                <button onClick={() => download(downloadEmployeeImage, 'image', 'ticket', 'png')} disabled={busy === 'image'}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Download Image
                </button>
              </li>
            </>
          )}
          <li>
            <button onClick={() => download(downloadEmployeeQr, 'qr', 'qr', 'png')} disabled={busy === 'qr'}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h3m-3-6h.01M17 20h.01" />
              </svg>
              Download QR
            </button>
          </li>
          {showSendEmail && (
            <li>
              <button onClick={handleSendEmail} disabled={busy === 'email'}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Kirim Email
              </button>
            </li>
          )}
          {canSwitchTransport && (
            <li>
              <button onClick={handleSwitchTransport} disabled={busy === 'switch'}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Pindahkan ke {switchTargetLabel}
              </button>
            </li>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}

function BusTable({ employees }: { employees: any[] }) {
  return (
    <>
      {/* Mobile: card list */}
      <div className="md:hidden divide-y divide-base-300">
        {employees.map((e: any) => (
          <div key={e.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <TicketStatusDot employee={e} />
                {e.name}
              </p>
              <TransportBadge type={e.transport_type} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <CardField label="Email" value={<span className="flex items-center gap-1.5 flex-wrap"><MaskedEmail email={e.email} /><EmailSentBadge sentAt={e.ticket_email_sent_at} /></span>} />
              <CardField label="Jml. Keluarga" value={<span className="font-semibold">{e.total_passengers ?? 1}</span>} />
              <CardField label="Tambahan Peserta" value={<AdditionalMembersBadge count={e.additional_members ?? 0} />} />
              <CardField label="Anak <2 Thn" value={<BelowTwoBadge has={!!e.has_below_two_children} />} />
              <CardField
                label="No. Bus"
                value={e.bus_number != null
                  ? <span className="font-semibold text-secondary">Bus {e.bus_number}</span>
                  : <span className="text-base-content/30">—</span>}
              />
              <CardField
                label="PIC Bus"
                value={e.is_pic_bus
                  ? <span className="text-xs font-semibold text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-0.5">⭐ PIC</span>
                  : <span className="text-base-content/30 text-xs">—</span>}
              />
              <CardField label="Titik Jemputan" value={<span className="text-base-content/70">{e.pickup_point ?? '—'}</span>} />
            </div>

            <div className="flex items-center pt-1">
              <EmployeeActionsMenu employee={e} showTicketFiles={!!e.is_pic_bus} showSendEmail={!!e.is_pic_bus && !!e.email} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <table className="table table-zebra w-full text-sm hidden md:table">
        <thead>
          <tr className="text-xs text-base-content/55 uppercase tracking-wide">
            <th>Nama</th>
            <th>Email</th>
            <th className="text-center">Jml. Keluarga</th>
            <th className="text-center">Tambahan Peserta</th>
            <th className="text-center">Anak &lt;2 Thn</th>
            <th>Jenis Kendaraan</th>
            <th>No. Bus</th>
            <th>PIC Bus</th>
            <th>Titik Jemputan</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e: any) => (
            <tr key={e.id}>
              <td className="font-medium">
                <span className="flex items-center gap-1.5">
                  <TicketStatusDot employee={e} />
                  {e.name}
                </span>
              </td>
              <td><span className="flex items-center gap-1.5"><MaskedEmail email={e.email} /><EmailSentBadge sentAt={e.ticket_email_sent_at} /></span></td>
              <td className="text-center font-semibold">{e.total_passengers ?? 1}</td>
              <td className="text-center"><AdditionalMembersBadge count={e.additional_members ?? 0} /></td>
              <td className="text-center"><BelowTwoBadge has={!!e.has_below_two_children} /></td>
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
              <td>
                <EmployeeActionsMenu employee={e} showTicketFiles={!!e.is_pic_bus} showSendEmail={!!e.is_pic_bus && !!e.email} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function CardField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-base-content/45 uppercase tracking-wide text-[10px] mb-0.5">{label}</p>
      <div>{value}</div>
    </div>
  );
}

function CarTable({ employees }: { employees: any[] }) {
  const switchedCount = employees.filter((e: any) => e.switched_from_bus).length;

  return (
    <>
      {switchedCount > 0 && (
        <div className="px-4 py-2.5 border-b border-base-300 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/15 text-warning border border-warning/30">
            ⚠️ Pindahan Bus
          </span>
          <span className="text-xs text-base-content/55">{switchedCount} karyawan dialihkan dari bus pada hari-H</span>
        </div>
      )}
      {/* Mobile: card list */}
      <div className="md:hidden divide-y divide-base-300">
        {employees.map((e: any) => (
          <div key={e.id} className={`p-4 space-y-3 ${e.switched_from_bus ? 'bg-warning/5' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <TicketStatusDot employee={e} />
                  {e.name}
                </p>
                {e.switched_from_bus && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/25 mt-1">
                    ⚠️ Pindahan Bus
                  </span>
                )}
              </div>
              <TransportBadge type={e.transport_type} />
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <CardField label="Email" value={<span className="flex items-center gap-1.5 flex-wrap"><MaskedEmail email={e.email} /><EmailSentBadge sentAt={e.ticket_email_sent_at} /></span>} />
              <CardField label="Jml. Keluarga" value={<span className="font-semibold">{e.total_passengers ?? 1}</span>} />
              <CardField label="Tambahan Peserta" value={<AdditionalMembersBadge count={e.additional_members ?? 0} />} />
              <CardField label="Anak <2 Thn" value={<BelowTwoBadge has={!!e.has_below_two_children} />} />
              <CardField label="Jml. Kendaraan" value={<span className="font-semibold">{e.total_vehicles ?? 0}</span>} />
            </div>

            <div className="flex items-center pt-1">
              <EmployeeActionsMenu employee={e} showTicketFiles={true} showSendEmail={!!e.email} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <table className="table table-zebra w-full text-sm hidden md:table">
        <thead>
          <tr className="text-xs text-base-content/55 uppercase tracking-wide">
            <th>Nama</th>
            <th>Email</th>
            <th className="text-center">Jml. Keluarga</th>
            <th className="text-center">Tambahan Peserta</th>
            <th className="text-center">Anak &lt;2 Thn</th>
            <th>Jenis Kendaraan</th>
            <th className="text-center">Jml. Kendaraan</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e: any) => (
            <tr key={e.id} className={e.switched_from_bus ? 'bg-warning/5' : ''}>
              <td>
                <p className="font-medium flex items-center gap-1.5">
                  <TicketStatusDot employee={e} />
                  {e.name}
                </p>
                {e.switched_from_bus && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/25 mt-0.5">
                    ⚠️ Pindahan Bus
                  </span>
                )}
              </td>
              <td><span className="flex items-center gap-1.5"><MaskedEmail email={e.email} /><EmailSentBadge sentAt={e.ticket_email_sent_at} /></span></td>
              <td className="text-center font-semibold">{e.total_passengers ?? 1}</td>
              <td className="text-center"><AdditionalMembersBadge count={e.additional_members ?? 0} /></td>
              <td className="text-center"><BelowTwoBadge has={!!e.has_below_two_children} /></td>
              <td><TransportBadge type={e.transport_type} /></td>
              <td className="text-center font-semibold">{e.total_vehicles ?? 0}</td>
              <td>
                <EmployeeActionsMenu employee={e} showTicketFiles={true} showSendEmail={!!e.email} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
