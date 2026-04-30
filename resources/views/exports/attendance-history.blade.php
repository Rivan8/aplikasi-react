<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            color: #111827;
            margin: 0;
            padding: 24px;
        }
        h1 {
            font-size: 18px;
            margin-bottom: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th, td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
            text-align: left;
        }
        th {
            background: #f3f4f6;
            font-weight: 700;
        }
        tbody tr:nth-child(even) {
            background: #fafafa;
        }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nama Jemaat</th>
                <th>NIK</th>
                <th>Event</th>
                <th>Lokasi</th>
                <th>Tanggal Event</th>
                <th>Waktu Scan</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
                <tr>
                    <td>{{ $row['ID'] }}</td>
                    <td>{{ $row['Nama Jemaat'] }}</td>
                    <td>{{ $row['NIK'] }}</td>
                    <td>{{ $row['Event'] }}</td>
                    <td>{{ $row['Lokasi'] }}</td>
                    <td>{{ $row['Tanggal Event'] }}</td>
                    <td>{{ $row['Waktu Scan'] }}</td>
                    <td>{{ $row['Status'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
