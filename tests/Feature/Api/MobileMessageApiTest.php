<?php

use App\Models\Event;
use App\Models\EventMessage;
use App\Models\EventVolunteer;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

function createMobileMessageFixture(string $memberId): array
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

    EventVolunteer::create([
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

    return [$event, $message];
}

it('mobile login returns a bearer token that can read assigned event messages', function () {
    $memberId = 'MEM-'.Str::random(8);
    $email = 'mobile-message-'.Str::uuid().'@example.com';
    $user = User::factory()->create([
        'email' => $email,
        'password' => Hash::make('secret-password'),
        'member_id' => $memberId,
        'role' => 'user',
    ]);
    [, $message] = createMobileMessageFixture($memberId);

    $login = $this->postJson('/api/mobile/v1/auth/login', [
        'login' => $email,
        'password' => 'secret-password',
    ])->assertOk();

    $token = $login->json('data.token');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/messages')
        ->assertOk()
        ->assertJsonPath('data.0.id', $message->id)
        ->assertJsonPath('data.0.body', 'Mohon hadir 30 menit lebih awal.')
        ->assertJsonPath('data.0.is_read', false);
});

it('mobile messages do not expose events assigned to another member', function () {
    $token = Str::random(60);
    User::factory()->create([
        'member_id' => 'MEM-OWN',
        'api_token' => hash('sha256', $token),
    ]);
    [, $message] = createMobileMessageFixture('MEM-OTHER');

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/messages')
        ->assertOk()
        ->assertJsonPath('data', []);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/messages/'.$message->id)
        ->assertForbidden();
});

it('mobile can mark an assigned message as read', function () {
    $memberId = 'MEM-READ';
    $token = Str::random(60);
    User::factory()->create([
        'member_id' => $memberId,
        'api_token' => hash('sha256', $token),
    ]);
    [, $message] = createMobileMessageFixture($memberId);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/mobile/v1/me/messages/'.$message->id.'/read')
        ->assertOk();

    $this->assertDatabaseHas('event_message_reads', [
        'event_message_id' => $message->id,
    ]);
});
