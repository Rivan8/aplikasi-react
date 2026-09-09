<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $articles = Article::query()
            ->when(! request()->user()->isAdmin(), fn ($query) => $query->where('is_published', true))
            ->latest()
            ->paginate(6)
            ->withQueryString();

        return Inertia::render('articles/index', ['articles' => $articles]);
    }

    public function show(Article $article)
    {
        abort_unless($article->is_published || request()->user()->isAdmin(), 404);

        return Inertia::render('articles/show', ['article' => $article]);
    }

    public function create()
    {
        abort_unless(request()->user()->isAdmin(), 403);

        return Inertia::render('articles/create');
    }

    public function edit(Article $article)
    {
        abort_unless(request()->user()->isAdmin(), 403);

        return Inertia::render('articles/edit', ['article' => $article]);
    }

    public function store(Request $request)
    {
        Article::create($this->validatedData($request));

        return back()->with('success', 'Artikel berhasil dibuat.');
    }

    public function update(Request $request, Article $article)
    {
        $data = $this->validatedData($request);

        if (isset($data['image_path']) && $article->image_path) {
            Storage::disk('public')->delete($this->storagePath($article->image_path));
        }

        $article->update($data);

        return back()->with('success', 'Artikel berhasil diperbarui.');
    }

    public function destroy(Article $article)
    {
        if ($article->image_path) {
            Storage::disk('public')->delete($this->storagePath($article->image_path));
        }

        $article->delete();

        return back()->with('success', 'Artikel berhasil dihapus.');
    }

    private function validatedData(Request $request): array
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'is_published' => 'nullable|boolean',
        ]);

        $data = [
            'title' => $validated['title'],
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $this->sanitizeContent($validated['content']),
            'is_published' => $request->boolean('is_published', true),
        ];

        if ($request->hasFile('image')) {
            $path = Storage::disk('public')->putFile('articles', $request->file('image'));
            if ($path === false) {
                throw ValidationException::withMessages(['image' => 'Gambar gagal disimpan.']);
            }

            $data['image_path'] = '/article-images/'.$path;
        }

        return $data;
    }

    private function storagePath(string $imagePath): string
    {
        return str_replace('/article-images/', '', $imagePath);
    }

    private function sanitizeContent(string $content): string
    {
        $allowedTags = '<p><h2><h3><blockquote><strong><b><em><i><u><s><ul><ol><li><font><br>';
        $content = strip_tags($content, $allowedTags);

        return preg_replace('/\s+on[a-z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $content) ?? '';
    }
}
