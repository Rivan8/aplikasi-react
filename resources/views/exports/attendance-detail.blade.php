<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Detail Absensi Jemaat - {{ $year }}</title>
    <style>
        @page {
            margin: 12px 15px 12px 15px;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 7.5pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .container {
            width: 100%;
        }

        /* Top Header Card */
        .header-card {
            background-color: #0f172a;
            color: #ffffff;
            border-radius: 6px;
            padding: 10px 14px;
            margin-bottom: 10px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
            border: 0;
            padding: 0;
        }
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
            margin-top: 2px;
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
        .stats-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }
        .stats-table td {
            width: 33.33%;
            padding: 0 4px;
            border: 0;
        }
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
            font-size: 12pt;
            font-weight: bold;
            color: #0f172a;
            margin-top: 2px;
        }
        .stat-card.present {
            border-left: 4px solid #16a34a;
            background-color: #f0fdf4;
        }
        .stat-card.present .stat-value { color: #15803d; }

        .stat-card.late {
            border-left: 4px solid #dc2626;
            background-color: #fef2f2;
        }
        .stat-card.late .stat-value { color: #b91c1c; }

        .stat-card.total {
            border-left: 4px solid #4f46e5;
            background-color: #eef2ff;
        }
        .stat-card.total .stat-value { color: #4338ca; }

        /* Color Legend Bar */
        .legend-bar {
            margin-bottom: 8px;
            font-size: 7pt;
            color: #475569;
        }
        .legend-item {
            display: inline-block;
            margin-right: 12px;
        }

        /* Main Matrix Table */
        table.matrix-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 6.5pt;
        }
        table.matrix-table th, table.matrix-table td {
            border: 1px solid #cbd5e1;
            padding: 2.5px 1px;
            text-align: center;
            vertical-align: middle;
        }
        table.matrix-table th {
            font-weight: bold;
        }

        /* Headers */
        .th-no {
            background-color: #e2e8f0;
            color: #334155;
            width: 16px;
        }
        .th-name {
            background-color: #e2e8f0;
            color: #334155;
            text-align: left !important;
            padding-left: 5px !important;
            width: 110px;
        }
        .th-month {
            color: #ffffff;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 3px 1px !important;
        }
        /* Month Background Header Colors */
        .m-bg-0 { background-color: #0f766e; } /* Teal */
        .m-bg-1 { background-color: #4338ca; } /* Indigo */
        .m-bg-2 { background-color: #0284c7; } /* Sky/Blue */
        .m-bg-3 { background-color: #be123c; } /* Rose */
        .m-bg-4 { background-color: #d97706; } /* Amber */
        .m-bg-5 { background-color: #059669; } /* Emerald */
        .m-bg-6 { background-color: #7c3aed; } /* Violet */
        .m-bg-7 { background-color: #c026d3; } /* Fuchsia */
        .m-bg-8 { background-color: #0891b2; } /* Cyan */
        .m-bg-9 { background-color: #4b5563; } /* Gray */
        .m-bg-10 { background-color: #9333ea; } /* Purple */
        .m-bg-11 { background-color: #1e293b; } /* Slate */

        .th-week {
            background-color: #f1f5f9;
            color: #475569;
            font-size: 6pt;
        }
        .th-stat {
            background-color: #cbd5e1;
            color: #1e293b;
            font-size: 6.5pt;
            width: 28px;
        }
        .th-hadir-hdr { color: #15803d; }
        .th-terlambat-hdr { color: #b91c1c; }

        /* Body Rows */
        table.matrix-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .td-no {
            color: #64748b;
            font-weight: bold;
        }
        .td-name {
            text-align: left !important;
            padding-left: 5px !important;
            color: #0f172a;
            font-weight: bold;
        }
        .td-name .nik {
            font-size: 5.5pt;
            color: #64748b;
            font-weight: normal;
        }

        /* Badges */
        .badge {
            display: inline-block;
            width: 13px;
            height: 13px;
            line-height: 13px;
            text-align: center;
            border-radius: 2px;
            font-size: 6pt;
            font-weight: bold;
        }
        .badge-h {
            background-color: #22c55e;
            color: #ffffff;
        }
        .badge-t {
            background-color: #ef4444;
            color: #ffffff;
        }
        .badge-empty {
            background-color: #ffffff;
            color: #94a3b8;
            border: 1px solid #cbd5e1;
        }

        .td-hadir-val {
            font-weight: bold;
            color: #15803d;
            background-color: #f0fdf4;
        }
        .td-terlambat-val {
            font-weight: bold;
            color: #64748b;
        }
        .td-terlambat-val.has-late {
            color: #b91c1c;
            background-color: #fef2f2;
        }

        /* Footer */
        table.matrix-table tfoot td {
            background-color: #e2e8f0;
            font-weight: bold;
            padding: 4px 3px;
        }
        .tf-label {
            text-align: right !important;
            color: #0f172a;
            padding-right: 6px !important;
        }
        .tf-quote {
            text-align: center !important;
            color: #475569;
            font-style: italic;
            font-size: 6pt;
            font-weight: normal;
        }
        .tf-hadir {
            color: #15803d;
            background-color: #dcfce7 !important;
        }
        .tf-terlambat {
            color: #b91c1c;
            background-color: #fee2e2 !important;
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
                        <div class="eyebrow">Sistem Absensi Jemaat • Laporan Rekapitulasi</div>
                        <div class="header-title">LAPORAN DETAIL KEHADIRAN JEMAAT</div>
                        <div class="header-subtitle">
                            Rekapitulasi pekanan kehadiran jemaat (Januari – Desember {{ $year }}) &nbsp;|&nbsp; Dibuat: {{ $generatedAt }}
                            @if($search)
                                &nbsp;|&nbsp; Filter: &quot;{{ $search }}&quot;
                            @endif
                        </div>
                    </td>
                    <td style="width: 120px;" align="right">
                        <div class="header-badge">
                            TAHUN {{ $year }}
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Summary Stat Cards -->
        <table class="stats-table">
            <tr>
                <td>
                    <div class="stat-card total">
                        <div class="stat-label">Total Jemaat</div>
                        <div class="stat-value">{{ $totalJemaat }} Member</div>
                    </div>
                </td>
                <td>
                    <div class="stat-card present">
                        <div class="stat-label">Total Kehadiran (H)</div>
                        <div class="stat-value">{{ $totalHadir }} Absen</div>
                    </div>
                </td>
                <td>
                    <div class="stat-card late">
                        <div class="stat-label">Total Keterlambatan (T)</div>
                        <div class="stat-value">{{ $totalTerlambat }} Absen</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Color Legend -->
        <div class="legend-bar">
            <strong>Legenda Status:</strong> &nbsp;&nbsp;
            <span class="legend-item"><span class="badge badge-h">H</span> Hadir</span>
            <span class="legend-item"><span class="badge badge-t">T</span> Terlambat</span>
            <span class="legend-item"><span class="badge badge-empty">-</span> Tidak Hadir / Belum Absen</span>
        </div>

        <!-- Main Matrix Table -->
        <table class="matrix-table">
            <thead>
                <!-- Row 1: Month Headers -->
                <tr>
                    <th rowspan="2" class="th-no">NO</th>
                    <th rowspan="2" class="th-name">NAMA JEMAAT</th>
                    @foreach($months as $mIndex => $month)
                        <th colspan="{{ count($month['weeks']) }}" class="th-month m-bg-{{ $mIndex % 12 }}">
                            {{ strtoupper($monthNames[$month['month']] ?? $month['month']) }}
                        </th>
                    @endforeach
                    <th rowspan="2" class="th-stat th-hadir-hdr">HADIR</th>
                    <th rowspan="2" class="th-stat th-terlambat-hdr">TERLAMBAT</th>
                </tr>
                <!-- Row 2: Week Sub-Headers -->
                <tr>
                    @foreach($months as $month)
                        @foreach($month['weeks'] as $week)
                            <th class="th-week">M{{ $week['index'] }}</th>
                        @endforeach
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @forelse($rows as $index => $row)
                    <tr>
                        <td class="td-no">{{ $index + 1 }}</td>
                        <td class="td-name">
                            {{ $row['name'] }}
                            @if(!empty($row['nik']))
                                <div class="nik">NIK: {{ $row['nik'] }}</div>
                            @endif
                        </td>
                        @foreach($months as $month)
                            @foreach($month['weeks'] as $week)
                                @php($status = !empty($week['date']) ? ($row['cells'][$week['date']] ?? null) : null)
                                <td>
                                    @if($status === 'Present')
                                        <span class="badge badge-h">H</span>
                                    @elseif($status === 'Late')
                                        <span class="badge badge-t">T</span>
                                    @else
                                        <span class="badge badge-empty">-</span>
                                    @endif
                                </td>
                            @endforeach
                        @endforeach
                        <td class="td-hadir-val">{{ $row['hadir'] }}</td>
                        <td class="td-terlambat-val {{ $row['terlambat'] > 0 ? 'has-late' : '' }}">{{ $row['terlambat'] }}</td>
                    </tr>
                @empty
                    <tr>
                        @php($totalCols = 2 + array_reduce($months, fn($sum, $m) => $sum + count($m['weeks']), 0) + 2)
                        <td colspan="{{ $totalCols }}" style="padding: 20px; color: #64748b;">
                            Belum ada data absensi jemaat untuk tahun {{ $year }}.
                        </td>
                    </tr>
                @endforelse
            </tbody>
            @if(count($rows) > 0)
                <tfoot>
                    <tr>
                        <td colspan="2" class="tf-label">TOTAL KEHADIRAN:</td>
                        @php($totalWeeksCount = array_reduce($months, fn($sum, $m) => $sum + count($m['weeks']), 0))
                        <td colspan="{{ $totalWeeksCount }}" class="tf-quote">
                            &quot;Kehadiran adalah bentuk tanggung jawab, dan tanggung jawab adalah bagian dari proses menuju keberhasilan.&quot;
                        </td>
                        <td class="tf-stat tf-hadir">{{ $totalHadir }}</td>
                        <td class="tf-stat tf-terlambat">{{ $totalTerlambat }}</td>
                    </tr>
                </tfoot>
            @endif
        </table>
    </div>
</body>
</html>
