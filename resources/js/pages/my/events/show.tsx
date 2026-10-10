import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    NotebookText,
    Sparkles,
    Users,
    XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventScheduleItem {
    id?: number;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
}

interface UserEventDetail {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    address?: string | null;
    category: string;
    attendance_type?: string;
    my_volunteer_assignments?: Array<{
        id: number;
        role_category: string;
        role_name: string;
        response_status:
            'pending' | 'accepted' | 'declined' | 'rejected' | string;
        response_reason?: string | null;
    }>;
    sessions?: Array<{
        id: number;
        title: string;
        date: string;
        start_time?: string | null;
        end_time?: string | null;
    }>;
    live_session?: unknown;
}

interface EventDataPayload {
    worship: {
        date: string | null;
        start_time: string | null;
        end_time: string | null;
    };
    training: EventScheduleItem[];
    other: EventScheduleItem[];
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(value));
};

const formatTime = (value?: string | null) => {
    if (!value) {
        return '-';
    }

    const [hour, minute] = value.split(':');
    const date = new Date();
    date.setHours(Number(hour || 0), Number(minute || 0), 0, 0);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(date);
};

const scheduleStyles = {
    worship: {
        shell: 'border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/50 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10',
        badge: 'bg-stone-100 text-stone-700 hover:bg-stone-100 dark:bg-stone-900/60 dark:text-stone-200',
        accent: 'text-stone-700 dark:text-stone-200',
        dot: 'bg-stone-500',
        label: 'Service Time',
    },
    training: {
        shell: 'border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/50 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10',
        badge: 'bg-stone-100 text-stone-700 hover:bg-stone-100 dark:bg-stone-900/60 dark:text-stone-200',
        accent: 'text-stone-700 dark:text-stone-200',
        dot: 'bg-stone-500',
        label: 'Rehearsal',
    },
    other: {
        shell: 'border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/50 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10',
        badge: 'bg-stone-100 text-stone-700 hover:bg-stone-100 dark:bg-stone-900/60 dark:text-stone-200',
        accent: 'text-stone-700 dark:text-stone-200',
        dot: 'bg-stone-500',
        label: 'Other Time',
    },
} as const;

const renderScheduleList = (
    items: EventScheduleItem[],
    type: 'training' | 'other',
) => {
    const variant = type === 'training' ? 'training' : 'other';
    const style = scheduleStyles[variant];

    if (!items || items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                Tidak ada jadwal {type === 'training' ? 'latihan' : 'lainnya'}.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div
                    key={`${type}-${index}`}
                    className={`rounded-2xl border p-4 shadow-sm ${style.shell}`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2.5 w-2.5 rounded-full ${style.dot}`}
                            />
                            <p className="text-sm font-semibold text-foreground">
                                {item.title}
                            </p>
                        </div>
                        <Badge className={style.badge}>{style.label}</Badge>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                        {formatDate(item.date)}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-xl bg-white/60 px-2.5 py-2 dark:bg-background/30">
                            <Clock3 className={`h-4 w-4 ${style.accent}`} />
                            <span>
                                {formatTime(item.start_time)} -{' '}
                                {formatTime(item.end_time)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-white/60 px-2.5 py-2 dark:bg-background/30">
                            <CalendarDays
                                className={`h-4 w-4 ${style.accent}`}
                            />
                            <span>{formatDate(item.date)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function MyEventShow({
    event,
    eventData,
}: {
    event: UserEventDetail;
    eventData: EventDataPayload;
}) {
    return (
        <>
            <Head title={event.title} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 py-6 md:p-8">
                <div className="flex items-center justify-between gap-3">
                    <Button variant="ghost" size="sm" asChild className="gap-2">
                        <Link href="/my/events">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Card className="overflow-hidden border-stone-200/80 bg-gradient-to-br from-stone-50 via-white to-zinc-100 dark:from-stone-950/20 dark:via-background dark:to-background">
                    <CardContent className="p-5 md:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div className="space-y-3">
                                <Badge
                                    variant="secondary"
                                    className="inline-flex items-center rounded-full bg-gradient-to-r from-stone-900 to-stone-600 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white uppercase shadow-sm dark:from-stone-700 dark:to-stone-500"
                                >
                                    {event.category}
                                </Badge>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black tracking-[0.28em] text-stone-600 uppercase dark:text-stone-300">
                                        Jadwal Ibadah
                                    </p>
                                    <h1 className="max-w-2xl bg-gradient-to-r from-stone-900 via-stone-700 to-stone-500 bg-clip-text text-3xl leading-none font-black tracking-[-0.04em] text-transparent sm:text-4xl lg:text-5xl dark:from-stone-100 dark:via-stone-200 dark:to-stone-400">
                                        {event.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-4 shadow-sm dark:bg-background/40">
                                <p className="text-[10px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                                    Waktu Ibadah
                                </p>
                                <div className="mt-2 flex items-center gap-2 text-stone-700 dark:text-stone-200">
                                    <Clock3 className="h-5 w-5" />
                                    <span className="text-xl font-bold">
                                        {formatTime(
                                            eventData?.worship?.start_time ??
                                                event.time,
                                        )}
                                        {eventData?.worship?.end_time
                                            ? ` - ${formatTime(eventData.worship.end_time)}`
                                            : ''}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {formatDate(
                                        eventData?.worship?.date ?? event.date,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <MapPin className="h-4 w-4 text-stone-600" />
                                <span>{event.location || 'Belum diatur'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4 text-stone-600" />
                                <span>{formatDate(event.date)}</span>
                            </div>
                        </div>

                        {event.address && (
                            <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                    Alamat:
                                </span>{' '}
                                {event.address}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {(event.my_volunteer_assignments ?? []).length > 0 && (
                    <Card className="overflow-hidden border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10">
                        <CardHeader className="border-b border-emerald-200/60 bg-emerald-50/50 dark:bg-emerald-950/10">
                            <CardTitle className="flex items-center gap-2 text-lg text-emerald-800 dark:text-emerald-200">
                                <Users className="h-5 w-5" />
                                Jadwal Volunteer Saya
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4">
                            {event.my_volunteer_assignments?.map(
                                (assignment) => {
                                    const accepted =
                                        assignment.response_status ===
                                        'accepted';
                                    const declined = [
                                        'declined',
                                        'rejected',
                                    ].includes(assignment.response_status);
                                    const StatusIcon = accepted
                                        ? CheckCircle2
                                        : declined
                                          ? XCircle
                                          : Clock3;
                                    const statusLabel = accepted
                                        ? 'Diterima'
                                        : declined
                                          ? 'Ditolak'
                                          : 'Menunggu konfirmasi';

                                    return (
                                        <div
                                            key={assignment.id}
                                            className="flex flex-col gap-2 rounded-xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div>
                                                <p className="font-semibold">
                                                    {assignment.role_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {assignment.role_category}
                                                </p>
                                                {declined &&
                                                    assignment.response_reason && (
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Alasan penolakan:{' '}
                                                            {
                                                                assignment.response_reason
                                                            }
                                                        </p>
                                                    )}
                                            </div>
                                            <Badge
                                                variant={
                                                    accepted
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    accepted
                                                        ? 'gap-1 bg-emerald-600 hover:bg-emerald-600'
                                                        : declined
                                                          ? 'gap-1 bg-destructive text-white hover:bg-destructive'
                                                          : 'gap-1'
                                                }
                                            >
                                                <StatusIcon className="h-3.5 w-3.5" />
                                                {statusLabel}
                                            </Badge>
                                        </div>
                                    );
                                },
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="overflow-hidden border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/40 lg:col-span-1 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10">
                        <CardHeader className="border-b border-stone-200/80 bg-stone-50/70 dark:bg-stone-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg text-stone-700 dark:text-stone-200">
                                <Sparkles className="h-5 w-5" />
                                Waktu Ibadah
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="rounded-2xl border border-stone-200/80 bg-white/70 p-4 shadow-sm dark:bg-background/40">
                                <p className="text-[10px] font-bold tracking-[0.18em] text-stone-700 uppercase dark:text-stone-200">
                                    Service Time
                                </p>
                                <p className="mt-3 text-sm font-semibold">
                                    {formatDate(
                                        eventData?.worship?.date ?? event.date,
                                    )}
                                </p>
                                <div className="mt-4 rounded-xl bg-stone-50 px-3 py-2 dark:bg-stone-950/30">
                                    <p className="text-xs font-bold tracking-[0.14em] text-stone-700 uppercase dark:text-stone-200">
                                        Pukul
                                    </p>
                                    <p className="mt-2 text-base font-bold text-stone-700 dark:text-stone-200">
                                        {formatTime(
                                            eventData?.worship?.start_time ??
                                                event.time,
                                        )}
                                        {eventData?.worship?.end_time
                                            ? ` - ${formatTime(eventData.worship.end_time)}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/40 lg:col-span-1 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10">
                        <CardHeader className="border-b border-stone-200/80 bg-stone-50/70 dark:bg-stone-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg text-stone-700 dark:text-stone-200">
                                <NotebookText className="h-5 w-5" />
                                Waktu Latihan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {renderScheduleList(
                                eventData?.training ?? [],
                                'training',
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-stone-200/80 bg-gradient-to-br from-stone-50/80 via-white to-zinc-100/40 lg:col-span-1 dark:from-stone-950/30 dark:via-background dark:to-zinc-900/10">
                        <CardHeader className="border-b border-stone-200/80 bg-stone-50/70 dark:bg-stone-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg text-stone-700 dark:text-stone-200">
                                <CalendarDays className="h-5 w-5" />
                                Waktu Lainnya
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {renderScheduleList(
                                eventData?.other ?? [],
                                'other',
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
