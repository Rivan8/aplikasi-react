import { Head, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Aperture, History, Keyboard, StopCircle, UserCheck, AlertTriangle, Info } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Event {
    id: number;
    title: string;
    location: string;
    time: string;
    expected: number;
}

interface RecentScan {
    id: number;
    name: string;
    time: string;
    status: 'success' | 'duplicate' | 'error';
}

export default function ScanQR({ events = [] }: { events: Event[] }) {
    const { flash, errors } = usePage().props as any;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerElementRef = useRef<HTMLDivElement | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const isMountedRef = useRef(true);
    const [lastScanResult, setLastScanResult] = useState<{ type: 'success' | 'info' | 'error'; name: string } | null>(null);

    // Recent scans list
    const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(String(events[0].id));
        }
    }, [events]);

    // Handle flash messages dari backend
    useEffect(() => {
        if (flash?.success) {
            // Ekstrak nama dari pesan "Kehadiran berhasil dicatat untuk [NAMA]"
            const match = flash.success.match(/untuk (.+)$/);
            const name = match ? match[1] : 'Member';

            toast.success(flash.success, { duration: 3000 });
            setLastScanResult({ type: 'success', name });

            // Tambahkan ke recent scans
            setRecentScans(prev => [{
                id: Date.now(),
                name: name,
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                status: 'success',
            }, ...prev].slice(0, 20));
        }

        if (flash?.error) {
            toast.error(flash.error, { duration: 4000 });

            // Tentukan apakah ini QR tidak dikenali
            const isInvalidQr = flash.error.includes('tidak dikenali');
            setLastScanResult({
                type: 'error',
                name: isInvalidQr ? 'QR Tidak Valid' : 'Error',
            });

            // Tambahkan ke recent scans sebagai error
            setRecentScans(prev => [{
                id: Date.now(),
                name: isInvalidQr ? 'QR Tidak Dikenali' : 'Gagal',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                status: 'error',
            }, ...prev].slice(0, 20));
        }

        if (flash?.info) {
            // Sudah pernah absen — ekstrak nama
            const match = flash.info.match(/^(.+?) sudah/);
            const name = match ? match[1] : 'Member';

            toast.info(flash.info, { duration: 3000 });
            setLastScanResult({ type: 'info', name });

            // Tambahkan ke recent scans sebagai duplicate
            setRecentScans(prev => [{
                id: Date.now(),
                name: name + ' (sudah hadir)',
                time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                status: 'duplicate',
            }, ...prev].slice(0, 20));
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

    const processNikScan = useCallback((nik: string) => {
        if (processing) return;

        setProcessing(true);
        setLastScanResult(null);

        // Pause scanner sementara
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause();
        }

        router.post('/attendance/scan-member', {
            event_id: selectedEventId,
            nik: nik
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
    }, [processing, selectedEventId]);

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

                        await scanner.start(
                            { facingMode: "environment" },
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                            },
                            (decodedText) => {
                                processNikScan(decodedText);
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
    }, [selectedEventId, processNikScan]);

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

    const activeEvent = events.find(e => String(e.id) === selectedEventId);
    const successCount = recentScans.filter(s => s.status === 'success').length;

    return (
        <>
            <Head title="Scan Kartu Member" />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header Event Card */}
                <Card className="border bg-card shadow-sm">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10">
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Live Scanning</span>
                            </div>
                            
                            <div className="w-full max-w-md pt-2">
                                <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={isScanning}>
                                    <SelectTrigger className="h-12 text-lg font-bold">
                                        <SelectValue placeholder="Pilih Event Aktif..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {events.map(ev => (
                                            <SelectItem key={ev.id} value={String(ev.id)}>{ev.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {activeEvent && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    {activeEvent.location} • {activeEvent.time}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0">
                            <div className="flex items-center divide-x divide-border rounded-xl border bg-muted/50 py-3 px-6">
                                <div className="flex flex-col items-center pr-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Berhasil Scan</span>
                                    <span className="text-2xl font-bold text-primary leading-none">{successCount}</span>
                                </div>
                                <div className="flex flex-col items-center pl-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Expected</span>
                                    <span className="text-2xl font-bold text-foreground leading-none">{activeEvent?.expected || 0}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Scanner Section */}
                    <Card className="lg:col-span-2 overflow-hidden border shadow-sm flex flex-col">
                        <CardHeader className="border-b px-6 py-4 flex flex-row items-center justify-between bg-card">
                            <div className="flex items-center gap-2">
                                <Aperture className={`h-5 w-5 ${isScanning ? 'text-primary' : 'text-muted-foreground'}`} />
                                <CardTitle className="text-lg font-semibold text-foreground">Scanner Kartu Jemaat</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" className="h-9 gap-2 font-medium">
                                <Keyboard className="h-4 w-4" />
                                Manual Entry
                            </Button>
                        </CardHeader>
                        
                        <div className="relative flex-1 min-h-[400px] md:min-h-[500px] bg-[#1A1A1F] flex flex-col items-center justify-center p-6 overflow-hidden">
                            {/* Reader element — selalu ada di DOM */}
                            <div
                                ref={readerElementRef}
                                id="admin-reader"
                                className="w-full max-w-md rounded-lg overflow-hidden"
                                style={{
                                    minHeight: isScanning ? '300px' : '1px',
                                    height: isScanning ? 'auto' : '1px',
                                    width: isScanning ? '100%' : '1px',
                                    opacity: isScanning ? 1 : 0,
                                    position: isScanning ? 'relative' : 'absolute',
                                    overflow: 'hidden',
                                }}
                            />

                            {!isScanning && (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Button size="lg" onClick={startScanner} className="h-14 px-8 text-lg">
                                        Mulai Scan Kartu
                                    </Button>
                                    <p className="text-muted-foreground text-sm">Pilih event terlebih dahulu sebelum mulai.</p>
                                </div>
                            )}

                            {isScanning && (
                                <div className="flex flex-col items-center z-20 w-full">
                                    {/* Hasil scan terakhir */}
                                    {lastScanResult && (
                                        <div className={`mt-4 mb-2 px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                                            lastScanResult.type === 'success'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : lastScanResult.type === 'info'
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                        }`}>
                                            {lastScanResult.type === 'success' && <UserCheck className="w-5 h-5" />}
                                            {lastScanResult.type === 'info' && <Info className="w-5 h-5" />}
                                            {lastScanResult.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                                            <span>
                                                {lastScanResult.type === 'success' && `✓ ${lastScanResult.name} — Berhasil!`}
                                                {lastScanResult.type === 'info' && `${lastScanResult.name} — Sudah tercatat hadir`}
                                                {lastScanResult.type === 'error' && `✗ ${lastScanResult.name}`}
                                            </span>
                                        </div>
                                    )}

                                    {processing && (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium shadow-lg animate-pulse">
                                            Memproses...
                                        </div>
                                    )}

                                    <Button variant="destructive" className="mt-4 gap-2" onClick={stopScanner}>
                                        <StopCircle className="w-4 h-4" /> Stop Scanner
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Scans Section */}
                    <Card className="border shadow-sm bg-card flex flex-col">
                        <CardHeader className="border-b px-6 py-5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Riwayat Scan</CardTitle>
                            <History className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto min-h-[400px]">
                            {recentScans.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 py-20">
                                    <History className="w-12 h-12 mb-4 opacity-20" />
                                    <p>Belum ada scan.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-border/50">
                                    {recentScans.map((scan) => (
                                        <div key={scan.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3.5">
                                                <Avatar className={`h-10 w-10 border ${
                                                    scan.status === 'success' ? 'border-emerald-300' 
                                                    : scan.status === 'duplicate' ? 'border-amber-300' 
                                                    : 'border-red-300'
                                                }`}>
                                                    <AvatarFallback className={`font-bold text-xs ${
                                                        scan.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' 
                                                        : scan.status === 'duplicate' ? 'bg-amber-500/10 text-amber-600' 
                                                        : 'bg-red-500/10 text-red-600'
                                                    }`}>
                                                        {scan.status === 'success' ? scan.name.substring(0, 2).toUpperCase()
                                                         : scan.status === 'duplicate' ? '⚠'
                                                         : '✗'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-foreground leading-snug">{scan.name}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className="text-[10px] font-medium text-muted-foreground">{scan.time}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={`px-2 py-0 h-5 text-[10px] uppercase font-bold rounded-full ${
                                                        scan.status === 'success'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                                                            : scan.status === 'duplicate'
                                                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                                                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30'
                                                    }`}
                                                >
                                                    {scan.status === 'success' ? 'Hadir' : scan.status === 'duplicate' ? 'Duplikat' : 'Gagal'}
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
        </>
    );
}

ScanQR.layout = {
    breadcrumbs: [
        {
            title: 'Scan QR Member',
            href: '/scan-qr',
        },
    ],
};
