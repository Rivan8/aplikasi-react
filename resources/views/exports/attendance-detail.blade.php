<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Detail Kehadiran - {{ $periodLabel }}</title>
    <style>
        @page {
            margin: 14px 16px 16px 16px;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 7pt;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .container {
            width: 100%;
        }

        /* ---------- Top accent + header ---------- */
        .top-accent {
            height: 3px;
            background-color: #4f46e5;
            border-radius: 3px;
            margin-bottom: 12px;
        }
        table.report-header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        table.report-header td {
            border: 0;
            padding: 0;
            vertical-align: top;
        }
        .eyebrow {
            font-size: 6pt;
            font-weight: bold;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            color: #6366f1;
        }
        .eyebrow-dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            background-color: #6366f1;
            border-radius: 3px;
            margin-right: 4px;
        }
        .report-title {
            font-size: 17pt;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: -0.2px;
            margin: 3px 0 2px 0;
            line-height: 1.15;
        }
        .report-subtitle {
            font-size: 7pt;
            color: #64748b;
        }
        .period-cell {
            width: 150px;
            text-align: right;
        }
        table.period-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #e0e7ff;
            background-color: #f5f7ff;
            border-radius: 6px;
        }
        table.period-card td {
            padding: 7px 10px;
            text-align: right;
        }
        .period-label {
            font-size: 5.5pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: #818cf8;
        }
        .period-value {
            font-size: 11pt;
            font-weight: bold;
            color: #4338ca;
            margin-top: 1px;
        }

        /* ---------- Meta strip ---------- */
        .meta-row {
            border-top: 1px solid #eef2f6;
            border-bottom: 1px solid #eef2f6;
            padding: 5px 0;
            margin-bottom: 9px;
            font-size: 6.5pt;
            color: #64748b;
        }
        .meta-label {
            font-weight: bold;
            color: #475569;
        }
        .meta-sep {
            color: #cbd5e1;
            padding: 0 5px;
        }

        /* ---------- Summary cards ---------- */
        table.stats {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 9px;
        }
        table.stats td {
            width: 25%;
            padding: 0 5px 0 0;
            border: 0;
            vertical-align: top;
        }
        table.stats td:last-child {
            padding-right: 0;
        }
        .stat {
            border: 1px solid #e2e8f0;
            border-left: 3px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 9px;
            background-color: #ffffff;
        }
        .stat-label {
            font-size: 5.5pt;
            font-weight: bold;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #94a3b8;
        }
        .stat-value {
            font-size: 13pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 1px;
            line-height: 1.1;
        }
        .stat-unit {
            font-size: 6pt;
            font-weight: normal;
            color: #94a3b8;
        }
        .stat.total { border-left-color: #4f46e5; background-color: #f8faff; }
        .stat.total .stat-value { color: #4338ca; }
        .stat.present { border-left-color: #10b981; background-color: #f6fef9; }
        .stat.present .stat-value { color: #047857; }
        .stat.late { border-left-color: #f43f5e; background-color: #fff8f9; }
        .stat.late .stat-value { color: #be123c; }
        .stat.weeks { border-left-color: #94a3b8; background-color: #fbfcfe; }
        .stat.weeks .stat-value { color: #334155; }

        /* ---------- Legend ---------- */
        .legend {
            margin-bottom: 7px;
            font-size: 6.5pt;
            color: #64748b;
        }
        .legend-title {
            font-weight: bold;
            color: #475569;
            margin-right: 6px;
        }
        .legend-item {
            display: inline-block;
            margin-right: 11px;
        }
        .legend-swatch {
            display: inline-block;
            width: 12px;
            height: 8px;
            margin-right: 3px;
            border-radius: 2px;
            vertical-align: middle;
        }
        .swatch-hadir {
            background-color: #bbf7d0;
            border: 0.5pt solid #4ade80;
        }
        .swatch-late {
            background-color: #fecaca;
            border: 0.5pt solid #f87171;
        }
        .swatch-empty {
            background-color: #ffffff;
            border: 0.5pt solid #cbd5e1;
        }
        .legend-note {
            color: #94a3b8;
        }

        /* ---------- Matrix table ---------- */
        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #dbe3ee;
            font-size: 6.5pt;
        }
        table.matrix-table th,
        table.matrix-table td {
            border-bottom: 1px solid #edf1f7;
            border-right: 1px solid #f4f7fb;
            padding: 3px 1px;
            text-align: center;
            vertical-align: middle;
        }
        table.matrix-table tr {
            page-break-inside: avoid;
        }
        table.matrix-table th {
            font-weight: bold;
        }

        .th-no {
            background-color: #f8fafc;
            color: #94a3b8;
            font-size: 5.5pt;
            width: 20px;
            border-right: 1px solid #e8edf5;
        }
        .th-name {
            background-color: #f8fafc;
            color: #475569;
            text-align: left !important;
            padding-left: 7px !important;
            font-size: 5.5pt;
            letter-spacing: 0.7px;
            width: 150px;
            border-right: 1px solid #e2e8f0;
        }
        .th-month {
            background-color: #eef2ff;
            color: #3730a3;
            font-size: 6.4pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 5px 1px !important;
            border-bottom: 2px solid #ffffff;
        }
        .month-start {
            border-left: 1px solid #ffffff;
        }

        .th-week {
            background-color: #fafcff;
            color: #94a3b8;
            font-size: 5.2pt;
            font-weight: normal;
            letter-spacing: 0.2px;
            padding: 3px 1px !important;
            border-bottom: 1px solid #e2e8f0;
        }
        .th-stat {
            font-size: 5.5pt;
            letter-spacing: 0.4px;
            width: 32px;
            border-left: 1px solid #e2e8f0;
        }
        .th-hadir-hdr {
            background-color: #f0fdf4;
            color: #047857;
        }
        .th-terlambat-hdr {
            background-color: #fff1f2;
            color: #be123c;
        }

        /* Body */
        table.matrix-table tbody tr:nth-child(even) {
            background-color: #f8fafd;
        }
        .week-start {
            border-left: 1px solid #e6ebf3;
        }
        .td-no {
            color: #94a3b8;
            font-size: 5.8pt;
            border-right: 1px solid #eef2f6;
        }
        .td-name {
            text-align: left !important;
            padding-left: 7px !important;
            color: #0f172a;
            font-weight: bold;
            font-size: 6.8pt;
            border-right: 1px solid #e2e8f0;
        }
        .td-name .contact {
            font-size: 5.3pt;
            color: #94a3b8;
            font-weight: normal;
            word-wrap: break-word;
            margin-top: 0.5px;
        }
        .dept-section td {
            background-color: #eef2ff;
            border-left: 3px solid #6366f1;
            border-top: 1px solid #e0e7ff;
            text-align: left !important;
            padding: 5px 7px !important;
            color: #3730a3;
            font-size: 6.3pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }
        .dept-count {
            color: #818cf8;
            font-weight: normal;
            letter-spacing: 0;
            text-transform: none;
            padding-left: 6px;
        }

        /* Indikator kehadiran: warna penuh pada cell + keterangan event kecil */
        .cell-hadir {
            background-color: #bbf7d0 !important;
        }
        .cell-late {
            background-color: #fecaca !important;
        }
        .cell-event {
            display: block;
            font-size: 4.4pt;
            line-height: 1.22;
            font-weight: normal;
            text-align: left;
            letter-spacing: 0;
            padding: 0 2px;
        }
        .cell-event + .cell-event {
            margin-top: 1px;
        }
        .cell-hadir .cell-event {
            color: #065f46;
        }
        .cell-late .cell-event {
            color: #9f1239;
        }
        .cell-empty {
            color: #c3cddb;
            font-size: 8pt;
            line-height: 1;
        }

        .td-hadir-val {
            font-weight: bold;
            color: #94a3b8;
            background-color: #fbfefc;
            font-size: 7pt;
            border-left: 1px solid #e2e8f0;
        }
        .td-hadir-val.has-value {
            color: #047857;
            background-color: #f0fdf4;
        }
        .td-terlambat-val {
            font-weight: bold;
            color: #94a3b8;
            background-color: #fffdfd;
            font-size: 7pt;
            border-left: 1px solid #e2e8f0;
        }
        .td-terlambat-val.has-late {
            color: #be123c;
            background-color: #fff1f2;
        }

        /* Mode rapat: laporan setahun penuh dengan banyak pekan */
        table.matrix-table.compact .th-name {
            width: 130px;
        }
        table.matrix-table.compact .cell-event {
            font-size: 3.8pt;
            line-height: 1.18;
        }
        table.matrix-table.compact .td-name {
            font-size: 6.4pt;
        }

        /* Footer of table */
        table.matrix-table tfoot td {
            background-color: #f8fafc;
            border-top: 1.5px solid #cbd5e1;
            font-weight: bold;
            padding: 5px 3px;
        }
        .tf-label {
            text-align: right !important;
            color: #475569;
            font-size: 5.8pt;
            letter-spacing: 0.4px;
            padding-right: 8px !important;
        }
        .tf-quote {
            text-align: center !important;
            color: #94a3b8;
            font-style: italic;
            font-size: 5.8pt;
            font-weight: normal;
        }
        .tf-hadir {
            color: #047857;
            background-color: #f0fdf4 !important;
            border-left: 1px solid #e2e8f0;
        }
        .tf-terlambat {
            color: #be123c;
            background-color: #fff1f2 !important;
        }

        .empty-state {
            padding: 22px 10px;
            text-align: center;
            color: #94a3b8;
            font-size: 7pt;
        }

        /* ---------- Document footer ---------- */
        table.doc-footer {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        table.doc-footer td {
            border: 0;
            padding: 0;
            font-size: 5.8pt;
            color: #94a3b8;
        }
        .doc-footer-right {
            text-align: right;
        }
    </style>
</head>
<body>
    @php
        $totalWeeks = array_reduce($months, fn ($sum, $m) => $sum + count($m['weeks']), 0);
        $sectionCols = 2 + $totalWeeks + 2;
        $departmentCounts = collect($rows)->countBy(fn ($row) => $row['department'] ?: 'Tanpa Departemen');
    @endphp

    <div class="container">
        <div class="top-accent"></div>

        <table class="report-header">
            <tr>
                <td>
                    <div class="eyebrow"><span class="eyebrow-dot"></span>Sistem Absensi Jemaat</div>
                    <div class="report-title">Laporan Detail Kehadiran</div>
                    <div class="report-subtitle">Rekapitulasi kehadiran jemaat per pekan &middot; {{ $periodLabel }}</div>
                </td>
                <td class="period-cell">
                    <table class="period-card">
                        <tr>
                            <td>
                                <div class="period-label">Periode Laporan</div>
                                <div class="period-value">
                                    {{ $month > 0 ? strtoupper($monthNames[$month]).' '.$year : 'TAHUN '.$year }}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="meta-row">
            <span class="meta-label">Group Event:</span> {{ $groupLabel }}
            @if(count($selectedDepartments) > 0)
                <span class="meta-sep">|</span>
                <span class="meta-label">Departemen:</span> {{ implode(', ', $selectedDepartments) }}
            @endif
            @if($search)
                <span class="meta-sep">|</span>
                <span class="meta-label">Pencarian:</span> &ldquo;{{ $search }}&rdquo;
            @endif
            <span class="meta-sep">|</span>
            <span class="meta-label">Dibuat:</span> {{ $generatedAt }}
        </div>

        <table class="stats">
            <tr>
                <td>
                    <div class="stat total">
                        <div class="stat-label">Total Jemaat</div>
                        <div class="stat-value">{{ $totalJemaat }} <span class="stat-unit">jemaat</span></div>
                    </div>
                </td>
                <td>
                    <div class="stat present">
                        <div class="stat-label">Total Kehadiran</div>
                        <div class="stat-value">{{ $totalHadir }} <span class="stat-unit">absen</span></div>
                    </div>
                </td>
                <td>
                    <div class="stat late">
                        <div class="stat-label">Total Terlambat</div>
                        <div class="stat-value">{{ $totalTerlambat }} <span class="stat-unit">absen</span></div>
                    </div>
                </td>
                <td>
                    <div class="stat weeks">
                        <div class="stat-label">Pekan Ibadah</div>
                        <div class="stat-value">{{ $totalWeeks }} <span class="stat-unit">pekan</span></div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="legend">
            <span class="legend-title">Legenda</span>
            <span class="legend-item"><span class="legend-swatch swatch-hadir"></span> Hadir</span>
            <span class="legend-item"><span class="legend-swatch swatch-late"></span> Terlambat</span>
            <span class="legend-item"><span class="legend-swatch swatch-empty"></span> Tidak hadir / belum absen</span>
            <span class="legend-note">&middot; Keterangan event tercantum di dalam cell</span>
        </div>

        <table class="matrix-table {{ $totalWeeks > 30 ? 'compact' : '' }}">
            <thead>
                <tr>
                    <th rowspan="2" class="th-no">NO</th>
                    <th rowspan="2" class="th-name">NAMA JEMAAT</th>
                    @foreach($months as $mIndex => $month)
                        <th colspan="{{ count($month['weeks']) }}" class="th-month {{ $mIndex > 0 ? 'month-start' : '' }}">
                            {{ strtoupper($monthNames[$month['month']] ?? $month['month']) }}
                        </th>
                    @endforeach
                    <th rowspan="2" class="th-stat th-hadir-hdr">HADIR</th>
                    <th rowspan="2" class="th-stat th-terlambat-hdr">TERLAMBAT</th>
                </tr>
                <tr>
                    @foreach($months as $month)
                        @foreach($month['weeks'] as $week)
                            <th class="th-week {{ $loop->first ? 'week-start' : '' }}">M{{ $week['index'] }}</th>
                        @endforeach
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @php($previousDepartment = null)
                @forelse($rows as $index => $row)
                    @php($currentDepartment = $row['department'] ?: 'Tanpa Departemen')
                    @if($sort === 'departemen' && $currentDepartment !== $previousDepartment)
                        @php($previousDepartment = $currentDepartment)
                        <tr class="dept-section">
                            <td colspan="{{ $sectionCols }}">
                                Departemen &middot; {{ $currentDepartment }}
                                <span class="dept-count">{{ $departmentCounts[$currentDepartment] ?? 0 }} jemaat</span>
                            </td>
                        </tr>
                    @endif
                    <tr>
                        <td class="td-no">{{ $index + 1 }}</td>
                        <td class="td-name">
                            {{ $row['name'] }}
                            @php($contacts = array_filter([$row['email'] ?? null, $row['phone'] ?? null]))
                            @if(count($contacts) > 0)
                                <div class="contact">{{ implode(' • ', $contacts) }}</div>
                            @endif
                        </td>
                        @foreach($months as $month)
                            @foreach($month['weeks'] as $week)
                                @php($status = !empty($week['date']) ? ($row['cells'][$week['date']] ?? null) : null)
                                @php($events = !empty($week['date']) ? ($row['event_details'][$week['date']] ?? []) : [])
                                <td class="{{ $loop->first ? 'week-start' : '' }} {{ $status === 'Present' ? 'cell-hadir' : ($status === 'Late' ? 'cell-late' : '') }}">
                                    @forelse($events as $event)
                                        <span class="cell-event">{{ $event['title'] }}@if(! empty($event['session'])) &middot; {{ $event['session'] }}@endif</span>
                                    @empty
                                        <span class="cell-empty">&ndash;</span>
                                    @endforelse
                                </td>
                            @endforeach
                        @endforeach
                        <td class="td-hadir-val {{ $row['hadir'] > 0 ? 'has-value' : '' }}">{{ $row['hadir'] }}</td>
                        <td class="td-terlambat-val {{ $row['terlambat'] > 0 ? 'has-late' : '' }}">{{ $row['terlambat'] }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="{{ $sectionCols }}" class="empty-state">
                            Belum ada data absensi jemaat untuk periode {{ $periodLabel }}.
                        </td>
                    </tr>
                @endforelse
            </tbody>
            @if(count($rows) > 0)
                <tfoot>
                    <tr>
                        <td colspan="2" class="tf-label">TOTAL KEHADIRAN</td>
                        <td colspan="{{ $totalWeeks }}" class="tf-quote">
                            &ldquo;Kehadiran adalah bentuk tanggung jawab, dan tanggung jawab adalah bagian dari proses menuju keberhasilan.&rdquo;
                        </td>
                        <td class="tf-hadir">{{ $totalHadir }}</td>
                        <td class="tf-terlambat">{{ $totalTerlambat }}</td>
                    </tr>
                </tfoot>
            @endif
        </table>

        <table class="doc-footer">
            <tr>
                <td>Sistem Absensi Jemaat &middot; Laporan Detail Kehadiran &middot; {{ $periodLabel }}</td>
                <td class="doc-footer-right">Dicetak {{ $generatedAt }}</td>
            </tr>
        </table>
    </div>
</body>
</html>
