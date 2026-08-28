import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock3,
    ExternalLink,
    FileText,
    ListChecks,
    PauseCircle,
    PlayCircle,
    Radio,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Song {
    title: string;
    artist?: string | null;
    arrangement_name?: string | null;
    song_flow?: string | null;
    bpm?: string | null;
    keys?: string | null;
    time_signature?: string | null;
    lyrics?: string | null;
    video_url?: string | null;
}

interface RundownItem {
    id: number;
    title: string;
    duration_seconds: number;
    song?: Song | null;
}

interface RundownSegment {
    id: number;
    title: string;
    duration_seconds: number;
    items: RundownItem[];
}

interface EventData {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    category: string;
    rundown_segments: RundownSegment[];
    live_session?: {
        status: string;
        current_segment_index: number;
        current_item_index: number;
        item_started_at?: string | null;
    } | null;
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

export default function LiveRundown({
    event,
    server_now,
}: {
    event: EventData;
    server_now: string;
}) {
    const [now, setNow] = useState(() => Date.parse(server_now) || Date.now());
    const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const refresh = window.setInterval(() => {
            router.reload({ only: ['event', 'server_now'] });
        }, 5000);

        return () => window.clearInterval(refresh);
    }, []);

    useEffect(() => {
        let sentinel: WakeLockSentinel | null = null;
        const requestWakeLock = async () => {
            const wakeLockApi = (
                navigator as Navigator & {
                    wakeLock?: {
                        request: (type: 'screen') => Promise<WakeLockSentinel>;
                    };
                }
            ).wakeLock;
            if (!wakeLockApi) return;
            try {
                sentinel = await wakeLockApi.request('screen');
                setWakeLock(sentinel);
            } catch {
                setWakeLock(null);
            }
        };
        void requestWakeLock();
        return () => {
            void sentinel?.release();
        };
    }, []);

    const active =
        event.live_session?.status === 'running' ? event.live_session : null;
    const activeSegment = active
        ? event.rundown_segments[active.current_segment_index]
        : null;
    const activeItem =
        activeSegment?.items[active?.current_item_index ?? 0] ?? null;
    const elapsed = active?.item_started_at
        ? Math.max(
              0,
              Math.floor((now - Date.parse(active.item_started_at)) / 1000),
          )
        : 0;
    const remaining = activeItem
        ? Math.max(0, activeItem.duration_seconds - elapsed)
        : 0;
    const allItems = useMemo(
        () => event.rundown_segments.flatMap((segment) => segment.items),
        [event.rundown_segments],
    );

    return (
        <div className="min-h-screen bg-[#0e1c1b] pb-10 text-white">
            <Head title={`Live Rundown - ${event.title}`} />
            <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0e1c1b]/95 px-4 py-4 backdrop-blur-xl sm:px-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
                    <Link
                        href="/my/events"
                        className="flex items-center gap-2 text-sm text-teal-100/75 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kegiatan
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-teal-100/70">
                        <span
                            className={`h-2 w-2 rounded-full ${active ? 'animate-pulse bg-amber-400' : 'bg-slate-500'}`}
                        />
                        {active ? 'LIVE' : 'Rundown'}
                    </div>
                </div>
            </header>
            <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
                <section className="rounded-[28px] border border-white/10 bg-[#17312f] p-5 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <Badge className="gap-1 bg-amber-400 text-amber-950 hover:bg-amber-400">
                                <Radio className="h-3 w-3" />
                                Panduan Event
                            </Badge>
                            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                                {event.title}
                            </h1>
                            <p className="mt-2 text-sm text-teal-100/65">
                                {event.category} · {event.location} ·{' '}
                                {event.time}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                            {active ? (
                                <PlayCircle className="h-6 w-6 text-amber-300" />
                            ) : (
                                <PauseCircle className="h-6 w-6 text-teal-200/60" />
                            )}
                            <div>
                                <p className="text-xs text-teal-100/60">
                                    Status
                                </p>
                                <p className="font-semibold">
                                    {active
                                        ? 'Sedang berlangsung'
                                        : 'Menunggu live dimulai'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {activeItem && (
                        <div className="mt-8 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold tracking-[0.16em] text-amber-200 uppercase">
                                        Item saat ini
                                    </p>
                                    <h2 className="mt-2 text-2xl font-bold text-white">
                                        {activeItem.title}
                                    </h2>
                                    {activeItem.song && (
                                        <p className="mt-1 text-sm text-amber-100/75">
                                            {activeItem.song.title}{' '}
                                            {activeItem.song.artist
                                                ? `· ${activeItem.song.artist}`
                                                : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-amber-100/65">
                                        Sisa durasi
                                    </p>
                                    <p className="font-mono text-3xl font-bold text-amber-200">
                                        {formatDuration(remaining)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
                <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold">Urutan Acara</h2>
                            <span className="text-xs text-teal-100/55">
                                {allItems.length} item
                            </span>
                        </div>
                        {event.rundown_segments.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-teal-100/60">
                                Rundown belum tersedia.
                            </div>
                        ) : (
                            event.rundown_segments.map(
                                (segment, segmentIndex) => (
                                    <div
                                        key={segment.id}
                                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#17312f]"
                                    >
                                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                            <span className="text-xs font-bold tracking-widest text-teal-100/65 uppercase">
                                                {segmentIndex + 1}.{' '}
                                                {segment.title}
                                            </span>
                                            <Clock3 className="h-4 w-4 text-teal-100/45" />
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {segment.items.map(
                                                (item, itemIndex) => {
                                                    const isActive =
                                                        active?.current_segment_index ===
                                                            segmentIndex &&
                                                        active.current_item_index ===
                                                            itemIndex;
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`px-4 py-3 ${isActive ? 'bg-amber-300/15 text-amber-100' : 'text-teal-50/80'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-5 text-xs text-teal-100/40">
                                                                    {itemIndex +
                                                                        1}
                                                                </span>
                                                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                                                    {item.title}
                                                                </span>
                                                                <span className="text-xs text-teal-100/45">
                                                                    {formatDuration(
                                                                        item.duration_seconds,
                                                                    )}
                                                                </span>
                                                                {isActive && (
                                                                    <Radio className="h-3.5 w-3.5 animate-pulse text-amber-300" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>
                                ),
                            )
                        )}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Detail Panduan</h2>
                        {activeItem?.song ? (
                            <div className="rounded-2xl border border-white/10 bg-[#17312f] p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold tracking-widest text-teal-100/55 uppercase">
                                            Lagu / Arrangement
                                        </p>
                                        <h3 className="mt-2 text-2xl font-bold">
                                            {activeItem.song.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-teal-100/60">
                                            {activeItem.song.artist ||
                                                   'Arrangement event'}
                                                {activeItem.song.arrangement_name
                                                    ? ` · ${activeItem.song.arrangement_name}`
                                                    : ''}
                                        </p>
                                    </div>
                                    <ListChecks className="h-5 w-5 text-amber-300" />
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    {[
                                        ['Key', activeItem.song.keys],
                                        ['BPM', activeItem.song.bpm],
                                        [
                                            'Birama',
                                            activeItem.song.time_signature,
                                        ],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-xl bg-black/15 p-3"
                                        >
                                            <p className="text-[10px] text-teal-100/50 uppercase">
                                                {label}
                                            </p>
                                            <p className="mt-1 font-semibold text-amber-100">
                                                {value || '-'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {activeItem.song.song_flow && (
                                    <p className="mt-4 rounded-xl border border-teal-200/10 bg-teal-200/5 p-3 text-sm text-teal-100/75">
                                        Flow: {activeItem.song.song_flow}
                                    </p>
                                )}
                                {activeItem.song.lyrics && (
                                    <div className="mt-4 border-t border-white/10 pt-4">
                                        <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-teal-100/55 uppercase">
                                            <FileText className="h-4 w-4" />{' '}
                                            Lirik
                                        </p>
                                        <pre className="mt-3 max-h-72 overflow-auto font-sans text-sm leading-relaxed whitespace-pre-wrap text-teal-50/80">
                                            {activeItem.song.lyrics}
                                        </pre>
                                    </div>
                                )}
                                {activeItem.song.video_url && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10"
                                    >
                                        <a
                                            href={activeItem.song.video_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Buka referensi video
                                        </a>
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-teal-100/60">
                                Pilih item lagu pada rundown untuk melihat
                                detail arrangement.
                            </div>
                        )}
                    </div>
                </section>
                {wakeLock === null && (
                    <p className="text-center text-xs text-teal-100/40">
                        Layar tetap menyala bergantung pada dukungan browser
                        perangkat.
                    </p>
                )}
            </main>
        </div>
    );
}
