import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { usePage } from '@inertiajs/react';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth } = usePage().props as {
        auth?: { user?: { role?: string } };
    };
    const isMember = ['user', 'jemaat'].includes(auth?.user?.role ?? '');

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className={isMember ? 'overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0' : 'overflow-x-hidden'}
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
            <MobileBottomNav />
        </AppShell>
    );
}
