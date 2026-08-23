<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

use App\Models\Category;
use App\Models\Song;
use App\Services\MemberApiService;

class EventController extends Controller
{
    public function index(MemberApiService $memberApi)
    {
        $externalMembers = $memberApi->listAll();
        $membersById = collect($externalMembers)->keyBy(fn (array $member) => (string) $member['idjemaat']);
        $events = Event::with([
            'volunteers',
            'participants',
            'sessions',
            'rundownSegments.items.song.arrangements',
            'rundownSegments.items.arrangement'
        ])->orderBy('date', 'desc')->get();

        $events->each(function (Event $event) use ($membersById): void {
            $event->volunteers->each(function ($volunteer) use ($membersById): void {
                $volunteer->setAttribute('member', $membersById->get((string) $volunteer->member_id));
            });
            $event->participants->each(function ($participant) use ($membersById): void {
                $participant->setAttribute('member', $membersById->get((string) $participant->member_id));
            });
        });

        return Inertia::render('events/index', [
            'events' => $events,
            'categories' => Category::with('roles.department')->get(),
            'songs' => Song::with('arrangements')->orderBy('title')->get(),
            'external_members' => $externalMembers,
            'breadcrumbs' => [
                ['title' => 'Event Dashboard', 'href' => '/events'],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'attendance_start_time' => 'nullable|string',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'attendance_type' => 'nullable|string|in:volunteer,class_participant',
            'total_sessions' => 'nullable|integer|min:1',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string',
            'rundown_segments' => 'nullable|string',
            'sessions' => 'nullable|string',
            'participants' => 'nullable|string',
        ]);

        $data = \Illuminate\Support\Arr::except($validated, ['image', 'volunteers', 'rundown_segments', 'sessions', 'participants']);
        $data['attendance_type'] = $validated['attendance_type'] ?? 'volunteer';
        $data['total_sessions'] = $validated['total_sessions'] ?? 1;

        if ($request->hasFile('image')) {
            $path = Storage::disk('public')->putFile('events', $request->file('image'));
            if ($path === false) {
                throw ValidationException::withMessages([
                    'image' => 'Gambar gagal disimpan. Periksa permission folder storage.',
                ]);
            }

            $data['image_path'] = '/event-images/' . $path;
        }

        $event = Event::create($data);

        $volunteers = is_string($request->volunteers) ? json_decode($request->volunteers, true) : $request->volunteers;
        if (!empty($volunteers) && is_array($volunteers)) {
            foreach ($volunteers as $v) {
                if (!empty($v['member_id']) && $v['member_id'] !== 'none') {
                    $event->volunteers()->create($v);
                }
            }
        }

        $this->syncSessions($event, $request->sessions);
        $this->syncParticipants($event, $request->participants);
        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil dibuat');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'attendance_start_time' => 'nullable|string',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'attendance_type' => 'nullable|string|in:volunteer,class_participant',
            'total_sessions' => 'nullable|integer|min:1',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string',
            'rundown_segments' => 'nullable|string',
            'sessions' => 'nullable|string',
            'participants' => 'nullable|string',
            '_method' => 'nullable|string',
        ]);

        $data = \Illuminate\Support\Arr::except($validated, ['image', 'volunteers', 'rundown_segments', 'sessions', 'participants', '_method']);

        if ($request->hasFile('image')) {
            if ($event->image_path) {
                $oldPath = str_starts_with($event->image_path, '/event-images/')
                    ? substr($event->image_path, strlen('/event-images/'))
                    : str_replace('/storage/', '', $event->image_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = Storage::disk('public')->putFile('events', $request->file('image'));
            if ($path === false) {
                throw ValidationException::withMessages([
                    'image' => 'Gambar gagal disimpan. Periksa permission folder storage.',
                ]);
            }

            $data['image_path'] = '/event-images/' . $path;
        }

        $event->update($data);

        $event->volunteers()->delete();
        $volunteers = is_string($request->volunteers) ? json_decode($request->volunteers, true) : $request->volunteers;
        if (!empty($volunteers) && is_array($volunteers)) {
            foreach ($volunteers as $v) {
                if (!empty($v['member_id']) && $v['member_id'] !== 'none') {
                    $event->volunteers()->create($v);
                }
            }
        }

        $this->syncSessions($event, $request->sessions);
        $this->syncParticipants($event, $request->participants);
        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil diperbarui');
    }

    public function enrollParticipant(Request $request, Event $event)
    {
        $validated = $request->validate([
            'member_id' => 'required',
        ]);

        $exists = $event->participants()->where('member_id', $validated['member_id'])->exists();
        if ($exists) {
            return back()->with('error', 'Anggota sudah terdaftar sebagai peserta kelas ini.');
        }

        $event->participants()->create([
            'member_id' => $validated['member_id'],
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        return back()->with('success', 'Peserta berhasil didaftarkan ke kelas.');
    }

    public function removeParticipant(Event $event, \App\Models\EventParticipant $participant)
    {
        if ($participant->event_id !== $event->id) {
            abort(403);
        }

        $participant->delete();
        return back()->with('success', 'Peserta berhasil dihapus dari kelas.');
    }

    public function updateParticipantStatus(Request $request, Event $event, \App\Models\EventParticipant $participant)
    {
        if ($participant->event_id !== $event->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:registered,active,passed,dropped',
        ]);

        $participant->update($validated);
        return back()->with('success', 'Status peserta berhasil diperbarui.');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return back()->with('success', 'Event berhasil dihapus');
    }

    private function syncSessions(Event $event, ?string $payload): void
    {
        if ($event->attendance_type !== 'class_participant') {
            $event->sessions()->delete();
            return;
        }

        if ($payload === null) {
            if ($event->sessions()->count() === 0) {
                $event->sessions()->create([
                    'session_number' => 1,
                    'title' => 'Sesi 1',
                    'date' => $event->date,
                    'start_time' => $event->time,
                ]);
            }
            return;
        }

        $sessions = is_string($payload) ? json_decode($payload, true) : $payload;
        if (!is_array($sessions)) {
            return;
        }

        $event->sessions()->delete();

        foreach (array_values($sessions) as $index => $sess) {
            $sessionNum = $index + 1;
            $event->sessions()->create([
                'session_number' => $sessionNum,
                'title' => trim((string) ($sess['title'] ?? ('Sesi ' . $sessionNum))),
                'date' => $sess['date'] ?? $event->date,
                'start_time' => $sess['start_time'] ?? $event->time,
                'end_time' => $sess['end_time'] ?? null,
                'attendance_start_time' => $sess['attendance_start_time'] ?? null,
            ]);
        }

        $event->update(['total_sessions' => max(1, count($sessions))]);
    }

    private function syncRundown(Event $event, ?string $payload): void
    {
        if (!auth()->user()->isSuperAdmin()) {
            return;
        }

        if ($payload === null) {
            return;
        }

        $segments = json_decode($payload, true);
        if (!is_array($segments)) {
            return;
        }

        $event->rundownSegments()->delete();

        foreach (array_values($segments) as $segmentIndex => $segment) {
            $title = trim((string) ($segment['title'] ?? ''));

            if ($title === '') {
                continue;
            }

            $createdSegment = $event->rundownSegments()->create([
                'title' => $title,
                'duration_seconds' => max(0, (int) ($segment['duration_seconds'] ?? 0)),
                'sort_order' => $segmentIndex,
            ]);

            $items = $segment['items'] ?? [];

            if (! is_array($items)) {
                continue;
            }

            foreach (array_values($items) as $itemIndex => $item) {
                $itemTitle = trim((string) ($item['title'] ?? ''));

                if ($itemTitle === '') {
                    continue;
                }

                $createdSegment->items()->create([
                    'title' => $itemTitle,
                    'song_id' => $item['song_id'] ?? null,
                    'song_arrangement_id' => $item['song_arrangement_id'] ?? null,
                    'duration_seconds' => max(0, (int) ($item['duration_seconds'] ?? 0)),
                    'sort_order' => $itemIndex,
                ]);
            }
        }
    }

    private function syncParticipants(Event $event, ?string $payload): void
    {
        if ($event->attendance_type !== 'class_participant' || $payload === null) {
            return;
        }

        $participants = is_string($payload) ? json_decode($payload, true) : $payload;
        if (!is_array($participants)) {
            return;
        }

        foreach ($participants as $p) {
            if (!empty($p['member_id'])) {
                $event->participants()->firstOrCreate(
                    ['member_id' => $p['member_id']],
                    ['status' => $p['status'] ?? 'registered', 'registered_at' => now()]
                );
            }
        }
    }
}
