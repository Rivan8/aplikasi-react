import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertTriangle, Aperture, History, Info, Keyboard, LogIn, LogOut, StopCircle, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface EventSession {
    id: number;
    session_number: number;
    title: string;
    date: string;
}

interface Event {
    id: number;
    title: string;
    location: string;
    time: string;
    expected: number;
    attendance_type?: string;
    sessions?: EventSession[];
}

interface RecentScan {
    id: number;
    name: string;
    time: string;
    check_out_time?: string | null;
    status: string;
}

export default function ScanQR({
    events = [],
    recentScans = [],
    totalScanned = 0,
    filters = { event_id: '', event_session_id: '' }
}: {
    events: Event[];
    recentScans?: RecentScan[];
    totalScanned?: number;
    filters?: { event_id: string; event_session_id?: string };
}) {
    const { flash } = usePage().props as any;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const usbInputRef = useRef<HTMLInputElement | null>(null);
    const readerElementRef = useRef<HTMLDivElement | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanMode, setScanMode] = useState<'camera' | 'usb'>('camera');
    const [selectedEventId, setSelectedEventId] = useState<string>(filters.event_id || '');
    const [selectedSessionId, setSelectedSessionId] = useState<string>(filters.event_session_id || '');
    const [scanType, setScanType] = useState<'check_in' | 'check_out'>('check_in');
    const [processing, setProcessing] = useState(false);
    const isMountedRef = useRef(true);
    const [lastScanResult, setLastScanResult] = useState<{ type: 'success' | 'info' | 'error'; name: string } | null>(null);

    const activeEvent = events.find(e => String(e.id) === selectedEventId);

    // Auto-refresh data setiap 5 detik untuk sinkronisasi antar komputer
    useEffect(() => {
        const interval = setInterval(() => {
            if (scanMode === 'camera' && !isScanning && !processing) {
                router.reload({
                    only: ['recentScans', 'totalScanned']
                });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isScanning, processing, scanMode]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (filters.event_id && filters.event_id !== selectedEventId) {
            setSelectedEventId(filters.event_id);
        }
        if (filters.event_session_id !== undefined && filters.event_session_id !== selectedSessionId) {
            setSelectedSessionId(filters.event_session_id || '');
        }
    }, [filters.event_id, filters.event_session_id]);

    // Handle event selection change
    const handleEventChange = (value: string) => {
        setSelectedEventId(value);
        setSelectedSessionId('');
        router.get(`/scan-qr`, { event_id: value }, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    const handleSessionChange = (sessionId: string) => {
        const val = sessionId === 'all' ? '' : sessionId;
        setSelectedSessionId(val);
        router.get(`/scan-qr`, { event_id: selectedEventId, event_session_id: val }, {
            preserveState: false,
            preserveScroll: false,
            replace: true
        });
    };

    // Handle flash messages dari backend
    useEffect(() => {
        if (flash?.success) {
            const nameMatch = flash.success.match(/untuk (.+?)(?:\s+\(Terlambat\))?\.?$/)
                ?? flash.success.match(/^Kehadiran (.+?) dicatat/);
            const name = nameMatch ? nameMatch[1] : 'Member';
            toast.success(flash.success, { duration: 3000 });
            setLastScanResult({ type: 'success', name });
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
            toast.info(flash.info, { duration: 3000 });
            setLastScanResult({ type: 'info', name });
        }
    }, [flash]);

    // Cleanup scanner saat unmount
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

    const processMemberScan = useCallback((scan: string) => {
        if (processing) return;

        setProcessing(true);
        setLastScanResult(null);

        // Pause scanner sementara
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause();
        }

        router.post('/attendance/scan-member', {
            event_id: selectedEventId,
            event_session_id: selectedSessionId || null,
            scan_type: scanType,
            scan,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                // Resume scanner setelah jeda
                if (scannerRef.current) {
                    setTimeout(() => {
                        try {
                            if (scannerRef.current && scannerRef.current.isScanning) {
                                scannerRef.current.resume();
                            }
                        } catch {
                            // ignore resume errors
                        }
                    }, 2500);
                }
            }
        });
    }, [processing, scanType, selectedEventId, selectedSessionId]);

    const startScanner = useCallback(async () => {
        if (!selectedEventId) {
            toast.error("Pilih event terlebih dahulu!");
            return;
        }

        const element = readerElementRef.current;
        if (!element) {
            toast.error("Elemen scanner tidak ditemukan. Muat ulang halaman.");
            return;
        }

        const elementId = element.id;

        // Bersihkan scanner sebelumnya jika ada
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

        // Tampilkan area scanner terlebih dahulu
        setIsScanning(true);
        setLastScanResult(null);

        // Tunggu React selesai render dan DOM stabil
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(async () => {
                    if (!isMountedRef.current) return;

                    const domElement = document.getElementById(elementId);
                    if (!domElement) {
                        setIsScanning(false);
                        toast.error("Gagal menginisialisasi scanner. Coba muat ulang halaman.");
                        return;
                    }

                    try {
                        const scanner = new Html5Qrcode(elementId);
                        scannerRef.current = scanner;
                        const scanAreaSize = Math.min(560, Math.max(300, Math.floor(domElement.clientWidth * 0.78)));

                        await scanner.start(
                            { facingMode: "environment" },
                            {
                                fps: 10,
                                qrbox: { width: scanAreaSize, height: scanAreaSize },
                            },
                            (decodedText) => {
                                processMemberScan(decodedText);
                            },
                            () => {}
                        );
                    } catch (err: any) {
                        console.error("Error starting scanner:", err);
                        if (isMountedRef.current) {
                            setIsScanning(false);
                            toast.error("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.");
                        }
                    }
                }, 300);
            });
        });
    }, [selectedEventId, processMemberScan]);

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

    const selectScanMode = useCallback(async (mode: 'camera' | 'usb') => {
        if (mode === 'usb' && isScanning) {
            await stopScanner();
        }

        setScanMode(mode);
        setLastScanResult(null);
    }, [isScanning, stopScanner]);

    const handleUsbScan = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEventId || processing) return;

        const scan = usbInputRef.current?.value.trim() || '';
        if (!scan) return;

        if (usbInputRef.current) {
            usbInputRef.current.value = '';
        }
        processMemberScan(scan);
    }, [processing, processMemberScan, selectedEventId]);

    useEffect(() => {
        if (scanMode === 'usb' && selectedEventId && !processing) {
            usbInputRef.current?.focus();
        }
    }, [processing, scanMode, selectedEventId]);

    return (
        <>
            <Head title="Scan Kartu Member" />
            <div className="min-h-screen bg-slate-950 p-4 text-white sm:p-6 lg:p-8">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
                {/* Header Event Card */}
                <Card className="border-white/10 bg-white/[0.06] text-white shadow-2xl shadow-black/20">
                    <CardContent className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center lg:p-6">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10">
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">Admin Live Scanner</span>
                            </div>

                            <div className="w-full max-w-md pt-2 space-y-3">
                                <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isScanning}>
                                    <SelectTrigger className="h-12 border-white/15 bg-white/10 text-lg font-bold text-white">
                                        <SelectValue placeholder="Pilih Event Aktif..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map(ev => (
                                            <SelectItem key={ev.id} value={String(ev.id)}>{ev.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {activeEvent && activeEvent.sessions && activeEvent.sessions.length > 0 && (
                                    <Select value={selectedSessionId || 'all'} onValueChange={handleSessionChange} disabled={isScanning}>
                                        <SelectTrigger className="h-10 border-emerald-300/20 bg-emerald-300/10 text-sm font-semibold text-white">
                                            <SelectValue placeholder="Pilih Sesi Kelas (Semua Sesi)..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Sesi Kelas</SelectItem>
                                            {activeEvent.sessions.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.title} ({s.date})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            {activeEvent && (
                                <p className="mt-2 text-sm text-white/50">
                                    {activeEvent.location} • {activeEvent.time}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0">
                            <div className="flex items-center divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20 px-6 py-3">
                                <div className="flex flex-col items-center pr-6">
                                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">Total Scan</span>
                                    <span className="text-2xl font-bold leading-none text-emerald-300">
                                        {totalScanned} <span className="text-sm font-normal text-white/45">/ {activeEvent?.expected || 0}</span>
                                    </span>
                                </div>
                                <div className="flex flex-col items-center pl-6">
                                    <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/45">Target</span>
                                    <span className="text-2xl font-bold leading-none text-white">{activeEvent?.expected || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Layout */}
                <div className="grid min-h-[calc(100vh-230px)] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    {/* Scanner Section */}
                    <Card className="overflow-hidden border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 lg:min-h-[680px]">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 bg-black/10 px-5 py-4 lg:px-7">
                            <div className="flex items-center gap-2">
                                <Aperture className={`h-5 w-5 ${isScanning ? 'text-primary' : 'text-muted-foreground'}`} />
                                <CardTitle className="text-lg font-semibold text-white">Scan Kartu Jemaat</CardTitle>
                            </div>
                                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                                        <Button
                                            type="button"
                                            variant={scanType === 'check_in' ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => setScanType('check_in')}
                                            disabled={processing || isScanning}
                                        >
                                            <LogIn className="h-4 w-4" />
                                            Masuk
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={scanType === 'check_out' ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-8 gap-2"
                                            onClick={() => setScanType('check_out')}
                                            disabled={processing || isScanning}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Pulang
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 p-1">
                                <Button
                                    type="button"
                                    variant={scanMode === 'camera' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 gap-2"
                                    onClick={() => selectScanMode('camera')}
                                    disabled={processing}
                                >
                                    <Aperture className="h-4 w-4" />
                                    Kamera
                                </Button>
                                <Button
                                    type="button"
                                    variant={scanMode === 'usb' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 gap-2"
                                    onClick={() => selectScanMode('usb')}
                                    disabled={processing}
                                >
                                    <Keyboard className="h-4 w-4" />
                                    Scanner USB
                                </Button>
                            </div>
                        </CardHeader>

                        <div className="relative flex min-h-[620px] flex-1 flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.14),_transparent_45%),#080b12] p-4 sm:min-h-[680px] lg:p-8">
                            <div className="relative h-full min-h-full w-full">
                                {scanMode === 'camera' && (
                                    <div
                                        id="admin-reader"
                                        className={`relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border-2 border-emerald-300/40 bg-black shadow-[0_0_80px_rgba(16,185,129,0.18)] transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'invisible absolute z-0 opacity-0'}`}
                                        style={{ minHeight: '600px' }}
                                        ref={readerElementRef}
                                    />
                                )}

                                {scanMode === 'usb' && (
                                    <form onSubmit={handleUsbScan} className="z-20 flex w-full max-w-md flex-col gap-4">
                                        <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-center">
                                            <Keyboard className="mx-auto mb-3 h-10 w-10 text-primary" />
                                            <h3 className="text-lg font-bold text-white">Scanner USB siap digunakan</h3>
                                            <p className="mt-1 text-sm text-white/70">Arahkan scanner ke QR kartu member.</p>
                                        </div>
                                        <Input
                                            ref={usbInputRef}
                                            autoFocus
                                            aria-label="Input scanner USB"
                                            placeholder="Scan QR kartu member..."
                                            disabled={!selectedEventId || processing}
                                            className="h-14 bg-white text-center text-lg text-black"
                                        />
                                    </form>
                                )}

                                {lastScanResult && (isScanning || scanMode === 'usb') && (
                                    <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in fade-in zoom-in slide-in-from-top-4 duration-300 ${
                                        lastScanResult.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
                                        lastScanResult.type === 'info' ? 'bg-amber-500 text-white border-amber-400' :
                                        'bg-destructive text-white border-destructive/50'
                                    }`}>
                                        {lastScanResult.type === 'success' ? <UserCheck className="w-8 h-8" /> :
                                         lastScanResult.type === 'info' ? <Info className="w-8 h-8" /> :
                                         <AlertTriangle className="w-8 h-8" />}
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                                                {lastScanResult.type === 'success' ? 'Berhasil' :
                                                 lastScanResult.type === 'info' ? 'Sudah Hadir' : 'Gagal'}
                                            </span>
                                            <span className="text-xl font-black leading-tight">{lastScanResult.name}</span>
                                        </div>
                                    </div>
                                )}

                                {scanMode === 'camera' && !isScanning && (
                                    <div className="absolute top-6 left-1/2 z-20 flex w-full -translate-x-1/2 flex-col items-center justify-start space-y-3 px-4 text-center sm:top-8 lg:top-10">
                                        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.15)] sm:h-24 sm:w-24"><Aperture className="h-10 w-10 sm:h-12 sm:w-12" /></div>
                                        <h2 className="text-2xl font-bold text-white">Siap memindai kartu</h2>
                                        <Button size="lg" onClick={startScanner} className="h-14 rounded-xl px-10 text-lg shadow-lg shadow-primary/20">
                                            Mulai Scan Kartu
                                        </Button>
                                        <p className="text-sm text-white/50">Pilih event, lalu arahkan kartu ke kamera.</p>
                                    </div>
                                )}

                                {scanMode === 'camera' && isScanning && (
                                    <div className="flex flex-col items-center z-20">
                                        <Button variant="destructive" className="mt-6 gap-2" onClick={stopScanner}>
                                            <StopCircle className="w-4 h-4" /> Stop Scanner
                                        </Button>

                                    </div>
                                )}

                                {processing && (
                                    <div className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-lg animate-pulse">
                                        Memproses...
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Recent Scans Section */}
                    <Card className="flex flex-col border-white/10 bg-white/[0.06] text-white shadow-2xl shadow-black/20 lg:min-h-[680px]">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 px-5 py-5">
                            <div><CardTitle className="text-lg font-semibold text-white">Scan Terbaru</CardTitle><p className="mt-1 text-xs text-white/45">Hasil scan tampil real-time</p></div>
                            <History className="h-5 w-5 text-emerald-300" />
                        </CardHeader>
                        <CardContent className="min-h-[400px] flex-1 overflow-y-auto p-0">
                            {recentScans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 py-20">
                                    <History className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Belum ada scan.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-3">
                                    {recentScans.map((scan) => (
                                        <div
                                            key={scan.id}
                                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all hover:-translate-y-0.5 ${scan.status === 'Present' ? 'border-emerald-300/20 bg-emerald-400/10 hover:bg-emerald-400/20' : 'border-amber-300/25 bg-amber-400/10 hover:bg-amber-400/20'}`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <Avatar className={`h-10 w-10 shrink-0 border ${scan.status === 'Present' ? 'border-emerald-300/40' : 'border-amber-300/40'}`}>
                                                    <AvatarFallback className={`font-bold text-xs uppercase ${scan.status === 'Present' ? 'bg-emerald-300/20 text-emerald-200' : 'bg-amber-300/20 text-amber-200'}`}>
                                                        {scan.name.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex flex-col">
                                                    <span className="break-words text-sm font-bold leading-snug text-white">{scan.name}</span>
                                                    <span className="mt-1 text-[10px] font-medium text-white/55">
                                                        {scan.check_out_time ? `Pulang ${scan.check_out_time}` : 'Belum check-out'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="whitespace-nowrap text-[10px] font-semibold text-white/65">{scan.time}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={`h-5 rounded-full px-2 text-[10px] font-bold uppercase ${
                                                        scan.status === 'Present' ? 'border-emerald-300/40 bg-emerald-300/20 text-emerald-200' : 'border-amber-300/40 bg-amber-300/20 text-amber-200'
                                                    }`}
                                                >
                                                    {scan.status === 'Present' ? 'Hadir' : 'Terlambat'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            </div>
        </>
    );
}

ScanQR.layout = (page: any) => page;
