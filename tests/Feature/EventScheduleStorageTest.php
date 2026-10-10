<?php

use App\Models\Event;
use App\Models\EventRundownSegment;
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

it('allows admins to edit, add, and remove event rundown segments and items', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $event = Event::create([
        'title' => 'Event Uji Rundown',
        'date' => '2026-09-01',
        'time' => '08:00',
        'location' => 'Gereja ESC',
        'address' => 'Jl. Merdeka 1',
        'category' => 'Worship',
        'expected' => 25,
    ]);
    $segment = $event->rundownSegments()->create([
        'title' => 'Pembukaan',
        'duration_seconds' => 60,
        'sort_order' => 0,
    ]);
    $segment->items()->create([
        'title' => 'Doa',
        'duration_seconds' => 60,
        'sort_order' => 0,
    ]);

    $this->actingAs($admin)->put(route('events.update', $event), [
        'title' => $event->title,
        'date' => '2026-09-01',
        'time' => '08:00',
        'location' => 'Gereja ESC',
        'address' => 'Jl. Merdeka 1',
        'category' => 'Worship',
        'expected' => 25,
        'rundown_segments' => json_encode([
            [
                'title' => 'Pujian',
                'duration_seconds' => 120,
                'items' => [
                    [
                        'title' => 'Lagu pembuka',
                        'duration_seconds' => 120,
                    ],
                ],
            ],
            [
                'title' => 'Firman',
                'duration_seconds' => 300,
                'items' => [],
            ],
        ]),
    ])->assertRedirect();

    $segments = $event->rundownSegments()->with('items')->orderBy('sort_order')->get();

    expect($segments)->toHaveCount(2);
    expect($segments[0]->title)->toBe('Pujian');
    expect($segments[0]->items)->toHaveCount(1);
    expect($segments[0]->items[0]->title)->toBe('Lagu pembuka');
    expect($segments[1]->title)->toBe('Firman');

    $this->actingAs($admin)->put(route('events.update', $event), [
        'title' => $event->title,
        'date' => '2026-09-01',
        'time' => '08:00',
        'location' => 'Gereja ESC',
        'address' => 'Jl. Merdeka 1',
        'category' => 'Worship',
        'expected' => 25,
        'rundown_segments' => json_encode([]),
    ])->assertRedirect();

    expect(EventRundownSegment::where('event_id', $event->id)->count())->toBe(0);
});
