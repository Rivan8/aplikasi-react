<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventLiveSession;
use App\Models\EventRundownSegment;
use App\Models\EventRundownItemRun;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiveEventController extends Controller
{
    public function index(Request $request)
    {
        $events = Event::with(['rundownSegments.items.song.arrangements', 'rundownSegments.items.arrangement', 'liveSession.runs'])
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

    public function timeKeeper(Request $request)
    {
        $events = Event::with(['rundownSegments.items.song.arrangements', 'rundownSegments.items.arrangement', 'liveSession.runs'])
            ->whereHas('rundownSegments')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();

        $selectedEvent = $events->firstWhere('id', (int) $request->input('event_id')) ?? $events->first();

        return Inertia::render('live-events/time-keeper', [
            'events' => $events->map(fn (Event $event) => $this->serializeEvent($event)),
            'selected_event' => $selectedEvent ? $this->serializeEvent($selectedEvent) : null,
            'server_now' => now()->toISOString(),
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
                'current_item_index' => 0,
                'started_at' => now(),
                'segment_started_at' => now(),
                'item_started_at' => now(),
                'finished_at' => null,
            ],
        );

        $session->runs()->delete();
        $session->itemRuns()->delete();

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

        $currentItems = $currentSegment->items()->orderBy('sort_order')->get()->values();
        $currentItem = $currentItems->get($session->current_item_index);

        if (! $currentItem) {
            return back()->with('error', 'Item aktif tidak ditemukan.');
        }

        // Record current item timing
        $this->recordCurrentItem($session, $currentSegment, $currentItem, $session->current_segment_index, $session->current_item_index);

        $nextItemIndex = $session->current_item_index + 1;

        // If there are more items in the current segment, move to next item
        if ($nextItemIndex < $currentItems->count()) {
            $session->update([
                'current_item_index' => $nextItemIndex,
                'item_started_at' => now(),
            ]);

            return redirect()
                ->route('live-events.index', ['event_id' => $event->id])
                ->with('success', 'Pindah ke item berikutnya.');
        }

        // All items in this segment are done, record segment and move to next segment
        $this->recordCurrentSegment($session, $currentSegment);

        $nextSegmentIndex = $session->current_segment_index + 1;

        if ($nextSegmentIndex >= $segments->count()) {
            $session->update([
                'status' => 'completed',
                'finished_at' => now(),
                'segment_started_at' => null,
                'item_started_at' => null,
            ]);

            return redirect()
                ->route('live-events.index', ['event_id' => $event->id])
                ->with('success', 'Live event selesai.');
        }

        $session->update([
            'current_segment_index' => $nextSegmentIndex,
            'current_item_index' => 0,
            'segment_started_at' => now(),
            'item_started_at' => now(),
        ]);

        return redirect()
            ->route('live-events.index', ['event_id' => $event->id])
            ->with('success', 'Pindah ke segment berikutnya.');
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
                $currentItem = $currentSegment->items()->orderBy('sort_order')->get()->values()->get($session->current_item_index);

                if ($currentItem) {
                    $this->recordCurrentItem($session, $currentSegment, $currentItem, $session->current_segment_index, $session->current_item_index);
                }

                $this->recordCurrentSegment($session, $currentSegment);
            }
        }

        $session->update([
            'status' => 'completed',
            'finished_at' => now(),
            'segment_started_at' => null,
            'item_started_at' => null,
        ]);

        return redirect()
            ->route('live-events.index', ['event_id' => $event->id])
            ->with('success', 'Live event dihentikan.');
    }

    private function recordCurrentItem(EventLiveSession $session, EventRundownSegment $segment, $item, int $segmentIndex, int $itemIndex): void
    {
        $startedAt = $session->item_started_at ?? now();
        $endedAt = now();
        $actualSeconds = max(0, $startedAt->diffInSeconds($endedAt));
        $plannedSeconds = (int) $item->duration_seconds;

        $session->itemRuns()->updateOrCreate(
            ['segment_index' => $segmentIndex, 'item_index' => $itemIndex],
            [
                'event_rundown_item_id' => $item->id,
                'title' => $item->title,
                'planned_seconds' => $plannedSeconds,
                'actual_seconds' => $actualSeconds,
                'overrun_seconds' => $actualSeconds - $plannedSeconds,
                'started_at' => $startedAt,
                'ended_at' => $endedAt,
            ],
        );
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
                    'song' => $item->song ? [
                        'id' => $item->song->id,
                        'title' => $item->song->title,
                        'artist' => $item->song->artist,
                        'song_flow' => ($item->arrangement ?: $item->song->arrangements->first())?->song_flow,
                        'bpm' => ($item->arrangement ?: $item->song->arrangements->first())?->bpm,
                        'keys' => ($item->arrangement ?: $item->song->arrangements->first())?->keys,
                        'time_signature' => ($item->arrangement ?: $item->song->arrangements->first())?->time_signature,
                        'lyrics' => ($item->arrangement ?: $item->song->arrangements->first())?->lyrics,
                        'video_url' => ($item->arrangement ?: $item->song->arrangements->first())?->video_url,
                    ] : null,
                ])->values(),
            ])->values(),
            'live_session' => $session ? [
                'id' => $session->id,
                'status' => $session->status,
                'current_segment_index' => $session->current_segment_index,
                'current_item_index' => $session->current_item_index,
                'started_at' => $session->started_at?->toISOString(),
                'segment_started_at' => $session->segment_started_at?->toISOString(),
                'item_started_at' => $session->item_started_at?->toISOString(),
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
                'item_runs' => $session->itemRuns->map(fn ($run) => [
                    'id' => $run->id,
                    'segment_index' => $run->segment_index,
                    'item_index' => $run->item_index,
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
