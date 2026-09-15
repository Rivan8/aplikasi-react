import { Head, Link, usePage } from '@inertiajs/react';
import { addMonths, format, isSameDay, parseISO, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayButton as DefaultDayButton } from 'react-day-picker';
import type { DayButtonProps } from 'react-day-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    location: string | null;
    category: string;
}

const getEventDate = (event: CalendarEvent) => (event.date ? parseISO(event.date) : null);

const formatTime = (time: string | null) => time?.slice(0, 5) || 'Waktu belum ditentukan';

const formatEventDate = (date: Date | null) => date ? format(date, 'd MMM yyyy', { locale: id }) : 'Tanggal belum ditentukan';

export default function EventCalendar({ events = [] }: { events: CalendarEvent[] }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const canManageEvents = ['admin', 'superadmin'].includes(auth?.user?.role ?? '');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
    const [currentMonth, setCurrentMonth] = useState(() => new Date());

    const goToPreviousMonth = () => {
        setCurrentMonth((month) => subMonths(month, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth((month) => addMonths(month, 1));
    };

    const eventDates = useMemo(
        () => events.flatMap((event) => {
            const date = getEventDate(event);

            return date ? [date] : [];
        }),
        [events],
    );

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();

        events.forEach((event) => {
            if (!event.date) {
                return;
            }

            const dayEvents = grouped.get(event.date) ?? [];
            dayEvents.push(event);
            grouped.set(event.date, dayEvents);
        });

        return grouped;
    }, [events]);

    const selectedDayEvents = useMemo(
        () => events.filter((event) => {
            const date = getEventDate(event);

            return date && selectedDate && isSameDay(date, selectedDate);
        }),
        [events, selectedDate],
    );

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return events.filter((event) => {
            const date = getEventDate(event);

            return date && date >= today;
        });
    }, [events]);

    const calendarComponents = {
        DayButton: ({ day, modifiers, ...props }: DayButtonProps) => {
            const dayEvents = eventsByDate.get(format(day.date, 'yyyy-MM-dd')) ?? [];
            const firstEvent = dayEvents[0];

            return (
                <DefaultDayButton
                    {...props}
                    day={day}
                    modifiers={modifiers}
                    className={cn(props.className, 'h-full w-full')}
                >
                    <span className="flex h-full min-w-0 flex-col items-center justify-start gap-1 pt-2">
                        <span className="leading-none">{day.date.getDate()}</span>
                        {firstEvent && (
                            <span className="max-w-full truncate rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold leading-none text-primary sm:max-w-[78px] sm:text-[10px]">
                                {firstEvent.title}
                                {dayEvents.length > 1 && ` +${dayEvents.length - 1}`}
                            </span>
                        )}
                    </span>
                </DefaultDayButton>
            );
        },
    };

    return (
        <>
            <Head title="Kalender Event" />
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-6 lg:p-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                    {canManageEvents && (
                        <Button asChild variant="outline" className="w-fit gap-2">
                            <Link href="/events">Kelola event</Link>
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                    <Card className="overflow-hidden border-orange-100/80 shadow-sm">
                        <CardHeader className="border-b bg-orange-50/50 px-4 py-4 sm:px-6">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                Jadwal bulanan
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Tanggal bertanda memiliki event terjadwal.
                            </p>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-5">
                            <div className="mb-3 flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 p-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Bulan sebelumnya"
                                    title="Bulan sebelumnya"
                                    onClick={goToPreviousMonth}
                                    className="h-9 w-9 rounded-lg"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-bold capitalize">
                                    {format(currentMonth, 'MMMM yyyy', { locale: id })}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Bulan berikutnya"
                                    title="Bulan berikutnya"
                                    onClick={goToNextMonth}
                                    className="h-9 w-9 rounded-lg"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <Calendar
                                mode="single"
                                hideNavigation
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                selected={selectedDate}
                                onSelect={(date) => {
                                    setSelectedDate(date);

                                    if (date) {
                                        setCurrentMonth(date);
                                    }
                                }}
                                components={calendarComponents}
                                modifiers={{ hasEvent: eventDates }}
                                modifiersClassNames={{
                                    hasEvent: 'event-calendar-day',
                                }}
                                className="mx-auto w-full max-w-2xl"
                                classNames={{
                                    months: 'flex w-full flex-col',
                                    month: 'w-full space-y-4',
                                    month_caption: 'h-0 overflow-hidden',
                                    caption_label: 'sr-only',
                                    nav: 'hidden',
                                    month_grid: 'w-full border-collapse table-fixed',
                                    weekdays: 'flex w-full',
                                    weekday: 'flex-1 text-center text-xs font-semibold text-muted-foreground',
                                    weeks: 'mt-2 flex w-full flex-col gap-1',
                                    week: 'flex w-full',
                                    day: 'h-[68px] min-w-0 flex-1 p-0 text-center text-sm sm:h-[84px]',
                                    day_button: 'relative h-[68px] w-full overflow-hidden rounded-xl p-0 font-medium hover:bg-primary/10 sm:h-[84px]',
                                    selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                                    today: 'border border-primary/40 bg-primary/5 text-primary',
                                }}
                            />
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-2 pt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />Ada event</span>
                                <span>{eventsByDate.size} tanggal terisi</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-fit border-orange-100/80 shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle className="text-lg">
                                {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Event pada tanggal terpilih</p>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4">
                            {selectedDayEvents.length > 0 ? selectedDayEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href="/events"
                                    className="block rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="truncate font-semibold leading-tight">{event.title}</h3>
                                                <Badge variant="secondary" className="shrink-0 text-[10px]">{event.category}</Badge>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                                                <span className="rounded-md bg-muted px-2 py-1">{formatEventDate(getEventDate(event))}</span>
                                                <span className="rounded-md bg-muted px-2 py-1">{formatTime(event.time)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {event.location && (
                                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5" /> {event.location}
                                        </p>
                                    )}
                                </Link>
                            )) : (
                                <div className="rounded-xl border border-dashed p-6 text-center">
                                    <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground/40" />
                                    <p className="mt-3 text-sm font-medium">Tidak ada event di tanggal ini</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Pilih tanggal lain untuk melihat jadwal.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <section className="space-y-4" aria-labelledby="upcoming-events-title">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h2 id="upcoming-events-title" className="text-xl font-bold">Daftar event mendatang</h2>
                            <p className="mt-1 text-sm text-muted-foreground">{upcomingEvents.length} event terjadwal</p>
                        </div>
                    </div>
                    {upcomingEvents.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {upcomingEvents.map((event) => {
                                const eventDate = getEventDate(event);

                                return (
                                    <Link
                                        key={event.id}
                                        href="/events"
                                        className={cn(
                                            'group rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
                                            selectedDate && eventDate && isSameDay(eventDate, selectedDate) && 'border-primary/60 bg-primary/5',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <Badge variant="outline" className="mb-3 text-[10px]">{event.category}</Badge>
                                                <h3 className="font-bold group-hover:text-primary">{event.title}</h3>
                                            </div>
                                            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                                        </div>
                                        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{eventDate ? format(eventDate, 'EEE, d MMM yyyy', { locale: id }) : '-'}</p>
                                            <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatTime(event.time)}</p>
                                            {event.location && <p className="flex items-center gap-2 truncate"><MapPin className="h-4 w-4 shrink-0" />{event.location}</p>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada event mendatang.</CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </>
    );
}
