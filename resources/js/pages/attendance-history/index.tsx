import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    MapPin,
    Search,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AttendanceLog {
    id: number;
    member_id: string;
    member_name: string;
    member_nik: string | null;
    event_title: string;
    event_location: string;
    event_date: string | null;
    scan_time: string;
    scan_time_raw: string;
    status: 'Present' | 'Late';
}

interface EventOption {
    id: number;
    title: string;
    date: string;
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

const avatarColors = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

export default function AttendanceHistory({ attendances, events, filters }: Props) {
    const [filterEventId, setFilterEventId] = useState(filters.event_id || 'all');
    const [filterStatus, setFilterStatus] = useState(filters.status || 'all');
    const [filterDateFrom, setFilterDateFrom] = useState(filters.date_from || '');
    const [filterDateTo, setFilterDateTo] = useState(filters.date_to || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (filterEventId && filterEventId !== 'all') params.event_id = filterEventId;
        if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
        if (filterDateFrom) params.date_from = filterDateFrom;
        if (filterDateTo) params.date_to = filterDateTo;
        if (searchQuery) params.search = searchQuery;

        router.get('/attendance-history', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterEventId('all');
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
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    return (
        <>
            <Head title="Riwayat Kehadiran" />
            <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                            Riwayat Kehadiran
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Lihat dan kelola riwayat scan kehadiran jemaat.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="flex items-center gap-2 font-medium">
                            <FileText className="h-4 w-4" />
                            Export PDF
                        </Button>

                        <Button className="flex items-center gap-2 font-medium shadow-sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Kehadiran</p>
                                <p className="text-2xl font-bold text-foreground">{attendances.total}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                <Clock className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hadir Tepat Waktu</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {attendances.data.filter(a => a.status === 'Present').length}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">halaman ini</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                                <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Event</p>
                                <p className="text-2xl font-bold text-foreground">{events.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Filter Event
                            </label>
                            <Select value={filterEventId} onValueChange={setFilterEventId}>
                                <SelectTrigger className="w-full bg-muted/30 border-border">
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
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Status
                            </label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full bg-muted/30 border-border">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="Present">Hadir</SelectItem>
                                    <SelectItem value="Late">Terlambat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Dari Tanggal
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="pl-10 bg-muted/30 border-border"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Sampai Tanggal
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="pl-10 bg-muted/30 border-border"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        <Button onClick={applyFilters} className="shadow-sm">
                            <Search className="h-4 w-4 mr-2" />
                            Terapkan Filter
                        </Button>
                        <Button variant="ghost" onClick={resetFilters} className="text-muted-foreground">
                            Reset
                        </Button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nama Jemaat</th>
                                    <th className="px-6 py-4">Detail Event</th>
                                    <th className="px-6 py-4">Waktu Scan</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {attendances.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <Users className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="font-medium">Belum ada data kehadiran</p>
                                                <p className="text-sm mt-1">Data kehadiran akan muncul setelah ada jemaat yang di-scan.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    attendances.data.map((log, idx) => (
                                        <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-border">
                                                        <AvatarFallback className={`text-white font-bold text-xs ${avatarColors[idx % avatarColors.length]}`}>
                                                            {getInitials(log.member_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{log.member_name}</span>
                                                        {log.member_nik && (
                                                            <span className="text-xs text-muted-foreground">NIK: {log.member_nik}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-foreground/80">{log.event_title}</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3" />
                                                        {log.event_location}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-foreground/70">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{log.scan_time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border-none
                                                        ${log.status === 'Present'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                        }
                                                    `}
                                                >
                                                    {log.status === 'Present' ? '● Hadir' : '▲ Terlambat'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {attendances.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {attendances.from || 0} - {attendances.to || 0} dari {attendances.total} data
                            </p>
                            <div className="flex items-center gap-1">
                                {attendances.links.map((link, index) => {
                                    // Skip "Previous" and "Next" labels, handle them separately
                                    if (index === 0) {
                                        return (
                                            <Button
                                                key="prev"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground"
                                                disabled={!link.url}
                                                onClick={() => goToPage(link.url)}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                        );
                                    }
                                    if (index === attendances.links.length - 1) {
                                        return (
                                            <Button
                                                key="next"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-muted-foreground"
                                                disabled={!link.url}
                                                onClick={() => goToPage(link.url)}
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
                                            className={`h-8 w-8 p-0 ${link.active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
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
