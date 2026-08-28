# Kontrak Mobile API

Dokumen ini adalah sumber kebenaran untuk client native. Backend Laravel saat ini terutama menggunakan route web + Inertia. Route web tidak otomatis menjadi REST API.

## Status Saat Ini

| Area | Status | Catatan |
| --- | --- | --- |
| `routes/api.php` | Belum tersedia | Belum ada route REST khusus mobile di repository ini. |
| Token API | Belum tersedia | Sanctum belum dipakai sebagai autentikasi token mobile. |
| Login native | Belum tersedia | Login saat ini diproses Fortify melalui session web dan Inertia. |
| Self check-in | Tersedia sebagai route web | `POST /attendance/{event}/scan-event`, membutuhkan session cookie dan mengembalikan redirect/flash. |
| Admin scan kartu | Tersedia sebagai route web | `POST /attendance/scan-member`, membutuhkan session admin dan mengembalikan redirect/flash. |

Fitur user yang tersedia melalui web belum otomatis menjadi REST API native. Client React Native hanya boleh memakai endpoint yang berstatus `READY`; endpoint web di bawah adalah referensi alur, bukan kontrak native.

Status `READY` di bawah berarti kontrak native sudah disepakati dan endpoint sudah dibuat. Sampai endpoint tersebut ada, AI tidak boleh memanggilnya dari aplikasi mobile.

## Data Domain

- `User` adalah akun lokal Laravel.
- `member_id` menghubungkan user dengan `idjemaat` dari sistem member eksternal.
- `Event` memiliki tanggal, waktu, lokasi, kategori, tipe absensi, dan dapat memiliki beberapa sesi.
- `Attendance` menyimpan `event_id`, optional `event_session_id`, `member_id`, `scan_time`, `check_out_time`, dan status `Present` atau `Late`.
- Data member eksternal bersifat read-only. Mobile tidak boleh membuat atau mengubah data member secara langsung.

## Target Endpoint Native

Endpoint berikut adalah target kontrak. Tambahkan route/controller/request test di backend sebelum memberi status `READY`.

### Auth

`POST /api/mobile/v1/auth/login`

Request:

```json
{
  "login": "email-atau-nomor-telepon",
  "password": "secret"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Nama Member",
      "email": "member@example.com",
      "phone": "081234567890",
      "member_id": "1234567890",
      "role": "jemaat"
    },
    "token": "opaque-token",
    "token_type": "Bearer"
  }
}
```

`POST /api/mobile/v1/auth/logout` - `READY` setelah token API tersedia.

`GET /api/mobile/v1/me` - `READY` setelah token API tersedia. Mengembalikan user yang sedang login dan status `member_id`.

### Events

`GET /api/mobile/v1/events?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1`

Response yang disarankan:

```json
{
  "data": [
    {
      "id": 1,
      "title": "Sunday Service",
      "date": "2026-08-30",
      "time": "09:00:00",
      "location": "Main Hall",
      "address": "Alamat",
      "category": "Ibadah",
      "attendance_type": "volunteer",
      "total_sessions": 1,
      "sessions": []
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 20, "total": 1 }
}
```

`GET /api/mobile/v1/events/{event}` - detail event, termasuk sessions yang boleh dipilih.

### Attendance

`POST /api/mobile/v1/events/{event}/attendance`

Headers:

```text
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
Idempotency-Key: <unique-request-id>
```

Request:

```json
{
  "event_session_id": 12,
  "scan_type": "check_in"
}
```

`scan_type` hanya boleh `check_in` atau `check_out`. Untuk self check-in, backend mengambil `member_id` dari token, bukan dari body mobile.

Response sukses `201` untuk check-in baru:

```json
{
  "message": "Absensi berhasil dicatat.",
  "data": {
    "id": 100,
    "event_id": 1,
    "event_session_id": 12,
    "member_id": "1234567890",
    "scan_time": "2026-08-30T09:02:00+07:00",
    "check_out_time": null,
    "status": "Present"
  }
}
```

Check-in duplikat harus mengembalikan `409` dengan kode `already_checked_in`. Check-out tanpa check-in harus `422` dengan kode `check_in_required`. User tanpa `member_id` harus `422` dengan kode `member_not_linked`.

`GET /api/mobile/v1/me/attendances?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1` - riwayat absensi user yang sedang login.

### Jadwal User dan Rundown

Target endpoint native:

- `GET /api/mobile/v1/me/schedules` - jadwal pelayanan user berdasarkan `member_id` dari token.
- `GET /api/mobile/v1/events/{event}/rundown` - seluruh segment dan item rundown beserta detail lagu/arrangement.
- `GET /api/mobile/v1/events/{event}/live-rundown` - live session, item aktif, `item_started_at`, `duration_seconds`, dan server time.

Aturan data:

- Halaman jadwal user menampilkan seluruh jadwal, termasuk yang sudah lewat.
- Dashboard `upcoming` hanya menampilkan maksimal tiga event yang belum lewat dan ditugaskan kepada user.
- Item live harus menyediakan `current_segment_index`, `current_item_index`, `item_started_at`, dan `duration_seconds`.
- Detail lagu dapat berisi `arrangement_name`, `keys`, `bpm`, `time_signature`, `song_flow`, `lyrics`, dan `video_url`.
- Perubahan item operator dapat dipantau dengan polling, SSE, atau WebSocket. Web memakai polling lima detik sebagai fallback.

### Notifikasi User

Target endpoint native:

- `GET /api/mobile/v1/me/notifications` - jumlah dan daftar notifikasi user.
- `POST /api/mobile/v1/me/notifications/{notification}/read` - membaca satu notifikasi.
- `POST /api/mobile/v1/me/notifications/read-all` - membaca seluruh notifikasi yang diizinkan.

Kategori minimum adalah `schedule_pending` dan `event_message`. Badge dihitung dari status server: jika ada dua notifikasi, membuka satu mengubah total menjadi satu, dan membuka semuanya mengubah total menjadi nol.

### Avatar User

`GET /api/mobile/v1/me` sebaiknya menyediakan field `avatar` nullable. Client memakai foto jika tersedia dan fallback ke inisial jika kosong/gagal. Mobile tidak boleh memanggil service member eksternal langsung atau menyimpan API key server.

## Error Format

Semua endpoint native harus mengembalikan JSON konsisten:

```json
{
  "message": "Penjelasan untuk user atau logika UI.",
  "code": "validation_error",
  "errors": {
    "event_session_id": ["Sesi tidak valid."]
  }
}
```

Kode minimum:

| HTTP | Code | Arti |
| --- | --- | --- |
| 401 | `unauthenticated` | Token tidak ada atau tidak valid. |
| 403 | `forbidden` | User tidak memiliki akses. |
| 404 | `not_found` | Event atau sesi tidak ditemukan. |
| 409 | `already_checked_in` | Absensi check-in sudah ada. |
| 422 | `validation_error` / domain code | Input atau kondisi bisnis tidak valid. |
| 429 | `too_many_requests` | Terlalu banyak request. |
| 5xx | `server_error` | Kesalahan server; jangan tampilkan detail internal. |

## Aturan Keamanan

- Gunakan Laravel Sanctum token atau mekanisme token resmi lain untuk client native.
- Jangan gunakan `MYESC_MEMBER_API_KEY` pada mobile.
- Validasi role dan kepemilikan data di server.
- Rate-limit login dan absensi.
- Gunakan HTTPS pada production.
- Jangan menaruh password, token, atau response sensitif di log.
- Backend tetap melakukan pengecekan member melalui `MemberApiService`.

## Mapping Route Web Lama

Route berikut berguna untuk memahami alur lama, tetapi bukan kontrak REST native:

| Route | Pemilik | Perilaku |
| --- | --- | --- |
| `GET /my/scan` | user login | Merender halaman Inertia scanner. |
| `POST /attendance/{event}/scan-event` | user login | Self check-in/check-out, redirect dengan flash message. |
| `GET /scan-qr` | admin | Merender scanner kartu admin. |
| `POST /attendance/scan-member` | admin | Scan kartu/NIK, redirect dengan flash message. |
| `GET /events` | user login | Merender dashboard event Inertia, bukan JSON API. |
| `GET /my/events` | user login | Merender seluruh pelayanan user, termasuk jadwal yang sudah lewat, bukan JSON API. |
| `GET /my/events/{event}/live-rundown` | user login | Merender presentasi live rundown, bukan JSON API. |
| `POST /notifications/schedules/read` | user/jemaat | Menyimpan jadwal pending yang sudah dibuka pada session web. |
| `POST /notifications/messages/read` | user/jemaat | Menandai pesan event user melalui `EventMessageRead`. |

### Panduan UI Native

- Bottom navigation mobile: Beranda, Event, Absensi di tengah, Riwayat, Profil.
- Tombol Absensi harus lebih menonjol dan konten diberi padding safe-area agar tidak tertutup.
- Modal rundown: timer tetap di header, daftar item dapat di-scroll, item aktif diberi highlight.
- Timer item berformat `MM:SS`; overtime menggunakan warna merah dan awalan `-`.
- Screen Wake Lock adalah kemampuan opsional perangkat dan harus memiliki fallback.

## Checklist Menambah Endpoint

1. Tambahkan route di `routes/api.php` dengan prefix `/api/mobile/v1`.
2. Gunakan middleware token API dan middleware role yang sesuai.
3. Buat Form Request untuk validasi.
4. Kembalikan JSON Resource atau response JSON yang konsisten.
5. Gunakan transaction dan idempotency untuk mutasi absensi.
6. Tambahkan Feature Test untuk sukses, unauthorized, invalid input, duplicate, dan member belum terhubung.
7. Ubah status endpoint dari target menjadi `READY` setelah test lulus.
8. Update tipe response dan service pada client mobile.
