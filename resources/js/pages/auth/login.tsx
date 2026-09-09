import { Form, Head, Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import {
    CalendarCheck,
    QrCode,
    Users,
} from 'lucide-react';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const highlights = [
    {
        icon: CalendarCheck,
        title: 'Service Planning',
        description: 'Kelola event dan jadwalkan volunteer dalam satu alur.',
    },
    {
        icon: Users,
        title: 'Team Coordination',
        description: 'Konfirmasi jadwal pelayanan secara real-time.',
    },
    {
        icon: QrCode,
        title: 'QR Attendance',
        description: 'Absensi cepat via scan QR code atau kartu jemaat.',
    },
];

export default function Login({
    status,
    canResetPassword,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            <div className="grid min-h-svh lg:grid-cols-2">
                {/* Left branded panel */}
                <div className="relative hidden flex-col justify-between overflow-hidden bg-[#FFF4EA] p-10 text-[#431407] lg:flex">
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(251,146,60,0.2),transparent_30%),radial-gradient(circle_at_82%_80%,rgba(234,88,12,0.12),transparent_28%)]" />

                    {/* Animated floating orbs */}
                    <div className="absolute top-[15%] left-[12%] h-64 w-64 rounded-full bg-orange-300/20 blur-3xl" />
                    <div className="absolute right-[8%] bottom-[20%] h-48 w-48 rounded-full bg-amber-200/15 blur-3xl" />

                    {/* Header with logo */}
                    <div className="relative z-10">
                        <Link
                            href={home()}
                            className="flex items-center gap-3"
                            aria-label="ESC Planning Center Home"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-white p-1 shadow-lg shadow-orange-900/15">
                                <AppLogoIcon className="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <p className="text-lg font-bold tracking-tight">
                                    ESC Planning Center
                                </p>
                                <p className="text-xs font-medium text-[#7C2D12]/75">
                                    Church Service Operations
                                </p>
                            </div>
                        </Link>
                    </div>

                    {/* Center content */}
                    <div className="relative z-10 max-w-md">
                        <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
                            Pusat kendali pelayanan yang rapi untuk setiap event gereja.
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-[#7C2D12]/80">
                            Kelola event, susun volunteer, minta konfirmasi jadwal, dan catat kehadiran jemaat dengan alur yang modern dan efisien.
                        </p>

                        {/* Feature highlights */}
                        <div className="mt-8 space-y-4">
                            {highlights.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="flex items-start gap-4 rounded-xl border border-orange-200/80 bg-white/60 p-4 backdrop-blur-sm transition-colors hover:border-orange-300 hover:bg-white/80"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#431407]">
                                                {item.title}
                                            </p>
                                            <p className="mt-1 text-xs leading-relaxed text-[#7C2D12]/75">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10">
                        <p className="text-xs text-[#7C2D12]/60">
                            &copy; {new Date().getFullYear()} ESC Planning Center. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Right login panel */}
                <div className="flex flex-col items-center justify-center bg-background px-6 py-12 md:px-12 lg:px-16">
                    {/* Mobile logo (shown only on smaller screens) */}
                    <div className="mb-10 flex flex-col items-center gap-3 lg:hidden">
                        <Link
                            href={home()}
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-white p-1 shadow-lg shadow-orange-900/15">
                                <AppLogoIcon className="h-6 w-6 fill-current" />
                            </div>
                        </Link>
                        <div className="text-center">
                            <p className="text-lg font-bold tracking-tight">
                                ESC Planning Center
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Church Service Operations
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-sm">
                        {/* Login header */}
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold tracking-tight">
                                Selamat Datang 👋
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Masukkan email dan password untuk melanjutkan ke dashboard.
                            </p>
                        </div>

                        {/* Status message */}
                        {status && (
                            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                                {status}
                            </div>
                        )}

                        {/* Login form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-5"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="login">Email atau nomor HP</Label>
                                            <Input
                                                id="login"
                                                type="text"
                                                name="login"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="username"
                                                placeholder="nama@email.com atau 0812..."
                                                className="h-11"
                                            />
                                            <InputError message={errors.login || errors.email} />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="password">Password</Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="text-xs"
                                                        tabIndex={5}
                                                    >
                                                        Lupa password?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Masukkan password"
                                                className="h-11"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                tabIndex={3}
                                            />
                                            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                                                Ingat saya
                                            </Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="h-11 w-full text-sm font-semibold"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            Masuk
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>

                        {/* Footer note */}
                        <p className="mt-8 text-center text-xs text-muted-foreground">
                            Hubungi admin jika Anda memerlukan akun baru.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
