@extends('emails.layouts.app')

@section('title', 'Jadwal pelayanan baru')
@section('preheader', 'Anda dijadwalkan sebagai ' . $roleName . ' untuk ' . $eventTitle . '.')

@section('content')
    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#EA580C;">Penjadwalan Pelayanan</p>
    <h1 class="email-title" style="margin:0; font-size:26px; line-height:1.3; font-weight:700; color:#1C1917;">Jadwal pelayanan baru untuk Anda</h1>
    <p style="margin:14px 0 0; font-size:15px; line-height:1.7; color:#57534E;">Halo <strong style="color:#292524;">{{ $name }}</strong>, Anda mendapat penugasan baru. Berikut detail pelayanan Anda:</p>

    <div style="height:22px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7ED; border:1px solid #FFEDD5; border-radius:14px;">
        <tr>
            <td style="padding:22px 24px;">
                <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9A3412;">Event</p>
                <p style="margin:6px 0 0; font-size:20px; line-height:1.35; font-weight:700; color:#1C1917;">{{ $eventTitle }}</p>

                <div style="height:18px;"></div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td class="email-stack" width="50%" valign="top" style="width:50%; padding:0 10px 14px 0;">
                            <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#A8A29E;">Peran</p>
                            <p style="margin:4px 0 0; font-size:15px; line-height:1.5; font-weight:600; color:#292524;">{{ $roleName }}</p>
                        </td>
                        <td class="email-stack" width="50%" valign="top" style="width:50%; padding:0 0 14px 10px;">
                            <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#A8A29E;">Tanggal</p>
                            <p style="margin:4px 0 0; font-size:15px; line-height:1.5; font-weight:600; color:#292524;">{{ $eventDate }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-stack" width="50%" valign="top" style="width:50%; padding:0 10px 0 0;">
                            <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#A8A29E;">Waktu</p>
                            <p style="margin:4px 0 0; font-size:15px; line-height:1.5; font-weight:600; color:#292524;">{{ $eventTime }}</p>
                        </td>
                        <td class="email-stack" width="50%" valign="top" style="width:50%; padding:0 0 0 10px;">
                            <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#A8A29E;">Lokasi</p>
                            <p style="margin:4px 0 0; font-size:15px; line-height:1.5; font-weight:600; color:#292524;">{{ $eventLocation }}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div style="height:16px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7ED; border:1px solid #FED7AA; border-radius:14px;">
        <tr>
            <td style="padding:18px 24px;">
                <p style="margin:0 0 10px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9A3412;">Pengingat Kehadiran</p>
                <p style="margin:0 0 6px; font-size:15px; line-height:1.6; color:#292524;">Wajib hadir dan melakukan absen kehadiran sebelum pukul <strong style="color:#C2410C;">{{ $attendanceTime }}</strong></p>
                <p style="margin:0; font-size:15px; line-height:1.6; color:#292524;">Doa Persiapan pukul <strong style="color:#C2410C;">{{ $attendanceTime }}</strong></p>
            </td>
        </tr>
    </table>

    <div style="height:28px;"></div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
        <tr>
            <td align="center" bgcolor="#EA580C" style="border-radius:10px;">
                <a href="{{ $actionUrl }}" target="_blank" style="display:inline-block; padding:14px 30px; font-size:15px; font-weight:700; line-height:1.2; color:#FFFFFF; text-decoration:none; border-radius:10px;">Lihat Jadwal Saya</a>
            </td>
        </tr>
    </table>

    <p style="margin:16px 0 30px; text-align:center; font-size:13px; line-height:1.6; color:#78716C;">Silakan buka halaman <strong style="color:#57534E;">Event Saya</strong> untuk menerima atau menolak penugasan ini.</p>
@endsection
