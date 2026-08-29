<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMobileApi
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'message' => 'Token tidak ditemukan.',
                'code' => 'unauthenticated',
            ], 401);
        }

        $token = trim(substr($header, strlen('Bearer ')));

        if ($token === '') {
            return response()->json([
                'message' => 'Token tidak valid.',
                'code' => 'unauthenticated',
            ], 401);
        }

        $user = $this->findUserByToken($token);

        if (! $user) {
            return response()->json([
                'message' => 'Token tidak valid atau sudah expired.',
                'code' => 'unauthenticated',
            ], 401);
        }

        Auth::setUser($user);
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }

    private function findUserByToken(string $token): ?User
    {
        $query = User::query();

        if (\Schema::hasColumn('users', 'api_token')) {
            $query->orWhere('api_token', hash('sha256', $token));
            $query->orWhere('api_token', $token);
        }

        $query->orWhere('remember_token', $token);

        $user = $query->first();

        if (! $user && \Schema::hasColumn('users', 'api_token')) {
            $user = User::where('api_token', hash('sha256', $token))
                ->orWhere('api_token', $token)
                ->first();
        }

        return $user;
    }
}
