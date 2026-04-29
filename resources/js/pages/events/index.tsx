import { Head, router, useForm } from '@inertiajs/react';
import { Building, Calendar as CalendarIcon, ChevronDown, ChevronUp, Clock, Edit2, Eye, Image as ImageIcon, Info, MapPin, Plus, QrCode, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    volunteers?: Volunteer[];
}

interface ExternalMember {
    id: string;
    name: string;
}

const categories = ['Ibadah', 'Pelayanan', 'Seminar', 'Kelas', 'Rapat', 'Lainnya'];

const VOLUNTEER_ROLES = [
    { category: 'Worship', roles: ['WL 1', 'WL 2', 'Drummer', 'Guitar', 'Bass', 'Keyboard Lead', 'Keyboard Filler'] },
    { category: 'Visual', roles: ['Resolume', 'Freeshow', 'Switcher', 'Streaming'] },
    { category: 'Prayer', roles: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    { category: 'Event', roles: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    { category: 'Host', roles: ['1', '2'] },
    { category: 'Preacher', roles: ['Preacher'] },
];

// Move SearchableSelect outside to avoid re-renders and re-definitions
const SearchableSelect = ({
    value,
    onSelect,
    external_members = [],
    placeholder = "Pilih Jemaat..."
}: {
    value: string,
    onSelect: (val: string) => void,
    external_members: ExternalMember[],
    placeholder?: string
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredMembers = useMemo(() => {
        const list = Array.isArray(external_members) ? external_members : [];

        if (!searchTerm) {
return list.slice(0, 50);
}

        return list.filter(m =>
            m.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 50);
    }, [searchTerm, external_members]);

    const selectedMember = Array.isArray(external_members) ? external_members.find(m => m.id === value) : null;

    return (
        <div className="relative w-full">
            <Button
                type="button"
                variant="outline"
                className="w-full justify-between h-9 text-xs font-normal bg-background"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate">{selectedMember ? selectedMember.name : placeholder}</span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center border-b px-3 h-9">
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
                            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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
                                className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-xs outline-none hover:bg-accent hover:text-accent-foreground ${value === member.id ? 'bg-accent' : ''}`}
                                onClick={() => {
                                    onSelect(member.id);
                                    setIsOpen(false);
                                }}
                            >
                                {member.name}
                            </div>
                        ))}
                        {filteredMembers.length === 0 && (
                            <div className="py-6 text-center text-xs text-muted-foreground">Tidak ditemukan.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Events({
    events = [],
    external_members = []
}: {
    events: Event[],
    external_members: ExternalMember[]
}) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
    const [openCategories, setOpenCategories] = useState<string[]>(['Worship']);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        title: '',
        date: '',
        time: '',
        location: '',
        address: '',
        category: 'Ibadah',
        expected: 0,
        image: null as File | null,
        volunteers: [] as { role_category: string; role_name: string; member_id: string }[],
    });

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
                expected: editingEvent.expected || 0,
                image: null,
                volunteers: editingEvent.volunteers?.map(v => ({
                    role_category: v.role_category,
                    role_name: v.role_name,
                    member_id: v.member_id
                })) || []
            }));
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setImagePreview(editingEvent.image_path || null);
        }
    }, [editingEvent]);

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
                const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                toast.success('Event berhasil ditambahkan');
            },
            onError: (err: any) => {
                console.error('Add Event Error:', err);
                toast.error('Gagal menambahkan event. Silakan cek form kembali.');
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingEvent) {
            console.error('No editing event selected');
            return;
        }

        router.post(`/events/${editingEvent.id}`, buildFormData({ _method: 'PUT' }), {
            onSuccess: () => {
                setEditingEvent(null);
                reset();
                setImagePreview(null);
                const fileInput = document.getElementById('image-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
                toast.success('Event berhasil diperbarui');
            },
            onError: (err: any) => {
                console.error('Edit Event Error:', err);
                toast.error('Gagal memperbarui event. Silakan cek form kembali.');
            }
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus event ini?')) {
            post(`/events/${id}`, {
                _method: 'DELETE',
            }, {
                onSuccess: () => toast.success('Event berhasil dihapus'),
            });
        }
    };

    const openEditModal = (event: Event) => {
        // Set editing event first - useEffect will populate the form
        setEditingEvent(event);
        setImagePreview(null);

        // Reset file input
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;

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
        return data.volunteers.find(v => v.role_category === category && v.role_name === role)?.member_id || 'none';
    };

    const setVolunteerValue = (category: string, role: string, memberId: string) => {
        const newVolunteers = [...data.volunteers];
        const index = newVolunteers.findIndex(v => v.role_category === category && v.role_name === role);

        if (memberId === 'none') {
            if (index !== -1) {
newVolunteers.splice(index, 1);
}
        } else {
            if (index !== -1) {
                newVolunteers[index].member_id = memberId;
            } else {
                newVolunteers.push({ role_category: category, role_name: role, member_id: memberId });
            }
        }

        setData('volunteers', newVolunteers);
    };

    const toggleCategory = (category: string) => {
        setOpenCategories(prev =>
            prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
        );
    };

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

                    <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Event Baru
                    </Button>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(!Array.isArray(events) || events.length === 0) ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                            <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p>Belum ada event yang dibuat.</p>
                            <Button variant="link" onClick={() => setIsAddModalOpen(true)}>Buat event pertama Anda</Button>
                        </div>
                    ) : (
                        events.map((event) => (
                            <Card key={event.id} className="group overflow-hidden border bg-card shadow-sm transition-all hover:shadow-md rounded-xl flex flex-col">
                                {/* Event Image */}
                                <div className="aspect-video w-full overflow-hidden bg-muted relative">
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
                                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                                            {event.category}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">{event.title}</h3>
                                        <div className="flex gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(event)}>
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(event.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2.5 flex-1">
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                                            <span>{event.date ? new Date(event.date).toLocaleDateString('id-ID', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4 shrink-0 text-primary" />
                                            <span>{event.time}</span>
                                        </div>
                                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                            <span className="line-clamp-1">{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 text-xs h-9"
                                            onClick={() => setViewingEvent(event)}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Detail
                                        </Button>
                                        <Button className="flex-1 gap-2 text-xs h-9 bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none">
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
                        const fileInput = document.getElementById('image-upload') as HTMLInputElement;

                        if (fileInput) {
fileInput.value = '';
}
                    }
                }}
            >
                <DialogContent
                className="!max-w-[99vw] lg:!max-w-[1600px] !w-[min(99vw,1600px)] max-h-[90vh] overflow-y-auto p-0"
                style={{ width: 'min(99vw, 1600px)', maxWidth: '99vw' }}
            >
                    <form onSubmit={editingEvent ? handleEdit : handleAdd}>
                        <div className="p-6 pb-0">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{editingEvent ? 'Edit Event' : 'Buat Event Baru'}</DialogTitle>
                                <DialogDescription>
                                    Isi informasi detail untuk event pelayanan dan pilih volunteer yang melayani.
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 py-6 px-6">
                            {/* Left Column: Basic Info */}
                            <div className="lg:col-span-7 space-y-6 lg:pr-8 lg:border-r">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                                        <Info className="h-4 w-4" />
                                        Informasi Dasar
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title">Judul Event</Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Contoh: Sunday Service"
                                            className="h-10"
                                        />
                                        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="date">Tanggal</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="date"
                                                    type="date"
                                                    value={data.date}
                                                    onChange={(e) => setData('date', e.target.value)}
                                                    onClick={(e) => (e.target as any).showPicker?.()}
                                                    className="h-10 pl-10 cursor-pointer block w-full"
                                                />
                                                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                                            </div>
                                            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="time">Waktu</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="time"
                                                    type="time"
                                                    value={data.time}
                                                    onChange={(e) => setData('time', e.target.value)}
                                                    onClick={(e) => (e.target as any).showPicker?.()}
                                                    className="h-10 pl-10 cursor-pointer block w-full"
                                                />
                                                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none group-focus-within:text-primary transition-colors" />
                                            </div>
                                            {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Kategori</Label>
                                            <Select
                                                value={data.category}
                                                onValueChange={(value) => setData('category', value)}
                                            >
                                                <SelectTrigger id="category" className="h-10">
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expected">Target Peserta</Label>
                                            <div className="relative">
                                                <Input
                                                    id="expected"
                                                    type="number"
                                                    value={data.expected}
                                                    onChange={(e) => setData('expected', parseInt(e.target.value) || 0)}
                                                    className="h-10 pl-10"
                                                />
                                                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                            </div>
                                            {errors.expected && <p className="text-xs text-destructive">{errors.expected}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location">Lokasi (Nama Ruangan)</Label>
                                        <div className="relative">
                                            <Input
                                                id="location"
                                                value={data.location}
                                                onChange={(e) => setData('location', e.target.value)}
                                                placeholder="Contoh: Main Hall"
                                                className="h-10 pl-10"
                                            />
                                            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Alamat Lengkap</Label>
                                        <div className="relative">
                                            <Input
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Jl. Gajah Mada No. 1..."
                                                className="h-10 pl-10"
                                            />
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                                        <ImageIcon className="h-4 w-4" />
                                        Poster / Gambar Event
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        {imagePreview ? (
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
                                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
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
                                                className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Plus className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground font-medium">Klik untuk upload gambar</p>
                                                    <p className="text-xs text-muted-foreground/60">PNG, JPG atau GIF (Maks. 2MB)</p>
                                                </div>
                                                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                        )}
                                        {errors.image && <p className="text-xs text-destructive">{errors.image}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Volunteers */}
                            <div className="lg:col-span-5 space-y-4 mt-8 lg:mt-0 lg:pl-8">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wider">
                                    <Users className="h-4 w-4" />
                                    Penugasan Volunteer
                                </div>
                                <div className="border rounded-xl overflow-hidden bg-muted/10">
                                    <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
                                        {VOLUNTEER_ROLES.map((group) => (
                                            <Collapsible
                                                key={group.category}
                                                open={openCategories.includes(group.category)}
                                                onOpenChange={() => toggleCategory(group.category)}
                                                className="border rounded-lg bg-background"
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50">
                                                        <span className="font-bold text-xs uppercase tracking-tight text-foreground/70">{group.category}</span>
                                                        {openCategories.includes(group.category) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="space-y-4 px-3 pb-4">
                                                    {group.roles.map((role) => (
                                                        <div key={role} className="space-y-1.5">
                                                            <Label className="text-[10px] font-bold uppercase text-muted-foreground/80 pl-1">{role}</Label>
                                                            <SearchableSelect
                                                                value={getVolunteerValue(group.category, role)}
                                                                onSelect={(val) => setVolunteerValue(group.category, role, val)}
                                                                external_members={external_members}
                                                            />
                                                        </div>
                                                    ))}
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 pt-4 border-t bg-muted/20">
                            <DialogFooter className="flex-row justify-end gap-3">
                                <Button type="button" variant="outline" className="h-10" onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingEvent(null);
                                    setImagePreview(null);
                                    reset();
                                }}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing} className="h-10 px-8">
                                    {processing ? 'Menyimpan...' : (editingEvent ? 'Simpan Perubahan' : 'Buat Event')}
                                </Button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
                    {viewingEvent && (
                        <>
                            <DialogHeader className="sr-only">
                                <DialogTitle>Detail Event</DialogTitle>
                                <DialogDescription>
                                    Informasi lengkap tentang event pelayanan termasuk tanggal, waktu, lokasi, dan volunteer yang bertugas.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="aspect-video w-full bg-muted relative">
                                {viewingEvent.image_path ? (
                                    <img src={viewingEvent.image_path} alt={viewingEvent.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                        <ImageIcon className="h-16 w-16" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 text-white">
                                    <Badge className="mb-3 bg-primary text-primary-foreground border-0">{viewingEvent.category}</Badge>
                                    <h2 className="text-3xl font-bold tracking-tight">{viewingEvent.title}</h2>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tanggal</p>
                                        <p className="text-sm font-semibold">{viewingEvent.date ? new Date(viewingEvent.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Waktu</p>
                                        <p className="text-sm font-semibold">{viewingEvent.time}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lokasi</p>
                                        <p className="text-sm font-semibold">{viewingEvent.location}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Target</p>
                                        <p className="text-sm font-semibold">{viewingEvent.expected} Peserta</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                                        <MapPin className="h-4 w-4" />
                                        Alamat Lokasi
                                    </h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-xl border">
                                        {viewingEvent.address}
                                    </p>
                                </div>

                                {viewingEvent.volunteers && viewingEvent.volunteers.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary">
                                            <Users className="h-4 w-4" />
                                            Volunteer Melayani
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 bg-muted/30 p-5 rounded-2xl border border-primary/10">
                                            {viewingEvent.volunteers.map((v) => (
                                                <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-muted last:border-0">
                                                    <span className="text-xs font-medium text-muted-foreground">{v.role_category} - {v.role_name}</span>
                                                    <span className="text-xs font-bold text-foreground">{v.member?.namalengkap || 'Unknown'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => setViewingEvent(null)}>Tutup</Button>
                                    <Button className="rounded-xl h-11 px-8 gap-2">
                                        <QrCode className="h-4 w-4" />
                                        Generate QR
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
