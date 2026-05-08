import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Info,
    ListChecks,
    MapPin,
    MonitorPlay,
    Music,
    Play,
    Radio,
    RotateCcw,
    Square,
    Timer,
    Youtube,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface RundownItem {
    id: number;
    title: string;
    duration_seconds: number;
    song?: {
        id: number;
        title: string;
        artist?: string;
        song_flow?: string;
        bpm?: number;
        keys?: string;
        time_signature?: string;
        lyrics?: string;
        video_url?: string;
    } | null;
}

interface RundownSegment {
    id: number;
    title: string;
    duration_seconds: number;
    sort_order: number;
    items: RundownItem[];
}

interface SegmentRun {
    id: number;
    segment_index: number;
    title: string;
    planned_seconds: number;
    actual_seconds: number;
    overrun_seconds: number;
    started_at?: string | null;
    ended_at?: string | null;
}

interface ItemRun {
    id: number;
    segment_index: number;
    item_index: number;
    title: string;
    planned_seconds: number;
    actual_seconds: number;
    overrun_seconds: number;
    started_at?: string | null;
    ended_at?: string | null;
}

interface LiveSession {
    id: number;
    status: 'idle' | 'running' | 'completed' | string;
    current_segment_index: number;
    current_item_index: number;
    started_at?: string | null;
    segment_started_at?: string | null;
    item_started_at?: string | null;
    finished_at?: string | null;
    runs: SegmentRun[];
    item_runs: ItemRun[];
}

interface LiveEvent {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    category: string;
    rundown_segments: RundownSegment[];
    live_session?: LiveSession | null;
}

function formatDuration(seconds: number) {
    const isNegative = seconds < 0;
    const safeSeconds = Math.max(0, Math.floor(Math.abs(seconds)));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    const formatted = hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
        : `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;

    return isNegative ? `-${formatted}` : formatted;
}

function formatDelta(seconds: number) {
    if (seconds === 0) {
        return 'Tepat waktu';
    }

    const prefix = seconds > 0 ? '+' : '-';

    return `${prefix}${formatDuration(Math.abs(seconds))}`;
}

function formatDate(date: string) {
    if (!date || Number.isNaN(Date.parse(date))) {
        return '-';
    }

    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function getTotalPlannedSeconds(event?: LiveEvent | null) {
    return (
        event?.rundown_segments.reduce(
            (total, segment) => total + (Number(segment.duration_seconds) || 0),
            0,
        ) || 0
    );
}

export default function LiveEvents({
    events = [],
    selected_event = null,
    server_now,
}: {
    events: LiveEvent[];
    selected_event: LiveEvent | null;
    server_now: string;
}) {
    // 1. Calculate server offset once when server_now changes
    const serverOffset = useMemo(() => {
        const serverTime = new Date(server_now).getTime();
        const clientTime = Date.now();
        return serverTime - clientTime;
    }, [server_now]);

    // 2. Track current time in state, updated every 100ms for smoother timer
    const [now, setNow] = useState(() => Date.now());
    const [selectedSongItem, setSelectedSongItem] = useState<RundownItem | null>(null);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 100); // 100ms for responsiveness

        return () => window.clearInterval(interval);
    }, []);

    // 3. Polling to keep the session data fresh from the server
    useEffect(() => {
        if (!selected_event || selected_event.live_session?.status !== 'running') return;

        const pollInterval = window.setInterval(() => {
            router.reload({
                only: ['selected_event', 'server_now'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 3000); // Poll every 3 seconds while running

        return () => window.clearInterval(pollInterval);
    }, [selected_event?.id, selected_event?.live_session?.status]);

    // 4. Handle visibility change to refresh data
    useEffect(() => {
        if (!selected_event) return;

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                router.reload({
                    only: ['events', 'selected_event', 'server_now'],
                    preserveScroll: true,
                    preserveState: true,
                });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [selected_event?.id]);

    // 5. Derived state for timers
    const session = selected_event?.live_session;
    const isRunning = session?.status === 'running';

    // Use a memo for item calculation to avoid unnecessary re-renders
    const itemElapsedSeconds = useMemo(() => {
        if (!isRunning || !session?.item_started_at) return 0;

        const itemStartedAt = new Date(session.item_started_at).getTime();
        // now + serverOffset gives the current server-synced time
        return Math.max(0, Math.floor((now + serverOffset - itemStartedAt) / 1000));
    }, [now, serverOffset, isRunning, session?.item_started_at]);

    const segmentElapsedSeconds = useMemo(() => {
        if (!isRunning || !session?.segment_started_at) return 0;

        const segmentStartedAt = new Date(session.segment_started_at).getTime();
        return Math.max(0, Math.floor((now + serverOffset - segmentStartedAt) / 1000));
    }, [now, serverOffset, isRunning, session?.segment_started_at]);

    const currentSegment =
        selected_event?.rundown_segments[session?.current_segment_index ?? 0] ??
        null;

    const currentItem =
        currentSegment?.items[session?.current_item_index ?? 0] ?? null;

    const currentPlannedSeconds = currentItem?.duration_seconds || 0;
    
    // Countdown logic
    const countdownSeconds = currentPlannedSeconds - itemElapsedSeconds;
    
    const isOverrun = countdownSeconds < 0;

    const completedSeconds =
        session?.item_runs.reduce((total, run) => total + run.actual_seconds, 0) ||
        0;
    const totalElapsedSeconds = completedSeconds + itemElapsedSeconds;
    const totalPlannedSeconds = getTotalPlannedSeconds(selected_event);
    const finishedSegments = session?.runs.length || 0;

    const selectEvent = (eventId: string) => {
        router.get(
            '/live-events',
            { event_id: eventId },
            { preserveScroll: true, preserveState: true },
        );
    };

    const startEvent = () => {
        if (!selected_event) {
            return;
        }

        router.post(
            `/live-events/${selected_event.id}/start`,
            {},
            { preserveScroll: true },
        );
    };

    const nextSegment = () => {
        if (!selected_event) {
            return;
        }

        router.post(
            `/live-events/${selected_event.id}/next`,
            {},
            { preserveScroll: true },
        );
    };

    const finishEvent = () => {
        if (!selected_event) {
            return;
        }

        router.post(
            `/live-events/${selected_event.id}/finish`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Live Event" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <Badge
                            variant="outline"
                            className="mb-2 gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
                        >
                            <Radio className="h-3 w-3 text-primary" />
                            Live Event
                        </Badge>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                            Live Event Rundown
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Jalankan rundown per item. Klik item lagu untuk melihat detail lirik dan aransemen.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-[360px]">
                        <Select
                            value={selected_event?.id?.toString() ?? ''}
                            onValueChange={selectEvent}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih event" />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map((event) => (
                                    <SelectItem
                                        key={`event-${event.id}`}
                                        value={event.id.toString()}
                                    >
                                        {event.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selected_event && (
                            <Button
                                variant="outline"
                                className="w-full gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                                onClick={() =>
                                    window.open(
                                        `/live-events/time-keeper?event_id=${selected_event.id}`,
                                        '_blank',
                                    )
                                }
                            >
                                <MonitorPlay className="h-4 w-4" />
                                Buka Time Keeper (Full Screen)
                            </Button>
                        )}
                    </div>
                </div>

                {!selected_event ? (
                    <Card className="border bg-card shadow-sm">
                        <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <ListChecks className="h-12 w-12 text-muted-foreground/40" />
                            <h2 className="mt-4 text-lg font-semibold text-foreground">
                                Belum ada event dengan rundown
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Buat rundown di Event Dashboard terlebih dahulu
                                agar bisa dijalankan secara live.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
                            <Card
                                className={`border bg-card shadow-sm ${
                                    isOverrun
                                        ? 'border-red-300 dark:border-red-900'
                                        : ''
                                }`}
                            >
                                <CardHeader className="border-b px-6 py-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <CardTitle className="text-2xl">
                                                    {selected_event.title}
                                                </CardTitle>
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-md"
                                                >
                                                    {selected_event.category}
                                                </Badge>
                                                {isRunning && (
                                                    <Badge className="rounded-md bg-emerald-600 text-white">
                                                        Live
                                                    </Badge>
                                                )}
                                                {session?.status ===
                                                    'completed' && (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                                    >
                                                        Selesai
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {formatDate(
                                                        selected_event.date,
                                                    )}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {selected_event.time}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="h-4 w-4" />
                                                    {selected_event.location}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {!isRunning ? (
                                                <Button
                                                    className="gap-2"
                                                    onClick={startEvent}
                                                >
                                                    {session?.status ===
                                                    'completed' ? (
                                                        <RotateCcw className="h-4 w-4" />
                                                    ) : (
                                                        <Play className="h-4 w-4" />
                                                    )}
                                                    {session?.status ===
                                                    'completed'
                                                        ? 'Start Ulang'
                                                        : 'Start Event'}
                                                </Button>
                                            ) : (
                                                <>
                                                    <Button
                                                        className="gap-2"
                                                        onClick={nextSegment}
                                                    >
                                                        Next Item
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={finishEvent}
                                                    >
                                                        <Square className="h-4 w-4" />
                                                        Finish
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-6">
                                    <div
                                        className={`rounded-xl border p-6 ${
                                            isOverrun
                                                ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20'
                                                : 'bg-muted/20'
                                        }`}
                                    >
                                        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            Item Aktif
                                        </p>
                                        <div className="mt-2 flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-muted-foreground">
                                                    {isRunning && currentSegment
                                                        ? `${currentSegment.title}`
                                                        : ''}
                                                </p>
                                                {currentItem?.song && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-primary hover:bg-primary/10"
                                                        onClick={() => setSelectedSongItem(currentItem)}
                                                    >
                                                        <Info className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                                {isRunning && currentItem
                                                    ? currentItem.title
                                                    : session?.status ===
                                                        'completed'
                                                      ? 'Event selesai'
                                                      : 'Belum dimulai'}
                                            </h2>
                                        </div>

                                        <div
                                            className={`mt-6 font-mono text-7xl font-bold tracking-tight ${
                                                isOverrun
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : countdownSeconds <= 30 && isRunning
                                                      ? 'text-orange-500 animate-pulse'
                                                      : 'text-foreground'
                                            }`}
                                        >
                                            {isRunning
                                                ? formatDuration(countdownSeconds)
                                                : formatDuration(currentPlannedSeconds)
                                            }
                                        </div>

                                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                                            <div className="rounded-lg border bg-background/80 p-4">
                                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Target Item
                                                </p>
                                                <p className="mt-1 font-mono text-xl font-semibold">
                                                    {formatDuration(
                                                        currentPlannedSeconds,
                                                    )}
                                                </p>
                                            </div>
                                            <div
                                                className={`rounded-lg border p-4 ${
                                                    isOverrun
                                                        ? 'border-red-200 bg-red-100 dark:border-red-900 dark:bg-red-950/30'
                                                        : 'bg-background/80'
                                                }`}
                                            >
                                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Terpakai (Elapsed)
                                                </p>
                                                <p
                                                    className={`mt-1 font-mono text-xl font-semibold ${
                                                        isOverrun
                                                            ? 'text-red-700 dark:text-red-300'
                                                            : ''
                                                    }`}
                                                >
                                                    {formatDuration(itemElapsedSeconds)}
                                                </p>
                                            </div>
                                            <div className="rounded-lg border bg-background/80 p-4">
                                                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                    Total Berjalan
                                                </p>
                                                <p className="mt-1 font-mono text-xl font-semibold">
                                                    {formatDuration(
                                                        totalElapsedSeconds,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {currentSegment?.items.length ? (
                                        <div className="mt-6 rounded-xl border">
                                            <div className="border-b px-5 py-4">
                                                <h3 className="font-semibold text-foreground">
                                                    Detail Segment
                                                </h3>
                                            </div>
                                            <div className="divide-y">
                                                {currentSegment.items.map((item, idx) => {
                                                    const run = session?.item_runs.find(
                                                        (r) =>
                                                            r.segment_index ===
                                                                session?.current_segment_index &&
                                                            r.item_index === idx,
                                                    );
                                                    const active =
                                                        isRunning &&
                                                        session?.current_item_index ===
                                                            idx;

                                                    return (
                                                        <div
                                                            key={`item-${item.id}-${idx}`}
                                                            className={`flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors cursor-pointer hover:bg-muted/50 ${active ? 'bg-primary/5' : ''}`}
                                                            onClick={() => item.song && setSelectedSongItem(item)}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-foreground">
                                                                        {item.title}
                                                                    </span>
                                                                    {item.song && (
                                                                        <Music className="h-3 w-3 text-primary/60" />
                                                                    )}
                                                                </div>
                                                                {item.song
                                                                    ?.song_flow && (
                                                                    <span className="text-[10px] font-bold tracking-tight text-emerald-600 uppercase">
                                                                        Flow:{' '}
                                                                        {
                                                                            item
                                                                                .song
                                                                                .song_flow
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] font-bold tracking-tighter text-muted-foreground uppercase">
                                                                        Rencana
                                                                    </span>
                                                                    <span className="font-mono text-xs">
                                                                        {formatDuration(
                                                                            item.duration_seconds,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex min-w-[60px] flex-col items-end">
                                                                    <span className="text-[9px] font-bold tracking-tighter text-muted-foreground uppercase">
                                                                        Aktual
                                                                    </span>
                                                                    {run ? (
                                                                        <span
                                                                            className={`font-mono font-bold ${
                                                                                run.actual_seconds >
                                                                                item.duration_seconds
                                                                                    ? 'text-red-600'
                                                                                    : 'text-emerald-600'
                                                                            }`}
                                                                        >
                                                                            {formatDuration(
                                                                                run.actual_seconds,
                                                                            )}
                                                                        </span>
                                                                    ) : active ? (
                                                                        <span className="animate-pulse font-mono font-bold text-primary">
                                                                            {formatDuration(
                                                                                itemElapsedSeconds,
                                                                            )}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-mono font-bold text-muted-foreground/30">
                                                                            --:--
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <div className="grid gap-6">
                                <Card className="border bg-card shadow-sm">
                                    <CardHeader className="border-b px-6 py-5">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Timer className="h-5 w-5 text-primary" />
                                            Ringkasan
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="grid gap-3 p-5">
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <span className="text-sm text-muted-foreground">
                                                Total rencana
                                            </span>
                                            <span className="font-mono font-semibold">
                                                {formatDuration(
                                                    totalPlannedSeconds,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <span className="text-sm text-muted-foreground">
                                                Segment selesai
                                            </span>
                                            <span className="font-semibold">
                                                {finishedSegments}/
                                                {
                                                    selected_event
                                                        .rundown_segments.length
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                            <span className="text-sm text-muted-foreground">
                                                Total selisih
                                            </span>
                                            <span
                                                className={`font-mono font-semibold ${
                                                    totalElapsedSeconds -
                                                        totalPlannedSeconds >
                                                    0
                                                        ? 'text-red-600'
                                                        : 'text-emerald-600'
                                                }`}
                                            >
                                                {formatDelta(
                                                    totalElapsedSeconds -
                                                        totalPlannedSeconds,
                                                )}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border bg-card shadow-sm">
                                    <CardHeader className="border-b px-6 py-5">
                                        <CardTitle className="text-lg">
                                            Rundown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 p-5">
                                        {selected_event.rundown_segments.map(
                                            (segment, index) => {
                                                const run = session?.runs.find(
                                                    (item) =>
                                                        item.segment_index ===
                                                        index,
                                                );
                                                const active =
                                                    isRunning &&
                                                    session?.current_segment_index ===
                                                        index;

                                                return (
                                                    <div
                                                        key={`segment-card-${segment.id}-${index}`}
                                                        className={`rounded-lg border p-3 ${
                                                            active
                                                                ? 'border-primary bg-primary/5'
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {index + 1}.{' '}
                                                                    {
                                                                        segment.title
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Target{' '}
                                                                    {formatDuration(
                                                                        segment.duration_seconds,
                                                                    )}
                                                                </p>
                                                            </div>
                                                            {run ? (
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        run.overrun_seconds >
                                                                        0
                                                                            ? 'rounded-md border-red-200 bg-red-50 text-red-700'
                                                                            : 'rounded-md border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    }
                                                                >
                                                                    {formatDelta(
                                                                        run.overrun_seconds,
                                                                    )}
                                                                </Badge>
                                                            ) : active ? (
                                                                <Badge className="rounded-md">
                                                                    Live
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="rounded-md"
                                                                >
                                                                    Pending
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <Card className="border bg-card shadow-sm">
                            <CardHeader className="border-b px-6 py-5">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ListChecks className="h-5 w-5 text-primary" />
                                    Laporan Waktu Segment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {selected_event.rundown_segments.map(
                                        (segment, index) => {
                                            const run = session?.runs.find(
                                                (item) =>
                                                    item.segment_index ===
                                                    index,
                                            );
                                            const active =
                                                isRunning &&
                                                session?.current_segment_index ===
                                                    index;

                                            return (
                                                <div
                                                    key={`segment-report-${segment.id}-${index}`}
                                                    className="grid gap-4 p-5 md:grid-cols-[1fr_140px_140px_140px]"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {run ? (
                                                            run.overrun_seconds >
                                                            0 ? (
                                                                <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                                                            ) : (
                                                                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                                                            )
                                                        ) : active ? (
                                                            <Radio className="mt-0.5 h-5 w-5 text-primary" />
                                                        ) : (
                                                            <Clock className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-foreground">
                                                                {index + 1}.{' '}
                                                                {segment.title}
                                                            </p>
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {segment.items
                                                                    .map(
                                                                        (
                                                                            item,
                                                                        ) => {
                                                                            let label = item.title;
                                                                            if (item.song?.song_flow) {
                                                                                label += ` (${item.song.song_flow})`;
                                                                            }
                                                                            return label;
                                                                        },
                                                                    )
                                                                    .join(
                                                                        ', ',
                                                                    ) ||
                                                                    'Tidak ada item detail'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                            Rencana
                                                        </p>
                                                        <p className="mt-1 font-mono font-semibold">
                                                            {formatDuration(
                                                                segment.duration_seconds,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                            Aktual
                                                        </p>
                                                        <p className="mt-1 font-mono font-semibold">
                                                            {run
                                                                ? formatDuration(
                                                                      run.actual_seconds,
                                                                  )
                                                                : active
                                                                  ? formatDuration(
                                                                        segmentElapsedSeconds,
                                                                    )
                                                                  : '-'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                            Selisih
                                                        </p>
                                                        <p
                                                            className={`mt-1 font-mono font-semibold ${
                                                                run?.overrun_seconds &&
                                                                run.overrun_seconds >
                                                                    0
                                                                    ? 'text-red-600'
                                                                    : 'text-emerald-600'
                                                            }`}
                                                        >
                                                            {run
                                                                ? formatDelta(
                                                                      run.overrun_seconds,
                                                                  )
                                                                : active
                                                                  ? formatDelta(
                                                                        segmentElapsedSeconds -
                                                                            segment.duration_seconds,
                                                                    )
                                                                  : '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Song Detail Sidebar */}
            <Sheet open={!!selectedSongItem} onOpenChange={(open) => !open && setSelectedSongItem(null)}>
                <SheetContent className="sm:max-w-md md:max-w-lg lg:max-w-xl w-full overflow-y-auto">
                    {selectedSongItem?.song && (
                        <div className="space-y-8 py-6">
                            <SheetHeader className="space-y-1">
                                <div className="flex items-center gap-2 text-primary">
                                    <Music className="h-5 w-5" />
                                    <span className="text-xs font-black tracking-[0.3em] uppercase">Song Details</span>
                                </div>
                                <SheetTitle className="text-3xl font-bold tracking-tight">
                                    {selectedSongItem.song.title}
                                </SheetTitle>
                                <SheetDescription className="text-lg">
                                    {selectedSongItem.song.artist || 'Unknown Artist'}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Timer className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">BPM</span>
                                    </div>
                                    <p className="text-2xl font-bold">{selectedSongItem.song.bpm || '-'}</p>
                                </div>
                                <div className="rounded-xl border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Music className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Key</span>
                                    </div>
                                    <p className="text-2xl font-bold">{selectedSongItem.song.keys || '-'}</p>
                                </div>
                                <div className="rounded-xl border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <ListChecks className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Signature</span>
                                    </div>
                                    <p className="text-xl font-bold">{selectedSongItem.song.time_signature || '-'}</p>
                                </div>
                                <div className="rounded-xl border bg-muted/30 p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Clock className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Duration</span>
                                    </div>
                                    <p className="text-xl font-bold">{formatDuration(selectedSongItem.duration_seconds)}</p>
                                </div>
                            </div>

                            {selectedSongItem.song.song_flow && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <RotateCcw className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Arrangement Flow</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSongItem.song.song_flow.split(/[->|]/).map((part, i) => (
                                            <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-semibold uppercase tracking-wider">
                                                {part.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedSongItem.song.video_url && (
                                <Button 
                                    variant="outline" 
                                    className="w-full gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                                    onClick={() => window.open(selectedSongItem.song?.video_url, '_blank')}
                                >
                                    <Youtube className="h-4 w-4" />
                                    Watch Reference Video
                                </Button>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase">Lyrics / Notes</span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-6 min-h-[200px] whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground border border-dashed">
                                    {selectedSongItem.song.lyrics || (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 py-12">
                                            <Info className="h-8 w-8 opacity-20" />
                                            <p className="text-sm italic">No lyrics provided for this arrangement</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
