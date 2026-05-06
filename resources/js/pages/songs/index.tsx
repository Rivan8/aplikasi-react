import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Head, useForm, router } from '@inertiajs/react';
import {
    AudioLines,
    ChevronLeft,
    ChevronRight,
    FileText,
    Filter,
    Printer,
    Download,
    Search,
    ListFilter,
    FileType,
    Guitar,
    Plus,
    Edit2,
    Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { index as songsIndex } from '@/routes/songs';
import { toast } from 'sonner';

interface Song {
    id: number;
    title: string;
    arrangement_name: string | null;
    bpm: string | null;
    keys: string | null;
    last_scheduled_at: string | null;
    has_lyrics: boolean;
    has_chords: boolean;
    has_pdf: boolean;
    has_audio: boolean;
    created_at: string;
}

interface Props {
    songs: {
        data: Song[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
    filters: {
        search?: string;
    };
}

const MUSICAL_KEYS = [
    'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'
];

export default function SongsIndex({ songs, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        title: '',
        arrangement_name: '',
        keys: 'C',
        bpm: '',
        has_lyrics: false,
        has_chords: false,
        has_pdf: false,
        has_audio: false,
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(
                    songsIndex().url,
                    { search },
                    { preserveState: true, replace: true }
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const openAddModal = () => {
        setEditingSong(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (song: Song) => {
        setEditingSong(song);
        setData({
            title: song.title,
            arrangement_name: song.arrangement_name || '',
            keys: song.keys || 'C',
            bpm: song.bpm || '',
            has_lyrics: song.has_lyrics,
            has_chords: song.has_chords,
            has_pdf: song.has_pdf,
            has_audio: song.has_audio,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSong) {
            put(route('songs.update', editingSong.id), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Lagu berhasil diperbarui');
                },
            });
        } else {
            post(route('songs.store'), {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Lagu berhasil ditambahkan');
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus lagu ini?')) {
            router.delete(route('songs.destroy', id), {
                onSuccess: () => toast.success('Lagu berhasil dihapus'),
            });
        }
    };

    if (!songs || !songs.data) {
        return (
            <>
                <Head title="Songs" />
                <div className="p-6 text-center text-muted-foreground">
                    Memuat data lagu...
                </div>
            </>
        );
    }

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const formatDateOnly = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <>
            <Head title="Songs" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Songs</h1>
                    <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Plus className="h-4 w-4" />
                        Add Song
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    {/* Filter Bar */}
                    <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-1">
                        <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
                            <Filter className="h-3.5 w-3.5" />
                            Filter
                        </Button>
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Add text filter"
                                className="h-8 border-none bg-transparent pl-8 text-xs focus-visible:ring-0"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground font-medium">
                                {songs.total} songs
                            </span>
                            <div className="flex items-center gap-1 border-l pl-4">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                            <ListFilter className="h-3.5 w-3.5" />
                            <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                        </Button>
                    </div>

                    <Card className="border shadow-none rounded-none overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[40px]"></TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Title</TableHead>
                                    <TableHead className="w-[40px] text-center"><FileText className="h-3.5 w-3.5 mx-auto" /></TableHead>
                                    <TableHead className="w-[40px] text-center"><FileType className="h-3.5 w-3.5 mx-auto" /></TableHead>
                                    <TableHead className="w-[40px] text-center"><Guitar className="h-3.5 w-3.5 mx-auto" /></TableHead>
                                    <TableHead className="w-[40px] text-center"><AudioLines className="h-3.5 w-3.5 mx-auto" /></TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">BPM</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Keys</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Last Scheduled</TableHead>
                                    <TableHead className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Created</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {songs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                            Tidak ada lagu ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    songs.data.map((song) => (
                                        <TableRow key={song.id} className="group border-b/50 hover:bg-muted/20">
                                            <TableCell>
                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                                            </TableCell>
                                            <TableCell className="font-medium text-[13px]">{song.title}</TableCell>
                                            <TableCell className="text-center">
                                                {song.has_pdf && <FileText className="h-4 w-4 text-muted-foreground/60 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {song.has_lyrics && <FileType className="h-4 w-4 text-muted-foreground/60 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {song.has_chords && <Guitar className="h-4 w-4 text-muted-foreground/60 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {song.has_audio && <AudioLines className="h-4 w-4 text-muted-foreground/60 mx-auto" />}
                                            </TableCell>
                                            <TableCell className="text-[13px] text-muted-foreground">{song.bpm || ''}</TableCell>
                                            <TableCell className="text-[13px] text-muted-foreground">{song.keys || ''}</TableCell>
                                            <TableCell className="text-[13px] text-muted-foreground">{formatDateOnly(song.last_scheduled_at ? song.last_scheduled_at.toString() : null)}</TableCell>
                                            <TableCell className="text-[13px] text-muted-foreground">{formatDateTime(song.created_at)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(song)}>
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(song.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Pagination */}
                    {songs.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={songs.current_page === 1}
                                onClick={() => songs.links[0]?.url && router.get(songs.links[0].url)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {songs.links.filter(link => link.url && !isNaN(Number(link.label))).map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 w-8 text-xs"
                                    onClick={() => router.get(link.url!)}
                                >
                                    {link.label}
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={songs.current_page === songs.last_page}
                                onClick={() => songs.links[songs.links.length - 1]?.url && router.get(songs.links[songs.links.length - 1].url)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-emerald-600 p-4 text-white">
                        <DialogTitle className="text-xl font-semibold">
                            {editingSong ? 'Edit Song' : 'Add Song'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-slate-950">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Title</Label>
                                <Input 
                                    id="title" 
                                    value={data.title} 
                                    onChange={e => setData('title', e.target.value)} 
                                    placeholder="Song title"
                                    className="h-10 border-slate-200"
                                    required
                                />
                                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="arrangement" className="text-sm font-semibold text-slate-600 dark:text-slate-400">Arrangement Name</Label>
                                <Input 
                                    id="arrangement" 
                                    value={data.arrangement_name} 
                                    onChange={e => setData('arrangement_name', e.target.value)} 
                                    placeholder="e.g. Brandon Lake"
                                    className="h-10 border-slate-200"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Key</Label>
                                    <Select value={data.keys} onValueChange={val => setData('keys', val)}>
                                        <SelectTrigger className="h-10 border-slate-200">
                                            <SelectValue placeholder="Select Key" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MUSICAL_KEYS.map(key => (
                                                <SelectItem key={key} value={key}>{key}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400">BPM</Label>
                                    <Input 
                                        value={data.bpm} 
                                        onChange={e => setData('bpm', e.target.value)} 
                                        placeholder="e.g. 70-80"
                                        className="h-10 border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-600 dark:text-slate-400 block mb-2">Select files to import</Label>
                                <div className="flex flex-wrap gap-6">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="lyrics" 
                                            checked={data.has_lyrics} 
                                            onCheckedChange={checked => setData('has_lyrics', !!checked)} 
                                        />
                                        <Label htmlFor="lyrics" className="text-sm cursor-pointer">Lyrics</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="chords" 
                                            checked={data.has_chords} 
                                            onCheckedChange={checked => setData('has_chords', !!checked)} 
                                        />
                                        <Label htmlFor="chords" className="text-sm cursor-pointer">Chord Chart</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="pdf" 
                                            checked={data.has_pdf} 
                                            onCheckedChange={checked => setData('has_pdf', !!checked)} 
                                        />
                                        <Label htmlFor="pdf" className="text-sm cursor-pointer">PDF File</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="audio" 
                                            checked={data.has_audio} 
                                            onCheckedChange={checked => setData('has_audio', !!checked)} 
                                        />
                                        <Label htmlFor="audio" className="text-sm cursor-pointer">Audio</Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 p-4 border-t">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-600"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={processing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
                            >
                                {processing ? 'Submitting...' : 'Submit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
