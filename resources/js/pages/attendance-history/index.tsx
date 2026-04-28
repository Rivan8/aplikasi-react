import { Head } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    FileSpreadsheet,
    FileText,
    MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const attendanceLogs = [
    {
        id: 1,
        name: 'Eleanor Roosevelt',
        initials: 'ER',
        event: 'Q3 All-Hands Meeting',
        location: 'Main Auditorium',
        time: 'Oct 24, 08:45 AM',
        status: 'Present',
        avatar: ''
    },
    {
        id: 2,
        name: 'Marcus Kane',
        initials: 'MK',
        event: 'Safety Training Module B',
        location: 'Training Room 4',
        time: 'Oct 24, 09:12 AM',
        status: 'Late',
        avatar: ''
    },
    {
        id: 3,
        name: 'Sarah Jenkins',
        initials: 'SJ',
        event: 'Q3 All-Hands Meeting',
        location: 'Main Auditorium',
        time: 'Oct 24, 08:55 AM',
        status: 'Present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    }
];

const avatarColors = ['bg-primary', 'bg-chart-2', 'bg-chart-3'];

export default function AttendanceHistory() {
    return (
        <>
            <Head title="Attendance History" />
            <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto w-full">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                            Attendance History
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Review and export comprehensive scanning logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="flex items-center gap-2 font-medium">
                            <FileText className="h-4 w-4" />
                            Export to PDF
                        </Button>

                        <Button className="flex items-center gap-2 font-medium shadow-sm">
                            <FileSpreadsheet className="h-4 w-4" />
                            Export to Excel
                        </Button>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Filter by Event
                            </label>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full bg-muted/30 border-border">
                                    <SelectValue placeholder="Select Event" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Events</SelectItem>
                                    <SelectItem value="q3">Q3 All-Hands Meeting</SelectItem>
                                    <SelectItem value="safety">Safety Training Module B</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                Date Range
                            </label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        defaultValue="10/01/2023"
                                        className="pl-10 bg-muted/30 border-border"
                                    />
                                </div>
                                <span className="text-muted-foreground text-sm">to</span>
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        defaultValue="10/31/2023"
                                        className="pl-10 bg-muted/30 border-border"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="border-b bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                <tr>
                                    <th className="px-6 py-4">Attendee Name</th>
                                    <th className="px-6 py-4">Event Details</th>
                                    <th className="px-6 py-4">Time Logged</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {attendanceLogs.map((log, idx) => (
                                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarImage src={log.avatar} alt={log.name} />
                                                    <AvatarFallback className={`text-white font-bold text-xs ${avatarColors[idx % avatarColors.length]}`}>
                                                        {log.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-semibold text-foreground">{log.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-foreground/80">{log.event}</span>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {log.location}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-foreground/70">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{log.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border-none
                                                    ${log.status === 'Present'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }
                                                `}
                                            >
                                                {log.status === 'Present' ? '● ' : '▲ '}{log.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <p className="text-sm text-muted-foreground">Showing 1 to 3 of 42 entries</p>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 shadow-sm">1</Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">2</Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">3</Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AttendanceHistory.layout = {
    breadcrumbs: [
        {
            title: 'Attendance History',
            href: '/attendance-history',
        },
    ],
};
