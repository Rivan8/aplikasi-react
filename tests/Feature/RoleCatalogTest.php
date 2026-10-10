<?php

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    DB::beginTransaction();
});

afterEach(function () {
    DB::rollBack();
});

it('allows admins to view the role catalog without user role administration data', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

    $this->actingAs($admin)
        ->get(route('settings.roles'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/RoleManagement')
            ->where('can_manage_user_roles', false)
            ->where('users', [])
            ->has('role_catalog')
        );
});

it('allows admins to add a department-linked role to the catalog', function () {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $department = Department::create(['name' => 'Role Test '.uniqid()]);
    $roleName = 'Coordinator '.uniqid();

    $this->actingAs($admin)
        ->post(route('settings.roles.store'), [
            'name' => $roleName,
            'department_id' => $department->id,
        ])
        ->assertRedirect();

    $role = Role::where('name', $roleName)->first();

    expect($role)->not->toBeNull()
        ->and($role->department_id)->toBe($department->id)
        ->and($role->system_key)->toBeNull();
});

it('does not allow non-admin users to access or modify the role catalog', function () {
    $user = User::factory()->create(['role' => User::ROLE_USER]);

    $this->actingAs($user)
        ->get(route('settings.roles'))
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('settings.roles.store'), ['name' => 'Unauthorized role'])
        ->assertForbidden();
});

it('assigns a department-linked catalog role and scopes that users scheduling access', function () {
    $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    $user = User::factory()->create(['role' => User::ROLE_USER]);
    $department = Department::create(['name' => 'Assigned Role Dept '.uniqid()]);
    $otherDepartment = Department::create(['name' => 'Other Role Dept '.uniqid()]);
    $role = Role::create([
        'name' => 'Scheduler '.uniqid(),
        'department_id' => $department->id,
    ]);
    $user->schedulingDepartments()->attach($otherDepartment->id);

    $this->actingAs($superAdmin)
        ->patch(route('settings.users.role', $user), ['role_id' => $role->id])
        ->assertRedirect();

    expect($user->fresh()->role)->toBe(User::ROLE_USER)
        ->and($user->fresh()->role_id)->toBe($role->id)
        ->and($user->fresh()->schedulingDepartments->modelKeys())->toBe([$department->id]);
});

it('rejects assigning an unlinked custom role to a user', function () {
    $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    $user = User::factory()->create(['role' => User::ROLE_USER]);
    $role = Role::create(['name' => 'Unlinked '.uniqid()]);

    $this->actingAs($superAdmin)
        ->patch(route('settings.users.role', $user), ['role_id' => $role->id])
        ->assertSessionHasErrors('role');

    expect($user->fresh()->schedulingDepartments)->toBeEmpty();
});
