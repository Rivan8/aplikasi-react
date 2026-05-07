import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    CalendarIcon,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Clock,
    ImageIcon,
    ListChecks,
    MapPin,
    Minus,
    MoreHorizontal,
    Pencil,
    Plus,
    QrCode,
    Search,
    Timer,
    Trash2,
    Users,
    X,
    Play,
    Pause,
    RotateCcw,
    CheckCircle2,
    Sparkles,
    Info,
} from 'lucide-react';
import { QRCodeSVG as QRCodeComponent } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';

interface ExternalMember {
    id: number;
    name: string;
}

interface VolunteerMember {
    idjemaat: number;
    namalengkap: string;
}

interface Volunteer {
    id?: number;
    member_id: number;
    role_name: string;
    role_category: string;
    role_id?: number; // Unique identifier for the position
    member?: VolunteerMember;
}

interface EventRundownItem {
    id?: number;
    title: string;
    duration_seconds: number;
    song_id?: number | null;
    song_arrangement_id?: number | null;
    song?: Song | null;
    arrangement?: SongArrangement | null;
}

interface EventRundownSegment {
    id?: number;
    title: string;
    duration_seconds: number;
    items: EventRundownItem[];
}

interface Event {
    id: number;
    title: string;
    date: string | null;
    time: string | null;
    attendance_start_time: string | null;
    location: string | null;
    address: string | null;
    category: string;
    expected: number;
    image_path: string | null;
    volunteers: Volunteer[];
    rundown_segments: EventRundownSegment[];
}

interface CategoryRole {
    id: number;
    role_name: string;
    department: {
        id: number;
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
    roles: CategoryRole[];
}

interface SongArrangement {
    id: number;
    name: string;
    duration: string | null;
    bpm: string | null;
    time_signature: string | null;
    song_flow: string | null;
}

interface Song {
    id: number;
    title: string;
    keys: string | null;
    arrangements: SongArrangement[];
}

function SearchableSelect({
    value,
    onSelect,
    external_members,
}: {
    value: number | null;
    onSelect: (val: number | null) => void;
    external_members: ExternalMember[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredMembers = useMemo(() => {
        return external_members
            .filter((m) =>
                (m.name || '').toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, 50);
    }, [search, external_members]);

    const selectedMember = external_members.find((m) => m.id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-9 w-full justify-between px-3 text-xs font-normal"
                >
                    {selectedMember ? (
                        <span className="truncate">
                            {selectedMember.name}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">
                            Pilih member...
                        </span>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                        placeholder="Cari nama..."
                        className="h-9 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="max-h-[200px] overflow-y-auto p-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-2 py-1.5 text-xs text-muted-foreground"
                        onClick={() => {
                            onSelect(null);
                            setOpen(false);
                        }}
                    >
                        -- Kosongkan --
                    </Button>
                    {filteredMembers.map((member) => (
                        <Button
                            key={member.id}
                            variant="ghost"
                            className="w-full justify-start px-2 py-1.5 text-xs"
                            onClick={() => {
                                onSelect(member.id);
                                setOpen(false);
                            }}
                        >
                            {member.name}
                        </Button>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                            Member tidak ditemukan.
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

export default function Events({
    events = [],
    external_members = [],
    categories = [],
    songs = [],
}: {
    events: Event[];
    external_members: ExternalMember[];
    categories: Category[];
    songs: Song[];
}) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [qrEvent, setQrEvent] = useState<Event | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'basic' | 'rundown' | 'volunteers'>('basic');

    const { data, setData, post, reset, processing, errors } = useForm({
        title: '',
        date: undefined as Date | undefined,
        time: '',
        attendance_start_time: '',
        location: '',
        address: '',
        category: '',
        expected: 0,
        image: null as File | null,
        volunteers: [] as Volunteer[],
        rundown_segments: [] as EventRundownSegment[],
    });

    const volunteerGroups = useMemo(() => {
        const selectedCategory = categories.find((c) => c.name === data.category);
        if (!selectedCategory) return [];

        const groups: Record<string, CategoryRole[]> = {};
        selectedCategory.roles.forEach((role) => {
            const dept = role.department.name;
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(role);
        });

        return Object.entries(groups).map(([category, roles]) => ({
            category,
            roles,
        }));
    }, [data.category, categories]);

    const toggleCategory = (category: string) => {
        setOpenCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    const getVolunteerValue = (category: string, roleName: string, roleId: number) => {
        const v = data.volunteers.find(
            (v) => (v.role_id === roleId) || (v.role_category === category && v.role_name === roleName && !v.role_id),
        );
        return v ? v.member_id : null;
    };

    const setVolunteerValue = (
        category: string,
        roleName: string,
        memberId: number | null,
        roleId: number,
    ) => {
        const otherVolunteers = data.volunteers.filter(
            (v) => !(v.role_id === roleId),
        );

        if (memberId === null) {
            setData('volunteers', otherVolunteers);
        } else {
            setData('volunteers', [
                ...otherVolunteers,
                {
                    member_id: memberId,
                    role_category: category,
                    role_name: roleName,
                    role_id: roleId,
                },
            ]);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addRundownSegment = () => {
        setData('rundown_segments', [
            ...data.rundown_segments,
            { title: '', duration_seconds: 0, items: [] },
        ]);
    };

    const removeRundownSegment = (index: number) => {
        setData(
            'rundown_segments',
            data.rundown_segments.filter((_, i) => i !== index),
        );
    };

    const updateRundownSegment = (
        index: number,
        updates: Partial<EventRundownSegment>,
    ) => {
        setData(
            'rundown_segments',
            data.rundown_segments.map((s, i) =>
                i === index ? { ...s, ...updates } : s,
            ),
        );
    };

    const addRundownItem = (segmentIndex: number) => {
        const newSegments = [...data.rundown_segments];
        newSegments[segmentIndex].items.push({ title: '', duration_seconds: 0 });
        setData('rundown_segments', newSegments);
    };

    const removeRundownItem = (segmentIndex: number, itemIndex: number) => {
        const newSegments = [...data.rundown_segments];
        newSegments[segmentIndex].items = newSegments[segmentIndex].items.filter(
            (_, i) => i !== itemIndex,
        );
        setData('rundown_segments', newSegments);
    };

    const updateRundownItem = (
        segmentIndex: number,
        itemIndex: number,
        updates: Partial<EventRundownItem>,
    ) => {
        const newSegments = [...data.rundown_segments];
        newSegments[segmentIndex].items = newSegments[segmentIndex].items.map(
            (item, i) => (i === itemIndex ? { ...item, ...updates } : item),
        );
        setData('rundown_segments', newSegments);
    };

    const minutesToSeconds = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : Math.round(num * 60);
    };

    const secondsToMinutesInput = (seconds: number) => {
        return seconds === 0 ? '' : (seconds / 60).toString();
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}j ${m}m`;
        if (m > 0) return `${m}m ${s > 0 ? s + 'd' : ''}`;
        return `${s}d`;
    };

    const getItemTotalSeconds = (segment: EventRundownSegment) => {
        return segment.items.reduce((acc, item) => acc + item.duration_seconds, 0);
    };

    const getRundownTotalSeconds = (segments: EventRundownSegment[]) => {
        return segments.reduce((acc, s) => acc + getItemTotalSeconds(s), 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingEvent ? `/events/${editingEvent.id}` : '/events';

        const formData = new FormData();
        formData.append('title', data.title);
        if (data.date) formData.append('date', format(data.date, 'yyyy-MM-dd'));
        formData.append('time', data.time);
        formData.append('attendance_start_time', data.attendance_start_time);
        formData.append('location', data.location);
        formData.append('address', data.address);
        formData.append('category', data.category);
        formData.append('expected', data.expected.toString());
        if (data.image) formData.append('image', data.image);

        // JSON-stringify arrays to prevent FormData duplication
        formData.append('volunteers', JSON.stringify(data.volunteers));

        const segmentsPayload = data.rundown_segments.map((s) => ({
            ...s,
            duration_seconds: getItemTotalSeconds(s),
        }));
        formData.append('rundown_segments', JSON.stringify(segmentsPayload));

        // Spoof PUT method for updates
        if (editingEvent) formData.append('_method', 'PUT');

        router.post(url, formData, {
            onSuccess: () => {
                setIsAddModalOpen(false);
                setEditingEvent(null);
                setImagePreview(null);
                reset();
            },
        });
    };

    useEffect(() => {
        if (editingEvent) {
            // Rehydrate volunteers with role IDs by matching roles in the category
            const selectedCategory = categories.find(c => c.name === editingEvent.category);
            const roles = selectedCategory ? selectedCategory.roles : [];
            
            // Track used role IDs to handle duplicate role names correctly
            const usedRoleIds = new Set<number>();

            const rehydratedVolunteers = editingEvent.volunteers.map((v) => {
                const matchingRole = roles.find(r => 
                    r.role_name === v.role_name && 
                    r.department.name === v.role_category &&
                    !usedRoleIds.has(r.id)
                );
                
                if (matchingRole) {
                    usedRoleIds.add(matchingRole.id);
                }

                return {
                    member_id: v.member_id,
                    role_category: v.role_category,
                    role_name: v.role_name,
                    role_id: matchingRole ? matchingRole.id : undefined,
                };
            });

            setData({
                title: editingEvent.title,
                date: editingEvent.date ? new Date(editingEvent.date) : undefined,
                time: editingEvent.time || '',
                attendance_start_time: editingEvent.attendance_start_time || '',
                location: editingEvent.location || '',
                address: editingEvent.address || '',
                category: editingEvent.category,
                expected: editingEvent.expected,
                image: null,
                volunteers: rehydratedVolunteers,
                rundown_segments:
                    editingEvent.rundown_segments?.map((segment) => ({
                        title: segment.title,
                        duration_seconds: segment.duration_seconds || 0,
                        items:
                            segment.items?.map((item) => ({
                                title: item.title,
                                duration_seconds: item.duration_seconds || 0,
                                song_id: item.song_id || null,
                                song_arrangement_id: item.song_arrangement_id || null,
                                song: item.song || null,
                                arrangement: item.arrangement || null,
                            })) || [],
                    })) || [],
            });
            setImagePreview(editingEvent.image_path);
            setIsAddModalOpen(true);
        }
    }, [editingEvent, categories]);

    const [rundownEvent, setRundownEvent] = useState<Event | null>(null);
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        let interval: any;
        if (timerRunning) {
            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]);

    const rundownTotalSeconds = useMemo(() => {
        if (!rundownEvent) return 0;
        return getRundownTotalSeconds(rundownEvent.rundown_segments);
    }, [rundownEvent]);

    const overdueSeconds = Math.max(0, elapsedSeconds - rundownTotalSeconds);

    const rundownTimerPlan = useMemo(() => {
        if (!rundownEvent) return [];
        let currentTime = 0;
        return rundownEvent.rundown_segments.map((s, i) => {
            const startsAt = currentTime;
            const endsAt = startsAt + s.duration_seconds;
            currentTime = endsAt;
            return {
                ...s,
                index: i,
                startsAt,
                endsAt,
                duration: s.duration_seconds,
            };
        });
    }, [rundownEvent]);

    return (
        <>
            <Head title="Events" />

            <div className="flex flex-col gap-8 p-6 lg:p-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight text-foreground/90">
                            Management Event
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Kelola jadwal pelayanan dan absensi jemaat Anda.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingEvent(null);
                            reset();
                            setImagePreview(null);
                            setIsAddModalOpen(true);
                        }}
                        className="h-11 gap-2 px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Tambah Event Baru
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {events.map((event) => (
                        <Card
                            key={`event-card-${event.id}`}
                            className="group relative flex flex-col overflow-hidden border-none bg-card/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:bg-card hover:shadow-2xl hover:shadow-primary/10"
                        >
                            <div className="relative aspect-[16/10] w-full overflow-hidden">
                                {event.image_path ? (
                                    <img
                                        src={event.image_path}
                                        alt={event.title}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 text-primary/20">
                                        <ImageIcon className="h-16 w-16" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                                
                                <div className="absolute top-4 left-4">
                                    <Badge className="bg-background/40 text-foreground border-white/20 shadow-xl backdrop-blur-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                                        {event.category}
                                    </Badge>
                                </div>
                                
                                <div className="absolute top-4 right-4 flex gap-2 translate-y-[-10px] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-9 w-9 rounded-full bg-background/80 shadow-2xl backdrop-blur-md border border-white/20 hover:bg-primary hover:text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEvent(event);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <CardHeader className="space-y-3 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <CardTitle className="line-clamp-1 text-xl font-bold tracking-tight text-foreground/90">
                                        {event.title}
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 rounded-full hover:bg-primary/5"
                                        onClick={() => setViewingEvent(event)}
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                                        <CalendarDays className="h-4 w-4 text-primary/60" />
                                        {event.date
                                            ? format(
                                                  new Date(event.date),
                                                  'dd MMM yyyy',
                                                  { locale: id },
                                              )
                                            : '-'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                                        <Clock className="h-4 w-4 text-primary/60" />
                                        {event.time}
                                    </div>
                                </div>
                                
                                {event.location && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                                        <MapPin className="h-4 w-4 text-primary/60" />
                                        <span className="truncate">{event.location}</span>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="mt-auto p-6 pt-0">
                                <div className="flex items-center justify-between border-t border-border/50 pt-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex -space-x-3 overflow-hidden">
                                            {event.volunteers
                                                .slice(0, 4)
                                                .map((v, i) => (
                                                    <div
                                                        key={v.id ?? i}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary/20 to-primary/5 text-[11px] font-bold text-primary shadow-lg"
                                                        title={v.member?.namalengkap ?? 'Volunteer'}
                                                    >
                                                        {v.member?.namalengkap
                                                            ?.slice(0, 2)
                                                            ?.toUpperCase() ?? '??'}
                                                    </div>
                                                ))}
                                            {event.volunteers.length > 4 && (
                                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-bold text-muted-foreground shadow-lg">
                                                    +{event.volunteers.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        {event.volunteers.length > 0 && (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter">Volunteer</span>
                                                <span className="text-xs font-semibold leading-none">{event.volunteers.length} Personel</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl border-border/50 hover:bg-primary/5 hover:text-primary transition-colors"
                                            onClick={() => setQrEvent(event)}
                                        >
                                            <QrCode className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className="h-10 gap-2 rounded-xl px-5 text-sm font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                                            onClick={() => setViewingEvent(event)}
                                        >
                                            Detail
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {events.length === 0 && (
                    <div className="flex min-h-[450px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-12 text-center animate-in fade-in zoom-in duration-500">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-background border border-primary/10 shadow-inner">
                                <CalendarDays className="h-10 w-10 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold tracking-tight text-foreground/90">
                            Belum Ada Event Terjadwal
                        </h3>
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
                            Mulai atur jadwal pelayanan gereja Anda hari ini. Semua data absensi dan volunteer akan muncul di sini.
                        </p>
                        <Button
                            variant="default"
                            className="mt-8 h-12 gap-2 rounded-2xl px-8 shadow-xl shadow-primary/20"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <Plus className="h-5 w-5" />
                            Buat Event Sekarang
                        </Button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Dialog
                open={isAddModalOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddModalOpen(false);
                        setEditingEvent(null);
                        setImagePreview(null);
                        reset();
                    }
                }}
            >
                <DialogContent className="max-w-5xl overflow-hidden rounded-[32px] p-0 border-none shadow-2xl">
                    <DialogHeader className="bg-gradient-to-br from-primary/10 via-background to-background p-8 pb-6 border-b border-primary/5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <DialogTitle className="text-3xl font-black tracking-tight text-foreground/90">
                                    {editingEvent ? 'Edit Event' : 'Buat Event Baru'}
                                </DialogTitle>
                                <DialogDescription className="text-sm font-medium text-muted-foreground/80">
                                    {editingEvent 
                                        ? 'Perbarui detail event dan jadwal pelayanan Anda.' 
                                        : 'Lengkapi detail untuk menjadwalkan pelayanan gereja Anda.'}
                                </DialogDescription>
                            </div>
                        </div>
                        
                        {/* Tab Switcher */}
                        <div className="mt-8 flex gap-1 p-1.5 bg-muted/40 rounded-2xl w-fit border border-border/40 backdrop-blur-md">
                            {[
                                { id: 'basic', label: 'Informasi Dasar', icon: Info },
                                { id: 'rundown', label: 'Rundown & Lagu', icon: ListChecks },
                                { id: 'volunteers', label: 'Tim Volunteer', icon: Users },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300",
                                        activeTab === tab.id 
                                            ? "bg-background text-primary shadow-lg shadow-primary/5 border border-primary/10 scale-[1.02]" 
                                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                    )}
                                >
                                    <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-muted-foreground/60")} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col overflow-hidden"
                    >
                        <div className="overflow-y-auto max-h-[65vh] scrollbar-hide">
                            {/* Tab 1: Basic Info */}
                            {activeTab === 'basic' && (
                                <div className="p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                        <div className="lg:col-span-7 space-y-8">
                                            <section className="space-y-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                                                    <span className="h-px w-8 bg-primary/30" />
                                                    Detail Utama
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2.5">
                                                        <Label htmlFor="title" className="text-xs font-bold text-foreground/70 ml-1">Nama Event</Label>
                                                        <Input
                                                            id="title"
                                                            value={data.title}
                                                            onChange={(e) => setData('title', e.target.value)}
                                                            placeholder="Sunday Service"
                                                            className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl px-4"
                                                        />
                                                        {errors.title && <p className="text-[10px] font-bold text-destructive px-1">{errors.title}</p>}
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <Label htmlFor="category" className="text-xs font-bold text-foreground/70 ml-1">Kategori</Label>
                                                        <Select value={data.category} onValueChange={(val) => setData('category', val)}>
                                                            <SelectTrigger className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl px-4">
                                                                <SelectValue placeholder="Pilih Kategori" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl border-border/40 shadow-2xl">
                                                                {categories.map((c) => (
                                                                    <SelectItem key={c.id} value={c.name} className="py-2.5 rounded-lg">{c.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.category && <p className="text-[10px] font-bold text-destructive px-1">{errors.category}</p>}
                                                    </div>
                                                </div>
                                            </section>

                                            <section className="space-y-6">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                                                    <span className="h-px w-8 bg-primary/30" />
                                                    Logistik & Waktu
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2.5">
                                                        <Label className="text-xs font-bold text-foreground/70 ml-1">Tanggal</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        'h-12 w-full justify-start text-left font-medium rounded-xl bg-muted/20 border-border/40 px-4 transition-all hover:bg-background',
                                                                        !data.date && 'text-muted-foreground',
                                                                    )}
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                                                    {data.date ? format(data.date, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 rounded-2xl border-border/40 shadow-2xl" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={data.date}
                                                                    onSelect={(date: Date | undefined) => setData('date', date)}
                                                                    initialFocus
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2.5">
                                                            <Label htmlFor="time" className="text-xs font-bold text-foreground/70 ml-1">Mulai</Label>
                                                            <Input
                                                                id="time"
                                                                type="time"
                                                                value={data.time}
                                                                onChange={(e) => setData('time', e.target.value)}
                                                                className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl"
                                                            />
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            <Label htmlFor="attendance_start_time" className="text-xs font-bold text-foreground/70 ml-1">Absen</Label>
                                                            <Input
                                                                id="attendance_start_time"
                                                                type="time"
                                                                value={data.attendance_start_time}
                                                                onChange={(e) => setData('attendance_start_time', e.target.value)}
                                                                className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2.5">
                                                        <Label htmlFor="expected" className="text-xs font-bold text-foreground/70 ml-1">Target Peserta</Label>
                                                        <div className="relative">
                                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                            <Input
                                                                id="expected"
                                                                type="number"
                                                                value={data.expected}
                                                                onChange={(e) => setData('expected', parseInt(e.target.value))}
                                                                className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl pl-11"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <Label htmlFor="location" className="text-xs font-bold text-foreground/70 ml-1">Lokasi</Label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                                                            <Input
                                                                id="location"
                                                                value={data.location}
                                                                onChange={(e) => setData('location', e.target.value)}
                                                                placeholder="Gereja ESC"
                                                                className="h-12 bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl pl-11"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2.5">
                                                    <Label htmlFor="address" className="text-xs font-bold text-foreground/70 ml-1">Alamat Lengkap</Label>
                                                    <Textarea
                                                        id="address"
                                                        value={data.address}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('address', e.target.value)}
                                                        placeholder="Jl. Raya..."
                                                        className="min-h-[100px] bg-muted/20 border-border/40 focus:bg-background transition-all rounded-xl p-4"
                                                    />
                                                </div>
                                            </section>
                                        </div>

                                        <div className="lg:col-span-5 space-y-6">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                                                <span className="h-px w-8 bg-primary/30" />
                                                Visual Event
                                            </div>
                                            <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[32px] border-2 border-dashed border-muted-foreground/20 bg-muted/5 transition-all hover:border-primary/30 hover:bg-primary/5">
                                                {imagePreview ? (
                                                    <>
                                                        <img
                                                            src={imagePreview}
                                                            alt="Preview"
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="icon"
                                                                className="h-12 w-12 rounded-full shadow-2xl scale-90 group-hover:scale-100 transition-transform duration-500"
                                                                onClick={() => {
                                                                    setImagePreview(null);
                                                                    setData('image', null);
                                                                }}
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </Button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-8 text-center"
                                                    >
                                                        <div className="relative mb-6">
                                                            <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                                                            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-background border border-border/40 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                                <ImageIcon className="h-8 w-8 text-primary/40" />
                                                            </div>
                                                            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white shadow-xl">
                                                                <Plus className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                        <p className="text-sm font-bold text-foreground/80">Upload Poster Event</p>
                                                        <input
                                                            id="image-upload"
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={handleImageChange}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 2: Rundown */}
                            {activeTab === 'rundown' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-foreground/90">Manajemen Rundown</h3>
                                            <p className="text-xs text-muted-foreground font-medium">Susun jadwal acara dan lampirkan lagu.</p>
                                        </div>
                                        <Badge variant="outline" className="px-4 py-2 rounded-xl bg-primary/5 border-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest">
                                            Estimasi Durasi: {formatDuration(getRundownTotalSeconds(data.rundown_segments))}
                                        </Badge>
                                    </div>

                                    <div className="space-y-6">
                                        {data.rundown_segments.map((segment, segmentIndex) => (
                                            <div key={segmentIndex} className="group relative rounded-[32px] border border-border/40 bg-card/50 p-6 shadow-sm transition-all hover:shadow-md hover:bg-card">
                                                <div className="grid gap-6 md:grid-cols-[1fr_200px_48px] items-center">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black text-primary/70 uppercase tracking-widest ml-1">Nama Segment</Label>
                                                        <Input
                                                            value={segment.title}
                                                            onChange={(e) => updateRundownSegment(segmentIndex, { title: e.target.value })}
                                                            placeholder="Contoh: Worship Session"
                                                            className="h-12 bg-background border-border/40 rounded-2xl px-5 text-sm font-bold focus:ring-primary/20"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black text-primary/70 uppercase tracking-widest ml-1">Total Durasi</Label>
                                                        <div className="h-12 flex items-center px-5 rounded-2xl border border-border/40 bg-muted/30 text-sm font-bold text-foreground/70">
                                                            <Timer className="h-4 w-4 mr-2 text-primary/40" />
                                                            {formatDuration(getItemTotalSeconds(segment))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 rounded-2xl text-destructive hover:bg-destructive/10 transition-colors"
                                                        onClick={() => removeRundownSegment(segmentIndex)}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>

                                                <div className="mt-8 space-y-4 relative">
                                                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-border/40 to-transparent" />
                                                    
                                                    {segment.items.map((item, itemIndex) => (
                                                        <div key={itemIndex} className="relative pl-14 group/item">
                                                            <div className="absolute left-[22px] top-4 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-lg z-10 group-hover/item:scale-125 transition-transform" />
                                                            
                                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_48px] gap-4 items-center p-4 rounded-[20px] bg-background border border-border/30 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                                                                <div className="space-y-3">
                                                                    <div className="flex gap-2">
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="outline"
                                                                                    className={cn(
                                                                                        "h-8 text-[9px] font-black uppercase tracking-widest rounded-lg border-dashed",
                                                                                        item.song ? "bg-primary/5 text-primary border-primary/20" : "text-muted-foreground/60"
                                                                                    )}
                                                                                >
                                                                                    {item.song ? (
                                                                                        <><Sparkles className="h-3 w-3 mr-1.5" /> {item.song.title}</>
                                                                                    ) : (
                                                                                        <><Plus className="h-3 w-3 mr-1.5" /> Lampirkan Lagu</>
                                                                                    )}
                                                                                </Button>
                                                                            </DialogTrigger>
                                                                            <DialogContent className="max-w-md rounded-[28px] p-0 overflow-hidden border-none shadow-2xl">
                                                                                <DialogHeader className="bg-muted/30 p-6 border-b">
                                                                                    <DialogTitle className="font-black tracking-tight">Song Bank</DialogTitle>
                                                                                    <DialogDescription>Pilih lagu untuk item rundown ini.</DialogDescription>
                                                                                </DialogHeader>
                                                                                <div className="p-6">
                                                                                    <div className="relative mb-4">
                                                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                                                                        <Input placeholder="Cari lagu..." className="pl-10 h-10 rounded-xl" onChange={(e) => {
                                                                                            const term = e.target.value.toLowerCase();
                                                                                            document.querySelectorAll('.song-item-row').forEach((el: any) => {
                                                                                                el.style.display = el.getAttribute('data-title').toLowerCase().includes(term) ? 'flex' : 'none';
                                                                                            });
                                                                                        }} />
                                                                                    </div>
                                                                                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                                                                        {songs.map((song) => (
                                                                                            <DialogClose key={song.id} asChild>
                                                                                                <Button 
                                                                                                    variant="ghost" 
                                                                                                    className="song-item-row w-full justify-between h-11 px-4 rounded-xl text-xs font-semibold hover:bg-primary/5 hover:text-primary transition-all" 
                                                                                                    data-title={song.title} 
                                                                                                    onClick={() => {
                                                                                                        const defaultArr = song.arrangements?.[0] || null;
                                                                                                        updateRundownItem(segmentIndex, itemIndex, { 
                                                                                                            song_id: song.id, 
                                                                                                            song, 
                                                                                                            title: song.title,
                                                                                                            song_arrangement_id: defaultArr?.id || null,
                                                                                                            arrangement: defaultArr
                                                                                                        });
                                                                                                    }}
                                                                                                >
                                                                                                    <span>{song.title}</span>
                                                                                                    {song.keys && <Badge variant="outline" className="text-[9px] font-black">{song.keys}</Badge>}
                                                                                                </Button>
                                                                                            </DialogClose>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    </div>
                                                                    <Input
                                                                        value={item.title}
                                                                        onChange={(e) => updateRundownItem(segmentIndex, itemIndex, { title: e.target.value })}
                                                                        placeholder="Judul Aktivitas"
                                                                        className="h-10 bg-muted/10 border-none rounded-xl text-xs font-bold focus:ring-0 px-3"
                                                                    />
                                                                    {item.song && item.song.arrangements && item.song.arrangements.length > 0 && (
                                                                        <div className="flex flex-col gap-2">
                                                                            <Select 
                                                                                value={item.song_arrangement_id?.toString() || ""} 
                                                                                onValueChange={(val) => {
                                                                                    const arrId = parseInt(val);
                                                                                    const arr = item.song?.arrangements.find(a => a.id === arrId);
                                                                                    updateRundownItem(segmentIndex, itemIndex, { 
                                                                                        song_arrangement_id: arrId,
                                                                                        arrangement: arr || null
                                                                                    });
                                                                                }}
                                                                            >
                                                                                <SelectTrigger className="h-8 w-full md:w-64 text-[10px] font-bold bg-muted/20 border-none rounded-lg">
                                                                                    <SelectValue placeholder="Pilih Aransemen" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {item.song.arrangements.map(arr => (
                                                                                        <SelectItem key={arr.id} value={arr.id.toString()} className="text-[10px] font-bold">
                                                                                            {arr.name} {arr.bpm ? `(${arr.bpm} BPM)` : ''}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>

                                                                            {(item.arrangement?.song_flow || item.song?.arrangements?.[0]?.song_flow) && (
                                                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-lg w-fit border border-emerald-100/50">
                                                                                    <ListChecks className="h-2.5 w-2.5 text-emerald-600" />
                                                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">
                                                                                        Flow: {item.arrangement?.song_flow || item.song?.arrangements?.[0]?.song_flow}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase">Min</span>
                                                                    <Input
                                                                        type="number"
                                                                        value={secondsToMinutesInput(item.duration_seconds)}
                                                                        onChange={(e) => updateRundownItem(segmentIndex, itemIndex, { duration_seconds: minutesToSeconds(e.target.value) })}
                                                                        className="h-10 bg-muted/20 border-border/20 rounded-xl px-4 text-xs font-black"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5"
                                                                    onClick={() => removeRundownItem(segmentIndex, itemIndex)}
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="pl-14 pt-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="h-10 gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl border border-dashed border-primary/20"
                                                            onClick={() => addRundownItem(segmentIndex)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                            Tambah Item
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full h-16 rounded-[28px] border-dashed border-2 border-muted-foreground/20 bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all flex flex-col items-center justify-center gap-1 group"
                                            onClick={addRundownSegment}
                                        >
                                            <div className="flex items-center gap-2 text-sm font-bold text-foreground/70 group-hover:text-primary">
                                                <Plus className="h-5 w-5" />
                                                Tambah Segment Rundown Baru
                                            </div>
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Volunteers */}
                            {activeTab === 'volunteers' && (
                                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-foreground/90">Penugasan Tim Pelayanan</h3>
                                            <p className="text-xs text-muted-foreground font-medium">Tentukan volunteer yang akan bertugas.</p>
                                        </div>
                                        <Badge variant="outline" className="px-4 py-2 rounded-xl bg-primary/5 border-primary/10 text-primary font-bold text-[10px] uppercase tracking-widest">
                                            {data.volunteers.filter(v => v.member_id).length} Posisi Terisi
                                        </Badge>
                                    </div>

                                    {volunteerGroups.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {volunteerGroups.map((group) => (
                                                <div key={group.category} className="rounded-[32px] border border-border/40 bg-card/50 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                                    <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center justify-between">
                                                        <h4 className="text-xs font-black tracking-[0.15em] text-foreground/70 uppercase flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-primary/50" />
                                                            {group.category}
                                                        </h4>
                                                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-bold text-[10px]">
                                                            {group.roles.length} Posisi
                                                        </Badge>
                                                    </div>
                                                    <div className="p-4 space-y-3">
                                                        {group.roles.map((role) => (
                                                            <div key={role.id} className="flex flex-col gap-2 p-3 rounded-2xl bg-background border border-border/30 group/role hover:border-primary/20 transition-all">
                                                                <div className="flex items-center justify-between px-1">
                                                                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter">{role.role_name}</span>
                                                                    {getVolunteerValue(group.category, role.role_name, role.id) && (
                                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                    )}
                                                                </div>
                                                                <SearchableSelect
                                                                    value={getVolunteerValue(group.category, role.role_name, role.id)}
                                                                    onSelect={(val) => setVolunteerValue(group.category, role.role_name, val, role.id)}
                                                                    external_members={external_members}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 px-10 rounded-[40px] border-2 border-dashed border-muted-foreground/20 bg-muted/5 text-center">
                                            <div className="h-20 w-20 rounded-[28px] bg-background border border-border/40 flex items-center justify-center shadow-inner mb-6">
                                                <Users className="h-10 w-10 text-muted-foreground/20" />
                                            </div>
                                            <h4 className="text-xl font-bold text-foreground/90">Kategori Belum Dipilih</h4>
                                            <Button 
                                                variant="outline" 
                                                className="mt-8 h-12 px-8 rounded-2xl border-primary/20 text-primary font-bold hover:bg-primary/5"
                                                onClick={() => setActiveTab('basic')}
                                            >
                                                Kembali ke Informasi Dasar
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-gradient-to-t from-background via-background to-transparent border-t border-border/40 flex items-center justify-between backdrop-blur-md">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Sistem Siap</span>
                            </div>
                            <div className="flex gap-4">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-14 px-8 rounded-[20px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    >
                                        Batal
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-14 px-10 rounded-[20px] font-bold shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-500 active:scale-95"
                                >
                                    {processing ? 'Menyimpan...' : (editingEvent ? 'Simpan Perubahan' : 'Buat Event')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog
                open={!!viewingEvent}
                onOpenChange={(open) => !open && setViewingEvent(null)}
            >
                <DialogContent className="max-w-2xl overflow-hidden rounded-2xl p-0">
                    {viewingEvent && (
                        <>
                            <DialogHeader className="sr-only">
                                <DialogTitle>Detail Event</DialogTitle>
                                <DialogDescription>
                                    Informasi lengkap tentang event pelayanan
                                    termasuk tanggal, waktu, lokasi, dan
                                    volunteer yang bertugas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-video w-full bg-muted">
                                {viewingEvent.image_path ? (
                                    <img
                                        src={viewingEvent.image_path}
                                        alt={viewingEvent.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                        <ImageIcon className="h-16 w-16" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute right-6 bottom-6 left-6 text-white">
                                    <Badge className="mb-3 border-0 bg-primary text-primary-foreground">
                                        {viewingEvent.category}
                                    </Badge>
                                    <h2 className="text-3xl font-bold tracking-tight">
                                        {viewingEvent.title}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-8 p-8">
                                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                            Tanggal
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {viewingEvent.date
                                                ? new Date(
                                                      viewingEvent.date,
                                                  ).toLocaleDateString(
                                                      'id-ID',
                                                      {
                                                          weekday: 'long',
                                                          year: 'numeric',
                                                          month: 'long',
                                                          day: 'numeric',
                                                      },
                                                  )
                                                : '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                            Waktu
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {viewingEvent.time}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                            Waktu Absen
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {viewingEvent.attendance_start_time || '-'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                            Lokasi
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {viewingEvent.location}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                            Target
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {viewingEvent.expected} Peserta
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-primary uppercase">
                                        <MapPin className="h-4 w-4" />
                                        Alamat Lokasi
                                    </h4>
                                    <p className="rounded-xl border bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                                        {viewingEvent.address}
                                    </p>
                                </div>

                                {(viewingEvent.rundown_segments?.length || 0) >
                                    0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-primary uppercase">
                                                <ListChecks className="h-4 w-4" />
                                                Rundown Event
                                            </h4>
                                            <Badge
                                                variant="outline"
                                                className="rounded-md"
                                            >
                                                Total{' '}
                                                {formatDuration(
                                                    getRundownTotalSeconds(
                                                        viewingEvent.rundown_segments,
                                                    ),
                                                )}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3 rounded-2xl border bg-muted/30 p-5">
                                            {viewingEvent.rundown_segments?.map(
                                                (segment, segmentIndex) => (
                                                    <div
                                                        key={
                                                            segment.id ??
                                                            segmentIndex
                                                        }
                                                        className="rounded-lg border bg-background p-4"
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-bold text-foreground">
                                                                    {segmentIndex +
                                                                        1}
                                                                    .{' '}
                                                                    {
                                                                        segment.title
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Detail item{' '}
                                                                    {formatDuration(
                                                                        getItemTotalSeconds(
                                                                            segment,
                                                                        ),
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant="secondary"
                                                                className="rounded-md"
                                                            >
                                                                {formatDuration(
                                                                    segment.duration_seconds,
                                                                )}
                                                            </Badge>
                                                        </div>
                                                        {segment.items.length >
                                                            0 && (
                                                            <div className="mt-3 divide-y">
                                                                {segment.items.map(
                                                                    (
                                                                        item,
                                                                        itemIndex,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                item.id ??
                                                                                itemIndex
                                                                            }
                                                                            className="flex items-center justify-between gap-3 py-2 text-sm"
                                                                        >
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                                                                                {item.song && (
                                                                                    <div className="space-y-1 mt-1">
                                                                                        <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                                                                                            <Music className="h-2.5 w-2.5" />
                                                                                            {item.song.title}
                                                                                        </p>
                                                                                        {item.song.song_flow && (
                                                                                            <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight ml-3.5">
                                                                                                Flow: {item.song.song_flow}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <span className="font-medium">
                                                                                {formatDuration(
                                                                                    item.duration_seconds,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                                {viewingEvent.volunteers &&
                                    viewingEvent.volunteers.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="flex items-center gap-2 text-sm font-bold tracking-widest text-primary uppercase">
                                                <Users className="h-4 w-4" />
                                                Volunteer Melayani
                                            </h4>
                                            <div className="grid grid-cols-1 gap-x-8 gap-y-3 rounded-2xl border border-primary/10 bg-muted/30 p-5 md:grid-cols-2">
                                                {viewingEvent.volunteers.map(
                                                    (v) => (
                                                        <div
                                                            key={v.id}
                                                            className="flex items-center justify-between border-b border-muted py-1.5 last:border-0"
                                                        >
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {
                                                                    v.role_category
                                                                }{' '}
                                                                - {v.role_name}
                                                            </span>
                                                            <span className="text-xs font-bold text-foreground">
                                                                {v.member
                                                                    ?.namalengkap ||
                                                                    'Unknown'}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-xl px-6"
                                        onClick={() => setViewingEvent(null)}
                                    >
                                        Tutup
                                    </Button>
                                    {(viewingEvent.rundown_segments?.length ||
                                        0) > 0 && (
                                        <Button
                                            variant="outline"
                                            className="h-11 gap-2 rounded-xl px-6"
                                            onClick={() => {
                                                setViewingEvent(null);
                                                setRundownEvent(viewingEvent);
                                            }}
                                        >
                                            <Timer className="h-4 w-4" />
                                            Jalankan Rundown
                                        </Button>
                                    )}
                                    <Button
                                        className="h-11 gap-2 rounded-xl px-8"
                                        onClick={() => {
                                            setViewingEvent(null);
                                            setQrEvent(viewingEvent);
                                        }}
                                    >
                                        <QrCode className="h-4 w-4" />
                                        Generate QR
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Rundown Timer Modal */}
            <Dialog
                open={!!rundownEvent}
                onOpenChange={(open) => !open && setRundownEvent(null)}
            >
                <DialogContent className="max-w-4xl overflow-hidden rounded-2xl p-0">
                    {rundownEvent && (
                        <>
                            <DialogHeader className="border-b p-6">
                                <DialogTitle className="flex items-center gap-2 text-2xl">
                                    <Timer className="h-5 w-5 text-primary" />
                                    Timer Rundown
                                </DialogTitle>
                                <DialogDescription>
                                    {rundownEvent.title} - total rencana{' '}
                                    {formatDuration(rundownTotalSeconds)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
                                <div
                                    className={`border-b p-6 lg:border-r lg:border-b-0 ${overdueSeconds > 0 ? 'bg-red-50 text-red-950 dark:bg-red-950/20 dark:text-red-100' : 'bg-muted/20'}`}
                                >
                                    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                        Waktu Berjalan
                                    </p>
                                    <div
                                        className={`mt-3 font-mono text-6xl font-bold tracking-tight ${overdueSeconds > 0 ? 'text-red-600 dark:text-red-300' : 'text-foreground'}`}
                                    >
                                        {formatDuration(elapsedSeconds)}
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-lg border bg-background/80 p-3">
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                Target
                                            </p>
                                            <p className="mt-1 font-mono text-lg font-semibold">
                                                {formatDuration(
                                                    rundownTotalSeconds,
                                                )}
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-lg border p-3 ${overdueSeconds > 0 ? 'border-red-200 bg-red-100 dark:border-red-900 dark:bg-red-950/30' : 'bg-background/80'}`}
                                        >
                                            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                                Lewat
                                            </p>
                                            <p
                                                className={`mt-1 font-mono text-lg font-semibold ${overdueSeconds > 0 ? 'text-red-700 dark:text-red-300' : ''}`}
                                            >
                                                {formatDuration(overdueSeconds)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <Button
                                            className="flex-1 gap-2"
                                            onClick={() =>
                                                setTimerRunning(
                                                    (current) => !current,
                                                )
                                            }
                                        >
                                            {timerRunning ? (
                                                <Pause className="h-4 w-4" />
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                            {timerRunning ? 'Pause' : 'Start'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                setTimerRunning(false);
                                                setElapsedSeconds(0);
                                            }}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="max-h-[70vh] overflow-y-auto p-6">
                                    <div className="space-y-3">
                                        {rundownTimerPlan.map((segment) => {
                                            const isActive =
                                                elapsedSeconds >=
                                                    segment.startsAt &&
                                                elapsedSeconds < segment.endsAt;
                                            const isDone =
                                                elapsedSeconds >=
                                                segment.endsAt;
                                            const isLate =
                                                isActive &&
                                                elapsedSeconds > segment.endsAt;

                                            return (
                                                <div
                                                    key={
                                                        segment.id ??
                                                        segment.index
                                                    }
                                                    className={`rounded-xl border p-4 transition-colors ${
                                                        isActive
                                                            ? 'border-primary bg-primary/5'
                                                            : isDone
                                                              ? 'bg-muted/30 text-muted-foreground'
                                                              : 'bg-background'
                                                    } ${isLate ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : ''}`}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div>
                                                            <p className="text-sm font-bold">
                                                                {segment.index +
                                                                    1}
                                                                .{' '}
                                                                {segment.title}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {formatDuration(
                                                                    segment.startsAt,
                                                                )}{' '}
                                                                -{' '}
                                                                {formatDuration(
                                                                    segment.endsAt,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            className="rounded-md"
                                                            variant={
                                                                isActive
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {isActive
                                                                ? 'Berjalan'
                                                                : isDone
                                                                  ? 'Selesai'
                                                                  : formatDuration(
                                                                        segment.duration,
                                                                    )}
                                                        </Badge>
                                                    </div>

                                                    {segment.items.length >
                                                        0 && (
                                                        <div className="mt-3 divide-y">
                                                            {segment.items.map(
                                                                (
                                                                    item,
                                                                    itemIndex,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            item.id ??
                                                                            itemIndex
                                                                        }
                                                                        className="flex items-center justify-between gap-3 py-2 text-sm"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground">
                                                                                {item.title}
                                                                            </span>
                                                                            {item.song && (
                                                                                <Badge variant="secondary" className="h-4 px-1 text-[9px] font-bold">
                                                                                    {item.song.keys}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <span className="font-medium">
                                                                            {formatDuration(
                                                                                item.duration_seconds,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* QR Code Modal */}
            <Dialog
                open={!!qrEvent}
                onOpenChange={(open) => !open && setQrEvent(null)}
            >
                <DialogContent className="sm:max-w-md">
                    {qrEvent && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-center">
                                    {qrEvent.title}
                                </DialogTitle>
                                <DialogDescription className="text-center">
                                    Minta jemaat untuk scan QR ini dari HP
                                    mereka
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center space-y-6 p-6">
                                <div className="rounded-xl border bg-white p-4 shadow-sm">
                                    <QRCodeComponent
                                        value={`${window.location.origin}/attendance/${qrEvent.id}/scan`}
                                        size={256}
                                        level="H"
                                    />
                                </div>
                                <div className="space-y-2 text-center">
                                    <p className="text-sm font-medium text-foreground">
                                        {qrEvent.date
                                            ? new Date(
                                                  qrEvent.date,
                                              ).toLocaleDateString('id-ID', {
                                                  weekday: 'long',
                                                  year: 'numeric',
                                                  month: 'long',
                                                  day: 'numeric',
                                              })
                                            : '-'}{' '}
                                        • {qrEvent.time}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {qrEvent.location}
                                    </p>
                                </div>
                            </div>
                            <DialogFooter className="sm:justify-center">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setQrEvent(null)}
                                >
                                    Tutup
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
