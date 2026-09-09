import { Head, Link, useForm } from '@inertiajs/react';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Bold, ImagePlus, Italic, List, ListOrdered, Minus, Quote, Redo2, RemoveFormatting, Save, Strikethrough, Subscript, Superscript, Underline, Undo2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type {FormEvent, MouseEvent} from 'react';
import { toast } from 'sonner';
import { ArticleRichTextEditor } from '@/components/article-rich-text-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Article {
    id: number;
    title: string;
    excerpt: string | null;
    content: string;
    image_path: string | null;
    is_published: boolean;
}

interface ArticleForm {
    title: string;
    excerpt: string;
    content: string;
    image: File | null;
    is_published: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
editorRef.current.innerHTML = value;
}
    }, [value]);

    const command = (name: string, commandValue?: string) => {
        editorRef.current?.focus();
        document.execCommand(name, false, commandValue);
        onChange(editorRef.current?.innerHTML ?? '');
    };
    const preserveSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
    const tools = [
        ['Urungkan', Undo2, 'undo'], ['Ulangi', Redo2, 'redo'], ['Tebal', Bold, 'bold'],
        ['Miring', Italic, 'italic'], ['Garis bawah', Underline, 'underline'], ['Coret', Strikethrough, 'strikeThrough'],
        ['Rata kiri', AlignLeft, 'justifyLeft'], ['Rata tengah', AlignCenter, 'justifyCenter'],
        ['Rata kanan', AlignRight, 'justifyRight'], ['Rata penuh', AlignJustify, 'justifyFull'],
        ['Daftar bullet', List, 'insertUnorderedList'], ['Daftar bernomor', ListOrdered, 'insertOrderedList'],
        ['Kutipan', Quote, 'formatBlock', 'blockquote'], ['Garis horizontal', Minus, 'insertHorizontalRule'],
        ['Superscript', Superscript, 'superscript'], ['Subscript', Subscript, 'subscript'],
        ['Hapus format', RemoveFormatting, 'removeFormat'],
    ] as const;

    return <div className="overflow-hidden rounded-md border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-ring">
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-1 border-b bg-background/95 p-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <select aria-label="Gaya heading" defaultValue="p" onChange={(event) => command('formatBlock', event.target.value)} className="h-8 rounded border bg-background px-2 text-xs font-medium outline-none"><option value="p">Paragraf</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Kutipan</option></select>
            <select aria-label="Ukuran font" defaultValue="3" onChange={(event) => command('fontSize', event.target.value)} className="h-8 rounded border bg-background px-2 text-xs font-medium outline-none"><option value="2">Kecil</option><option value="3">Normal</option><option value="4">Besar</option><option value="5">Sangat besar</option></select>
            <label className="flex h-8 items-center gap-1 rounded border bg-background px-2 text-xs font-medium"><span className="text-muted-foreground">Warna</span><input aria-label="Warna teks" type="color" defaultValue="#292524" onChange={(event) => command('foreColor', event.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" /></label>
            <div className="mx-1 h-6 w-px bg-border" />
            {tools.map(([label, Icon, name, value]) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={preserveSelection} onClick={() => command(name, value)} className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"><Icon className="h-4 w-4" /></button>)}
        </div>
        <div ref={editorRef} contentEditable role="textbox" aria-multiline="true" aria-label="Isi artikel" onInput={(event) => onChange(event.currentTarget.innerHTML)} className="min-h-64 px-4 py-3 text-sm leading-7 outline-none [&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_h2]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6" />
    </div>;
}

export default function ArticleEdit({ article }: { article: Article }) {
    const form = useForm<ArticleForm>({ title: article.title, excerpt: article.excerpt ?? '', content: article.content, image: null, is_published: article.is_published });
    const [imagePreview, setImagePreview] = useState<string | null>(article.image_path);
    const previewUrlRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const handleImageChange = (file: File | null) => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        form.setData('image', file);

        if (!file) {
            setImagePreview(article.image_path);

            return;
        }

        const previewUrl = URL.createObjectURL(file);
        previewUrlRef.current = previewUrl;
        setImagePreview(previewUrl);
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, _method: 'put' } as ArticleForm & { _method: string }));
        form.post(`/articles/${article.id}`, {
            forceFormData: true,
            onSuccess: () => toast.success('Artikel berhasil diedit dan diterbitkan.'),
            onError: () => toast.error('Artikel gagal disimpan. Periksa kembali isian artikel.'),
        });
    };

    return <>
        <Head title={`Edit ${article.title}`} />
        <main className="min-h-screen bg-[linear-gradient(135deg,#f7f4ef_0%,#ffffff_55%,#eef7f5_100%)] p-5 sm:p-8 lg:p-12 dark:bg-background">
            <div className="mx-auto max-w-4xl space-y-6">
                <Button asChild variant="ghost" className="gap-2 px-0"><Link href={`/articles/${article.id}`}><ArrowLeft className="h-4 w-4" />Kembali ke artikel</Link></Button>
                <header><p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Artikel & Media</p><h1 className="mt-2 text-3xl font-black tracking-tight">Edit artikel</h1><p className="mt-2 text-sm text-muted-foreground">Perbarui isi, format tulisan, atau gambar artikel.</p></header>
                <Card className="border-primary/20 shadow-sm"><CardContent className="p-5 sm:p-8"><form onSubmit={submit} className="grid gap-5">
                    <div className="space-y-2"><Label htmlFor="title">Judul artikel</Label><Input id="title" value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} required /></div>
                    <div className="space-y-2"><Label htmlFor="image">Ganti gambar utama</Label>{imagePreview ? <div className="overflow-hidden rounded-lg border bg-muted"><img src={imagePreview} alt="Preview gambar artikel" className="h-48 w-full object-cover sm:h-56" /></div> : <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground"><ImagePlus className="h-8 w-8" /></div>}<Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)} />{form.data.image ? <p className="text-xs text-primary">Preview menggunakan gambar baru: {form.data.image.name}</p> : <p className="flex items-center gap-2 text-xs text-muted-foreground"><ImagePlus className="h-3.5 w-3.5" />Gambar saat ini tetap dipertahankan jika tidak memilih gambar baru.</p>}</div>
                    <div className="space-y-2"><Label htmlFor="excerpt">Ringkasan artikel</Label><Input id="excerpt" value={form.data.excerpt} onChange={(event) => form.setData('excerpt', event.target.value)} /></div>
                    <div className="space-y-2"><Label>Isi artikel</Label><ArticleRichTextEditor value={form.data.content} onChange={(content) => form.setData('content', content)} /></div>
                    <div className="flex flex-wrap gap-3"><Button type="submit" disabled={form.processing} className="gap-2"><Save className="h-4 w-4" />Simpan perubahan</Button><Button asChild type="button" variant="outline"><Link href={`/articles/${article.id}`}>Batal</Link></Button></div>
                </form></CardContent></Card>
            </div>
        </main>
    </>;
}
