import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface RundownItem {
    id: number;
    title: string;
    duration_seconds: number;
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

interface LiveSession {
    id: number;
    status: 'idle' | 'running' | 'completed' | string;
    current_segment_index: number;
    started_at?: string | null;
    segment_started_at?: string | null;
    finished_at?: string | null;
    runs: SegmentRun[];
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

export default function TimeKeeper({
    events = [],
    selected_event = null,
    server_now,
}: {
    events: LiveEvent[];
    selected_event: LiveEvent | null;
    server_now: string;
}) {
    const [now, setNow] = useState(() => Date.now());
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const serverOffset = useMemo(() => {
        const serverTime = new Date(server_now).getTime();
        const clientTime = Date.now();
        return serverTime - clientTime;
    }, [server_now]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 100);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!selected_event || selected_event.live_session?.status !== 'running') return;

        const pollInterval = window.setInterval(() => {
            router.reload({
                only: ['selected_event', 'server_now'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 3000);

        return () => window.clearInterval(pollInterval);
    }, [selected_event?.id, selected_event?.live_session?.status]);

    const session = selected_event?.live_session;
    const isRunning = session?.status === 'running';

    const segmentElapsedSeconds = useMemo(() => {
        if (!isRunning || !session?.segment_started_at) return 0;
        const segmentStartedAt = new Date(session.segment_started_at).getTime();
        return Math.max(0, Math.floor((now + serverOffset - segmentStartedAt) / 1000));
    }, [now, serverOffset, isRunning, session?.segment_started_at]);

    const currentSegment = selected_event?.rundown_segments[session?.current_segment_index ?? 0] ?? null;
    const currentPlannedSeconds = currentSegment?.duration_seconds || 0;
    const countdownSeconds = isRunning ? currentPlannedSeconds - segmentElapsedSeconds : currentPlannedSeconds;

    // Progress calculation for visual elements
    const progressPercent = Math.min(100, Math.max(0, (segmentElapsedSeconds / currentPlannedSeconds) * 100));
    const isOverrun = countdownSeconds < 0;
    const isWarning = countdownSeconds <= 30 && countdownSeconds >= 0 && isRunning;

    const selectEvent = (eventId: string) => {
        router.get('/live-events/time-keeper', { event_id: eventId }, { preserveScroll: true, preserveState: true });
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // Auto-hide controls after 3 seconds of inactivity
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="fixed inset-0 bg-[#050505] text-white flex flex-col items-center justify-center font-mono select-none overflow-hidden px-12 md:px-24">
            <Head title="Time Keeper" />

            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 transition-colors duration-1000 opacity-20 pointer-events-none ${
                isOverrun ? 'bg-red-900' : isWarning ? 'bg-orange-900' : isRunning ? 'bg-emerald-900' : 'bg-blue-900'
            }`} />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_80%)] pointer-events-none" />

            {/* Floating Top Controls */}
            <div className={`fixed top-0 left-0 right-0 z-50 p-8 md:p-12 flex items-center justify-between transition-all duration-500 transform ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-72">
                        <Select
                            value={selected_event?.id?.toString() ?? ''}
                            onValueChange={selectEvent}
                        >
                            <SelectTrigger className="bg-white/5 border-white/10 text-white backdrop-blur-xl hover:bg-white/10 transition-colors h-12">
                                <SelectValue placeholder="Pilih Event Aktif" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/10 text-white">
                                {events.map((event) => (
                                    <SelectItem key={event.id} value={event.id.toString()} className="focus:bg-white/10 focus:text-white">
                                        {event.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="w-12 h-12 text-white/40 hover:text-white hover:bg-white/10 backdrop-blur-md"
                    >
                        {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 w-full max-w-[85vw] flex flex-col items-center">
                {/* Segment Header */}
                <div className="mb-4 flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
                        {isRunning ? (
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-emerald-400">Live Recording</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-white/20"></span>
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40">
                                    {session?.status === 'completed' ? 'Session Finished' : 'Waiting for Start'}
                                </span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white/90 drop-shadow-2xl">
                        {currentSegment?.title ?? 'Silakan Pilih Event'}
                    </h2>
                </div>

                {/* Big Timer */}
                <div className="relative group flex items-center justify-center w-full">
                    {/* Shadow/Glow effect behind timer */}
                    <div className={`absolute inset-0 blur-[150px] transition-colors duration-500 opacity-25 pointer-events-none ${
                        isOverrun ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-white'
                    }`} />

                    <div className={`relative text-[30vw] leading-[0.8] font-black tracking-tighter tabular-nums transition-all duration-300 drop-shadow-[0_35px_35px_rgba(0,0,0,0.6)] ${
                        isOverrun
                            ? 'text-red-500 scale-105'
                            : isWarning
                                ? 'text-orange-500 animate-pulse'
                                : 'text-white'
                    }`}>
                        {formatDuration(countdownSeconds)}
                    </div>
                </div>

                {/* Visual Progress Bar */}
                {isRunning && (
                    <div className="w-full max-w-5xl mt-12 px-8">
                        <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm p-1">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-linear shadow-[0_0_30px_rgba(255,255,255,0.2)] ${
                                    isOverrun ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-4 text-xs font-black tracking-[0.2em] uppercase text-white/20">
                            <span>00:00</span>
                            <span>{formatDuration(currentPlannedSeconds)}</span>
                        </div>
                    </div>
                )}

                {/* Status Badges */}
                {!isRunning && session?.status === 'completed' && (
                    <div className="mt-12 flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 backdrop-blur-xl">
                        <CheckCircle2 className="h-8 w-8" />
                        <span className="text-2xl font-bold tracking-tight">Event Selesai Tepat Waktu</span>
                    </div>
                )}
            </div>

            {/* Sidebar-style Info Panel (Bottom Left) */}
            <div className={`fixed bottom-8 left-8 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex flex-col gap-1 border-l-2 border-white/20 pl-4 py-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-white/30">Event Aktif</span>
                    <span className="text-sm font-bold text-white/70">{selected_event?.title ?? '-'}</span>
                </div>
            </div>

            {/* Footer (Bottom Right) */}
            <div className={`fixed bottom-8 right-8 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="flex items-center gap-4 text-white/20">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-bold">ST-MEMBER &bull; TIME KEEPER</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
