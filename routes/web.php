<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('anggota', function () {
        try {
            $members = \App\Models\ExternalMember::paginate(10);
            
            // Get IDs of members on current page
            $memberIds = collect($members->items())->pluck('id');
            
            // Fetch local details
            $details = \App\Models\MemberDetail::with(['status', 'department'])
                ->whereIn('member_id', $memberIds)
                ->get()
                ->keyBy('member_id');

            // Merge details into members
            $members->getCollection()->transform(function ($member) use ($details) {
                $detail = $details->get($member->id);
                $member->member_detail = $detail;
                return $member;
            });

            $statuses = \App\Models\MemberStatus::all();
            $departments = \App\Models\Department::all();

        } catch (\Exception $e) {
            $members = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
            $statuses = [];
            $departments = [];
            session()->now('error', 'Could not connect to database: ' . $e->getMessage());
        }

        return inertia('anggota/index', [
            'members' => $members,
            'statuses' => $statuses,
            'departments' => $departments
        ]);
    })->name('anggota');

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
    
    Route::inertia('events', 'events/index')->name('events');
    Route::inertia('scan-qr', 'scan-qr/index')->name('scan-qr');
    Route::inertia('attendance-history', 'attendance-history/index')->name('attendance-history');
});

require __DIR__.'/settings.php';
