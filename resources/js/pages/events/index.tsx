import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Building,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit2,
    Eye,
    Image as ImageIcon,
    Info,
    ListChecks,
    MapPin,
    Minus,
    Pause,
    Play,
    Plus,
    QrCode,
    RotateCcw,
    Search,
    Timer,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'sonner';

// Fix for QRCode component in Vite/ESM environments
const QRCodeComponent = (QRCode as any).default || QRCode;

interface Volunteer {
    id: number;
    role_category: string;
    role_name: string;
    member_id: string;
    member?: {
        idjemaat: string;
        namalengkap: string;
    };
}

interface CategoryRole {
    id: number;
    category_id: number;
    department_id: number;
    role_name: string;
    department?: {
        id: number;
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
    description: string;
    roles: CategoryRole[];
}

interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    address: string;
    category: string;
    expected: number;
    image_path?: string;
    attendance_start_time?: string;
    volunteers?: Volunteer[];
    rundown_segments?: EventRundownSegment[];
}

interface ExternalMember {
    id: string;
    name: string;
}

interface EventRundownItem {
    id?: number;
    title: string;
    duration_seconds: number;
}

interface EventRundownSegment {
    id?: number;
    title: string;
    duration_seconds: number;
    items: EventRundownItem[];
}

// Remove hardcoded categories and roles as they will come from props
// const categories = ['Ibadah', 'Pelayanan', 'Seminar', 'Kelas', 'Rapat', 'Lainnya'];
// const VOLUNTEER_ROLES = [...];

// Move SearchableSelect outside to avoid re-renders and re-definitions
const SearchableSelect = ({
    value,
    onSelect,
    external_members = [],
    placeholder = 'Pilih Jemaat...',
}: {
    value: string;
    onSelect: (val: string) => void;
    external_members: ExternalMember[];
    placeholder?: string;
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredMembers = useMemo(() => {
        const list = Array.isArray(external_members) ? external_members : [];

        if (!searchTerm) {
            return list.slice(0, 50);
        }

        return list
            .filter((m) =>
                m.name?.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .slice(0, 50);
    }, [searchTerm, external_members]);

    const selectedMember = Array.isArray(external_members)
        ? external_members.find((m) => m.id === value)
        : null;

    return (
        <div className="relative w-full">
            <Button
                type="button"
                variant="outline"
                className="h-9 w-full justify-between bg-background text-xs font-normal"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">
                    {selectedMember ? selectedMember.name : placeholder}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full animate-in rounded-md border bg-popover text-popover-foreground shadow-md fade-in-0 outline-none zoom-in-95">
                    <div className="flex h-9 items-center border-b px-3">
                        <Search className="mr-2 h-3 w-3 shrink-0 opacity-50" />
                        <input
                            className="flex w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cari nama..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-2 w-2" />
                            </Button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        <div
                            className="relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            onClick={() => {
                                onSelect('none');
                                setIsOpen(false);
                            }}
                        >
                            -- Kosong --
                        </div>
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className={`relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground ${value === member.id ? 'bg-accent' : ''}`}
                                onClick={() => {
                                    onSelect(member.id);
                                    setIsOpen(false);
                                }}
                            >
                                {member.name}
                            </div>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="py-6 text-center text-xs text-muted-foreground">
                                Tidak ditemukan.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const createRundownSegment = (): EventRundownSegment => ({
    title: '',
    duration_seconds: 0,
    items: [],
});

const createRundownItem = (): EventRundownItem => ({
    title: '',
    duration_seconds: 0,
});

const minutesToSeconds = (value: string) => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 60)) : 0;
};

const secondsToMinutesInput = (seconds: number) => {
    if (!seconds) {
        return '';
    }

    return Number((seconds / 60).toFixed(2)).toString();
};

const formatDuration = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainingSeconds = safeSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getRundownTotalSeconds = (segments: EventRundownSegment[] = []) => {
    return segments.reduce((total, segment) => {
        const itemTotal =
            segment.items?.reduce(
                (sum, item) => sum + (Number(item.duration_seconds) || 0),
                0,
            ) || 0;

        const segmentTotal = segment.items?.length > 0 ? itemTotal : (Number(segment.duration_seconds) || 0);
        return total + segmentTotal;
    }, 0);
};

const getItemTotalSeconds = (segment: EventRundownSegment) => {
    return (
        segment.items?.reduce(
            (sum, item) => sum + (Number(item.duration_seconds) || 0),
            0,
        ) || 0
    );
};

export default function Events({
    events = [],
    external_members = [],
    categories = [],
}: {
    events: Event[];
    external_members: ExternalMember[];
    categories: Category[];
}) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [qrEvent, setQrEvent] = useState<Event | null>(null);
    const [rundownEvent, setRundownEvent] = useState<Event | null>(null);
    const [timerRunning, setTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'title'>(
        'date-desc',
    );
    const [dateFilter, setDateFilter] = useState<
        'all' | 'upcoming' | 'past' | 'today'
    >('all');

    const { data, setData, post, put, processing, reset, errors, clearErrors, setError } =
        useForm({
            title: '',
            date: '',
            time: '',
            location: '',
            address: '',
            category: '', // Start empty
            attendance_start_time: '',
            expected: 0,
            image: null as File | null,
            volunteers: [] as {
                role_category: string;
                role_name: string;
                member_id: string;
            }[],
            rundown_segments: [] as EventRundownSegment[],
        });

    // Get current category roles
    const currentCategory = useMemo(() => {
        return categories.find((c) => c.name === data.category);
    }, [data.category, categories]);

    const volunteerGroups = useMemo(() => {
        if (!currentCategory) return [];

        const groups: Record<string, string[]> = {};
        currentCategory.roles.forEach((role) => {
            const deptName = role.department?.name || 'Lainnya';
            if (!groups[deptName]) groups[deptName] = [];
            groups[deptName].push(role.role_name);
        });

        return Object.entries(groups).map(([category, roles]) => ({
            category,
            roles,
        }));
    }, [currentCategory]);

    // Populate volunteers when category changes (only for new events)
    useEffect(() => {
        if (!editingEvent && currentCategory) {
            const newVolunteers = currentCategory.roles.map((role) => ({
                role_category: role.department?.name || 'Lainnya',
                role_name: role.role_name,
                member_id: 'none',
            }));
            setData('volunteers', newVolunteers);

            // Auto open the first category
            if (currentCategory.roles.length > 0) {
                const firstDept = currentCategory.roles[0].department?.name;
                if (firstDept) setOpenCategories([firstDept]);
            }
        }
    }, [data.category, editingEvent, currentCategory]);

    // Effect to populate form when editing event changes
    useEffect(() => {
        if (editingEvent) {
            // Update all form fields at once using a callback to ensure they're all set together
            setData((currentData: any) => ({
                ...currentData,
                title: editingEvent.title || '',
                date: editingEvent.date || '',
                time: editingEvent.time || '',
                location: editingEvent.location || '',
                address: editingEvent.address || '',
                category: editingEvent.category || 'Ibadah',
                attendance_start_time: editingEvent.attendance_start_time || '',
                expected: editingEvent.expected || 0,
                image: null,
                volunteers:
                    editingEvent.volunteers?.map((v) => ({
                        role_category: v.role_category,
                        role_name: v.role_name,
                        member_id: v.member_id,
                    })) || [],
                rundown_segments:
                    editingEvent.rundown_segments?.map((segment) => ({
                        title: segment.title,
                        duration_seconds: segment.duration_seconds || 0,
                        items:
                            segment.items?.map((item) => ({
                                title: item.title,
                                duration_seconds: item.duration_seconds || 0,
                            })) || [],
                    })) || [],
            }));
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImagePreview(editingEvent.image_path || null);
        }
    }, [editingEvent]);

    useEffect(() => {
        if (!timerRunning) {
            return;
        }

        const interval = window.setInterval(() => {
            setElapsedSeconds((current) => current + 1);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [timerRunning]);

    useEffect(() => {
        if (!rundownEvent) {
            setTimerRunning(false);
            setElapsedSeconds(0);
        }
    }, [rundownEvent]);

    const buildFormData = (extra?: Record<string, string>) => {
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('date', data.date);
        fd.append('time', data.time);
        fd.append('location', data.location);
        fd.append('address', data.address);
        fd.append('category', data.category);
        fd.append('expected', String(data.expected));
        fd.append('volunteers', JSON.stringify(data.volunteers));
        fd.append('rundown_segments', JSON.stringify(data.rundown_segments));
        if (data.image) {
            fd.append('image', data.image);
        }
        if (extra) {
            Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        }
        return fd;
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();

        router.post('/events', buildFormData(), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
                setImagePreview(null);
                const fileInput = document.getElementById(
                    'image-upload',
                ) as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                toast.success('Event berhasil ditambahkan');
            },
            onError: (err: any) => {
                console.error('Add Event Error:', err);
                Object.keys(err).forEach((key) => {
                    setError(key as any, err[key]);
                });
                toast.error(
                    'Gagal menambahkan event. Silakan cek form kembali.',
                );
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingEvent) {
            console.error('No editing event selected');
            return;
        }

        router.post(
            `/events/${editingEvent.id}`,
            buildFormData({ _method: 'PUT' }),
            {
                onSuccess: () => {
                    setEditingEvent(null);
                    reset();
                    setImagePreview(null);
                    const fileInput = document.getElementById(
                        'image-upload',
                    ) as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                    toast.success('Event berhasil diperbarui');
                },
                onError: (err: any) => {
                    console.error('Edit Event Error:', err);
                    Object.keys(err).forEach((key) => {
                        setError(key as any, err[key]);
                    });
                    toast.error(
                        'Gagal memperbarui event. Silakan cek form kembali.',
                    );
                },
            },
        );
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus event ini?')) {
            post(route('events.destroy', id), {
                onSuccess: () => toast.success('Event berhasil dihapus'),
            });
        }
    };

    const openEditModal = (event: Event) => {
        // Set editing event first - useEffect will populate the form
        setEditingEvent(event);
        setImagePreview(null);

        // Reset file input
        const fileInput = document.getElementById(
            'image-upload',
        ) as HTMLInputElement;

        if (fileInput) {
            fileInput.value = '';
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

    const getVolunteerValue = (category: string, role: string) => {
        return (
            data.volunteers.find(
                (v) => v.role_category === category && v.role_name === role,
            )?.member_id || 'none'
        );
    };

    const setVolunteerValue = (
        category: string,
        role: string,
        memberId: string,
    ) => {
        const newVolunteers = [...data.volunteers];
        const index = newVolunteers.findIndex(
            (v) => v.role_category === category && v.role_name === role,
        );

        if (memberId === 'none') {
            if (index !== -1) {
                newVolunteers.splice(index, 1);
            }
        } else {
            if (index !== -1) {
                newVolunteers[index].member_id = memberId;
            } else {
                newVolunteers.push({
                    role_category: category,
                    role_name: role,
                    member_id: memberId,
                });
            }
        }

        setData('volunteers', newVolunteers);
    };

    const toggleCategory = (category: string) => {
        setOpenCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    const addRundownSegment = () => {
        setData('rundown_segments', [
            ...data.rundown_segments,
            createRundownSegment(),
        ]);
    };

    const updateRundownSegment = (
        segmentIndex: number,
        changes: Partial<EventRundownSegment>,
    ) => {
        setData(
            'rundown_segments',
            data.rundown_segments.map((segment, index) =>
                index === segmentIndex ? { ...segment, ...changes } : segment,
            ),
        );
    };

    const removeRundownSegment = (segmentIndex: number) => {
        setData(
            'rundown_segments',
            data.rundown_segments.filter((_, index) => index !== segmentIndex),
        );
    };

    const addRundownItem = (segmentIndex: number) => {
        setData(
            'rundown_segments',
            data.rundown_segments.map((segment, index) =>
                index === segmentIndex
                    ? {
                          ...segment,
                          items: [...segment.items, createRundownItem()],
                      }
                    : segment,
            ),
        );
    };

    const updateRundownItem = (
        segmentIndex: number,
        itemIndex: number,
        changes: Partial<EventRundownItem>,
    ) => {
        setData(
            'rundown_segments',
            data.rundown_segments.map((segment, index) =>
                index === segmentIndex
                    ? {
                          ...segment,
                          items: segment.items.map((item, currentItemIndex) =>
                              currentItemIndex === itemIndex
                                  ? { ...item, ...changes }
                                  : item,
                          ),
                      }
                    : segment,
            ),
        );
    };

    const removeRundownItem = (segmentIndex: number, itemIndex: number) => {
        setData(
            'rundown_segments',
            data.rundown_segments.map((segment, index) =>
                index === segmentIndex
                    ? {
                          ...segment,
                          items: segment.items.filter(
                              (_, currentItemIndex) =>
                                  currentItemIndex !== itemIndex,
                          ),
                      }
                    : segment,
            ),
        );
    };

    // Filter and sort events
    const filteredAndSortedEvents = useMemo(() => {
        let filtered = Array.isArray(events) ? [...events] : [];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title.toLowerCase().includes(query) ||
                    event.location.toLowerCase().includes(query) ||
                    event.address.toLowerCase().includes(query),
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(
                (event) => event.category === selectedCategory,
            );
        }

        // Date filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'upcoming') {
            filtered = filtered.filter((event) => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            });
        } else if (dateFilter === 'past') {
            filtered = filtered.filter((event) => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate < today;
            });
        } else if (dateFilter === 'today') {
            filtered = filtered.filter((event) => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate.getTime() === today.getTime();
            });
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date-asc') {
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            } else if (sortBy === 'date-desc') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            } else {
                // title
                return a.title.localeCompare(b.title);
            }
        });

        return filtered;
    }, [events, searchQuery, selectedCategory, dateFilter, sortBy]);

    const rundownTimerPlan = useMemo(() => {
        let cursor = 0;

        return (rundownEvent?.rundown_segments || []).map((segment, index) => {
            const itemTotal = getItemTotalSeconds(segment);
            const duration = segment.items?.length > 0 ? itemTotal : (Number(segment.duration_seconds) || itemTotal);
            const startsAt = cursor;
            const endsAt = startsAt + duration;
            cursor = endsAt;

            return {
                ...segment,
                index,
                duration,
                startsAt,
                endsAt,
            };
        });
    }, [rundownEvent]);

    const rundownTotalSeconds = rundownTimerPlan.reduce(
        (total, segment) => total + segment.duration,
        0,
    );
    const overdueSeconds = Math.max(0, elapsedSeconds - rundownTotalSeconds);

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
                            Kelola event mendatang dan penugasan volunteer.
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Event Baru
                    </Button>
                </div>

                {/* Search and Filter Section */}
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Cari Event
                            </label>
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Judul, lokasi, atau alamat..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="border-border bg-muted/30 pl-10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Kategori
                            </label>
                            <Select
                                value={selectedCategory}
                                onValueChange={setSelectedCategory}
                            >
                                <SelectTrigger className="border-border bg-muted/30">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kategori
                                    </SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem
                                            key={cat.id}
                                            value={cat.name}
                                        >
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Periode
                            </label>
                            <Select
                                value={dateFilter}
                                onValueChange={(value: any) =>
                                    setDateFilter(value)
                                }
                            >
                                <SelectTrigger className="border-border bg-muted/30">
                                    <SelectValue placeholder="Semua Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Periode
                                    </SelectItem>
                                    <SelectItem value="upcoming">
                                        Mendatang
                                    </SelectItem>
                                    <SelectItem value="today">
                                        Hari Ini
                                    </SelectItem>
                                    <SelectItem value="past">
                                        Sudah Lewat
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                                Urutkan
                            </label>
                            <Select
                                value={sortBy}
                                onValueChange={(value: any) => setSortBy(value)}
                            >
                                <SelectTrigger className="border-border bg-muted/30">
                                    <SelectValue placeholder="Pilih Urutan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date-desc">
                                        Tanggal Terdekat
                                    </SelectItem>
                                    <SelectItem value="date-asc">
                                        Tanggal Terjauh
                                    </SelectItem>
                                    <SelectItem value="title">
                                        Nama Event (A-Z)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {(searchQuery ||
                        selectedCategory !== 'all' ||
                        dateFilter !== 'all') && (
                        <div className="mt-4 flex items-center gap-3 border-t pt-4">
                            <span className="text-sm text-muted-foreground">
                                Menampilkan {filteredAndSortedEvents.length}{' '}
                                dari {events.length} event
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                    setDateFilter('all');
                                    setSortBy('date-desc');
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Reset Filter
                            </Button>
                        </div>
                    )}
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedEvents.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-muted-foreground">
                            <Search className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">
                                {events.length === 0
                                    ? 'Belum ada event yang dibuat.'
                                    : 'Tidak ada event yang sesuai filter.'}
                            </p>
                            {events.length === 0 ? (
                                <Button
                                    variant="link"
                                    onClick={() => setIsAddModalOpen(true)}
                                >
                                    Buat event pertama Anda
                                </Button>
                            ) : (
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSelectedCategory('all');
                                        setDateFilter('all');
                                    }}
                                >
                                    Reset filter untuk melihat semua event
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredAndSortedEvents.map((event) => (
                            <Card
                                key={event.id}
                                className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md"
                            >
                                {/* Event Image */}
                                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                    {event.image_path ? (
                                        <img
                                            src={event.image_path}
                                            alt={event.title}
                                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                                            <ImageIcon className="h-12 w-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3">
                                        <Badge
                                            variant="secondary"
                                            className="bg-background/80 backdrop-blur-sm"
                                        >
                                            {event.category}
                                        </Badge>
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        {(() => {
                                            const eventDate = new Date(
                                                event.date,
                                            );
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            eventDate.setHours(0, 0, 0, 0);

                                            if (
                                                eventDate.getTime() ===
                                                today.getTime()
                                            ) {
                                                return (
                                                    <Badge className="border-0 bg-emerald-500 text-white">
                                                        Hari Ini
                                                    </Badge>
                                                );
                                            } else if (eventDate > today) {
                                                return (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-primary/20 bg-background/80 text-primary backdrop-blur-sm"
                                                    >
                                                        Mendatang
                                                    </Badge>
                                                );
                                            } else {
                                                return (
                                                    <Badge
                                                        variant="outline"
                                                        className="border-muted-foreground/20 bg-background/80 text-muted-foreground backdrop-blur-sm"
                                                    >
                                                        Selesai
                                                    </Badge>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>

                                <CardContent className="flex flex-1 flex-col p-5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="line-clamp-2 text-lg leading-tight font-bold text-foreground">
                                            {event.title}
                                        </h3>
                                        <div className="flex shrink-0 gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    openEditModal(event)
                                                }
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() =>
                                                    handleDelete(event.id)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex-1 space-y-2.5">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                                            <span>
                                                {event.date
                                                    ? new Date(
                                                          event.date,
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                          {
                                                              weekday: 'short',
                                                              year: 'numeric',
                                                              month: 'short',
                                                              day: 'numeric',
                                                          },
                                                      )
                                                    : '-'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4 shrink-0 text-primary" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                            <span className="line-clamp-1">
                                                {event.location}
                                            </span>
                                        </div>
                                        {(event.rundown_segments?.length || 0) >
                                            0 && (
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                                                <span>
                                                    {formatDuration(
                                                        getRundownTotalSeconds(
                                                            event.rundown_segments,
                                                        ),
                                                    )}{' '}
                                                    rundown
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-9 flex-1 gap-2 text-xs"
                                            onClick={() =>
                                                setViewingEvent(event)
                                            }
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Detail
                                        </Button>
                                        <Button
                                            className="h-9 flex-1 gap-2 border-0 bg-primary/10 text-xs text-primary shadow-none hover:bg-primary/20"
                                            onClick={() => setQrEvent(event)}
                                        >
                                            <QrCode className="h-3.5 w-3.5" />
                                            QR Code
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog
                open={isAddModalOpen || !!editingEvent}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddModalOpen(false);
                        setEditingEvent(null);
                        setImagePreview(null);
                        clearErrors();
                        reset();
                        // Reset file input
                        const fileInput = document.getElementById(
                            'image-upload',
                        ) as HTMLInputElement;

                        if (fileInput) {
                            fileInput.value = '';
                        }
                    }
                }}
            >
                <DialogContent
                    className="max-h-[90vh] !w-[min(99vw,1600px)] !max-w-[99vw] overflow-y-auto p-0 lg:!max-w-[1600px]"
                    style={{ width: 'min(99vw, 1600px)', maxWidth: '99vw' }}
                >
                    <form onSubmit={editingEvent ? handleEdit : handleAdd}>
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">
                                    {editingEvent
                                        ? 'Edit Event'
                                        : 'Buat Event Baru'}
                                </DialogTitle>
                                <DialogDescription>
                                    Isi informasi detail untuk event pelayanan
                                    dan pilih volunteer yang melayani.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="grid grid-cols-1 gap-0 px-6 py-6 lg:grid-cols-12">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-6 lg:col-span-7 lg:border-r lg:pr-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
                                        <Info className="h-4 w-4" />
                                        Informasi Dasar
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">
                                            Judul Event
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) =>
                                                setData('title', e.target.value)
                                            }
                                            placeholder="Contoh: Sunday Service"
                                            className="h-10"
                                        />
                                        {errors.title && (
                                            <p className="text-xs text-destructive">
                                                {errors.title}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date">
                                                Tanggal
                                            </Label>
                                            <div className="group relative">
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={data.date}
                                                    onChange={(e) =>
                                                        setData(
                                                            'date',
                                                            e.target.value,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        (
                                                            e.target as any
                                                        ).showPicker?.()
                                                    }
                                                    className="block h-10 w-full cursor-pointer pl-10"
                                                />
                                                <CalendarIcon className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            </div>
                                            {errors.date && (
                                                <p className="text-xs text-destructive">
                                                    {errors.date}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="time">Waktu</Label>
                                            <div className="group relative">
                                                <Input
                                                    id="time"
                                                    type="time"
                                                    value={data.time}
                                                    onChange={(e) =>
                                                        setData(
                                                            'time',
                                                            e.target.value,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        (
                                                            e.target as any
                                                        ).showPicker?.()
                                                    }
                                                    className="block h-10 w-full cursor-pointer pl-10"
                                                />
                                                <Clock className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            </div>
                                            {errors.time && (
                                                <p className="text-xs text-destructive">
                                                    {errors.time}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">
                                                Kategori
                                            </Label>
                                            <Select
                                                value={data.category}
                                                onValueChange={(value) =>
                                                    setData('category', value)
                                                }
                                            >
                                                <SelectTrigger
                                                    id="category"
                                                    className="h-10"
                                                >
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem
                                                            key={cat.id}
                                                            value={cat.name}
                                                        >
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category && (
                                                <p className="text-xs text-destructive">
                                                    {errors.category}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="attendance_start_time">Waktu Absensi (Batas Telat)</Label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-[10px] text-primary"
                                                    onClick={() => {
                                                        if (data.time) {
                                                            const [hours, minutes] = data.time.split(':').map(Number);
                                                            const date = new Date();
                                                            date.setHours(hours, minutes, 0);
                                                            // Subtract 1 hour 30 minutes (90 minutes)
                                                            date.setMinutes(date.getMinutes() - 90);
                                                            const newTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                                                            setData('attendance_start_time', newTime);
                                                        }
                                                    }}
                                                >
                                                    Set 1.5 Jam Awal
                                                </Button>
                                            </div>
                                            <div className="group relative">
                                                <Input
                                                    id="attendance_start_time"
                                                    type="time"
                                                    value={data.attendance_start_time}
                                                    onChange={(e) =>
                                                        setData(
                                                            'attendance_start_time',
                                                            e.target.value,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        (
                                                            e.target as any
                                                        ).showPicker?.()
                                                    }
                                                    className="block h-10 w-full cursor-pointer pl-10"
                                                />
                                                <Timer className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground italic leading-none">
                                                Kosong = Mengikuti waktu event.
                                            </p>
                                            {errors.attendance_start_time && (
                                                <p className="text-xs text-destructive">
                                                    {errors.attendance_start_time}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expected">
                                                Target Peserta
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="expected"
                                                    type="number"
                                                    value={data.expected}
                                                    onChange={(e) =>
                                                        setData(
                                                            'expected',
                                                            parseInt(
                                                                e.target.value,
                                                            ) || 0,
                                                        )
                                                    }
                                                    className="h-10 pl-10"
                                                />
                                                <Users className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            </div>
                                            {errors.expected && (
                                                <p className="text-xs text-destructive">
                                                    {errors.expected}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">
                                            Lokasi (Nama Ruangan)
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="location"
                                                value={data.location}
                                                onChange={(e) =>
                                                    setData(
                                                        'location',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Main Hall"
                                                className="h-10 pl-10"
                                            />
                                            <Building className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {errors.location && (
                                            <p className="text-xs text-destructive">
                                                {errors.location}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">
                                            Alamat Lengkap
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="address"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Jl. Gajah Mada No. 1..."
                                                className="h-10 pl-10"
                                            />
                                            <MapPin className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {errors.address && (
                                            <p className="text-xs text-destructive">
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
                                            <ListChecks className="h-4 w-4" />
                                            Rundown Event
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="rounded-md"
                                        >
                                            {formatDuration(
                                                getRundownTotalSeconds(
                                                    data.rundown_segments,
                                                ),
                                            )}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 rounded-xl border bg-muted/10 p-4">
                                        {data.rundown_segments.length === 0 && (
                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                Belum ada rundown untuk event
                                                ini.
                                            </div>
                                        )}

                                        {data.rundown_segments.map(
                                            (segment, segmentIndex) => (
                                                <div
                                                    key={segmentIndex}
                                                    className="space-y-3 rounded-lg border bg-background p-3"
                                                >
                                                    <div className="grid gap-3 md:grid-cols-[1fr_100px_36px] md:items-end">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                                Segment
                                                            </Label>
                                                            <Input
                                                                value={
                                                                    segment.title
                                                                }
                                                                onChange={(e) =>
                                                                    updateRundownSegment(
                                                                        segmentIndex,
                                                                        {
                                                                            title: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder="Praise and Worship"
                                                                className="h-9"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5 flex flex-col">
                                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">
                                                                Total
                                                            </Label>
                                                            <div className="flex h-9 items-center px-3 rounded-md border bg-muted/50 text-sm font-medium">
                                                                {formatDuration(getItemTotalSeconds(segment))}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-destructive"
                                                            onClick={() =>
                                                                removeRundownSegment(
                                                                    segmentIndex,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-2 border-l pl-3">
                                                        {segment.items.map(
                                                            (
                                                                item,
                                                                itemIndex,
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        itemIndex
                                                                    }
                                                                    className="grid gap-2 md:grid-cols-[1fr_120px_32px] md:items-center"
                                                                >
                                                                    <Input
                                                                        value={
                                                                            item.title
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRundownItem(
                                                                                segmentIndex,
                                                                                itemIndex,
                                                                                {
                                                                                    title: e
                                                                                        .target
                                                                                        .value,
                                                                                },
                                                                            )
                                                                        }
                                                                        placeholder="Lagu 1"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.5"
                                                                        value={secondsToMinutesInput(
                                                                            item.duration_seconds,
                                                                        )}
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateRundownItem(
                                                                                segmentIndex,
                                                                                itemIndex,
                                                                                {
                                                                                    duration_seconds:
                                                                                        minutesToSeconds(
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        ),
                                                                                },
                                                                            )
                                                                        }
                                                                        placeholder="3"
                                                                        className="h-8 text-xs"
                                                                    />
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                        onClick={() =>
                                                                            removeRundownItem(
                                                                                segmentIndex,
                                                                                itemIndex,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Minus className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            ),
                                                        )}

                                                        <div className="flex items-center justify-between gap-3">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 gap-2 text-xs"
                                                                onClick={() =>
                                                                    addRundownItem(
                                                                        segmentIndex,
                                                                    )
                                                                }
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                Tambah Item
                                                            </Button>
                                                            <span className="text-xs text-muted-foreground">
                                                                Detail:{' '}
                                                                {formatDuration(
                                                                    getItemTotalSeconds(
                                                                        segment,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={addRundownSegment}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Tambah Segment Rundown
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
                                        <ImageIcon className="h-4 w-4" />
                                        Poster / Gambar Event
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {imagePreview ? (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        setData('image', null);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="image-upload"
                                                className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Plus className="mb-3 h-8 w-8 text-muted-foreground" />
                                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                                        Klik untuk upload gambar
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60">
                                                        PNG, JPG atau GIF (Maks.
                                                        2MB)
                                                    </p>
                                                </div>
                                                <input
                                                    id="image-upload"
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                        )}
                                        {errors.image && (
                                            <p className="text-xs text-destructive">
                                                {errors.image}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Volunteers */}
                            <div className="mt-8 space-y-4 lg:col-span-5 lg:mt-0 lg:pl-8">
                                <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
                                    <Users className="h-4 w-4" />
                                    Penugasan Volunteer
                                </div>
                                <div className="overflow-hidden rounded-xl border bg-muted/10">
                                    <div className="max-h-[600px] space-y-3 overflow-y-auto p-4">
                                        {volunteerGroups.length > 0 ? (
                                            volunteerGroups.map((group) => (
                                                <Collapsible
                                                    key={group.category}
                                                    open={openCategories.includes(
                                                        group.category,
                                                    )}
                                                    onOpenChange={() =>
                                                        toggleCategory(
                                                            group.category,
                                                        )
                                                    }
                                                    className="rounded-lg border bg-background"
                                                >
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex h-auto w-full items-center justify-between p-3 hover:bg-muted/50"
                                                        >
                                                            <span className="text-xs font-bold tracking-tight text-foreground/70 uppercase">
                                                                {group.category}
                                                            </span>
                                                            {openCategories.includes(
                                                                group.category,
                                                            ) ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent className="space-y-4 px-3 pb-4">
                                                        {group.roles.map(
                                                            (role) => (
                                                                <div
                                                                    key={role}
                                                                    className="space-y-1.5"
                                                                >
                                                                    <Label className="pl-1 text-[10px] font-bold text-muted-foreground/80 uppercase">
                                                                        {role}
                                                                    </Label>
                                                                    <SearchableSelect
                                                                        value={getVolunteerValue(
                                                                            group.category,
                                                                            role,
                                                                        )}
                                                                        onSelect={(
                                                                            val,
                                                                        ) =>
                                                                            setVolunteerValue(
                                                                                group.category,
                                                                                role,
                                                                                val,
                                                                            )
                                                                        }
                                                                        external_members={
                                                                            external_members
                                                                        }
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center text-muted-foreground">
                                                <p className="text-sm">
                                                    Pilih kategori untuk melihat
                                                    daftar volunteer.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t bg-muted/20 p-6 pt-4">
                            <DialogFooter className="flex-row justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        setEditingEvent(null);
                                        setImagePreview(null);
                                        reset();
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-10 px-8"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : editingEvent
                                          ? 'Simpan Perubahan'
                                          : 'Buat Event'}
                                </Button>
                            </DialogFooter>
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
                                                                            <span className="text-muted-foreground">
                                                                                {
                                                                                    item.title
                                                                                }
                                                                            </span>
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
                                                                        <span className="text-muted-foreground">
                                                                            {
                                                                                item.title
                                                                            }
                                                                        </span>
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
