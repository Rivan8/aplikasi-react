<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\LiveEventController;
use App\Models\Attendance;
use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Department;
use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\ExternalMember;
use App\Models\MemberDetail;
use App\Models\MemberStatus;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        $today = now();
        $user = $request->user();
        $upcomingEvents = Event::withCount(['volunteers', 'attendances'])
            ->whereDate('date', '>=', $today->toDateString())
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
                $members = ExternalMember::whereIn('idjemaat', $memberIds)
                    ->get()
                    ->mapWithKeys(fn ($member) => [
                        $member->idjemaat => [
                            'name' => $member->name,
                        ],
                    ])
                    ->all();
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
        $userAssignments = collect();

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
                try {
                    $teamMembers = ExternalMember::whereIn('idjemaat', $teamMemberIds)
                        ->get()
                        ->mapWithKeys(fn ($member) => [
                            $member->idjemaat => [
                                'name' => $member->name,
                            ],
                        ])
                        ->all();
                } catch (Exception $e) {
                    $teamMembers = [];
                }
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
                ]),
                'readiness_items' => $readinessItems,
                'live_check_ins' => $recentAttendances->map(fn ($attendance) => [
                    'name' => $members[$attendance->member_id]['name'] ?? 'Member #'.$attendance->member_id,
                    'event' => $attendance->event?->title ?? 'Event Dihapus',
                    'time' => $attendance->scan_time?->format('H:i') ?? '-',
                    'status' => $attendance->status,
                ]),
                'user_assignments' => $userAssignments,
            ],
        ]);
    })->name('dashboard');

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
    Route::get('anggota', function (Request $request) {
        try {
            $query = ExternalMember::with(['member_detail.status', 'member_detail.department']);

            // Handle Search
            $search = $request->input('search');
            if (! empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('namalengkap', 'like', "%{$search}%")
                        ->orWhere('idjemaat', 'like', "%{$search}%");
                });
            }

            $members = $query->paginate(10)->withQueryString();

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
    })->name('anggota');

    Route::get('anggota/{id}/edit', function ($id) {
        $member = ExternalMember::with(['member_detail'])->findOrFail($id);
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
    })->name('anggota.edit');

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
    })->name('anggota.update-details');
    Route::resource('departments', DepartmentController::class)->except(['create', 'edit', 'show']);

    Route::resource('events', EventController::class)->except(['create', 'edit', 'show']);
    Route::get('live-events', [LiveEventController::class, 'index'])->name('live-events.index');
    Route::get('live-events/time-keeper', [LiveEventController::class, 'timeKeeper'])->name('live-events.time-keeper');
    Route::post('live-events/{event}/start', [LiveEventController::class, 'start'])->name('live-events.start');
    Route::post('live-events/{event}/next', [LiveEventController::class, 'next'])->name('live-events.next');
    Route::post('live-events/{event}/finish', [LiveEventController::class, 'finish'])->name('live-events.finish');
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    Route::get('scan-qr', [AttendanceController::class, 'showAdminScan'])->name('scan-qr');
    Route::get('attendance-history', [AttendanceController::class, 'history'])->name('attendance-history');
    Route::get('attendance-history/export/pdf', [AttendanceController::class, 'exportPdf'])->name('attendance-history.export.pdf');
    Route::get('attendance-history/export/excel', [AttendanceController::class, 'exportExcel'])->name('attendance-history.export.excel');

    // QR Attendance Routes
    Route::get('my/scan', [AttendanceController::class, 'showUserScan'])->name('my.scan');
    Route::get('attendance/{event}/scan', [AttendanceController::class, 'showEventScan'])->name('attendance.scan');
    Route::post('attendance/{event}/scan-event', [AttendanceController::class, 'scanEventQr'])->name('attendance.scan-event');
    Route::post('attendance/scan-member', [AttendanceController::class, 'scanMemberQr'])->name('attendance.scan-member');
});

require __DIR__.'/settings.php';
