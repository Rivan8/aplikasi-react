import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    FileDown,
    FileText,
    Headphones,
    ListChecks,
    MapPin,
    Music,
    ScrollText,
    Timer,
    X,
    Youtube,
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RundownPhase = 'before' | 'during' | 'after';
type PhaseFilter = 'all' | RundownPhase;

const PHASE_META: Record<RundownPhase, { label: string; badge: string; dot: string }> = {
    before: {
        label: 'Sebelum Event',
        badge: 'border-amber-200 bg-amber-50 text-amber-700',
        dot: 'bg-amber-500',
    },
    during: {
        label: 'Selama Event',
        badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        dot: 'bg-indigo-500',
    },
    after: {
        label: 'Setelah Event',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        dot: 'bg-emerald-500',
    },
};

const PHASE_FILTERS: { value: PhaseFilter; label: string }[] = [
    { value: 'all', label: 'Keseluruhan' },
    { value: 'before', label: 'Sebelum' },
    { value: 'during', label: 'Selama' },
    { value: 'after', label: 'Setelah' },
];

interface RundownItemRow {
    title: string;
    song_title: string | null;
    song_artist: string | null;
    arrangement_name: string | null;
    video_url: string | null;
    audio_url: string | null;
    pdf_url: string | null;
    duration_seconds: number;
}

type MediaKind = 'video' | 'audio' | 'pdf';

interface MediaState {
    kind: MediaKind;
    url: string;
    embedUrl: string | null;
    songTitle: string;
    arrangementName: string | null;
}

const MEDIA_META = {
    video: {
        label: 'Video YouTube',
        icon: Youtube,
        iconClass: 'bg-rose-50 text-rose-600',
        maxWidth: 'max-w-3xl',
    },
    audio: {
        label: 'Audio aransemen',
        icon: Headphones,
        iconClass: 'bg-emerald-50 text-emerald-600',
        maxWidth: 'max-w-2xl',
    },
    pdf: {
        label: 'Chord PDF',
        icon: FileText,
        iconClass: 'bg-amber-50 text-amber-600',
        maxWidth: 'max-w-3xl',
    },
} as const;

interface RundownSegmentRow {
    index: number;
    title: string;
    phase: RundownPhase;
    start: string | null;
    end: string | null;
    duration_seconds: number;
    items: RundownItemRow[];
}

interface RundownReport {
    segments: RundownSegmentRow[];
    total_segments: number;
    total_items: number;
    total_seconds: number;
    start_time: string | null;
    end_time: string | null;
}

interface ReportEvent {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    category: string | null;
}

interface Props {
    event: ReportEvent;
    report: RundownReport;
    back_url: string;
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    return `${minutes}:${String(remaining).padStart(2, '0')}`;
};

const formatDurationLong = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours} jam ${minutes} menit`;
    }

    if (hours > 0) {
        return `${hours} jam`;
    }

    return `${minutes} menit`;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );

    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
};

export default function EventRundownReport({ event, report, back_url }: Props) {
    const eventDate = event.date ? new Date(event.date) : null;
    const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');
    const [activeMedia, setActiveMedia] = useState<MediaState | null>(null);
    const [mediaClosing, setMediaClosing] = useState(false);

    const openMedia = (media: MediaState) => {
        setMediaClosing(false);
        setActiveMedia(media);
    };

    const closeMedia = useCallback(() => {
        setMediaClosing(true);
        window.setTimeout(() => {
            setActiveMedia(null);
            setMediaClosing(false);
        }, 180);
    }, []);

    useEffect(() => {
        if (!activeMedia) {
            return;
        }

        const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
            if (keyboardEvent.key === 'Escape') {
                closeMedia();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMedia, closeMedia]);

    const visibleSegments =
        phaseFilter === 'all'
            ? report.segments
            : report.segments.filter((segment) => segment.phase === phaseFilter);
    const visibleTotalSeconds = visibleSegments.reduce(
        (total, segment) => total + segment.duration_seconds,
        0,
    );
    const visibleTotalItems = visibleSegments.reduce(
        (total, segment) => total + segment.items.length,
        0,
    );
    const visibleStart = visibleSegments[0]?.start ?? null;
    const visibleEnd = visibleSegments[visibleSegments.length - 1]?.end ?? null;
    const pdfHref = `/events/${event.id}/rundown-report/pdf${
        phaseFilter === 'all' ? '' : `?phase=${phaseFilter}`
    }`;
    const mediaMeta = activeMedia ? MEDIA_META[activeMedia.kind] : null;
    const MediaIcon = mediaMeta?.icon;

    const renderMediaButtons = (item: RundownItemRow) => {
        const songTitle = item.song_title;

        if (!songTitle) {
            return null;
        }

        const videoUrl = item.video_url;
        const audioUrl = item.audio_url;
        const pdfUrl = item.pdf_url;

        if (!videoUrl && !audioUrl && !pdfUrl) {
            return null;
        }

        return (
            <span className="inline-flex items-center gap-1">
                {videoUrl && (
                    <button
                        type="button"
                        title="Putar video YouTube"
                        aria-label={`Putar video ${songTitle}`}
                        onClick={() =>
                            openMedia({
                                kind: 'video',
                                url: videoUrl,
                                embedUrl: getYouTubeEmbedUrl(videoUrl),
                                songTitle,
                                arrangementName: item.arrangement_name,
                            })
                        }
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none"
                    >
                        <Youtube className="h-3.5 w-3.5" />
                    </button>
                )}
                {audioUrl && (
                    <button
                        type="button"
                        title="Putar audio"
                        aria-label={`Putar audio ${songTitle}`}
                        onClick={() =>
                            openMedia({
                                kind: 'audio',
                                url: audioUrl,
                                embedUrl: null,
                                songTitle,
                                arrangementName: item.arrangement_name,
                            })
                        }
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
                    >
                        <Headphones className="h-3.5 w-3.5" />
                    </button>
                )}
                {pdfUrl && (
                    <button
                        type="button"
                        title="Lihat chord PDF"
                        aria-label={`Lihat chord PDF ${songTitle}`}
                        onClick={() =>
                            openMedia({
                                kind: 'pdf',
                                url: pdfUrl,
                                embedUrl: null,
                                songTitle,
                                arrangementName: item.arrangement_name,
                            })
                        }
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
                    >
                        <FileText className="h-3.5 w-3.5" />
                    </button>
                )}
            </span>
        );
    };

    return (
        <>
            <Head title={`Laporan Rundown - ${event.title}`} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Kembali ke daftar event"
                            className="h-10 w-10 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => router.get(back_url)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700">
                                <ScrollText className="h-3.5 w-3.5" />
                                Laporan Rundown Event
                            </div>
                            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                                {event.title}
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-slate-500">
                                {event.category && (
                                    <Badge
                                        variant="secondary"
                                        className="border-slate-200 bg-slate-100 text-slate-700"
                                    >
                                        {event.category}
                                    </Badge>
                                )}
                                {eventDate && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                                        {format(eventDate, 'EEEE, dd MMMM yyyy', { locale: id })}
                                    </span>
                                )}
                                {event.time && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                                        {event.time.slice(0, 5)}
                                    </span>
                                )}
                                {event.location && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                        {event.location}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button
                        asChild
                        className="h-10 shrink-0 gap-2 bg-indigo-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                    >
                        <a href={pdfHref} target="_blank" rel="noreferrer">
                            <FileDown className="h-4 w-4" />
                            Buka PDF (Tab Baru)
                        </a>
                    </Button>
                </div>

                {/* Phase Filter */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 pl-3 shadow-xs">
                    <div className="flex flex-wrap items-center gap-1">
                        {PHASE_FILTERS.map((option) => {
                            const isActive = phaseFilter === option.value;
                            const count =
                                option.value === 'all'
                                    ? report.segments.length
                                    : report.segments.filter(
                                          (segment) => segment.phase === option.value,
                                      ).length;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setPhaseFilter(option.value)}
                                    aria-pressed={isActive}
                                    className={cn(
                                        'inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-colors',
                                        isActive
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:bg-slate-100',
                                    )}
                                >
                                    {option.label}
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 py-0.5 text-[10px] font-black leading-none',
                                            isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-slate-100 text-slate-500',
                                        )}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="px-2 text-[11px] font-medium text-slate-500">
                        Tampilkan rundown berdasarkan fase event
                    </p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Segmen
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                <ListChecks className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {visibleSegments.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Mata Acara
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                                <Music className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {visibleTotalItems}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Durasi Rencana
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
                                <Timer className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {formatDurationLong(visibleTotalSeconds)}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-slate-400">
                            {formatDuration(visibleTotalSeconds)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Rentang Waktu
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
                                <Clock className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                            {visibleStart && visibleEnd
                                ? `${visibleStart} – ${visibleEnd}`
                                : '-'}
                        </p>
                    </div>
                </div>

                {/* Rundown Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                    {visibleSegments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <ScrollText className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                {report.segments.length === 0
                                    ? 'Rundown Belum Tersedia'
                                    : 'Fase Ini Belum Memiliki Segmen'}
                            </h3>
                            <p className="mt-1 max-w-xs text-xs text-slate-500">
                                {report.segments.length === 0
                                    ? 'Event ini belum memiliki rundown yang bisa dilaporkan.'
                                    : 'Tidak ada segmen rundown pada fase yang dipilih.'}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-slate-200 text-xs font-semibold"
                                onClick={() =>
                                    report.segments.length === 0
                                        ? router.get(back_url)
                                        : setPhaseFilter('all')
                                }
                            >
                                {report.segments.length === 0
                                    ? 'Kembali ke Event'
                                    : 'Tampilkan Keseluruhan'}
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-100 text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                                        <th className="w-12 px-3 py-3 text-center">No</th>
                                        <th className="w-32 px-3 py-3 text-center">Waktu</th>
                                        <th className="px-3 py-3">Segmen / Mata Acara</th>
                                        <th className="w-24 px-3 py-3 text-center">Durasi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {visibleSegments.map((segment, position) => (
                                        <Fragment key={`segment-${segment.index}`}>
                                            <tr className="bg-slate-50/80">
                                                <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                                                    {position + 1}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-700">
                                                    {segment.start && segment.end
                                                        ? `${segment.start} – ${segment.end}`
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-bold text-slate-900">
                                                            {segment.title}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                                PHASE_META[segment.phase].badge,
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'h-1.5 w-1.5 rounded-full',
                                                                    PHASE_META[segment.phase].dot,
                                                                )}
                                                            />
                                                            {PHASE_META[segment.phase].label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-bold text-indigo-700">
                                                    {formatDuration(segment.duration_seconds)}
                                                </td>
                                            </tr>
                                            {segment.items.map((item, itemIndex) => (
                                                <tr
                                                    key={`segment-${segment.index}-item-${itemIndex}`}
                                                    className="bg-white"
                                                >
                                                    <td className="px-3 py-2 text-center text-slate-300">
                                                        •
                                                    </td>
                                                    <td className="px-3 py-2 text-center text-slate-300">
                                                        -
                                                    </td>
                                                    <td className="py-2 pr-3 pl-8 text-slate-700">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium">
                                                                {item.title}
                                                            </span>
                                                            {item.song_title && (
                                                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                                                                    <Music className="h-3 w-3" />
                                                                    {item.song_title}
                                                                    {item.arrangement_name
                                                                        ? ` (${item.arrangement_name})`
                                                                        : ''}
                                                                </span>
                                                            )}
                                                            {renderMediaButtons(item)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center font-mono text-slate-500">
                                                        {formatDuration(item.duration_seconds)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-200 bg-slate-50 text-xs font-bold text-slate-800">
                                        <td colSpan={3} className="px-3 py-3 text-right">
                                            Total Durasi Rencana:
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono text-indigo-700">
                                            {formatDuration(visibleTotalSeconds)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {activeMedia && (
                <div
                    className={cn(
                        'fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-6 sm:pb-6',
                        mediaClosing
                            ? 'animate-out fade-out slide-out-to-bottom-4 duration-200'
                            : 'animate-in fade-in slide-in-from-bottom-8 duration-300',
                    )}
                >
                    <div
                        role="dialog"
                        aria-label={`Player ${activeMedia.songTitle}`}
                        className={cn(
                            'w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5',
                            mediaMeta?.maxWidth,
                        )}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                    className={cn(
                                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                                        mediaMeta?.iconClass,
                                    )}
                                >
                                    {MediaIcon && <MediaIcon className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">
                                        {activeMedia.songTitle}
                                    </p>
                                    <p className="truncate text-[11px] font-medium text-slate-500">
                                        {mediaMeta?.label}
                                        {activeMedia.arrangementName
                                            ? ` · ${activeMedia.arrangementName}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Tutup player"
                                onClick={closeMedia}
                                className="h-8 w-8 shrink-0 text-slate-500 hover:bg-slate-200/60"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-3 sm:p-4">
                            {activeMedia.kind === 'video' ? (
                                activeMedia.embedUrl ? (
                                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                                        <iframe
                                            key={activeMedia.url}
                                            src={activeMedia.embedUrl}
                                            title={`Video ${activeMedia.songTitle}`}
                                            className="h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            referrerPolicy="strict-origin-when-cross-origin"
                                        />
                                    </div>
                                ) : (
                                    <a
                                        href={activeMedia.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
                                    >
                                        <Youtube className="h-4 w-4" />
                                        Buka video di tab baru
                                    </a>
                                )
                            ) : activeMedia.kind === 'pdf' ? (
                                <div className="space-y-2">
                                    <div className="h-[60vh] min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                                        <iframe
                                            key={activeMedia.url}
                                            src={activeMedia.url}
                                            title={`Chord PDF ${activeMedia.songTitle}`}
                                            className="h-full w-full"
                                        />
                                    </div>
                                    <a
                                        href={activeMedia.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        Buka PDF di tab baru
                                    </a>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <audio
                                        key={activeMedia.url}
                                        src={activeMedia.url}
                                        controls
                                        autoPlay
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
