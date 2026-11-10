@extends('emails.layouts.app')

@section('title', $messageTitle)
@section('preheader', 'Pesan baru untuk ' . $eventTitle . '.')

@section('content')
    <p style="margin:0 0 8px; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#EA580C;">Pesan Event</p>
    <h1 class="email-title" style="margin:0; font-size:26px; line-height:1.3; font-weight:700; color:#1C1917;">{{ $messageTitle }}</h1>
    <p style="margin:14px 0 0; font-size:15px; line-height:1.7; color:#57534E;">Halo <strong style="color:#292524;">{{ $name }}</strong>, Anda menerima pesan baru untuk event pelayanan berikut:</p>

    <div style="height:22px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7ED; border:1px solid #FFEDD5; border-radius:14px;">
        <tr>
            <td style="padding:18px 24px;">
                <p style="margin:0; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9A3412;">Event</p>
                <p style="margin:6px 0 0; font-size:18px; line-height:1.4; font-weight:700; color:#1C1917;">{{ $eventTitle }}</p>
            </td>
        </tr>
    </table>

    <div style="height:22px;"></div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAFAF9; border-left:4px solid #F97316; border-radius:10px;">
        <tr>
            <td style="padding:20px 22px;">
                <p style="margin:0 0 12px; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9A3412;">Dikirim oleh {{ $senderName }}</p>
                <p style="margin:0; font-size:15px; line-height:1.75; color:#292524;">{!! nl2br(e($messageBody)) !!}</p>
            </td>
        </tr>
    </table>

    @if ($hasAttachment)
        <p style="margin:18px 0 0; font-size:13px; line-height:1.6; color:#78716C;">Lampiran: <strong style="color:#57534E;">{{ $attachmentName ?: 'Berkas terlampir' }}</strong></p>
    @endif

    <div style="height:28px;"></div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
        <tr>
            <td align="center" bgcolor="#EA580C" style="border-radius:10px;">
                <a href="{{ $actionUrl }}" target="_blank" style="display:inline-block; padding:14px 30px; font-size:15px; font-weight:700; line-height:1.2; color:#FFFFFF; text-decoration:none; border-radius:10px;">Buka Event Saya</a>
            </td>
        </tr>
    </table>

    <p style="margin:16px 0 30px; text-align:center; font-size:13px; line-height:1.6; color:#78716C;">Anda bisa membaca pesan ini kapan saja melalui halaman <strong style="color:#57534E;">Event Saya</strong>.</p>
@endsection
