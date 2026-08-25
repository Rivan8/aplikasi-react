<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;


class SettingsController extends Controller
{
    public function roles()
    {
        return Inertia::render('settings/RoleManagement', [
            'categories' => Category::with('roles')->get(),
            'users' => User::with('categoryRoles.category')->orderBy('name')->get(),
            'roles' => User::ROLES,
        ]);
    }

    public function updateUserRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:'.implode(',', User::ROLES)],
        ]);

        if ($user->is($request->user()) && $validated['role'] !== User::ROLE_SUPER_ADMIN) {
            return back()->withErrors(['role' => 'Anda tidak dapat menurunkan role akun sendiri.']);
        }

        if ($user->isSuperAdmin() && $validated['role'] !== User::ROLE_SUPER_ADMIN
            && User::where('role', User::ROLE_SUPER_ADMIN)->count() <= 1) {
            return back()->withErrors(['role' => 'Minimal harus ada satu super admin.']);
        }

        $user->update(['role' => $validated['role']]);

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

        if (!$exists) {
            DB::table('user_category_roles')->insert([
                'user_id' => $request->user_id,
                'category_role_id' => $request->category_role_id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return back()->with('success', 'Peran berhasil ditambahkan.');
    }
}
