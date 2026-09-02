<?php

use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;
use Illuminate\Support\Str;

it('mobile user receives volunteer role assignment details in schedule list', function () {
    $token = 'mobile-token-list-'.Str::uuid()->toString();

    $user = User::factory()->create([
        'member_id' => 'MEM-3003',
        'role' => 'user',
        'api_token' => hash('sha256', $token),
    ]);

    $event = Event::create([
        'title' => 'Jadwal Paduan Suara',
        'date' => '2026-09-12',
        'time' => '18:30:00',
        'location' => 'Studio Musik',
        'address' => 'Jl. Contoh 3',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 18,
    ]);

    EventVolunteer::create([
        'event_id' => $event->id,
        'role_category' => 'music',
        'role_name' => 'Keyboard',
        'member_id' => $user->member_id,
        'response_status' => 'pending',
    ]);

    $this->withHeader('Authorization', 'Bearer '.$token)
        ->getJson('/api/mobile/v1/me/schedules')
        ->assertOk()
        ->assertJsonPath('data.0.role_name', 'Keyboard')
        ->assertJsonPath('data.0.role_category', 'music');
});

it('mobile user can accept a schedule assignment', function () {
    $token = 'mobile-token-accept-'.Str::uuid()->toString();

    $user = User::factory()->create([
        'member_id' => 'MEM-1001',
        'role' => 'user',
        'api_token' => hash('sha256', $token),
    ]);

    $event = Event::create([
        'title' => 'Jadwal Ujian',
        'date' => '2026-09-10',
        'time' => '09:00:00',
        'location' => 'Ruang 1',
        'address' => 'Jl. Contoh 1',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 20,
    ]);

    $assignment = EventVolunteer::create([
        'event_id' => $event->id,
        'role_category' => 'music',
        'role_name' => 'Keyboard',
        'member_id' => $user->member_id,
        'response_status' => 'pending',
    ]);

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/mobile/v1/me/schedules/'.$assignment->id.'/accept');

    $response->assertOk()
        ->assertJsonPath('data.response_status', 'accepted')
        ->assertJsonPath('data.assignment_id', $assignment->id);

    $this->assertDatabaseHas('event_volunteers', [
        'id' => $assignment->id,
        'response_status' => 'accepted',
    ]);
});

it('mobile user can decline a schedule assignment with a reason', function () {
    $token = 'mobile-token-decline-'.Str::uuid()->toString();

    $user = User::factory()->create([
        'member_id' => 'MEM-2002',
        'role' => 'user',
        'api_token' => hash('sha256', $token),
    ]);

    $event = Event::create([
        'title' => 'Jadwal Pelayanan',
        'date' => '2026-09-11',
        'time' => '08:30:00',
        'location' => 'Ruang 2',
        'address' => 'Jl. Contoh 2',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 15,
    ]);

    $assignment = EventVolunteer::create([
        'event_id' => $event->id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
        'member_id' => $user->member_id,
        'response_status' => 'pending',
    ]);

    $response = $this->withHeader('Authorization', 'Bearer '.$token)
        ->postJson('/api/mobile/v1/me/schedules/'.$assignment->id.'/decline', [
            'reason' => 'Saya sedang sakit dan tidak bisa hadir.',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.response_status', 'declined')
        ->assertJsonPath('data.assignment_id', $assignment->id)
        ->assertJsonPath('data.response_reason', 'Saya sedang sakit dan tidak bisa hadir.');

    $this->assertDatabaseHas('event_volunteers', [
        'id' => $assignment->id,
        'response_status' => 'declined',
        'response_reason' => 'Saya sedang sakit dan tidak bisa hadir.',
    ]);
});
