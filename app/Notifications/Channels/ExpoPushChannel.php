<?php

namespace App\Notifications\Channels;

use App\Jobs\CheckExpoPushReceipt;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushChannel
{
    private const SEND_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function send(object $notifiable, Notification $notification): void
    {
        $token = $notifiable->expo_push_token;

        if (! is_string($token) || $token === '') {
            return;
        }

        $message = $notification->toExpo($notifiable);

        $response = Http::acceptJson()
            ->asJson()
            ->post(self::SEND_ENDPOINT, $message);

        if ($response->failed()) {
            Log::error('Expo Push API request failed.', [
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
            $response->throw();
        }

        $ticket = $response->json('data.0');
        if (! is_array($ticket) || ($ticket['status'] ?? null) !== 'ok' || empty($ticket['id'])) {
            $this->handleExpoError($ticket, $notifiable, $token);

            return;
        }

        Log::info('Expo push ticket received.', [
            'ticket_id' => $ticket['id'],
            'user_id' => $notifiable instanceof User ? $notifiable->getKey() : null,
        ]);

        if ($notifiable instanceof User) {
            CheckExpoPushReceipt::dispatch(
                (string) $ticket['id'],
                (int) $notifiable->getKey(),
                $token,
            )->delay(now()->addSeconds(5));
        }
    }

    private function handleExpoError(?array $ticket, object $notifiable, string $token): void
    {
        $details = $ticket['details'] ?? [];
        $error = is_array($details) ? ($details['error'] ?? null) : null;

        Log::error('Expo Push API rejected notification.', [
            'error' => $error,
            'message' => $ticket['message'] ?? null,
            'user_id' => $notifiable instanceof User ? $notifiable->getKey() : null,
        ]);

        if ($error === 'DeviceNotRegistered' && $notifiable instanceof User) {
            $notifiable->newQuery()
                ->whereKey($notifiable->getKey())
                ->where('expo_push_token', $token)
                ->update(['expo_push_token' => null]);
        }
    }
}
