import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    QrCode,
    History,
    Users,
    Settings,
    HelpCircle,
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
import { anggota } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Scan QR',
        href: '/scan-qr',
        icon: QrCode,
    },
    {
        title: 'Event Dashboard',
        href: '/events',
        icon: LayoutDashboard,
    },
    {
        title: 'Attendance History',
        href: '/attendance-history',
        icon: History,
    },
    {
        title: 'Member List',
        href: anggota ? anggota() : '/anggota',
        icon: Users,
    },
    {
        title: 'Departemen',
        href: '/departments',
        icon: Settings, // Or choose another icon
    },
    {
        title: 'Settings',
        href: '/settings/profile',
        icon: Settings,
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
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/events" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
