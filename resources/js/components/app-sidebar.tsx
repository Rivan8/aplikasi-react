import { Link, usePage } from '@inertiajs/react';
import {
    HelpCircle,
    History,
    LayoutDashboard,
    LayoutGrid,
    QrCode,
    Settings,
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
        roles: ['admin', 'jemaat'],
    },
    {
        title: 'Scan QR Member (Admin)',
        href: '/scan-qr',
        icon: QrCode,
        roles: ['admin'],
    },
    {
        title: 'Absensi Mandiri',
        href: '/my/scan',
        icon: QrCode,
        roles: ['jemaat', 'admin'],
    },
    {
        title: 'Event Dashboard',
        href: '/events',
        icon: LayoutDashboard,
        roles: ['admin'],
    },
    {
        title: 'Kategori Event',
        href: '/categories',
        icon: LayoutGrid,
        roles: ['admin'],
    },
    {
        title: 'Attendance History',
        href: '/attendance-history',
        icon: History,
        roles: ['admin'],
    },
    {
        title: 'Member List',
        href: '/anggota',
        icon: Users,
        roles: ['admin'],
    },
    {
        title: 'Departemen',
        href: '/departments',
        icon: Settings,
        roles: ['admin'],
    },
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
        roles: ['admin', 'jemaat'],
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
                                    userRole === 'admin'
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
