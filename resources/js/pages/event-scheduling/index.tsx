import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    ClipboardList,
    Clock3,
    MapPin,
    Search,
    ShieldCheck,
    UserRound,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
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

interface Department {
    id: number;
    name: string;
}

interface CategoryRole {
    id: number;
    role_name: string;
    department: Department;
}

interface Category {
    id: number;
    name: string;
    roles: CategoryRole[];
}

interface Member {
    idjemaat: string;
    namalengkap: string;
    email?: string | null;
}

interface Volunteer {
    id: number;
    member_id: string | number;
    role_category: string;
    role_name: string;
    member?: Member | null;
}

interface Event {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    category: string;
    volunteers: Volunteer[];
}

interface DepartmentGroup {
    department: Department;
    roles: CategoryRole[];
}

function formatEventDate(date: string | null): string {
    if (!date) {
        return 'Tanggal belum ditentukan';
    }

    const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(parsedDate);
}

function createAssignments(event: Event, roles: CategoryRole[]) {
    const usedRoleIds = new Set<number>();
    const assignments: Record<number, string> = {};

    event.volunteers.forEach((volunteer) => {
        const matchingRole = roles.find(
            (role) =>
                !usedRoleIds.has(role.id) &&
                role.department.name === volunteer.role_category &&
                role.role_name === volunteer.role_name,
        );

        if (matchingRole) {
            usedRoleIds.add(matchingRole.id);
            assignments[matchingRole.id] = String(volunteer.member_id);
        }
    });

    return assignments;
}

export default function EventScheduling({
    events = [],
    categories = [],
    external_members = [],
    can_manage_events = false,
    authorized_department_ids = [],
}: {
    events: Event[];
    categories: Category[];
    external_members: Member[];
    can_manage_events: boolean;
    authorized_department_ids: number[];
}) {
    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const [eventSearch, setEventSearch] = useState('');
    const [assignments, setAssignments] = useState<Record<number, string>>({});
    const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
    const [memberQueries, setMemberQueries] = useState<Record<number, string>>(
        {},
    );
    const [processing, setProcessing] = useState(false);
    const authorizedDepartments = useMemo(
        () => new Set(authorized_department_ids),
        [authorized_department_ids],
    );
    const visibleEvents = useMemo(() => {
        const query = eventSearch.trim().toLocaleLowerCase();

        return events.filter(
            (event) =>
                !query ||
                event.title.toLocaleLowerCase().includes(query) ||
                event.category.toLocaleLowerCase().includes(query),
        );
    }, [eventSearch, events]);
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    const selectedCategory = categories.find(
        (category) => category.name === selectedEvent?.category,
    );
    const eventRoles = useMemo(
        () => selectedCategory?.roles ?? [],
        [selectedCategory],
    );
    const departmentGroups = useMemo(() => {
        const groups = new Map<number, DepartmentGroup>();

        eventRoles.forEach((role) => {
            const current = groups.get(role.department.id);

            if (current) {
                current.roles.push(role);
            } else {
                groups.set(role.department.id, {
                    department: role.department,
                    roles: [role],
                });
            }
        });

        return Array.from(groups.values()).sort((first, second) =>
            first.department.name.localeCompare(second.department.name),
        );
    }, [eventRoles]);
    const scheduledCount = Object.values(assignments).filter(Boolean).length;
    const allowedRolesCount = eventRoles.filter(
        (role) =>
            can_manage_events || authorizedDepartments.has(role.department.id),
    ).length;

    const selectEvent = (eventId: string) => {
        const event = events.find((item) => item.id === Number(eventId));

        setSelectedEventId(event?.id ?? null);
        setAssignments(
            event
                ? createAssignments(
                      event,
                      categories.find(
                          (category) => category.name === event.category,
                      )?.roles ?? [],
                  )
                : {},
        );
        setEventSearch('');
        setMemberQueries({});
        setActiveRoleId(null);
    };

    const setRoleMember = (roleId: number, memberId: string) => {
        setAssignments((current) => ({ ...current, [roleId]: memberId }));
        setMemberQueries((current) => ({ ...current, [roleId]: '' }));
        setActiveRoleId(null);
    };

    const clearRoleMember = (roleId: number) => {
        setAssignments((current) => {
            const next = { ...current };
            delete next[roleId];

            return next;
        });
        setMemberQueries((current) => ({ ...current, [roleId]: '' }));
    };

    const saveSchedule = (event: React.FormEvent) => {
        event.preventDefault();

        if (!selectedEvent) {
            toast.error('Pilih event sebelum menyimpan penjadwalan.');

            return;
        }

        const allowedRoleIds = new Set(
            eventRoles
                .filter(
                    (role) =>
                        can_manage_events ||
                        authorizedDepartments.has(role.department.id),
                )
                .map((role) => role.id),
        );
        const schedule = eventRoles
            .filter(
                (role) => allowedRoleIds.has(role.id) && assignments[role.id],
            )
            .map((role) => ({
                member_id: assignments[role.id],
                role_category: role.department.name,
                role_name: role.role_name,
            }));

        router.post(
            `/events/${selectedEvent.id}/volunteers`,
            { volunteers: JSON.stringify(schedule) },
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onSuccess: () =>
                    toast.success('Penjadwalan event berhasil disimpan.'),
                onError: (errors) => {
                    const message = Object.values(errors)[0];
                    toast.error(
                        typeof message === 'string'
                            ? message
                            : 'Penjadwalan gagal disimpan. Periksa kembali akses dan data anggota.',
                    );
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="w-full min-w-0 space-y-7 px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
            <Head title="Penjadwalan Event" />
            <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.12] via-card to-card p-5 shadow-sm sm:p-7 lg:p-9">
                <div className="absolute -top-24 -right-10 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                        <ClipboardList className="size-7" />
                    </div>
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                            Pengaturan Pelayanan
                        </p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                            Penjadwalan Event
                        </h1>
                        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Pilih event untuk melihat kebutuhan pelayanan setiap
                            departemen, lalu tetapkan anggota pada posisi sesuai
                            perannya.
                        </p>
                    </div>
                </div>
            </header>

            <Card className="w-full overflow-visible rounded-3xl border-border/70 shadow-sm">
                <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-5 sm:px-7">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CalendarDays className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">
                                Pilih Event
                            </CardTitle>
                            <CardDescription>
                                Jadwal departemen akan muncul setelah event
                                dipilih.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(20rem,1.2fr)] lg:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="event-search">
                            Cari event berdasarkan nama atau kategori
                        </Label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="event-search"
                                type="search"
                                autoComplete="off"
                                placeholder="Contoh: Ibadah Minggu..."
                                value={eventSearch}
                                onChange={(inputEvent) =>
                                    setEventSearch(inputEvent.target.value)
                                }
                                className="h-11 bg-background pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="event-select">Event</Label>
                        <Select
                            value={selectedEventId?.toString() ?? ''}
                            onValueChange={selectEvent}
                        >
                            <SelectTrigger id="event-select" className="h-11">
                                <SelectValue placeholder="Pilih event untuk mulai menjadwalkan" />
                            </SelectTrigger>
                            <SelectContent>
                                {visibleEvents.map((event) => (
                                    <SelectItem
                                        key={event.id}
                                        value={event.id.toString()}
                                    >
                                        {event.title} — {event.category} —{' '}
                                        {formatEventDate(event.date)}
                                    </SelectItem>
                                ))}
                                {visibleEvents.length === 0 && (
                                    <SelectItem value="no-events" disabled>
                                        Tidak ada event yang cocok.
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {!selectedEvent && (
                <Card className="w-full rounded-3xl border-dashed bg-muted/10 shadow-none">
                    <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CalendarDays className="size-7" />
                        </div>
                        <h2 className="mt-5 text-lg font-bold">
                            Pilih event untuk melihat jadwal
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                            Setelah event dipilih, daftar departemen dan posisi
                            pelayanan yang sesuai dengan kategori event akan
                            ditampilkan di sini.
                        </p>
                    </CardContent>
                </Card>
            )}

            {selectedEvent && (
                <form onSubmit={saveSchedule} className="space-y-6">
                    <Card className="w-full overflow-hidden rounded-3xl border-primary/15 shadow-sm">
                        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary">
                                        {selectedEvent.category}
                                    </Badge>
                                    <Badge variant="outline">
                                        {scheduledCount} dari{' '}
                                        {eventRoles.length} posisi terisi
                                    </Badge>
                                </div>
                                <h2 className="mt-3 text-2xl font-black tracking-tight">
                                    {selectedEvent.title}
                                </h2>
                                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays className="size-4 text-primary" />
                                        {formatEventDate(selectedEvent.date)}
                                    </span>
                                    {selectedEvent.time && (
                                        <span className="inline-flex items-center gap-2">
                                            <Clock3 className="size-4 text-primary" />
                                            {selectedEvent.time.slice(0, 5)}
                                        </span>
                                    )}
                                    {selectedEvent.location && (
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin className="size-4 text-primary" />
                                            {selectedEvent.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-muted/20 px-4 py-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xl font-black">
                                        {eventRoles.length}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        posisi pelayanan
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {!selectedCategory && (
                        <Card className="w-full rounded-3xl border-amber-500/30 bg-amber-500/[0.04] shadow-none">
                            <CardContent className="p-6 text-sm text-muted-foreground">
                                Belum ada kategori yang cocok untuk event ini,
                                sehingga daftar posisi pelayanan belum tersedia.
                            </CardContent>
                        </Card>
                    )}

                    {selectedCategory && departmentGroups.length === 0 && (
                        <Card className="w-full rounded-3xl border-dashed bg-muted/10 shadow-none">
                            <CardContent className="p-8 text-center">
                                <ShieldCheck className="mx-auto size-8 text-muted-foreground/60" />
                                <h3 className="mt-3 font-bold">
                                    Belum ada posisi pelayanan
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Belum ada role departemen yang diatur untuk
                                    kategori {selectedCategory.name}.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {departmentGroups.map((group) => {
                        const groupAssigned = group.roles.filter(
                            (role) => assignments[role.id],
                        ).length;
                        const canScheduleDepartment =
                            can_manage_events ||
                            authorizedDepartments.has(group.department.id);

                        return (
                            <Card
                                key={group.department.id}
                                className="w-full overflow-visible rounded-3xl border-border/70 shadow-sm"
                            >
                                <CardHeader className="border-b border-border/60 bg-muted/15 px-5 py-4 sm:px-7">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <Users className="size-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold">
                                                    {group.department.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {group.roles.length} posisi
                                                    pelayanan
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!canScheduleDepartment && (
                                                <Badge variant="outline">
                                                    Hanya lihat
                                                </Badge>
                                            )}
                                            <Badge
                                                variant={
                                                    groupAssigned ===
                                                    group.roles.length
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {groupAssigned}/
                                                {group.roles.length} terisi
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 p-4 sm:p-6">
                                    {group.roles.map((role, index) => {
                                        const selectedMember =
                                            external_members.find(
                                                (member) =>
                                                    member.idjemaat ===
                                                    assignments[role.id],
                                            );
                                        const searchQuery = (
                                            memberQueries[role.id] ?? ''
                                        )
                                            .trim()
                                            .toLocaleLowerCase();
                                        const memberOptions = external_members
                                            .filter((member) => {
                                                const name =
                                                    member.namalengkap.toLocaleLowerCase();
                                                const email =
                                                    member.email?.toLocaleLowerCase() ??
                                                    '';

                                                return (
                                                    !searchQuery ||
                                                    name.includes(
                                                        searchQuery,
                                                    ) ||
                                                    email.includes(
                                                        searchQuery,
                                                    ) ||
                                                    member.idjemaat.includes(
                                                        searchQuery,
                                                    )
                                                );
                                            })
                                            .slice(0, 8);
                                        const showSuggestions =
                                            activeRoleId === role.id &&
                                            canScheduleDepartment;

                                        return (
                                            <div
                                                key={role.id}
                                                className="grid gap-3 rounded-2xl border bg-background p-4 sm:grid-cols-[minmax(0,0.85fr)_minmax(16rem,1.15fr)] sm:items-center sm:px-5"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                                                        {String(
                                                            index + 1,
                                                        ).padStart(2, '0')}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold">
                                                            {role.role_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Posisi pelayanan
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div className="relative">
                                                        <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            type="search"
                                                            autoComplete="off"
                                                            disabled={
                                                                !canScheduleDepartment
                                                            }
                                                            aria-label={`Cari anggota untuk posisi ${role.role_name} di ${group.department.name}`}
                                                            placeholder={
                                                                canScheduleDepartment
                                                                    ? 'Cari nama, email, atau ID anggota...'
                                                                    : 'Anda tidak memiliki akses untuk mengubah posisi ini'
                                                            }
                                                            value={
                                                                showSuggestions
                                                                    ? (memberQueries[
                                                                          role
                                                                              .id
                                                                      ] ?? '')
                                                                    : (selectedMember?.namalengkap ??
                                                                      (assignments[
                                                                          role
                                                                              .id
                                                                      ]
                                                                          ? `Anggota #${assignments[role.id]}`
                                                                          : ''))
                                                            }
                                                            onFocus={() => {
                                                                setActiveRoleId(
                                                                    role.id,
                                                                );
                                                                setMemberQueries(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [role.id]:
                                                                            '',
                                                                    }),
                                                                );
                                                            }}
                                                            onChange={(
                                                                inputEvent,
                                                            ) =>
                                                                setMemberQueries(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [role.id]:
                                                                            inputEvent
                                                                                .target
                                                                                .value,
                                                                    }),
                                                                )
                                                            }
                                                            onKeyDown={(
                                                                keyEvent,
                                                            ) => {
                                                                if (
                                                                    keyEvent.key ===
                                                                        'Enter' &&
                                                                    memberOptions[0]
                                                                ) {
                                                                    keyEvent.preventDefault();
                                                                    setRoleMember(
                                                                        role.id,
                                                                        memberOptions[0]
                                                                            .idjemaat,
                                                                    );
                                                                }

                                                                if (
                                                                    keyEvent.key ===
                                                                    'Escape'
                                                                ) {
                                                                    setActiveRoleId(
                                                                        null,
                                                                    );
                                                                }
                                                            }}
                                                            onBlur={() =>
                                                                setActiveRoleId(
                                                                    (
                                                                        current,
                                                                    ) =>
                                                                        current ===
                                                                        role.id
                                                                            ? null
                                                                            : current,
                                                                )
                                                            }
                                                            className="h-11 bg-background pr-10 pl-9"
                                                        />
                                                        {selectedMember &&
                                                            canScheduleDepartment && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label={`Hapus penugasan ${selectedMember.namalengkap} dari ${role.role_name}`}
                                                                    className="absolute top-1/2 right-1 size-8 -translate-y-1/2 text-muted-foreground"
                                                                    onClick={() =>
                                                                        clearRoleMember(
                                                                            role.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <X className="size-4" />
                                                                </Button>
                                                            )}
                                                    </div>
                                                    {showSuggestions && (
                                                        <div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
                                                            {memberOptions.map(
                                                                (member) => (
                                                                    <button
                                                                        key={
                                                                            member.idjemaat
                                                                        }
                                                                        type="button"
                                                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left hover:bg-accent"
                                                                        onMouseDown={(
                                                                            mouseEvent,
                                                                        ) =>
                                                                            mouseEvent.preventDefault()
                                                                        }
                                                                        onClick={() =>
                                                                            setRoleMember(
                                                                                role.id,
                                                                                member.idjemaat,
                                                                            )
                                                                        }
                                                                    >
                                                                        <span className="min-w-0">
                                                                            <span className="block truncate text-sm font-medium">
                                                                                {
                                                                                    member.namalengkap
                                                                                }
                                                                            </span>
                                                                            <span className="block truncate text-xs text-muted-foreground">
                                                                                {member.email ||
                                                                                    `ID ${member.idjemaat}`}
                                                                            </span>
                                                                        </span>
                                                                        {assignments[
                                                                            role
                                                                                .id
                                                                        ] ===
                                                                            member.idjemaat && (
                                                                            <Check className="size-4 shrink-0 text-primary" />
                                                                        )}
                                                                    </button>
                                                                ),
                                                            )}
                                                            {memberOptions.length ===
                                                                0 &&
                                                                external_members.length >
                                                                    0 && (
                                                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                                        Tidak
                                                                        ada
                                                                        anggota
                                                                        yang
                                                                        cocok.
                                                                    </p>
                                                                )}
                                                            {external_members.length ===
                                                                0 && (
                                                                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                                    Data anggota
                                                                    belum
                                                                    tersedia.
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {selectedCategory && eventRoles.length > 0 && (
                        <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <p className="text-sm text-muted-foreground">
                                {scheduledCount} posisi terisi dari{' '}
                                {eventRoles.length}. Bagian tanpa izin hanya
                                dapat dilihat.
                            </p>
                            <Button
                                type="submit"
                                disabled={processing || allowedRolesCount === 0}
                                className="h-11 gap-2 px-6"
                            >
                                <Check className="size-4" />
                                {processing
                                    ? 'Menyimpan jadwal...'
                                    : 'Simpan Penjadwalan'}
                            </Button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
