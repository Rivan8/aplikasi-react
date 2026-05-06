<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

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
                ['title' => 'Song Bank', 'href' => '/songs'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'arrangement_name' => 'nullable|string|max:255',
            'keys' => 'nullable|string|max:50',
            'bpm' => 'nullable|string|max:20',
            'song_flow' => 'nullable|string|max:500',
            'time_signature' => 'nullable|string|max:20',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|string|max:255',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if ($request->hasFile('pdf_file')) {
            $validated['pdf_path'] = $request->file('pdf_file')->store('songs/pdf', 'public');
            $validated['has_pdf'] = true;
        }

        $validated['has_lyrics'] = !empty($validated['lyrics']);
        $validated['has_chords'] = !empty($validated['chords']);

        Song::create($validated);

        return back()->with('success', 'Lagu berhasil ditambahkan.');
    }

    public function update(Request $request, Song $song)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'arrangement_name' => 'nullable|string|max:255',
            'keys' => 'nullable|string|max:50',
            'bpm' => 'nullable|string|max:20',
            'song_flow' => 'nullable|string|max:500',
            'time_signature' => 'nullable|string|max:20',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|string|max:255',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if ($request->hasFile('pdf_file')) {
            // Delete old file if exists
            if ($song->pdf_path) {
                Storage::disk('public')->delete($song->pdf_path);
            }
            $validated['pdf_path'] = $request->file('pdf_file')->store('songs/pdf', 'public');
            $validated['has_pdf'] = true;
        }

        $validated['has_lyrics'] = !empty($validated['lyrics']);
        $validated['has_chords'] = !empty($validated['chords']);

        $song->update($validated);

        return back()->with('success', 'Lagu berhasil diperbarui.');
    }

    public function destroy(Song $song)
    {
        if ($song->pdf_path) {
            Storage::disk('public')->delete($song->pdf_path);
        }
        $song->delete();

        return back()->with('success', 'Lagu berhasil dihapus.');
    }
}
