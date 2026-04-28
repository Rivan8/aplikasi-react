import { Head } from '@inertiajs/react';
import { Calendar, MapPin, Plus, QrCode, Users as UsersIcon, Building, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const events = [
    {
        id: 1,
        title: 'Sunday Service',
        date: 'Sunday, Oct 29, 2023',
        time: '09:00 AM - 11:30 AM',
        location: 'Main Hall',
        address: '123 Grace Avenue',
        category: 'Ibadah',
        icon: Building,
        expected: '250+',
        image: '/Users/esc/.gemini/antigravity/brain/daed1b59-4e3e-49fb-a491-64bbb45fee11/sunday_service_event_1777345946470.png'
    },
    {
        id: 2,
        title: 'Youth Meeting',
        date: 'Friday, Oct 27, 2023',
        time: '07:00 PM - 09:00 PM',
        location: 'Youth Room A',
        address: '123 Grace Avenue',
        category: 'Pelayanan',
        icon: UsersIcon,
        expected: '45',
        image: '/Users/esc/.gemini/antigravity/brain/daed1b59-4e3e-49fb-a491-64bbb45fee11/youth_meeting_event_1777345971298.png'
    },
    {
        id: 3,
        title: 'Volunteer Training',
        date: 'Saturday, Nov 04, 2023',
        time: '10:00 AM - 01:00 PM',
        location: 'Seminar Room 1',
        address: '123 Grace Avenue',
        category: 'Pelayanan',
        icon: GraduationCap,
        expected: '120',
        image: '/Users/esc/.gemini/antigravity/brain/daed1b59-4e3e-49fb-a491-64bbb45fee11/volunteer_training_event_1777346037703.png'
    }
];

export default function Events() {
    return (
        <>
            <Head title="Event Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">
                            Event Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage upcoming events and generate QR codes for attendance.
                        </p>
                    </div>

                    <Button className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium shadow-sm">
                        <Plus className="h-4 w-4" />
                        Create New Event
                    </Button>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => {
                        const Icon = event.icon;

                        return (
                            <Card key={event.id} className="group overflow-hidden border bg-card shadow-sm transition-shadow hover:shadow-md rounded-xl">
                                {/* Image */}
                                <div className="relative h-[160px] w-full overflow-hidden">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                                    <Badge className="absolute right-3 top-3 border-0 bg-white/95 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm hover:bg-white">
                                        <Icon className="mr-1.5 h-3 w-3" />
                                        {event.category}
                                    </Badge>
                                </div>

                                {/* Content */}
                                <CardContent className="p-5">
                                    <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>

                                    <div className="mt-4 space-y-3">
                                        <div className="flex items-start gap-3 text-sm">
                                            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                                            <div className="leading-snug">
                                                <p className="font-medium text-foreground/80">{event.date}</p>
                                                <p className="text-xs text-muted-foreground">{event.time}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3 text-sm">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                                            <div className="leading-snug">
                                                <p className="font-medium text-foreground/80">{event.location}</p>
                                                <p className="text-xs text-muted-foreground">{event.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-5 flex items-end justify-between border-t border-border/50 pt-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Expected
                                            </p>
                                            <p className="text-xl font-bold leading-none text-foreground">
                                                {event.expected}
                                            </p>
                                        </div>
                                        <Button variant="secondary" size="sm" className="flex items-center gap-2 rounded-lg font-medium">
                                            <QrCode className="h-4 w-4 text-muted-foreground" />
                                            View QR
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Add Event Placeholder */}
                    <button className="group flex min-h-[420px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-all hover:border-primary/40 hover:bg-primary/5">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-sm transition-transform group-hover:scale-110">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Plus className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">Schedule Event</h3>
                        <p className="mt-1 text-center text-sm text-muted-foreground leading-relaxed">
                            Set up a new gathering<br />and prepare QR codes.
                        </p>
                    </button>
                </div>
            </div>
        </>
    );
}

Events.layout = {
    breadcrumbs: [
        {
            title: 'Event Dashboard',
            href: '/events',
        },
    ],
};
