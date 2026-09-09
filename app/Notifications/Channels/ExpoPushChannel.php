<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class ExpoPushChannel
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    public function send(object $notifiable, Notification $notification): void
    {
        $token = $notifiable->expo_push_token;

        if (! is_string($token) || $token === '') {
            return;
        }

        $message = $notification->toExpo($notifiable);

        Http::acceptJson()
            ->asJson()
            ->post(self::ENDPOINT, $message)
            ->throw();
    }
}
