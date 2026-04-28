import { Head } from '@inertiajs/react';
import { Aperture, CheckCircle2, History, Keyboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const recentScans = [
    {
        id: 1,
        name: 'Sarah Jenkins',
        empId: 'EMP-8492',
        time: 'Just now',
        status: 'Present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    {
        id: 2,
        name: 'Marcus Rodriguez',
        empId: 'EMP-1120',
        time: '2m ago',
        status: 'Present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'
    },
    {
        id: 3,
        name: 'David Chen',
        empId: 'EMP-4451',
        time: '5m ago',
        status: 'Late',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'
    },
    {
        id: 4,
        name: 'Alicia Jones',
        empId: 'EMP-9921',
        time: '12m ago',
        status: 'Present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alicia'
    }
];

export default function ScanQR() {
    return (
        <>
            <Head title="Scan QR" />
            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header Event Card */}
                <Card className="border bg-card shadow-sm">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10">
                                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                                </div>
                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Live Event</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                                Sunday Service Assembly
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Main Auditorium • 09:00 AM - 11:30 AM
                            </p>
                        </div>
                        <div className="flex shrink-0">
                            <div className="flex items-center divide-x divide-border rounded-xl border bg-muted/50 py-3 px-6">
                                <div className="flex flex-col items-center pr-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Checked In</span>
                                    <span className="text-2xl font-bold text-primary leading-none">342</span>
                                </div>
                                <div className="flex flex-col items-center pl-6">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Expected</span>
                                    <span className="text-2xl font-bold text-foreground leading-none">500</span>
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
                                <Aperture className="h-5 w-5 text-primary" />
                                <CardTitle className="text-lg font-semibold text-foreground">QR Scanner active</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" className="h-9 gap-2 font-medium">
                                <Keyboard className="h-4 w-4" />
                                Manual Entry
                            </Button>
                        </CardHeader>
                        <div className="relative flex-1 min-h-[400px] md:min-h-[500px] bg-[#1A1A1F] flex flex-col items-center justify-center p-6 overflow-hidden">
                            {/* Success Toast Overlay */}
                            <div className="absolute top-6 z-20 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-white shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Checked In: Sarah Jenkins</span>
                            </div>

                            {/* Scanner Frame UI */}
                            <div className="relative w-64 h-64 sm:w-80 sm:h-80 z-10">
                                {/* Corners — using teal to match primary */}
                                <div className="absolute top-0 left-0 h-10 w-10 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 h-10 w-10 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

                                {/* Scanning Laser Line */}
                                <div className="absolute left-0 top-1/2 h-[3px] w-full bg-primary shadow-[0_0_15px_3px] shadow-primary/50 animate-[scan_2.5s_ease-in-out_infinite]"></div>
                            </div>

                            <p className="absolute bottom-10 z-10 text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">
                                Align code within frame
                            </p>
                        </div>
                    </Card>

                    {/* Recent Scans Section */}
                    <Card className="border shadow-sm bg-card flex flex-col">
                        <CardHeader className="border-b px-6 py-5 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-foreground">Recent Scans</CardTitle>
                            <History className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-y-auto">
                            <div className="flex flex-col divide-y divide-border/50">
                                {recentScans.map((scan) => (
                                    <div key={scan.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-3.5">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarImage src={scan.avatar} alt={scan.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                                    {scan.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground leading-snug">{scan.name}</span>
                                                <span className="text-xs text-muted-foreground font-medium">ID: {scan.empId}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="text-[10px] font-medium text-muted-foreground">{scan.time}</span>
                                            <Badge
                                                variant="outline"
                                                className={`px-2 py-0 h-5 text-[10px] uppercase font-bold rounded-full
                                                    ${scan.status === 'Present'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40'
                                                    }
                                                `}
                                            >
                                                {scan.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* CSS Animation for Scanner Laser */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                    0%, 100% { transform: translateY(-110px); opacity: 0.5; }
                    50% { transform: translateY(110px); opacity: 1; }
                }
            `}} />
        </>
    );
}

ScanQR.layout = {
    breadcrumbs: [
        {
            title: 'Scan QR',
            href: '/scan-qr',
        },
    ],
};
