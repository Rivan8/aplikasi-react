import { Head, Link, useForm } from '@inertiajs/react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Bold, ImagePlus, Italic, List, ListOrdered, Minus, Plus, Quote, Redo2, RemoveFormatting, Strikethrough, Subscript, Superscript, Underline, Undo2 } from 'lucide-react';
import {   useEffect, useRef } from 'react';
import type {FormEvent, MouseEvent} from 'react';
import { toast } from 'sonner';
import { ArticleRichTextEditor } from '@/components/article-rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ArticleForm {
    title: string;
    excerpt: string;
    content: string;
    image: File | null;
    is_published: boolean;
}

const emptyForm: ArticleForm = {
    title: '',
    excerpt: '',
    content: '',
    image: null,
    is_published: true,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const runCommand = (command: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        onChange(editorRef.current?.innerHTML ?? '');
    };

    const keepSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
    const tools = [
        { label: 'Urungkan', icon: Undo2, command: 'undo' },
        { label: 'Ulangi', icon: Redo2, command: 'redo' },
        { label: 'Tebal', icon: Bold, command: 'bold' },
        { label: 'Miring', icon: Italic, command: 'italic' },
        { label: 'Garis bawah', icon: Underline, command: 'underline' },
        { label: 'Coret', icon: Strikethrough, command: 'strikeThrough' },
        { label: 'Rata kiri', icon: AlignLeft, command: 'justifyLeft' },
        { label: 'Rata tengah', icon: AlignCenter, command: 'justifyCenter' },
        { label: 'Rata kanan', icon: AlignRight, command: 'justifyRight' },
        { label: 'Rata penuh', icon: AlignJustify, command: 'justifyFull' },
        { label: 'Daftar bullet', icon: List, command: 'insertUnorderedList' },
        { label: 'Daftar bernomor', icon: ListOrdered, command: 'insertOrderedList' },
        { label: 'Kutipan', icon: Quote, command: 'formatBlock', value: 'blockquote' },
        { label: 'Garis horizontal', icon: Minus, command: 'insertHorizontalRule' },
        { label: 'Superscript', icon: Superscript, command: 'superscript' },
        { label: 'Subscript', icon: Subscript, command: 'subscript' },
        { label: 'Hapus format', icon: RemoveFormatting, command: 'removeFormat' },
    ];

    return (
        <div className="overflow-hidden rounded-md border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring">
            <div className="sticky top-2 z-20 flex flex-wrap items-center gap-1 border-b bg-background/95 p-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <select aria-label="Gaya heading" defaultValue="p" onChange={(event) => runCommand('formatBlock', event.target.value)} className="h-8 rounded border bg-background px-2 text-xs font-medium outline-none">
                    <option value="p">Paragraf</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Kutipan</option>
                </select>
                <select aria-label="Ukuran font" defaultValue="3" onChange={(event) => runCommand('fontSize', event.target.value)} className="h-8 rounded border bg-background px-2 text-xs font-medium outline-none">
                    <option value="2">Kecil</option>
                    <option value="3">Normal</option>
                    <option value="4">Besar</option>
                    <option value="5">Sangat besar</option>
                </select>
                <label className="flex h-8 items-center gap-1 rounded border bg-background px-2 text-xs font-medium" title="Warna teks">
                    <span className="text-muted-foreground">Warna</span>
                    <input aria-label="Warna teks" type="color" defaultValue="#292524" onChange={(event) => runCommand('foreColor', event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" />
                </label>
                <div className="mx-1 h-6 w-px bg-border" />
                {tools.map(({ label, icon: Icon, command, value: commandValue }) => (
                    <button key={label} type="button" title={label} aria-label={label} onMouseDown={keepSelection} onClick={() => runCommand(command, commandValue)} className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition hover:bg-accent hover:text-accent-foreground">
                        <Icon className="h-4 w-4" />
                    </button>
                ))}
            </div>
            <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" aria-label="Isi artikel" onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-64 px-4 py-3 text-sm leading-7 outline-none empty:before:text-muted-foreground empty:before:content-['Tulis_isi_artikel_di_sini...'] [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6" />
        </div>
    );
}

export default function ArticleCreate() {
    const form = useForm<ArticleForm>(emptyForm);

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/articles', {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                toast.success('Artikel berhasil diterbitkan.');
            },
            onError: () => toast.error('Artikel gagal diterbitkan. Periksa kembali isian artikel.'),
        });
    };

    return (
        <>
            <Head title="Buat Artikel" />
            <main className="min-h-screen bg-[linear-gradient(135deg,#f7f4ef_0%,#ffffff_55%,#eef7f5_100%)] p-5 sm:p-8 lg:p-12 dark:bg-background">
                <div className="mx-auto max-w-4xl space-y-6">
                    <Button asChild variant="ghost" className="gap-2 px-0"><Link href="/articles"><ArrowLeft className="h-4 w-4" />Kembali ke daftar artikel</Link></Button>
                    <header><p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Artikel & Media</p><h1 className="mt-2 text-3xl font-black tracking-tight">Buat artikel baru</h1><p className="mt-2 text-sm text-muted-foreground">Susun artikel dengan heading, ukuran font, warna teks, dan format tulisan yang kamu perlukan.</p></header>
                    <Card className="border-primary/20 shadow-sm"><CardContent className="p-5 sm:p-8"><form onSubmit={submit} className="grid gap-5">
                        <div className="space-y-2"><Label htmlFor="title">Judul artikel</Label><Input id="title" value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} required /></div>
                        <div className="space-y-2"><Label htmlFor="image">Gambar utama</Label><Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => form.setData('image', event.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Gunakan gambar landscape agar tampil baik di card.</p></div>
                        <div className="space-y-2"><Label htmlFor="excerpt">Ringkasan artikel</Label><Input id="excerpt" value={form.data.excerpt} onChange={(event) => form.setData('excerpt', event.target.value)} placeholder="Ringkasan singkat yang tampil di daftar artikel" /></div>
                        <div className="space-y-2"><Label>Isi artikel</Label><ArticleRichTextEditor value={form.data.content} onChange={(content) => form.setData('content', content)} /></div>
                        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={form.processing} className="gap-2"><Plus className="h-4 w-4" />Terbitkan artikel</Button><Button asChild type="button" variant="outline"><Link href="/articles"><ImagePlus className="mr-2 h-4 w-4" />Batal</Link></Button></div>
                    </form></CardContent></Card>
                </div>
            </main>
        </>
    );
}
