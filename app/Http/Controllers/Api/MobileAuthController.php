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

    public function registerPushToken(Request $request)
    {
        $tokenType = $request->input('token_type');

        if (! $tokenType) {
            $tokenType = $request->filled('fcm_token') && ! $request->filled('expo_push_token')
                ? 'fcm'
                : 'expo';
        }

        $request->merge([
            'token' => $request->input('token') ?? ($tokenType === 'fcm'
                ? $request->input('fcm_token')
                : $request->input('expo_push_token')),
            'token_type' => $tokenType,
        ]);

        $validated = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'token_type' => ['nullable', 'string', 'in:expo,fcm'],
            'expo_push_token' => ['nullable', 'string', 'max:512'],
            'fcm_token' => ['nullable', 'string', 'max:512'],
        ]);

        $tokenType = $validated['token_type'] ?? 'expo';

        if ($tokenType === 'expo' && ! preg_match('/^(?:Expo|Exponent)PushToken\[[^\]]+\]$/', $validated['token'])) {
            return response()->json([
                'message' => 'Format Expo push token tidak valid.',
                'code' => 'validation_error',
                'errors' => ['token' => ['Gunakan format ExpoPushToken[...] atau ExponentPushToken[...].']],
            ], 422);
        }

        $request->user()->update([
            $tokenType === 'fcm' ? 'fcm_token' : 'expo_push_token' => $validated['token'],
        ]);

        return response()->json([
            'message' => 'Token push berhasil disimpan.',
            'code' => 'success',
            'data' => [
                'token_type' => $tokenType,
                'registered' => true,
            ],
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
