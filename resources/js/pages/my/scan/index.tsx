import { Head, router, usePage } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MyScan() {
    const { auth, flash } = usePage().props as any;
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerElementRef = useRef<HTMLDivElement | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
            setScanResult('success');
        }
        if (flash?.error) {
            toast.error(flash.error);
            setScanError(flash.error);
        }
        if (flash?.info) {
            toast.info(flash.info);
            setScanResult('info');
        }
    }, [flash]);

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
    }, []);

    const processQrCode = useCallback((text: string) => {
        // Asumsi format: https://domain.com/attendance/{id}/scan-event
        try {
            const url = new URL(text);
            const path = url.pathname;
            
            if (!path.includes('/attendance/') || !path.includes('/scan-event')) {
                setScanError("QR Code tidak valid untuk absensi event ini.");
                return;
            }

            setProcessing(true);
            router.post(path, {}, {
                onFinish: () => setProcessing(false)
            });
            
        } catch (e) {
            setScanError("Format QR Code tidak dikenali.");
        }
    }, []);

    const startScanner = useCallback(async () => {
        setScanError(null);
        setScanResult(null);
        setIsScanning(true);

        // Bersihkan scanner sebelumnya
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

        // Tunggu React selesai render dan DOM stabil
        // (elemen #reader perlu punya dimensi > 0 sebelum html5-qrcode bisa digunakan)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(async () => {
                    if (!isMountedRef.current) return;

                    const element = document.getElementById("reader");
                    if (!element) {
                        console.error("Element #reader not found in DOM");
                        setIsScanning(false);
                        setScanError("Gagal memulai scanner. Coba muat ulang halaman.");
                        return;
                    }

                    try {
                        const scanner = new Html5Qrcode("reader");
                        scannerRef.current = scanner;

                        await scanner.start(
                            { facingMode: "environment" },
                            {
                                fps: 10,
                                qrbox: { width: 250, height: 250 },
                            },
                            (decodedText) => {
                                // Berhasil scan — stop scanner lalu proses
                                stopScanner();
                                processQrCode(decodedText);
                            },
                            () => {} // Ignore background scan errors
                        );
                    } catch (err: any) {
                        console.error("Error starting scanner:", err);
                        if (isMountedRef.current) {
                            setIsScanning(false);
                            setScanError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.");
                        }
                    }
                }, 300);
            });
        });
    }, [stopScanner, processQrCode]);

    // Cleanup on unmount
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

    // Jika user belum link member_id
    if (!auth.user.member_id) {
        return (
            <>
                <Head title="Scan Kehadiran" />
                <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-muted/20">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <CardTitle>Akun Belum Terhubung</CardTitle>
                            <CardDescription>
                                Anda harus menghubungkan akun Anda dengan data jemaat sebelum dapat melakukan absensi mandiri.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pt-6">
                            <Button>Hubungkan Akun (TBA)</Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Scan Kehadiran Event" />
            
            <div className="flex flex-col min-h-screen bg-muted/20 pb-20">
                {/* Mobile Header */}
                <header className="bg-primary text-primary-foreground p-6 rounded-b-3xl shadow-sm">
                    <h1 className="text-2xl font-bold">Absensi Mandiri</h1>
                    <p className="opacity-90 mt-1">Halo, {auth.user.name}</p>
                </header>

                <main className="flex-1 p-6 flex flex-col items-center">
                    <Card className="w-full max-w-md overflow-hidden border-0 shadow-lg mt-4">
                        <CardHeader className="text-center bg-card border-b">
                            <CardTitle>Scan QR Event</CardTitle>
                            <CardDescription>
                                Arahkan kamera ke layar yang menampilkan QR Code event.
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                            {/* State: Processing */}
                            {processing && (
                                <div className="h-80 flex flex-col items-center justify-center bg-muted/30">
                                    <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
                                    <p className="font-medium text-muted-foreground">Memproses absensi...</p>
                                </div>
                            )}

                            {/* State: Success / Info */}
                            {!processing && (scanResult === 'success' || scanResult === 'info') && (
                                <div className="h-80 flex flex-col items-center justify-center bg-emerald-50/50 p-6 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-emerald-800 mb-2">
                                        {scanResult === 'success' ? 'Absensi Berhasil!' : 'Sudah Tercatat'}
                                    </h3>
                                    <p className="text-emerald-600/80 text-sm mb-6">
                                        {flash?.success || flash?.info}
                                    </p>
                                    <Button onClick={startScanner} variant="outline" className="w-full">
                                        Scan Lagi
                                    </Button>
                                </div>
                            )}

                            {/* State: Error */}
                            {!processing && scanError && (
                                <div className="h-80 flex flex-col items-center justify-center bg-destructive/5 p-6 text-center">
                                    <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-destructive mb-2">Gagal Scan</h3>
                                    <p className="text-destructive/80 text-sm mb-6">
                                        {scanError}
                                    </p>
                                    <Button onClick={startScanner} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
                                        Coba Lagi
                                    </Button>
                                </div>
                            )}

                            {/* State: Ready / Scanning */}
                            {!processing && !scanResult && !scanError && (
                                <div className="flex flex-col">
                                    {/* 
                                        Elemen reader SELALU ada di DOM dengan dimensi nyata.
                                        html5-qrcode butuh elemen visible dengan ukuran > 0.
                                    */}
                                    <div 
                                        ref={readerElementRef}
                                        id="reader" 
                                        className="w-full overflow-hidden bg-black"
                                        style={{
                                            height: isScanning ? '320px' : '1px',
                                            opacity: isScanning ? 1 : 0,
                                            position: isScanning ? 'relative' : 'absolute',
                                        }}
                                    />
                                    
                                    {!isScanning && (
                                        <div className="h-80 flex flex-col items-center justify-center p-6 bg-muted/10">
                                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                                <Camera className="w-10 h-10 text-primary" />
                                            </div>
                                            <Button size="lg" onClick={startScanner} className="w-full rounded-xl h-14 text-lg">
                                                Buka Kamera
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>
        </>
    );
}

// Override default layout (no sidebar)
MyScan.layout = (page: any) => page;
