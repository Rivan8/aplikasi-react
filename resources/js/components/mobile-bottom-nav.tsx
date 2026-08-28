import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, Clock3, Home, QrCode, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Event', href: '/my/events', icon: CalendarDays },
    { label: 'Riwayat', href: '/my/attendance-history', icon: Clock3 },
    { label: 'Profil', href: '/settings/profile', icon: UserRound },
];

export function MobileBottomNav() {
    const { auth, url } = usePage().props as {
        auth?: { user?: { role?: string } };
        url?: string;
    };
    const isMember = ['user', 'jemaat'].includes(auth?.user?.role ?? '');

    if (!isMember) return null;

    const currentPath = url?.split('?')[0] ?? window.location.pathname;
    const isActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`);

    return (
        <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-border/70 bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden" aria-label="Navigasi utama">
            <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-end">
                <Link href={items[0].href} className={cn('flex h-full flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors', isActive(items[0].href) ? 'text-primary' : 'text-muted-foreground')}>
                    <Home className="h-5 w-5" />
                    <span>{items[0].label}</span>
                </Link>
                <Link href={items[1].href} className={cn('flex h-full flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors', isActive(items[1].href) ? 'text-primary' : 'text-muted-foreground')}>
                    <CalendarDays className="h-5 w-5" />
                    <span>{items[1].label}</span>
                </Link>
                <Link href="/my/scan" className="group relative -mt-7 flex flex-col items-center gap-1 text-[10px] font-bold text-primary" aria-label="Buka absensi mandiri">
                    <span className="flex h-[3.65rem] w-[3.65rem] items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform group-hover:-translate-y-0.5 group-active:scale-95">
                        <QrCode className="h-7 w-7" />
                    </span>
                    <span className="whitespace-nowrap">Absensi</span>
                </Link>
                <Link href={items[2].href} className={cn('flex h-full flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors', isActive(items[2].href) ? 'text-primary' : 'text-muted-foreground')}>
                    <Clock3 className="h-5 w-5" />
                    <span>{items[2].label}</span>
                </Link>
                <Link href={items[3].href} className={cn('flex h-full flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors', isActive(items[3].href) ? 'text-primary' : 'text-muted-foreground')}>
                    <UserRound className="h-5 w-5" />
                    <span>{items[3].label}</span>
                </Link>
            </div>
        </nav>
    );
}
