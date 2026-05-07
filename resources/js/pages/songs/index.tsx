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
import { index as songsIndex } from '@/routes/songs';
import { type BreadcrumbItem } from '@/types';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Song {
    id: number;
    title: string;
    arrangement_name: string | null;
    keys: string | null;
    bpm: string | null;
    time_signature?: string | null;
    song_flow?: string | null;
    has_lyrics: boolean;
    has_chords: boolean;
    has_pdf: boolean;
    has_audio: boolean;
    lyrics?: string | null;
    chords?: string | null;
    video_url?: string | null;
    pdf_path?: string | null;
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

const MUSICAL_KEYS = [
    'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'
];

const TIME_SIGNATURES = [
    '4/4', '3/4', '2/4', '6/8', '12/8', '2/2'
];

export default function SongsIndex({ songs, filters, breadcrumbs }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'lyrics' | 'media'>('info');

    const { data, setData, post, reset, processing, errors } = useForm({
        title: '',
        arrangement_name: '',
        keys: 'C',
        bpm: '',
        song_flow: '',
        time_signature: '4/4',
        lyrics: '',
        chords: '',
        video_url: '',
        pdf_file: null as File | null,
        _method: 'POST',
    });

    // Structured lyric sections: [{heading: 'Verse 1', body: '...'}]
    const [lyricSections, setLyricSections] = useState<{heading: string; body: string}[]>([]);

    // Sync lyricSections -> data.lyrics (plain text format)
    const syncLyrics = (sections: {heading: string; body: string}[]) => {
        const text = sections
            .map(s => `${s.heading}\n${s.body}`)
            .join('\n\n');
        setData('lyrics', text);
    };

    const addSection = () => {
        const next = [...lyricSections, { heading: 'Section', body: '' }];
        setLyricSections(next);
        syncLyrics(next);
    };

    const updateSection = (idx: number, field: 'heading' | 'body', val: string) => {
        const next = lyricSections.map((s, i) => i === idx ? { ...s, [field]: val } : s);
        setLyricSections(next);
        syncLyrics(next);
    };

    const removeSection = (idx: number) => {
        const next = lyricSections.filter((_, i) => i !== idx);
        setLyricSections(next);
        syncLyrics(next);
    };

    // Parse plain-text lyrics back to sections
    const parseLyricsToSections = (text: string): {heading: string; body: string}[] => {
        if (!text?.trim()) return [];
        const blocks = text.split(/\n{2,}/);
        return blocks.map(block => {
            const lines = block.split('\n');
            return { heading: lines[0] || '', body: lines.slice(1).join('\n') };
        }).filter(s => s.heading || s.body);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(
                    '/songs',
                    { search },
                    { preserveState: true, replace: true }
                );
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const openAddModal = () => {
        setEditingSong(null);
        setActiveTab('info');
        reset();
        setLyricSections([]);
        setIsModalOpen(true);
    };

    const openEditModal = (song: Song) => {
        setEditingSong(song);
        setActiveTab('info');
        const parsed = parseLyricsToSections(song.lyrics || '');
        setLyricSections(parsed);
        setData({
            title: song.title,
            arrangement_name: song.arrangement_name || '',
            keys: song.keys || 'C',
            bpm: song.bpm || '',
            song_flow: song.song_flow || '',
            time_signature: song.time_signature || '4/4',
            lyrics: song.lyrics || '',
            chords: song.chords || '',
            video_url: song.video_url || '',
            pdf_file: null,
            _method: 'PUT',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingSong) {
            // Use POST with _method: PUT for file uploads during update
            post(`/songs/${editingSong.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Lagu berhasil diperbarui');
                },
                onError: (err) => {
                    console.error(err);
                    toast.error('Gagal memperbarui lagu. Periksa kembali isian Anda.');
                }
            });
        } else {
            post('/songs', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    toast.success('Lagu berhasil ditambahkan');
                    reset();
                },
                onError: (err) => {
                    console.error(err);
                    toast.error('Gagal menyimpan lagu. Periksa kembali isian Anda.');
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus lagu ini?')) {
            router.delete(`/songs/${id}`, {
                onSuccess: () => toast.success('Lagu berhasil dihapus'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Song Bank" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Song Bank</h1>
                        <p className="text-slate-500 dark:text-slate-400">Kelola daftar lagu dan aransemen untuk pelayanan.</p>
                    </div>
                    <Button onClick={openAddModal} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Plus className="w-4 h-4" />
                        Tambah Lagu
                    </Button>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <div className="p-4 bg-white dark:bg-slate-900 border-b flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Cari judul lagu atau aransemen..." 
                                className="pl-10 h-10"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Lagu</th>
                                    <th className="px-6 py-4 text-center">Key</th>
                                    <th className="px-6 py-4 text-center">BPM</th>
                                    <th className="px-6 py-4">Kelengkapan</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {songs.data.map((song) => (
                                    <tr key={song.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                    <Music className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{song.title}</p>
                                                    <p className="text-xs text-slate-500">{song.arrangement_name || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="secondary" className="bg-blue-600 text-white border-none px-2">{song.keys || '-'}</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-medium text-slate-600">{song.bpm || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span title="Lirik" className={`p-1.5 rounded-md ${song.has_lyrics ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}>
                                                    <FileText className="w-4 h-4" />
                                                </span>
                                                <span title="Chord" className={`p-1.5 rounded-md ${song.has_chords ? 'text-blue-600 bg-blue-50' : 'text-slate-300 bg-slate-50'}`}>
                                                    <LayoutList className="w-4 h-4" />
                                                </span>
                                                <span title="PDF" className={`p-1.5 rounded-md ${song.has_pdf ? 'text-rose-600 bg-rose-50' : 'text-slate-300 bg-slate-50'}`}>
                                                    <FileIcon className="w-4 h-4" />
                                                </span>
                                                <span title="Video" className={`p-1.5 rounded-md ${song.video_url ? 'text-amber-600 bg-amber-50' : 'text-slate-300 bg-slate-50'}`}>
                                                    <Video className="w-4 h-4" />
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-400 hover:text-emerald-600"
                                                    onClick={() => openEditModal(song)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-slate-400 hover:text-rose-600"
                                                    onClick={() => handleDelete(song.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {songs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            Tidak ada lagu ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Add/Edit Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className={cn(
                        "p-0 overflow-hidden border-none shadow-2xl transition-all duration-500 ease-in-out",
                        activeTab === 'lyrics' ? "max-w-6xl" : "max-w-2xl"
                    )}>
                        <DialogHeader className="bg-emerald-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-2xl font-bold">
                                        {editingSong ? 'Edit Lagu' : 'Tambah Lagu'}
                                    </DialogTitle>
                                    <p className="text-emerald-100 text-sm mt-1">Lengkapi informasi dan materi pendukung lagu.</p>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Custom Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={() => setActiveTab('info')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'info' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Informasi Dasar
                            </button>
                            <button 
                                onClick={() => setActiveTab('lyrics')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'lyrics' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Lirik & Chord
                            </button>
                            <button 
                                onClick={() => setActiveTab('media')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'media' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Media & File
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1 scrollbar-hide">
                                
                                {activeTab === 'info' && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Judul Lagu</Label>
                                            <Input 
                                                id="title" 
                                                value={data.title} 
                                                onChange={e => setData('title', e.target.value)} 
                                                placeholder="Masukkan judul lagu"
                                                required
                                            />
                                            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="arrangement">Nama Aransemen / Artis</Label>
                                            <Input 
                                                id="arrangement" 
                                                value={data.arrangement_name} 
                                                onChange={e => setData('arrangement_name', e.target.value)} 
                                                placeholder="Contoh: Brandon Lake, Elevation Worship"
                                            />
                                            {errors.arrangement_name && <p className="text-xs text-destructive">{errors.arrangement_name}</p>}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Key (Nada Dasar)</Label>
                                                <Select value={data.keys} onValueChange={val => setData('keys', val)}>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Pilih Nada Dasar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {MUSICAL_KEYS.map(key => (
                                                            <SelectItem key={key} value={key}>{key}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.keys && <p className="text-xs text-destructive">{errors.keys}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>BPM (Tempo)</Label>
                                                <Input 
                                                    value={data.bpm} 
                                                    onChange={e => setData('bpm', e.target.value)} 
                                                    placeholder="Contoh: 70"
                                                />
                                                {errors.bpm && <p className="text-xs text-destructive">{errors.bpm}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Ketukan (Time Sig.)</Label>
                                                <Select value={data.time_signature || '4/4'} onValueChange={val => setData('time_signature', val)}>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Pilih Ketukan" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {TIME_SIGNATURES.map(sig => (
                                                            <SelectItem key={sig} value={sig}>{sig}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors.time_signature && <p className="text-xs text-destructive">{errors.time_signature}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'lyrics' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 animate-in fade-in duration-300 h-full">
                                        {/* LEFT: Structured Input */}
                                        <div className="flex flex-col border-r border-slate-100 pr-4 space-y-4 min-h-[520px]">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-bold text-slate-700">Input Lirik</Label>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1.5 h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                    onClick={addSection}
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                    Tambah Bagian
                                                </Button>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alur Lagu (Song Flow)</Label>
                                                <Input
                                                    value={data.song_flow}
                                                    onChange={e => setData('song_flow', e.target.value)}
                                                    placeholder="Contoh: Intro, V1, V2, C, Bridge, C×2"
                                                    className="text-sm"
                                                />
                                            </div>

                                            <div className="space-y-3 overflow-y-auto flex-1 max-h-[380px] pr-1">
                                                {lyricSections.length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 border-2 border-dashed rounded-xl">
                                                        <Music className="w-8 h-8 mb-2 opacity-30" />
                                                        <p className="text-sm">Belum ada bagian lirik.</p>
                                                        <p className="text-xs mt-1">Klik "Tambah Bagian" untuk mulai.</p>
                                                    </div>
                                                )}
                                                {lyricSections.map((section, idx) => (
                                                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/80 border-b border-slate-200">
                                                            <Input
                                                                value={section.heading}
                                                                onChange={e => updateSection(idx, 'heading', e.target.value)}
                                                                className="h-7 text-sm font-bold border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none text-slate-800 placeholder:text-slate-400"
                                                                placeholder="Nama bagian (Verse 1, Chorus...)"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSection(idx)}
                                                                className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors"
                                                            >
                                                                <Trash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <Textarea
                                                            value={section.body}
                                                            onChange={e => updateSection(idx, 'body', e.target.value)}
                                                            placeholder="Ketik lirik di sini..."
                                                            className="min-h-[100px] border-0 bg-transparent rounded-none text-sm font-mono leading-relaxed resize-none focus-visible:ring-0 shadow-none p-3"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* RIGHT: Live Preview */}
                                        <div className="pl-4 flex flex-col space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-slate-400" />
                                                <Label className="text-sm font-bold text-slate-700">Preview</Label>
                                            </div>

                                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-[480px]">
                                                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
                                                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                                                        {data.title || 'Judul Lagu'}{' '}
                                                        {(data.bpm || data.time_signature) && (
                                                            <span className="font-normal text-slate-600">
                                                                [Lyrics{data.bpm ? `, ${data.bpm} bpm` : ''}{data.time_signature ? `, ${data.time_signature}` : ''}]
                                                            </span>
                                                        )}
                                                    </h3>
                                                    {data.arrangement_name && (
                                                        <p className="text-xs text-slate-500 mt-0.5">[{data.arrangement_name}]</p>
                                                    )}
                                                    {data.song_flow && (
                                                        <p className="text-sm font-semibold text-slate-700 mt-2">{data.song_flow}</p>
                                                    )}
                                                </div>

                                                <div className="px-5 py-4 overflow-y-auto max-h-[400px] space-y-4 text-sm">
                                                    {lyricSections.length === 0 && (
                                                        <p className="text-slate-300 italic text-xs text-center pt-10">Preview lirik akan muncul di sini...</p>
                                                    )}
                                                    {lyricSections.map((section, idx) => (
                                                        <div key={idx}>
                                                            <p className="font-bold text-slate-900 mb-1">{section.heading}</p>
                                                            <pre className="font-mono text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap">{section.body}</pre>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'media' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <Label htmlFor="video_url">URL Video (Youtube/Lainnya)</Label>
                                            <div className="relative">
                                                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                                                <Input 
                                                    id="video_url" 
                                                    className="pl-10"
                                                    value={data.video_url} 
                                                    onChange={e => setData('video_url', e.target.value)} 
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                />
                                            </div>
                                            {data.video_url && (
                                                <div className="mt-4 aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative group">
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a href={data.video_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full text-rose-600 hover:scale-110 transition-transform">
                                                            <ExternalLink className="w-6 h-6" />
                                                        </a>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">Pratinjau Video Tersedia</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pdf_file">Upload File PDF (Chord/Not Balok)</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <Input 
                                                        id="pdf_file" 
                                                        type="file" 
                                                        accept=".pdf"
                                                        onChange={e => setData('pdf_file', e.target.files?.[0] || null)}
                                                        className="cursor-pointer"
                                                    />
                                                </div>
                                                {editingSong?.pdf_path && (
                                                    <Badge variant="secondary" className="h-10 px-3 bg-rose-50 text-rose-600 border-rose-100">
                                                        PDF Ada
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">*Maksimal 10MB. Format PDF saja.</p>
                                        </div>
                                    </div>
                                )}

                            </div>

                            <DialogFooter className="mt-8 border-t pt-6 gap-3">
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-600"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-200"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Lagu'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
