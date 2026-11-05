<?php

namespace App\Notifications;

use App\Models\EventMessage;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EventMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(private readonly EventMessage $eventMessage)
    {
        $this->afterCommit = true;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = [];

        if (is_string($notifiable->email ?? null) && $notifiable->email !== '') {
            $channels[] = 'mail';
        }

        if (is_string($notifiable->expo_push_token ?? null) && $notifiable->expo_push_token !== '') {
            $channels[] = ExpoPushChannel::class;
        }

        return $channels;
    }

    /**
     * @return array<string, mixed>
     */
    public function toExpo(object $notifiable): array
    {
        return [
            'to' => $notifiable->expo_push_token,
            'title' => $this->eventMessage->title,
            'body' => $this->eventMessage->body,
            'sound' => 'default',
            'badge' => 1,
            'channelId' => 'default',
            'data' => [
                'url' => '/messages',
                'category' => 'event_message',
                'event_id' => $this->eventMessage->event_id,
                'message_id' => $this->eventMessage->id,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $event = $this->eventMessage->event;
        $hasAttachment = (bool) $this->eventMessage->attachment_path;

        $data = [
            'name' => $notifiable->name ?? 'Jemaat',
            'eventTitle' => $event?->title ?: 'Event Pelayanan',
            'messageTitle' => $this->eventMessage->title,
            'messageBody' => $this->eventMessage->body ?? '',
            'attachmentName' => $this->eventMessage->attachment_name,
            'hasAttachment' => $hasAttachment,
            'actionUrl' => $event
                ? 'https://pcs.myesc.id/my/events/'.$event->getKey()
                : 'https://pcs.myesc.id/my/events',
        ];

        $mail = (new MailMessage)
            ->subject($this->eventMessage->title)
            ->view('emails.event-message', $data)
            ->text('emails.event-message-text', $data);

        if ($hasAttachment) {
            $mail->attachFromStorageDisk('public', $this->eventMessage->attachment_path, [
                'as' => $this->eventMessage->attachment_name,
                'mime' => $this->eventMessage->attachment_mime,
            ]);
        }

        return $mail;
    }
}
