import { Head, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Aperture, CheckCircle2, History, Keyboard, StopCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

export default function ScanQR({ events = [] }: { events: Event[] }) {
    const { flash } = usePage().props as any;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    
    // Untuk dummy recent scans sementara (karena backend belum support history langsung di respon, 
    // tapi kita bisa ambil dari pesan flash success)
    const [recentScans, setRecentScans] = useState<any[]>([]);

    useEffect(() => {
        if (events.length > 0 && !selectedEventId) {
            setSelectedEventId(String(events[0].id));
        }
    }, [events]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            // Tambah ke recent scans (temporary)
            const match = flash.success.match(/untuk (.*)/);
            const name = match ? match[1] : 'Unknown';
            setRecentScans(prev => [{
                id: Date.now(),
                name: name,
                time: 'Baru saja',
                status: 'Present',
            }, ...prev].slice(0, 10));
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const startScanner = async () => {
        if (!selectedEventId) {
            toast.error("Pilih event terlebih dahulu!");
            return;
        }

        setIsScanning(true);

        try {
            scannerRef.current = new Html5Qrcode("admin-reader");
            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Berhasil scan NIK
                    processNikScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore background scan errors
                }
            );
        } catch (err: any) {
            console.error("Error starting scanner", err);
            setIsScanning(false);
            toast.error("Tidak dapat mengakses kamera.");
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
        }
        setIsScanning(false);
    };

    const processNikScan = (nik: string) => {
        if (processing) return;

        setProcessing(true);
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
                // Resume scanner
                if (scannerRef.current && scannerRef.current.isScanning) {
                    setTimeout(() => {
                        scannerRef.current?.resume();
                    }, 2000); // Jeda 2 detik sebelum bisa scan lagi
                }
            }
        });
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const activeEvent = events.find(e => String(e.id) === selectedEventId);

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
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Scanned Today</span>
                                    <span className="text-2xl font-bold text-primary leading-none">{recentScans.length}</span>
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
                            {!isScanning ? (
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <Button size="lg" onClick={startScanner} className="h-14 px-8 text-lg">
                                        Mulai Scan Kartu
                                    </Button>
                                    <p className="text-muted-foreground text-sm">Pilih event terlebih dahulu sebelum mulai.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center w-full">
                                    <div id="admin-reader" className="w-full max-w-md bg-black rounded-lg overflow-hidden" />
                                    
                                    <Button variant="destructive" className="mt-6 gap-2" onClick={stopScanner}>
                                        <StopCircle className="w-4 h-4" /> Stop Scanner
                                    </Button>

                                    {processing && (
                                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium shadow-lg animate-pulse">
                                            Memproses...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Scans Section */}
                    <Card className="border shadow-sm bg-card flex flex-col">
                        <CardHeader className="border-b px-6 py-5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Recent Scans</CardTitle>
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
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                        {scan.name.substring(0, 2).toUpperCase()}
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
                                                    className={`px-2 py-0 h-5 text-[10px] uppercase font-bold rounded-full bg-emerald-50 text-emerald-700 border-emerald-200`}
                                                >
                                                    {scan.status}
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
