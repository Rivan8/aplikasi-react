<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Category;

class CheckEventCategoryAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Get the event from the route parameters
        $event = $request->route('event');

        // If it's a store request, get category from the input
        $category = $request->input('category') ?? ($event ? $event->category : null);

        // Skip if no category is set
        if (!$category) {
            return $next($request);
        }

        // Check if the user has access to this category
        $user = Auth::user();
        $allowedCategories = $user->allowedCategories()->pluck('id')->toArray();

        if (!in_array($category, $allowedCategories)) {
            return redirect()->route('dashboard')->with('error', 'Anda tidak memiliki akses ke kategori event ini.');
        }

        return $next($request);
    }
}
