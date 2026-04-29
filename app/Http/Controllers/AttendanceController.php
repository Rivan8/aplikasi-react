<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Attendance;
use App\Models\ExternalMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Halaman riwayat kehadiran (Attendance History)
     */
    public function history(Request $request)
    {
        $query = Attendance::with('event')
            ->orderBy('scan_time', 'desc');

        // Filter by event
        if ($request->filled('event_id') && $request->event_id !== 'all') {
            $query->where('event_id', $request->event_id);
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
                $externalMembers = ExternalMember::whereIn('idjemaat', $memberIds)->get();
                foreach ($externalMembers as $member) {
                    $members[$member->idjemaat] = [
                        'id' => $member->idjemaat,
                        'name' => $member->name,
                        'nik' => $member->nik,
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
                'event_location' => $attendance->event?->location ?? '-',
                'event_date' => $attendance->event?->date ?? null,
                'scan_time' => $attendance->scan_time?->format('d M Y, H:i'),
                'scan_time_raw' => $attendance->scan_time?->toISOString(),
                'status' => $attendance->status,
            ];
        });

        // Ambil semua events untuk filter dropdown
        $events = Event::orderBy('date', 'desc')->get(['id', 'title', 'date']);

        return Inertia::render('attendance-history/index', [
            'attendances' => $attendanceLogs,
            'events' => $events,
            'filters' => $request->only(['event_id', 'status', 'date_from', 'date_to', 'search']),
        ]);
    }

    // Mode 1: Jemaat buka page scan di HP mereka
    public function showUserScan()
    {
        return Inertia::render('my/scan/index');
    }

    // Mode 1: Jemaat scan QR Event (POST)
    public function scanEventQr(Request $request, Event $event)
    {
        $user = $request->user();

        if (!$user->member_id) {
            return back()->with('error', 'Akun Anda belum terhubung dengan data jemaat. Silakan hubungi admin.');
        }

        // Cek apakah sudah absen
        $exists = Attendance::where('event_id', $event->id)
            ->where('member_id', $user->member_id)
            ->exists();

        if ($exists) {
            return back()->with('info', 'Anda sudah melakukan absensi untuk event ini.');
        }

        Attendance::create([
            'event_id' => $event->id,
            'member_id' => $user->member_id,
            'scan_time' => now(),
            'status' => 'Present',
        ]);

        return back()->with('success', 'Absensi berhasil dicatat!');
    }

    // Mode 2: Admin scan NIK jemaat dari kartu (POST)
    public function scanMemberQr(Request $request)
    {
        $request->validate([
            'event_id' => 'required|exists:events,id',
            'nik' => 'required|string',
        ]);

        $nik = trim($request->nik);

        // Cari member berdasarkan NIK di DB external
        $member = ExternalMember::byNik($nik)->first();

        if (!$member) {
            return back()->with('error', 'QR Code tidak dikenali. Pastikan kartu member valid. (Kode: ' . $nik . ')');
        }

        // Cek apakah sudah absen
        $exists = Attendance::where('event_id', $request->event_id)
            ->where('member_id', $member->id)
            ->exists();

        if ($exists) {
            return back()->with('info', $member->name . ' sudah tercatat hadir di event ini.');
        }

        Attendance::create([
            'event_id' => $request->event_id,
            'member_id' => $member->id,
            'scan_time' => now(),
            'status' => 'Present',
        ]);

        return back()->with('success', 'Kehadiran berhasil dicatat untuk ' . $member->name);
    }
}
