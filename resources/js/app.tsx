import { createInertiaApp } from '@inertiajs/react';
import PageLoader from '@/components/page-loader';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'live-events/time-keeper':
            case name === 'attendance-monitor/index':
            case name === 'scan-qr/index':
            case name === 'my/live-rundown':
            case name === 'auth/login':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <PageLoader />
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#EA580C',
    },
});

// This will set light / dark mode on load...
initializeTheme();
