<?php

use App\Models\Article;
use App\Models\User;
use Illuminate\Support\Str;

it('mobile can list and open published articles', function () {
    $token = Str::random(60);
    User::factory()->create([
        'member_id' => 'MEM-ARTICLE',
        'api_token' => hash('sha256', $token),
    ]);

    $published = Article::create([
        'title' => 'Kabar Jemaat',
        'excerpt' => 'Ringkasan kabar jemaat.',
        'content' => '<h2>Isi artikel</h2><p>Konten.</p>',
        'is_published' => true,
    ]);
    Article::create([
        'title' => 'Draft Internal',
        'content' => '<p>Draft.</p>',
        'is_published' => false,
    ]);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/articles')
        ->assertOk()
        ->assertJsonPath('data.0.id', $published->id)
        ->assertJsonPath('data.0.title', 'Kabar Jemaat')
        ->assertJsonMissing(['title' => 'Draft Internal']);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/articles/'.$published->id)
        ->assertOk()
        ->assertJsonPath('data.content', '<h2>Isi artikel</h2><p>Konten.</p>');
});

it('mobile cannot open an unpublished article', function () {
    $token = Str::random(60);
    User::factory()->create([
        'member_id' => 'MEM-ARTICLE-DRAFT',
        'api_token' => hash('sha256', $token),
    ]);

    $draft = Article::create([
        'title' => 'Draft Internal',
        'content' => '<p>Draft.</p>',
        'is_published' => false,
    ]);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/articles/'.$draft->id)
        ->assertNotFound();
});
