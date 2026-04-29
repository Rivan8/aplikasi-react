<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('anggota', function (\Illuminate\Http\Request $request) {
        try {
            $query = \App\Models\ExternalMember::with(['member_detail.status', 'member_detail.department']);

            // Handle Search
            $search = $request->input('search');
            if (!empty($search)) {
                $query->where(function($q) use ($search) {
                    $q->where('namalengkap', 'like', "%{$search}%")
                      ->orWhere('idjemaat', 'like', "%{$search}%");
                });
            }

            $members = $query->paginate(10)->withQueryString();

            $statuses = \App\Models\MemberStatus::all();
            $departments = \App\Models\Department::all();

        } catch (\Exception $e) {
            $members = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
            $statuses = [];
            $departments = [];
            session()->now('error', 'Gagal terhubung ke database: ' . $e->getMessage());
        }

        return inertia('anggota/index', [
            'members' => $members,
            'statuses' => $statuses,
            'departments' => $departments,
            'filters' => $request->only(['search']),
            'breadcrumbs' => [
                ['title' => 'Member List', 'href' => route('anggota')],
            ]
        ]);
    })->name('anggota');

    Route::get('anggota/{id}/edit', function ($id) {
        $member = \App\Models\ExternalMember::with(['member_detail'])->findOrFail($id);
        $statuses = \App\Models\MemberStatus::all();
        $departments = \App\Models\Department::all();

        return inertia('anggota/edit', [
            'member' => $member,
            'statuses' => $statuses,
            'departments' => $departments,
            'breadcrumbs' => [
                ['title' => 'Member List', 'href' => route('anggota')],
                ['title' => 'Edit Member', 'href' => '#'],
            ]
        ]);
    })->name('anggota.edit');

    Route::post('anggota/{id}/update-details', function (\Illuminate\Http\Request $request, $id) {
        $request->validate([
            'status_id' => 'nullable|exists:member_statuses,id',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        \App\Models\MemberDetail::updateOrCreate(
            ['member_id' => $id],
            [
                'status_id' => $request->status_id === 'none' ? null : $request->status_id,
                'department_id' => $request->department_id === 'none' ? null : $request->department_id,
            ]
        );

        return back()->with('success', 'Detail anggota berhasil diperbarui');
    })->name('anggota.update-details');
    Route::resource('departments', \App\Http\Controllers\DepartmentController::class)->except(['create', 'edit', 'show']);

    Route::resource('events', \App\Http\Controllers\EventController::class)->except(['create', 'edit', 'show']);
    Route::get('scan-qr', function () {
        return inertia('scan-qr/index', [
            'events' => \App\Models\Event::orderBy('date', 'desc')->get(),
        ]);
    })->name('scan-qr');
    Route::inertia('attendance-history', 'attendance-history/index')->name('attendance-history');

    // QR Attendance Routes
    Route::get('my/scan', [\App\Http\Controllers\AttendanceController::class, 'showUserScan'])->name('my.scan');
    Route::post('attendance/{event}/scan-event', [\App\Http\Controllers\AttendanceController::class, 'scanEventQr'])->name('attendance.scan-event');
    Route::post('attendance/scan-member', [\App\Http\Controllers\AttendanceController::class, 'scanMemberQr'])->name('attendance.scan-member');
});

require __DIR__.'/settings.php';
