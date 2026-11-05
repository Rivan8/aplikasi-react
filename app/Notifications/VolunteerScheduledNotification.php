<?php

namespace App\Notifications;

use App\Models\Event;
use App\Models\User;
use App\Notifications\Channels\ExpoPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;

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
        return $notifiable instanceof User
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
        $eventDate = $this->event->date
            ? Carbon::parse($this->event->date)->locale('id')->translatedFormat('l, j F Y')
            : '-';
        $eventTime = $this->event->time
            ? date('H:i', strtotime((string) $this->event->time))
            : '-';
        $attendanceTime = $this->event->attendance_start_time
            ? date('H:i', strtotime((string) $this->event->attendance_start_time))
            : $eventTime;

        $data = [
            'name' => $notifiable->name ?? 'Jemaat',
            'eventTitle' => $this->event->title ?: 'Event Pelayanan',
            'roleName' => $this->roleName,
            'eventDate' => $eventDate,
            'eventTime' => $eventTime,
            'attendanceTime' => $attendanceTime,
            'eventLocation' => $this->event->location ?: '-',
            'actionUrl' => 'https://pcs.myesc.id/my/events/'.$this->event->getKey(),
        ];

        return (new MailMessage)
            ->subject('Jadwal Pelayanan Baru: '.($this->event->title ?: 'Event Pelayanan'))
            ->view('emails.volunteer-scheduled', $data)
            ->text('emails.volunteer-scheduled-text', $data);
    }
}
