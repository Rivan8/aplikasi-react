import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

const ARTICLE_CHARACTERS_PER_PAGE = 3500;

interface Article {
    id: number;
    title: string;
    excerpt: string | null;
    content: string;
    image_path: string | null;
    created_at: string;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#039;',
        '"': '&quot;',
    })[character] ?? character);
}

function splitLongBlock(node: Element, maxCharacters: number): string[] {
    const text = node.textContent?.trim() ?? '';
    const words = text.split(/\s+/).filter(Boolean);
    const pages: string[] = [];
    let current = '';

    words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        if (current && candidate.length > maxCharacters) {
            pages.push(`<${node.tagName.toLowerCase()}>${escapeHtml(current)}</${node.tagName.toLowerCase()}>`);
            current = word;
        } else {
            current = candidate;
        }
    });

    if (current) {
        pages.push(`<${node.tagName.toLowerCase()}>${escapeHtml(current)}</${node.tagName.toLowerCase()}>`);
    }

    return pages;
}

function splitArticleContent(content: string, maxCharacters: number): string[] {
    if (typeof DOMParser === 'undefined') {
        return [content];
    }

    const document = new DOMParser().parseFromString(content, 'text/html');
    const pages: string[] = [];
    let currentPage = '';
    let currentCharacters = 0;

    Array.from(document.body.childNodes).forEach((node) => {
        const html = node.nodeType === Node.TEXT_NODE ? escapeHtml(node.textContent ?? '') : (node as Element).outerHTML;
        const characters = (node.textContent ?? '').length;

        if (characters > maxCharacters && node.nodeType === Node.ELEMENT_NODE) {
            if (currentPage) {
                pages.push(currentPage);
                currentPage = '';
                currentCharacters = 0;
            }

            pages.push(...splitLongBlock(node as Element, maxCharacters));
            return;
        }

        if (currentPage && currentCharacters + characters > maxCharacters) {
            pages.push(currentPage);
            currentPage = '';
            currentCharacters = 0;
        }

        currentPage += html;
        currentCharacters += characters;
    });

    if (currentPage) {
        pages.push(currentPage);
    }

    return pages.length > 0 ? pages : ['<p>Artikel ini belum memiliki isi.</p>'];
}

export default function ArticleShow({ article }: { article: Article }) {
    const { auth } = usePage().props as { auth?: { user?: { role?: string } } };
    const isAdmin = ['admin', 'superadmin'].includes(auth?.user?.role ?? '');
    const [activePage, setActivePage] = useState(0);
    const articlePages = useMemo(() => splitArticleContent(article.content, ARTICLE_CHARACTERS_PER_PAGE), [article.content]);
    const pageIndex = Math.min(activePage, articlePages.length - 1);

    return (
        <>
            <Head title={article.title} />
            <main className="min-h-screen bg-[linear-gradient(135deg,#f7f4ef_0%,#ffffff_55%,#eef7f5_100%)] p-5 sm:p-8 lg:p-12 dark:bg-background">
                <article className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-card">
                    <div className="relative aspect-[2/1] bg-muted">{article.image_path ? <img src={article.image_path} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-primary/10 text-primary"><ImagePlus className="h-12 w-12" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10"><p className="text-xs font-semibold tracking-[0.16em] uppercase">Artikel</p><h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{article.title}</h1></div></div>
                    <div className="space-y-6 p-6 sm:p-10"><p className="text-sm text-muted-foreground">{new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>{article.excerpt && <p className="text-lg font-medium leading-8 text-foreground">{article.excerpt}</p>}<div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-4 py-3"><p className="text-sm font-semibold text-foreground">Halaman {pageIndex + 1} dari {articlePages.length}</p><p className="text-xs text-muted-foreground">Sekitar {ARTICLE_CHARACTERS_PER_PAGE.toLocaleString('id-ID')} karakter per halaman</p></div><div className="min-h-[420px] text-base leading-8 text-muted-foreground [&_blockquote]:my-5 [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: articlePages[pageIndex] }} />{articlePages.length > 1 && <nav className="flex flex-wrap items-center justify-center gap-2 border-y py-4" aria-label="Navigasi halaman artikel"><Button type="button" variant="outline" size="sm" disabled={pageIndex === 0} onClick={() => setActivePage((page) => Math.max(0, page - 1))}>Sebelumnya</Button>{articlePages.map((_, index) => <Button key={index} type="button" variant={index === pageIndex ? 'default' : 'outline'} size="icon" className="h-9 w-9" aria-label={`Buka halaman ${index + 1}`} aria-current={index === pageIndex ? 'page' : undefined} onClick={() => setActivePage(index)}>{index + 1}</Button>)}<Button type="button" variant="outline" size="sm" disabled={pageIndex === articlePages.length - 1} onClick={() => setActivePage((page) => Math.min(articlePages.length - 1, page + 1))}>Berikutnya</Button></nav>}<div className="flex flex-wrap gap-3"><Button asChild variant="outline" className="gap-2"><Link href="/articles"><ArrowLeft className="h-4 w-4" />Kembali ke artikel</Link></Button>{isAdmin && <Button asChild className="gap-2"><Link href={`/articles/${article.id}/edit`}><Pencil className="h-4 w-4" />Edit artikel</Link></Button>}</div></div>
                </article>
            </main>
        </>
    );
}
