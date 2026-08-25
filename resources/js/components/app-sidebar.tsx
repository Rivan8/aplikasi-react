import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    HelpCircle,
    History,
    LayoutDashboard,
    LayoutGrid,
    Music,
    MonitorPlay,
    QrCode,
    Radio,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'superadmin', 'user', 'jemaat'],
    },
    {
        title: 'Scan QR Member (Admin)',
        href: '/scan-qr',
        icon: QrCode,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Monitor Absensi',
        href: '/attendance-monitor',
        icon: MonitorPlay,
        roles: ['admin', 'superadmin'],
        newTab: true,
    },
    {
        title: 'Absensi Mandiri',
        href: '/my/scan',
        icon: QrCode,
        roles: ['user', 'jemaat', 'admin', 'superadmin'],
    },
    {
        title: 'Management Event',
        href: '/events',
        icon: CalendarDays,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Live Event',
        href: '/live-events',
        icon: Radio,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Kategori Event',
        href: '/categories',
        icon: LayoutGrid,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Song Bank',
        href: '/songs',
        icon: Music,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Attendance History',
        href: '/attendance-history',
        icon: History,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Member List',
        href: '/anggota',
        icon: Users,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Departemen',
        href: '/departments',
        icon: Settings,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
        roles: ['admin', 'superadmin'],
    },
    {
        title: 'Kelola Hak Akses',
        href: '/settings/roles',
        icon: ShieldCheck,
        roles: ['superadmin'],
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Help Center',
        href: '#',
        icon: HelpCircle,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as any;
    const userRole = auth.user?.role || 'jemaat';

    const filteredNavItems = mainNavItems.filter((item) => {
        if (!item.roles) {
            return true;
        }

        return item.roles.includes(userRole);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={
                                    userRole === 'admin' || userRole === 'superadmin'
                                        ? '/events'
                                        : '/my/scan'
                                }
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
