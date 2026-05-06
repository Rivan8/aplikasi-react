<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SongController extends Controller
{
    public function index(Request $request)
    {
        $query = Song::query();

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('arrangement_name', 'like', '%' . $request->search . '%');
        }

        $songs = $query->latest()->paginate(10)->withQueryString();

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
            'keys' => 'nullable|string|max:10',
            'bpm' => 'nullable|string|max:50',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|url',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
            'song_flow' => 'nullable|string',
            'time_signature' => 'nullable|string|max:20',
        ]);

        if ($request->hasFile('pdf_file')) {
            $validated['pdf_path'] = $request->file('pdf_file')->store('songs/pdfs', 'public');
        }

        Song::create($validated);

        return redirect()->route('songs.index');
    }

    public function update(Request $request, Song $song)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'arrangement_name' => 'nullable|string|max:255',
            'keys' => 'nullable|string|max:10',
            'bpm' => 'nullable|string|max:50',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|url',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
            'song_flow' => 'nullable|string',
            'time_signature' => 'nullable|string|max:20',
        ]);

        if ($request->hasFile('pdf_file')) {
            // Delete old file if exists
            if ($song->pdf_path) {
                Storage::disk('public')->delete($song->pdf_path);
            }
            $validated['pdf_path'] = $request->file('pdf_file')->store('songs/pdfs', 'public');
        }

        $song->update($validated);

        return redirect()->route('songs.index');
    }

    public function destroy(Song $song)
    {
        if ($song->pdf_path) {
            Storage::disk('public')->delete($song->pdf_path);
        }
        $song->delete();
        return redirect()->route('songs.index');
    }
}
