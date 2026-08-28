<?php

namespace App\Http\Middleware;

use App\Models\EventMessage;
use App\Models\EventVolunteer;
use App\Services\MemberApiService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $avatar = null;
        $pendingAssignments = 0;
        $unreadMessages = 0;

        if ($user && ! $user->isAdmin() && $user->member_id) {
            $member = app(MemberApiService::class)->findById($user->member_id);
            $avatar = $member['foto_url'] ?? null;

            $viewedAssignmentIds = collect($request->session()->get('viewed_user_assignment_ids', []))
                ->map(fn ($id) => (int) $id)
                ->filter()
                ->values();

            $pendingAssignmentsQuery = EventVolunteer::where('member_id', $user->member_id)
                ->where('response_status', 'pending')
                ->whereHas('event', fn ($query) => $query->whereDate('date', '>=', now()->toDateString()));

            if ($viewedAssignmentIds->isNotEmpty()) {
                $pendingAssignmentsQuery->whereNotIn('id', $viewedAssignmentIds);
            }

            $pendingAssignments = $pendingAssignmentsQuery->count();

            $assignedEventIds = EventVolunteer::where('member_id', $user->member_id)
                ->pluck('event_id');

            $unreadMessages = EventMessage::whereIn('event_id', $assignedEventIds)
                ->whereDoesntHave('reads', fn ($query) => $query->where('user_id', $user->id))
                ->count();
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user?->setAttribute('avatar', $avatar),
            ],
            'notifications' => [
                'pending_assignments' => $pendingAssignments,
                'unread_messages' => $unreadMessages,
                'total' => $pendingAssignments + $unreadMessages,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
