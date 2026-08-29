<?php

use App\Models\Event;
use App\Models\User;

it('stores training and other schedules in json columns', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this->actingAs($admin)->post('/events', [
        'title' => 'Event Uji Jadwal',
        'date' => '2026-09-01',
        'time' => '08:00',
        'location' => 'Gereja ESC',
        'address' => 'Jl. Merdeka 1',
        'category' => 'Worship',
        'attendance_type' => 'volunteer',
        'expected' => 25,
        'training_schedules' => json_encode([
            [
                'title' => 'Latihan Paduan Suara',
                'date' => '2026-09-01',
                'start_time' => '18:00',
                'end_time' => '20:00',
            ],
        ]),
        'other_schedules' => json_encode([
            [
                'title' => 'Persiapan Acara',
                'date' => '2026-09-03',
                'start_time' => '09:00',
                'end_time' => '11:00',
            ],
        ]),
    ]);

    $response->assertRedirect();

    $event = Event::latest()->first();

    expect($event)->not->toBeNull();
    expect($event->training_schedules)->toMatchArray([
        [
            'date' => '2026-09-01',
            'title' => 'Latihan Paduan Suara',
            'start_time' => '18:00',
            'end_time' => '20:00',
        ],
    ]);
    expect($event->other_schedules)->toMatchArray([
        [
            'date' => '2026-09-03',
            'title' => 'Persiapan Acara',
            'start_time' => '09:00',
            'end_time' => '11:00',
        ],
    ]);
});
