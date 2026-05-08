<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Middleware untuk memeriksa peran berbasis kategori
// Contoh penggunaan: ->middleware(['category.role:events,event_scheduler'])
class CheckCategoryRole
{
    public function handle(Request $request, Closure $next, string $categoryName, string $allowedRoles): mixed
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $roles = explode(',', $allowedRoles);

        if (!Auth::user()->hasCategoryRole($categoryName, $roles)) {
            abort(403, 'Anda tidak memiliki izin untuk mengakses fitur ini.');
        }

        return $next($request);
    }
}