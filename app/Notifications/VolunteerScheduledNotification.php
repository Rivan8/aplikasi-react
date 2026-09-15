<?php

namespace App\Notifications;

use App\Models\Event;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VolunteerScheduledNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public function __construct(
        private readonly Event $event,
        private readonly string $roleName,
        private readonly int $assignmentId,
    ) {
        $this->afterCommit = true;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable instanceof \App\Models\User
            ? ['mail', ExpoPushChannel::class]
            : ['mail'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toExpo(object $notifiable): array
    {
        return [
            'to' => $notifiable->expo_push_token,
            'title' => 'Penjadwalan baru',
            'body' => 'Anda menerima penjadwalan baru.',
            'sound' => 'default',
            'channelId' => 'default',
            'badge' => 1,
            'data' => [
                'notificationId' => (string) (1000000 + $this->assignmentId),
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Jadwal pelayanan baru untuk Anda')
            ->greeting('Halo '.($notifiable->name ?? 'Jemaat').',')
            ->line('Anda mendapatkan jadwal pelayanan baru. Berikut detailnya:')
            ->line('**'.$this->event->title.'**')
            ->line('**Peran:** '.$this->roleName)
            ->line('**Tanggal:** '.date('d-m-Y', strtotime((string) $this->event->date)))
            ->line('**Waktu:** '.date('H:i', strtotime((string) $this->event->time)))
            ->line('**Lokasi:** '.$this->event->location)
            ->action('Lihat jadwal', 'https://pcs.myesc.id')
            ->line('Silakan buka jadwal Anda untuk menerima atau menolak penugasan ini.')
            ->salutation('Salam, PCS MYESC');
    }
}
