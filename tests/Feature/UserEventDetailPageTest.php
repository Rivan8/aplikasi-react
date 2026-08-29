<?php

use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows a user event detail page with worship and schedule data from the event', function () {
    $user = User::factory()->create([
        'member_id' => 'MEM-USER-DETAIL',
        'role' => 'user',
    ]);

    $event = Event::create([
        'title' => 'Ibadah Minggu',
        'date' => '2026-10-05',
        'time' => '08:30:00',
        'location' => 'Gereja Pusat',
        'address' => 'Jl. Mawar 12',
        'category' => 'Worship',
        'attendance_type' => 'volunteer',
        'expected' => 120,
        'training_schedules' => [
            ['title' => 'Latihan Paduan Suara', 'date' => '2026-10-03', 'start_time' => '18:00', 'end_time' => '20:00'],
        ],
        'other_schedules' => [
            ['title' => 'Persiapan Acara', 'date' => '2026-10-04', 'start_time' => '09:00', 'end_time' => '11:00'],
        ],
    ]);

    EventVolunteer::create([
        'event_id' => $event->id,
        'member_id' => $user->member_id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
        'response_status' => 'accepted',
    ]);

    $this->actingAs($user)
        ->get(route('my.events.show', $event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('my/events/show')
            ->where('event.title', 'Ibadah Minggu')
            ->where('eventData.worship.start_time', '08:30:00')
            ->where('eventData.training.0.title', 'Latihan Paduan Suara')
            ->where('eventData.other.0.title', 'Persiapan Acara')
        );
});
