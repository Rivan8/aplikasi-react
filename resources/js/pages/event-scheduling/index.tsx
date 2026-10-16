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
import { useMemo, useRef, useState } from 'react';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Department {
    id: number;
    name: string;
    sort_order?: number;
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
    foto_url?: string | null;
}

interface Volunteer {
    id: number;
    member_id: string | number;
    role_category: string;
    role_name: string;
    response_status?: string | null;
    response_reason?: string | null;
    member?: Member | null;
}

const RESPONSE_STATUS_META: Record<
    string,
    { label: string; badgeClass: string }
> = {
    pending: {
        label: 'Menunggu Konfirmasi',
        badgeClass: 'border-amber-300 bg-amber-100 text-amber-800',
    },
    accepted: {
        label: 'Confirm',
        badgeClass: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    },
    declined: {
        label: 'Decline',
        badgeClass: 'border-red-300 bg-red-100 text-red-800',
    },
};

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
    const [dragOverRoleId, setDragOverRoleId] = useState<number | null>(null);
    const [departmentOrder, setDepartmentOrder] = useState<number[] | null>(
        null,
    );
    const [columnDragOverId, setColumnDragOverId] = useState<number | null>(
        null,
    );
    const dragSourceRef = useRef<{
        roleId: number;
        departmentId: number;
    } | null>(null);
    const columnDragRef = useRef<number | null>(null);
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
    const todayString = new Date().toLocaleDateString('en-CA');
    const upcomingEvents = useMemo(
        () =>
            visibleEvents
                .filter(
                    (event) =>
                        !event.date || event.date.slice(0, 10) >= todayString,
                )
                .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
        [visibleEvents, todayString],
    );
    const pastEvents = useMemo(
        () =>
            visibleEvents
                .filter(
                    (event) =>
                        !!event.date && event.date.slice(0, 10) < todayString,
                )
                .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
        [visibleEvents, todayString],
    );
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

        return Array.from(groups.values()).sort((first, second) => {
            const orderDiff =
                (first.department.sort_order ?? 0) -
                (second.department.sort_order ?? 0);

            if (orderDiff !== 0) {
                return orderDiff;
            }

            return first.department.name.localeCompare(second.department.name);
        });
    }, [eventRoles]);
    const orderedDepartmentGroups = useMemo(() => {
        if (!departmentOrder) {
            return departmentGroups;
        }

        const groupsById = new Map(
            departmentGroups.map((group) => [group.department.id, group]),
        );
        const ordered = departmentOrder
            .map((id) => groupsById.get(id))
            .filter((group) => group !== undefined);
        const missing = departmentGroups.filter(
            (group) => !departmentOrder.includes(group.department.id),
        );

        return [...ordered, ...missing];
    }, [departmentGroups, departmentOrder]);
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
        setDepartmentOrder(null);
        setColumnDragOverId(null);
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

    const handleColumnDragStart = (
        columnDragEvent: React.DragEvent<HTMLDivElement>,
        departmentId: number,
    ) => {
        if (dragSourceRef.current) {
            return;
        }

        columnDragRef.current = departmentId;
        columnDragEvent.dataTransfer.effectAllowed = 'move';
        columnDragEvent.dataTransfer.setData('text/plain', 'department');
    };

    const handleColumnDragEnd = () => {
        columnDragRef.current = null;
        setColumnDragOverId(null);
    };

    const handleColumnDragOver = (
        columnDragEvent: React.DragEvent<HTMLDivElement>,
        departmentId: number,
    ) => {
        if (!columnDragRef.current || columnDragRef.current === departmentId) {
            return;
        }

        columnDragEvent.preventDefault();
        columnDragEvent.dataTransfer.dropEffect = 'move';

        if (columnDragOverId !== departmentId) {
            setColumnDragOverId(departmentId);
        }
    };

    const handleColumnDragLeave = (departmentId: number) => {
        if (columnDragOverId === departmentId) {
            setColumnDragOverId(null);
        }
    };

    const handleColumnDrop = (
        columnDragEvent: React.DragEvent<HTMLDivElement>,
        departmentId: number,
    ) => {
        columnDragEvent.preventDefault();

        const sourceId = columnDragRef.current;

        columnDragRef.current = null;
        setColumnDragOverId(null);

        if (!sourceId || sourceId === departmentId) {
            return;
        }

        const base =
            departmentOrder ??
            departmentGroups.map((group) => group.department.id);
        const from = base.indexOf(sourceId);
        const to = base.indexOf(departmentId);

        if (from === -1 || to === -1) {
            return;
        }

        const next = [...base];

        next.splice(from, 1);
        next.splice(to, 0, sourceId);
        setDepartmentOrder(next);

        if (can_manage_events) {
            router.post(
                '/event-scheduling/department-order',
                { order: next },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onError: () => {
                        toast.error('Urutan papan gagal disimpan.');
                    },
                },
            );
        }
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
                                {upcomingEvents.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="text-[11px] font-bold tracking-[0.08em] uppercase">
                                            Akan Datang (
                                            {upcomingEvents.length})
                                        </SelectLabel>
                                        {upcomingEvents.map((event) => (
                                            <SelectItem
                                                key={event.id}
                                                value={event.id.toString()}
                                            >
                                                <span>
                                                    <span className="mr-1.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-500" />
                                                    {event.title} —{' '}
                                                    {event.category} —{' '}
                                                    {formatEventDate(
                                                        event.date,
                                                    )}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {pastEvents.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel className="text-[11px] font-bold tracking-[0.08em] uppercase">
                                            Sudah Lewat ({pastEvents.length})
                                        </SelectLabel>
                                        {pastEvents.map((event) => (
                                            <SelectItem
                                                key={event.id}
                                                value={event.id.toString()}
                                                className="text-muted-foreground"
                                            >
                                                <span>
                                                    <span className="mr-1.5 inline-block size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                                                    {event.title} —{' '}
                                                    {event.category} —{' '}
                                                    {formatEventDate(
                                                        event.date,
                                                    )}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
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
                            Setelah event dipilih, papan departemen dan posisi
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

                    {departmentGroups.length > 0 && (
                        <div className="flex items-start gap-4 overflow-x-auto pb-4">
                            {orderedDepartmentGroups.map((group) => {
                                const groupAssigned = group.roles.filter(
                                    (role) => assignments[role.id],
                                ).length;
                                const canScheduleDepartment =
                                    can_manage_events ||
                                    authorizedDepartments.has(
                                        group.department.id,
                                    );
                                const isGroupComplete =
                                    groupAssigned === group.roles.length;

                                return (
                                    <div
                                        key={group.department.id}
                                        draggable
                                        title="Tarik untuk memindahkan urutan papan"
                                        onDragStart={(dragEvent) =>
                                            handleColumnDragStart(
                                                dragEvent,
                                                group.department.id,
                                            )
                                        }
                                        onDragEnd={handleColumnDragEnd}
                                        onDragOver={(dragEvent) =>
                                            handleColumnDragOver(
                                                dragEvent,
                                                group.department.id,
                                            )
                                        }
                                        onDragLeave={() =>
                                            handleColumnDragLeave(
                                                group.department.id,
                                            )
                                        }
                                        onDrop={(dragEvent) =>
                                            handleColumnDrop(
                                                dragEvent,
                                                group.department.id,
                                            )
                                        }
                                        className={cn(
                                            'flex w-80 shrink-0 flex-col rounded-2xl border bg-muted/20 p-3',
                                            columnDragOverId ===
                                                group.department.id &&
                                                'border-primary ring-2 ring-primary/40',
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2 px-1 pb-3">
                                            <span className="flex min-w-0 cursor-grab items-center gap-2 text-sm font-bold active:cursor-grabbing">
                                                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Users className="size-4" />
                                                </span>
                                                <span className="truncate">
                                                    {group.department.name}
                                                </span>
                                            </span>
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                {!canScheduleDepartment && (
                                                    <Badge variant="outline">
                                                        Hanya lihat
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={
                                                        isGroupComplete
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {groupAssigned}/
                                                    {group.roles.length} terisi
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            {group.roles.map((role) => {
                                                const selectedMember =
                                                    external_members.find(
                                                        (member) =>
                                                            member.idjemaat ===
                                                            assignments[
                                                                role.id
                                                            ],
                                                    );
                                                const isEditing =
                                                    activeRoleId === role.id &&
                                                    canScheduleDepartment;
                                                const searchQuery = (
                                                    memberQueries[role.id] ?? ''
                                                )
                                                    .trim()
                                                    .toLocaleLowerCase();
                                                const memberOptions = isEditing
                                                    ? external_members
                                                          .filter(
                                                              (member) => {
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
                                                              },
                                                          )
                                                          .slice(0, 8)
                                                    : [];
                                                const assignedLabel =
                                                    selectedMember?.namalengkap ??
                                                    (assignments[role.id]
                                                        ? `Anggota #${assignments[role.id]}`
                                                        : null);
                                                const assignedSub =
                                                    selectedMember
                                                        ? selectedMember.email ||
                                                          `ID ${selectedMember.idjemaat}`
                                                        : null;
                                                const initial =
                                                    assignedLabel
                                                        ?.trim()
                                                        .charAt(0)
                                                        .toLocaleUpperCase() ??
                                                    '?';
                                                const volunteerAssignment =
                                                    selectedEvent?.volunteers.find(
                                                        (volunteer) =>
                                                            volunteer.role_category ===
                                                                group
                                                                    .department
                                                                    .name &&
                                                            volunteer.role_name ===
                                                                role.role_name &&
                                                            String(
                                                                volunteer.member_id,
                                                            ) ===
                                                                String(
                                                                    assignments[
                                                                        role.id
                                                                    ],
                                                                ),
                                                    );
                                                const responseStatus =
                                                    volunteerAssignment?.response_status ??
                                                    'pending';
                                                const statusMeta =
                                                    RESPONSE_STATUS_META[
                                                        responseStatus
                                                    ] ??
                                                    RESPONSE_STATUS_META
                                                        .pending;
                                                const declineReason =
                                                    responseStatus === 'declined'
                                                        ? (volunteerAssignment?.response_reason ??
                                                          null)
                                                        : null;
                                                const handleMemberDragStart = (
                                                    dragEvent: React.DragEvent<HTMLDivElement>,
                                                ) => {
                                                    dragSourceRef.current = {
                                                        roleId: role.id,
                                                        departmentId:
                                                            group.department
                                                                .id,
                                                    };
                                                    dragEvent.dataTransfer.effectAllowed =
                                                        'move';
                                                    dragEvent.dataTransfer.setData(
                                                        'text/plain',
                                                        assignedLabel ?? '',
                                                    );
                                                };
                                                const handleMemberDragEnd =
                                                    () => {
                                                        dragSourceRef.current =
                                                            null;
                                                        setDragOverRoleId(
                                                            null,
                                                        );
                                                    };
                                                const handleCardDragOver = (
                                                    dragEvent: React.DragEvent<HTMLDivElement>,
                                                ) => {
                                                    const source =
                                                        dragSourceRef.current;

                                                    if (
                                                        !source ||
                                                        !canScheduleDepartment ||
                                                        source.departmentId !==
                                                            group.department.id
                                                    ) {
                                                        return;
                                                    }

                                                    dragEvent.preventDefault();
                                                    dragEvent.dataTransfer.dropEffect =
                                                        'move';

                                                    if (
                                                        dragOverRoleId !==
                                                        role.id
                                                    ) {
                                                        setDragOverRoleId(
                                                            role.id,
                                                        );
                                                    }
                                                };
                                                const handleCardDragLeave =
                                                    () => {
                                                        if (
                                                            dragOverRoleId ===
                                                            role.id
                                                        ) {
                                                            setDragOverRoleId(
                                                                null,
                                                            );
                                                        }
                                                    };
                                                const handleCardDrop = (
                                                    dragEvent: React.DragEvent<HTMLDivElement>,
                                                ) => {
                                                    dragEvent.preventDefault();

                                                    const source =
                                                        dragSourceRef.current;

                                                    dragSourceRef.current = null;
                                                    setDragOverRoleId(null);

                                                    if (
                                                        !source ||
                                                        source.roleId ===
                                                            role.id ||
                                                        !canScheduleDepartment ||
                                                        source.departmentId !==
                                                            group.department.id
                                                    ) {
                                                        return;
                                                    }

                                                    const draggedMember =
                                                        assignments[
                                                            source.roleId
                                                        ];

                                                    if (!draggedMember) {
                                                        return;
                                                    }

                                                    setAssignments(
                                                        (current) => {
                                                            const next = {
                                                                ...current,
                                                            };
                                                            const targetMember =
                                                                next[role.id];

                                                            if (
                                                                targetMember
                                                            ) {
                                                                next[
                                                                    source.roleId
                                                                ] =
                                                                    targetMember;
                                                            } else {
                                                                delete next[
                                                                    source.roleId
                                                                ];
                                                            }

                                                            next[role.id] =
                                                                draggedMember;

                                                            return next;
                                                        },
                                                    );
                                                };

                                                return (
                                                    <div
                                                        key={role.id}
                                                        onClick={() => {
                                                            if (
                                                                !canScheduleDepartment
                                                            ) {
                                                                return;
                                                            }

                                                            setActiveRoleId(
                                                                role.id,
                                                            );
                                                            setMemberQueries(
                                                                (current) => ({
                                                                    ...current,
                                                                    [role.id]:
                                                                        '',
                                                                }),
                                                            );
                                                        }}
                                                        className={cn(
                                                            'rounded-2xl border bg-background p-3 shadow-sm transition',
                                                            canScheduleDepartment &&
                                                                'cursor-pointer hover:border-primary/60 hover:shadow-md',
                                                            isEditing &&
                                                                'border-primary ring-2 ring-primary/20',
                                                            dragOverRoleId ===
                                                                role.id &&
                                                                'border-primary ring-2 ring-primary/40',
                                                        )}
                                                        onDragOver={
                                                            handleCardDragOver
                                                        }
                                                        onDragLeave={
                                                            handleCardDragLeave
                                                        }
                                                        onDrop={handleCardDrop}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                                {role.role_name}
                                                            </p>
                                                            {assignedLabel && (
                                                                <span
                                                                    title={
                                                                        declineReason
                                                                            ? `Alasan: ${declineReason}`
                                                                            : undefined
                                                                    }
                                                                    className={cn(
                                                                        'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold',
                                                                        statusMeta.badgeClass,
                                                                    )}
                                                                >
                                                                    {
                                                                        statusMeta.label
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        {assignedLabel ? (
                                                            <div
                                                                className={cn(
                                                                    'mt-2 flex items-center gap-2.5',
                                                                    canScheduleDepartment &&
                                                                        'cursor-grab active:cursor-grabbing',
                                                                )}
                                                                draggable={
                                                                    canScheduleDepartment
                                                                }
                                                                onDragStart={
                                                                    handleMemberDragStart
                                                                }
                                                                onDragEnd={
                                                                    handleMemberDragEnd
                                                                }
                                                                title={
                                                                    canScheduleDepartment
                                                                        ? 'Tarik untuk memindahkan ke posisi lain'
                                                                        : undefined
                                                                }
                                                            >
                                                                <Avatar className="size-9 border">
                                                                    {selectedMember?.foto_url && (
                                                                        <AvatarImage
                                                                            src={
                                                                                selectedMember.foto_url
                                                                            }
                                                                            alt={
                                                                                assignedLabel
                                                                            }
                                                                        />
                                                                    )}
                                                                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                                                                        {
                                                                            initial
                                                                        }
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-semibold">
                                                                        {
                                                                            assignedLabel
                                                                        }
                                                                    </p>
                                                                    {assignedSub && (
                                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                                            {
                                                                                assignedSub
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {canScheduleDepartment && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        aria-label={`Hapus penugasan ${assignedLabel} dari ${role.role_name}`}
                                                                        className="size-8 shrink-0 text-muted-foreground"
                                                                        onClick={(
                                                                            clickEvent,
                                                                        ) => {
                                                                            clickEvent.stopPropagation();
                                                                            clearRoleMember(
                                                                                role.id,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <X className="size-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="mt-2 rounded-xl border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
                                                                {canScheduleDepartment
                                                                    ? 'Ketuk untuk menugaskan anggota'
                                                                    : 'Belum ada anggota'}
                                                            </p>
                                                        )}
                                                        {isEditing && (
                                                            <div className="relative mt-2">
                                                                <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                                                <Input
                                                                    type="search"
                                                                    autoComplete="off"
                                                                    autoFocus
                                                                    aria-label={`Cari anggota untuk posisi ${role.role_name} di ${group.department.name}`}
                                                                    placeholder="Cari nama, email, atau ID anggota..."
                                                                    value={
                                                                        memberQueries[
                                                                            role
                                                                                .id
                                                                        ] ?? ''
                                                                    }
                                                                    onChange={(
                                                                        inputEvent,
                                                                    ) =>
                                                                        setMemberQueries(
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                [role
                                                                                    .id]:
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
                                                                            keyEvent
                                                                                .key ===
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
                                                                            keyEvent
                                                                                .key ===
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
                                                                    className="h-10 bg-background pr-4 pl-9"
                                                                />
                                                                <div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg">
                                                                    {memberOptions.map(
                                                                        (
                                                                            member,
                                                                        ) => (
                                                                            <button
                                                                                key={
                                                                                    member.idjemaat
                                                                                }
                                                                                type="button"
                                                                                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-accent"
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
                                                                                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                                                                                    <Avatar className="size-8 border">
                                                                                        {member.foto_url && (
                                                                                            <AvatarImage
                                                                                                src={
                                                                                                    member.foto_url
                                                                                                }
                                                                                                alt={
                                                                                                    member.namalengkap
                                                                                                }
                                                                                            />
                                                                                        )}
                                                                                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                                                                            {member.namalengkap
                                                                                                .trim()
                                                                                                .charAt(
                                                                                                    0,
                                                                                                )
                                                                                                .toLocaleUpperCase()}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="min-w-0 flex-1">
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
                                                                        0 && (
                                                                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                                            Tidak
                                                                            ada
                                                                            anggota
                                                                            yang
                                                                            cocok.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

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
