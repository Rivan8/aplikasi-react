<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;


class SettingsController extends Controller
{
    public function roles()
    {
        return Inertia::render('Settings/RoleManagement', [
            'categories' => Category::with('roles')->get(),
            'users' => User::with('member_detail.categoryRoles')->get(),
        ]);
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