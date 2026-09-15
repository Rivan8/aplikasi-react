<?php

use App\Models\Event;
use App\Models\EventMessage;
use App\Models\EventVolunteer;
use App\Models\User;
use Illuminate\Support\Str;

function createMobileNotificationFixture(string $memberId): array
{
    $event = Event::create([
        'title' => 'Ibadah Minggu',
        'date' => '2026-09-13',
        'time' => '09:00:00',
        'location' => 'Main Hall',
        'address' => 'Jl. Contoh 1',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 20,
    ]);

    $assignment = EventVolunteer::create([
        'event_id' => $event->id,
        'member_id' => $memberId,
        'role_category' => 'music',
        'role_name' => 'Keyboard',
        'response_status' => 'pending',
    ]);

    $message = EventMessage::create([
        'event_id' => $event->id,
        'title' => 'Persiapan pelayanan',
        'body' => 'Mohon hadir 30 menit lebih awal.',
    ]);

    return [$assignment, $message];
}

it('mobile receives schedule and event message notifications', function () {
    $memberId = 'MEM-'.Str::random(8);
    $token = Str::random(60);
    $user = User::factory()->create([
        'member_id' => $memberId,
        'api_token' => hash('sha256', $token),
    ]);
    [$assignment, $message] = createMobileNotificationFixture($memberId);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/notifications')
        ->assertOk()
        ->assertJsonFragment([
            'id' => 1000000 + $assignment->id,
            'category' => 'schedule_pending',
            'assignment_id' => $assignment->id,
            'event_id' => $assignment->event_id,
            'response_status' => 'pending',
            'is_read' => false,
        ])
        ->assertJsonFragment(['id' => 2000000 + $message->id, 'category' => 'event_message', 'is_read' => false]);
});

it('reading a schedule notification keeps it available as read', function () {
    $memberId = 'MEM-'.Str::random(8);
    $token = Str::random(60);
    User::factory()->create([
        'member_id' => $memberId,
        'api_token' => hash('sha256', $token),
    ]);
    [$assignment] = createMobileNotificationFixture($memberId);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/mobile/v1/me/notifications/'.(1000000 + $assignment->id).'/read')
        ->assertOk();

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/notifications')
        ->assertOk()
        ->assertJsonFragment(['id' => 1000000 + $assignment->id, 'is_read' => true]);
});
