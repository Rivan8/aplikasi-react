<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$allowedRoles): mixed
    {
        $user = $request->user();

        abort_unless($user && in_array($user->role, $allowedRoles, true), 403);

        return $next($request);
    }
}
