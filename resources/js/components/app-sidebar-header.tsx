import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CalendarDays, MessageSquare } from 'lucide-react';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, notifications } = usePage().props as {
        auth?: { user?: { role?: string } };
        notifications?: {
            pending_assignments?: number;
            unread_messages?: number;
            total?: number;
        };
    };
    const isMember = ['user', 'jemaat'].includes(auth?.user?.role ?? '');
    const totalNotifications = notifications?.total ?? 0;

    const openNotification = (type: 'schedules' | 'messages') => {
        const endpoint = type === 'schedules'
            ? '/notifications/schedules/read'
            : '/notifications/messages/read';
        const target = type === 'schedules' ? '/dashboard#jadwal' : '/dashboard#pesan';

        router.post(endpoint, {}, {
            preserveScroll: true,
            onSuccess: () => router.visit(target),
        });
    };

    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <SidebarTrigger className={`-ml-1 text-muted-foreground transition-colors hover:text-foreground ${isMember ? 'md:hidden' : ''}`} />
                <div className="h-4 w-px bg-border/60 mx-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                {isMember && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-md" aria-label="Buka notifikasi">
                                <Bell className="h-[1.2rem] w-[1.2rem]" />
                                {totalNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                                        {totalNotifications > 99 ? '99+' : totalNotifications}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 rounded-xl p-2">
                            <DropdownMenuLabel className="px-3 py-2 text-sm">Notifikasi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {totalNotifications === 0 ? (
                                <p className="px-3 py-5 text-center text-xs text-muted-foreground">Tidak ada notifikasi baru.</p>
                            ) : (
                                <>
                                    {(notifications?.pending_assignments ?? 0) > 0 && (
                                        <a href="/dashboard#jadwal" onClick={(event) => { event.preventDefault(); openNotification('schedules'); }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted">
                                            <span className="rounded-lg bg-amber-100 p-2 text-amber-700"><CalendarDays className="h-4 w-4" /></span>
                                            <span className="min-w-0"><strong className="block text-xs">Jadwal pelayanan</strong><small className="text-muted-foreground">{notifications?.pending_assignments} jadwal menunggu respons</small></span>
                                        </a>
                                    )}
                                    {(notifications?.unread_messages ?? 0) > 0 && (
                                        <a href="/dashboard#pesan" onClick={(event) => { event.preventDefault(); openNotification('messages'); }} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted">
                                            <span className="rounded-lg bg-rose-100 p-2 text-rose-700"><MessageSquare className="h-4 w-4" /></span>
                                            <span className="min-w-0"><strong className="block text-xs">Pesan baru</strong><small className="text-muted-foreground">{notifications?.unread_messages} pesan belum dibaca</small></span>
                                        </a>
                                    )}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <ThemeToggle />
            </div>
        </header>
    );
}
