import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    MapPin,
    RotateCcw,
    Search,
    Sparkles,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ReportTabs from '@/pages/attendance-history/report-tabs';

interface AttendanceLog {
    id: number;
    member_id: string;
    member_name: string;
    member_nik: string | null;
    member_foto_url?: string | null;
    event_title: string;
    session_title?: string | null;
    event_location: string;
    event_date: string | null;
    scan_time: string;
    scan_time_raw: string;
    check_out_time: string | null;
    status: 'Present' | 'Late';
}

interface EventSessionOption {
    id: number;
    session_number: number;
    title: string;
    date: string;
}

interface EventOption {
    id: number;
    title: string;
    date: string;
    attendance_type?: string;
    sessions?: EventSessionOption[];
}

interface PaginationLinks {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedAttendances {
    data: AttendanceLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLinks[];
}

interface Filters {
    event_id?: string;
    event_session_id?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
}

interface Props {
    attendances: PaginatedAttendances;
    events: EventOption[];
    filters: Filters;
}

export default function AttendanceHistory({ attendances, events, filters }: Props) {
    const [filterEventId, setFilterEventId] = useState(filters.event_id || 'all');
    const [filterSessionId, setFilterSessionId] = useState(filters.event_session_id || 'all');
    const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const selectedEventObj = events.find(e => String(e.id) === filterEventId);

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (filterEventId && filterEventId !== 'all') {
            params.event_id = filterEventId;
        }

        if (filterSessionId && filterSessionId !== 'all') {
            params.event_session_id = filterSessionId;
        }

        if (filterStatus && filterStatus !== 'all') {
            params.status = filterStatus;
        }

        if (filterDateFrom) {
            params.date_from = filterDateFrom;
        }

        if (filterDateTo) {
            params.date_to = filterDateTo;
        }

        if (searchQuery) {
            params.search = searchQuery;
        }

        router.get('/attendance-history', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterEventId('all');
        setFilterSessionId('all');
        setFilterStatus('all');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchQuery('');
        router.get('/attendance-history', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const buildExportUrl = (format: 'pdf' | 'excel') => {
        const params: Record<string, string> = {};

        if (filterEventId && filterEventId !== 'all') {
            params.event_id = filterEventId;
        }

        if (filterSessionId && filterSessionId !== 'all') {
            params.event_session_id = filterSessionId;
        }

        if (filterStatus && filterStatus !== 'all') {
            params.status = filterStatus;
        }

        if (filterDateFrom) {
            params.date_from = filterDateFrom;
        }

        if (filterDateTo) {
            params.date_to = filterDateTo;
        }

        if (searchQuery) {
            params.search = searchQuery;
        }

        const queryString = new URLSearchParams(params).toString();

        return `/attendance-history/export/${format}${queryString ? `?${queryString}` : ''}`;
    };

    return (
        <>
            <Head title="Laporan Absensi (Proses)" />
            <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header Top Card (Matching Detail Page Light Banner) */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white shadow-lg shadow-indigo-500/10 sm:p-8">
                    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-xs">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>Log Absensi Real-Time</span>
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                Laporan Proses Absensi
                            </h1>
                            <p className="max-w-2xl text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
                                Kelola dan tinjau seluruh riwayat scan kehadiran jemaat &amp; volunteers secara mendalam.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                asChild
                                className="h-11 rounded-2xl bg-white px-4 font-bold text-indigo-700 shadow-md transition-all hover:bg-sky-50 hover:shadow-lg active:scale-95 border border-white/40"
                            >
                                <a
                                    href={buildExportUrl('pdf')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-xs sm:text-sm"
                                >
                                    <FileText className="h-4 w-4 text-rose-600" />
                                    <span>Export PDF</span>
                                </a>
                            </Button>

                            <Button
                                asChild
                                className="h-11 rounded-2xl bg-white px-4 font-bold text-indigo-700 shadow-md transition-all hover:bg-sky-50 hover:shadow-lg active:scale-95 border border-white/40"
                            >
                                <a
                                    href={buildExportUrl('excel')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-xs sm:text-sm"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    <span>Export Excel</span>
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <ReportTabs active="proses" />

                {/* Bright Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Scan Kehadiran
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100 transition-transform group-hover:scale-105">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {attendances.total}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Total log absensi terdaftar
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Hadir Tepat Waktu
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform group-hover:scale-105">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                    {attendances.data.filter(a => a.status === 'Present').length}
                                </p>
                                <span className="text-xs text-slate-500">
                                    (halaman ini)
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Scan sebelum batas waktu
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Event Terdaftar
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 transition-transform group-hover:scale-105">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {events.length}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Event &amp; sesi aktif
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Event Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Filter Event
                            </label>
                            <Select value={filterEventId} onValueChange={(val) => {
                                setFilterEventId(val);
                                setFilterSessionId('all');
                            }}>
                                <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-800">
                                    <SelectValue placeholder="Semua Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Event</SelectItem>
                                    {events.map(event => (
                                        <SelectItem key={event.id} value={String(event.id)}>
                                            {event.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Session Filter */}
                        {selectedEventObj?.sessions && selectedEventObj.sessions.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                                    Filter Sesi Kelas
                                </label>
                                <Select value={filterSessionId} onValueChange={setFilterSessionId}>
                                    <SelectTrigger className="h-10 border-indigo-200 bg-indigo-50/50 font-semibold text-xs text-indigo-900">
                                        <SelectValue placeholder="Semua Sesi Kelas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Sesi Kelas</SelectItem>
                                        {selectedEventObj.sessions.map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.title} ({s.date})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Status Filter */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Status Kehadiran
                            </label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-800">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="Present">Hadir Tepat Waktu</SelectItem>
                                    <SelectItem value="Late">Terlambat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Input */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Cari Nama atau NIK
                            </label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Ketik nama jemaat atau NIK..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            applyFilters();
                                        }
                                    }}
                                    className="h-10 border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs font-medium text-slate-800 placeholder:text-slate-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        type="button"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Date From */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Dari Tanggal
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="h-10 border-slate-200 bg-slate-50/50 pl-9 text-xs font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        {/* Date To */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Sampai Tanggal
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="h-10 border-slate-200 bg-slate-50/50 pl-9 text-xs font-medium text-slate-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="flex items-center gap-2 border-t border-slate-100 pt-4 justify-end">
                        <Button onClick={applyFilters} className="h-10 font-semibold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Search className="h-4 w-4 mr-1.5" />
                            Terapkan Filter
                        </Button>
                        <Button variant="outline" onClick={resetFilters} className="h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50">
                            <RotateCcw className="h-4 w-4 mr-1.5 text-slate-500" />
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Bright Clean Table Section */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left align-middle text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-100 text-slate-800 font-bold text-[10px] uppercase tracking-wider">
                                    <th className="px-5 py-3.5">Nama Jemaat / Volunteer</th>
                                    <th className="px-5 py-3.5">Detail Event &amp; Sesi</th>
                                    <th className="px-5 py-3.5">Waktu Check-in</th>
                                    <th className="px-5 py-3.5">Waktu Check-out</th>
                                    <th className="px-5 py-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {attendances.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                                                    <Users className="h-6 w-6" />
                                                </div>
                                                <p className="font-bold text-sm text-slate-800">Belum ada data kehadiran</p>
                                                <p className="text-xs text-slate-500 mt-1">Data absensi akan muncul secara otomatis setelah ada jemaat yang di-scan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    attendances.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Nama & Foto Jemaat */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-slate-200 shrink-0 shadow-2xs">
                                                        {log.member_foto_url && (
                                                            <AvatarImage
                                                                src={log.member_foto_url}
                                                                alt={log.member_name}
                                                                className="object-cover"
                                                            />
                                                        )}
                                                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                                                            {getInitials(log.member_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-slate-900 text-xs truncate">
                                                            {log.member_name}
                                                        </span>
                                                        {log.member_nik ? (
                                                            <span className="text-[10px] text-slate-400 font-mono truncate">
                                                                NIK: {log.member_nik}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 truncate">
                                                                ID #{log.member_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Detail Event */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-slate-800 text-xs">
                                                        {log.event_title}
                                                    </span>
                                                    {log.session_title && (
                                                        <Badge variant="outline" className="w-fit text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 font-bold">
                                                            {log.session_title}
                                                        </Badge>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        <span>{log.event_location}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Check-in */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className="font-medium text-xs">{log.scan_time}</span>
                                                </div>
                                            </td>

                                            {/* Check-out */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span className={log.check_out_time ? "font-medium text-xs text-slate-800" : "text-xs text-slate-400 italic"}>
                                                        {log.check_out_time || 'Belum check-out'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5 text-center">
                                                <span
                                                    className={log.status === 'Present'
                                                        ? 'inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-800 border border-emerald-300/80'
                                                        : 'inline-flex items-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-800 border border-rose-300/80'
                                                    }
                                                >
                                                    {log.status === 'Present' ? '● HADIR' : '▲ TERLAMBAT'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Bar */}
                    {attendances.last_page > 1 && (
                        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-white">
                            <p className="text-xs font-medium text-slate-500">
                                Menampilkan <span className="font-bold text-slate-800">{attendances.from || 0}</span> -{' '}
                                <span className="font-bold text-slate-800">{attendances.to || 0}</span> dari{' '}
                                <span className="font-bold text-slate-800">{attendances.total}</span> data
                            </p>
                            <div className="flex items-center gap-1.5">
                                {attendances.links.map((link, index) => {
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key="prev"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 border-slate-200"
                                                disabled={!link.url}
                                                onClick={() => goToPage(link.url)}
                                                aria-label="Halaman sebelumnya"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }

                                    if (index === attendances.links.length - 1) {
                                        return (
                                            <Button
                                                key="next"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0 border-slate-200"
                                                disabled={!link.url}
                                                onClick={() => goToPage(link.url)}
                                                aria-label="Halaman berikutnya"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        );
                                    }

                                    return (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'ghost'}
                                            size="sm"
                                            className={`h-8 min-w-8 px-2 font-semibold text-xs ${
                                                link.active
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                            }`}
                                            disabled={!link.url}
                                            onClick={() => goToPage(link.url)}
                                        >
                                            {link.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AttendanceHistory.layout = {
    breadcrumbs: [
        {
            title: 'Riwayat Kehadiran',
            href: '/attendance-history',
        },
    ],
};

