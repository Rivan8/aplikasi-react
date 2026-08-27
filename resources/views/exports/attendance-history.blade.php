<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #111827;
            margin: 0;
            padding: 28px;
        }
        .header {
            border-bottom: 3px solid #0f766e;
            padding-bottom: 14px;
            margin-bottom: 14px;
        }
        .eyebrow {
            color: #0f766e;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }
        h1 {
            font-size: 22px;
            margin: 5px 0 4px;
            color: #0f172a;
        }
        .meta {
            color: #64748b;
            font-size: 9px;
        }
        .summary {
            width: 100%;
            margin: 0 0 16px;
        }
        .summary td {
            border: 0;
            padding: 0 8px 0 0;
            width: 33.33%;
        }
        .stat {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 9px 12px;
        }
        .stat-label {
            color: #64748b;
            font-size: 8px;
            text-transform: uppercase;
        }
        .stat-value {
            color: #0f172a;
            font-size: 17px;
            font-weight: bold;
            margin-top: 3px;
        }
        .present .stat-value { color: #047857; }
        .late .stat-value { color: #b45309; }
        table.report {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .report th, .report td {
            border-bottom: 1px solid #e2e8f0;
            padding: 8px 7px;
            text-align: left;
            vertical-align: middle;
            word-wrap: break-word;
        }
        .report th {
            background: #0f766e;
            color: #ffffff;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .report tbody tr:nth-child(even) {
            background: #f8fafc;
        }
        .status {
            display: inline-block;
            border-radius: 10px;
            padding: 4px 7px;
            font-size: 8px;
            font-weight: bold;
        }
        .status-present { background: #d1fae5; color: #047857; }
        .status-late { background: #fef3c7; color: #b45309; }
        .empty {
            color: #64748b;
            padding: 24px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="eyebrow">Attendance Report</div>
        <h1>{{ $title }}</h1>
        <div class="meta">Dibuat pada {{ $generatedAt }} &nbsp; | &nbsp; Sumber: Sistem Absensi</div>
    </div>

    <table class="summary">
        <tr>
            <td><div class="stat"><div class="stat-label">Total kehadiran</div><div class="stat-value">{{ count($rows) }}</div></div></td>
            <td><div class="stat present"><div class="stat-label">Hadir tepat waktu</div><div class="stat-value">{{ $presentCount }}</div></div></td>
            <td><div class="stat late"><div class="stat-label">Terlambat</div><div class="stat-value">{{ $lateCount }}</div></div></td>
        </tr>
    </table>

    <table class="report">
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama Jemaat</th>
                <th>NIK</th>
                <th>Event</th>
                <th>Lokasi</th>
                <th>Tanggal Event</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    <td>{{ $row['ID'] }}</td>
                    <td>{{ $row['Nama Jemaat'] }}</td>
                    <td>{{ $row['NIK'] }}</td>
                    <td>{{ $row['Event'] }}</td>
                    <td>{{ $row['Lokasi'] }}</td>
                    <td>{{ $row['Tanggal Event'] }}</td>
                    <td>{{ $row['Waktu Scan'] }}</td>
                    <td>{{ $row['Waktu Check-out'] }}</td>
                    <td><span class="status {{ $row['Status'] === 'Terlambat' ? 'status-late' : 'status-present' }}">{{ $row['Status'] }}</span></td>
                </tr>
            @empty
                <tr><td colspan="9" class="empty">Belum ada data kehadiran untuk ditampilkan.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
