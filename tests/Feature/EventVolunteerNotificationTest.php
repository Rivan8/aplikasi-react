<?php

use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;
use App\Notifications\EventMessageNotification;
use App\Notifications\VolunteerScheduledNotification;
use App\Services\MemberApiService;
use Illuminate\Support\Facades\Notification;

it('sends a schedule notification to an external member without a local account', function () {
    Notification::fake();

    $this->mock(MemberApiService::class, function ($mock): void {
        $mock->shouldReceive('findById')
            ->once()
            ->with('external-member-1')
            ->andReturn(['email' => 'member@example.com']);
    });

    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

    $response = $this->actingAs($admin)->post(route('events.store'), [
        'title' => 'Sunday Service',
        'date' => '2026-10-01',
        'time' => '09:00',
        'location' => 'Main Hall',
        'address' => 'Jl. Contoh 1',
        'category' => 'Worship',
        'attendance_type' => 'volunteer',
        'expected' => 10,
        'volunteers' => json_encode([
            [
                'member_id' => 'external-member-1',
                'role_category' => 'worship',
                'role_name' => 'Vocal',
            ],
        ]),
    ]);

    $response->assertRedirect();
    Notification::assertSentOnDemand(VolunteerScheduledNotification::class);
});

it('notifies assigned users when an event message is created', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $volunteer = User::factory()->create([
        'member_id' => 'message-member-1',
        'expo_push_token' => 'ExponentPushToken[test-token]',
    ]);
    $event = Event::create([
        'title' => 'Sunday Service',
        'date' => '2026-10-01',
        'time' => '09:00',
        'location' => 'Main Hall',
        'address' => 'Jl. Contoh 1',
        'category' => 'Worship',
        'attendance_type' => 'volunteer',
        'expected' => 10,
    ]);
    EventVolunteer::create([
        'event_id' => $event->id,
        'member_id' => $volunteer->member_id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
    ]);

    $this->actingAs($admin)->post(route('event-messages.store'), [
        'event_id' => $event->id,
        'title' => 'Persiapan pelayanan',
        'body' => 'Mohon hadir 30 menit lebih awal.',
    ])->assertRedirect();

    Notification::assertSentTo($volunteer, EventMessageNotification::class);
});
