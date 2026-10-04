import { Head, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileText,
    Filter,
    RotateCcw,
    Search,
    Sparkles,
    TrendingUp,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ReportTabs from '@/pages/attendance-history/report-tabs';

interface RekapWeek {
    index: number;
    date: string;
    day: number;
    event_title: string | null;
}

interface RekapMonth {
    month: number;
    label: string;
    weeks: RekapWeek[];
}

interface RekapRow {
    member_id: string;
    name: string;
    nik: string | null;
    foto_url?: string | null;
    cells: Record<string, 'Present' | 'Late'>;
    hadir: number;
    terlambat: number;
}

interface DetailFilters {
    year: string;
    search: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedRows {
    data: RekapRow[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

interface AttendanceSummary {
    total_members: number;
    total_present: number;
    total_late: number;
}

interface Props {
    months: RekapMonth[];
    rows?: PaginatedRows | RekapRow[];
    summary?: AttendanceSummary;
    year: number;
    availableYears: number[];
    filters: DetailFilters;
}

const ALL_MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MONTH_FULL_NAMES = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const formatLongDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-').map(Number);

    if (!year || !month || !day) {
        return dateStr;
    }

    return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

export default function AttendanceReportDetail({
    months = [],
    rows,
    summary,
    year = new Date().getFullYear(),
    availableYears = [],
    filters = { year: '', search: '' },
}: Props) {
    const safeMonths = useMemo(() => (Array.isArray(months) ? months : []), [months]);
    const safeAvailableYears = useMemo(
        () => (Array.isArray(availableYears) ? availableYears : []),
        [availableYears],
    );

    const [filterYear, setFilterYear] = useState(filters?.year || String(year));
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [sortColumn, setSortColumn] = useState<'name' | 'hadir' | 'terlambat'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [quickFilter, setQuickFilter] = useState<'all' | 'present' | 'late' | 'perfect'>('all');
    const [startFromFirstMonth, setStartFromFirstMonth] = useState(true);

    const paginatedRows: PaginatedRows = useMemo(() => {
        if (Array.isArray(rows)) {
            return {
                data: rows,
                current_page: 1,
                last_page: 1,
                from: rows.length > 0 ? 1 : null,
                to: rows.length,
                total: rows.length,
                links: [],
            };
        }

        return (
            rows ?? {
                data: [],
                current_page: 1,
                last_page: 1,
                from: null,
                to: null,
                total: 0,
                links: [],
            }
        );
    }, [rows]);

    const pageTotalHadir = (paginatedRows.data || []).reduce(
        (sum, row) => sum + (row?.hadir || 0),
        0,
    );
    const pageTotalTerlambat = (paginatedRows.data || []).reduce(
        (sum, row) => sum + (row?.terlambat || 0),
        0,
    );

    const totalJemaat = summary?.total_members ?? paginatedRows.total;
    const totalHadir = summary?.total_present ?? pageTotalHadir;
    const totalTerlambat = summary?.total_late ?? pageTotalTerlambat;

    const monthMap = useMemo(() => {
        const map = new Map<number, RekapMonth>();

        safeMonths.forEach((m) => {
            if (m && typeof m.month === 'number') {
                map.set(m.month, m);
            }
        });

        return map;
    }, [safeMonths]);

    // Find the earliest month that has registered events
    const firstEventMonthIndex = useMemo(() => {
        if (safeMonths.length === 0) {
            return 1;
        }

        const validMonths = safeMonths
            .map((m) => m?.month)
            .filter((m): m is number => typeof m === 'number' && m >= 1 && m <= 12);

        if (validMonths.length === 0) {
            return 1;
        }

        return Math.min(...validMonths);
    }, [safeMonths]);

    // Display months filtered dynamically by starting month or full 12 months
    const displayMonthNumbers = useMemo(() => {
        const start = startFromFirstMonth ? firstEventMonthIndex : 1;

        return ALL_MONTH_NUMBERS.filter((m) => m >= start);
    }, [startFromFirstMonth, firstEventMonthIndex]);

    const getMonthWeeks = (mNum: number): RekapWeek[] => {
        const mData = monthMap.get(mNum);

        if (mData && Array.isArray(mData.weeks) && mData.weeks.length > 0) {
            return mData.weeks;
        }

        // Default 4 sub-column weeks if no events recorded yet for this month
        return [
            { index: 1, date: '', day: 0, event_title: null },
            { index: 2, date: '', day: 0, event_title: null },
            { index: 3, date: '', day: 0, event_title: null },
            { index: 4, date: '', day: 0, event_title: null },
        ];
    };

    const totalWeeksInYear = useMemo(() => {
        return safeMonths.reduce((sum, m) => sum + (Array.isArray(m?.weeks) ? m.weeks.length : 0), 0);
    }, [safeMonths]);

    const avgAttendanceRate = useMemo(() => {
        if (!totalJemaat || !totalWeeksInYear) {
            return 0;
        }

        const totalPossible = totalJemaat * totalWeeksInYear;

        if (totalPossible === 0) {
            return 0;
        }

        return Math.round((totalHadir / totalPossible) * 100);
    }, [totalJemaat, totalWeeksInYear, totalHadir]);

    const processedRows = useMemo(() => {
        let result = [...paginatedRows.data];

        if (quickFilter === 'present') {
            result = result.filter((r) => r.hadir > 0);
        } else if (quickFilter === 'late') {
            result = result.filter((r) => r.terlambat > 0);
        } else if (quickFilter === 'perfect') {
            result = result.filter((r) => r.hadir > 0 && r.terlambat === 0);
        }

        result.sort((a, b) => {
            let valA: string | number = a.name;
            let valB: string | number = b.name;

            if (sortColumn === 'hadir') {
                valA = a.hadir;
                valB = b.hadir;
            } else if (sortColumn === 'terlambat') {
                valA = a.terlambat;
                valB = b.terlambat;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDirection === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            return sortDirection === 'asc'
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

        return result;
    }, [paginatedRows.data, quickFilter, sortColumn, sortDirection]);

    const toggleSort = (column: 'name' | 'hadir' | 'terlambat') => {
        if (sortColumn === column) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(column);
            setSortDirection(column === 'name' ? 'asc' : 'desc');
        }
    };

    const renderSortIcon = (column: 'name' | 'hadir' | 'terlambat') => {
        if (sortColumn !== column) {
            return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-400 group-hover:opacity-100" />;
        }

        return sortDirection === 'asc' ? (
            <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-indigo-600" />
        ) : (
            <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-indigo-600" />
        );
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};

        if (filterYear) {
            params.year = filterYear;
        }

        if (searchQuery) {
            params.search = searchQuery;
        }

        router.get('/attendance-history/detail', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterYear(String(year));
        setSearchQuery('');
        setQuickFilter('all');
        setSortColumn('name');
        setSortDirection('asc');
        setStartFromFirstMonth(true);

        router.get(
            '/attendance-history/detail',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const buildExportUrl = () => {
        const params: Record<string, string> = {};

        if (filters.year) {
            params.year = filters.year;
        }

        if (filters.search) {
            params.search = filters.search;
        }

        const queryString = new URLSearchParams(params).toString();

        return `/attendance-history/detail/export/pdf${queryString ? `?${queryString}` : ''}`;
    };

    const goToPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    return (
        <TooltipProvider delayDuration={150}>
            <Head title="Laporan Detail Absensi" />
            <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* Header Top Card (Bright Vibrant Light Gradient Banner) */}
                <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white shadow-lg shadow-indigo-500/10 sm:p-8">
                    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-xs">
                                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                                <span>Matriks Rekapitulasi Absensi</span>
                            </div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
                                Laporan Absensi Volunteers
                            </h1>
                            <p className="max-w-2xl text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
                                Rekapitulasi kehadiran jemaat &amp; volunteers per pekan dalam periode{' '}
                                <span className="font-bold text-white underline underline-offset-4 decoration-white/30">
                                    {MONTH_FULL_NAMES[displayMonthNumbers[0] - 1]} – {MONTH_FULL_NAMES[displayMonthNumbers[displayMonthNumbers.length - 1] - 1]} {year}
                                </span>.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold text-white shadow-inner backdrop-blur-md">
                                <Calendar className="h-4 w-4 text-sky-200" />
                                <span>Tahun {year}</span>
                            </div>
                            <Button
                                asChild
                                className="h-11 rounded-2xl bg-white px-5 font-bold text-indigo-700 shadow-md transition-all hover:bg-sky-50 hover:shadow-lg active:scale-95 border border-white/40"
                            >
                                <a
                                    href={buildExportUrl()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-xs sm:text-sm"
                                >
                                    <Download className="h-4 w-4 text-indigo-600" />
                                    <span>Export PDF</span>
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <ReportTabs active="detail" />

                {/* Bright Summary Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-sky-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Volunteers
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-105 border border-sky-100">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                {totalJemaat}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Terdaftar di sistem laporan
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Hadir (H)
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105 border border-emerald-100">
                                <UserCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                                {totalHadir}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Akumulasi pekan tepat waktu
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-rose-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Total Terlambat (T)
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform group-hover:scale-105 border border-rose-100">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-3xl font-extrabold text-rose-600 tracking-tight">
                                {totalTerlambat}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Akumulasi keterlambatan
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                                Rata-rata Kehadiran
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105 border border-indigo-100">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {avgAttendanceRate}%
                                </p>
                                <span className="text-xs text-slate-500">
                                    ({totalWeeksInYear} pekan)
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
                                    style={{ width: `${avgAttendanceRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bright Toolbar & Filter Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
                        {/* Year Selection */}
                        <div className="space-y-1.5 lg:col-span-3">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Periode Tahun
                            </label>
                            <Select
                                value={filterYear}
                                onValueChange={setFilterYear}
                            >
                                <SelectTrigger className="h-10 border-slate-200 bg-slate-50/50 font-semibold text-xs text-slate-800">
                                    <SelectValue placeholder="Pilih Tahun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeAvailableYears.map((availableYear) => (
                                        <SelectItem
                                            key={availableYear}
                                            value={String(availableYear)}
                                        >
                                            Tahun {availableYear}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Input */}
                        <div className="space-y-1.5 lg:col-span-5">
                            <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                Cari Nama atau NIK
                            </label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="Ketik nama jemaat atau NIK..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
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

                        {/* Filter Action Buttons */}
                        <div className="flex items-center gap-2 lg:col-span-4 lg:justify-end">
                            <Button
                                onClick={applyFilters}
                                className="h-10 flex-1 font-semibold shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white lg:flex-none"
                            >
                                <Search className="mr-1.5 h-4 w-4" />
                                Cari Data
                            </Button>
                            <Button
                                onClick={resetFilters}
                                variant="outline"
                                className="h-10 font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                                <RotateCcw className="mr-1.5 h-4 w-4 text-slate-500" />
                                Reset
                            </Button>
                        </div>
                    </div>

                    {/* Quick Filters & Legend (Light Colors) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                <Filter className="h-3 w-3" /> Filter:
                            </span>
                            <button
                                onClick={() => setQuickFilter('all')}
                                className={cn(
                                    'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                    quickFilter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
                                )}
                            >
                                Semua ({paginatedRows.data.length})
                            </button>
                            <button
                                onClick={() => setQuickFilter('present')}
                                className={cn(
                                    'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                    quickFilter === 'present'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60',
                                )}
                            >
                                Pernah Hadir
                            </button>
                            <button
                                onClick={() => setQuickFilter('late')}
                                className={cn(
                                    'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                    quickFilter === 'late'
                                        ? 'bg-rose-600 text-white shadow-xs'
                                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60',
                                )}
                            >
                                Ada Terlambat
                            </button>

                            {/* Dynamic Month Range Toggle */}
                            <button
                                onClick={() => setStartFromFirstMonth((prev) => !prev)}
                                className={cn(
                                    'ml-2 rounded-lg border px-3 py-1 text-xs font-semibold transition-all shadow-2xs',
                                    startFromFirstMonth
                                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                        : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900',
                                )}
                            >
                                {startFromFirstMonth
                                    ? `📌 Mulai (${MONTH_FULL_NAMES[firstEventMonthIndex - 1]})`
                                    : '🗓️ Lengkap (Jan - Des)'}
                            </button>
                        </div>

                        {/* Clean Status Legend (Light Style) */}
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-1.5 text-xs">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Keterangan:
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-emerald-300 bg-emerald-100 text-[10px] font-black text-emerald-800">
                                    H
                                </span>
                                <span className="text-xs">Hadir Tepat Waktu</span>
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-rose-300 bg-rose-100 text-[10px] font-black text-rose-800">
                                    T
                                </span>
                                <span className="text-xs">Terlambat</span>
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-slate-500">
                                <span className="inline-flex h-5 w-5 items-center justify-center text-[11px] font-bold text-slate-400">
                                    -
                                </span>
                                <span className="text-xs">Belum / Tidak Absen</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bright Clean Matrix Table Section */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                    {processedRows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Data Tidak Ditemukan
                            </h3>
                            <p className="mt-1 text-xs text-slate-500 max-w-xs">
                                Tidak ada jemaat yang sesuai dengan pencarian atau filter yang dipilih.
                            </p>
                            <Button
                                onClick={resetFilters}
                                variant="outline"
                                size="sm"
                                className="mt-4 text-xs font-semibold border-slate-200"
                            >
                                Reset Filter
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-x-auto">
                            <table className="w-full text-left align-middle text-xs border-collapse">
                                <thead>
                                    {/* Header Row 1: Month Grouping (Bright Clean Light Slate Theme) */}
                                    <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                                        <th
                                            rowSpan={2}
                                            className="sticky left-0 z-30 w-10 bg-slate-100 px-2 py-3 text-center border-r border-slate-200 font-bold text-[10px] uppercase text-slate-600"
                                        >
                                            No
                                        </th>
                                        <th
                                            rowSpan={2}
                                            onClick={() => toggleSort('name')}
                                            className="sticky left-[40px] z-30 group cursor-pointer bg-slate-100 px-3 py-3 min-w-[170px] border-r border-slate-200 font-bold text-[10px] uppercase tracking-wider text-slate-700 transition-colors hover:text-indigo-700"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>User / Jemaat</span>
                                                {renderSortIcon('name')}
                                            </div>
                                        </th>

                                        {/* Bright Clean Month Headers (Light Slate Tints) */}
                                        {displayMonthNumbers.map((mNum, idx) => {
                                            const weeks = getMonthWeeks(mNum);
                                            const isEvenMonth = idx % 2 === 0;

                                            return (
                                                <th
                                                    key={mNum}
                                                    colSpan={weeks.length}
                                                    className={cn(
                                                        'py-2 text-center font-bold text-xs tracking-wide text-slate-800 border-r border-slate-200/90',
                                                        isEvenMonth ? 'bg-slate-100/90' : 'bg-slate-50',
                                                    )}
                                                >
                                                    {MONTH_FULL_NAMES[mNum - 1]}
                                                </th>
                                            );
                                        })}

                                        <th
                                            rowSpan={2}
                                            onClick={() => toggleSort('hadir')}
                                            className="group cursor-pointer px-3 py-3 text-center border-r border-slate-200 font-bold text-[10px] uppercase text-emerald-700 bg-emerald-50/70 transition-colors hover:bg-emerald-100/80 min-w-[70px]"
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                <span>HADIR</span>
                                                {renderSortIcon('hadir')}
                                            </div>
                                        </th>

                                        <th
                                            rowSpan={2}
                                            onClick={() => toggleSort('terlambat')}
                                            className="group cursor-pointer px-3 py-3 text-center font-bold text-[10px] uppercase text-rose-700 bg-rose-50/70 transition-colors hover:bg-rose-100/80 min-w-[75px]"
                                        >
                                            <div className="flex items-center justify-center gap-1">
                                                <span>TERLAMBAT</span>
                                                {renderSortIcon('terlambat')}
                                            </div>
                                        </th>
                                    </tr>

                                    {/* Header Row 2: Sub-headers M1 M2 M3 M4 (M5) with Date Day Numbers */}
                                    <tr className="border-b border-slate-200 bg-white font-bold text-[10px] text-slate-500 uppercase">
                                        {displayMonthNumbers.map((mNum) => {
                                            const weeks = getMonthWeeks(mNum);

                                            return weeks.map((w, wIdx) => (
                                                <th
                                                    key={`${mNum}-w-${w.index}-${wIdx}`}
                                                    title={w.date ? formatLongDate(w.date) : `Pekan ${w.index}`}
                                                    className="px-1 py-1.5 text-center border-r border-slate-200/70 min-w-[36px]"
                                                >
                                                    <div className="flex flex-col items-center justify-center leading-tight">
                                                        <span className="font-extrabold text-slate-800 text-[10px]">
                                                            M{w.index}
                                                        </span>
                                                        {w.day > 0 ? (
                                                            <span className="text-[9px] font-medium text-slate-400 font-mono mt-0.5">
                                                                {w.day}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-slate-300 mt-0.5">-</span>
                                                        )}
                                                    </div>
                                                </th>
                                            ));
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {processedRows.map((row, idx) => {
                                        return (
                                            <tr
                                                key={row.member_id}
                                                className="group transition-colors hover:bg-slate-50/80"
                                            >
                                                {/* Sticky No Column (Bright Light) */}
                                                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50/80 px-2 py-2.5 text-center text-xs font-semibold text-slate-500 border-r border-slate-200/80">
                                                    {(paginatedRows.from ?? 1) + idx}
                                                </td>

                                                {/* Sticky User Info Column (Bright Light) */}
                                                <td className="sticky left-[40px] z-20 bg-white group-hover:bg-slate-50/80 px-3 py-2.5 border-r border-slate-200/80 min-w-[170px]">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7 border border-slate-200 shrink-0 shadow-2xs">
                                                            {row.foto_url && (
                                                                <AvatarImage
                                                                    src={row.foto_url}
                                                                    alt={row.name}
                                                                    className="object-cover"
                                                                />
                                                            )}
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                                                {getInitials(row.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-slate-900 text-xs leading-snug truncate">
                                                                {row.name}
                                                            </span>
                                                            {row.nik ? (
                                                                <span className="text-[10px] text-slate-400 font-mono truncate">
                                                                    NIK: {row.nik}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 truncate">
                                                                    ID #{row.member_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Sub-column Attendance Cells (M1, M2...) */}
                                                {displayMonthNumbers.map((mNum) => {
                                                    const weeks = getMonthWeeks(mNum);

                                                    return weeks.map((w, wIdx) => {
                                                        const status = w.date ? row.cells[w.date] : undefined;
                                                        const isPresent = status === 'Present';
                                                        const isLate = status === 'Late';

                                                        return (
                                                            <td
                                                                key={`${row.member_id}-${mNum}-${w.index}-${wIdx}`}
                                                                className="px-0.5 py-2 text-center align-middle border-r border-slate-100"
                                                            >
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span
                                                                            className={cn(
                                                                                'inline-flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black transition-all cursor-pointer select-none',
                                                                                isPresent &&
                                                                                    'bg-emerald-100 text-emerald-800 border border-emerald-300/80 hover:bg-emerald-200',
                                                                                isLate &&
                                                                                    'bg-rose-100 text-rose-800 border border-rose-300/80 hover:bg-rose-200',
                                                                                !status &&
                                                                                    'text-slate-300 hover:text-slate-500 text-[11px]',
                                                                            )}
                                                                        >
                                                                            {isPresent ? 'H' : isLate ? 'T' : '-'}
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="space-y-1 p-2 text-xs bg-slate-900 text-white">
                                                                        <p className="font-bold">
                                                                            {w.event_title || `Pekan ${w.index} (${MONTH_FULL_NAMES[mNum - 1]})`}
                                                                        </p>
                                                                        {w.date && (
                                                                            <p className="text-[11px] text-slate-300">
                                                                                {formatLongDate(w.date)}
                                                                            </p>
                                                                        )}
                                                                        <div className="pt-0.5">
                                                                            <Badge
                                                                                className={cn(
                                                                                    'text-[10px] font-bold border-none',
                                                                                    isPresent && 'bg-emerald-600 text-white',
                                                                                    isLate && 'bg-rose-600 text-white',
                                                                                    !status && 'bg-slate-700 text-slate-200',
                                                                                )}
                                                                            >
                                                                                {isPresent
                                                                                    ? 'Hadir (H)'
                                                                                    : isLate
                                                                                        ? 'Terlambat (T)'
                                                                                        : 'Belum / Tidak Absen (-)'}
                                                                            </Badge>
                                                                        </div>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </td>
                                                        );
                                                    });
                                                })}

                                                {/* Total Hadir */}
                                                <td className="px-2 py-2.5 text-center border-r border-slate-200/70 bg-emerald-50/20">
                                                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-100 px-1.5 text-xs font-extrabold text-emerald-800 border border-emerald-300/60">
                                                        {row.hadir}
                                                    </span>
                                                </td>

                                                {/* Total Terlambat */}
                                                <td className="px-2 py-2.5 text-center bg-rose-50/20">
                                                    <span
                                                        className={cn(
                                                            'inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-extrabold',
                                                            row.terlambat > 0
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-300/60'
                                                                : 'bg-slate-100 text-slate-400',
                                                        )}
                                                    >
                                                        {row.terlambat}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-slate-200 bg-slate-50 font-bold text-xs">
                                        <td colSpan={2} className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-right text-slate-800 border-r border-slate-200">
                                            Total Kehadiran Halaman Ini:
                                        </td>
                                        <td
                                            colSpan={displayMonthNumbers.reduce(
                                                (sum, m) => sum + getMonthWeeks(m).length,
                                                0,
                                            )}
                                            className="px-4 py-3 text-center text-slate-500 text-[11px] border-r border-slate-200 italic"
                                        >
                                            Kehadiran dan kedisiplinan volunteers dalam pelayanan.
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-200 bg-emerald-50/40">
                                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-emerald-800 border border-emerald-300/60 font-extrabold">
                                                {pageTotalHadir}
                                            </span>
                                        </td>
                                        <td className="px-2 py-3 text-center bg-rose-50/40">
                                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-rose-800 border border-rose-300/60 font-extrabold">
                                                {pageTotalTerlambat}
                                            </span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Pagination Bar */}
                    {paginatedRows.last_page > 1 && (
                        <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between bg-white">
                            <p className="text-xs font-medium text-slate-500">
                                Menampilkan <span className="font-bold text-slate-800">{paginatedRows.from ?? 0}</span> -{' '}
                                <span className="font-bold text-slate-800">{paginatedRows.to ?? 0}</span> dari{' '}
                                <span className="font-bold text-slate-800">{paginatedRows.total}</span> data jemaat
                            </p>
                            <div className="flex items-center gap-1.5">
                                {paginatedRows.links.map((link, index) => {
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

                                    if (index === paginatedRows.links.length - 1) {
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
                                            key={link.label}
                                            variant={link.active ? 'default' : 'ghost'}
                                            size="sm"
                                            className={cn(
                                                'h-8 min-w-8 px-2 font-semibold text-xs',
                                                link.active
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                                            )}
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
        </TooltipProvider>
    );
}


