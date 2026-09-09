<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventMessage;
use App\Models\EventMessageRead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MobileMessageController extends Controller
{
    public function index(Request $request)
    {
        $memberId = $request->user()?->member_id;
        if (! $memberId) {
            return response()->json([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 20, 'total' => 0],
            ]);
        }

        $messages = EventMessage::with('event')
            ->whereHas('event.volunteers', fn ($query) => $query->where('member_id', $memberId))
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $messages->getCollection()
                ->map(fn (EventMessage $message): array => $this->serializeMessage($message, $request->user()->id))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    public function show(Request $request, EventMessage $eventMessage)
    {
        $this->authorizeMessage($request, $eventMessage);

        return response()->json([
            'data' => $this->serializeMessage($eventMessage->load('event'), $request->user()->id),
        ]);
    }

    public function markRead(Request $request, EventMessage $eventMessage)
    {
        $this->authorizeMessage($request, $eventMessage);

        EventMessageRead::firstOrCreate([
            'event_message_id' => $eventMessage->id,
            'user_id' => $request->user()->id,
        ], ['read_at' => now()]);

        return response()->json([
            'message' => 'Pesan ditandai telah dibaca.',
            'code' => 'success',
        ]);
    }

    private function authorizeMessage(Request $request, EventMessage $eventMessage): void
    {
        abort_unless(
            $request->user()?->member_id
                && $eventMessage->event()->whereHas('volunteers', fn ($query) => $query->where('member_id', $request->user()->member_id))->exists(),
            403,
        );
    }

    private function serializeMessage(EventMessage $message, int $userId): array
    {
        return [
            'id' => $message->id,
            'event_id' => $message->event_id,
            'event_title' => $message->event?->title,
            'title' => $message->title,
            'body' => $message->body,
            'attachment' => $message->attachment_path ? [
                'url' => Storage::disk('public')->url($message->attachment_path),
                'name' => $message->attachment_name,
                'mime' => $message->attachment_mime,
                'size' => $message->attachment_size,
            ] : null,
            'is_read' => EventMessageRead::where('event_message_id', $message->id)
                ->where('user_id', $userId)
                ->exists(),
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }
}
