import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Article {
    id: number;
    title: string;
    excerpt: string | null;
    content: string;
    image_path: string | null;
    is_published: boolean;
    created_at: string;
}

interface ArticlePagination {
    data: Article[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

function getPageNumbers(currentPage: number, lastPage: number): number[] {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

export default function Articles({ articles }: { articles: ArticlePagination }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const isAdmin = ['admin', 'superadmin'].includes(auth?.user?.role ?? '');

    return (
        <>
            <Head title="Artikel" />
            <main className="min-h-screen bg-[linear-gradient(135deg,#f7f4ef_0%,#ffffff_55%,#eef7f5_100%)] p-5 sm:p-8 lg:p-12 dark:bg-background">
                <div className="mx-auto max-w-6xl space-y-8">
                    <header className="max-w-2xl">
                        <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Ruang Inspirasi</p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Artikel dan kabar terbaru</h1>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">Cerita, pengumuman, dan renungan untuk menemani perjalanan pelayanan jemaat.</p>
                    </header>

                    <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Daftar artikel</h2><p className="text-sm text-muted-foreground">Pilih card untuk membaca artikel lengkap.</p></div>{isAdmin && <Button asChild className="gap-2"><Link href="/articles/create"><Plus className="h-4 w-4" />Buat artikel</Link></Button>}</div>

                    {articles.data.length === 0 ? <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Belum ada artikel yang diterbitkan.</CardContent></Card> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.data.map((article) => <article key={article.id} className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-card"><Link href={`/articles/${article.id}`} className="block"><div className="relative aspect-[16/10] overflow-hidden bg-muted">{article.image_path ? <img src={article.image_path} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-primary/10 text-primary"><ImagePlus className="h-10 w-10" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" /></div><div className="space-y-3 p-5"><p className="text-xs text-muted-foreground">{new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p><h2 className="line-clamp-2 text-xl font-bold">{article.title}</h2><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt || article.content.replace(/<[^>]*>/g, '')}</p><span className="flex items-center gap-1 text-sm font-semibold text-primary">Baca artikel <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></div></Link>{isAdmin && <Button variant="ghost" size="icon" aria-label="Hapus artikel" className="absolute right-3 top-3 bg-white/90 text-destructive shadow-sm hover:bg-white" onClick={(event) => {
 event.preventDefault(); router.delete(`/articles/${article.id}`);
}}><Trash2 className="h-4 w-4" /></Button>}</article>)}</div>}
                    {articles.last_page > 1 && <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman artikel"><span className="mr-2 w-full text-center text-sm text-muted-foreground sm:w-auto">Menampilkan {articles.from}-{articles.to} dari {articles.total} artikel</span>{articles.current_page > 1 && <Button asChild variant="outline" size="sm"><Link href={`/articles?page=${articles.current_page - 1}`}>Sebelumnya</Link></Button>}{getPageNumbers(articles.current_page, articles.last_page).map((page) => <Button key={page} asChild variant={page === articles.current_page ? 'default' : 'outline'} size="icon" className="h-9 w-9"><Link href={`/articles?page=${page}`} aria-current={page === articles.current_page ? 'page' : undefined}>{page}</Link></Button>)}{articles.current_page < articles.last_page && <Button asChild variant="outline" size="sm"><Link href={`/articles?page=${articles.current_page + 1}`}>Berikutnya</Link></Button>}</nav>}
                </div>
            </main>
        </>
    );
}
