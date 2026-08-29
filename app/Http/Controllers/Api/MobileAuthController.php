<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class MobileAuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $login = trim($validated['login']);
        $password = $validated['password'];

        $user = User::where('email', $login)
            ->orWhere('phone', $login)
            ->orWhere('member_id', $login)
            ->first();

        if (! $user || ! Hash::check($password, $user->password ?? '')) {
            return response()->json([
                'message' => 'Email atau password salah.',
                'code' => 'validation_error',
                'errors' => [
                    'login' => ['Kredensial tidak valid'],
                ],
            ], 422);
        }

        $plainToken = Str::random(60);

        $hasApiTokenColumn = \Schema::hasColumn('users', 'api_token');

        if ($hasApiTokenColumn) {
            $user->api_token = hash('sha256', $plainToken);
            $user->save();
        } else {
            $user->forceFill([
                'remember_token' => $plainToken,
            ])->save();
        }

        $role = $user->role;
        $publicRole = in_array($role, ['superadmin', 'admin', 'user'], true)
            ? ($role === 'superadmin' || $role === 'admin' ? 'admin' : 'jemaat')
            : ($role ?: 'jemaat');

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'member_id' => $user->member_id,
                    'role' => $publicRole,
                    'avatar' => null,
                ],
                'token' => $plainToken,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            if (\Schema::hasColumn('users', 'api_token')) {
                $user->api_token = null;
                $user->save();
            } else {
                $user->forceFill(['remember_token' => null])->save();
            }
        }

        return response()->json([
            'message' => 'Logout berhasil.',
            'code' => 'success',
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        $role = $user->role;
        $publicRole = in_array($role, ['superadmin', 'admin', 'user'], true)
            ? ($role === 'superadmin' || $role === 'admin' ? 'admin' : 'jemaat')
            : ($role ?: 'jemaat');

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'member_id' => $user->member_id,
                'role' => $publicRole,
                'avatar' => null,
            ],
        ]);
    }
}
