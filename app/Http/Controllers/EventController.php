<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\ExternalMember;
use App\Models\EventVolunteer;
use Illuminate\Http\Request;
use Inertia\Inertia;

use App\Models\Category;

class EventController extends Controller
{
    public function index()
    {
        return Inertia::render('events/index', [
            'events' => Event::with(['volunteers.member', 'rundownSegments.items'])->orderBy('date', 'desc')->get(),
            'categories' => Category::with('roles.department')->get(),
            'external_members' => ExternalMember::select('idjemaat', 'namalengkap')->get()->map(function($m) {
                return [
                    'id' => $m->idjemaat,
                    'name' => $m->namalengkap
                ];
            }),
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
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string', // Changed to string because multipart/form-data often handles arrays differently in some setups, but we'll parse it
            'rundown_segments' => 'nullable|string',
        ]);

        $data = \Illuminate\Support\Arr::except($validated, ['image', 'volunteers', 'rundown_segments']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('events', 'public');
            $data['image_path'] = '/storage/' . $path;
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

        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil dibuat');
    }

    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string',
            'rundown_segments' => 'nullable|string',
            '_method' => 'nullable|string', // For spoofing
        ]);

        $data = \Illuminate\Support\Arr::except($validated, ['image', 'volunteers', 'rundown_segments', '_method']);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($event->image_path) {
                $oldPath = str_replace('/storage/', '', $event->image_path);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('image')->store('events', 'public');
            $data['image_path'] = '/storage/' . $path;
        }

        $event->update($data);

        // Refresh volunteers
        $event->volunteers()->delete();
        $volunteers = is_string($request->volunteers) ? json_decode($request->volunteers, true) : $request->volunteers;
        if (!empty($volunteers) && is_array($volunteers)) {
            foreach ($volunteers as $v) {
                if (!empty($v['member_id']) && $v['member_id'] !== 'none') {
                    $event->volunteers()->create($v);
                }
            }
        }

        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil diperbarui');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return back()->with('success', 'Event berhasil dihapus');
    }

    private function syncRundown(Event $event, ?string $payload): void
    {
        $segments = is_string($payload) ? json_decode($payload, true) : [];

        $event->rundownSegments()->delete();

        if (! is_array($segments)) {
            return;
        }

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
                    'duration_seconds' => max(0, (int) ($item['duration_seconds'] ?? 0)),
                    'sort_order' => $itemIndex,
                ]);
            }
        }
    }
}
