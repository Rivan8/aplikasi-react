<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;

class MobileArticleController extends Controller
{
    public function index()
    {
        $articles = Article::query()
            ->where('is_published', true)
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $articles->getCollection()
                ->map(fn (Article $article): array => $this->serializeArticle($article))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $articles->currentPage(),
                'last_page' => $articles->lastPage(),
                'per_page' => $articles->perPage(),
                'total' => $articles->total(),
            ],
        ]);
    }

    public function show(Article $article)
    {
        abort_unless($article->is_published, 404);

        return response()->json([
            'data' => $this->serializeArticle($article),
        ]);
    }

    private function serializeArticle(Article $article): array
    {
        return [
            'id' => $article->id,
            'title' => $article->title,
            'excerpt' => $article->excerpt,
            'content' => $article->content,
            'image_url' => $article->image_path ? url($article->image_path) : null,
            'created_at' => $article->created_at?->toIso8601String(),
            'updated_at' => $article->updated_at?->toIso8601String(),
        ];
    }
}
