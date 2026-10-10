<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function roles()
    {
        $canManageUserRoles = request()->user()->isSuperAdmin();
        $roleCatalog = Role::with('department')->orderBy('name')->get();
        $users = $canManageUserRoles
            ? User::with(['categoryRoles.category', 'schedulingDepartments'])->orderBy('name')->get()
            : collect();

        $users->each(function (User $user) use ($roleCatalog): void {
            $selectedRoleId = $user->role_id;

            if (! $selectedRoleId) {
                $selectedRoleId = $roleCatalog->firstWhere('system_key', $user->role)?->id;
            }

            $user->setAttribute('access_role_id', $selectedRoleId);
        });

        return Inertia::render('settings/RoleManagement', [
            'categories' => $canManageUserRoles ? Category::with('roles.department')->get() : [],
            'departments' => Department::orderBy('name')->get(),
            'users' => $users,
            'role_catalog' => $roleCatalog,
            'can_manage_user_roles' => $canManageUserRoles,
        ]);
    }

    public function storeRole(Request $request)
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        Role::create([
            'name' => trim($validated['name']),
            'department_id' => $validated['department_id'] ?? null,
        ]);

        return back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function updateUserRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);
        $role = Role::findOrFail($validated['role_id']);
        $systemRole = $role->system_key;

        if ($user->is($request->user()) && $systemRole !== User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'Anda tidak dapat menurunkan role akun sendiri.']);
        }

        if ($user->isSuperAdmin() && $systemRole !== User::ROLE_SUPER_ADMIN
            && User::where('role', User::ROLE_SUPER_ADMIN)->count() <= 1) {
            return back()->withErrors(['role' => 'Minimal harus ada satu super admin.']);
        }

        if ($systemRole === null && $role->department_id === null) {
            return back()->withErrors([
                'role' => 'Role kustom harus dikaitkan dengan departemen sebelum diberikan kepada pengguna.',
            ]);
        }

        DB::transaction(function () use ($user, $role, $systemRole): void {
            $user->update([
                'role' => in_array($systemRole, User::ROLES, true)
                    ? $systemRole
                    : User::ROLE_USER,
                'role_id' => $role->id,
            ]);

            $user->schedulingDepartments()->sync(
                $systemRole === null ? [$role->department_id] : [],
            );
        });

        return back()->with('success', 'Role pengguna berhasil diperbarui.');
    }

    public function assignRole(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'category_role_id' => 'required|exists:category_roles,id',
        ]);

        // Cek apakah relasi sudah ada
        $exists = DB::table('user_category_roles')
            ->where('user_id', $request->user_id)
            ->where('category_role_id', $request->category_role_id)
            ->exists();

        if (! $exists) {
            DB::table('user_category_roles')->insert([
                'user_id' => $request->user_id,
                'category_role_id' => $request->category_role_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', 'Peran berhasil ditambahkan.');
    }

    public function assignDepartmentAccess(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', Rule::exists('users', 'id')->where('role', User::ROLE_USER)],
            'department_id' => 'required|exists:departments,id',
        ]);

        $user = User::findOrFail($validated['user_id']);
        $user->schedulingDepartments()->syncWithoutDetaching([$validated['department_id']]);

        return back()->with('success', 'Hak penjadwalan departemen berhasil diberikan.');
    }

    public function removeDepartmentAccess(User $user, Department $department)
    {
        $user->schedulingDepartments()->detach($department->id);

        return back()->with('success', 'Hak penjadwalan departemen berhasil dicabut.');
    }
}
