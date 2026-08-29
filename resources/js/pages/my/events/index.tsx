import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Play, Radio, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface EventSession {
    id: number;
    title: string;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
}

interface UserEvent {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    address?: string | null;
    category: string;
    attendance_type?: string;
    sessions?: EventSession[];
    rundown_segments?: RundownSegment[];
    live_session?: LiveSession | null;
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

interface Song {
    id: number;
    title: string;
    artist?: string | null;
    song_flow?: string | null;
    bpm?: string | null;
    keys?: string | null;
    time_signature?: string | null;
    lyrics?: string | null;
    video_url?: string | null;
    arrangement_name?: string | null;
}

interface LiveSession {
    status: string;
    current_segment_index: number;
    current_item_index: number;
    item_started_at?: string | null;
}

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value));

const formatCountdown = (totalSeconds: number) => {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function MyEvents({
    events,
    assignedEventIds,
}: {
    events: UserEvent[];
    assignedEventIds: number[];
}) {
    const [selectedRundownEvent, setSelectedRundownEvent] = useState<UserEvent | null>(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!selectedRundownEvent) return;

        const refresh = window.setInterval(() => {
            router.reload({ only: ['events'] });
        }, 5000);

        return () => window.clearInterval(refresh);
    }, [selectedRundownEvent?.id]);

    useEffect(() => {
        setSelectedRundownEvent((current) => {
            if (!current) return null;

            return events.find((event) => event.id === current.id) ?? current;
        });
    }, [events]);

    const isEventLive = (event: UserEvent) => {
        if (event.live_session?.status === 'running') return true;
        const start = new Date(`${event.date}T${event.time || '00:00:00'}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        return !Number.isNaN(start.getTime()) && new Date() >= start && new Date() <= end;
    };

    const liveItem = selectedRundownEvent?.live_session?.status === 'running'
        ? selectedRundownEvent.rundown_segments?.[selectedRundownEvent.live_session.current_segment_index]?.items[selectedRundownEvent.live_session.current_item_index]
        : null;
    const liveItemSeconds = liveItem && selectedRundownEvent?.live_session?.item_started_at
        ? Math.floor(liveItem.duration_seconds - (now - new Date(selectedRundownEvent.live_session.item_started_at).getTime()) / 1000)
        : null;

    return (
        <>
            <Head title="Pelayanan yang Dijadwalkan" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-10">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Kegiatan</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">Pelayanan yang Dijadwalkan</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Lihat seluruh jadwal pelayanan, termasuk kegiatan yang sudah berlangsung.</p>
                </div>

                {events.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
                            <h2 className="mt-4 font-semibold">Belum ada pelayanan yang dijadwalkan</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Pelayanan yang dijadwalkan akan muncul di halaman ini.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {events.map((event) => {
                            const isAssigned = assignedEventIds.includes(event.id);
                            const isLive = isEventLive(event);
                            return (
                                <Card key={event.id} className={`overflow-hidden ${isLive ? 'border-amber-400/70 shadow-lg shadow-amber-500/10' : ''}`}>
                                    <CardContent className="space-y-5 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="secondary">{event.category}</Badge>
                                                    {isAssigned && <Badge className="bg-emerald-600 hover:bg-emerald-600">Jadwal saya</Badge>}
                                                    {isLive && <Badge className="gap-1 bg-amber-500 text-amber-950 hover:bg-amber-500"><Radio className="h-3 w-3 animate-pulse" />Sedang berlangsung</Badge>}
                                                </div>
                                                <h2 className="mt-3 text-xl font-bold">{event.title}</h2>
                                            </div>
                                            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                                        </div>
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(event.date)}</p>
                                            <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{event.time}</p>
                                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location}</p>
                                        </div>
                                        {event.sessions && event.sessions.length > 0 && (
                                            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Users className="h-4 w-4" />{event.sessions.length} sesi tersedia
                                            </p>
                                        )}
                                        {event.rundown_segments && event.rundown_segments.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedRundownEvent(event)}
                                                className="w-full rounded-xl border border-primary/10 bg-primary/5 p-3 text-left text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                                aria-label={`Buka rundown ${event.title}`}
                                            >
                                                <p className="flex items-center gap-2 font-bold tracking-[0.12em] text-primary uppercase">
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                                                    </span>
                                                    <Radio className="h-4 w-4 animate-pulse" />
                                                    LIVE EVENT
                                                </p>
                                                <p className="mt-1 truncate">{event.live_session?.status === 'running' ? `Sedang berjalan: ${event.rundown_segments[event.live_session.current_segment_index]?.items[event.live_session.current_item_index]?.title ?? 'Item aktif'}` : `${event.rundown_segments.reduce((total, segment) => total + segment.items.length, 0)} item panduan`}</p>
                                                <p className="mt-2 font-semibold text-primary">Ketuk untuk melihat item rundown</p>
                                            </button>
                                        )}
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <Button asChild variant="outline" className="w-full">
                                                <Link href={`/my/events/${event.id}`}>
                                                    Detail event
                                                </Link>
                                            </Button>
                                            <Button asChild variant={isLive ? 'default' : 'outline'} className={`w-full ${isLive ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : ''}`}>
                                                <Link href={isLive ? `/my/events/${event.id}/live-rundown` : '/my/scan'}>
                                                    {isLive ? <><Play className="mr-2 h-4 w-4" />Event sedang berlangsung</> : 'Buka absensi'}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            <Dialog open={!!selectedRundownEvent} onOpenChange={(open) => !open && setSelectedRundownEvent(null)}>
                <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl p-0">
                    <DialogHeader className="shrink-0 border-b bg-primary/5 p-5 text-left">
                        <DialogTitle>Rundown Event</DialogTitle>
                        <DialogDescription>{selectedRundownEvent?.title}</DialogDescription>
                        {liveItem && liveItemSeconds !== null && (
                            <div className={`mt-4 rounded-2xl border p-4 text-center ${liveItemSeconds < 0 ? 'border-red-300 bg-red-50 text-red-700' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
                                <p className="truncate text-base font-bold">{liveItem.title}</p>
                                <p className="font-mono text-4xl font-bold tracking-wider">
                                    {liveItemSeconds < 0 ? `-${formatCountdown(Math.abs(liveItemSeconds))}` : formatCountdown(liveItemSeconds)}
                                </p>
                            </div>
                        )}
                    </DialogHeader>
                    <div className="min-h-0 space-y-4 overflow-y-auto p-5">
                        {selectedRundownEvent?.rundown_segments?.map((segment, segmentIndex) => (
                            <section key={segment.id} className="overflow-hidden rounded-xl border">
                                <div className="flex items-center justify-between gap-3 bg-muted/40 px-4 py-3">
                                    <h3 className="text-sm font-bold">{segmentIndex + 1}. {segment.title}</h3>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">{segment.items.length} item</span>
                                </div>
                                <div className="divide-y">
                                    {segment.items.map((item, itemIndex) => (
                                        <div key={item.id} className={`p-4 ${selectedRundownEvent.live_session?.status === 'running' && selectedRundownEvent.live_session.current_segment_index === segmentIndex && selectedRundownEvent.live_session.current_item_index === itemIndex ? 'bg-amber-50/70' : ''}`}>
                                            <div className="flex items-start gap-3">
                                                <span className="mt-0.5 text-xs font-bold text-primary/70">{itemIndex + 1}</span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="flex items-center gap-2 text-sm font-semibold">{item.title}{selectedRundownEvent.live_session?.status === 'running' && selectedRundownEvent.live_session.current_segment_index === segmentIndex && selectedRundownEvent.live_session.current_item_index === itemIndex && <Badge className="bg-amber-400 text-[9px] text-amber-950 hover:bg-amber-400">LIVE</Badge>}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">Durasi {Math.ceil(item.duration_seconds / 60)} menit</p>
                                                    {item.song && (
                                                        <div className="mt-3 rounded-lg bg-primary/5 p-3 text-xs">
                                                            <p className="font-bold text-primary">{item.song.title}</p>
                                                            {item.song.arrangement_name && <p className="mt-1 text-muted-foreground">Arrangement: {item.song.arrangement_name}</p>}
                                                                    {item.song.song_flow && <p className="mt-2 rounded-md border border-amber-300 bg-amber-400 px-2 py-1.5 font-bold text-amber-950">Sequence: {item.song.song_flow}</p>}
                                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                                {item.song.keys && <span>Key: {item.song.keys}</span>}
                                                                {item.song.bpm && <span>BPM: {item.song.bpm}</span>}
                                                                {item.song.time_signature && <span>Birama: {item.song.time_signature}</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {segment.items.length === 0 && <p className="p-4 text-xs text-muted-foreground">Belum ada item pada segment ini.</p>}
                                </div>
                            </section>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
