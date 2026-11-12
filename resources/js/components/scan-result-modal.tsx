import { AlertCircle, CalendarClock, CalendarDays, Check, Clock, X } from 'lucide-react';

export interface ScanResultData {
    type: 'success' | 'info';
    action: 'check_in' | 'check_out';
    name: string;
    photo?: string | null;
    status?: string | null;
    time?: string | null;
    event?: string | null;
}

function formatScanTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const raw = value.trim();

    if (/^\d{2}:\d{2}/.test(raw)) {
        return `${raw.slice(0, 5)} WIB`;
    }

    const date = new Date(raw);

    if (Number.isNaN(date.getTime())) {
        return raw;
    }

    const day = new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
    }).format(date);
    const time = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    })
        .format(date)
        .replace('.', ':');

    return `${day}, ${time} WIB`;
}

export function ScanResultModal({ result, onClose }: { result: ScanResultData; onClose: () => void }) {
    const isSuccess = result.type === 'success';
    const isLate = result.status === 'Late';
    const statusLabel = isLate ? 'Terlambat' : 'Hadir';
    const initials = result.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-live="assertive"
            aria-labelledby="scan-result-title"
        >
            <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white px-6 pt-9 pb-6 shadow-2xl">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -left-12 h-36 w-36 rounded-full bg-emerald-100/70" />
                    <div className="absolute -right-10 top-8 h-32 w-32 rounded-full bg-emerald-50" />
                    <div className="absolute top-24 -left-8 h-16 w-16 rounded-full bg-emerald-100/50" />
                    <span className="absolute top-8 left-16 h-2 w-8 rotate-[-35deg] rounded-full bg-amber-300" />
                    <span className="absolute top-14 right-16 h-2 w-7 rotate-[35deg] rounded-full bg-amber-300" />
                    <span className="absolute top-4 right-24 h-2 w-8 rotate-[55deg] rounded-full bg-sky-300" />
                    <span className="absolute bottom-24 left-10 h-2 w-6 rotate-[20deg] rounded-full bg-emerald-300" />
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup notifikasi"
                    className="absolute top-4 right-4 z-10 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="relative flex flex-col items-center text-center">
                    {isSuccess ? (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                            <Check className="h-11 w-11" strokeWidth={3.5} />
                        </div>
                    ) : (
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-rose-50">
                            <CalendarClock className="h-12 w-12 text-sky-600" strokeWidth={1.8} />
                            <span className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white ring-4 ring-white">
                                <AlertCircle className="h-5 w-5" strokeWidth={2.5} />
                            </span>
                        </div>
                    )}

                    <h2 id="scan-result-title" className="mt-5 text-[26px] leading-tight font-extrabold tracking-tight text-slate-900">
                        {isSuccess ? 'Absensi Berhasil' : 'Anda Sudah Absen'}
                    </h2>
                    <p className="mt-2 max-w-[300px] text-sm leading-relaxed text-slate-500">
                        {isSuccess
                            ? `${result.name} berhasil melakukan ${result.action === 'check_in' ? 'check-in' : 'check-out'}`
                            : `Anda sudah melakukan ${result.action === 'check_in' ? 'check-in' : 'check-out'} sebelumnya.`}
                    </p>

                    <div className="mt-5 flex w-full items-center gap-4 rounded-2xl bg-[#EEF2F8] p-4 text-left">
                        {result.photo ? (
                            <img
                                src={result.photo}
                                alt={result.name}
                                className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                            />
                        ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-white bg-sky-200 text-lg font-bold text-sky-700 shadow-sm">
                                {initials || '?'}
                            </div>
                        )}

                        <div className="h-16 w-px shrink-0 bg-slate-300/80" />

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-bold text-slate-900">{result.name}</p>
                            <span
                                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    isLate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                }`}
                            >
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${
                                        isLate ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                >
                                    {isLate ? <Clock className="h-3 w-3" strokeWidth={2.5} /> : <Check className="h-3 w-3" strokeWidth={3.5} />}
                                </span>
                                {statusLabel}
                            </span>
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                                <Clock className="h-4 w-4 shrink-0 text-slate-500" />
                                Waktu {result.action === 'check_in' ? 'Absen' : 'Pulang'}: {formatScanTime(result.time)}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                                <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                                Event : <span className="truncate font-medium text-slate-800">{result.event || '-'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
