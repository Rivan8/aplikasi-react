# Project Map: Aplikasi React

Dokumen ini adalah konteks ringkas untuk AI dan developer. Baca file ini sebelum menelusuri file lain.

Untuk pengembangan aplikasi native, baca juga [mobile/AGENTS.md](mobile/AGENTS.md) dan [docs/mobile-api.md](docs/mobile-api.md). Backend saat ini belum memiliki REST API/token mobile; route Inertia/web tidak boleh langsung dianggap kontrak API native.

## 1. Identitas Proyek

Aplikasi monolith Laravel + React untuk:

- Manajemen event.
- Absensi member melalui QR/kartu.
- Monitor absensi real-time.
- Penjadwalan volunteer.
- Rundown event dan live timer.
- Song Bank dan arrangement lagu.
- Pesan volunteer dan lampiran.
- Manajemen kategori event, group kategori, departemen, dan member.

## 2. Tech Stack

- Backend: Laravel 13, PHP 8.3+.
- Frontend: React 19, TypeScript, Vite 8.
- Routing/data transfer: Inertia.js v3.
- Styling: Tailwind CSS 4.
- UI primitives: Radix UI melalui wrapper `resources/js/components/ui`.
- Icons: Lucide React.
- Notifications: Sonner.
- Scanner: `html5-qrcode`.
- QR display: `qrcode.react` dan `react-qr-code`.
- Database: MySQL utama dan MySQL eksternal untuk data member.
- Tests: Pest PHP.
- Package managers: Composer dan npm/pnpm.

## 3. Cara Aplikasi Berjalan

Request utama:

1. Browser membuka route pada `routes/web.php`.
2. Controller mengambil data Eloquent dan service eksternal.
3. Controller mengembalikan `Inertia::render()` dengan props.
4. Page React pada `resources/js/pages` merender props.
5. Mutasi form dilakukan dengan `useForm()` atau `router.post/put/delete`.
6. Backend melakukan redirect kembali dengan flash message.

Tidak ada REST API frontend terpisah untuk fitur utama. Route web adalah sumber halaman sekaligus mutasi.

## 4. Struktur Folder Penting

```text
app/
  Http/Controllers/       Controller halaman dan mutasi.
  Models/                 Model Eloquent.
  Services/               Service eksternal, terutama MemberApiService.
  Actions/Fortify/        Action autentikasi Fortify.
  Concerns/               Validation rules reusable.
  Exports/                Export absensi PDF/Excel.

resources/js/
  app.tsx                 Entry Inertia dan pemetaan layout.
  pages/                  Page React berdasarkan nama Inertia.
  pages/my/               Halaman user/jemaat: kegiatan, riwayat, live rundown.
  components/ui/          Wrapper Radix/Tailwind.
  components/app-*.tsx    Sidebar, header, layout navigation.
  components/mobile-bottom-nav.tsx  Bottom navigation mobile user/jemaat.
  layouts/                App, auth, settings layout.
  hooks/                  Hook UI/application.
  lib/                    Utility frontend.
  types/                  Tipe navigation dan UI.

routes/
  web.php                 Route web utama dan endpoint mutasi.
  settings.php            Route profile, password, appearance, 2FA.
  console.php             Console commands.

database/
  migrations/             Skema dan evolusi database.
  seeders/                Data seed.
  factories/              Factory test.

tests/
  Feature/                Test request/auth/fitur.
  Unit/                   Test unit.

public/build/              Output production Vite. Jangan edit manual.
AGENTS.md                  Panduan agent yang lebih panjang.
mobile/AGENTS.md           Panduan client native mobile.
mobile/PROMPT_AI.md        Template prompt AI untuk client React Native.
docs/mobile-api.md         Status dan target kontrak API mobile.
```

## 5. Entry Point Frontend dan Layout

`resources/js/app.tsx` memetakan nama page Inertia ke layout:

- `attendance-monitor/index`: tanpa layout/sidebar, layar monitor.
- `live-events/time-keeper`: tanpa layout/sidebar, layar timer penuh.
- `scan-qr/index`: tanpa layout/sidebar, layar scanner kedua.
- `auth/login` dan welcome: tanpa layout aplikasi.
- `settings/*`: `AppLayout` lalu `SettingsLayout`.
- Page lain: `AppLayout` dengan sidebar.

Navigation utama berada di:

- `resources/js/components/app-sidebar.tsx`
- `resources/js/components/nav-main.tsx`

`NavItem.newTab = true` menggunakan anchor HTML dengan `target="_blank"`, bukan Inertia `Link`. Saat ini Scan QR Admin dan Monitor Absensi dibuka di tab baru.

## 6. Modul Fitur dan File Pemilik

### Event Management

- Page: `resources/js/pages/events/index.tsx`
- Controller: `app/Http/Controllers/EventController.php`
- Model: `app/Models/Event.php`
- Route: resource `events` pada `routes/web.php`

Tanggung jawab:

- CRUD event.
- Event date/time/location/category.
- Attendance start time.
- Volunteer assignment.
- Participant kelas.
- Rundown segments/items.
- Event image.
- Group/category filtering.
- Event message modal, history, dan attachment.

### User/Jemaat: Pelayanan dan Rundown

- Pages: `resources/js/pages/my/events/index.tsx`, `resources/js/pages/my/live-rundown.tsx`
- Controllers: `app/Http/Controllers/EventController.php`, `app/Http/Controllers/LiveEventController.php`
- Routes: `GET /my/events`, `GET /my/events/{event}/live-rundown`

Perilaku:

- `/my/events` menampilkan seluruh pelayanan yang dijadwalkan, termasuk event yang sudah lewat.
- Dashboard user hanya menampilkan maksimal tiga event mendatang yang memiliki `EventVolunteer.member_id` sama dengan `auth()->user()->member_id`.
- Event yang sudah lewat disembunyikan dari bagian `Event mendatang` Dashboard, tetapi tetap tampil pada `/my/events`.
- Card event menampilkan kategori, status `Jadwal saya`, sesi, status live, dan area `LIVE EVENT` yang dapat diklik untuk membuka modal rundown.
- Modal rundown menampilkan segment, item, durasi, lagu, arrangement, key, BPM, dan birama.
- Halaman live rundown menampilkan item aktif, timer, sequence/song flow, lirik, dan video referensi.
- Timer item menggunakan `item_started_at`, berformat `MM:SS`, dan berubah merah dengan format `-MM:SS` saat overtime.
- Data live di-refresh berkala agar perubahan `Next` dari operator mengubah item aktif dan timer user.
- Screen Wake Lock API digunakan secara best effort agar layar mobile tidak meredup; dukungan browser dan HTTPS diperlukan.

### Navigasi Mobile User

- Component: `resources/js/components/mobile-bottom-nav.tsx`
- Layout: `resources/js/layouts/app/app-sidebar-layout.tsx`
- Header: `resources/js/components/app-sidebar-header.tsx`

Role `user`/`jemaat` pada viewport mobile memakai bottom bar:

```text
Beranda | Event | Absensi | Riwayat | Profil
```

Tombol Absensi berada di tengah, lebih besar, berbentuk lingkaran, dan memiliki background/shadow berbeda. Layout mendapat padding bawah dengan safe-area agar card terakhir tidak tertutup. Admin dan desktop tetap memakai sidebar.

### Notifikasi dan Avatar User

- Shared props: `app/Http/Middleware/HandleInertiaRequests.php`
- Header: `resources/js/components/app-sidebar-header.tsx`
- Routes baca notifikasi: `POST /notifications/schedules/read`, `POST /notifications/messages/read`

Notifikasi terdiri dari jadwal volunteer pending dan pesan event unread. Badge berkurang setelah kategori dibuka dan hilang ketika total menjadi nol. Jadwal yang sudah dibuka disimpan di session `viewed_user_assignment_ids`; pesan menggunakan `EventMessageRead`. Avatar memakai `foto_url` dari `MemberApiService` dan fallback ke inisial jika foto kosong/gagal.

### Category dan Event Group

- Page: `resources/js/pages/category/index.tsx`
- Controller: `app/Http/Controllers/CategoryController.php`
- Models: `Category.php`, `CategoryRole.php`, `EventGroup.php`
- Tables: `categories`, `category_roles`, `event_groups`

Konsep penting:

- `Category` memiliki `name`, `description`, dan `group_name`.
- `group_name` merujuk ke `event_groups.name` untuk kompatibilitas data lama.
- Group dibuat lebih dahulu melalui fungsi Kelola Group.
- Category memilih group melalui dropdown.
- Group tidak boleh dihapus jika masih digunakan kategori.
- Copy kategori menyalin group, description, dan seluruh template role.

Endpoint group/category penting:

- `POST /categories`
- `PUT /categories/{category}`
- `DELETE /categories/{category}`
- `POST /categories/{category}/duplicate`
- `POST /event-groups`
- `DELETE /event-groups/{eventGroup}`

### Absensi Admin

- Page: `resources/js/pages/scan-qr/index.tsx`
- Controller: `app/Http/Controllers/AttendanceController.php`
- Model: `app/Models/Attendance.php`
- Route: `GET /scan-qr`, `POST /attendance/scan-member`

Fitur:

- Scan kamera atau scanner USB.
- Event dan sesi dipilih sebelum scan.
- Hasil scan terbaru.
- Popup nama member setelah scan.
- Halaman tanpa sidebar untuk layar kedua.
- Menu sidebar membuka Scan QR di tab baru.

Status absensi:

- Status dihitung oleh `AttendanceController::attendanceStatus()`.
- Perbandingan memakai waktu scan aktual dengan waktu mulai absensi.
- Prioritas jadwal: `session.attendance_start_time`, `session.start_time`, `event.attendance_start_time`, `event.time`.
- Tepat pada waktu mulai: `Present`.
- Setelah waktu mulai: `Late`.
- Monitor menghitung ulang status lama agar perubahan jadwal event tercermin.

### Monitor Absensi

- Page: `resources/js/pages/attendance-monitor/index.tsx`
- Controller: `AttendanceController::showAttendanceMonitor()`
- Route: `GET /attendance-monitor`

Fitur:

- Menampilkan seluruh scan event/sesi, bukan hanya 30 data.
- Polling data setiap 3 detik.
- Countdown signed sebelum/sesudah waktu mulai.
- Nilai minus dibatasi sampai `-05:00:00`.
- Warna timer berbeda ketika sudah lewat waktu.
- Menu sidebar membuka halaman di tab baru.

### Live Rundown

- Pages:
  - `resources/js/pages/live-events/index.tsx`
  - `resources/js/pages/live-events/time-keeper.tsx`
- Controller: `app/Http/Controllers/LiveEventController.php`
- Models:
  - `EventLiveSession.php`
  - `EventRundownSegment.php`
  - `EventRundownItem.php`
  - `EventRundownSegmentRun.php`
  - `EventRundownItemRun.php`

Alur:

1. `start()` membuat atau reset live session ke segment/item pertama.
2. `item_started_at` dan `segment_started_at` menjadi titik waktu aktif.
3. `next()` mencatat item aktif, lalu menaikkan item index.
4. Item berikutnya selalu mendapat `item_started_at = now()`.
5. `finish()` mencatat item/segment aktif lalu menyelesaikan session.

Aturan timer:

- Timer item menggunakan `item_started_at`, bukan waktu mulai rundown global.
- Overtime item tidak mengurangi durasi item berikutnya.
- `duration_seconds` adalah durasi item dalam detik.
- `overrun_seconds` dapat bernilai negatif/positif sesuai hasil perhitungan backend.

### Song Bank

- Page: `resources/js/pages/songs/index.tsx`
- Controller: `app/Http/Controllers/SongController.php`
- Models: `Song.php`, `SongArrangement.php`
- Routes: resource `songs`, plus route arrangement.

Konsep penting:

- `Song` menyimpan judul dan artist.
- Detail teknis berada di `SongArrangement`.
- Field `keys` berada di `song_arrangements`, bukan `songs`.
- Key dapat berupa satu atau dua key, misalnya `C`, `C-D`, atau `D-E`.
- Form menggunakan input teks uppercase, bukan selector single key.
- Edit arrangement mengisi dan menyimpan `keys` melalui endpoint yang sama.

Endpoint penting:

- `POST /songs/{song}/arrangements`
- `PUT /arrangements/{arrangement}`
- `DELETE /arrangements/{arrangement}`
- `POST /arrangements/{arrangement}/duplicate`
- `GET /arrangements/{arrangement}/pdf`

### Pesan Volunteer

- Page UI: modal pada `resources/js/pages/events/index.tsx`
- Controller: `app/Http/Controllers/EventMessageController.php`
- Model: `app/Models/EventMessage.php`
- Read model: `EventMessageRead.php`
- Route: `POST /event-messages`

Fitur:

- Admin mengirim pesan berdasarkan event.
- History pesan ditampilkan per event.
- Layout modal dua kolom: form kiri, history kanan.
- Attachment disimpan pada public disk di `event-message-attachments`.
- Maksimal attachment 10 MB.
- Format: PDF, dokumen Office, TXT, gambar, ZIP.
- Kolom file: `attachment_path`, `attachment_name`, `attachment_mime`, `attachment_size`.

## 7. Database dan Relasi Utama

Database utama menyimpan event, absensi, kategori, rundown, song, dan user lokal.

Database eksternal `myesc_db` menyimpan data member pada tabel eksternal `jemaat`.

Relasi utama:

```text
Event
  -> EventVolunteer
  -> Attendance
  -> EventSession
  -> EventParticipant
  -> EventRundownSegment
       -> EventRundownItem
            -> Song
            -> SongArrangement
  -> EventMessage

Category
  -> CategoryRole
  -> EventGroup melalui group_name -> name

EventLiveSession
  -> EventRundownSegmentRun
  -> EventRundownItemRun

User
  -> member_id -> ExternalMember.idjemaat
MemberDetail
  -> MemberStatus
  -> Department
```

Migration penting terbaru:

- `2026_08_27_000001_add_attachment_to_event_messages_table.php`
- `2026_08_27_000002_add_group_name_to_categories_table.php`
- `2026_08_27_000003_create_event_groups_table.php`

## 8. Aturan Data yang Harus Dijaga

- `ExternalMember` adalah read-only. Jangan create/update/delete data eksternal.
- Simpan metadata lokal member pada `MemberDetail`.
- `SongArrangement.keys` adalah sumber Key lagu.
- Gunakan relasi/eager loading untuk menghindari N+1.
- Jangan menghapus `EventGroup` yang dipakai kategori.
- Event baru dari kategori harus mengisi `category`; group didapat melalui kategori.
- Attendance `scan_time` harus menggunakan satu timestamp yang sama dengan timestamp perhitungan status.
- Rundown item baru harus reset `item_started_at` saat transisi.
- Attachment upload harus menggunakan `FormData` pada frontend.
- File publik menggunakan disk `public` dan membutuhkan `public/storage` link jika memakai URL `/storage/...`.

## 9. Pola Frontend

Gunakan pola berikut:

```tsx
const { data, setData, post, processing, errors } = useForm({
    title: '',
});

const submit = (event: React.FormEvent) => {
    event.preventDefault();
    post('/target', {
        preserveScroll: true,
    });
};
```

Untuk upload file:

```tsx
const formData = new FormData();
formData.append('title', title);
formData.append('attachment', file);
router.post('/target', formData);
```

Komponen UI umum:

- `Button`, `Card`, `Dialog`, `Select`, `Input`, `Textarea`, `Badge`.
- Tooltip dari `@/components/ui/tooltip`.
- Icon dari `lucide-react`.
- Toast dari `sonner`.

## 10. Pola Backend

- Controller mengembalikan Inertia page atau redirect flash.
- Validasi dilakukan dengan `$request->validate()` atau Form Request.
- Model memiliki `$fillable` untuk field yang boleh dimutasi.
- Migration baru harus reversible melalui `down()`.
- Gunakan `Storage::disk('public')` untuk file upload.
- Gunakan transaction bila satu aksi membuat banyak record terkait.
- Route admin biasanya memakai middleware `auth`, `verified`, dan `role:admin,superadmin`.

## 11. Perintah Kerja

Setup:

```bash
composer install
npm install
php artisan key:generate
php artisan migrate --force
php artisan storage:link
npm run build
```

Development:

```bash
composer dev
npm run dev
php artisan serve
```

Validation:

```bash
php -l path/to/file.php
php artisan route:list
php artisan migrate:status
npm run build
npm run types:check
npm run lint:check
php artisan test
```

Catatan: package manager yang terdeteksi pada lingkungan ini adalah npm. `pnpm` tercantum pada panduan lama tetapi tidak selalu tersedia.

## 12. Alur Debugging yang Disarankan

1. Identifikasi page atau route yang dilaporkan.
2. Baca controller pemilik route.
3. Baca model dan migration field yang terkait.
4. Cek props Inertia dan tipe TypeScript.
5. Cari pembatas data seperti `take`, `paginate`, atau filter.
6. Perbaiki code path pemilik perilaku, bukan hanya tampilan.
7. Jalankan validasi paling sempit terlebih dahulu.
8. Jalankan `npm run build` untuk perubahan frontend.
9. Jalankan `php -l` atau test terkait untuk perubahan backend.

## 13. Gotcha yang Sudah Pernah Terjadi

- `router.reload()` Inertia versi ini tidak menerima `preserveState`/`preserveScroll` pada tipe `ReloadOptions`.
- Field `song.keys` tidak benar; gunakan `item.arrangement.keys` atau arrangement pertama.
- `scan_time` dapat berupa `CarbonImmutable`; gunakan `CarbonInterface` pada helper waktu.
- Menu tab baru lebih stabil menggunakan `<a target="_blank">` daripada Inertia `Link`.
- `CardHeader` dengan z-index dapat menutupi tombol overlay pada kartu event; periksa layering dan pointer events.
- Kategori event tidak boleh hanya dibuat dari event yang ada; gunakan master `categories` agar kategori kosong tetap tampil.
- Group filter harus menggunakan master `event_groups`, bukan hanya group yang kebetulan dipakai event.
- Timer rundown harus berbasis `item_started_at`; timer global menyebabkan overtime item sebelumnya mengurangi item berikutnya.

## 14. File Awal yang Dibaca AI

Untuk hampir semua task, mulai dari file ini lalu lompat ke file pemilik fitur:

- `routes/web.php`
- `resources/js/app.tsx`
- Controller yang sesuai fitur.
- Page React yang sesuai nama Inertia.
- Model dan migration terkait.
- `AGENTS.md` untuk detail tambahan.

Dokumen ini adalah peta orientasi, bukan pengganti pemeriksaan code path ketika melakukan perubahan perilaku.
