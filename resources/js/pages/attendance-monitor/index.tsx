import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock3, Monitor, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EventSession {
    id: number;
    title: string;
    date: string;
}

interface EventItem {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    expected: number;
    sessions?: EventSession[];
}

interface RecentScan {
    id: number;
    member_id: string;
    name: string;
    foto_url?: string | null;
    time: string | null;
    status: string;
}

interface MonitorFilters {
    event_id: string;
    event_session_id: string;
}

export default function AttendanceMonitor({
    events = [],
    recentScans = [],
    totalScanned = 0,
    filters,
}: {
    events: EventItem[];
    recentScans: RecentScan[];
    totalScanned: number;
    filters: MonitorFilters;
}) {
    const [updatedAt, setUpdatedAt] = useState(() => new Date());
    const [now, setNow] = useState(() => new Date());
    const selectedEvent = events.find((event) => String(event.id) === filters.event_id);
    const sessions = selectedEvent?.sessions ?? [];
    const selectedSession = sessions.find((session) => String(session.id) === filters.event_session_id);
    const completion = selectedEvent?.expected
        ? Math.min(100, Math.round((totalScanned / selectedEvent.expected) * 100))
        : 0;
    const eventStart = selectedEvent?.date && selectedEvent.time
        ? new Date(`${selectedEvent.date}T${selectedEvent.time}`)
        : null;
    const countdownSeconds = eventStart && !Number.isNaN(eventStart.getTime())
        ? Math.max(0, Math.floor((eventStart.getTime() - now.getTime()) / 1000))
        : 0;
    const eventStarted = eventStart ? now.getTime() >= eventStart.getTime() : false;

    const formatCountdown = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainder = seconds % 60;

        return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':');
    };

    useEffect(() => {
        const clock = window.setInterval(() => setNow(new Date()), 1000);
        const interval = window.setInterval(() => {
            router.reload({
                only: ['recentScans', 'totalScanned', 'filters'],
                preserveState: true,
            });
            setUpdatedAt(new Date());
        }, 3000);

        return () => {
            window.clearInterval(clock);
            window.clearInterval(interval);
        };
    }, []);

    const subtitle = useMemo(() => {
        if (!selectedEvent) return 'Pilih event untuk menampilkan kehadiran.';
        if (selectedSession) return `${selectedEvent.title} - ${selectedSession.title}`;
        return selectedEvent.title;
    }, [selectedEvent, selectedSession]);

    const changeFilter = (eventId: string, sessionId = '') => {
        router.get('/attendance-monitor', {
            event_id: eventId,
            ...(sessionId ? { event_session_id: sessionId } : {}),
        }, {
            preserveState: true,
            replace: true,
        });
    };

    return (
        <>
            <Head title="Monitor Absensi" />
            <main className="min-h-screen bg-slate-950 px-4 py-5 text-white sm:px-8 lg:px-12">
                <header className="mx-auto flex max-w-7xl flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-emerald-300">
                            <Monitor className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-[0.25em]">Monitor Absensi Live</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{subtitle}</h1>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                            <Clock3 className="h-4 w-4" />
                            Diperbarui {updatedAt.toLocaleTimeString('id-ID')}
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[280px]">
                        <Select value={filters.event_id} onValueChange={(value) => changeFilter(value)}>
                            <SelectTrigger className="border-white/15 bg-white/10 text-white">
                                <SelectValue placeholder="Pilih event" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map((event) => (
                                    <SelectItem key={event.id} value={String(event.id)}>{event.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {sessions.length > 0 && (
                            <Select value={filters.event_session_id || 'all'} onValueChange={(value) => changeFilter(filters.event_id, value === 'all' ? '' : value)}>
                                <SelectTrigger className="border-white/15 bg-white/10 text-white">
                                    <SelectValue placeholder="Semua sesi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua sesi</SelectItem>
                                    {sessions.map((session) => (
                                        <SelectItem key={session.id} value={String(session.id)}>{session.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </header>

                <section className="mx-auto grid max-w-7xl gap-5 py-6 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 md:col-span-2">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-slate-400">Total hadir</p>
                                <p className="mt-1 text-5xl font-bold text-emerald-300">{totalScanned}</p>
                            </div>
                            <Users className="h-12 w-12 text-emerald-300/70" />
                        </div>
                        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${completion}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Target {selectedEvent?.expected ?? 0} jemaat</p>
                    </div>
                    <div className="rounded-2xl border-2 border-emerald-300/60 bg-emerald-400/15 p-5 shadow-[0_0_30px_rgba(52,211,153,0.18)] md:p-6">
                        <p className="text-sm font-medium uppercase tracking-[0.12em] text-emerald-100/80">Waktu mulai event</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                            {eventStart
                                ? eventStart.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                                : '-'}
                        </p>
                        <p className="mt-5 text-base font-semibold text-emerald-100">
                            {eventStarted ? `${selectedEvent?.title ?? 'Event'} sedang dimulai` : `${selectedEvent?.title ?? 'Event'} akan dimulai dalam:`}
                        </p>
                        <p className="mt-1 font-mono text-5xl font-black tracking-tight text-emerald-300 sm:text-6xl">
                            {eventStarted ? '00:00:00' : formatCountdown(countdownSeconds)}
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Peserta terbaru</h2>
                            <p className="mt-1 text-sm text-slate-400">Daftar absensi yang masuk terakhir.</p>
                        </div>
                        <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">LIVE</Badge>
                    </div>
                    {recentScans.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/15 px-6 py-20 text-center text-slate-400">Belum ada peserta yang melakukan absensi.</div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {recentScans.map((scan) => (
                                <article key={scan.id} className={`flex items-center gap-4 rounded-2xl border p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 ${scan.status === 'Late' ? 'border-amber-400/40 bg-amber-400/[0.10]' : 'border-white/10 bg-white/[0.06]'}`}>
                                    <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold text-white ${scan.status === 'Late' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                        {scan.name.charAt(0).toUpperCase()}
                                        {scan.foto_url && <img src={scan.foto_url} alt="" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate font-semibold">{scan.name}</h3>
                                        <p className={`mt-1 text-xs ${scan.status === 'Late' ? 'text-amber-300' : 'text-slate-400'}`}>{scan.time ?? '-'} · {scan.status === 'Present' ? 'Hadir' : 'Terlambat'}</p>
                                    </div>
                                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${scan.status === 'Late' ? 'text-amber-300' : 'text-emerald-300'}`} />
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
