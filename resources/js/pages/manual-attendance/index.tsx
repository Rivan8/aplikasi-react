import { Head, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    Info,
    MapPin,
    Search,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn, formatEventDate } from '@/lib/utils';

interface EventSession {
    id: number;
    session_number: number;
    title: string;
    date: string;
}

interface EventItem {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    attendance_type?: string;
    sessions?: EventSession[];
}

interface Member {
    idjemaat: string;
    name: string;
    nik: string | null;
    foto_url: string | null;
}

interface RecentAttendance {
    id: number;
    member_id: string;
    name: string;
    foto_url: string | null;
    time: string | null;
    date: string | null;
    status: 'Present' | 'Late';
}

interface Filters {
    event_id: string;
    event_session_id: string;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

export default function ManualAttendance({
    events = [],
    members = [],
    recentAttendances = [],
    markedMemberIds = [],
    filters,
}: {
    events: EventItem[];
    members: Member[];
    recentAttendances: RecentAttendance[];
    markedMemberIds: string[];
    filters: Filters;
}) {
    const { flash } = usePage().props as unknown as {
        flash?: { success?: string; error?: string; info?: string };
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceTime, setAttendanceTime] = useState(
        () => new Date().toTimeString().slice(0, 5),
    );
    const [processingMemberId, setProcessingMemberId] = useState<string | null>(
        null,
    );
    const selectedEvent = events.find(
        (event) => String(event.id) === filters.event_id,
    );
    const sessions = selectedEvent?.sessions ?? [];
    const markedMembers = useMemo(
        () => new Set(markedMemberIds),
        [markedMemberIds],
    );
    const searchResults = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return [];
        }

        return members
            .filter(
                (member) =>
                    member.name.toLowerCase().includes(query) ||
                    (member.nik ?? '').toLowerCase().includes(query) ||
                    member.idjemaat.includes(query),
            )
            .slice(0, 30);
    }, [members, searchQuery]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }

        if (flash?.error) {
            toast.error(flash.error);
        }

        if (flash?.info) {
            toast.info(flash.info);
        }
    }, [flash]);

    const changeEvent = (eventId: string) => {
        router.get(
            '/manual-attendance',
            { event_id: eventId },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const changeSession = (sessionId: string) => {
        router.get(
            '/manual-attendance',
            {
                event_id: filters.event_id,
                ...(sessionId && sessionId !== 'all'
                    ? { event_session_id: sessionId }
                    : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const markAttendance = (member: Member, status: 'Present' | 'Late') => {
        if (!filters.event_id) {
            toast.error('Pilih event terlebih dahulu.');

            return;
        }

        if (!attendanceTime) {
            toast.error('Isi jam absen terlebih dahulu.');

            return;
        }

        setProcessingMemberId(member.idjemaat);
        router.post(
            '/manual-attendance',
            {
                event_id: filters.event_id,
                event_session_id: filters.event_session_id || null,
                member_id: member.idjemaat,
                status,
                scan_time: attendanceTime,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setProcessingMemberId(null),
            },
        );
    };

    return (
        <div className="w-full min-w-0 space-y-7 px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
            <Head title="Absensi Manual" />

            <div className="relative">
                <div className="absolute -top-24 -right-10 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                        <UserCheck className="size-7" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                            Absensi Manual
                        </h1>
                        <p className="mt-1 max-w-3xl text-sm text-muted-foreground sm:text-base">
                            Catatkan kehadiran jemaat yang lupa atau tidak bisa
                            melakukan absen mandiri.
                        </p>
                    </div>
                </div>
            </div>

            <Card className="rounded-3xl border-primary/15 shadow-sm">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:p-6">
                    <div className="w-full space-y-2 sm:max-w-xl">
                        <Label>Event</Label>
                        <Select
                            value={filters.event_id}
                            onValueChange={changeEvent}
                            disabled={events.length === 0}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih event..." />
                            </SelectTrigger>
                            <SelectContent>
                                {events.map((event) => (
                                    <SelectItem
                                        key={event.id}
                                        value={String(event.id)}
                                    >
                                        <span className="truncate">
                                            {event.title}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {formatEventDate(event.date)}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {sessions.length > 0 && (
                        <div className="w-full space-y-2 sm:max-w-xs">
                            <Label>Sesi</Label>
                            <Select
                                value={filters.event_session_id || 'all'}
                                onValueChange={changeSession}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Doa Persiapan Ibadah" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Doa Persiapan Ibadah
                                    </SelectItem>
                                    {sessions.map((session) => (
                                        <SelectItem
                                            key={session.id}
                                            value={String(session.id)}
                                        >
                                            {session.title} ({session.date})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="w-full space-y-2 sm:w-36">
                        <Label htmlFor="attendance-time">Jam Absen</Label>
                        <Input
                            id="attendance-time"
                            type="time"
                            value={attendanceTime}
                            onChange={(event) =>
                                setAttendanceTime(event.target.value)
                            }
                        />
                        <p className="text-[11px] leading-tight text-muted-foreground">
                            Berlaku untuk setiap entri.
                        </p>
                    </div>

                    {selectedEvent && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground sm:ml-auto sm:justify-end">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-4 text-primary" />
                                {formatEventDate(selectedEvent.date)}
                            </span>
                            {selectedEvent.time && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 className="size-4 text-primary" />
                                    {selectedEvent.time.slice(0, 5)}
                                </span>
                            )}
                            {selectedEvent.location && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4 text-primary" />
                                    {selectedEvent.location}
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {events.length === 0 ? (
                <Card className="rounded-3xl border-dashed bg-muted/10 shadow-none">
                    <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CalendarDays className="size-7" />
                        </div>
                        <h2 className="mt-5 text-lg font-bold">
                            Belum ada event dalam 30 hari terakhir
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Absensi manual hanya tersedia untuk event hari ini
                            atau 30 hari terakhir.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <CardTitle>Cari Jemaat</CardTitle>
                            <CardDescription>
                                Cari berdasarkan nama, NIK, atau ID jemaat, lalu
                                tandai status kehadirannya.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(event) =>
                                        setSearchQuery(event.target.value)
                                    }
                                    placeholder="Ketik nama, NIK, atau ID jemaat..."
                                    className="pl-9"
                                />
                            </div>

                            {!searchQuery.trim() && (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Users className="size-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium">
                                        Mulai ketik untuk mencari jemaat
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Hasil pencarian akan muncul di sini.
                                    </p>
                                </div>
                            )}

                            {searchQuery.trim() &&
                                searchResults.length === 0 && (
                                    <div className="rounded-2xl border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
                                        Jemaat tidak ditemukan. Periksa ejaan
                                        nama atau NIK.
                                    </div>
                                )}

                            {searchResults.length > 0 && (
                                <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
                                    {searchResults.map((member) => {
                                        const marked = markedMembers.has(
                                            member.idjemaat,
                                        );
                                        const processing =
                                            processingMemberId ===
                                            member.idjemaat;

                                        return (
                                            <div
                                                key={member.idjemaat}
                                                className={cn(
                                                    'flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center',
                                                    marked &&
                                                        'border-emerald-200 bg-emerald-50/60',
                                                )}
                                            >
                                                <Avatar className="size-10 shrink-0 border">
                                                    {member.foto_url && (
                                                        <AvatarImage
                                                            src={member.foto_url}
                                                            alt={member.name}
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                                        {initials(member.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.nik
                                                            ? `NIK ${member.nik}`
                                                            : `ID ${member.idjemaat}`}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    {marked ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-emerald-300 bg-emerald-100/60 text-emerald-700"
                                                        >
                                                            <CheckCircle2 className="size-3.5" />
                                                            Sudah absen
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() =>
                                                                    markAttendance(
                                                                        member,
                                                                        'Present',
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                Hadir
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                                                onClick={() =>
                                                                    markAttendance(
                                                                        member,
                                                                        'Late',
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                Terlambat
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle>Sudah Absen</CardTitle>
                                    <CardDescription>
                                        {markedMemberIds.length} jemaat tercatat
                                        untuk event/sesi ini.
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary">
                                    <Users className="size-3.5" />
                                    {markedMemberIds.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="max-h-[560px] space-y-2 overflow-y-auto">
                            {recentAttendances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Info className="size-6" />
                                    </div>
                                    <p className="mt-4 text-sm font-medium">
                                        Belum ada absensi tercatat
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Kehadiran yang dicatat akan muncul di
                                        sini.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {recentAttendances.map((attendance) => (
                                        <div
                                            key={attendance.id}
                                            className={cn(
                                                'flex items-center gap-3 rounded-2xl border p-3',
                                                attendance.status === 'Late'
                                                    ? 'border-amber-200 bg-amber-50/50'
                                                    : 'border-emerald-200 bg-emerald-50/50',
                                            )}
                                        >
                                            <Avatar className="size-9 shrink-0 border">
                                                {attendance.foto_url && (
                                                    <AvatarImage
                                                        src={
                                                            attendance.foto_url
                                                        }
                                                        alt={attendance.name}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
                                                    {initials(attendance.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">
                                                    {attendance.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {attendance.time ?? '-'} ·{' '}
                                                    {attendance.date ?? '-'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    attendance.status ===
                                                        'Late'
                                                        ? 'border-amber-300 bg-amber-100/60 text-amber-700'
                                                        : 'border-emerald-300 bg-emerald-100/60 text-emerald-700',
                                                )}
                                            >
                                                {attendance.status === 'Late'
                                                    ? 'Terlambat'
                                                    : 'Hadir'}
                                            </Badge>
                                        </div>
                                    ))}
                                    {markedMemberIds.length >
                                        recentAttendances.length && (
                                        <p className="pt-1 text-center text-xs text-muted-foreground">
                                            Menampilkan{' '}
                                            {recentAttendances.length} absensi
                                            terbaru.
                                        </p>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
