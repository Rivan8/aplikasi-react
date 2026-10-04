import { Head, Link, usePage } from '@inertiajs/react';
import {
    CalendarCheck,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock,
    LayoutDashboard,
    MapPin,
    QrCode,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';

const features = [
    {
        title: 'Service Planning',
        description:
            'Susun event, kategori pelayanan, role departemen, dan jadwal volunteer dalam satu alur kerja.',
        icon: ClipboardList,
    },
    {
        title: 'Volunteer Response',
        description:
            'Volunteer dapat menerima atau menolak jadwal, lengkap dengan alasan agar admin cepat menyesuaikan tim.',
        icon: CheckCircle2,
    },
    {
        title: 'QR Attendance',
        description:
            'Absensi lewat scan kartu jemaat atau QR event mandiri, dengan riwayat check-in yang mudah dilacak.',
        icon: QrCode,
    },
];

const serviceFlow = [
    'Buat kategori event dan template role',
    'Jadwalkan volunteer berdasarkan departemen',
    'Volunteer konfirmasi jadwal pelayanan',
    'Scan kehadiran dan pantau history',
];

const teamRows = [
    {
        name: 'Imelda Blegur',
        role: 'Worship Leader',
        status: 'Accepted',
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
        name: 'Indra Kurniawan',
        role: 'Camera 1',
        status: 'Pending',
        tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
        name: 'Ruth Anggraini',
        role: 'Frontline',
        status: 'Accepted',
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
];

function ProductPreview() {
    return (
        <div className="relative mx-auto w-full max-w-5xl px-2 pt-10 md:px-8 lg:pt-6">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[#7C2D1E]/10 blur-2xl" />
            <div className="overflow-hidden rounded-xl border border-white/20 bg-[#111827]/95 shadow-2xl shadow-[#7C2D1E]/25 ring-1 ring-black/10">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-400" />
                        <span className="h-3 w-3 rounded-full bg-amber-400" />
                        <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                        Sunday Celebration
                    </div>
                </div>

                <div className="grid min-h-[420px] gap-0 lg:grid-cols-[230px_1fr]">
                    <aside className="hidden border-r border-white/10 bg-white/[0.03] p-4 lg:block">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-400 text-slate-950">
                                <AppLogoIcon className="h-5 w-5 fill-current" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">
                                    ESC Planning Center
                                </p>
                                <p className="text-xs text-white/45">
                                    Service Center
                                </p>
                            </div>
                        </div>

                        {[
                            ['Dashboard', LayoutDashboard],
                            ['Events', CalendarCheck],
                            ['Volunteers', Users],
                            ['QR Check-in', QrCode],
                        ].map(([label, Icon]) => (
                            <div
                                key={label as string}
                                className="mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/65 first:bg-white/10 first:text-white"
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label as string}</span>
                            </div>
                        ))}
                    </aside>

                    <div className="p-4 md:p-6">
                        <div className="mb-5 grid gap-3 md:grid-cols-3">
                            {[
                                ['Events', '12', '3 this week'],
                                ['Check-ins', '342', '87% attendance'],
                                ['Volunteers', '96', '12 pending'],
                            ].map(([label, value, detail]) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
                                >
                                    <p className="text-xs font-medium text-white/50">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-2xl font-bold text-white">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-xs text-white/45">
                                        {detail}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-lg border border-white/10 bg-white/[0.06]">
                                <div className="border-b border-white/10 p-4">
                                    <p className="text-sm font-semibold text-white">
                                        Upcoming Service
                                    </p>
                                    <p className="mt-1 text-xs text-white/45">
                                        Volunteer readiness and attendance plan
                                    </p>
                                </div>
                                <div className="space-y-3 p-4">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm font-semibold text-white">
                                                Sunday Celebration
                                            </p>
                                            <span className="rounded-md bg-teal-400/15 px-2 py-1 text-xs font-bold text-teal-200">
                                                Ready
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-xs text-white/50">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                09:00
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3.5 w-3.5" />
                                                Main Hall
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-[82%] rounded-full bg-teal-300" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="rounded-md bg-white/[0.05] p-3">
                                            <p className="text-white/45">
                                                Team
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                28 scheduled
                                            </p>
                                        </div>
                                        <div className="rounded-md bg-white/[0.05] p-3">
                                            <p className="text-white/45">
                                                Target
                                            </p>
                                            <p className="mt-1 font-semibold text-white">
                                                250 attendees
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-white/[0.06]">
                                <div className="border-b border-white/10 p-4">
                                    <p className="text-sm font-semibold text-white">
                                        Volunteer Team
                                    </p>
                                </div>
                                <div className="divide-y divide-white/10">
                                    {teamRows.map((member) => (
                                        <div
                                            key={member.name}
                                            className="flex items-center justify-between gap-3 p-4"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                                                    {member.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">
                                                        {member.name}
                                                    </p>
                                                    <p className="truncate text-xs text-white/45">
                                                        {member.role}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold ${member.tone}`}
                                            >
                                                {member.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="ESC Planning Center">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700"
                    rel="stylesheet"
                />
            </Head>

            <div className="min-h-screen bg-[#FFF4EC] text-stone-950">
                <section className="relative isolate min-h-[94svh] overflow-hidden bg-[linear-gradient(120deg,#C96A4A_0%,#A95F63_48%,#526B68_100%)] text-white">
                    <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
                    <div className="absolute -top-24 left-[38%] h-56 w-56 rotate-12 rounded-[3rem] border border-white/15 bg-[#E9B9A7]/15 shadow-2xl shadow-[#7C2D1E]/10" />
                    <div className="absolute top-20 -right-24 h-80 w-80 -rotate-12 rounded-[4rem] border border-white/15 bg-[#526B68]/25 shadow-2xl shadow-[#263F3D]/20" />
                    <div className="absolute -bottom-28 -left-16 h-64 w-64 rotate-45 rounded-[2.5rem] border border-white/10 bg-white/10" />
                    <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#263F3D]/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FFF4EC] via-[#FFF4EC]/70 to-transparent" />

                    <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                            aria-label="ESC Planning Center Home"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#B8543A] shadow-lg shadow-[#7C2D1E]/20">
                                <AppLogoIcon className="h-6 w-6 fill-current" />
                            </div>
                            <div>
                                <p className="font-bold tracking-tight">
                                    ESC Planning Center
                                </p>
                                <p className="text-xs font-medium text-white/55">
                                    Church Service Operations
                                </p>
                            </div>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-[#A84D36] shadow-sm transition hover:bg-[#FBE3D5]"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                    <Link
                                        href={login()}
                                        className="inline-flex h-10 items-center rounded-md bg-white px-4 text-sm font-semibold text-[#A84D36] shadow-sm transition hover:bg-[#FBE3D5]"
                                    >
                                        Log in
                                    </Link>
                            )}
                        </nav>
                    </header>

                    <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-8 px-5 pt-8 pb-20 md:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:pt-14 lg:pb-28">
                        <div className="max-w-3xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold tracking-widest text-[#FFF1E8] uppercase backdrop-blur">
                                <Sparkles className="h-4 w-4" />
                                Plan services. Schedule teams. Track attendance.
                            </div>
                            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
                                Pusat kendali pelayanan yang rapi untuk setiap
                                event gereja.
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">
                                Kelola event, susun volunteer, minta konfirmasi
                                jadwal, dan catat kehadiran jemaat dengan alur
                                yang terasa modern, cepat, dan mudah dipakai tim
                                pelayanan.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    href={auth.user ? dashboard() : login()}
                                    className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-bold text-[#A84D36] shadow-lg shadow-[#7C2D1E]/25 transition hover:bg-[#FBE3D5]"
                                >
                                    {auth.user
                                        ? 'Buka Dashboard'
                                        : 'Masuk ke Aplikasi'}
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>
                                <a
                                    href="#features"
                                    className="inline-flex h-12 items-center justify-center rounded-md border border-white/15 bg-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/15"
                                >
                                    Lihat Fitur
                                </a>
                            </div>

                            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
                                {[
                                    ['QR', 'Check-in'],
                                    ['Role', 'Templates'],
                                    ['Live', 'History'],
                                ].map(([value, label]) => (
                                    <div key={value}>
                                        <p className="text-2xl font-bold text-white">
                                            {value}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-white/50">
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <ProductPreview />
                    </div>
                </section>

                <section id="features" className="px-5 py-20 md:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                            <div className="max-w-2xl">
                                <p className="text-sm font-bold tracking-widest text-[#A84D36] uppercase">
                                    Satu ruang kerja
                                </p>
                                <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                                    Semua yang dibutuhkan tim pelayanan, dalam satu alur.
                                </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-stone-600">
                                Dari jadwal pertama sampai laporan kehadiran, setiap detail tetap mudah ditemukan.
                            </p>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            {features.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <article
                                        key={feature.title}
                                        className="group rounded-xl border border-[#F1D5C6] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#E9B9A7] hover:shadow-xl hover:shadow-[#7C2D1E]/10"
                                    >
                                        <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg bg-[#FBE3D5] text-[#A84D36] transition group-hover:bg-[#B8543A] group-hover:text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-xl font-bold tracking-tight">
                                            {feature.title}
                                        </h2>
                                        <p className="mt-3 text-sm leading-6 text-stone-600">
                                            {feature.description}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section className="border-y border-[#F1D5C6] bg-[#FFFDFC]">
                    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                        <div>
                            <p className="text-sm font-bold tracking-widest text-[#A84D36] uppercase">
                                Built for ministry teams
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                                Dari perencanaan sampai absensi, semua langkah
                                pelayanan tetap sinkron.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-stone-600">
                                Admin bisa melihat kesiapan event, sementara
                                volunteer hanya melihat jadwal yang relevan
                                untuk mereka. Setiap respons tersimpan sehingga
                                koordinasi tidak tercecer.
                            </p>
                        </div>

                        <div className="grid gap-3">
                            {serviceFlow.map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-4 rounded-xl border border-[#F1D5C6] bg-white p-4 shadow-sm transition hover:border-[#E9B9A7] hover:shadow-md"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                                        {index + 1}
                                    </div>
                                    <p className="font-semibold text-slate-900">
                                        {step}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
                        {[
                            {
                                title: 'Admin Dashboard',
                                text: 'Pantau event aktif, role kosong, check-in hari ini, dan kesiapan departemen.',
                                icon: LayoutDashboard,
                            },
                            {
                                title: 'Volunteer Dashboard',
                                text: 'User melihat jadwal pribadi, daftar tim event, dan tombol terima atau tolak jadwal.',
                                icon: Users,
                            },
                            {
                                title: 'Secure Data Flow',
                                text: 'Data jemaat eksternal tetap read-only, sedangkan metadata pelayanan disimpan lokal.',
                                icon: ShieldCheck,
                            },
                        ].map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="rounded-xl bg-[#B8543A] p-6 text-white shadow-lg shadow-[#7C2D1E]/10 transition hover:-translate-y-1 hover:bg-[#9F4632]"
                                >
                                    <Icon className="h-6 w-6 text-[#FBE3D5]" />
                                    <h3 className="mt-5 text-xl font-bold">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm leading-6 text-white/65">
                                        {item.text}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="px-5 pb-20 md:px-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-xl bg-[#C96A4A] p-8 text-white shadow-xl shadow-[#7C2D1E]/15 md:flex-row md:items-center lg:p-10">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Siap mengelola pelayanan berikutnya?
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                                Masuk ke aplikasi untuk mulai membuat event,
                                menjadwalkan volunteer, dan memantau kehadiran.
                            </p>
                        </div>
                        <Link
                            href={auth.user ? dashboard() : login()}
                            className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-white px-5 text-sm font-bold text-[#8F3F2D] transition hover:bg-[#FBE3D5]"
                        >
                            {auth.user ? 'Dashboard' : 'Log in'}
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}
