<?php

namespace App\Http\Controllers;

use App\Models\Song;
use App\Models\SongArrangement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
                'artist' => $validated['artist'] ?? null,
            ]);

            $arrangementData = [
                'song_id' => $song->id,
                'name' => $validated['arrangement_name'],
                'duration' => $validated['duration'] ?? null,
                'bpm' => $validated['bpm'] ?? null,
                'time_signature' => $validated['time_signature'] ?? null,
                'song_flow' => $validated['song_flow'] ?? null,
                'keys' => $validated['keys'] ?? null,
                'lyrics' => $validated['lyrics'] ?? null,
                'chords' => $validated['chords'] ?? null,
                'video_url' => $validated['video_url'] ?? null,
                'has_lyrics' => !empty($validated['lyrics'] ?? null),
                'has_chords' => !empty($validated['chords'] ?? null),
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

        $arrangementData = array_merge([
            'duration' => null,
            'bpm' => null,
            'time_signature' => null,
            'song_flow' => null,
            'keys' => null,
            'lyrics' => null,
            'chords' => null,
            'video_url' => null,
        ], $validated, [
            'song_id' => $song->id,
            'has_lyrics' => !empty($validated['lyrics'] ?? null),
            'has_chords' => !empty($validated['chords'] ?? null),
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

        $updateData = array_merge([
            'duration' => null,
            'bpm' => null,
            'time_signature' => null,
            'song_flow' => null,
            'keys' => null,
            'lyrics' => null,
            'chords' => null,
            'video_url' => null,
        ], $validated, [
            'has_lyrics' => !empty($validated['lyrics'] ?? null),
            'has_chords' => !empty($validated['chords'] ?? null),
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

    public function viewPdf(SongArrangement $arrangement)
    {
        if (!$arrangement->pdf_path || !Storage::disk('public')->exists($arrangement->pdf_path)) {
            abort(404, 'File PDF tidak ditemukan.');
        }

        return response()->file(Storage::disk('public')->path($arrangement->pdf_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($arrangement->pdf_path) . '"',
        ]);
    }

    public function duplicateArrangement(SongArrangement $arrangement)
    {
        $newArrangement = $arrangement->replicate();
        $newArrangement->name = $arrangement->name . ' (Copy)';

        if ($arrangement->pdf_path && Storage::disk('public')->exists($arrangement->pdf_path)) {
            $ext = pathinfo($arrangement->pdf_path, PATHINFO_EXTENSION);
            $newPdfPath = 'songs/pdf/' . Str::uuid() . '.' . $ext;
            Storage::disk('public')->copy($arrangement->pdf_path, $newPdfPath);
            $newArrangement->pdf_path = $newPdfPath;
        }

        $newArrangement->save();

        return back()->with('success', 'Aransemen berhasil diduplikasi.');
    }
}
