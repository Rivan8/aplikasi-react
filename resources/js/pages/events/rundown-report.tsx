import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    FileDown,
    ListChecks,
    MapPin,
    Music,
    ScrollText,
    Timer,
} from 'lucide-react';
import { Fragment } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RundownItemRow {
    title: string;
    song_title: string | null;
    song_artist: string | null;
    arrangement_name: string | null;
    duration_seconds: number;
}

interface RundownSegmentRow {
    index: number;
    title: string;
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

export default function EventRundownReport({ event, report }: Props) {
    const eventDate = event.date ? new Date(event.date) : null;

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
                            onClick={() => router.get('/events')}
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
                        <a
                            href={`/events/${event.id}/rundown-report/pdf`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FileDown className="h-4 w-4" />
                            Buka PDF (Tab Baru)
                        </a>
                    </Button>
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
                            {report.total_segments}
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
                            {report.total_items}
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
                            {formatDurationLong(report.total_seconds)}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] font-semibold text-slate-400">
                            {formatDuration(report.total_seconds)}
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
                            {report.start_time && report.end_time
                                ? `${report.start_time} – ${report.end_time}`
                                : '-'}
                        </p>
                    </div>
                </div>

                {/* Rundown Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                    {report.segments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <ScrollText className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Rundown Belum Tersedia
                            </h3>
                            <p className="mt-1 max-w-xs text-xs text-slate-500">
                                Event ini belum memiliki rundown yang bisa dilaporkan.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-slate-200 text-xs font-semibold"
                                onClick={() => router.get('/events')}
                            >
                                Kembali ke Event
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
                                    {report.segments.map((segment) => (
                                        <Fragment key={`segment-${segment.index}`}>
                                            <tr className="bg-slate-50/80">
                                                <td className="px-3 py-2.5 text-center font-bold text-slate-500">
                                                    {segment.index}
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-700">
                                                    {segment.start && segment.end
                                                        ? `${segment.start} – ${segment.end}`
                                                        : '-'}
                                                </td>
                                                <td className="px-3 py-2.5 font-bold text-slate-900">
                                                    {segment.title}
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
                                            {formatDuration(report.total_seconds)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
