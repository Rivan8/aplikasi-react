<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SongController extends Controller
{
    public function index(Request $request)
    {
        $query = Song::query();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $songs = $query->orderBy('title')->paginate(15)->withQueryString();

        return Inertia::render('songs/index', [
            'songs' => $songs,
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Song Bank', 'href' => route('songs.index')],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'arrangement_name' => 'nullable|string|max:255',
            'keys' => 'nullable|string|max:50',
            'bpm' => 'nullable|string|max:10',
            'has_lyrics' => 'boolean',
            'has_chords' => 'boolean',
            'has_pdf' => 'boolean',
            'has_audio' => 'boolean',
        ]);

        Song::create($validated);

        return back()->with('success', 'Lagu berhasil ditambahkan.');
    }

    public function update(Request $request, Song $song)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'arrangement_name' => 'nullable|string|max:255',
            'keys' => 'nullable|string|max:50',
            'bpm' => 'nullable|string|max:10',
            'has_lyrics' => 'boolean',
            'has_chords' => 'boolean',
            'has_pdf' => 'boolean',
            'has_audio' => 'boolean',
        ]);

        $song->update($validated);

        return back()->with('success', 'Lagu berhasil diperbarui.');
    }

    public function destroy(Song $song)
    {
        $song->delete();

        return back()->with('success', 'Lagu berhasil dihapus.');
    }
}
