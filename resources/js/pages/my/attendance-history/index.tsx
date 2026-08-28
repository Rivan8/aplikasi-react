import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AttendanceItem {
    id: number;
    event_title: string;
    event_date?: string | null;
    event_location?: string | null;
    session_title?: string | null;
    scan_time?: string | null;
    check_out_time?: string | null;
    status: 'Present' | 'Late' | string;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

export default function MyAttendanceHistory({
    attendances,
    memberLinked,
}: {
    attendances: Pagination<AttendanceItem>;
    memberLinked: boolean;
}) {
    return (
        <>
            <Head title="Riwayat Absensi Saya" />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 lg:p-10">
                <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Aktivitas saya</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">Riwayat Absensi</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Riwayat check-in dan check-out yang tercatat pada akun Anda.</p>
                </div>

                {!memberLinked ? (
                    <Card>
                        <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <Clock className="h-10 w-10 text-amber-500" />
                            <h2 className="mt-4 font-semibold">Akun belum terhubung</h2>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">Hubungi admin untuk menghubungkan akun dengan data jemaat.</p>
                        </CardContent>
                    </Card>
                ) : attendances.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
                            <h2 className="mt-4 font-semibold">Belum ada riwayat absensi</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Absensi yang berhasil dicatat akan muncul di sini.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-3">
                            {attendances.data.map((attendance) => (
                                <Card key={attendance.id}>
                                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="font-semibold">{attendance.event_title}</h2>
                                                <Badge variant={attendance.status === 'Late' ? 'destructive' : 'secondary'}>
                                                    {attendance.status === 'Late' ? 'Terlambat' : 'Hadir'}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                                {attendance.event_date && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{attendance.event_date}</span>}
                                                {attendance.event_location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{attendance.event_location}</span>}
                                                {attendance.session_title && <span>{attendance.session_title}</span>}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-left text-sm sm:text-right">
                                            <p className="font-semibold text-foreground">Check-in {attendance.scan_time ?? '-'}</p>
                                            <p className="mt-1 text-muted-foreground">Check-out {attendance.check_out_time ?? '-'}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <p className="text-sm text-muted-foreground">Total {attendances.total} kehadiran</p>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" size="icon" disabled={!attendances.prev_page_url}>
                                    <Link href={attendances.prev_page_url ?? '#'} preserveScroll aria-label="Halaman sebelumnya"><ChevronLeft className="h-4 w-4" /></Link>
                                </Button>
                                <span className="flex items-center px-2 text-sm text-muted-foreground">{attendances.current_page} / {attendances.last_page}</span>
                                <Button asChild variant="outline" size="icon" disabled={!attendances.next_page_url}>
                                    <Link href={attendances.next_page_url ?? '#'} preserveScroll aria-label="Halaman berikutnya"><ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
