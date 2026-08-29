<?php

use App\Models\Event;
use App\Models\User;

it('includes training and other schedules in the mobile event payload', function () {
    $user = User::factory()->create([
        'role' => 'user',
        'member_id' => 'MEM-MOBILE-API',
        'api_token' => hash('sha256', 'mobile-token-123'),
    ]);

    $event = Event::create([
        'title' => 'Ibadah Minggu Mobile',
        'date' => '2026-10-11',
        'time' => '08:30:00',
        'location' => 'Gereja Pusat',
        'address' => 'Jl. Mawar 12',
        'category' => 'Worship',
        'attendance_type' => 'volunteer',
        'expected' => 150,
        'training_schedules' => [
            ['title' => 'Latihan Paduan Suara', 'date' => '2026-10-09', 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'other_schedules' => [
            ['title' => 'Persiapan Acara', 'date' => '2026-10-10', 'start_time' => '09:00', 'end_time' => '11:00'],
        ],
    ]);

    $this->withHeader('Authorization', 'Bearer mobile-token-123')
        ->getJson('/api/mobile/v1/events/' . $event->id)
        ->assertOk()
        ->assertJsonPath('data.training_schedules.0.title', 'Latihan Paduan Suara')
        ->assertJsonPath('data.other_schedules.0.title', 'Persiapan Acara');
});
