<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventLiveSession;
use App\Models\EventRundownSegment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiveEventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::with(['rundownSegments.items', 'liveSession.runs'])
            ->whereHas('rundownSegments')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();

        $selectedEvent = $events->firstWhere('id', (int) $request->input('event_id')) ?? $events->first();

        return Inertia::render('live-events/index', [
            'events' => $events->map(fn (Event $event) => $this->serializeEvent($event)),
            'selected_event' => $selectedEvent ? $this->serializeEvent($selectedEvent) : null,
            'server_now' => now()->toISOString(),
            'breadcrumbs' => [
                ['title' => 'Live Event', 'href' => route('live-events.index')],
            ],
        ]);
    }

    public function start(Event $event)
    {
        $segments = $event->rundownSegments()->orderBy('sort_order')->get();

        if ($segments->isEmpty()) {
            return back()->with('error', 'Event ini belum memiliki rundown.');
        }

        $session = EventLiveSession::updateOrCreate(
            ['event_id' => $event->id],
            [
                'status' => 'running',
                'current_segment_index' => 0,
                'started_at' => now(),
                'segment_started_at' => now(),
                'finished_at' => null,
            ],
        );

        $session->runs()->delete();

        return redirect()
            ->route('live-events.index', ['event_id' => $event->id])
            ->with('success', 'Live event dimulai.');
    }

    public function next(Event $event)
    {
        $session = $event->liveSession;

        if (! $session || $session->status !== 'running') {
            return back()->with('error', 'Live event belum berjalan.');
        }

        $segments = $event->rundownSegments()->orderBy('sort_order')->get()->values();
        $currentSegment = $segments->get($session->current_segment_index);

        if (! $currentSegment) {
            return back()->with('error', 'Segment aktif tidak ditemukan.');
        }

        $this->recordCurrentSegment($session, $currentSegment);

        $nextIndex = $session->current_segment_index + 1;

        if ($nextIndex >= $segments->count()) {
            $session->update([
                'status' => 'completed',
                'finished_at' => now(),
                'segment_started_at' => null,
            ]);

            return redirect()
                ->route('live-events.index', ['event_id' => $event->id])
                ->with('success', 'Live event selesai.');
        }

        $session->update([
            'current_segment_index' => $nextIndex,
            'segment_started_at' => now(),
        ]);

        return redirect()
            ->route('live-events.index', ['event_id' => $event->id])
            ->with('success', 'Berpindah ke segment berikutnya.');
    }

    public function finish(Event $event)
    {
        $session = $event->liveSession;

        if (! $session) {
            return back()->with('error', 'Live event belum pernah dimulai.');
        }

        if ($session->status === 'running') {
            $segments = $event->rundownSegments()->orderBy('sort_order')->get()->values();
            $currentSegment = $segments->get($session->current_segment_index);

            if ($currentSegment) {
                $this->recordCurrentSegment($session, $currentSegment);
            }
        }

        $session->update([
            'status' => 'completed',
            'finished_at' => now(),
            'segment_started_at' => null,
        ]);

        return redirect()
            ->route('live-events.index', ['event_id' => $event->id])
            ->with('success', 'Live event dihentikan.');
    }

    private function recordCurrentSegment(EventLiveSession $session, EventRundownSegment $segment): void
    {
        $startedAt = $session->segment_started_at ?? now();
        $endedAt = now();
        $actualSeconds = max(0, $startedAt->diffInSeconds($endedAt));
        $plannedSeconds = (int) $segment->duration_seconds;

        $session->runs()->updateOrCreate(
            ['segment_index' => $session->current_segment_index],
            [
                'event_rundown_segment_id' => $segment->id,
                'title' => $segment->title,
                'planned_seconds' => $plannedSeconds,
                'actual_seconds' => $actualSeconds,
                'overrun_seconds' => $actualSeconds - $plannedSeconds,
                'started_at' => $startedAt,
                'ended_at' => $endedAt,
            ],
        );
    }

    private function serializeEvent(Event $event): array
    {
        $session = $event->liveSession;

        return [
            'id' => $event->id,
            'title' => $event->title,
            'date' => $event->date,
            'time' => $event->time,
            'location' => $event->location,
            'category' => $event->category,
            'rundown_segments' => $event->rundownSegments->map(fn ($segment) => [
                'id' => $segment->id,
                'title' => $segment->title,
                'duration_seconds' => $segment->duration_seconds,
                'sort_order' => $segment->sort_order,
                'items' => $segment->items->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'duration_seconds' => $item->duration_seconds,
                ])->values(),
            ])->values(),
            'live_session' => $session ? [
                'id' => $session->id,
                'status' => $session->status,
                'current_segment_index' => $session->current_segment_index,
                'started_at' => $session->started_at?->toISOString(),
                'segment_started_at' => $session->segment_started_at?->toISOString(),
                'finished_at' => $session->finished_at?->toISOString(),
                'runs' => $session->runs->map(fn ($run) => [
                    'id' => $run->id,
                    'segment_index' => $run->segment_index,
                    'title' => $run->title,
                    'planned_seconds' => $run->planned_seconds,
                    'actual_seconds' => $run->actual_seconds,
                    'overrun_seconds' => $run->overrun_seconds,
                    'started_at' => $run->started_at?->toISOString(),
                    'ended_at' => $run->ended_at?->toISOString(),
                ])->values(),
            ] : null,
        ];
    }
}
