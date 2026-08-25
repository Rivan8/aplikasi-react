<?php

namespace App\Http\Controllers;

use App\Exports\AttendanceHistoryExport;
use App\Models\Event;
use App\Models\Attendance;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Services\MemberApiService;

class AttendanceController extends Controller
{
    public function __construct(private readonly MemberApiService $memberApi)
    {
    }

    /**
     * Halaman riwayat kehadiran (Attendance History)
     */
    public function history(Request $request)
    {
        $query = Attendance::with(['event', 'session'])
            ->orderBy('scan_time', 'desc');

        // Filter by event
        if ($request->filled('event_id') && $request->event_id !== 'all') {
            $query->where('event_id', $request->event_id);
        }

        // Filter by session
        if ($request->filled('event_session_id') && $request->event_session_id !== 'all') {
            $query->where('event_session_id', $request->event_session_id);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('scan_time', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('scan_time', '<=', $request->date_to);
        }

        // Search by member name (akan difilter setelah fetch dari external DB)
        $search = $request->input('search');

        $attendances = $query->paginate(15)->withQueryString();

        // Ambil semua member_id unik dari halaman ini
        $memberIds = $attendances->pluck('member_id')->unique()->values()->toArray();

        // Fetch nama member dari external DB
        $members = [];
        if (!empty($memberIds)) {
            try {
                foreach ($this->memberApi->findMany($memberIds) as $member) {
                    $members[$member['idjemaat']] = [
                        'id' => $member['idjemaat'],
                        'name' => $member['name'],
                        'nik' => $member['nik'],
                    ];
                }
            } catch (\Exception $e) {
                // Jika external DB gagal, tampilkan member_id saja
            }
        }

        // Transform data attendance untuk frontend
        $attendanceLogs = $attendances->through(function ($attendance) use ($members) {
            $memberInfo = $members[$attendance->member_id] ?? null;
            return [
                'id' => $attendance->id,
                'member_id' => $attendance->member_id,
                'member_name' => $memberInfo ? $memberInfo['name'] : 'Member #' . $attendance->member_id,
                'member_nik' => $memberInfo ? $memberInfo['nik'] : null,
                'event_title' => $attendance->event?->title ?? 'Event Dihapus',
                'session_title' => $attendance->session ? ($attendance->session->title . ' (' . $attendance->session->date . ')') : null,
                'event_location' => $attendance->event?->location ?? '-',
                'event_date' => $attendance->event?->date ?? null,
                'scan_time' => $attendance->scan_time?->format('d M Y, H:i'),
                'scan_time_raw' => $attendance->scan_time?->toISOString(),
                'status' => $attendance->status,
            ];
        });

        // Ambil semua events beserta sessions untuk filter dropdown
        $events = Event::with('sessions')->orderBy('date', 'desc')->get();

        return Inertia::render('attendance-history/index', [
            'attendances' => $attendanceLogs,
            'events' => $events,
            'filters' => $request->only(['event_id', 'event_session_id', 'status', 'date_from', 'date_to', 'search']),
        ]);
    }

    public function exportPdf(Request $request)
    {
        $rows = $this->buildAttendanceExportRows($request);
        $presentCount = collect($rows)->where('Status', 'Hadir')->count();
        $lateCount = collect($rows)->where('Status', 'Terlambat')->count();
        $eventTitle = $request->filled('event_id') && $request->event_id !== 'all'
            ? Event::whereKey($request->event_id)->value('title')
            : null;

        $pdf = Pdf::loadView('exports.attendance-history', [
            'rows' => $rows,
            'title' => $eventTitle ?: 'Riwayat Kehadiran',
            'presentCount' => $presentCount,
            'lateCount' => $lateCount,
            'generatedAt' => now()->format('d M Y, H:i'),
        ])->setPaper('a4', 'landscape');

        return $pdf->download('attendance-history.pdf');
    }

    public function exportExcel(Request $request)
    {
        $rows = $this->buildAttendanceExportRows($request);

        return Excel::download(new AttendanceHistoryExport($rows), 'attendance-history.xlsx');
    }

    private function buildAttendanceExportRows(Request $request): array
    {
        $query = Attendance::with(['event', 'session'])
            ->orderBy('scan_time', 'desc');

        if ($request->filled('event_id') && $request->event_id !== 'all') {
            $query->where('event_id', $request->event_id);
        }

        if ($request->filled('event_session_id') && $request->event_session_id !== 'all') {
            $query->where('event_session_id', $request->event_session_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('scan_time', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('scan_time', '<=', $request->date_to);
        }

        $attendances = $query->get();

        $memberIds = $attendances->pluck('member_id')->unique()->values()->toArray();
        $members = [];

        if (!empty($memberIds)) {
            try {
                foreach ($this->memberApi->findMany($memberIds) as $member) {
                    $members[$member['idjemaat']] = [
                        'name' => $member['name'],
                        'nik' => $member['nik'],
                    ];
                }
            } catch (\Exception $e) {
                // Jika external DB gagal, tampilkan member_id saja
            }
        }

        return $attendances->map(function ($attendance) use ($members) {
            $memberInfo = $members[$attendance->member_id] ?? null;

            return [
                'ID' => $attendance->id,
                'Nama Jemaat' => $memberInfo ? $memberInfo['name'] : 'Member #' . $attendance->member_id,
                'NIK' => $memberInfo ? $memberInfo['nik'] : '-',
                'Event' => $attendance->event?->title ?? 'Event Dihapus',
                'Sesi Kelas' => $attendance->session?->title ? ($attendance->session->title . ' (' . $attendance->session->date . ')') : '-',
                'Lokasi' => $attendance->event?->location ?? '-',
                'Tanggal Event' => $attendance->event?->date ?? '-',
                'Waktu Scan' => $attendance->scan_time?->format('d M Y, H:i'),
                'Status' => $attendance->status === 'Late' ? 'Terlambat' : 'Hadir',
            ];
        })->toArray();
    }

    // Mode 1: Jemaat buka page scan di HP mereka
    public function showUserScan()
    {
        return Inertia::render('my/scan/index');
    }

    /**
     * Halaman scan kartu member (Admin)
     */
    public function showAdminScan(Request $request)
    {
        $events = Event::with('sessions')->orderBy('date', 'desc')->get();

        if (!$request->has('event_id') && $events->isNotEmpty()) {
            return redirect()->route('scan-qr', ['event_id' => $events->first()->id]);
        }

        $selectedEventId = $request->input('event_id');
        $selectedSessionId = $request->input('event_session_id');
        $selectedEventIdStr = (string) $selectedEventId;

        $recentAttendances = [];
        $totalScanned = 0;

        if ($selectedEventId) {
            $query = Attendance::where('event_id', $selectedEventId);

            if ($selectedSessionId) {
                $query->where('event_session_id', $selectedSessionId);
            }

            $attendances = (clone $query)->orderBy('scan_time', 'desc')
                ->take(10)
                ->get();

            $totalScanned = (clone $query)->count();

            $memberIds = $attendances->pluck('member_id')->unique()->toArray();
            $members = [];

            if (!empty($memberIds)) {
                try {
                    foreach ($this->memberApi->findMany($memberIds) as $member) {
                        $members[$member['idjemaat']] = [
                            'name' => $member['name'],
                        ];
                    }
                } catch (\Exception $e) {
                    // Fail silently
                }
            }

            $recentAttendances = $attendances->map(function ($att) use ($members) {
                return [
                    'id' => $att->id,
                    'name' => $members[$att->member_id]['name'] ?? 'Member #' . $att->member_id,
                    'time' => $att->scan_time->diffForHumans(),
                    'status' => $att->status,
                ];
            });
        }

        return Inertia::render('scan-qr/index', [
            'events' => $events,
            'recentScans' => $recentAttendances,
            'totalScanned' => $totalScanned,
            'filters' => [
                'event_id' => $selectedEventIdStr,
                'event_session_id' => $selectedSessionId,
            ]
        ]);
    }

    public function showAttendanceMonitor(Request $request)
    {
        $events = Event::with('sessions')->orderBy('date', 'desc')->get();
        $selectedEventId = $request->input('event_id', $events->first()?->id);
        $selectedSessionId = $request->input('event_session_id');
        $recentScans = collect();
        $totalScanned = 0;

        if ($selectedEventId) {
            $query = Attendance::where('event_id', $selectedEventId);

            if ($selectedSessionId) {
                $query->where('event_session_id', $selectedSessionId);
            }

            $attendances = (clone $query)->orderBy('scan_time', 'desc')->take(30)->get();
            $totalScanned = (clone $query)->count();
            $members = $this->memberApi->findMany($attendances->pluck('member_id')->unique());

            $recentScans = $attendances->map(function (Attendance $attendance) use ($members) {
                $member = $members[(string) $attendance->member_id] ?? null;

                return [
                    'id' => $attendance->id,
                    'member_id' => (string) $attendance->member_id,
                    'name' => $member['name'] ?? 'Member #'.$attendance->member_id,
                    'foto_url' => $member['foto_url'] ?? null,
                    'time' => $attendance->scan_time?->format('H:i:s'),
                    'status' => $attendance->status,
                ];
            })->values();
        }

        return Inertia::render('attendance-monitor/index', [
            'events' => $events,
            'recentScans' => $recentScans,
            'totalScanned' => $totalScanned,
            'filters' => [
                'event_id' => (string) $selectedEventId,
                'event_session_id' => (string) ($selectedSessionId ?? ''),
            ],
        ]);
    }

    public function showEventScan(Event $event)
    {
        $event->load('sessions');
        return Inertia::render('my/scan/index', [
            'event' => $event,
            'qr_value' => route('attendance.scan-event', $event)
        ]);
    }

    public function scanEventQr(Request $request, Event $event)
    {
        $user = $request->user();

        if (!$user->member_id) {
            return back()->with('error', 'Akun Anda belum terhubung dengan data jemaat. Silakan hubungi admin.');
        }

        $sessionId = $request->input('event_session_id');

        // Auto-match session by date if event is class_participant and session not specified
        if (!$sessionId && $event->attendance_type === 'class_participant') {
            $matchedSession = $event->sessions()->whereDate('date', now()->toDateString())->first();
            if ($matchedSession) {
                $sessionId = $matchedSession->id;
            }
        }

        $query = Attendance::where('event_id', $event->id)
            ->where('member_id', $user->member_id);

        if ($sessionId) {
            $query->where('event_session_id', $sessionId);
        }

        if ($query->exists()) {
            return back()->with('info', 'Anda sudah melakukan absensi untuk sesi ini.');
        }

        $compareTime = $event->attendance_start_time ?? $event->time;
        $eventDateTime = \Carbon\Carbon::parse($event->date . ' ' . $compareTime)->addMinute();
        $status = now()->greaterThan($eventDateTime) ? 'Late' : 'Present';

        Attendance::create([
            'event_id' => $event->id,
            'event_session_id' => $sessionId,
            'member_id' => $user->member_id,
            'scan_time' => now(),
            'status' => $status,
        ]);

        $message = $status === 'Late' ? 'Absensi dicatat (Terlambat).' : 'Absensi berhasil dicatat!';
        return back()->with('success', $message);
    }

    public function scanMemberQr(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'event_session_id' => 'nullable|exists:event_sessions,id',
            'scan' => 'required|string',
        ]);

        $scan = trim($request->scan);
        $member = $this->memberApi->findByScan($scan);

        if (!$member) {
            return back()->with('error', 'QR Code tidak dikenali. Pastikan kartu member valid. (Kode: ' . $scan . ')');
        }

        $sessionId = $request->input('event_session_id');
        $event = Event::find($request->event_id);

        if (!$sessionId && $event->attendance_type === 'class_participant') {
            $matchedSession = $event->sessions()->whereDate('date', now()->toDateString())->first();
            if ($matchedSession) {
                $sessionId = $matchedSession->id;
            }
        }

        $query = Attendance::where('event_id', $request->event_id)
            ->where('member_id', $member['idjemaat']);

        if ($sessionId) {
            $query->where('event_session_id', $sessionId);
        }

        if ($query->exists()) {
            return back()->with('info', $member['name'] . ' sudah tercatat hadir untuk sesi/event ini.');
        }

        $compareTime = $event->attendance_start_time ?? $event->time;
        $eventDateTime = \Carbon\Carbon::parse($event->date . ' ' . $compareTime)->addMinute();
        $status = now()->greaterThan($eventDateTime) ? 'Late' : 'Present';

        Attendance::create([
            'event_id' => $request->event_id,
            'event_session_id' => $sessionId,
            'member_id' => $member['idjemaat'],
            'scan_time' => now(),
            'status' => $status,
        ]);

        $message = $status === 'Late'
            ? 'Kehadiran ' . $member['name'] . ' dicatat (Terlambat).'
            : 'Kehadiran berhasil dicatat untuk ' . $member['name'];

        return back()->with('success', $message);
    }
}
