<?php

use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\User;
use App\Services\MemberApiService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    DB::beginTransaction();
});

afterEach(function () {
    DB::rollBack();
});

it('shows events and category positions on the dedicated scheduling page', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $category = Category::create(['name' => 'Scheduling Test '.uniqid()]);
    $department = Department::create(['name' => 'Scheduling Dept '.uniqid()]);
    CategoryRole::create([
        'category_id' => $category->id,
        'department_id' => $department->id,
        'role_name' => 'Vocal',
    ]);
    $event = Event::create([
        'title' => 'Scheduling Page Event',
        'date' => '2026-10-12',
        'time' => '09:00',
        'location' => 'Main Hall',
        'address' => 'Test Address',
        'category' => $category->name,
        'expected' => 10,
    ]);

    $this->mock(MemberApiService::class, function ($mock): void {
        $mock->shouldReceive('listAll')
            ->once()
            ->andReturn([
                [
                    'idjemaat' => 'scheduling-member-1',
                    'namalengkap' => 'Member Scheduling Test',
                    'email' => 'member@example.com',
                ],
            ]);
    });

    $this->actingAs($admin)
        ->get(route('event-scheduling.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('event-scheduling/index')
            ->where('can_manage_events', true)
            ->where('events', fn ($events) => collect($events)->contains(
                fn (array $eventData) => (int) $eventData['id'] === $event->id
                    && $eventData['volunteers'] === [],
            ))
            ->where('categories', fn ($items) => collect($items)->contains(
                fn (array $categoryData) => $categoryData['name'] === $category->name
                    && collect($categoryData['roles'])->contains('role_name', 'Vocal'),
            ))
            ->where('external_members.0.idjemaat', 'scheduling-member-1')
        );
});

it('allows an admin to save event assignments from the dedicated scheduler', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $category = Category::create(['name' => 'Scheduling Save '.uniqid()]);
    $department = Department::create(['name' => 'Scheduling Save Dept '.uniqid()]);
    CategoryRole::create([
        'category_id' => $category->id,
        'department_id' => $department->id,
        'role_name' => 'Worship Leader',
    ]);
    $event = Event::create([
        'title' => 'Scheduling Save Event',
        'date' => '2026-10-12',
        'time' => '09:00',
        'location' => 'Main Hall',
        'address' => 'Test Address',
        'category' => $category->name,
        'expected' => 10,
    ]);

    $this->mock(MemberApiService::class, function ($mock): void {
        $mock->shouldReceive('findById')
            ->once()
            ->with('scheduling-member-2')
            ->andReturn(['email' => null]);
    });

    $this->actingAs($admin)
        ->post(route('events.volunteers.update', $event), [
            'volunteers' => json_encode([
                [
                    'member_id' => 'scheduling-member-2',
                    'role_category' => $department->name,
                    'role_name' => 'Worship Leader',
                ],
            ]),
        ])
        ->assertRedirect();

    expect(EventVolunteer::where('event_id', $event->id)
        ->where('member_id', 'scheduling-member-2')
        ->where('role_name', 'Worship Leader')
        ->exists())->toBeTrue();
});
