<?php

use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;

it('hides events older than 12 hours from the dashboard upcoming list', function () {
    $user = User::factory()->create([
        'member_id' => 'MEM-DASH-1',
        'role' => 'user',
    ]);

    $upcoming = Event::create([
        'title' => 'Upcoming Event',
        'date' => now()->addDay()->toDateString(),
        'time' => '09:00:00',
        'location' => 'Hall A',
        'address' => 'Jl. Contoh 1',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 10,
    ]);

    $expired = Event::create([
        'title' => 'Expired Event',
        'date' => now()->subDay()->toDateString(),
        'time' => '08:00:00',
        'location' => 'Hall B',
        'address' => 'Jl. Contoh 2',
        'category' => 'Volunteer',
        'attendance_type' => 'volunteer',
        'expected' => 10,
    ]);

    EventVolunteer::create([
        'event_id' => $upcoming->id,
        'member_id' => $user->member_id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
        'response_status' => 'pending',
    ]);

    EventVolunteer::create([
        'event_id' => $expired->id,
        'member_id' => $user->member_id,
        'role_category' => 'worship',
        'role_name' => 'Vocal',
        'response_status' => 'pending',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertOk();
    $response->assertSee('Upcoming Event');
    $response->assertDontSee('Expired Event');
});
