<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSession;
use App\Models\EventVolunteer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MobileEventController extends Controller
{
    private function serializeEvent(Event $event): array
    {
        $attendanceType = $event->attendance_type;
        if ($attendanceType === 'class_participant') {
            $attendanceType = 'general';
        }
        if (! in_array($attendanceType, ['volunteer', 'general'], true)) {
            $attendanceType = 'general';
        }

        $sessions = $event->sessions->map(function (EventSession $session) use ($event): array {
            return [
                'id' => $session->id,
                'name' => $session->title ?: ('Sesi '.($session->session_number ?: 1)),
                'start_time' => $session->start_time ?: ($event->time ?? ''),
                'end_time' => $session->end_time ?: '',
                'attendance_start_time' => $session->attendance_start_time ?: ($event->attendance_start_time ?? ''),
            ];
        })->values()->all();

        if (count($sessions) === 0) {
            $sessions[] = [
                'id' => 0,
                'name' => 'Sesi Utama',
                'start_time' => $event->time ?? '',
                'end_time' => '',
                'attendance_start_time' => $event->attendance_start_time ?? '',
            ];
        }

        $trainingSchedules = $event->training_schedules ?? [];
        $otherSchedules = $event->other_schedules ?? [];

        return [
            'id' => $event->id,
            'title' => $event->title,
            'date' => $event->date,
            'time' => $event->time,
            'location' => $event->location,
            'address' => $event->address ?: '',
            'category' => $event->category,
            'attendance_type' => $attendanceType,
            'total_sessions' => (int) ($event->total_sessions ?: max(1, count($sessions))),
            'sessions' => $sessions,
            'worship' => [
                'date' => $event->date,
                'start_time' => $event->time,
                'end_time' => null,
            ],
            'training_schedules' => $trainingSchedules,
            'training' => $trainingSchedules,
            'other_schedules' => $otherSchedules,
            'other' => $otherSchedules,
        ];
    }

    public function index(Request $request)
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Event::with(['sessions'])->orderBy('date', 'asc')->orderBy('time', 'asc');

        $events = $query
            ->when($validated['from'] ?? null, fn ($query, $from) => $query->whereDate('date', '>=', $from))
            ->when($validated['to'] ?? null, fn ($query, $to) => $query->whereDate('date', '<=', $to))
            ->paginate(20);

        return response()->json([
            'data' => $events->getCollection()->map(fn (Event $event): array => $this->serializeEvent($event))->values()->all(),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    public function show(Event $event)
    {
        $event->loadMissing(['sessions', 'rundownSegments.items.song.arrangements', 'rundownSegments.items.arrangement']);

        return response()->json([
            'data' => $this->serializeEvent($event),
        ]);
    }

    public function mySchedules(Request $request)
    {
        $user = $request->user();
        $memberId = $user?->member_id;

        if (! $memberId) {
            return response()->json(['data' => []]);
        }

        $assignments = EventVolunteer::with('event.sessions')
            ->where('member_id', $memberId)
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $assignments->map(function (EventVolunteer $assignment): ?array {
            $event = $assignment->event;

            if (! $event) {
                return null;
            }

            return [
                'assignment_id' => $assignment->id,
                'event_id' => $event->id,
                'response_status' => $assignment->response_status ?? 'pending',
                'response_reason' => $assignment->response_reason,
                'responded_at' => $assignment->responded_at?->toIso8601String(),
                ...$this->serializeEvent($event),
            ];
        })->filter()->values()->all();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function acceptSchedule(Request $request, EventVolunteer $eventVolunteer)
    {
        $user = $request->user();

        abort_unless((string) $eventVolunteer->member_id === (string) $user?->member_id, 403);

        $eventVolunteer->update([
            'response_status' => 'accepted',
            'response_reason' => null,
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Jadwal pelayanan berhasil diterima.',
            'data' => [
                'assignment_id' => $eventVolunteer->id,
                'event_id' => $eventVolunteer->event_id,
                'response_status' => 'accepted',
                'response_reason' => null,
                'responded_at' => $eventVolunteer->fresh()->responded_at?->toIso8601String(),
            ],
        ]);
    }

    public function declineSchedule(Request $request, EventVolunteer $eventVolunteer)
    {
        $user = $request->user();

        abort_unless((string) $eventVolunteer->member_id === (string) $user?->member_id, 403);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $eventVolunteer->update([
            'response_status' => 'declined',
            'response_reason' => $validated['reason'],
            'responded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Alasan penolakan jadwal berhasil dikirim.',
            'data' => [
                'assignment_id' => $eventVolunteer->id,
                'event_id' => $eventVolunteer->event_id,
                'response_status' => 'declined',
                'response_reason' => $validated['reason'],
                'responded_at' => $eventVolunteer->fresh()->responded_at?->toIso8601String(),
            ],
        ]);
    }

    public function myAttendances(Request $request)
    {
        $user = $request->user();
        $memberId = $user?->member_id;
        $from = $request->query('from');
        $to = $request->query('to');

        if (! $memberId) {
            return response()->json(['data' => [], 'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0]]);
        }

        $query = Attendance::with(['event', 'session'])
            ->where('member_id', $memberId)
            ->orderBy('scan_time', 'desc');

        if ($from) {
            $query->whereDate('scan_time', '>=', $from);
        }
        if ($to) {
            $query->whereDate('scan_time', '<=', $to);
        }

        $attendances = $query->get();

        $serialized = $attendances->map(function (Attendance $att): array {
            return [
                'id' => $att->id,
                'event_id' => $att->event_id,
                'event_session_id' => $att->event_session_id,
                'member_id' => $att->member_id,
                'scan_time' => $att->scan_time?->toIso8601String(),
                'check_out_time' => $att->check_out_time?->toIso8601String(),
                'status' => $att->status,
                'event_title' => $att->event?->title,
                'event_date' => $att->event?->date,
                'session_name' => $att->session?->title,
            ];
        })->values()->all();

        return response()->json([
            'data' => $serialized,
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => count($serialized) ?: 20,
                'total' => count($serialized),
            ],
        ]);
    }

    public function rundown(Event $event)
    {
        $event->loadMissing(['rundownSegments.items.song.arrangements', 'rundownSegments.items.arrangement']);

        $segments = $event->rundownSegments->map(function ($seg): array {
            return [
                'id' => $seg->id,
                'title' => $seg->title,
                'duration_seconds' => (int) ($seg->duration_seconds ?? 0),
                'items' => $seg->items->map(function ($item): array {
                    $song = $item->song;
                    $arrangement = $item->arrangement ?? ($song?->arrangements?->first());

                    return [
                        'id' => $item->id,
                        'title' => $item->title,
                        'duration_seconds' => (int) ($item->duration_seconds ?? 0),
                        'type' => $item->song_id ? 'Song' : 'Item',
                        'song_title' => $song?->title,
                        'song_artist' => $song?->artist,
                        'arrangement' => $arrangement ? [
                            'id' => $arrangement->id,
                            'arrangement_name' => $arrangement->arrangement_name,
                            'keys' => $arrangement->keys,
                            'bpm' => $arrangement->bpm,
                            'time_signature' => $arrangement->time_signature,
                            'song_flow' => $arrangement->song_flow,
                            'lyrics' => $arrangement->lyrics,
                            'video_url' => $arrangement->video_url,
                        ] : null,
                    ];
                })->values()->all(),
            ];
        })->values()->all();

        return response()->json([
            'data' => [
                'event_id' => $event->id,
                'segments' => $segments,
            ],
        ]);
    }

    public function liveRundown(Event $event)
    {
        $event->loadMissing(['liveSession', 'rundownSegments.items.song.arrangements', 'rundownSegments.items.arrangement']);

        $liveSession = $event->liveSession;
        $segments = $event->rundownSegments->sortBy('sort_order')->values();

        $result = [
            'event_id' => $event->id,
            'current_segment_index' => (int) ($liveSession?->current_segment_index ?? 0),
            'current_item_index' => (int) ($liveSession?->current_item_index ?? 0),
            'item_started_at' => $liveSession?->item_started_at ?? null,
            'duration_seconds' => (int) ($liveSession?->current_duration_seconds ?? 0),
            'server_time' => now()->toIso8601String(),
            'segments' => [],
        ];

        $currentSegIdx = 0;
        foreach ($segments as $segment) {
            $items = $segment->items->sortBy('sort_order')->values();
            $serializedItems = [];
            $currentItemIdx = 0;
            foreach ($items as $item) {
                $song = $item->song;
                $arrangement = $item->arrangement ?? ($song?->arrangements?->first());
                $serializedItems[] = [
                    'id' => $item->id,
                    'title' => $item->title,
                    'duration_seconds' => (int) ($item->duration_seconds ?? 0),
                    'type' => $item->song_id ? 'Song' : 'Item',
                    'song_title' => $song?->title,
                    'song_artist' => $song?->artist,
                    'arrangement' => $arrangement ? [
                        'id' => $arrangement->id,
                        'arrangement_name' => $arrangement->arrangement_name,
                        'keys' => $arrangement->keys,
                        'bpm' => $arrangement->bpm,
                        'time_signature' => $arrangement->time_signature,
                        'song_flow' => $arrangement->song_flow,
                        'lyrics' => $arrangement->lyrics,
                        'video_url' => $arrangement->video_url,
                    ] : null,
                ];
                $currentItemIdx++;
            }
            $result['segments'][] = [
                'id' => $segment->id,
                'title' => $segment->title,
                'items' => $serializedItems,
            ];
            $currentSegIdx++;
        }

        return response()->json(['data' => $result]);
    }

    public function postAttendance(Request $request, Event $event)
    {
        $user = $request->user();
        $memberId = $user?->member_id;

        if (! $memberId) {
            return response()->json([
                'message' => 'User belum terhubung dengan member.',
                'code' => 'member_not_linked',
            ], 422);
        }

        $validated = $request->validate([
            'event_session_id' => 'nullable|integer',
            'scan_type' => 'nullable|string|in:check_in,check_out',
        ]);

        $scanType = $validated['scan_type'] ?? 'check_in';
        $sessionId = $validated['event_session_id'] ?? null;

        if (! $sessionId) {
            $firstSession = $event->sessions()->first();
            $sessionId = $firstSession?->id;
        }

        if ($sessionId) {
            $sessionExists = EventSession::where('id', $sessionId)
                ->where('event_id', $event->id)
                ->exists();
            if (! $sessionExists) {
                return response()->json([
                    'message' => 'Sesi event tidak valid.',
                    'code' => 'validation_error',
                    'errors' => ['event_session_id' => ['Sesi tidak ditemukan pada event ini.']],
                ], 422);
            }
        }

        return DB::transaction(function () use ($event, $memberId, $scanType, $sessionId) {
            $existing = Attendance::where('event_id', $event->id)
                ->where('member_id', $memberId)
                ->when($sessionId, fn ($q) => $q->where('event_session_id', $sessionId))
                ->orderBy('scan_time', 'desc')
                ->first();

            if ($scanType === 'check_out') {
                if (! $existing) {
                    return response()->json([
                        'message' => 'Check-in belum dilakukan.',
                        'code' => 'check_in_required',
                    ], 422);
                }
                $existing->check_out_time = now();
                $existing->save();

                return response()->json([
                    'message' => 'Check-out berhasil dicatat.',
                    'data' => [
                        'id' => $existing->id,
                        'event_id' => $existing->event_id,
                        'event_session_id' => $existing->event_session_id,
                        'member_id' => $existing->member_id,
                        'scan_time' => $existing->scan_time?->toIso8601String(),
                        'check_out_time' => $existing->check_out_time?->toIso8601String(),
                        'status' => $existing->status,
                    ],
                ]);
            }

            if ($existing && $existing->check_out_time === null) {
                return response()->json([
                    'message' => 'Anda sudah check-in pada event/sesi ini.',
                    'code' => 'already_checked_in',
                ], 409);
            }

            $now = now();
            $status = 'Present';
            $lateThreshold = $event->attendance_start_time;
            if ($lateThreshold) {
                $eventDate = $event->date;
                $cutoff = "{$eventDate} {$lateThreshold}";
                try {
                    if ($now->gt(Carbon::parse($cutoff)->addMinutes(15))) {
                        $status = 'Late';
                    }
                } catch (\Throwable) {
                }
            }

            $attendance = Attendance::create([
                'event_id' => $event->id,
                'event_session_id' => $sessionId,
                'member_id' => $memberId,
                'scan_time' => $now,
                'check_out_time' => null,
                'status' => $status,
            ]);

            return response()->json([
                'message' => 'Absensi berhasil dicatat.',
                'data' => [
                    'id' => $attendance->id,
                    'event_id' => $attendance->event_id,
                    'event_session_id' => $attendance->event_session_id,
                    'member_id' => $attendance->member_id,
                    'scan_time' => $attendance->scan_time?->toIso8601String(),
                    'check_out_time' => $attendance->check_out_time,
                    'status' => $attendance->status,
                ],
            ], 201);
        });
    }
}
