<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Attendance;
use App\Models\ExternalMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
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
            return back()->withErrors(['error' => 'Akun Anda belum terhubung dengan data jemaat. Silakan hubungi admin.']);
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
            'status' => 'Present', // Bisa dikembangkan berdasarkan jam kedatangan vs $event->time
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

        // Cari member berdasarkan NIK di DB external
        $member = ExternalMember::byNik($request->nik)->first();

        if (!$member) {
            return back()->withErrors(['error' => 'Data jemaat tidak ditemukan untuk NIK: ' . $request->nik]);
        }

        // Cek apakah sudah absen
        $exists = Attendance::where('event_id', $request->event_id)
            ->where('member_id', $member->id) // idjemaat
            ->exists();

        if ($exists) {
            return back()->withErrors(['error' => $member->name . ' sudah tercatat hadir.']);
        }

        Attendance::create([
            'event_id' => $request->event_id,
            'member_id' => $member->id,
            'scan_time' => now(),
            'status' => 'Present',
        ]);

        return back()->with('success', 'Berhasil scan kehadiran untuk ' . $member->name);
    }
}
