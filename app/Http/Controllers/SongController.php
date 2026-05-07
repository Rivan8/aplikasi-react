<?php

namespace App\Http\Controllers;

use App\Models\Song;
use App\Models\SongArrangement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class SongController extends Controller
{
    public function index(Request $request)
    {
        $query = Song::with(['arrangements']);

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('artist', 'like', '%' . $request->search . '%');
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
            'artist' => 'nullable|string|max:255',
            // Default arrangement data
            'arrangement_name' => 'required|string|max:255',
            'duration' => 'nullable|string|max:20',
            'bpm' => 'nullable|string|max:20',
            'time_signature' => 'nullable|string|max:20',
            'song_flow' => 'nullable|string|max:1000',
            'keys' => 'nullable|string|max:50',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|string|max:255',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $song = Song::create([
                'title' => $validated['title'],
                'artist' => $validated['artist'],
            ]);

            $arrangementData = [
                'song_id' => $song->id,
                'name' => $validated['arrangement_name'],
                'duration' => $validated['duration'],
                'bpm' => $validated['bpm'],
                'time_signature' => $validated['time_signature'],
                'song_flow' => $validated['song_flow'],
                'keys' => $validated['keys'],
                'lyrics' => $validated['lyrics'],
                'chords' => $validated['chords'],
                'video_url' => $validated['video_url'],
                'has_lyrics' => !empty($validated['lyrics']),
                'has_chords' => !empty($validated['chords']),
            ];

            if ($request->hasFile('pdf_file')) {
                $arrangementData['pdf_path'] = $request->file('pdf_file')->store('songs/pdf', 'public');
                $arrangementData['has_pdf'] = true;
            }

            $song->arrangements()->create($arrangementData);

            return back()->with('success', 'Lagu dan aransemen berhasil ditambahkan.');
        });
    }

    public function update(Request $request, Song $song)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'artist' => 'nullable|string|max:255',
        ]);

        $song->update($validated);

        return back()->with('success', 'Informasi lagu berhasil diperbarui.');
    }

    public function storeArrangement(Request $request, Song $song)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration' => 'nullable|string|max:20',
            'bpm' => 'nullable|string|max:20',
            'time_signature' => 'nullable|string|max:20',
            'song_flow' => 'nullable|string|max:1000',
            'keys' => 'nullable|string|max:50',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|string|max:255',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $arrangementData = array_merge($validated, [
            'song_id' => $song->id,
            'has_lyrics' => !empty($validated['lyrics']),
            'has_chords' => !empty($validated['chords']),
        ]);

        if ($request->hasFile('pdf_file')) {
            $arrangementData['pdf_path'] = $request->file('pdf_file')->store('songs/pdf', 'public');
            $arrangementData['has_pdf'] = true;
        }

        $song->arrangements()->create($arrangementData);

        return back()->with('success', 'Aransemen baru berhasil ditambahkan.');
    }

    public function updateArrangement(Request $request, SongArrangement $arrangement)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'duration' => 'nullable|string|max:20',
            'bpm' => 'nullable|string|max:20',
            'time_signature' => 'nullable|string|max:20',
            'song_flow' => 'nullable|string|max:1000',
            'keys' => 'nullable|string|max:50',
            'lyrics' => 'nullable|string',
            'chords' => 'nullable|string',
            'video_url' => 'nullable|string|max:255',
            'pdf_file' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        $updateData = array_merge($validated, [
            'has_lyrics' => !empty($validated['lyrics']),
            'has_chords' => !empty($validated['chords']),
        ]);

        if ($request->hasFile('pdf_file')) {
            if ($arrangement->pdf_path) {
                Storage::disk('public')->delete($arrangement->pdf_path);
            }
            $updateData['pdf_path'] = $request->file('pdf_file')->store('songs/pdf', 'public');
            $updateData['has_pdf'] = true;
        }

        $arrangement->update($updateData);

        return back()->with('success', 'Aransemen berhasil diperbarui.');
    }

    public function destroyArrangement(SongArrangement $arrangement)
    {
        if ($arrangement->pdf_path) {
            Storage::disk('public')->delete($arrangement->pdf_path);
        }
        $arrangement->delete();

        return back()->with('success', 'Aransemen berhasil dihapus.');
    }

    public function destroy(Song $song)
    {
        foreach ($song->arrangements as $arrangement) {
            if ($arrangement->pdf_path) {
                Storage::disk('public')->delete($arrangement->pdf_path);
            }
        }
        $song->delete();

        return back()->with('success', 'Lagu berhasil dihapus.');
    }
}
