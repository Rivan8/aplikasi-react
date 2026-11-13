import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BellRing,
    CalendarDays,
    CheckCheck,
    CircleHelp,
    HelpCircle,
    Maximize2,
    Minimize2,
    MonitorPlay,
    MapPin,
    Radio,
    RefreshCw,
    Timer,
    UserRoundCheck,
    Users,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventSession {
    id: number;
    title: string;
    date: string;
    start_time: string | null;
    attendance_start_time: string | null;
}

interface EventItem {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    attendance_start_time: string | null;
    expected: number;
    attendance_type?: string;
    sessions?: EventSession[];
}

interface RecentScan {
    id: number;
    member_id: string;
    name: string;
    foto_url?: string | null;
    role_label?: string | null;
    time: string | null;
    check_out_time?: string | null;
    status: string;
    late_minutes?: number;
}

interface MonitorFilters {
    event_id: string;
    event_session_id: string;
}

interface AuthUser {
    name: string;
    email?: string;
    avatar?: string | null;
}

const AVATAR_TONES = [
    'bg-[#F58220]/20 text-[#FFB786] border-[#F58220]/25',
    'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
    'bg-sky-500/15 text-sky-300 border-sky-400/25',
    'bg-violet-500/15 text-violet-300 border-violet-400/25',
    'bg-amber-500/15 text-amber-300 border-amber-400/25',
];

function initialsOf(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function toneOf(seed: string): string {
    let hash = 0;

    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash + seed.charCodeAt(index)) % AVATAR_TONES.length;
    }

    return AVATAR_TONES[hash];
}

function formatClock(date: Date): string {
    return [date.getHours(), date.getMinutes(), date.getSeconds()]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

function formatLongDate(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return '';
    }

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatShortDate(value: string | null | undefined): string {
    if (!value) {
        return '';
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return '';
    }

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatCountdown(seconds: number): string {
    const absolute = Math.abs(seconds);
    const hours = Math.floor(absolute / 3600);
    const minutes = Math.floor((absolute % 3600) / 60);
    const remainder = String(absolute % 60).padStart(2, '0');

    return hours > 0
        ? `${hours}j ${String(minutes).padStart(2, '0')}m ${remainder}s`
        : `${minutes}m ${remainder}s`;
}

function statusLabel(scan: RecentScan): string {
    if (scan.status === 'Late') {
        return scan.late_minutes ? `Terlambat +${scan.late_minutes}m` : 'Terlambat';
    }

    return 'Hadir Tepat Waktu';
}

export default function AttendanceMonitor({
    events = [],
    recentScans = [],
    totalScanned = 0,
    totalVolunteer = 0,
    filters,
}: {
    events: EventItem[];
    recentScans: RecentScan[];
    totalScanned: number;
    totalVolunteer?: number;
    filters: MonitorFilters;
}) {
    const page = usePage<{ auth?: { user?: AuthUser | null } }>();
    const user = page.props.auth?.user ?? null;
    const [now, setNow] = useState(() => new Date());
    const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenElement));
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const previousScanCount = useRef(totalScanned);

    const selectedEvent = events.find((event) => String(event.id) === filters.event_id);
    const sessions = selectedEvent?.sessions ?? [];
    const selectedSession = sessions.find((session) => String(session.id) === filters.event_session_id);
    const eventDate = selectedSession?.date ?? selectedEvent?.date ?? null;
    const toleranceTime = selectedSession?.attendance_start_time
        ?? selectedSession?.start_time
        ?? selectedEvent?.attendance_start_time
        ?? selectedEvent?.time
        ?? null;
    const toleranceAt = eventDate && toleranceTime ? new Date(`${eventDate}T${toleranceTime}`) : null;
    const toleranceValid = toleranceAt !== null && !Number.isNaN(toleranceAt.getTime());
    const remainingSeconds = toleranceValid
        ? Math.floor((toleranceAt.getTime() - now.getTime()) / 1000)
        : 0;
    const totalTarget = totalVolunteer || selectedEvent?.expected || 0;
    const lateCount = recentScans.filter((scan) => scan.status === 'Late').length;
    const latestScan = recentScans[0] ?? null;

    useEffect(() => {
        const clock = window.setInterval(() => setNow(new Date()), 1000);
        const interval = window.setInterval(() => {
            router.reload({
                only: ['recentScans', 'totalScanned', 'totalVolunteer', 'filters'],
            });
        }, 3000);

        return () => {
            window.clearInterval(clock);
            window.clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', handler);

        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    useEffect(() => {
        if (totalScanned > previousScanCount.current && soundEnabled) {
            try {
                const AudioCtor = window.AudioContext
                    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

                if (AudioCtor) {
                    const context = new AudioCtor();
                    const oscillator = context.createOscillator();
                    const gain = context.createGain();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(880, context.currentTime);
                    oscillator.frequency.setValueAtTime(1174, context.currentTime + 0.12);
                    gain.gain.setValueAtTime(0.0001, context.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
                    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
                    oscillator.connect(gain);
                    gain.connect(context.destination);
                    oscillator.start();
                    oscillator.stop(context.currentTime + 0.4);
                    oscillator.onended = () => void context.close();
                }
            } catch {
                // Audio opsional: abaikan bila browser memblokir autoplay.
            }
        }

        previousScanCount.current = totalScanned;
    }, [totalScanned, soundEnabled]);

    const subtitle = !selectedEvent
        ? 'Pilih event untuk menampilkan kehadiran.'
        : selectedSession
            ? `${selectedEvent.title} — ${selectedSession.title}`
            : selectedEvent.title;

    const changeFilter = (eventId: string, sessionId = '') => {
        router.get('/attendance-monitor', {
            event_id: eventId,
            ...(sessionId ? { event_session_id: sessionId } : {}),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const toggleFullscreen = () => {
        if (typeof document === 'undefined') {
            return;
        }

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
        } else {
            document.exitFullscreen?.().catch(() => {});
        }
    };

    const classParticipantEvents = events.filter((event) => event.attendance_type === 'class_participant');
    const volunteerEvents = events.filter((event) => event.attendance_type !== 'class_participant');
    const announcement = selectedEvent
        ? [
            `Absensi ${selectedEvent.title}${selectedSession ? ` — ${selectedSession.title}` : ''} sedang berlangsung`,
            toleranceTime ? `batas toleransi ${toleranceTime.slice(0, 5)} WIB` : null,
            `${totalScanned} dari ${totalTarget || '—'} volunteer sudah hadir`,
            lateCount > 0 ? `${lateCount} terlambat` : null,
            'data diperbarui otomatis setiap 3 detik',
        ].filter(Boolean).join(' • ')
        : 'Belum ada event absensi yang aktif. Pilih event untuk mulai memantau kehadiran.';

    return (
        <>
            <Head title="Monitor Absensi" />
            <div className="min-h-screen bg-[#0B0F17] font-sans text-[#F1F5F9] antialiased selection:bg-orange-500/30 selection:text-orange-200">
                <header className="sticky top-0 z-40 flex w-full flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 bg-[#121722]/90 px-4 py-3 shadow-md backdrop-blur-md sm:px-6">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 bg-white p-0.5 shadow-sm">
                                <AppLogoIcon className="h-7 w-7 object-contain" />
                            </span>
                            <div className="flex flex-col">
                                <span className="text-base font-bold leading-tight tracking-tight text-white">ESC Planning Center</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operational Center</span>
                            </div>
                        </div>
                        <div className="hidden h-7 w-px bg-slate-800 md:block" />
                        <div className="flex w-full items-center gap-2 md:w-auto">
                            <Select value={filters.event_id} onValueChange={(value) => changeFilter(value)}>
                                <SelectTrigger className="h-auto min-w-[220px] gap-2.5 rounded-lg border-slate-700/60 bg-[#181F2C] px-3 py-1.5 text-slate-200 hover:bg-slate-800">
                                    <CalendarDays className="h-4 w-4 shrink-0 text-[#F58220]" />
                                    <SelectValue placeholder="Pilih event" />
                                </SelectTrigger>
                                <SelectContent className="border-slate-700 bg-[#181F2C] text-slate-200">
                                    {volunteerEvents.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel className="text-[11px] uppercase tracking-wider text-slate-500">Pelayanan (Doa Persiapan Ibadah)</SelectLabel>
                                            {volunteerEvents.map((event) => (
                                                <SelectItem key={event.id} value={String(event.id)} className="focus:bg-slate-700/60 focus:text-white">
                                                    <span className="truncate font-medium">{event.title}</span>
                                                    {event.date && <span className="font-mono text-[11px] text-slate-400">{formatShortDate(event.date)}</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                    {classParticipantEvents.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel className="text-[11px] uppercase tracking-wider text-slate-500">Peserta Kelas/Sesi</SelectLabel>
                                            {classParticipantEvents.map((event) => (
                                                <SelectItem key={event.id} value={String(event.id)} className="focus:bg-slate-700/60 focus:text-white">
                                                    <span className="truncate font-medium">{event.title}</span>
                                                    {event.date && <span className="font-mono text-[11px] text-slate-400">{formatShortDate(event.date)}</span>}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                            {sessions.length > 0 && (
                                <Select value={filters.event_session_id || 'all'} onValueChange={(value) => changeFilter(filters.event_id, value === 'all' ? '' : value)}>
                                    <SelectTrigger className="h-auto rounded-lg border-slate-700/60 bg-[#181F2C] px-3 py-1.5 text-slate-200 hover:bg-slate-800">
                                        <SelectValue placeholder="Doa Persiapan Ibadah" />
                                    </SelectTrigger>
                                    <SelectContent className="border-slate-700 bg-[#181F2C] text-slate-200">
                                        <SelectItem value="all" className="focus:bg-slate-700/60 focus:text-white">Doa Persiapan Ibadah</SelectItem>
                                        {sessions.map((session) => (
                                            <SelectItem key={session.id} value={String(session.id)} className="focus:bg-slate-700/60 focus:text-white">{session.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3 py-1.5 text-emerald-400 shadow-inner lg:flex">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            <span className="font-mono text-[12px] font-semibold">{formatClock(now)} WIB</span>
                            <span className="ml-1 text-[10px] font-bold tracking-wider text-emerald-300">LIVE SYNC</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setGuideOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                                title="Panduan Monitor"
                            >
                                <HelpCircle className="h-4 w-4" />
                                <span className="hidden xl:inline">Panduan</span>
                            </button>
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                                title={isFullscreen ? 'Keluar Kiosk Mode' : 'Kiosk Mode'}
                            >
                                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                                <span className="hidden xl:inline">Kiosk Mode</span>
                            </button>
                        </div>
                        <div className="hidden h-7 w-px bg-slate-800 sm:block" />
                        <div className="flex items-center gap-2">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-9 w-9 rounded-full border border-slate-700 object-cover ring-2 ring-orange-500/20"
                                />
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#F58220]/40 bg-[#F58220]/15 text-xs font-bold text-[#FFB786] ring-2 ring-orange-500/20">
                                    {initialsOf(user?.name ?? 'Admin')}
                                </div>
                            )}
                            <div className="hidden flex-col text-left sm:flex">
                                <span className="text-[13px] font-bold leading-tight text-white">{user?.name ?? 'Admin'}</span>
                                <span className="text-[11px] font-medium text-slate-400">Attendance Admin</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6">
                    <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#131822] p-5 shadow-xl xl:flex-row xl:items-center">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F58220] shadow-lg shadow-orange-500/20">
                                <MonitorPlay className="h-7 w-7 text-[#2A1200]" strokeWidth={2} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xl font-bold tracking-tight text-white">Monitor Kehadiran</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-300">
                                        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                                        LIVE ATTENDANCE BOARD
                                    </span>
                                </div>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-slate-400">
                                    <span>{subtitle}</span>
                                    {eventDate && (
                                        <>
                                            <span className="opacity-40">•</span>
                                            <span>{formatLongDate(eventDate)}</span>
                                        </>
                                    )}
                                    {selectedEvent?.location && (
                                        <>
                                            <span className="opacity-40">•</span>
                                            <span className="flex items-center gap-1 text-[#FFB786]">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {selectedEvent.location}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full items-center justify-between gap-4 xl:w-auto xl:justify-end">
                            <div className="flex items-center gap-4 rounded-xl bg-[#0A0E16] px-5 py-2.5 shadow-inner">
                                <div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-mono text-[32px] font-bold leading-tight tracking-tight tabular-nums text-[#F1F5F9]">{formatClock(now)}</span>
                                        <span className="text-[11px] font-bold text-[#FFB786]">WIB</span>
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-slate-400">
                                        <Timer className="h-3.5 w-3.5 text-emerald-400" />
                                        {toleranceValid ? (
                                            <>
                                                <span>
                                                    Batas Toleransi: <strong className="font-semibold text-[#F1F5F9]">{toleranceTime?.slice(0, 5)} WIB</strong>
                                                </span>
                                                <span className="opacity-40">•</span>
                                                <span className={`font-mono text-[11px] font-semibold tracking-wide ${remainingSeconds >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                                                    {remainingSeconds >= 0
                                                        ? `${formatCountdown(remainingSeconds)} Tersisa`
                                                        : `Lewat ${formatCountdown(remainingSeconds)}`}
                                                </span>
                                            </>
                                        ) : (
                                            <span>Jadwal toleransi belum ditentukan</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setSoundEnabled((value) => !value)}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181F2C] text-slate-400 transition-all hover:bg-[#202838] hover:text-white"
                                    title={soundEnabled ? 'Matikan Bunyi Konfirmasi' : 'Aktifkan Bunyi Konfirmasi'}
                                >
                                    {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181F2C] text-slate-400 transition-all hover:bg-[#202838] hover:text-white"
                                    title="Toggle Fullscreen"
                                >
                                    {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => isFullscreen && toggleFullscreen()}
                                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181F2C] text-slate-400 transition-all hover:bg-[#202838] hover:text-rose-300"
                                    title="Keluar Mode Layar Penuh"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#131822] p-5 shadow-2xl">
                        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

                        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F58220] opacity-75" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#F58220]" />
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFB786]">Baru Saja Check-In • Spotlight</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    Real-Time Synchronized
                                </span>
                                <span className="rounded-full bg-[#181F2C] px-2.5 py-1 font-mono text-[10px] text-slate-400">
                                    Scan #{String(totalScanned).padStart(3, '0')}
                                </span>
                            </div>
                        </div>

                        {latestScan ? (
                            <div className="relative flex flex-col items-center gap-5 pt-5 sm:flex-row sm:items-start">
                                <div className="relative shrink-0">
                                    <div className={`flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border-2 text-3xl font-bold shadow-2xl sm:h-32 sm:w-32 ${latestScan.status === 'Late' ? 'border-amber-400/40 bg-amber-500/20 text-amber-200' : 'border-emerald-400/40 bg-[#202838] text-emerald-300'}`}>
                                        {initialsOf(latestScan.name) || '?'}
                                        {latestScan.foto_url && (
                                            <img
                                                src={latestScan.foto_url}
                                                alt={latestScan.name}
                                                className="absolute inset-0 h-full w-full object-cover"
                                                onError={(event) => {
                                                    event.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className={`absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full shadow-lg ${latestScan.status === 'Late' ? 'bg-amber-400 text-[#2A1700]' : 'bg-emerald-400 text-emerald-950'}`}>
                                        <CheckCheck className="h-4 w-4" strokeWidth={3} />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 text-center sm:text-left">
                                    <div className="mb-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                        <span className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${latestScan.status === 'Late' ? 'border-amber-400/30 bg-amber-500/15 text-amber-300' : 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300'}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${latestScan.status === 'Late' ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                                            {statusLabel(latestScan)}
                                        </span>
                                        <span className="rounded bg-[#181F2C] px-2 py-0.5 font-mono text-[10px] text-slate-400">ID: {latestScan.member_id}</span>
                                        <span className="rounded bg-orange-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FFB786]">{latestScan.time ?? '—'} WIB</span>
                                    </div>
                                    <h2 className="truncate text-3xl font-bold tracking-tight text-white">{latestScan.name}</h2>
                                    <p className={`mt-0.5 truncate text-[15px] font-medium ${latestScan.role_label ? 'text-[#FFB786]' : 'text-amber-300'}`}>
                                        {latestScan.role_label || 'Volunteer tidak tercatat dalam jadwal pelayanan'}
                                    </p>
                                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-800 bg-[#181F2C] p-3 text-left shadow-inner">
                                        <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[#F58220]" />
                                        <p className="text-[13px] leading-relaxed text-slate-200">
                                            <span className="font-semibold">Selamat melayani, Kak {latestScan.name.split(' ')[0]}!</span>{' '}
                                            {toleranceValid
                                                ? <>Batas toleransi absensi pukul <strong className="font-bold text-[#FFB786]">{toleranceTime?.slice(0, 5)} WIB</strong>. </>
                                                : null}
                                            Saat ini <strong className="font-bold text-emerald-300">{totalScanned}</strong> dari <strong className="font-bold text-slate-100">{totalTarget || '—'}</strong> volunteer sudah hadir.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 py-10 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-[#181F2C]">
                                    <Radio className="h-8 w-8 text-slate-500" />
                                </div>
                                <p className="text-base font-semibold text-slate-200">Menunggu check-in pertama</p>
                                <p className="max-w-md text-sm text-slate-500">Kehadiran terbaru akan tampil di sini secara otomatis saat volunteer melakukan scan.</p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-slate-800/80 bg-[#181F2C] p-5 shadow-xl">
                        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                                    <UserRoundCheck className="h-5 w-5 text-[#F58220]" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold leading-tight text-white">Daftar User Hadir (Check-In Live)</h2>
                                    <p className="text-[12px] text-slate-400">Daftar kehadiran real-time pelayan &amp; volunteer ibadah</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    AUTO-UPDATING
                                </span>
                                <span className="rounded-full bg-[#202838] px-3 py-1 text-[11px] font-semibold text-slate-400">
                                    {totalScanned} HADIR / {totalTarget || '—'} TOTAL
                                </span>
                            </div>
                        </div>

                        {recentScans.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-slate-700 px-6 py-16 text-center">
                                <Users className="mx-auto h-10 w-10 text-slate-600" />
                                <p className="mt-3 text-base font-semibold text-slate-300">Belum ada peserta yang melakukan absensi.</p>
                                <p className="mt-1 text-sm text-slate-500">Data akan muncul otomatis setelah scan pertama masuk.</p>
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {recentScans.map((scan, index) => {
                                    const isLate = scan.status === 'Late';
                                    const isLatest = index === 0;

                                    return (
                                        <article
                                            key={scan.id}
                                            className={`relative flex flex-col justify-between overflow-hidden rounded-xl border p-3 transition-all hover:bg-[#202838] ${
                                                isLatest
                                                    ? 'border-2 border-emerald-400/40 bg-[#131822] shadow-md ring-1 ring-emerald-400/30'
                                                    : 'border-slate-800 bg-[#131822] shadow-sm'
                                            }`}
                                        >
                                            <div className="mb-2.5 flex min-w-0 items-center gap-2.5">
                                                <div className="relative shrink-0">
                                                    <div className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border text-sm font-bold shadow ${toneOf(scan.member_id)}`}>
                                                        {initialsOf(scan.name) || '?'}
                                                        {scan.foto_url && (
                                                            <img
                                                                src={scan.foto_url}
                                                                alt={scan.name}
                                                                className="absolute inset-0 h-full w-full object-cover"
                                                                onError={(event) => {
                                                                    event.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {isLatest && (
                                                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-1">
                                                        <h3 className="truncate text-[14px] font-bold leading-tight text-white">{scan.name}</h3>
                                                        <span className="shrink-0 rounded bg-[#181F2C] px-1 py-0.5 font-mono text-[10px] text-slate-400">{scan.member_id}</span>
                                                    </div>
                                                    <p className={`mt-0.5 truncate text-[11px] ${scan.role_label ? 'text-slate-400' : 'text-amber-300/90'}`}>
                                                        {scan.role_label || 'Di luar jadwal pelayanan'}
                                                    </p>
                                                    {scan.check_out_time && (
                                                        <p className="mt-0.5 truncate text-[10px] text-slate-500">Pulang {scan.check_out_time} WIB</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
                                                <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${isLate ? 'border border-amber-400/20 bg-amber-500/10 text-amber-300' : 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${isLate ? 'bg-amber-300' : 'bg-emerald-300'}`} />
                                                    {statusLabel(scan)}
                                                </span>
                                                <span className={`font-mono text-[12px] font-bold tabular-nums ${isLate ? 'text-amber-300' : 'text-[#F1F5F9]'}`}>
                                                    {scan.time ?? '—'} WIB
                                                </span>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <footer className="flex items-center gap-3 overflow-hidden rounded-xl bg-[#131822] px-5 py-2.5 shadow-xl">
                        <div className="flex shrink-0 items-center gap-1.5 rounded bg-[#F58220] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2A1200]">
                            <BellRing className="h-4 w-4" />
                            <span>Pengumuman</span>
                        </div>
                        <div className="relative w-full overflow-hidden whitespace-nowrap">
                            <div className="inline-block animate-[monitor-marquee_32s_linear_-6s_infinite] pr-16 text-[13px] text-slate-200">
                                {announcement}
                            </div>
                        </div>
                    </footer>
                </main>
            </div>

            <style>{`
                @keyframes monitor-marquee {
                    from { transform: translateX(100%); }
                    to { transform: translateX(-100%); }
                }
            `}</style>

            <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent className="border-slate-800 bg-[#141A24] text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                            <CircleHelp className="h-4 w-4 text-[#F58220]" />
                            Panduan Monitor Absensi
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Layar ini bisa dipakai di TV ruang kontrol atau meja registrasi.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="space-y-2 text-sm">
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">Pilih event.</span> Gunakan dropdown event di header agar data kehadiran sesuai ibadah yang berjalan.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">Pantau spotlight.</span> Check-in terbaru tampil paling atas beserta status tepat waktu atau terlambat.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">Kiosk Mode.</span> Tekan tombol layar penuh untuk menampilkan monitor tanpa gangguan navigasi.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">Pembaruan otomatis.</span> Data disegarkan setiap 3 detik; bunyi konfirmasi bisa diaktifkan lewat ikon speaker.
                        </li>
                    </ul>
                </DialogContent>
            </Dialog>
        </>
    );
}
