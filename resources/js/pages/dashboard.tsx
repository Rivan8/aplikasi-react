import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    History,
    MapPin,
    QrCode,
    Radio,
    RotateCcw,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    Users,
    X,
    XCircle,
    ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface DashboardStats {
    active_events: number;
    events_this_week: number;
    today_check_ins: number;
    attendance_rate: number;
    volunteer_scheduled: number;
    open_roles: number;
    service_readiness: number;
}

interface UpcomingService {
    id: number;
    title: string;
    category: string;
    date: string;
    time: string;
    location: string;
    expected: number;
    checkedIn: number;
    volunteers: number;
    openRoles: number;
}

interface ReadinessItem {
    label: string;
    filled: number;
    total: number;
}

interface LiveCheckIn {
    name: string;
    event: string;
    time: string;
    status: 'Present' | 'Late' | string;
}

interface DashboardData {
    stats: DashboardStats;
    upcoming_services: UpcomingService[];
    readiness_items: ReadinessItem[];
    live_check_ins: LiveCheckIn[];
    user_assignments?: UserAssignment[];
    admin_assignments?: AdminAssignment[];
    external_members?: ExternalMember[];
}

interface AdminAssignment {
    id: number;
    role_category: string;
    role_name: string;
    response_status: 'pending' | 'accepted' | 'declined' | string;
    response_reason?: string | null;
    member_id: string;
    member_name: string;
    event: {
        id: number;
        title: string;
        date: string;
    };
}

interface ExternalMember {
    id: string;
    name: string;
}

interface UserAssignment {
    id: number;
    role_category: string;
    role_name: string;
    response_status: 'pending' | 'accepted' | 'declined' | string;
    response_reason?: string | null;
    event: {
        id?: number | null;
        title: string;
        category?: string | null;
        date?: string | null;
        time?: string | null;
        location?: string | null;
        address?: string | null;
    };
    team: ScheduledTeamMember[];
}

interface ScheduledTeamMember {
    id: number;
    name: string;
    role_category: string;
    role_name: string;
    response_status: 'pending' | 'accepted' | 'declined' | string;
}

const emptyStats: DashboardStats = {
    active_events: 0,
    events_this_week: 0,
    today_check_ins: 0,
    attendance_rate: 0,
    volunteer_scheduled: 0,
    open_roles: 0,
    service_readiness: 0,
};

function buildPlanningTasks(stats: DashboardStats) {
    return [
        {
            title: 'Lengkapi role volunteer',
            detail:
                stats.open_roles > 0
                    ? `${stats.open_roles} role masih kosong di event mendatang.`
                    : 'Semua role event mendatang sudah terisi.',
            icon: stats.open_roles > 0 ? AlertCircle : CheckCircle2,
            tone: stats.open_roles > 0 ? 'text-amber-600' : 'text-emerald-600',
        },
        {
            title: 'Review kategori event',
            detail: 'Pastikan template role sudah sesuai departemen pelayanan.',
            icon: ClipboardList,
            tone: 'text-sky-600',
        },
        {
            title: 'Siapkan QR check-in',
            detail:
                stats.active_events > 0
                    ? 'QR event aktif siap digunakan untuk absensi jemaat.'
                    : 'Buat event baru sebelum membagikan QR check-in.',
            icon: QrCode,
            tone: 'text-emerald-600',
        },
    ];
}

const quickActions = [
    { title: 'Buat Event', href: '/events', icon: CalendarDays },
    { title: 'Scan QR', href: '/scan-qr', icon: QrCode },
    { title: 'Riwayat', href: '/attendance-history', icon: History },
    { title: 'Member', href: '/anggota', icon: Users },
];

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
            />
        </div>
    );
}

function formatEventDate(date: string) {
    if (!date || Number.isNaN(Date.parse(date))) {
        return '-';
    }

    return new Date(date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
}

function getResponseBadge(status: string) {
    if (status === 'accepted') {
        return {
            label: 'Diterima',
            className:
                'rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
        };
    }

    if (status === 'declined') {
        return {
            label: 'Ditolak',
            className:
                'rounded-md border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300',
        };
    }

    return {
        label: 'Menunggu',
        className:
            'rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
    };
}

const SearchableSelect = ({
    value,
    onSelect,
    external_members = [],
    placeholder = 'Pilih Jemaat...',
}: {
    value: string;
    onSelect: (val: string) => void;
    external_members: ExternalMember[];
    placeholder?: string;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredMembers = useMemo(() => {
        const list = Array.isArray(external_members) ? external_members : [];

        if (!searchTerm) {
            return list.slice(0, 50);
        }

        return list
            .filter((m) =>
                m.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .slice(0, 50);
    }, [searchTerm, external_members]);

    const selectedMember = Array.isArray(external_members)
        ? external_members.find((m) => m.id === value)
        : null;

    return (
        <div className="relative w-full">
            <Button
                type="button"
                variant="outline"
                className="h-9 w-full justify-between bg-background text-xs font-normal"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedMember ? selectedMember.name : placeholder}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full animate-in rounded-md border bg-popover text-popover-foreground shadow-md fade-in-0 outline-none zoom-in-95">
                    <div className="flex h-9 items-center border-b px-3">
                        <Search className="mr-2 h-3 w-3 shrink-0 opacity-50" />
                        <input
                            className="flex w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cari nama..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-2 w-2" />
                            </Button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1 text-left">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className={`relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground ${value === member.id ? 'bg-accent' : ''}`}
                                onClick={() => {
                                    onSelect(member.id);
                                    setIsOpen(false);
                                }}
                            >
                                {member.name}
                            </div>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                Tidak ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function UserDashboard({ assignments }: { assignments: UserAssignment[] }) {
    const [decliningAssignment, setDecliningAssignment] =
        useState<UserAssignment | null>(null);
    const [declineReason, setDeclineReason] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const acceptAssignment = (assignment: UserAssignment) => {
        setProcessingId(assignment.id);
        router.post(
            `/dashboard/volunteer-assignments/${assignment.id}/accept`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const submitDecline = () => {
        if (!decliningAssignment) {
            return;
        }

        setProcessingId(decliningAssignment.id);
        router.post(
            `/dashboard/volunteer-assignments/${decliningAssignment.id}/decline`,
            { reason: declineReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDecliningAssignment(null);
                    setDeclineReason('');
                },
                onFinish: () => setProcessingId(null),
            },
        );
    };

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                <div>
                    <Badge
                        variant="outline"
                        className="mb-2 gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
                    >
                        <CalendarDays className="h-3 w-3 text-primary" />
                        Jadwal Pelayanan Saya
                    </Badge>
                    <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Lihat jadwal pelayananmu, respons penugasan, dan siapa
                        saja tim yang melayani di event yang sama.
                    </p>
                </div>

                {assignments.length === 0 ? (
                    <Card className="border bg-card shadow-sm">
                        <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
                            <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
                            <h2 className="mt-4 text-lg font-semibold text-foreground">
                                Belum ada jadwal pelayanan
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Jika kamu dijadwalkan menjadi volunteer di event
                                mendatang, detailnya akan muncul di dashboard
                                ini.
                            </p>
                            <Button asChild className="mt-6 gap-2">
                                <Link href="/my/scan">
                                    <QrCode className="h-4 w-4" />
                                    Absensi Mandiri
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {assignments.map((assignment) => {
                            const badge = getResponseBadge(
                                assignment.response_status,
                            );

                            return (
                                <Card
                                    key={assignment.id}
                                    className="overflow-hidden border bg-card shadow-sm"
                                >
                                    <CardHeader className="border-b px-6 py-5">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <CardTitle className="text-xl">
                                                        {assignment.event.title}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            badge.className
                                                        }
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="h-4 w-4" />
                                                        {formatEventDate(
                                                            assignment.event
                                                                .date ?? '',
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-4 w-4" />
                                                        {assignment.event
                                                            .time ?? '-'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4" />
                                                        {assignment.event
                                                            .location ?? '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            {assignment.response_status !==
                                                'accepted' &&
                                                assignment.response_status !==
                                                    'declined' && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            className="gap-2"
                                                            disabled={
                                                                processingId ===
                                                                assignment.id
                                                            }
                                                            onClick={() =>
                                                                acceptAssignment(
                                                                    assignment,
                                                                )
                                                            }
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Terima
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="gap-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                                                            disabled={
                                                                processingId ===
                                                                assignment.id
                                                            }
                                                            onClick={() =>
                                                                setDecliningAssignment(
                                                                    assignment,
                                                                )
                                                            }
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Tolak
                                                        </Button>
                                                    </div>
                                                )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="grid gap-6 p-6 xl:grid-cols-[320px_1fr]">
                                        <div className="rounded-lg border bg-muted/20 p-4">
                                            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                                Penugasan Kamu
                                            </p>
                                            <p className="mt-3 text-lg font-semibold text-foreground">
                                                {assignment.role_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {assignment.role_category}
                                            </p>

                                            {assignment.response_status ===
                                                'declined' &&
                                                assignment.response_reason && (
                                                    <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
                                                        <p className="font-semibold">
                                                            Alasan penolakan
                                                        </p>
                                                        <p className="mt-1">
                                                            {
                                                                assignment.response_reason
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                        </div>

                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-foreground">
                                                        Tim yang Dijadwalkan
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Semua volunteer di event
                                                        ini.
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-md"
                                                >
                                                    {assignment.team.length}{' '}
                                                    orang
                                                </Badge>
                                            </div>

                                            <div className="overflow-hidden rounded-lg border">
                                                <div className="divide-y divide-border/60">
                                                    {assignment.team.map(
                                                        (member) => {
                                                            const memberBadge =
                                                                getResponseBadge(
                                                                    member.response_status,
                                                                );

                                                            return (
                                                                <div
                                                                    key={
                                                                        member.id
                                                                    }
                                                                    className="grid gap-3 p-4 sm:grid-cols-[1fr_180px_110px] sm:items-center"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                            {member.name
                                                                                .slice(
                                                                                    0,
                                                                                    2,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-foreground">
                                                                                {
                                                                                    member.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {
                                                                                    member.role_category
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {
                                                                            member.role_name
                                                                        }
                                                                    </p>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            memberBadge.className
                                                                        }
                                                                    >
                                                                        {
                                                                            memberBadge.label
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog
                open={!!decliningAssignment}
                onOpenChange={(open) => {
                    if (!open) {
                        setDecliningAssignment(null);
                        setDeclineReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Jadwal Pelayanan</DialogTitle>
                        <DialogDescription>
                            Berikan alasan singkat agar admin bisa mengatur
                            ulang tim pelayanan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <label
                            htmlFor="decline-reason"
                            className="text-sm font-medium text-foreground"
                        >
                            Alasan
                        </label>
                        <textarea
                            id="decline-reason"
                            value={declineReason}
                            onChange={(event) =>
                                setDeclineReason(event.target.value)
                            }
                            rows={5}
                            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Contoh: Saya sedang bertugas di luar kota pada tanggal tersebut."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setDecliningAssignment(null);
                                setDeclineReason('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={
                                !declineReason.trim() ||
                                (decliningAssignment
                                    ? processingId === decliningAssignment.id
                                    : false)
                            }
                            onClick={submitDecline}
                        >
                            Kirim Penolakan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default function Dashboard({
    dashboard,
}: {
    dashboard?: DashboardData;
}) {
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string } };
    };
    const userRole = auth?.user?.role ?? 'jemaat';
    const stats = dashboard?.stats ?? emptyStats;
    const upcomingServices = dashboard?.upcoming_services ?? [];
    const adminAssignments = dashboard?.admin_assignments ?? [];
    const externalMembers = dashboard?.external_members ?? [];
    const readinessItems = dashboard?.readiness_items ?? [];
    const liveCheckIns = dashboard?.live_check_ins ?? [];
    const userAssignments = dashboard?.user_assignments ?? [];
    const planningTasks = buildPlanningTasks(stats);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [replacingAssignment, setReplacingAssignment] = useState<AdminAssignment | null>(null);
    const [selectedNewMember, setSelectedNewMember] = useState<string>('');

    const handleReplaceVolunteer = () => {
        if (!replacingAssignment || !selectedNewMember) return;

        setProcessingId(replacingAssignment.id);
        router.post(`/dashboard/volunteer-assignments/${replacingAssignment.id}/replace`, {
            member_id: selectedNewMember
        }, {
            onSuccess: () => {
                setReplacingAssignment(null);
                setSelectedNewMember('');
                setProcessingId(null);
            },
            onError: () => setProcessingId(null)
        });
    };

    const serviceStats = [
        {
            title: 'Event Aktif',
            value: String(stats.active_events),
            detail: `${stats.events_this_week} berlangsung minggu ini`,
            icon: CalendarDays,
            tone: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900',
        },
        {
            title: 'Check-in Hari Ini',
            value: String(stats.today_check_ins),
            detail: `${stats.attendance_rate}% dari target hadir`,
            icon: QrCode,
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
        },
        {
            title: 'Volunteer Terjadwal',
            value: String(stats.volunteer_scheduled),
            detail: `${stats.open_roles} posisi belum terisi`,
            icon: Users,
            tone: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
        },
        {
            title: 'Kesiapan Layanan',
            value: `${stats.service_readiness}%`,
            detail: 'Berdasarkan template role event',
            icon: ShieldCheck,
            tone: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900',
        },
    ];

    if (userRole !== 'admin') {
        return <UserDashboard assignments={userAssignments} />;
    }

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <Badge
                                variant="outline"
                                className="gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold tracking-widest uppercase"
                            >
                                <Radio className="h-3 w-3 text-emerald-500" />
                                Service Command Center
                            </Badge>
                        </div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Pantau kesiapan event, penugasan volunteer, dan
                            absensi jemaat dari satu tempat.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="gap-2">
                            <Link href="/categories">
                                <ClipboardList className="h-4 w-4" />
                                Template Role
                            </Link>
                        </Button>
                        <Button asChild className="gap-2">
                            <Link href="/events">
                                <CalendarDays className="h-4 w-4" />
                                Kelola Event
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {serviceStats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <Card
                                key={stat.title}
                                className="border bg-card shadow-sm"
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">
                                                {stat.title}
                                            </p>
                                            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                                                {stat.value}
                                            </p>
                                        </div>
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg border ${stat.tone}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                                        {stat.detail}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
                    <Card className="border bg-card shadow-sm">
                        <CardHeader className="border-b px-6 py-5">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg">
                                        Jadwal Layanan Mendatang
                                    </CardTitle>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Event terdekat dengan target hadir dan
                                        kesiapan volunteer.
                                    </p>
                                </div>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Link href="/events">
                                        Lihat semua
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {upcomingServices.length === 0 && (
                                    <div className="p-8 text-center">
                                        <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-3 text-sm font-medium text-foreground">
                                            Belum ada event mendatang
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Buat event baru untuk mulai menyusun
                                            jadwal layanan.
                                        </p>
                                    </div>
                                )}

                                {upcomingServices.map((event) => {
                                    const totalRoles =
                                        event.volunteers + event.openRoles;
                                    const volunteerPercent =
                                        totalRoles > 0
                                            ? Math.round(
                                                  (event.volunteers /
                                                      totalRoles) *
                                                      100,
                                              )
                                            : 100;

                                    return (
                                        <div
                                            key={event.title}
                                            className="grid gap-4 p-5 lg:grid-cols-[1fr_220px] lg:items-center"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="font-semibold text-foreground">
                                                        {event.title}
                                                    </h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className="rounded-md"
                                                    >
                                                        {event.category}
                                                    </Badge>
                                                    {event.openRoles > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
                                                        >
                                                            {event.openRoles}{' '}
                                                            role kosong
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                                                        >
                                                            Siap
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5">
                                                        <CalendarDays className="h-4 w-4" />
                                                        {formatEventDate(
                                                            event.date,
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-4 w-4" />
                                                        {event.time}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4" />
                                                        {event.location}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                                    <span>
                                                        Volunteer readiness
                                                    </span>
                                                    <span>
                                                        {volunteerPercent}%
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={volunteerPercent}
                                                />
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        {event.volunteers}{' '}
                                                        volunteer
                                                    </span>
                                                    <span>
                                                        {event.expected} target
                                                        hadir
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6">
                        <Card className="border bg-card shadow-sm">
                            <CardHeader className="border-b px-6 py-5">
                                <CardTitle className="text-lg">
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-3 p-5">
                                {quickActions.map((action) => {
                                    const Icon = action.icon;

                                    return (
                                        <Button
                                            key={action.title}
                                            asChild
                                            variant="outline"
                                            className="h-20 flex-col gap-2"
                                        >
                                            <Link href={action.href}>
                                                <Icon className="h-5 w-5" />
                                                <span>{action.title}</span>
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        <Card className="border bg-card shadow-sm">
                            <CardHeader className="border-b px-6 py-5">
                                <CardTitle className="text-lg">
                                    Yang Perlu Dicek
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                {planningTasks.map((task) => {
                                    const Icon = task.icon;

                                    return (
                                        <div
                                            key={task.title}
                                            className="flex gap-3"
                                        >
                                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Icon
                                                    className={`h-4 w-4 ${task.tone}`}
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {task.title}
                                                </p>
                                                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                                                    {task.detail}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="border bg-card shadow-sm">
                        <CardHeader className="border-b px-6 py-5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">
                                Penjadwalan Volunteer
                            </CardTitle>
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {adminAssignments.length === 0 && (
                                    <div className="p-8 text-center">
                                        <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-3 text-sm font-medium text-foreground">
                                            Belum ada volunteer dijadwalkan
                                        </p>
                                    </div>
                                )}
                                {adminAssignments.map((assignment) => {
                                    const badge = getResponseBadge(assignment.response_status);
                                    return (
                                        <div key={assignment.id} className="p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-sm text-foreground truncate">
                                                            {assignment.member_name}
                                                        </span>
                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badge.className}`}>
                                                            {badge.label}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground font-medium">
                                                        {assignment.role_category} &bull; {assignment.role_name}
                                                    </div>
                                                    <div className="mt-1 text-[11px] text-primary/80 font-semibold truncate">
                                                        {assignment.event.title} ({formatEventDate(assignment.event.date)})
                                                    </div>
                                                    {assignment.response_status === 'declined' && (
                                                        <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
                                                            <span className="font-bold uppercase text-[9px] block mb-0.5">Alasan Penolakan:</span>
                                                            {assignment.response_reason || 'Tidak ada alasan.'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="shrink-0">
                                                    {(assignment.response_status === 'declined' || assignment.response_status === 'pending') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 text-[11px] gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
                                                            onClick={() => {
                                                                setReplacingAssignment(assignment);
                                                                setSelectedNewMember('');
                                                            }}
                                                        >
                                                            <RotateCcw className="h-3 w-3" />
                                                            Ganti
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm">
                        <CardHeader className="border-b px-6 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Kesiapan Departemen
                                </CardTitle>
                                <Sparkles className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6">
                            {readinessItems.length === 0 && (
                                <div className="py-8 text-center">
                                    <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                    <p className="mt-3 text-sm font-medium text-foreground">
                                        Belum ada template role
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Tambahkan kategori event dan role
                                        departemen untuk melihat kesiapan.
                                    </p>
                                </div>
                            )}

                            {readinessItems.map((item) => {
                                const percent = Math.round(
                                    (item.filled / item.total) * 100,
                                );

                                return (
                                    <div key={item.label} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-foreground">
                                                {item.label}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {item.filled}/{item.total}{' '}
                                                terisi
                                            </span>
                                        </div>
                                        <ProgressBar value={percent} />
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm">
                        <CardHeader className="border-b px-6 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    Live Check-in
                                </CardTitle>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1"
                                >
                                    <Link href="/attendance-history">
                                        Riwayat
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {liveCheckIns.length === 0 && (
                                    <div className="p-8 text-center">
                                        <QrCode className="mx-auto h-10 w-10 text-muted-foreground/40" />
                                        <p className="mt-3 text-sm font-medium text-foreground">
                                            Belum ada check-in terbaru
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Scan absensi akan muncul di sini
                                            setelah jemaat hadir.
                                        </p>
                                    </div>
                                )}

                                {liveCheckIns.map((checkIn) => (
                                    <div
                                        key={`${checkIn.name}-${checkIn.time}`}
                                        className="flex items-center justify-between gap-4 p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                {checkIn.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {checkIn.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {checkIn.event}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {checkIn.time}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    checkIn.status === 'Present'
                                                        ? 'rounded-md border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                                                        : 'rounded-md border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
                                                }
                                            >
                                                {checkIn.status ===
                                                'Present' ? (
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                ) : (
                                                    <Clock className="mr-1 h-3 w-3" />
                                                )}
                                                {checkIn.status === 'Present'
                                                    ? 'Hadir'
                                                    : 'Terlambat'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Replace Volunteer Modal */}
            <Dialog open={!!replacingAssignment} onOpenChange={(open) => !open && setReplacingAssignment(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Ganti Volunteer</DialogTitle>
                        <DialogDescription>
                            Pilih jemaat pengganti untuk peran <strong>{replacingAssignment?.role_name}</strong> di event <strong>{replacingAssignment?.event.title}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Pilih Jemaat Baru</label>
                            <SearchableSelect
                                value={selectedNewMember}
                                onSelect={setSelectedNewMember}
                                external_members={externalMembers}
                            />
                        </div>

                        {replacingAssignment?.response_status === 'declined' && (
                            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                                <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1">Alasan Penolakan Sebelumnya:</span>
                                <p className="text-xs text-rose-600 italic">"{replacingAssignment.response_reason}"</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplacingAssignment(null)}>Batal</Button>
                        <Button
                            disabled={!selectedNewMember || processingId === replacingAssignment?.id}
                            onClick={handleReplaceVolunteer}
                        >
                            Konfirmasi Ganti
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
