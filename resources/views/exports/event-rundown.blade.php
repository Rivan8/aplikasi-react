@php
    $monthNames = [1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    $dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    $eventDate = ! empty($event['date']) ? \Carbon\Carbon::parse($event['date']) : null;
    $dateLabel = $eventDate
        ? $dayNames[$eventDate->dayOfWeek].', '.$eventDate->day.' '.$monthNames[$eventDate->month].' '.$eventDate->year
        : '-';

    $timeLabel = ! empty($event['time']) ? substr((string) $event['time'], 0, 5) : '-';

    $formatDuration = function (int $seconds): string {
        return intdiv($seconds, 60).':'.str_pad((string) ($seconds % 60), 2, '0', STR_PAD_LEFT);
    };

    $formatDurationLong = function (int $seconds): string {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);

        if ($hours > 0 && $minutes > 0) {
            return $hours.' jam '.$minutes.' menit';
        }

        if ($hours > 0) {
            return $hours.' jam';
        }

        return $minutes.' menit';
    };

    $totalSeconds = (int) ($report['total_seconds'] ?? 0);
    $rangeLabel = ($report['start_time'] ?? null) && ($report['end_time'] ?? null)
        ? $report['start_time'].' - '.$report['end_time']
        : '-';
@endphp
<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Rundown - {{ $event['title'] }}</title>
    <style>
        @page {
            margin: 12px 15px 12px 15px;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 8pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .container { width: 100%; }

        /* Top Header Card */
        .header-card {
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 10px;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: middle; border: 0; padding: 0; }
        .eyebrow {
            color: #38bdf8;
            font-size: 6.5pt;
            font-weight: bold;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .header-title {
            font-size: 13pt;
            font-weight: bold;
            color: #ffffff;
            margin: 0;
            line-height: 1.2;
        }
        .header-subtitle {
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 3px;
            line-height: 1.5;
        }
        .header-badge {
            background-color: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 5px 10px;
            text-align: right;
            font-size: 8pt;
            font-weight: bold;
            color: #e2e8f0;
        }

        /* Summary Stats Cards */
        .stats-table { width: 100%; border-collapse: collapse; margin-bottom: 9px; }
        .stats-table td { width: 25%; padding: 0 4px; border: 0; vertical-align: top; }
        .stats-table td:first-child { padding-left: 0; }
        .stats-table td:last-child { padding-right: 0; }

        .stat-card {
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            background-color: #f8fafc;
            padding: 6px 10px;
        }
        .stat-label {
            font-size: 6pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-value {
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
        }
        .stat-sub { font-size: 6.5pt; color: #64748b; margin-top: 1px; }

        .stat-card.segments { border-left: 4px solid #4f46e5; background-color: #eef2ff; }
        .stat-card.segments .stat-value { color: #4338ca; }
        .stat-card.items { border-left: 4px solid #0284c7; background-color: #f0f9ff; }
        .stat-card.items .stat-value { color: #0369a1; }
        .stat-card.duration { border-left: 4px solid #059669; background-color: #f0fdf4; }
        .stat-card.duration .stat-value { color: #047857; }
        .stat-card.range { border-left: 4px solid #d97706; background-color: #fffbeb; }
        .stat-card.range .stat-value { color: #b45309; font-size: 10pt; }

        /* Rundown Table */
        table.rundown-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
        table.rundown-table th, table.rundown-table td {
            border: 1px solid #cbd5e1;
            padding: 4px 5px;
            vertical-align: middle;
        }
        table.rundown-table th {
            background-color: #1e293b;
            color: #ffffff;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: center;
            padding: 5px;
        }
        .th-no { width: 26px; }
        .th-time { width: 74px; }
        .th-duration { width: 52px; }
        .th-title { text-align: left !important; }

        tr.segment-row td {
            background-color: #eef2ff;
            font-weight: bold;
            color: #312e81;
        }
        .td-center { text-align: center; }
        .td-duration { text-align: center; font-weight: bold; color: #4338ca; }

        tr.item-row td { background-color: #ffffff; color: #334155; }
        tr.item-row td.item-title { padding-left: 20px; }
        .item-bullet { color: #94a3b8; margin-right: 4px; }
        .song-tag {
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            border: 1px solid #bae6fd;
            border-radius: 3px;
            padding: 0 4px;
            font-size: 6.5pt;
            font-weight: bold;
            margin-right: 4px;
        }
        .item-meta { font-size: 6.5pt; color: #64748b; margin-top: 1px; }
        .item-duration { text-align: center; color: #64748b; }

        table.rundown-table tfoot td {
            background-color: #e2e8f0;
            font-weight: bold;
            color: #0f172a;
            padding: 5px;
        }
        .tf-label { text-align: right !important; }
        .tf-total { text-align: center !important; color: #4338ca; }

        .empty-note {
            border: 1px dashed #cbd5e1;
            border-radius: 5px;
            background-color: #f8fafc;
            color: #64748b;
            padding: 18px;
            text-align: center;
            font-size: 8pt;
        }

        .footer-note {
            margin-top: 8px;
            font-size: 6.5pt;
            color: #94a3b8;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Top Header Banner -->
        <div class="header-card">
            <table class="header-table">
                <tr>
                    <td>
                        <div class="eyebrow">Sistem Absensi Jemaat &bull; Laporan Rundown Event</div>
                        <div class="header-title">LAPORAN RUNDOWN EVENT</div>
                        <div class="header-subtitle">
                            <strong style="color:#e2e8f0;">{{ $event['title'] }}</strong>
                            <br>
                            {{ $dateLabel }} &bull; {{ $timeLabel }} WIB
                            @if(! empty($event['location']))
                                &nbsp;|&nbsp; Lokasi: {{ $event['location'] }}
                            @endif
                            @if(! empty($event['category']))
                                &nbsp;|&nbsp; Kategori: {{ $event['category'] }}
                            @endif
                            <br>
                            Dibuat: {{ $generatedAt }}
                        </div>
                    </td>
                    <td style="width: 120px;" align="right">
                        <div class="header-badge">
                            {{ $dateLabel !== '-' ? strtoupper($eventDate->format('d/m/Y')) : 'RUNDOWN' }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Summary Stat Cards -->
        <table class="stats-table">
            <tr>
                <td>
                    <div class="stat-card segments">
                        <div class="stat-label">Total Segmen</div>
                        <div class="stat-value">{{ $report['total_segments'] ?? 0 }}</div>
                    </div>
                </td>
                <td>
                    <div class="stat-card items">
                        <div class="stat-label">Mata Acara</div>
                        <div class="stat-value">{{ $report['total_items'] ?? 0 }}</div>
                    </div>
                </td>
                <td>
                    <div class="stat-card duration">
                        <div class="stat-label">Durasi Rencana</div>
                        <div class="stat-value">{{ $formatDuration($totalSeconds) }}</div>
                        <div class="stat-sub">{{ $formatDurationLong($totalSeconds) }}</div>
                    </div>
                </td>
                <td>
                    <div class="stat-card range">
                        <div class="stat-label">Rentang Waktu</div>
                        <div class="stat-value">{{ $rangeLabel }}</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Rundown Table -->
        <table class="rundown-table">
            <thead>
                <tr>
                    <th class="th-no">No</th>
                    <th class="th-time">Waktu</th>
                    <th class="th-title">Segmen / Mata Acara</th>
                    <th class="th-duration">Durasi</th>
                </tr>
            </thead>
            <tbody>
                @forelse(($report['segments'] ?? []) as $segment)
                    <tr class="segment-row">
                        <td class="td-center">{{ $segment['index'] }}</td>
                        <td class="td-center">{{ $segment['start'] ?? '-' }} - {{ $segment['end'] ?? '-' }}</td>
                        <td>{{ $segment['title'] }}</td>
                        <td class="td-duration">{{ $formatDuration((int) $segment['duration_seconds']) }}</td>
                    </tr>
                    @foreach(($segment['items'] ?? []) as $item)
                        <tr class="item-row">
                            <td class="td-center">&nbsp;</td>
                            <td class="td-center">&nbsp;</td>
                            <td class="item-title">
                                <span class="item-bullet">&bull;</span>{{ $item['title'] }}
                                @if(! empty($item['song_title']))
                                    <div class="item-meta">
                                        <span class="song-tag">Lagu</span>{{ $item['song_title'] }}@if(! empty($item['song_artist'])) &mdash; {{ $item['song_artist'] }}@endif
                                    </div>
                                @endif
                                @if(! empty($item['arrangement_name']))
                                    <div class="item-meta">Aransemen: {{ $item['arrangement_name'] }}</div>
                                @endif
                            </td>
                            <td class="item-duration">{{ $formatDuration((int) $item['duration_seconds']) }}</td>
                        </tr>
                    @endforeach
                @empty
                    <tr>
                        <td colspan="4">
                            <div class="empty-note">Rundown belum tersedia untuk event ini.</div>
                        </td>
                    </tr>
                @endforelse
            </tbody>
            @if(count($report['segments'] ?? []) > 0)
                <tfoot>
                    <tr>
                        <td colspan="3" class="tf-label">TOTAL DURASI RENCANA:</td>
                        <td class="tf-total">{{ $formatDuration($totalSeconds) }}</td>
                    </tr>
                </tfoot>
            @endif
        </table>

        <div class="footer-note">
            Dokumen ini dihasilkan otomatis oleh sistem &bull; {{ $generatedAt }}
        </div>
    </div>
</body>
</html>
