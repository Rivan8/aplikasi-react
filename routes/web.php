<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventMessageController;
use App\Http\Controllers\LiveEventController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SongController;
use App\Models\Attendance;
use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventMessage;
use App\Models\EventMessageRead;
use App\Models\EventVolunteer;
use App\Models\MemberDetail;
use App\Models\MemberStatus;
use App\Services\MemberApiService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        $today = now();
        $user = $request->user();
        $memberApi = app(MemberApiService::class);
        $upcomingEventsQuery = Event::with([
            'rundownSegments' => function ($query) {
                $query->orderBy('sort_order');
            },
            'rundownSegments.items' => function ($query) {
                $query->orderBy('sort_order');
            },
            'rundownSegments.items.song.arrangements',
            'rundownSegments.items.arrangement',
            'volunteers',
            'attendances',
        ])
            ->where(function ($query) use ($today) {
                $query->whereDate('date', '>', $today->toDateString())
                    ->orWhere(function ($dateQuery) use ($today) {
                        $dateQuery->whereDate('date', '=', $today->toDateString())
                            ->whereRaw("TIMESTAMP(date, time) >= DATE_SUB(NOW(), INTERVAL 12 HOUR)");
                    });
            });

        if (! $user->isAdmin()) {
            if ($user->member_id) {
                $upcomingEventsQuery->whereHas('volunteers', fn ($query) => $query->where('member_id', $user->member_id));
            } else {
                $upcomingEventsQuery->whereKey(0);
            }
        }

        $upcomingEvents = $upcomingEventsQuery
            ->orderBy('date')
            ->orderBy('time')
            ->take(3)
            ->get();

        $categoryRoleCounts = Category::withCount('roles')
            ->whereIn('name', $upcomingEvents->pluck('category')->filter()->unique())
            ->pluck('roles_count', 'name');

        $recentAttendances = Attendance::with('event')
            ->orderBy('scan_time', 'desc')
            ->take(4)
            ->get();

        $memberIds = $recentAttendances->pluck('member_id')->unique()->values()->all();
        $members = [];

        if (! empty($memberIds)) {
            try {
                $members = collect($memberApi->findMany($memberIds))
                    ->mapWithKeys(fn ($member) => [
                        $member['idjemaat'] => ['name' => $member['name']],
                    ])->all();
            } catch (Exception $e) {
                $members = [];
            }
        }

        $templateRoleTotals = CategoryRole::with('department')
            ->get()
            ->groupBy(fn ($role) => $role->department?->name ?? 'Lainnya')
            ->map(fn ($roles) => $roles->count());

        $assignedRoleTotals = EventVolunteer::whereHas('event', fn ($query) => $query->whereDate('date', '>=', $today->toDateString()))
            ->get()
            ->groupBy('role_category')
            ->map(fn ($roles) => $roles->count());

        $readinessItems = $templateRoleTotals
            ->map(function ($total, $department) use ($assignedRoleTotals) {
                $filled = (int) ($assignedRoleTotals[$department] ?? 0);

                return [
                    'label' => $department,
                    'filled' => $filled,
                    'total' => max((int) $total, $filled, 1),
                ];
            })
            ->values()
            ->take(4);

        $todayExpected = (int) Event::whereDate('date', $today->toDateString())->sum('expected');
        $todayCheckIns = Attendance::whereDate('scan_time', $today->toDateString())->count();
        $volunteerScheduled = EventVolunteer::whereHas('event', fn ($query) => $query->whereDate('date', '>=', $today->toDateString()))->count();
        $openRoles = $upcomingEvents->sum(fn ($event) => max((int) ($categoryRoleCounts[$event->category] ?? 0) - (int) $event->volunteers_count, 0));

        $adminAssignments = collect();
        if ($user->isAdmin()) {
            $allAssignments = EventVolunteer::with('event')
                ->whereHas('event', fn ($query) => $query->whereDate('date', '>=', $today->toDateString()))
                ->orderBy(
                    Event::select('date')
                        ->whereColumn('events.id', 'event_volunteers.event_id')
                        ->limit(1)
                )
                ->get();

            $assignmentMembers = $memberApi->findMany($allAssignments->pluck('member_id'));
            $adminAssignments = $allAssignments->map(fn ($assignment) => [
                'id' => $assignment->id,
                'role_category' => $assignment->role_category,
                'role_name' => $assignment->role_name,
                'response_status' => $assignment->response_status ?? 'pending',
                'response_reason' => $assignment->response_reason,
                'member_id' => $assignment->member_id,
                'member_name' => $assignmentMembers[$assignment->member_id]['name'] ?? 'Member #'.$assignment->member_id,
                'event' => [
                    'id' => $assignment->event?->id,
                    'title' => $assignment->event?->title ?? 'Event Dihapus',
                    'date' => $assignment->event?->date,
                ],
            ]);
        }

        $userAssignments = collect();
        $userMessages = collect();

        if ($user?->member_id) {
            $assignments = EventVolunteer::with('event')
                ->where('member_id', $user->member_id)
                ->whereHas('event', fn ($query) => $query->whereDate('date', '>=', $today->toDateString()))
                ->orderBy(
                    Event::select('date')
                        ->whereColumn('events.id', 'event_volunteers.event_id')
                        ->limit(1)
                )
                ->get();

            $teamVolunteers = EventVolunteer::with('event')
                ->whereIn('event_id', $assignments->pluck('event_id')->unique())
                ->orderBy('role_category')
                ->orderBy('role_name')
                ->get()
                ->groupBy('event_id');

            $teamMemberIds = $teamVolunteers
                ->flatten()
                ->pluck('member_id')
                ->unique()
                ->values()
                ->all();

            $teamMembers = [];

            if (! empty($teamMemberIds)) {
                $teamMembers = collect($memberApi->findMany($teamMemberIds))
                    ->mapWithKeys(fn ($member) => [
                        $member['idjemaat'] => ['name' => $member['name']],
                    ])->all();
            }

            $userAssignments = $assignments->map(fn ($assignment) => [
                'id' => $assignment->id,
                'role_category' => $assignment->role_category,
                'role_name' => $assignment->role_name,
                'response_status' => $assignment->response_status ?? 'pending',
                'response_reason' => $assignment->response_reason,
                'event' => [
                    'id' => $assignment->event?->id,
                    'title' => $assignment->event?->title ?? 'Event Dihapus',
                    'category' => $assignment->event?->category,
                    'date' => $assignment->event?->date,
                    'time' => $assignment->event?->time,
                    'location' => $assignment->event?->location,
                    'address' => $assignment->event?->address,
                ],
                'team' => ($teamVolunteers[$assignment->event_id] ?? collect())
                    ->map(fn ($volunteer) => [
                        'id' => $volunteer->id,
                        'name' => $teamMembers[$volunteer->member_id]['name'] ?? 'Member #'.$volunteer->member_id,
                        'role_category' => $volunteer->role_category,
                        'role_name' => $volunteer->role_name,
                        'response_status' => $volunteer->response_status ?? 'pending',
                    ])
                    ->values(),
            ]);

            $userMessages = EventMessage::with([
                'event:id,title,date,time',
                'reads' => fn ($query) => $query->where('user_id', $user->id),
            ])
                ->whereIn('event_id', $assignments->pluck('event_id')->unique())
                ->latest()
                ->get()
                ->map(function (EventMessage $message) use ($user) {
                    return [
                        'id' => $message->id,
                        'title' => $message->title,
                        'body' => $message->body,
                        'created_at' => $message->created_at?->toISOString(),
                        'is_read' => $message->reads->isNotEmpty(),
                        'event' => [
                            'id' => $message->event?->id,
                            'title' => $message->event?->title ?? 'Event Dihapus',
                            'date' => $message->event?->date,
                            'time' => $message->event?->time,
                        ],
                    ];
                });
        }

        return inertia('dashboard', [
            'dashboard' => [
                'stats' => [
                    'active_events' => Event::whereDate('date', '>=', $today->toDateString())->count(),
                    'events_this_week' => Event::whereBetween('date', [
                        $today->copy()->startOfWeek()->toDateString(),
                        $today->copy()->endOfWeek()->toDateString(),
                    ])->count(),
                    'today_check_ins' => $todayCheckIns,
                    'attendance_rate' => $todayExpected > 0 ? round(($todayCheckIns / $todayExpected) * 100) : 0,
                    'volunteer_scheduled' => $volunteerScheduled,
                    'open_roles' => $openRoles,
                    'service_readiness' => $upcomingEvents->count() > 0
                        ? round($upcomingEvents->avg(fn ($event) => (int) ($categoryRoleCounts[$event->category] ?? 0) > 0
                            ? min(100, ((int) $event->volunteers_count / (int) $categoryRoleCounts[$event->category]) * 100)
                            : 100))
                        : 0,
                ],
                'upcoming_services' => $upcomingEvents->map(fn ($event) => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'category' => $event->category,
                    'date' => $event->date,
                    'time' => $event->time,
                    'location' => $event->location,
                    'expected' => $event->expected,
                    'checkedIn' => $event->attendances_count,
                    'volunteers' => $event->volunteers_count,
                    'openRoles' => max((int) ($categoryRoleCounts[$event->category] ?? 0) - (int) $event->volunteers_count, 0),
                    'rundown_segments' => $event->rundownSegments->map(fn ($segment) => [
                        'id' => $segment->id,
                        'title' => $segment->title,
                        'duration_seconds' => $segment->duration_seconds,
                        'sort_order' => $segment->sort_order,
                        'items' => $segment->items->map(fn ($item) => [
                            'id' => $item->id,
                            'title' => $item->title,
                            'duration_seconds' => $item->duration_seconds,
                            'sort_order' => $item->sort_order,
                            'song' => $item->song ? [
                                'id' => $item->song->id,
                                'title' => $item->song->title,
                                'artist' => $item->song->artist,
                                'key' => ($item->arrangement ?: $item->song->arrangements->first())?->keys,
                                'bpm' => ($item->arrangement ?: $item->song->arrangements->first())?->bpm,
                                'lyrics' => ($item->arrangement ?: $item->song->arrangements->first())?->lyrics,
                                'video_url' => ($item->arrangement ?: $item->song->arrangements->first())?->video_url,
                                'song_flow' => ($item->arrangement ?: $item->song->arrangements->first())?->song_flow,
                                'time_signature' => ($item->arrangement ?: $item->song->arrangements->first())?->time_signature,
                            ] : null,
                        ])->all(),
                    ])->all(),
                ]),
                'readiness_items' => $readinessItems,
                'live_check_ins' => $recentAttendances->map(fn ($attendance) => [
                    'name' => $members[$attendance->member_id]['name'] ?? 'Member #'.$attendance->member_id,
                    'event' => $attendance->event?->title ?? 'Event Dihapus',
                    'time' => $attendance->scan_time?->format('H:i') ?? '-',
                    'status' => $attendance->status,
                ]),
                'admin_assignments' => $adminAssignments,
                'user_assignments' => $userAssignments,
                'user_messages' => $userMessages,
                'external_members' => [],
            ],
        ]);
    })->name('dashboard');

    Route::get('my/events', [EventController::class, 'userIndex'])->name('my.events');
    Route::get('my/events/{event}', [EventController::class, 'userShow'])->name('my.events.show');
    Route::get('my/events/{event}/live-rundown', [LiveEventController::class, 'userRundown'])->name('my.live-rundown');
    Route::get('my/attendance-history', [AttendanceController::class, 'userHistory'])->name('my.attendance-history');

    Route::post('notifications/schedules/read', function (Request $request) {
        $user = $request->user();
        abort_unless($user && ! $user->isAdmin() && $user->member_id, 403);

        $assignmentIds = EventVolunteer::where('member_id', $user->member_id)
            ->where('response_status', 'pending')
            ->whereHas('event', fn ($query) => $query->whereDate('date', '>=', now()->toDateString()))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $viewedIds = collect($request->session()->get('viewed_user_assignment_ids', []))
            ->merge($assignmentIds)
            ->unique()
            ->values()
            ->all();

        $request->session()->put('viewed_user_assignment_ids', $viewedIds);

        return back();
    })->name('notifications.schedules.read');

    Route::post('notifications/messages/read', function (Request $request) {
        $user = $request->user();
        abort_unless($user && ! $user->isAdmin() && $user->member_id, 403);

        $eventIds = EventVolunteer::where('member_id', $user->member_id)->pluck('event_id');

        EventMessage::whereIn('event_id', $eventIds)
            ->whereDoesntHave('reads', fn ($query) => $query->where('user_id', $user->id))
            ->get()
            ->each(fn (EventMessage $message) => EventMessageRead::firstOrCreate(
                ['event_message_id' => $message->id, 'user_id' => $user->id],
                ['read_at' => now()],
            ));

        return back();
    })->name('notifications.messages.read');

    Route::post('dashboard/volunteer-assignments/{eventVolunteer}/accept', function (Request $request, EventVolunteer $eventVolunteer) {
        abort_unless((string) $eventVolunteer->member_id === (string) $request->user()?->member_id, 403);

        $eventVolunteer->update([
            'response_status' => 'accepted',
            'response_reason' => null,
            'responded_at' => now(),
        ]);

        return back()->with('success', 'Jadwal pelayanan berhasil diterima.');
    })->name('dashboard.volunteer-assignments.accept');

    Route::post('dashboard/volunteer-assignments/{eventVolunteer}/decline', function (Request $request, EventVolunteer $eventVolunteer) {
        abort_unless((string) $eventVolunteer->member_id === (string) $request->user()?->member_id, 403);

        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $eventVolunteer->update([
            'response_status' => 'declined',
            'response_reason' => $validated['reason'],
            'responded_at' => now(),
        ]);

        return back()->with('success', 'Alasan penolakan jadwal berhasil dikirim.');
    })->name('dashboard.volunteer-assignments.decline');

    Route::post('dashboard/volunteer-assignments/{eventVolunteer}/replace', function (Request $request, EventVolunteer $eventVolunteer) {
        abort_unless($request->user()->isAdmin(), 403);

        $validated = $request->validate([
            'member_id' => 'required',
        ]);

        $eventVolunteer->update([
            'member_id' => $validated['member_id'],
            'response_status' => 'pending',
            'response_reason' => null,
            'responded_at' => null,
        ]);

        return back()->with('success', 'Volunteer berhasil diganti.');
    })->middleware('role:admin,superadmin')->name('dashboard.volunteer-assignments.replace');
    Route::get('anggota', function (Request $request) {
        $memberApi = app(MemberApiService::class);

        try {
            $search = $request->input('search');
            $page = max(1, (int) $request->input('page', 1));
            $perPage = 10;

            if (! empty($search)) {
                $needle = mb_strtolower(trim((string) $search));
                $filteredMembers = collect($memberApi->listAll())
                    ->filter(function (array $member) use ($needle): bool {
                        return collect([
                            $member['idjemaat'] ?? null,
                            $member['noaj'] ?? null,
                            $member['namalengkap'] ?? null,
                            $member['email'] ?? null,
                        ])->contains(fn ($value): bool => $value !== null
                            && str_contains(mb_strtolower((string) $value), $needle));
                    })
                    ->values();

                $total = $filteredMembers->count();
                $items = $filteredMembers
                    ->forPage($page, $perPage)
                    ->values()
                    ->all();
            } else {
                $result = $memberApi->list($page, $perPage);
                $items = $result['data'];
                $pagination = $result['pagination'];
                $page = (int) ($pagination['current_page'] ?? $page);
                $perPage = (int) ($pagination['per_page'] ?? $perPage);
                $total = (int) ($pagination['total_records'] ?? count($items));
            }

            $memberIds = collect($items)->pluck('idjemaat')->filter()->all();
            $details = MemberDetail::with(['status', 'department'])
                ->whereIn('member_id', $memberIds)
                ->get()
                ->keyBy(fn ($detail) => (string) $detail->member_id);

            $items = collect($items)->map(function (array $member) use ($details) {
                $member['member_detail'] = $details->get((string) $member['idjemaat']);

                return $member;
            })->all();

            $members = new LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            $statuses = MemberStatus::all();
            $departments = Department::all();

        } catch (Exception $e) {
            $members = new LengthAwarePaginator([], 0, 10);
            $statuses = [];
            $departments = [];
            session()->now('error', 'Gagal terhubung ke database: '.$e->getMessage());
        }

        return inertia('anggota/index', [
            'members' => $members,
            'statuses' => $statuses,
            'departments' => $departments,
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Member List', 'href' => route('anggota')],
            ],
        ]);
    })->middleware('role:admin,superadmin')->name('anggota');

    Route::get('anggota/{id}/edit', function ($id) {
        $member = app(MemberApiService::class)->findById($id);
        abort_unless($member, 404);
        $member['member_detail'] = MemberDetail::with(['status', 'department'])->where('member_id', $id)->first();
        $statuses = MemberStatus::all();
        $departments = Department::all();

        return inertia('anggota/edit', [
            'member' => $member,
            'statuses' => $statuses,
            'departments' => $departments,
            'breadcrumbs' => [
                ['title' => 'Member List', 'href' => route('anggota')],
                ['title' => 'Edit Member', 'href' => '#'],
            ],
        ]);
    })->middleware('role:admin,superadmin')->name('anggota.edit');

    Route::post('anggota/{id}/update-details', function (Request $request, $id) {
        $request->validate([
            'status_id' => 'nullable|exists:member_statuses,id',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        MemberDetail::updateOrCreate(
            ['member_id' => $id],
            [
                'status_id' => $request->status_id === 'none' ? null : $request->status_id,
                'department_id' => $request->department_id === 'none' ? null : $request->department_id,
            ]
        );

        return back()->with('success', 'Detail anggota berhasil diperbarui');
    })->middleware('role:admin,superadmin')->name('anggota.update-details');
    Route::resource('departments', DepartmentController::class)->except(['create', 'edit', 'show'])->middleware('role:admin,superadmin');

    Route::resource('events', EventController::class)->except(['create', 'edit', 'show'])->middleware('role:admin,superadmin');
    Route::post('event-messages', [EventMessageController::class, 'store'])->middleware('role:admin,superadmin')->name('event-messages.store');
    Route::post('event-messages/{eventMessage}/read', [EventMessageController::class, 'markRead'])->name('event-messages.read');
    Route::post('events/{event}/participants', [EventController::class, 'enrollParticipant'])->middleware('role:admin,superadmin')->name('events.participants.enroll');
    Route::delete('events/{event}/participants/{participant}', [EventController::class, 'removeParticipant'])->middleware('role:admin,superadmin')->name('events.participants.remove');
    Route::put('events/{event}/participants/{participant}', [EventController::class, 'updateParticipantStatus'])->middleware('role:admin,superadmin')->name('events.participants.update-status');
    Route::get('live-events', [LiveEventController::class, 'index'])->middleware('role:admin,superadmin')->name('live-events.index');
    Route::get('live-events/time-keeper', [LiveEventController::class, 'timeKeeper'])->middleware('role:admin,superadmin')->name('live-events.time-keeper');
    Route::post('live-events/{event}/start', [LiveEventController::class, 'start'])->middleware('role:admin,superadmin')->name('live-events.start');
    Route::post('live-events/{event}/next', [LiveEventController::class, 'next'])->middleware('role:admin,superadmin')->name('live-events.next');
    Route::post('live-events/{event}/finish', [LiveEventController::class, 'finish'])->middleware('role:admin,superadmin')->name('live-events.finish');
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show'])->middleware('role:admin,superadmin');
    Route::post('categories/{category}/duplicate', [CategoryController::class, 'duplicate'])->middleware('role:admin,superadmin')->name('categories.duplicate');
    Route::post('event-groups', [CategoryController::class, 'storeGroup'])->middleware('role:admin,superadmin')->name('event-groups.store');
    Route::delete('event-groups/{eventGroup}', [CategoryController::class, 'destroyGroup'])->middleware('role:admin,superadmin')->name('event-groups.destroy');
    Route::get('scan-qr', [AttendanceController::class, 'showAdminScan'])->middleware('role:admin,superadmin')->name('scan-qr');
    Route::get('attendance-monitor', [AttendanceController::class, 'showAttendanceMonitor'])->middleware('role:admin,superadmin')->name('attendance-monitor');
    Route::get('attendance-history', [AttendanceController::class, 'history'])->middleware('role:admin,superadmin')->name('attendance-history');
    Route::get('attendance-history/export/pdf', [AttendanceController::class, 'exportPdf'])->middleware('role:admin,superadmin')->name('attendance-history.export.pdf');
    Route::get('attendance-history/export/excel', [AttendanceController::class, 'exportExcel'])->middleware('role:admin,superadmin')->name('attendance-history.export.excel');

    // Song Bank Routes
    Route::resource('songs', SongController::class)->except(['create', 'edit', 'show'])->middleware('role:admin,superadmin');
    Route::post('songs/{song}/arrangements', [SongController::class, 'storeArrangement'])->middleware('role:admin,superadmin')->name('songs.arrangements.store');
    Route::get('arrangements/{arrangement}/pdf', [SongController::class, 'viewPdf'])->middleware('role:admin,superadmin')->name('arrangements.pdf');
    Route::post('arrangements/{arrangement}/duplicate', [SongController::class, 'duplicateArrangement'])->middleware('role:admin,superadmin')->name('arrangements.duplicate');
    Route::put('arrangements/{arrangement}', [SongController::class, 'updateArrangement'])->middleware('role:admin,superadmin')->name('arrangements.update');
    Route::delete('arrangements/{arrangement}', [SongController::class, 'destroyArrangement'])->middleware('role:admin,superadmin')->name('arrangements.destroy');

    // QR Attendance Routes
    Route::get('my/scan', [AttendanceController::class, 'showUserScan'])->name('my.scan');
    Route::get('attendance/{event}/scan', [AttendanceController::class, 'showEventScan'])->middleware('role:admin,superadmin')->name('attendance.scan');
    Route::post('attendance/{event}/scan-event', [AttendanceController::class, 'scanEventQr'])->name('attendance.scan-event');
    Route::post('attendance/scan-member', [AttendanceController::class, 'scanMemberQr'])->middleware('role:admin,superadmin')->name('attendance.scan-member');

    Route::get('event-images/{path}', function (string $path) {
        abort_if(str_contains($path, '..'), 404);

        $disk = Storage::disk('public');
        abort_unless($disk->exists($path), 404);

        return response()->file($disk->path($path));
    })->where('path', '.*')->name('event-images.show');
});

// Settings Routes
Route::get('/settings/roles', [SettingsController::class, 'roles'])
    ->middleware(['auth', 'verified', 'role:superadmin'])
    ->name('settings.roles');

Route::post('/settings/roles/assign', [SettingsController::class, 'assignRole'])
    ->middleware(['auth', 'verified', 'role:superadmin'])
    ->name('settings.roles.assign');

Route::patch('/settings/users/{user}/role', [SettingsController::class, 'updateUserRole'])
    ->middleware(['auth', 'verified', 'role:superadmin'])
    ->name('settings.users.role');

require __DIR__.'/settings.php';
