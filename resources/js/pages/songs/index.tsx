import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    Music, 
    Search, 
    Plus, 
    Pencil, 
    Trash2, 
    FileText, 
    LayoutList, 
    Video, 
    FileIcon,
    Youtube,
    ExternalLink,
    PlusCircle,
    Trash,
    Eye,
    ChevronRight,
    Clock,
    Hash,
    MoreVertical,
    PlusSquare,
    Link as LinkIcon,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SongArrangement {
    id: number;
    song_id: number;
    name: string;
    duration: string | null;
    bpm: string | null;
    time_signature: string | null;
    song_flow: string | null;
    keys: string | null;
    lyrics: string | null;
    chords: string | null;
    video_url: string | null;
    pdf_path: string | null;
    has_lyrics: boolean;
    has_chords: boolean;
    has_pdf: boolean;
    has_audio: boolean;
    created_at: string;
}

interface Song {
    id: number;
    title: string;
    artist: string | null;
    arrangements: SongArrangement[];
    created_at: string;
}

interface Props {
    songs: {
        data: Song[];
        links: any;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
    breadcrumbs: BreadcrumbItem[];
}

const MUSICAL_KEYS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '12/8', '2/2'];

export default function SongsIndex({ songs, filters, breadcrumbs }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedSongId, setSelectedSongId] = useState<number | null>(songs.data[0]?.id || null);
    const [selectedArrangementId, setSelectedArrangementId] = useState<number | null>(null);
    
    // Modal states
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);
    const [isArrangementModalOpen, setIsArrangementModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [editingArrangement, setEditingArrangement] = useState<SongArrangement | null>(null);
    
    const selectedSong = useMemo(() => 
        songs.data.find(s => s.id === selectedSongId) || null
    , [selectedSongId, songs.data]);

    const activeArrangement = useMemo(() => {
        if (!selectedSong) return null;
        if (selectedArrangementId) {
            return selectedSong.arrangements.find(a => a.id === selectedArrangementId) || selectedSong.arrangements[0];
        }
        return selectedSong.arrangements[0];
    }, [selectedSong, selectedArrangementId]);

    // Forms
    const songForm = useForm({
        title: '',
        artist: '',
        // Initial arrangement data (for new song)
        arrangement_name: 'Default Arrangement',
        duration: '',
        bpm: '',
        time_signature: '4/4',
    });

    const arrangementForm = useForm({
        name: '',
        duration: '',
        bpm: '',
        time_signature: '4/4',
        song_flow: '',
        keys: 'C',
        lyrics: '',
        video_url: '',
        pdf_file: null as File | null,
        _method: 'POST' as 'POST' | 'PUT',
    });

    const [lyricSections, setLyricSections] = useState<{heading: string; body: string}[]>([]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/songs', { search }, { preserveState: true, replace: true });
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    // --- Actions ---

    const openAddSong = () => {
        setEditingSong(null);
        songForm.reset();
        setIsSongModalOpen(true);
    };

    const openEditSong = (song: Song) => {
        setEditingSong(song);
        songForm.setData({
            title: song.title,
            artist: song.artist || '',
            arrangement_name: '', // Not used in edit
            duration: '',
            bpm: '',
            time_signature: '',
        });
        setIsSongModalOpen(true);
    };

    const openAddArrangement = () => {
        if (!selectedSong) return;
        setEditingArrangement(null);
        arrangementForm.reset();
        arrangementForm.setData('_method', 'POST');
        setLyricSections([]);
        setIsArrangementModalOpen(true);
    };

    const openEditArrangement = (arr: SongArrangement) => {
        setEditingArrangement(arr);
        setLyricSections(parseLyricsToSections(arr.lyrics || ''));
        arrangementForm.setData({
            name: arr.name,
            duration: arr.duration || '',
            bpm: arr.bpm || '',
            time_signature: arr.time_signature || '4/4',
            song_flow: arr.song_flow || '',
            keys: arr.keys || 'C',
            lyrics: arr.lyrics || '',
            video_url: arr.video_url || '',
            pdf_file: null,
            _method: 'PUT',
        });
        setIsArrangementModalOpen(true);
    };

    const handleSongSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSong) {
            songForm.put(`/songs/${editingSong.id}`, {
                onSuccess: () => {
                    setIsSongModalOpen(false);
                    toast.success('Lagu berhasil diperbarui');
                }
            });
        } else {
            songForm.post('/songs', {
                onSuccess: () => {
                    setIsSongModalOpen(false);
                    toast.success('Lagu dan aransemen awal berhasil dibuat');
                }
            });
        }
    };

    const handleArrangementSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lyricsText = lyricSections.map(s => `${s.heading.trim()}\n${s.body.trim()}`).join('\n\n\n');
        
        if (editingArrangement) {
            arrangementForm.transform(data => ({ ...data, lyrics: lyricsText }));
            arrangementForm.post(`/arrangements/${editingArrangement.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setIsArrangementModalOpen(false);
                    toast.success('Aransemen berhasil diperbarui');
                }
            });
        } else {
            arrangementForm.transform(data => ({ ...data, lyrics: lyricsText }));
            arrangementForm.post(`/songs/${selectedSongId}/arrangements`, {
                forceFormData: true,
                onSuccess: () => {
                    setIsArrangementModalOpen(false);
                    toast.success('Aransemen baru berhasil ditambahkan');
                }
            });
        }
    };

    const deleteSong = (id: number) => {
        if (confirm('Hapus seluruh lagu dan semua aransemennya?')) {
            router.delete(`/songs/${id}`, { onSuccess: () => toast.success('Lagu dihapus') });
        }
    };

    const deleteArrangement = (id: number) => {
        if (confirm('Hapus aransemen ini?')) {
            router.delete(`/arrangements/${id}`, { onSuccess: () => toast.success('Aransemen dihapus') });
        }
    };

    // --- Helpers ---
    const parseLyricsToSections = (text: string) => {
        if (!text?.trim()) return [];
        let blocks = text.split(/\n\s*\n\s*\n/);
        if (blocks.length <= 1) blocks = text.split(/\n\s*\n/);
        return blocks.map(block => {
            const lines = block.trim().split('\n');
            return { heading: lines[0] || '', body: lines.slice(1).join('\n').trim() };
        }).filter(s => s.heading || s.body);
    };

    const addLyricSection = () => setLyricSections([...lyricSections, { heading: 'Section', body: '' }]);
    const updateLyricSection = (idx: number, field: 'heading' | 'body', val: string) => {
        setLyricSections(lyricSections.map((s, i) => i === idx ? { ...s, [field]: val } : s));
    };
    const removeLyricSection = (idx: number) => setLyricSections(lyricSections.filter((_, i) => i !== idx));

    return (
        <>
            <Head title="Song Bank" />

            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* LEFT SIDEBAR: Song List */}
                <div className="w-80 flex flex-col border-r bg-white dark:bg-slate-900 shadow-sm z-10">
                    <div className="p-4 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg">Songs</h2>
                            <Button size="icon" variant="ghost" onClick={openAddSong} className="h-8 w-8 text-emerald-600">
                                <PlusSquare className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search songs..." 
                                className="pl-9 h-9 bg-slate-50 border-none text-sm"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {songs.data.map((song) => (
                            <button
                                key={song.id}
                                onClick={() => setSelectedSongId(song.id)}
                                className={cn(
                                    "w-full text-left p-4 border-b transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group",
                                    selectedSongId === song.id ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("font-bold truncate text-sm", selectedSongId === song.id ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white")}>
                                            {song.title}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{song.artist || 'Unknown Author'}</p>
                                    </div>
                                    <ChevronRight className={cn("h-4 w-4 text-slate-300 transition-transform", selectedSongId === song.id && "translate-x-1 text-emerald-500")} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT: Selected Song Details */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedSong ? (
                        <>
                            {/* Song Header */}
                            <div className="bg-white dark:bg-slate-900 p-6 border-b flex items-center justify-between shadow-sm">
                                <div>
                                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                                        {selectedSong.title}
                                    </h1>
                                    <p className="text-slate-500 font-medium mt-2">{selectedSong.artist || 'No Author Specified'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="gap-2 font-bold text-xs uppercase tracking-wider">
                                                Actions <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => openEditSong(selectedSong)} className="gap-2">
                                                <Pencil className="h-4 w-4" /> Edit Song Info
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => deleteSong(selectedSong.id)} className="gap-2 text-rose-600">
                                                <Trash2 className="h-4 w-4" /> Delete Song
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Sub-Sidebar: Arrangements */}
                                <div className="w-64 border-r bg-slate-50/50 dark:bg-slate-900/50 flex flex-col">
                                    <div className="p-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                                        Arrangements
                                    </div>
                                    <div className="flex-1 overflow-y-auto py-2">
                                        {selectedSong.arrangements.map((arr) => (
                                            <button
                                                key={arr.id}
                                                onClick={() => setSelectedArrangementId(arr.id)}
                                                className={cn(
                                                    "w-full text-left px-6 py-3 text-sm transition-colors relative",
                                                    (selectedArrangementId === arr.id || (!selectedArrangementId && selectedSong.arrangements[0]?.id === arr.id))
                                                        ? "bg-white dark:bg-slate-800 text-emerald-600 font-bold shadow-sm"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                                )}
                                            >
                                                {(selectedArrangementId === arr.id || (!selectedArrangementId && selectedSong.arrangements[0]?.id === arr.id)) && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                                                )}
                                                {arr.name}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={openAddArrangement}
                                            className="w-full text-left px-6 py-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-2"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Add Arrangement
                                        </button>
                                    </div>
                                </div>

                                {/* Content: Active Arrangement Details */}
                                <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950">
                                    {activeArrangement ? (
                                        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
                                            {/* Top Metadata */}
                                            <div className="flex flex-wrap items-center gap-8 border-b pb-8">
                                                <div className="flex items-center gap-4">
                                                    <h2 className="text-3xl font-bold">{activeArrangement.name}</h2>
                                                    <Button size="icon" variant="ghost" onClick={() => openEditArrangement(activeArrangement)} className="h-8 w-8 text-slate-400 hover:text-emerald-600">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => deleteArrangement(activeArrangement.id)} className="h-8 w-8 text-slate-400 hover:text-rose-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                
                                                <div className="flex gap-8 text-sm">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Length</p>
                                                        <p className="font-mono font-bold text-lg">{activeArrangement.duration || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">BPM</p>
                                                        <p className="font-mono font-bold text-lg">{activeArrangement.bpm || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meter</p>
                                                        <p className="font-mono font-bold text-lg">{activeArrangement.time_signature || '-'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Key</p>
                                                        <Badge className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-0.5 text-base font-bold">
                                                            {activeArrangement.keys || '-'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sequence */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <LayoutList className="h-4 w-4" />
                                                    <p className="text-xs font-black uppercase tracking-widest">Sequence</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium italic">
                                                    {activeArrangement.song_flow || 'No sequence defined for this arrangement.'}
                                                </div>
                                            </div>

                                            {/* Resource Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Lyrics & Media */}
                                                <Card className="shadow-sm border-slate-100 dark:border-slate-800 overflow-hidden">
                                                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3 px-5 border-b">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="text-xs font-black uppercase tracking-widest">Arrangement Detail</span>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-6 space-y-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-4 group">
                                                                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0">
                                                                    <FileText className="h-4 w-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold">Lyrics</p>
                                                                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[13px] font-mono leading-relaxed whitespace-pre-wrap text-slate-600 max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-800">
                                                                        {activeArrangement.lyrics || 'No lyrics available.'}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {activeArrangement.video_url && (
                                                                <div className="flex items-center gap-4 group">
                                                                    <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 shrink-0">
                                                                        <Youtube className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-bold">YouTube Reference</p>
                                                                        <a 
                                                                            href={activeArrangement.video_url} 
                                                                            target="_blank" 
                                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                                                        >
                                                                            {activeArrangement.video_url} <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Files */}
                                                <Card className="shadow-sm border-slate-100 dark:border-slate-800 overflow-hidden h-fit">
                                                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 py-3 px-5 border-b">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-slate-600">
                                                                <FileIcon className="h-4 w-4" />
                                                                <span className="text-xs font-black uppercase tracking-widest">Files</span>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-6">
                                                        {activeArrangement.pdf_path ? (
                                                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded flex items-center justify-center">
                                                                        <FileIcon className="h-6 w-6" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold">Chord Chart (PDF)</p>
                                                                        <p className="text-[10px] text-slate-400 uppercase font-black">Ready to Download</p>
                                                                    </div>
                                                                </div>
                                                                <Button size="sm" asChild variant="outline" className="h-8 text-xs font-bold">
                                                                    <a href={`/storage/${activeArrangement.pdf_path}`} target="_blank">View File</a>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="py-12 text-center border-2 border-dashed rounded-xl border-slate-100 dark:border-slate-800">
                                                                <FileIcon className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                                                <p className="text-xs text-slate-400 italic">No files attached to this arrangement.</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </div>

                                            <div className="pt-12 text-[10px] text-slate-300 font-bold uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="h-3 w-3" /> Created at {new Date(activeArrangement.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <Music className="h-16 w-16 mb-4 opacity-10" />
                                            <p className="text-lg font-medium italic">Select an arrangement to view details</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                <Music className="h-10 w-10 opacity-20" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-600 dark:text-slate-400">No Song Selected</h3>
                                <p className="text-sm mt-1">Select a song from the sidebar to view details</p>
                            </div>
                            <Button onClick={openAddSong} className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 mt-4">
                                <PlusSquare className="h-4 w-4" /> Create First Song
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* ADD/EDIT SONG MODAL */}
            <Dialog open={isSongModalOpen} onOpenChange={setIsSongModalOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-emerald-600 p-6 text-white">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">
                            {editingSong ? 'EDIT SONG' : 'ADD NEW SONG'}
                        </DialogTitle>
                        <p className="text-emerald-100 text-xs font-medium uppercase tracking-widest mt-1 opacity-80">General Information</p>
                    </DialogHeader>
                    
                    <form onSubmit={handleSongSubmit} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="s_title" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Song Title</Label>
                                <Input id="s_title" value={songForm.data.title} onChange={e => songForm.setData('title', e.target.value)} required className="h-12 text-lg font-bold" placeholder="e.g. 10,000 Reasons" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="s_artist" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Artist / Author</Label>
                                <Input id="s_artist" value={songForm.data.artist} onChange={e => songForm.setData('artist', e.target.value)} className="h-12" placeholder="e.g. Matt Redman" />
                            </div>

                            {!editingSong && (
                                <div className="mt-8 pt-8 border-t space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600">Initial Arrangement</h3>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Arrangement Name</Label>
                                        <Input value={songForm.data.arrangement_name} onChange={e => songForm.setData('arrangement_name', e.target.value)} placeholder="e.g. Original, Studio, Elsa" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Length</Label>
                                            <Input value={songForm.data.duration} onChange={e => songForm.setData('duration', e.target.value)} placeholder="4:21" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">BPM</Label>
                                            <Input value={songForm.data.bpm} onChange={e => songForm.setData('bpm', e.target.value)} placeholder="80" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meter</Label>
                                            <Select value={songForm.data.time_signature} onValueChange={v => songForm.setData('time_signature', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{TIME_SIGNATURES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsSongModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={songForm.processing} className="bg-emerald-600 hover:bg-emerald-700 px-8 font-bold">
                                {songForm.processing ? 'Saving...' : (editingSong ? 'Update Song' : 'Create Song')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ADD/EDIT ARRANGEMENT MODAL */}
            <Dialog open={isArrangementModalOpen} onOpenChange={setIsArrangementModalOpen}>
                <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl h-[90vh] flex flex-col">
                    <DialogHeader className="bg-emerald-600 p-6 text-white shrink-0">
                        <DialogTitle className="text-2xl font-black italic tracking-tighter">
                            {editingArrangement ? 'EDIT ARRANGEMENT' : 'ADD NEW ARRANGEMENT'}
                        </DialogTitle>
                        <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">
                            {selectedSong?.title} • Technical Details
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleArrangementSubmit} className="flex-1 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Technical Specs Row */}
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</Label>
                                    <Input value={arrangementForm.data.name} onChange={e => arrangementForm.setData('name', e.target.value)} required placeholder="e.g. Elsa Version" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Length</Label>
                                    <Input value={arrangementForm.data.duration} onChange={e => arrangementForm.setData('duration', e.target.value)} placeholder="4:21" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">BPM</Label>
                                    <Input value={arrangementForm.data.bpm} onChange={e => arrangementForm.setData('bpm', e.target.value)} placeholder="80" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meter</Label>
                                    <Select value={arrangementForm.data.time_signature} onValueChange={v => arrangementForm.setData('time_signature', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{TIME_SIGNATURES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Song Flow (Sequence)</Label>
                                        <Textarea 
                                            value={arrangementForm.data.song_flow} 
                                            onChange={e => arrangementForm.setData('song_flow', e.target.value)} 
                                            placeholder="Intro, V1, V2, C, Bridge, C, Outro"
                                            className="h-20 resize-none font-medium text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">YouTube Reference URL</Label>
                                        <Input value={arrangementForm.data.video_url} onChange={e => arrangementForm.setData('video_url', e.target.value)} placeholder="https://youtube.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Chord Chart (PDF)</Label>
                                        <Input type="file" accept=".pdf" onChange={e => arrangementForm.setData('pdf_file', e.target.files?.[0] || null)} />
                                    </div>
                                </div>

                                <div className="space-y-4 flex flex-col h-full">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lyrics Sections</Label>
                                        <Button type="button" size="sm" variant="outline" onClick={addLyricSection} className="h-7 text-[10px] font-black uppercase tracking-widest gap-1">
                                            <Plus className="h-3 w-3" /> Add Section
                                        </Button>
                                    </div>
                                    <div className="flex-1 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-4 overflow-y-auto space-y-4 max-h-[400px]">
                                        {lyricSections.map((sec, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border shadow-sm overflow-hidden">
                                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 border-b">
                                                    <Input value={sec.heading} onChange={e => updateLyricSection(idx, 'heading', e.target.value)} className="h-7 text-xs font-bold border-none bg-transparent p-0 focus-visible:ring-0" placeholder="Heading..." />
                                                    <Button type="button" size="icon" variant="ghost" onClick={() => removeLyricSection(idx)} className="h-6 w-6 text-rose-400 hover:text-rose-600">
                                                        <Trash className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                                <Textarea value={sec.body} onChange={e => updateLyricSection(idx, 'body', e.target.value)} className="min-h-[80px] border-none bg-transparent p-3 text-xs font-mono focus-visible:ring-0" placeholder="Lyrics..." />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-900 border-t shrink-0">
                            <Button type="button" variant="ghost" onClick={() => setIsArrangementModalOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={arrangementForm.processing} className="bg-emerald-600 hover:bg-emerald-700 px-8 font-bold">
                                {arrangementForm.processing ? 'Saving...' : 'Save Arrangement'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

SongsIndex.layout = (page: any) => <AppLayout breadcrumbs={page.props?.breadcrumbs || []}>{page}</AppLayout>;
