import { Head } from '@inertiajs/react';
import { CalendarDays, TrendingUp, Users, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';

const stats = [
    {
        title: 'Total Events',
        value: '24',
        change: '+3 this month',
        icon: CalendarDays,
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        title: 'Total Members',
        value: '1,248',
        change: '+12% growth',
        icon: Users,
        color: 'text-chart-2',
        bg: 'bg-chart-2/10',
    },
    {
        title: 'Avg Attendance',
        value: '87%',
        change: '+5% vs last quarter',
        icon: TrendingUp,
        color: 'text-chart-3',
        bg: 'bg-chart-3/10',
    },
    {
        title: 'QR Scans Today',
        value: '342',
        change: 'Live counting',
        icon: QrCode,
        color: 'text-chart-4',
        bg: 'bg-chart-4/10',
    },
];

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Welcome back! Here's an overview of your attendance system.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                            <Card key={stat.title} className="border bg-card shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                                            <Icon className={`h-4 w-4 ${stat.color}`} />
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                        <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.change}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Activity Placeholder */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border bg-card shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {[
                                    { text: 'Sunday Service completed — 250 attendees', time: '2 hours ago' },
                                    { text: 'Youth Meeting QR code generated', time: '5 hours ago' },
                                    { text: 'New member registered: Eka Saputra', time: '1 day ago' },
                                    { text: 'Volunteer Training scheduled for Nov 4', time: '2 days ago' },
                                ].map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                                        <div className="flex-1">
                                            <p className="text-sm text-foreground/80">{activity.text}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border bg-card shadow-sm">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
                            <div className="space-y-4">
                                {[
                                    { name: 'Sunday Service', date: 'Oct 29', attendees: '250+ expected', color: 'bg-primary' },
                                    { name: 'Youth Meeting', date: 'Oct 27', attendees: '45 expected', color: 'bg-chart-2' },
                                    { name: 'Volunteer Training', date: 'Nov 4', attendees: '120 expected', color: 'bg-chart-4' },
                                ].map((event, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2 w-2 rounded-full ${event.color}`} />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{event.name}</p>
                                                <p className="text-xs text-muted-foreground">{event.date}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">{event.attendees}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
