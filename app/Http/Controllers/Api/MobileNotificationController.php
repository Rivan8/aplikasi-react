<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventMessage;
use App\Models\EventMessageRead;
use App\Models\EventVolunteer;
use Illuminate\Http\Request;

class MobileNotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $memberId = $user?->member_id;
        $userId = $user?->id;

        $notifications = [];

        if ($memberId) {
            $pendingVolunteers = EventVolunteer::with(['event'])
                ->where('member_id', $memberId)
                ->where(function ($q) {
                    $q->whereNull('response_status')
                        ->orWhere('response_status', 'pending');
                })
                ->orderBy('id', 'desc')
                ->get();

            foreach ($pendingVolunteers as $pv) {
                $event = $pv?->event;
                $isRead = in_array($pv->response_status, ['read', 'accepted', 'declined', 'rejected'], true);

                $notifications[] = [
                    'id' => 1000000 + (int) $pv->id,
                    'title' => $event ? "Penugasan: {$event->title}" : 'Penugasan pelayanan baru',
                    'description' => sprintf(
                        'Anda dijadwalkan sebagai %s pada %s.',
                        $pv->role_name ?: 'Pelayanan',
                        $event ? ($event->date . ' • ' . ($event->time ?? '')) : 'event terdekat'
                    ),
                    'category' => 'schedule_pending',
                    'is_read' => $isRead,
                    'created_at' => $event?->date ? ($event->date . 'T00:00:00Z') : now()->toIso8601String(),
                ];
            }
        }

        $messages = EventMessage::with(['event', 'reads'])
            ->latest()
            ->limit(50)
            ->get();

        $readIdsByUser = [];
        if ($userId) {
            $readIdsByUser = EventMessageRead::where('user_id', $userId)
                ->pluck('event_message_id')
                ->unique()
                ->values()
                ->all();
        }

        foreach ($messages as $msg) {
            $event = $msg->event;
            $notifications[] = [
                'id' => 2000000 + (int) $msg->id,
                'title' => $msg->title ?: ($event ? "Pesan: {$event->title}" : 'Pesan event'),
                'description' => mb_substr(strip_tags($msg->body ?? ''), 0, 120),
                'category' => 'event_message',
                'is_read' => in_array($msg->id, $readIdsByUser, true),
                'created_at' => $msg->created_at?->toIso8601String() ?: now()->toIso8601String(),
            ];
        }

        usort($notifications, function (array $a, array $b): int {
            return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
        });

        return response()->json([
            'data' => $notifications,
        ]);
    }

    public function markRead(Request $request, int $notificationId)
    {
        $user = $request->user();
        $memberId = $user?->member_id;
        $userId = $user?->id;

        $realId = null;
        $category = null;
        if ($notificationId >= 2000000) {
            $realId = $notificationId - 2000000;
            $category = 'event_message';
        } elseif ($notificationId >= 1000000) {
            $realId = $notificationId - 1000000;
            $category = 'schedule_pending';
        }

        if ($category === 'event_message' && $userId) {
            EventMessageRead::firstOrCreate([
                'event_message_id' => $realId,
                'user_id' => $userId,
            ], [
                'read_at' => now(),
            ]);
        }

        if ($category === 'schedule_pending') {
            $volunteer = EventVolunteer::find($realId);
            if ($volunteer) {
                $volunteer->response_status = in_array($volunteer->response_status, ['accepted', 'declined', 'rejected'], true)
                    ? $volunteer->response_status
                    : 'read';
                $volunteer->save();
            }
        }

        return response()->json([
            'message' => 'Notifikasi ditandai telah dibaca.',
            'code' => 'success',
        ]);
    }

    public function readAll(Request $request)
    {
        $user = $request->user();
        $memberId = $user?->member_id;
        $userId = $user?->id;

        if ($userId) {
            $unreadMessageIds = EventMessage::latest()
                ->whereNotIn('id', function ($q) use ($userId) {
                    $q->select('event_message_id')
                        ->from((new EventMessageRead)->getTable())
                        ->where('user_id', $userId);
                })
                ->pluck('id')
                ->all();

            $now = now();
            $rows = array_map(fn (int $id): array => [
                'event_message_id' => $id,
                'user_id' => $userId,
                'read_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ], $unreadMessageIds);

            if (count($rows) > 0) {
                foreach (array_chunk($rows, 100) as $chunk) {
                    EventMessageRead::insert($chunk);
                }
            }
        }

        if ($memberId) {
            EventVolunteer::where('member_id', $memberId)
                ->where(function ($q) {
                    $q->whereNull('response_status')->orWhere('response_status', 'pending');
                })
                ->update([
                    'response_status' => 'read',
                    'responded_at' => now(),
                ]);
        }

        return response()->json([
            'message' => 'Semua notifikasi ditandai telah dibaca.',
            'code' => 'success',
        ]);
    }
}
