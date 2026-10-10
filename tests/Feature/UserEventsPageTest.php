<?php

use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows only events assigned to the logged-in user on the user events page', function () {
    $user = User::factory()->create([
        'member_id' => 'MEM-USER-1',
        'role' => 'user',
    ]);

    $assignedEvent = Event::create([
        'title' => 'Assigned Event',
        'date' => '2026-10-01',
        'time' => '09:00:00',
        'location' => 'Hall A',
        'address' => 'Jl. Contoh 1',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 10,
    ]);

    $unassignedEvent = Event::create([
        'title' => 'Unassigned Event',
        'date' => '2026-10-02',
        'time' => '10:00:00',
        'location' => 'Hall B',
        'address' => 'Jl. Contoh 2',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 10,
    ]);

    EventVolunteer::create([
        'event_id' => $assignedEvent->id,
        'member_id' => $user->member_id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
        'response_status' => 'pending',
    ]);

    $response = $this->actingAs($user)->get(route('my.events'));

    $response->assertOk();
    $response->assertSee('Assigned Event');
    $response->assertDontSee('Unassigned Event');
    $response->assertInertia(fn (Assert $page) => $page
        ->component('my/events/index')
        ->where('events.0.my_volunteer_assignments.0.role_name', 'Vocal')
        ->where('events.0.my_volunteer_assignments.0.role_category', 'worship')
        ->where('events.0.my_volunteer_assignments.0.response_status', 'pending')
    );
});
