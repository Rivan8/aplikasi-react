<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Event;
use App\Models\EventGroup;
use App\Models\EventParticipant;
use App\Models\EventVolunteer;
use App\Models\Song;
use App\Models\User;
use App\Notifications\VolunteerScheduledNotification;
use App\Services\MemberApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EventController extends Controller
{
    public function userIndex(LiveEventController $liveEventController)
    {
        $user = request()->user();
        $memberId = $user?->member_id;

        $assignedEventIds = $memberId
            ? EventVolunteer::where('member_id', $memberId)
                ->pluck('event_id')
                ->unique()
                ->values()
                ->all()
            : [];

        $events = Event::with([
            'sessions',
            'volunteers',
            'rundownSegments.items.song.arrangements',
            'rundownSegments.items.arrangement',
            'liveSession.runs',
            'liveSession.itemRuns',
        ])
            ->whereIn('id', $assignedEventIds)
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        return Inertia::render('my/events/index', [
            'events' => $events->map(function (Event $event) use ($liveEventController, $memberId): array {
                return [
                    ...$liveEventController->serializeEvent($event),
                    'my_volunteer_assignments' => $event->volunteers
                        ->filter(fn (EventVolunteer $assignment): bool => (string) $assignment->member_id === (string) $memberId)
                        ->map(fn (EventVolunteer $assignment): array => [
                            'id' => $assignment->id,
                            'role_category' => $assignment->role_category,
                            'role_name' => $assignment->role_name,
                            'response_status' => in_array($assignment->response_status, [null, 'read'], true)
                                ? 'pending'
                                : $assignment->response_status,
                            'response_reason' => $assignment->response_reason,
                        ])
                        ->values()
                        ->all(),
                ];
            })->values(),
            'assignedEventIds' => $assignedEventIds,
        ]);
    }

    public function userShow(LiveEventController $liveEventController, Event $event)
    {
        $user = request()->user();
        $memberId = $user?->member_id;

        abort_unless($memberId, 403, 'Akun ini belum terhubung dengan data anggota.');

        if ($memberId) {
            $isAssigned = EventVolunteer::where('event_id', $event->id)
                ->where('member_id', $memberId)
                ->exists();

            abort_unless($isAssigned, 403, 'Anda tidak memiliki akses ke event ini.');
        }

        $event->load([
            'sessions',
            'volunteers',
            'rundownSegments.items.song.arrangements',
            'rundownSegments.items.arrangement',
            'liveSession.runs',
            'liveSession.itemRuns',
        ]);

        return Inertia::render('my/events/show', [
            'event' => [
                ...$liveEventController->serializeEvent($event),
                'my_volunteer_assignments' => $event->volunteers
                    ->filter(fn (EventVolunteer $assignment): bool => (string) $assignment->member_id === (string) $memberId)
                    ->map(fn (EventVolunteer $assignment): array => [
                        'id' => $assignment->id,
                        'role_category' => $assignment->role_category,
                        'role_name' => $assignment->role_name,
                        'response_status' => in_array($assignment->response_status, [null, 'read'], true)
                            ? 'pending'
                            : $assignment->response_status,
                        'response_reason' => $assignment->response_reason,
                    ])
                    ->values()
                    ->all(),
            ],
            'eventData' => [
                'worship' => [
                    'date' => $event->date,
                    'start_time' => $event->time,
                    'end_time' => null,
                ],
                'training' => $event->training_schedules ?? [],
                'other' => $event->other_schedules ?? [],
            ],
        ]);
    }

    public function index(MemberApiService $memberApi)
    {
        $user = request()->user();
        $departmentIds = $user->schedulingDepartments()->pluck('departments.id')->map(fn ($id) => (int) $id)->all();
        abort_unless($user->isAdmin() || $departmentIds !== [], 403);

        $externalMembers = $memberApi->listAll();
        $membersById = collect($externalMembers)->keyBy(fn (array $member) => (string) $member['idjemaat']);
        $events = Event::with([
            'volunteers',
            'participants',
            'sessions',
            'liveSession',
            'messages',
            'rundownSegments.items.song.arrangements',
            'rundownSegments.items.arrangement',
        ])->orderBy('date', 'desc')->get();

        $events->each(function (Event $event) use ($membersById): void {
            $event->volunteers->each(function ($volunteer) use ($membersById): void {
                $volunteer->setAttribute('member', $membersById->get((string) $volunteer->member_id));
            });
            $event->participants->each(function ($participant) use ($membersById): void {
                $participant->setAttribute('member', $membersById->get((string) $participant->member_id));
            });
        });

        return Inertia::render('events/index', [
            'events' => $events,
            'categories' => Category::with('roles.department')->get(),
            'groups' => EventGroup::orderBy('name')->get(),
            'songs' => Song::with('arrangements')->orderBy('title')->get(),
            'external_members' => $externalMembers,
            'can_manage_events' => $user->isAdmin(),
            'authorized_department_ids' => $departmentIds,
            'breadcrumbs' => [
                ['title' => 'Event Dashboard', 'href' => '/events'],
            ],
        ]);
    }

    public function scheduling(MemberApiService $memberApi)
    {
        $user = request()->user();
        $departmentIds = $user->schedulingDepartments()
            ->pluck('departments.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        abort_unless($user->isAdmin() || $departmentIds !== [], 403);

        $externalMembers = $memberApi->listAll();
        $membersById = collect($externalMembers)
            ->keyBy(fn (array $member) => (string) $member['idjemaat']);
        $events = Event::with('volunteers')
            ->orderByDesc('date')
            ->orderByDesc('time')
            ->get();

        $events->each(function (Event $event) use ($membersById): void {
            $event->volunteers->each(function (EventVolunteer $volunteer) use ($membersById): void {
                $volunteer->setAttribute('member', $membersById->get((string) $volunteer->member_id));
            });
        });

        return Inertia::render('event-scheduling/index', [
            'events' => $events,
            'categories' => Category::with('roles.department')->get(),
            'external_members' => collect($externalMembers)->map(fn (array $member) => [
                'idjemaat' => (string) $member['idjemaat'],
                'namalengkap' => $member['namalengkap'] ?? $member['name'] ?? 'Anggota',
                'email' => $member['email'] ?? null,
            ])->values(),
            'can_manage_events' => $user->isAdmin(),
            'authorized_department_ids' => $departmentIds,
            'breadcrumbs' => [
                ['title' => 'Penjadwalan Event', 'href' => '/event-scheduling'],
            ],
        ]);
    }

    public function calendar()
    {
        $eventsQuery = Event::query()
            ->select(['id', 'title', 'date', 'time', 'location', 'category'])
            ->orderBy('date')
            ->orderBy('time');

        if (! request()->user()->isAdmin()) {
            $memberId = request()->user()->member_id;

            if ($memberId) {
                $eventsQuery->whereHas('volunteers', fn ($query) => $query->where('member_id', $memberId));
            } else {
                $eventsQuery->whereKey(0);
            }
        }

        return Inertia::render('event-calendar/index', [
            'events' => $eventsQuery->get(),
        ]);
    }

    public function store(Request $request, MemberApiService $memberApi)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'attendance_start_time' => 'nullable|string',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'attendance_type' => 'nullable|string|in:volunteer,class_participant',
            'total_sessions' => 'nullable|integer|min:1',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string',
            'rundown_segments' => 'nullable|string',
            'sessions' => 'nullable|string',
            'participants' => 'nullable|string',
            'training_schedules' => 'nullable|string',
            'other_schedules' => 'nullable|string',
        ]);

        $data = Arr::except($validated, ['image', 'volunteers', 'rundown_segments', 'sessions', 'participants', 'training_schedules', 'other_schedules']);
        $data['training_schedules'] = $request->filled('training_schedules') ? json_decode($request->training_schedules, true) ?? [] : [];
        $data['other_schedules'] = $request->filled('other_schedules') ? json_decode($request->other_schedules, true) ?? [] : [];
        $data['attendance_type'] = $validated['attendance_type'] ?? 'volunteer';
        $data['total_sessions'] = $validated['total_sessions'] ?? 1;

        if ($request->hasFile('image')) {
            $path = Storage::disk('public')->putFile('events', $request->file('image'));
            if ($path === false) {
                throw ValidationException::withMessages([
                    'image' => 'Gambar gagal disimpan. Periksa permission folder storage.',
                ]);
            }

            $data['image_path'] = '/event-images/'.$path;
        }

        $event = Event::create($data);

        $volunteers = is_string($request->volunteers) ? json_decode($request->volunteers, true) : $request->volunteers;
        $newAssignments = [];
        if (! empty($volunteers) && is_array($volunteers)) {
            foreach ($volunteers as $v) {
                if (! empty($v['member_id']) && $v['member_id'] !== 'none') {
                    $volunteer = $event->volunteers()->create($v);
                    $newAssignments[] = array_merge($v, ['assignment_id' => $volunteer->id]);
                }
            }
        }

        $this->notifyScheduledUsers($event, $newAssignments, $memberApi);

        $this->syncSessions($event, $request->sessions);
        $this->syncParticipants($event, $request->participants);
        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil dibuat');
    }

    public function update(Request $request, Event $event, MemberApiService $memberApi)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|string',
            'attendance_start_time' => 'nullable|string',
            'location' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'category' => 'required|string',
            'attendance_type' => 'nullable|string|in:volunteer,class_participant',
            'total_sessions' => 'nullable|integer|min:1',
            'expected' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'volunteers' => 'nullable|string',
            'rundown_segments' => 'nullable|string',
            'sessions' => 'nullable|string',
            'participants' => 'nullable|string',
            'training_schedules' => 'nullable|string',
            'other_schedules' => 'nullable|string',
            '_method' => 'nullable|string',
        ]);

        $data = Arr::except($validated, ['image', 'volunteers', 'rundown_segments', 'sessions', 'participants', 'training_schedules', 'other_schedules', '_method']);
        $data['training_schedules'] = $request->filled('training_schedules') ? json_decode($request->training_schedules, true) ?? [] : [];
        $data['other_schedules'] = $request->filled('other_schedules') ? json_decode($request->other_schedules, true) ?? [] : [];

        if ($request->hasFile('image')) {
            if ($event->image_path) {
                $oldPath = str_starts_with($event->image_path, '/event-images/')
                    ? substr($event->image_path, strlen('/event-images/'))
                    : str_replace('/storage/', '', $event->image_path);
                Storage::disk('public')->delete($oldPath);
            }
            $path = Storage::disk('public')->putFile('events', $request->file('image'));
            if ($path === false) {
                throw ValidationException::withMessages([
                    'image' => 'Gambar gagal disimpan. Periksa permission folder storage.',
                ]);
            }

            $data['image_path'] = '/event-images/'.$path;
        }

        $event->update($data);

        $previousMemberIds = $event->volunteers()->pluck('member_id')->map(fn ($id) => (string) $id)->all();
        $event->volunteers()->delete();
        $volunteers = is_string($request->volunteers) ? json_decode($request->volunteers, true) : $request->volunteers;
        $newAssignments = [];
        if (! empty($volunteers) && is_array($volunteers)) {
            foreach ($volunteers as $v) {
                if (! empty($v['member_id']) && $v['member_id'] !== 'none') {
                    $volunteer = $event->volunteers()->create($v);
                    if (! in_array((string) $v['member_id'], $previousMemberIds, true)) {
                        $newAssignments[] = array_merge($v, ['assignment_id' => $volunteer->id]);
                    }
                }
            }
        }

        $this->notifyScheduledUsers($event, $newAssignments, $memberApi);

        $this->syncSessions($event, $request->sessions);
        $this->syncParticipants($event, $request->participants);
        $this->syncRundown($event, $request->rundown_segments);

        return back()->with('success', 'Event berhasil diperbarui');
    }

    public function updateVolunteers(Request $request, Event $event, MemberApiService $memberApi)
    {
        $user = $request->user();
        $departmentIds = $user->schedulingDepartments()->pluck('departments.id')->map(fn ($id) => (int) $id)->all();
        abort_unless($user->isAdmin() || $departmentIds !== [], 403);

        $validated = $request->validate([
            'volunteers' => 'required|string',
        ]);
        $assignments = json_decode($validated['volunteers'], true);

        if (! is_array($assignments)) {
            throw ValidationException::withMessages([
                'volunteers' => 'Data penjadwalan tidak valid.',
            ]);
        }

        validator(['volunteers' => $assignments], [
            'volunteers' => 'array',
            'volunteers.*.member_id' => 'required',
            'volunteers.*.role_category' => 'required|string|max:255',
            'volunteers.*.role_name' => 'required|string|max:255',
        ])->validate();

        $categoryRolesQuery = CategoryRole::query()
            ->whereHas('category', fn ($query) => $query->where('name', $event->category))
            ->with('department');

        if (! $user->isAdmin()) {
            $categoryRolesQuery->whereIn('department_id', $departmentIds);
        }

        $categoryRoles = $categoryRolesQuery->get();
        $roleKeys = $categoryRoles->mapWithKeys(fn (CategoryRole $role) => [
            $role->department->name.'|'.$role->role_name => true,
        ]);
        $authorizedRoleKeys = $categoryRoles->map(fn (CategoryRole $role) => [
            'role_category' => $role->department->name,
            'role_name' => $role->role_name,
        ])->unique(fn (array $role) => $role['role_category'].'|'.$role['role_name'])->values()->all();
        $availableRoleCounts = $categoryRoles->countBy(
            fn (CategoryRole $role) => $role->department->name.'|'.$role->role_name,
        );

        $submittedRoleCounts = [];
        foreach ($assignments as $assignment) {
            $memberId = $assignment['member_id'] ?? null;
            if ((! is_string($memberId) && ! is_int($memberId))
                || (string) $memberId === 'none'
                || strlen((string) $memberId) > 255) {
                throw ValidationException::withMessages([
                    'volunteers' => 'ID anggota tidak valid.',
                ]);
            }

            $roleKey = ($assignment['role_category'] ?? '').'|'.($assignment['role_name'] ?? '');

            if (! $roleKeys->has($roleKey)) {
                throw ValidationException::withMessages([
                    'volunteers' => 'Anda tidak memiliki hak untuk menjadwalkan posisi departemen ini.',
                ]);
            }

            $submittedRoleCounts[$roleKey] = ($submittedRoleCounts[$roleKey] ?? 0) + 1;
            if ($submittedRoleCounts[$roleKey] > $availableRoleCounts->get($roleKey, 0)) {
                throw ValidationException::withMessages([
                    'volunteers' => 'Jumlah penjadwalan melebihi posisi yang tersedia di departemen.',
                ]);
            }
        }

        $previousMemberIds = [];
        if ($authorizedRoleKeys !== []) {
            $previousMemberIds = $event->volunteers()
                ->where(function ($query) use ($authorizedRoleKeys) {
                    foreach ($authorizedRoleKeys as $role) {
                        $query->orWhere(fn ($roleQuery) => $roleQuery
                            ->where('role_category', $role['role_category'])
                            ->where('role_name', $role['role_name']));
                    }
                })
                ->pluck('member_id')
                ->map(fn ($id) => (string) $id)
                ->all();
        }

        $newAssignments = DB::transaction(function () use ($event, $assignments, $authorizedRoleKeys, $previousMemberIds) {
            if ($authorizedRoleKeys !== []) {
                $event->volunteers()
                    ->where(function ($query) use ($authorizedRoleKeys) {
                        foreach ($authorizedRoleKeys as $role) {
                            $query->orWhere(fn ($roleQuery) => $roleQuery
                                ->where('role_category', $role['role_category'])
                                ->where('role_name', $role['role_name']));
                        }
                    })
                    ->delete();
            }
            $createdAssignments = [];

            foreach ($assignments as $assignment) {
                $volunteer = $event->volunteers()->create([
                    'member_id' => (string) $assignment['member_id'],
                    'role_category' => $assignment['role_category'],
                    'role_name' => $assignment['role_name'],
                ]);

                if (! in_array((string) $assignment['member_id'], $previousMemberIds, true)) {
                    $createdAssignments[] = array_merge($assignment, ['assignment_id' => $volunteer->id]);
                }
            }

            return $createdAssignments;
        });

        $this->notifyScheduledUsers($event, $newAssignments, $memberApi);

        return back()->with('success', 'Penjadwalan departemen berhasil diperbarui.');
    }

    public function enrollParticipant(Request $request, Event $event)
    {
        $validated = $request->validate([
            'member_id' => 'required',
        ]);

        $exists = $event->participants()->where('member_id', $validated['member_id'])->exists();
        if ($exists) {
            return back()->with('error', 'Anggota sudah terdaftar sebagai peserta kelas ini.');
        }

        $event->participants()->create([
            'member_id' => $validated['member_id'],
            'status' => 'registered',
            'registered_at' => now(),
        ]);

        return back()->with('success', 'Peserta berhasil didaftarkan ke kelas.');
    }

    public function removeParticipant(Event $event, EventParticipant $participant)
    {
        if ($participant->event_id !== $event->id) {
            abort(403);
        }

        $participant->delete();

        return back()->with('success', 'Peserta berhasil dihapus dari kelas.');
    }

    public function updateParticipantStatus(Request $request, Event $event, EventParticipant $participant)
    {
        if ($participant->event_id !== $event->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:registered,active,passed,dropped',
        ]);

        $participant->update($validated);

        return back()->with('success', 'Status peserta berhasil diperbarui.');
    }

    public function destroy(Event $event)
    {
        $event->delete();

        return back()->with('success', 'Event berhasil dihapus');
    }

    private function syncSessions(Event $event, ?string $payload): void
    {
        if ($event->attendance_type !== 'class_participant') {
            $event->sessions()->delete();

            return;
        }

        if ($payload === null) {
            if ($event->sessions()->count() === 0) {
                $event->sessions()->create([
                    'session_number' => 1,
                    'title' => 'Sesi 1',
                    'date' => $event->date,
                    'start_time' => $event->time,
                ]);
            }

            return;
        }

        $sessions = is_string($payload) ? json_decode($payload, true) : $payload;
        if (! is_array($sessions)) {
            return;
        }

        $event->sessions()->delete();

        foreach (array_values($sessions) as $index => $sess) {
            $sessionNum = $index + 1;
            $event->sessions()->create([
                'session_number' => $sessionNum,
                'title' => trim((string) ($sess['title'] ?? ('Sesi '.$sessionNum))),
                'date' => $sess['date'] ?? $event->date,
                'start_time' => $sess['start_time'] ?? $event->time,
                'end_time' => $sess['end_time'] ?? null,
                'attendance_start_time' => $sess['attendance_start_time'] ?? null,
            ]);
        }

        $event->update(['total_sessions' => max(1, count($sessions))]);
    }

    private function syncRundown(Event $event, ?string $payload): void
    {
        if (! auth()->user()->isAdmin()) {
            return;
        }

        if ($payload === null) {
            return;
        }

        $segments = json_decode($payload, true);
        if (! is_array($segments)) {
            return;
        }

        $event->rundownSegments()->delete();

        foreach (array_values($segments) as $segmentIndex => $segment) {
            $title = trim((string) ($segment['title'] ?? ''));

            if ($title === '') {
                continue;
            }

            $createdSegment = $event->rundownSegments()->create([
                'title' => $title,
                'duration_seconds' => max(0, (int) ($segment['duration_seconds'] ?? 0)),
                'sort_order' => $segmentIndex,
            ]);

            $items = $segment['items'] ?? [];

            if (! is_array($items)) {
                continue;
            }

            foreach (array_values($items) as $itemIndex => $item) {
                $itemTitle = trim((string) ($item['title'] ?? ''));

                if ($itemTitle === '') {
                    continue;
                }

                $createdSegment->items()->create([
                    'title' => $itemTitle,
                    'song_id' => $item['song_id'] ?? null,
                    'song_arrangement_id' => $item['song_arrangement_id'] ?? null,
                    'duration_seconds' => max(0, (int) ($item['duration_seconds'] ?? 0)),
                    'sort_order' => $itemIndex,
                ]);
            }
        }
    }

    private function syncParticipants(Event $event, ?string $payload): void
    {
        if ($event->attendance_type !== 'class_participant' || $payload === null) {
            return;
        }

        $participants = is_string($payload) ? json_decode($payload, true) : $payload;
        if (! is_array($participants)) {
            return;
        }

        foreach ($participants as $p) {
            if (! empty($p['member_id'])) {
                $event->participants()->firstOrCreate(
                    ['member_id' => $p['member_id']],
                    ['status' => $p['status'] ?? 'registered', 'registered_at' => now()]
                );
            }
        }
    }

    private function notifyScheduledUsers(Event $event, array $assignments, MemberApiService $memberApi): void
    {
        collect($assignments)
            ->filter(fn (array $assignment): bool => ! empty($assignment['member_id']))
            ->groupBy(fn (array $assignment): string => (string) $assignment['member_id'])
            ->each(function ($memberAssignments, string $memberId) use ($event, $memberApi): void {
                $user = User::query()
                    ->where('member_id', $memberId)
                    ->whereNotNull('email')
                    ->where('email', '!=', '')
                    ->first();

                $roles = $memberAssignments
                    ->pluck('role_name')
                    ->filter()
                    ->unique()
                    ->implode(', ');

                $notification = new VolunteerScheduledNotification(
                    $event,
                    $roles !== '' ? $roles : 'Volunteer',
                    (int) $memberAssignments->first()['assignment_id'],
                );

                if ($user) {
                    $user->notify($notification);

                    return;
                }

                $memberEmail = $memberApi->findById($memberId)['email'] ?? null;
                if (is_string($memberEmail) && filter_var($memberEmail, FILTER_VALIDATE_EMAIL)) {
                    Notification::route('mail', $memberEmail)->notify($notification);
                }
            });
    }
}
