import { Head, Link, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    AlertTriangle,
    Aperture,
    ArrowLeft,
    ArrowRight,
    CalendarCheck2,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    HelpCircle,
    Keyboard,
    LogOut,
    MapPin,
    Maximize,
    Minimize,
    QrCode,
    RefreshCw,
    Search,
    Settings2,
    StopCircle,
    Timer,
    UserCheck,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import AppLogoIcon from '@/components/app-logo-icon';
import { ScanResultModal } from '@/components/scan-result-modal';
import type { ScanResultData } from '@/components/scan-result-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatEventDate } from '@/lib/utils';

const EVENT_NOTICE_KEY = 'scan-qr-event-notice-shown-at';
const EVENT_NOTICE_INTERVAL_MS = 10 * 60 * 1000;

interface EventSession {
    id: number;
    session_number: number;
    title: string;
    date: string;
    start_time?: string | null;
    attendance_start_time?: string | null;
}

interface Event {
    id: number;
    title: string;
    date: string | null;
    location: string;
    time: string;
    attendance_start_time?: string | null;
    expected: number;
    attendance_type?: string;
    sessions?: EventSession[];
}

interface RecentScan {
    id: number;
    member_id: string;
    name: string;
    foto_url?: string | null;
    role_category?: string | null;
    role_name?: string | null;
    time: string | null;
    check_out_time?: string | null;
    status: string;
}

interface RosterMember {
    id: string | number;
    member_id: string;
    name: string;
    foto_url?: string | null;
    role_category?: string | null;
    role_name?: string | null;
    response_status?: string | null;
    scan_time: string | null;
    check_out_time?: string | null;
    status: string | null;
}

interface ScanStats {
    total: number;
    checked_in: number;
    on_time: number;
    late: number;
    pending: number;
}

interface FlashProps {
    success?: string;
    error?: string;
    info?: string;
    scan_result?: ScanResultData | null;
}

interface AuthUser {
    name?: string;
    role?: string;
    avatar?: string | null;
}

type RosterTab = 'checked' | 'pending' | 'all';
type ScanType = 'check_in' | 'check_out';
type ScanMode = 'camera' | 'usb';

const PAGE_SIZE = 8;

const shortTime = (value?: string | null) => (value ? value.slice(0, 5) : null);

const initialsOf = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?';

export default function ScanQR({
    events = [],
    recentScans = [],
    totalScanned = 0,
    roster = [],
    stats = { total: 0, checked_in: 0, on_time: 0, late: 0, pending: 0 },
    filters = { event_id: '', event_session_id: '' },
}: {
    events: Event[];
    recentScans?: RecentScan[];
    totalScanned?: number;
    roster?: RosterMember[];
    stats?: ScanStats;
    filters?: { event_id: string; event_session_id?: string };
}) {
    const page = usePage<{ flash?: FlashProps; auth?: { user?: AuthUser | null } }>();
    const flash = page.props.flash;
    const authUser = page.props.auth?.user;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const usbInputRef = useRef<HTMLInputElement | null>(null);
    const readerElementRef = useRef<HTMLDivElement | null>(null);
    const isMountedRef = useRef(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMode, setScanMode] = useState<ScanMode>('camera');
    const [selectedEventId, setSelectedEventId] = useState<string>(filters.event_id || '');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(filters.event_session_id || '');
    const [scanType, setScanType] = useState<ScanType>('check_in');
    const [processing, setProcessing] = useState(false);
    const [lastScanResult, setLastScanResult] = useState<{ type: 'success' | 'info' | 'error'; name: string } | null>(null);
    const [scanNotice, setScanNotice] = useState<ScanResultData | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const [rosterTab, setRosterTab] = useState<RosterTab>('checked');
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pageIndex, setPageIndex] = useState(1);
    const [eventPickerOpen, setEventPickerOpen] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);
    const [eventNoticeOpen, setEventNoticeOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        try {
            const lastShownAt = Number(window.sessionStorage.getItem(EVENT_NOTICE_KEY) ?? 0);

            return !lastShownAt || Date.now() - lastShownAt >= EVENT_NOTICE_INTERVAL_MS;
        } catch {
            return true;
        }
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [now, setNow] = useState(() => new Date());

    const activeEvent = events.find((event) => String(event.id) === selectedEventId) ?? null;
    const activeSession = activeEvent?.sessions?.find((session) => String(session.id) === selectedSessionId) ?? null;
    const sessions = activeEvent?.sessions ?? [];
    const classParticipantEvents = events.filter((event) => event.attendance_type === 'class_participant');
    const volunteerEvents = events.filter((event) => event.attendance_type !== 'class_participant');

    const eventDate = activeSession?.date ?? activeEvent?.date ?? null;
    const eventStartTime = activeSession?.start_time ?? activeEvent?.time ?? null;
    const toleranceTime = activeSession?.attendance_start_time ?? activeEvent?.attendance_start_time ?? activeEvent?.time ?? null;
    const todayISO = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    const isLive = eventDate === todayISO;

    const clock = now.toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' });
    const userName = authUser?.name ?? 'Admin';
    const userRole = authUser?.role === 'superadmin' ? 'Super Admin' : authUser?.role === 'admin' ? 'Admin Absensi' : 'Volunteer';

    const checkedPercentage = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 1000) / 10 : 0;
    const pendingPercentage = stats.total > 0 ? Math.round((stats.pending / stats.total) * 1000) / 10 : 0;
    const onTimePercentage = stats.total > 0 ? (stats.on_time / stats.total) * 100 : 0;
    const latePercentage = stats.total > 0 ? (stats.late / stats.total) * 100 : 0;
    const pendingBarPercentage = Math.max(0, 100 - onTimePercentage - latePercentage);
    const divisionCount = new Set(roster.map((member) => member.role_category).filter(Boolean)).size;

    const heroScan = recentScans[0] ?? null;

    const loadLatestData = useCallback(() => {
        router.reload({ only: ['recentScans', 'totalScanned', 'roster', 'stats'] });
    }, []);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (scanMode === 'camera' && !isScanning && !processing) {
                loadLatestData();
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [isScanning, loadLatestData, processing, scanMode]);

    useEffect(() => {
        const interval = window.setInterval(() => setNow(new Date()), 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
        document.addEventListener('fullscreenchange', handler);

        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    useEffect(() => {
        if (!eventNoticeOpen) {
            return;
        }

        try {
            window.sessionStorage.setItem(EVENT_NOTICE_KEY, String(Date.now()));
        } catch {
            // sessionStorage bisa diblokir browser
        }
    }, [eventNoticeOpen]);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const playBeep = useCallback(() => {
        try {
            const AudioCtor = window.AudioContext
                ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

            if (!AudioCtor) {
                return;
            }

            const context = new AudioCtor();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0.08, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.18);
            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.18);
            oscillator.onended = () => void context.close();
        } catch {
            // Audio tidak tersedia / diblokir browser
        }
    }, []);

    useEffect(() => {
        if (flash?.success) {
            const nameMatch = flash.success.match(/untuk (.+?)(?:\s+\(Terlambat\))?\.?$/)
                ?? flash.success.match(/^Kehadiran (.+?) dicatat/);
            const name = nameMatch ? nameMatch[1] : 'Member';
            setLastScanResult({ type: 'success', name });

            if (soundEnabled) {
                playBeep();
            }
        }

        if (flash?.error) {
            toast.error(flash.error, { duration: 4000 });
            const isInvalidQr = flash.error.includes('tidak dikenali');
            setLastScanResult({
                type: 'error',
                name: isInvalidQr ? 'QR Tidak Valid' : 'Error',
            });
        }

        if (flash?.info) {
            const match = flash.info.match(/^(.+?) sudah/);
            const name = match ? match[1] : 'Member';
            setLastScanResult({ type: 'info', name });
        }

        if (flash?.scan_result) {
            setScanNotice(flash.scan_result);
        }
    }, [flash, playBeep, soundEnabled]);

    useEffect(() => {
        if (!scanNotice) {
            return;
        }

        const timeout = window.setTimeout(() => setScanNotice(null), 4000);

        return () => window.clearTimeout(timeout);
    }, [scanNotice]);

    useEffect(() => {
        if (!lastScanResult) {
            return;
        }

        const timeout = window.setTimeout(() => setLastScanResult(null), 3000);

        return () => window.clearTimeout(timeout);
    }, [lastScanResult]);

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(() => {});
                }

                try {
                    scannerRef.current.clear();
                } catch {
                    // ignore
                }

                scannerRef.current = null;
            }
        };
    }, []);

    const handleEventChange = (value: string) => {
        setEventPickerOpen(false);
        setSelectedEventId(value);
        setSelectedSessionId('');
        router.get('/scan-qr', { event_id: value }, {
            preserveState: false,
            preserveScroll: false,
            replace: true,
        });
    };

    const handleSessionChange = (sessionId: string) => {
        const val = sessionId === 'all' ? '' : sessionId;
        setSelectedSessionId(val);
        router.get('/scan-qr', { event_id: selectedEventId, event_session_id: val }, {
            preserveState: false,
            preserveScroll: false,
            replace: true,
        });
    };

    const processMemberScan = useCallback((scan: string, overrideType?: ScanType) => {
        if (processing) {
            return;
        }

        setProcessing(true);
        setLastScanResult(null);

        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause();
        }

        router.post('/attendance/scan-member', {
            event_id: selectedEventId,
            event_session_id: selectedSessionId || null,
            scan_type: overrideType ?? scanType,
            scan,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);

                if (scannerRef.current) {
                    window.setTimeout(() => {
                        try {
                            if (scannerRef.current && scannerRef.current.isScanning) {
                                scannerRef.current.resume();
                            }
                        } catch {
                            // ignore resume errors
                        }
                    }, 2500);
                }
            },
        });
    }, [processing, scanType, selectedEventId, selectedSessionId]);

    const startScanner = useCallback(async () => {
        if (!selectedEventId) {
            toast.error('Pilih event terlebih dahulu!');

            return;
        }

        const element = readerElementRef.current;

        if (!element) {
            toast.error('Elemen scanner tidak ditemukan. Muat ulang halaman.');

            return;
        }

        const elementId = element.id;

        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }

                scannerRef.current.clear();
            } catch {
                // ignore cleanup errors
            }

            scannerRef.current = null;
        }

        setIsScanning(true);
        setLastScanResult(null);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.setTimeout(async () => {
                    if (!isMountedRef.current) {
                        return;
                    }

                    const domElement = document.getElementById(elementId);

                    if (!domElement) {
                        setIsScanning(false);
                        toast.error('Gagal menginisialisasi scanner. Coba muat ulang halaman.');

                        return;
                    }

                    try {
                        const scanner = new Html5Qrcode(elementId);
                        scannerRef.current = scanner;
                        const shortestSide = Math.min(domElement.clientWidth, domElement.clientHeight);
                        const scanAreaSize = Math.min(560, Math.max(180, Math.floor(shortestSide * 0.78)));

                        await scanner.start(
                            { facingMode: 'environment' },
                            {
                                fps: 10,
                                qrbox: { width: scanAreaSize, height: scanAreaSize },
                            },
                            (decodedText) => {
                                processMemberScan(decodedText);
                            },
                            () => {},
                        );
                    } catch (err) {
                        console.error('Error starting scanner:', err);

                        if (isMountedRef.current) {
                            setIsScanning(false);
                            toast.error('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
                        }
                    }
                }, 300);
            });
        });
    }, [processMemberScan, selectedEventId]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }

                scannerRef.current.clear();
            } catch {
                // ignore
            }

            scannerRef.current = null;
        }

        setIsScanning(false);
        setLastScanResult(null);
    }, []);

    const selectScanMode = useCallback(async (mode: ScanMode) => {
        if (mode === 'usb' && isScanning) {
            await stopScanner();
        }

        setScanMode(mode);
        setLastScanResult(null);
    }, [isScanning, stopScanner]);

    const handleUsbScan = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEventId || processing) {
            return;
        }

        const scan = usbInputRef.current?.value.trim() || '';

        if (!scan) {
            return;
        }

        if (usbInputRef.current) {
            usbInputRef.current.value = '';
        }

        processMemberScan(scan);
    }, [processMemberScan, processing, selectedEventId]);

    useEffect(() => {
        if (scanMode === 'usb' && selectedEventId && !processing) {
            usbInputRef.current?.focus();
        }
    }, [processing, scanMode, selectedEventId]);

    const toggleFullscreen = () => {
        if (document.fullscreenElement) {
            void document.exitFullscreen();
        } else {
            void document.documentElement.requestFullscreen?.();
        }
    };

    const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const code = manualCode.trim();

        if (!code || processing) {
            return;
        }

        setManualCode('');
        processMemberScan(code);
    };

    const selectTab = (tab: RosterTab) => {
        setRosterTab(tab);
        setPageIndex(1);
    };

    const departments = useMemo(
        () => Array.from(new Set(roster.map((member) => member.role_category).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b)),
        [roster],
    );

    const filteredRoster = useMemo(() => {
        const term = search.trim().toLowerCase();

        const result = roster.filter((member) => {
            if (rosterTab === 'checked' && !member.scan_time) {
                return false;
            }

            if (rosterTab === 'pending' && member.scan_time) {
                return false;
            }

            if (departmentFilter && member.role_category !== departmentFilter) {
                return false;
            }

            if (statusFilter === 'present' && member.status !== 'Present') {
                return false;
            }

            if (statusFilter === 'late' && member.status !== 'Late') {
                return false;
            }

            if (statusFilter === 'pending' && member.scan_time) {
                return false;
            }

            if (term) {
                const haystack = `${member.name} ${member.member_id} ${member.role_name ?? ''}`.toLowerCase();

                if (!haystack.includes(term)) {
                    return false;
                }
            }

            return true;
        });

        if (rosterTab === 'checked') {
            return result.sort((a, b) => (b.scan_time ?? '').localeCompare(a.scan_time ?? ''));
        }

        if (rosterTab === 'pending') {
            return result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [departmentFilter, roster, rosterTab, search, statusFilter]);

    const pageCount = Math.max(1, Math.ceil(filteredRoster.length / PAGE_SIZE));
    const currentPage = Math.min(pageIndex, pageCount);
    const pagedRoster = filteredRoster.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const pageNumbers = useMemo(() => {
        const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
        const end = Math.min(pageCount, start + 4);

        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, pageCount]);

    const exportCsv = () => {
        if (roster.length === 0) {
            toast.info('Belum ada data kehadiran untuk diekspor.');

            return;
        }

        const header = ['No', 'Nama', 'ID Jemaat', 'Divisi', 'Peran', 'Jam Absen', 'Jam Pulang', 'Status'];
        const rows = roster.map((member, index) => [
            index + 1,
            member.name,
            member.member_id,
            member.role_category ?? '-',
            member.role_name ?? '-',
            member.scan_time ?? '-',
            member.check_out_time ?? '-',
            member.status === 'Present' ? 'Hadir' : member.status === 'Late' ? 'Terlambat' : 'Belum Absen',
        ]);
        const csv = [header, ...rows]
            .map((columns) => columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
            .join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `absensi-${(activeEvent?.title ?? 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${eventDate ?? todayISO}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const heroTone = lastScanResult?.type === 'error'
        ? 'error'
        : lastScanResult?.type === 'info'
            ? 'info'
            : heroScan?.status === 'Late'
                ? 'late'
                : 'success';
    const heroTitle = lastScanResult?.type === 'error'
        ? 'Scan Gagal'
        : lastScanResult?.type === 'info'
            ? 'Sudah Absen'
            : heroScan?.status === 'Late'
                ? 'Check-In Terlambat'
                : 'Check-In Berhasil!';
    const heroName = lastScanResult?.type === 'error' || lastScanResult?.type === 'info'
        ? lastScanResult.name
        : heroScan?.name ?? lastScanResult?.name ?? null;
    const heroRole = heroScan?.role_category
        ? `${heroScan.role_category}${heroScan.role_name ? ` • ${heroScan.role_name}` : ''}`
        : '-';
    const heroTime = lastScanResult?.type === 'error'
        ? clock
        : heroScan?.time
            ? `${shortTime(heroScan.time)} WIB`
            : clock;
    const heroNote = lastScanResult?.type === 'error'
        ? 'Pastikan kartu member valid dan QR tidak rusak, lalu coba scan ulang.'
        : heroScan?.check_out_time
            ? `Check-out tercatat pukul ${shortTime(heroScan.check_out_time)} WIB.`
            : 'Selamat melayani! Jangan lupa konfirmasi briefing dengan koordinator divisi.';

    const heroStyles: Record<string, { wrapper: string; icon: string; title: string; badge: string; role: string; note: string }> = {
        success: {
            wrapper: 'border-emerald-500/30 bg-emerald-950/40',
            icon: 'bg-emerald-500 text-emerald-950',
            title: 'text-emerald-200',
            badge: 'border-emerald-500/40 bg-emerald-950/80 text-emerald-300',
            role: 'text-emerald-300/80',
            note: 'border-emerald-500/20 bg-black/30 text-emerald-200',
        },
        late: {
            wrapper: 'border-amber-500/30 bg-amber-950/30',
            icon: 'bg-amber-500 text-amber-950',
            title: 'text-amber-200',
            badge: 'border-amber-500/40 bg-amber-950/80 text-amber-300',
            role: 'text-amber-300/80',
            note: 'border-amber-500/20 bg-black/30 text-amber-200',
        },
        info: {
            wrapper: 'border-amber-500/30 bg-amber-950/30',
            icon: 'bg-amber-500 text-amber-950',
            title: 'text-amber-200',
            badge: 'border-amber-500/40 bg-amber-950/80 text-amber-300',
            role: 'text-amber-300/80',
            note: 'border-amber-500/20 bg-black/30 text-amber-200',
        },
        error: {
            wrapper: 'border-rose-500/30 bg-rose-950/30',
            icon: 'bg-rose-500 text-rose-950',
            title: 'text-rose-200',
            badge: 'border-rose-500/40 bg-rose-950/80 text-rose-300',
            role: 'text-rose-300/80',
            note: 'border-rose-500/20 bg-black/30 text-rose-200',
        },
    };
    const heroStyle = heroStyles[heroTone];

    const tabButton = (tab: RosterTab, label: string, count: number, countClass: string) => {
        const isActive = rosterTab === tab;

        return (
            <button
                type="button"
                onClick={() => selectTab(tab)}
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                        ? 'border border-slate-700/80 bg-[#1E2636] text-white shadow-sm'
                        : 'border border-transparent text-slate-400 hover:text-white'
                }`}
            >
                <span>{label}</span>
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${countClass}`}>
                    {count}
                </span>
            </button>
        );
    };

    return (
        <>
            <Head title="Scan QR Member" />
            <div className="min-h-screen bg-[#0B0F17] font-sans text-slate-100 antialiased">
                <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#121722]/90 shadow-md backdrop-blur-md">
                    <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
                        <Link href="/dashboard" className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 bg-white p-0.5 shadow-sm shadow-orange-900/20">
                                <AppLogoIcon className="h-7 w-7 object-contain" />
                            </span>
                            <span className="hidden flex-col sm:flex">
                                <span className="text-sm leading-tight font-bold tracking-tight text-white">ESC Planning Center</span>
                                <span className="text-[10px] leading-tight text-slate-400">Admin Absensi</span>
                            </span>
                        </Link>

                        <span className="hidden h-7 w-px bg-slate-800 md:block" />

                        <Select
                            value={selectedEventId}
                            onValueChange={handleEventChange}
                            disabled={isScanning}
                            open={eventPickerOpen}
                            onOpenChange={setEventPickerOpen}
                        >
                            <SelectTrigger className="h-10 w-full max-w-[320px] gap-2 border-slate-700/70 bg-[#181F2C] text-left text-xs font-semibold text-slate-100 sm:w-[280px]">
                                <SelectValue placeholder="Pilih event aktif..." />
                            </SelectTrigger>
                            <SelectContent className="max-w-[380px]">
                                {volunteerEvents.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel>Pelayanan (Doa Persiapan Ibadah)</SelectLabel>
                                        {volunteerEvents.map((event) => (
                                            <SelectItem key={event.id} value={String(event.id)}>
                                                <span className="truncate">{event.title}</span>
                                                {event.date && (
                                                    <span className="text-muted-foreground">{formatEventDate(event.date)}</span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {classParticipantEvents.length > 0 && (
                                    <SelectGroup>
                                        <SelectLabel>Peserta Kelas/Sesi</SelectLabel>
                                        {classParticipantEvents.map((event) => (
                                            <SelectItem key={event.id} value={String(event.id)}>
                                                <span className="truncate">{event.title}</span>
                                                {event.date && (
                                                    <span className="text-muted-foreground">{formatEventDate(event.date)}</span>
                                                )}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                )}
                                {events.length === 0 && (
                                    <div className="px-2 py-3 text-xs text-slate-400">Tidak ada event aktif.</div>
                                )}
                            </SelectContent>
                        </Select>

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3 py-1.5 text-emerald-400 shadow-inner lg:flex">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                <span className="font-mono text-[11px] font-semibold">{clock} WIB</span>
                                <span className="text-[10px] font-bold tracking-wide text-emerald-300">LIVE SYNC</span>
                            </div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setGuideOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                            >
                                <HelpCircle className="h-4 w-4" />
                                <span className="hidden xl:inline">Panduan</span>
                            </button>
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#181F2C] px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
                            >
                                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                <span className="hidden xl:inline">Kiosk Mode</span>
                            </button>
                            <span className="hidden h-7 w-px bg-slate-800 sm:block" />
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 border border-slate-700 ring-2 ring-orange-500/20">
                                    {authUser?.avatar ? <AvatarImage src={authUser.avatar} alt={userName} /> : null}
                                    <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-slate-200">
                                        {initialsOf(userName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden flex-col text-left sm:flex">
                                    <span className="max-w-[140px] truncate text-[11px] leading-tight font-bold text-white">{userName}</span>
                                    <span className="text-[10px] font-medium text-slate-400">{userRole}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
                    <section className="flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-[#141A24] p-3 shadow-lg xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-1 items-start gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                                        {activeEvent?.title ?? 'Pilih event untuk memulai'}
                                    </h1>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${
                                        isLive
                                            ? 'border-emerald-500/40 bg-emerald-950/70 text-emerald-300'
                                            : 'border-slate-600/60 bg-slate-800/80 text-slate-300'
                                    }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'}`} />
                                        {isLive ? 'Live / Ongoing' : 'Terjadwal'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 sm:text-xs">
                                    <span className="inline-flex items-center gap-1.5">
                                        <CalendarDays className="h-4 w-4 text-orange-400" />
                                        {formatEventDate(eventDate) || '-'}
                                        {eventStartTime ? ` • ${shortTime(eventStartTime)} WIB` : ''}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-slate-300" />
                                        {activeEvent?.location || '-'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 font-medium text-orange-400">
                                        <Timer className="h-4 w-4" />
                                        Toleransi: {toleranceTime ? `${shortTime(toleranceTime)} WIB` : '-'}
                                    </span>
                                </div>
                                {sessions.length > 0 && (
                                    <div className="pt-1">
                                        <Select value={selectedSessionId || 'all'} onValueChange={handleSessionChange} disabled={isScanning}>
                                            <SelectTrigger className="h-8 w-auto gap-2 border-emerald-500/20 bg-emerald-500/10 px-3 text-[11px] font-semibold text-emerald-100">
                                                <SelectValue placeholder="Pilih sesi..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Doa Persiapan Ibadah</SelectItem>
                                                {sessions.map((session) => (
                                                    <SelectItem key={session.id} value={String(session.id)}>
                                                        {session.title} ({session.date})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setEventPickerOpen(true)}
                                disabled={isScanning}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-[#1B2332] px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:bg-[#232D3F] disabled:opacity-50"
                            >
                                <RefreshCw className="h-4 w-4 text-slate-300" />
                                Ganti Event
                            </button>
                            <Link
                                href="/events"
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-[#1B2332] px-3 py-2 text-xs font-semibold text-slate-200 shadow-sm transition-all hover:bg-[#232D3F]"
                            >
                                <Settings2 className="h-4 w-4 text-slate-300" />
                                Pengaturan Toleransi
                            </Link>
                            <button
                                type="button"
                                onClick={exportCsv}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#F58220] px-3 py-2 text-xs font-semibold text-white shadow-md shadow-orange-950/40 transition-all hover:bg-[#ff9336]"
                            >
                                <Download className="h-4 w-4" />
                                Ekspor Data
                            </button>
                        </div>
                    </section>

                    <section className="grid w-full grid-cols-3 gap-2 sm:gap-2.5">
                        <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#141A24] p-2 shadow-md sm:p-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[9px] leading-tight font-semibold tracking-wide text-slate-400 uppercase sm:text-[10px]">
                                    {activeEvent?.attendance_type === 'class_participant' ? 'Total Peserta Kelas' : 'Total Volunteer Bertugas'}
                                </span>
                                <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-700/70 bg-slate-800 text-slate-200 sm:flex">
                                    <Users className="h-3.5 w-3.5" />
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                                <span className="text-xl leading-none font-bold text-white sm:text-2xl">{stats.total}</span>
                                <span className="text-[10px] font-medium text-slate-400">Orang</span>
                                <span className="hidden text-[10px] font-medium text-slate-500 sm:inline">· {divisionCount} Divisi · {activeEvent?.expected ?? 0} Target</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#141A24] p-2 shadow-md sm:p-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[9px] leading-tight font-semibold tracking-wide text-emerald-400 uppercase sm:text-[10px]">Sudah Absen Masuk</span>
                                <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-950/60 text-emerald-400 sm:flex">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                                <span className="text-xl leading-none font-bold text-emerald-400 sm:text-2xl">{stats.checked_in}</span>
                                <span className="text-[10px] font-bold text-emerald-400">({checkedPercentage}%)</span>
                                <span className="hidden text-[10px] font-medium text-slate-500 sm:inline">· {stats.on_time} tepat · {stats.late} terlambat</span>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#141A24] p-2 shadow-md sm:p-2.5">
                            <div className="flex items-start justify-between gap-2">
                                <span className="text-[9px] leading-tight font-semibold tracking-wide text-rose-400 uppercase sm:text-[10px]">Belum Absen</span>
                                <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-950/60 text-rose-400 sm:flex">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                                <span className="text-xl leading-none font-bold text-rose-400 sm:text-2xl">{stats.pending}</span>
                                <span className="text-[10px] font-medium text-rose-400">({pendingPercentage}%)</span>
                                <span className="hidden text-[10px] font-medium text-slate-500 sm:inline">· {totalScanned} scan</span>
                            </div>
                        </div>
                    </section>

                    <div className="flex w-full flex-col gap-1.5 rounded-xl border border-slate-800/80 bg-[#141A24] p-2 shadow-md sm:p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                            <span className="font-semibold text-white">Progres Kehadiran Menjelang Ibadah</span>
                            <span className="text-slate-400">
                                {stats.checked_in} dari {stats.total} Volunteer • <strong className="text-emerald-400">{checkedPercentage}%</strong>
                            </span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full border border-slate-700/40 bg-slate-800/90">
                            <div className="h-full rounded-l-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all duration-500" style={{ width: `${onTimePercentage}%` }} />
                            <div className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500" style={{ width: `${latePercentage}%` }} />
                            <div className="h-full flex-1 bg-transparent" />
                        </div>
                        <div className="flex flex-wrap justify-between gap-2 text-[9px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Tepat Waktu ({Math.round(onTimePercentage)}%)</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Terlambat ({Math.round(latePercentage)}%)</span>
                            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-slate-600" /> Belum Hadir ({Math.round(pendingBarPercentage)}%)</span>
                        </div>
                    </div>

                    <div className="grid w-full grid-cols-1 items-start gap-2.5 sm:gap-3 lg:grid-cols-12">
                        <div className="flex w-full flex-col gap-2.5 sm:gap-3 lg:col-span-5">
                            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-800/90 bg-[#141A24] p-3 shadow-md sm:p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="h-5 w-5 text-[#F58220]" />
                                        <span className="text-sm font-bold text-white">QR Camera Scanner</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        isScanning
                                            ? 'border-emerald-500/30 bg-emerald-950/70 text-emerald-300'
                                            : 'border-slate-700/60 bg-slate-800/70 text-slate-300'
                                    }`}>
                                        <span className={`h-2 w-2 rounded-full ${isScanning ? 'animate-pulse bg-emerald-400' : 'bg-slate-400'}`} />
                                        {isScanning ? 'Kamera Aktif' : 'Kamera Siaga'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-800 bg-[#0F141E] p-1">
                                    <button
                                        type="button"
                                        onClick={() => void selectScanMode('camera')}
                                        disabled={processing}
                                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
                                            scanMode === 'camera'
                                                ? 'border border-slate-700/80 bg-[#1E2636] text-orange-400 shadow-sm'
                                                : 'border border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Aperture className="h-4 w-4" />
                                        Kamera Perangkat
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void selectScanMode('usb')}
                                        disabled={processing}
                                        className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-semibold transition-all ${
                                            scanMode === 'usb'
                                                ? 'border border-slate-700/80 bg-[#1E2636] text-orange-400 shadow-sm'
                                                : 'border border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <Keyboard className="h-4 w-4" />
                                        Scanner USB
                                    </button>
                                </div>

                                <div className="relative h-[210px] w-full overflow-hidden rounded-xl border border-slate-800 bg-[#05070C] sm:h-[230px] lg:h-[240px]">
                                    <div
                                        id="admin-reader"
                                        ref={readerElementRef}
                                        className={isScanning && scanMode === 'camera' ? 'absolute inset-0 z-10' : 'hidden'}
                                    />

                                    {!isScanning && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,_rgba(245,130,32,0.16),_transparent_58%)] px-6 text-center">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-400 shadow-[0_0_40px_rgba(245,130,32,0.15)]">
                                                {scanMode === 'camera' ? <Aperture className="h-7 w-7" /> : <Keyboard className="h-7 w-7" />}
                                            </div>
                                            {scanMode === 'camera' ? (
                                                <>
                                                    <div>
                                                        <h2 className="text-sm font-bold text-white">Siap memindai kartu</h2>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">Pilih event, lalu arahkan QR kartu ke kamera.</p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        size="lg"
                                                        onClick={() => void startScanner()}
                                                        disabled={!selectedEventId}
                                                        className="h-9 rounded-xl bg-[#F58220] px-5 text-xs font-semibold text-white shadow-lg shadow-orange-950/40 hover:bg-[#ff9336]"
                                                    >
                                                        <Aperture className="h-4 w-4" />
                                                        Mulai Scan
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <div>
                                                        <h2 className="text-sm font-bold text-white">Scanner USB siap</h2>
                                                        <p className="mt-0.5 text-[10px] text-slate-400">Arahkan scanner ke QR kartu member.</p>
                                                    </div>
                                                    <form onSubmit={handleUsbScan} className="w-full max-w-sm">
                                                        <Input
                                                            ref={usbInputRef}
                                                            autoFocus
                                                            aria-label="Input scanner USB"
                                                            placeholder="Scan QR kartu member..."
                                                            disabled={!selectedEventId || processing}
                                                            className="h-10 border-slate-700/80 bg-[#0F141E] text-center text-xs text-white placeholder:text-slate-500"
                                                        />
                                                    </form>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {isScanning && scanMode === 'camera' && (
                                        <div className="pointer-events-none absolute inset-0 z-20">
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/80 via-transparent to-[#0B0F17]/50" />
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-black/60 px-2.5 py-1 text-[10px] font-bold text-rose-300">
                                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                                                REC
                                            </div>
                                            <div className="absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-44 sm:w-44">
                                                <div className="absolute -top-1 -left-1 h-8 w-8 rounded-tl-lg border-t-4 border-l-4 border-[#F58220] shadow-[0_0_8px_#f58220]" />
                                                <div className="absolute -top-1 -right-1 h-8 w-8 rounded-tr-lg border-t-4 border-r-4 border-[#F58220] shadow-[0_0_8px_#f58220]" />
                                                <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-lg border-b-4 border-l-4 border-[#F58220] shadow-[0_0_8px_#f58220]" />
                                                <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-br-lg border-r-4 border-b-4 border-[#F58220] shadow-[0_0_8px_#f58220]" />
                                                <div className="absolute inset-4 overflow-hidden rounded-lg border border-dashed border-[#F58220]/50 bg-[#F58220]/10">
                                                    <div className="absolute top-0 right-0 left-0 h-1 animate-[bounce_2.5s_infinite] bg-gradient-to-r from-transparent via-[#F58220] to-transparent shadow-[0_0_16px_#f58220]" />
                                                </div>
                                            </div>
                                            <div className="absolute right-3 bottom-3 left-3 flex items-center justify-center gap-2 rounded-lg border border-slate-700/60 bg-[#0F141E]/90 px-3 py-1.5 text-center text-[10px] text-slate-200 backdrop-blur-md">
                                                <QrCode className="h-4 w-4 text-[#F58220]" />
                                                Arahkan QR kartu member ke dalam kotak
                                            </div>
                                        </div>
                                    )}

                                    {processing && (
                                        <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 animate-pulse rounded-full bg-[#F58220] px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
                                            Memproses...
                                        </div>
                                    )}

                                    {lastScanResult?.type === 'error' && (
                                        <div className="absolute top-14 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-rose-400/50 bg-rose-600/90 px-4 py-2.5 text-white shadow-2xl backdrop-blur-md">
                                            <AlertTriangle className="h-5 w-5" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold tracking-widest uppercase opacity-80">
                                                    Gagal
                                                </span>
                                                <span className="max-w-[220px] truncate text-sm font-bold">{lastScanResult.name}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="inline-flex rounded-lg border border-slate-800 bg-[#0F141E] p-1">
                                        <button
                                            type="button"
                                            onClick={() => setScanType('check_in')}
                                            disabled={processing || isScanning}
                                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                                                scanType === 'check_in'
                                                    ? 'border border-slate-700/80 bg-[#1E2636] text-orange-400'
                                                    : 'border border-transparent text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <UserCheck className="h-3.5 w-3.5" />
                                            Masuk
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScanType('check_out')}
                                            disabled={processing || isScanning}
                                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all ${
                                                scanType === 'check_out'
                                                    ? 'border border-slate-700/80 bg-[#1E2636] text-orange-400'
                                                    : 'border border-transparent text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            Pulang
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-400">
                                            <input
                                                type="checkbox"
                                                checked={soundEnabled}
                                                onChange={(event) => setSoundEnabled(event.target.checked)}
                                                className="h-3.5 w-3.5 rounded border-slate-600 bg-[#0F141E] accent-[#F58220]"
                                            />
                                            Bunyi konfirmasi
                                        </label>
                                        {isScanning && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => void stopScanner()}
                                                className="h-8 gap-1.5 text-[11px]"
                                            >
                                                <StopCircle className="h-3.5 w-3.5" />
                                                Stop
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`flex flex-col gap-1.5 rounded-xl border p-2.5 shadow-md lg:p-2 ${heroName ? heroStyle.wrapper : 'border-slate-800/90 bg-[#141A24]'}`}>
                                {heroName ? (
                                    <>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${heroStyle.icon}`}>
                                                    {heroTone === 'error' ? <AlertTriangle className="h-5 w-5" /> : heroTone === 'info' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                                </span>
                                                <span className={`text-sm font-bold ${heroStyle.title}`}>{heroTitle}</span>
                                            </div>
                                            <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${heroStyle.badge}`}>
                                                {heroTime}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-base font-bold text-white">{heroName}</span>
                                            {lastScanResult?.type !== 'error' && heroScan?.member_id && (
                                                <span className="font-mono text-[11px] text-slate-400">(ID: {heroScan.member_id})</span>
                                            )}
                                        </div>
                                        {lastScanResult?.type !== 'error' && (
                                            <span className={`text-[11px] font-medium ${heroStyle.role}`}>{heroRole}</span>
                                        )}
                                        <div className={`mt-0.5 rounded-lg border p-2 text-[10px] leading-relaxed ${heroStyle.note}`}>
                                            {heroNote}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2.5 text-slate-400">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                                            <QrCode className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-200">Belum ada scan</p>
                                            <p className="text-[11px] text-slate-400">Hasil check-in terakhir akan tampil di sini.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleManualSubmit} className="flex flex-col gap-1.5 rounded-xl border border-slate-800/90 bg-[#141A24] p-2.5 shadow-md lg:p-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Keyboard className="h-5 w-5 text-[#F58220]" />
                                        <span className="text-sm font-bold text-white">Input Manual ID / NIK</span>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">Alternatif Scan</span>
                                </div>
                                <p className="text-[11px] text-slate-400 lg:hidden">
                                    Gunakan jika QR Code rusak, kamera bermasalah, atau volunteer belum memiliki kartu fisik.
                                </p>
                                <div className="mt-0.5 flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            value={manualCode}
                                            onChange={(event) => setManualCode(event.target.value)}
                                            disabled={!selectedEventId || processing}
                                            placeholder="Masukkan ID jemaat atau hasil scan..."
                                            className="h-10 border-slate-700/80 bg-[#0F141E] pl-9 text-xs text-white placeholder:text-slate-500 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220]"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={!selectedEventId || processing || !manualCode.trim()}
                                        className="h-10 shrink-0 gap-1 bg-[#F58220] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#ff9336]"
                                    >
                                        Check-In
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:col-span-7">
                            <div className="flex flex-col gap-2.5 rounded-xl border border-slate-800/90 bg-[#141A24] p-3 shadow-md">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="inline-flex flex-wrap rounded-lg border border-slate-800 bg-[#0F141E] p-1">
                                        {tabButton('checked', 'Sudah Absen', stats.checked_in, 'bg-emerald-500 text-emerald-950')}
                                        {tabButton('pending', 'Belum Absen', stats.pending, 'border border-rose-500/30 bg-rose-950 text-rose-300')}
                                        {tabButton('all', 'Semua Terdaftar', stats.total, 'bg-slate-800 text-slate-300')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={loadLatestData}
                                        className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                                        title="Muat ulang data kehadiran"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        Live Sync
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                                    <div className="relative sm:col-span-5">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            value={search}
                                            onChange={(event) => {
                                                setSearch(event.target.value);
                                                setPageIndex(1);
                                            }}
                                            placeholder="Cari nama volunteer atau ID..."
                                            className="h-10 border-slate-700/80 bg-[#0F141E] pl-9 text-xs text-white placeholder:text-slate-500 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220]"
                                        />
                                    </div>
                                    <select
                                        value={departmentFilter}
                                        onChange={(event) => {
                                            setDepartmentFilter(event.target.value);
                                            setPageIndex(1);
                                        }}
                                        className="h-10 rounded-lg border border-slate-700/80 bg-[#0F141E] px-3 text-xs text-slate-200 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] focus:outline-none sm:col-span-4"
                                    >
                                        <option value="">Semua Divisi ({divisionCount})</option>
                                        {departments.map((department) => (
                                            <option key={department} value={department}>{department}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => {
                                            setStatusFilter(event.target.value);
                                            setPageIndex(1);
                                        }}
                                        className="h-10 rounded-lg border border-slate-700/80 bg-[#0F141E] px-3 text-xs text-slate-200 focus:border-[#F58220] focus:ring-1 focus:ring-[#F58220] focus:outline-none sm:col-span-3"
                                    >
                                        <option value="all">Semua Status</option>
                                        <option value="present">Tepat Waktu</option>
                                        <option value="late">Terlambat</option>
                                        <option value="pending">Belum Absen</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#141A24] shadow-md">
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[760px] border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-800 bg-[#0F141E] text-[10px] tracking-wider text-slate-400 uppercase">
                                                <th className="w-12 px-4 py-2 text-center font-semibold">No</th>
                                                <th className="px-4 py-2 font-semibold">Volunteer</th>
                                                <th className="px-4 py-2 font-semibold">Bagian / Peran</th>
                                                <th className="px-4 py-2 font-semibold">Jam Absen</th>
                                                <th className="px-4 py-2 font-semibold">Status</th>
                                                <th className="px-4 py-2 font-semibold">Catatan &amp; Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                                            {pagedRoster.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-10 text-center">
                                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                                            <Users className="h-10 w-10 opacity-30" />
                                                            <p className="text-xs">
                                                                {roster.length === 0
                                                                    ? 'Belum ada data volunteer untuk event ini.'
                                                                    : 'Tidak ada data yang cocok dengan filter.'}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            {pagedRoster.map((member, index) => {
                                                const isRecent = Boolean(lastScanResult && heroScan?.member_id === member.member_id);
                                                const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                                                return (
                                                    <tr
                                                        key={member.id}
                                                        className={`group transition-colors hover:bg-slate-800/40 ${isRecent ? 'bg-emerald-950/25' : ''}`}
                                                    >
                                                        <td className="px-4 py-2 text-center font-mono text-[11px] text-slate-500">{rowNumber}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center gap-2.5">
                                                                <Avatar className={`h-8 w-8 border ${member.status ? 'border-slate-700' : 'border-slate-700/70'}`}>
                                                                    {member.foto_url ? <AvatarImage src={member.foto_url} alt={member.name} /> : null}
                                                                    <AvatarFallback className="bg-slate-800 text-[10px] font-bold text-slate-300">
                                                                        {initialsOf(member.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex min-w-0 flex-col">
                                                                    <span className="flex items-center gap-1 truncate text-xs font-bold text-white">
                                                                        {member.name}
                                                                        {member.scan_time && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />}
                                                                    </span>
                                                                    <span className="font-mono text-[10px] font-semibold text-slate-400">{member.member_id}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className="inline-flex rounded-md border border-slate-700/60 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                                                                {member.role_category || '—'}
                                                            </span>
                                                            {member.role_name && (
                                                                <span className="mt-1 block text-[10px] text-slate-400">{member.role_name}</span>
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-2 font-mono text-[11px] font-medium ${member.status === 'Late' ? 'text-amber-400' : 'text-slate-200'}`}>
                                                            {member.scan_time ? `${shortTime(member.scan_time)} WIB` : '—'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {member.status === 'Present' && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> HADIR
                                                                </span>
                                                            )}
                                                            {member.status === 'Late' && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/60 px-2.5 py-1 text-[10px] font-bold text-amber-300">
                                                                    <Timer className="h-3 w-3" /> TERLAMBAT
                                                                </span>
                                                            )}
                                                            {!member.status && (
                                                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-[10px] font-bold text-slate-400">
                                                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> BELUM ABSEN
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="max-w-[130px] truncate text-[11px] text-slate-400">
                                                                    {member.check_out_time
                                                                        ? `Pulang ${shortTime(member.check_out_time)}`
                                                                        : member.scan_time
                                                                            ? 'Check-in tercatat'
                                                                            : member.response_status === 'pending'
                                                                                ? 'Belum konfirmasi jadwal'
                                                                                : 'Belum absen'}
                                                                </span>
                                                                {processing ? null : member.scan_time ? (
                                                                    !member.check_out_time && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => processMemberScan(member.member_id, 'check_out')}
                                                                            title="Catat pulang"
                                                                            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                                                                        >
                                                                            <LogOut className="h-4 w-4" />
                                                                        </button>
                                                                    )
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => processMemberScan(member.member_id, 'check_in')}
                                                                        title="Absen sekarang"
                                                                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                                                                    >
                                                                        <UserCheck className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-800 bg-[#0F141E] px-4 py-2 text-[11px] text-slate-400 sm:flex-row">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span>
                                            Menampilkan <strong className="text-white">{pagedRoster.length}</strong> dari{' '}
                                            <strong className="text-white">{filteredRoster.length}</strong> data kehadiran live
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-slate-600" />
                                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Terhubung Realtime
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setPageIndex((value) => Math.max(1, value - 1))}
                                            disabled={currentPage <= 1}
                                            className="rounded-md border border-slate-800 bg-[#1B2332] p-1.5 text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-40"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        {pageNumbers.map((pageNumber) => (
                                            <button
                                                key={pageNumber}
                                                type="button"
                                                onClick={() => setPageIndex(pageNumber)}
                                                className={`rounded-md px-3 py-1 text-[11px] transition-colors ${
                                                    pageNumber === currentPage
                                                        ? 'bg-[#F58220] font-semibold text-white shadow-sm'
                                                        : 'border border-slate-800 bg-[#1B2332] text-slate-300 hover:bg-slate-800'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setPageIndex((value) => Math.min(pageCount, value + 1))}
                                            disabled={currentPage >= pageCount}
                                            className="rounded-md border border-slate-800 bg-[#1B2332] p-1.5 text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-40"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <DialogContent className="border-slate-800 bg-[#141A24] text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                            <HelpCircle className="h-5 w-5 text-[#F58220]" />
                            Panduan Scan QR
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-400">
                            Alur singkat mencatat kehadiran volunteer di kiosk absensi.
                        </DialogDescription>
                    </DialogHeader>
                    <ol className="flex flex-col gap-2 text-xs text-slate-300">
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">1. Pilih event aktif.</span> Pastikan event dan sesi sudah sesuai jadwal.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">2. Mulai scan.</span> Gunakan kamera perangkat atau scanner USB, lalu arahkan QR kartu member.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">3. QR rusak?</span> Masukkan ID jemaat pada Input Manual, atau gunakan tombol absen di daftar volunteer.
                        </li>
                        <li className="rounded-lg border border-slate-800 bg-[#0F141E] p-2.5">
                            <span className="font-semibold text-white">4. Pantau progres.</span> Tab Sudah Absen, Belum Absen, dan Semua Terdaftar diperbarui realtime.
                        </li>
                    </ol>
                </DialogContent>
            </Dialog>

            <Dialog open={eventNoticeOpen} onOpenChange={setEventNoticeOpen}>
                <DialogContent className="border-slate-800 bg-[#141A24] text-slate-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-[#F58220]">
                                <CalendarCheck2 className="h-5 w-5" />
                            </span>
                            Pemberitahuan
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <h3 className="text-lg leading-snug font-extrabold text-white">Pastikan Event Sudah Sesuai</h3>
                        <DialogDescription className="text-xs leading-relaxed text-slate-300">
                            Sebelum melakukan absensi dengan scan QR Code, pastikan event ibadah yang dipilih sudah benar dan sesuai.
                        </DialogDescription>
                        {activeEvent ? (
                            <div className="rounded-lg border border-slate-800 bg-[#0F141E] px-3 py-2.5">
                                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Event terpilih</p>
                                <p className="mt-0.5 text-sm font-semibold text-white">{activeEvent.title}</p>
                                <p className="text-[11px] text-slate-400">
                                    {formatEventDate(eventDate) || '-'}
                                    {eventStartTime ? ` • ${shortTime(eventStartTime)} WIB` : ''}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
                                Belum ada event yang dipilih. Pilih event terlebih dahulu sebelum memindai.
                            </div>
                        )}
                        <Button
                            type="button"
                            onClick={() => setEventNoticeOpen(false)}
                            className="h-10 w-full rounded-xl bg-[#F58220] text-xs font-semibold text-white shadow-lg shadow-orange-950/40 hover:bg-[#ff9336]"
                        >
                            Mengerti
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {scanNotice && <ScanResultModal result={scanNotice} onClose={() => setScanNotice(null)} />}
        </>
    );
}

ScanQR.layout = (page: any) => page;
