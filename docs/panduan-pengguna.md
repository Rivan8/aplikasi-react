# Panduan Pengguna Attendance Pro

Dokumen ini menjelaskan cara menyiapkan dan menggunakan Attendance Pro, aplikasi manajemen event, pelayanan volunteer, dan absensi anggota berbasis QR Code.

## 1. Gambaran Umum

Attendance Pro digunakan untuk:

- membuat dan mengelola event;
- menyusun kategori event dan kebutuhan volunteer;
- menjadwalkan volunteer dan mengirim pesan terkait event;
- mencatat check-in dan check-out anggota;
- memantau absensi secara langsung;
- melihat riwayat dan mengunduh laporan absensi;
- mengelola peserta kelas, rundown, live event, dan Song Bank;
- menerbitkan artikel dan media;
- mengelola profil, keamanan akun, dan hak akses.

Aplikasi memiliki dua alur penggunaan utama:

1. **Admin atau superadmin** menyiapkan event, menjalankan operasional, dan melihat laporan.
2. **User atau jemaat** melihat jadwal pelayanan, merespons penugasan, melakukan absensi mandiri, dan membaca informasi.

## 2. Persiapan Sistem

### 2.1 Kebutuhan teknis

Untuk menjalankan aplikasi dari source code, siapkan:

- PHP 8.3 atau lebih baru;
- Composer;
- Node.js dan npm/pnpm;
- MySQL;
- browser modern dengan dukungan kamera jika memakai pemindaian QR;
- koneksi ke layanan data anggota eksternal jika fitur anggota dan scan kartu digunakan.

Database utama menyimpan event, absensi, pengguna, kategori, departemen, artikel, lagu, dan data operasional lainnya. Data identitas anggota berasal dari layanan/database eksternal dan dibaca melalui `MemberApiService`.

### 2.2 Instalasi awal untuk pengelola sistem

Di folder proyek, jalankan:

```bash
composer install
npm install
php artisan key:generate
php artisan migrate --force
php artisan storage:link
npm run build
```

Untuk pengembangan lokal, jalankan:

```bash
composer dev
```

Perintah tersebut menjalankan server Laravel, queue worker, dan Vite. Alternatifnya, jalankan server backend dan frontend secara terpisah:

```bash
php artisan serve
npm run dev
```

Contoh URL lokal adalah `http://localhost:8000`.

### 2.3 Konfigurasi penting

Periksa file `.env` dan sesuaikan:

- `APP_URL` untuk alamat aplikasi;
- `DB_*` untuk database utama;
- `MYESC_MEMBER_API_ENABLED` dan variabel `MYESC_*` untuk layanan anggota eksternal;
- `FILESYSTEM_DISK=public` untuk gambar event dan artikel;
- `MAIL_MAILER` untuk verifikasi email dan notifikasi;
- `SESSION_DRIVER=database`, `CACHE_STORE=database`, dan `QUEUE_CONNECTION=database`.

Jangan menyalin API key atau password ke dokumentasi, repository publik, atau tangkapan layar. Pada lingkungan produksi, gunakan HTTPS agar kamera dapat digunakan dan jangan menggunakan konfigurasi debug.

## 3. Hak Akses Pengguna

| Role | Kegunaan utama |
|---|---|
| `superadmin` | Seluruh fitur admin dan pengaturan role pengguna. |
| `admin` | Mengelola event, kategori, departemen, anggota, artikel, absensi, live event, dan Song Bank. |
| `user` | Menggunakan fitur jemaat: dashboard, event saya, absensi mandiri, riwayat, artikel, dan pengaturan. |
| `jemaat` | Role lama yang masih dikenali oleh beberapa tampilan; pada konfigurasi terbaru biasanya digantikan oleh `user`. |

### Menu admin

Admin dan superadmin umumnya melihat:

- Dashboard;
- Scan QR Member (Admin);
- Monitor Absensi;
- Absensi Mandiri;
- Management Event;
- Artikel & Media;
- Live Event;
- Kategori Event;
- Song Bank;
- Attendance History;
- Member List;
- Departemen;
- Settings.

Menu **Scan QR Member (Admin)** dan **Monitor Absensi** dibuka di tab browser baru agar dapat ditampilkan pada layar operasional terpisah.

### Menu user/jemaat

User/jemaat melihat:

- Dashboard;
- Absensi Mandiri;
- Event Saya;
- Riwayat Saya;
- Artikel & Media;
- Settings.

Pada layar mobile tersedia navigasi bawah: **Beranda**, **Event**, **Absensi**, **Riwayat**, dan **Profil**.

## 4. Masuk dan Verifikasi Akun

### 4.1 Registrasi

1. Buka `/register`.
2. Masukkan nama, email, nomor HP bila tersedia, password, dan konfirmasi password.
3. Kirim formulir registrasi.
4. Buka email verifikasi, lalu klik tautan verifikasi.
5. Masuk kembali melalui `/login`.

Jika email belum diterima, buka **Settings > Profile**, lalu gunakan pilihan untuk mengirim ulang email verifikasi. Pada mode lokal, email biasanya ditulis ke log sesuai konfigurasi mail.

### 4.2 Login dan pemulihan akun

1. Buka `/login`.
2. Masukkan kredensial akun.
3. Jika diminta, selesaikan verifikasi dua faktor.
4. Jika lupa password, pilih **Forgot password**, masukkan email, dan ikuti tautan reset.

Pada instalasi yang mengaktifkan autentikasi eksternal, sistem dapat menyinkronkan akun anggota lama ketika login berhasil. Akun tetap membutuhkan `member_id` agar dapat memakai absensi mandiri.

## 5. Alur Awal Admin

Urutan berikut disarankan sebelum membuat event pertama.

### 5.1 Buat departemen

1. Buka **Departemen**.
2. Pilih **Tambah Departemen**.
3. Masukkan nama, misalnya Visual, Worship, Kids, atau Frontline.
4. Simpan.

Departemen dipakai pada template kebutuhan volunteer dan detail anggota.

### 5.2 Buat group dan kategori event

1. Buka **Kategori Event**.
2. Pilih **Kelola Group**, lalu buat group terlebih dahulu.
3. Pilih **Tambah Kategori**.
4. Isi nama dan deskripsi kategori.
5. Pilih group.
6. Tambahkan template role volunteer. Untuk setiap role, pilih departemen dan isi nama posisi.
7. Simpan.

Group harus dibuat sebelum kategori. Group yang masih dipakai kategori tidak dapat dihapus. Kategori juga dapat disalin untuk membuat template baru dengan kebutuhan volunteer yang sama.

### 5.3 Buat event

1. Buka **Management Event**.
2. Pilih **Tambah Event**.
3. Isi judul, tanggal, waktu, lokasi, alamat, kategori, jumlah peserta yang diharapkan, dan waktu mulai absensi.
4. Pilih tipe event:
   - **Volunteer / Pelayanan** untuk event dengan penugasan pelayanan;
   - **Class Participant** untuk event berbasis sesi dan peserta kelas.
5. Tambahkan volunteer sesuai role.
6. Untuk event kelas, tambahkan sesi dan peserta bila diperlukan.
7. Tambahkan rundown, gambar, atau lagu bila diperlukan.
8. Simpan event.

Template role kategori membantu menampilkan kebutuhan volunteer saat event dibuat, tetapi penugasan anggota tetap perlu diperiksa oleh admin.

## 6. Penjadwalan dan Respons Volunteer

### 6.1 Menugaskan volunteer

Admin memilih anggota pada form event, menentukan role, lalu menyimpan event. Jadwal muncul pada dashboard anggota yang memiliki `member_id` sesuai penugasan.

Admin juga dapat mengirim pesan event beserta lampiran melalui fitur pesan pada event.

### 6.2 Respons dari user/jemaat

1. Buka **Dashboard** dan lihat kartu jadwal pelayanan, atau buka **Event Saya**.
2. Pilih jadwal yang sesuai.
3. Pilih **Terima** untuk menerima penugasan.
4. Pilih **Tolak** jika tidak dapat hadir, lalu isi alasan minimal 5 karakter.

Status penugasan biasanya berupa `pending`, `accepted`, atau `declined`. Admin dapat mengganti volunteer; penugasan pengganti kembali ke status `pending`.

## 7. Absensi

Sistem menyediakan dua cara absensi. Pilih satu cara untuk satu alur operasional agar tidak terjadi pemindaian ganda.

### 7.1 Absensi mandiri: user memindai QR event

**Prasyarat:** akun user sudah memiliki `member_id`, kamera tersedia, browser mengizinkan kamera, dan halaman dibuka melalui HTTPS atau `localhost`.

#### Menampilkan QR event

1. Admin membuka **Management Event**.
2. Pilih event yang sedang berlangsung.
3. Pilih tombol **QR Code**.
4. Tampilkan QR Code pada layar admin, presentasi, atau monitor.

#### Check-in atau check-out oleh anggota

1. User membuka **Absensi Mandiri** atau `/my/scan` dari HP.
2. Pilih mode **Check-in** atau **Check-out**.
3. Pilih **Buka Kamera**.
4. Berikan izin kamera saat diminta.
5. Arahkan kamera ke QR event.
6. Tunggu pesan hasil pemindaian.

Check-in pertama dicatat sebagai `Present` jika dilakukan pada atau sebelum waktu mulai absensi. Pemindaian setelah waktu tersebut dicatat sebagai `Late`. Check-out hanya dapat dilakukan setelah check-in. Scan ulang dapat menampilkan pesan bahwa absensi sudah tercatat.

Jika muncul pesan **Akun Belum Terhubung**, admin perlu menghubungkan akun dengan data anggota terlebih dahulu. Tombol penghubungan mandiri pada halaman ini belum menjadi alur aktif, sehingga proses tersebut biasanya dilakukan melalui sinkronisasi atau pengaturan data oleh administrator.

### 7.2 Absensi oleh admin: scan kartu/NIK anggota

1. Admin membuka **Scan QR Member (Admin)**.
2. Pilih event.
3. Pilih sesi jika event memiliki beberapa sesi; gunakan semua sesi bila sesuai.
4. Pilih **Check-in** atau **Check-out**.
5. Pilih mode **Camera** untuk kamera atau **USB** untuk scanner kartu.
6. Mulai pemindaian.
7. Arahkan kartu atau kode NIK anggota ke scanner.
8. Periksa nama, status, dan waktu pada hasil scan.

Scanner berhenti sesaat saat request diproses lalu dapat melanjutkan scan anggota berikutnya. Data terbaru dan total scan diperbarui berkala.

### 7.3 Monitor absensi

1. Buka **Monitor Absensi**.
2. Pilih event dan sesi yang akan dipantau.
3. Tampilkan halaman pada monitor operasional.
4. Pantau jumlah scan, nama anggota, status, dan timer.

Monitor mengambil data berkala sehingga operator dapat membiarkannya terbuka selama acara berlangsung.

### 7.4 Riwayat dan export

Admin membuka **Attendance History** untuk memfilter berdasarkan event, sesi, status, dan rentang tanggal. Gunakan:

- **Export PDF** untuk laporan siap cetak;
- **Export Excel** untuk pengolahan data lebih lanjut.

User/jemaat hanya melihat data sendiri melalui **Riwayat Saya**.

## 8. Live Event dan Rundown

### 8.1 Menyiapkan rundown

Rundown dibuat dari form event dengan menambahkan segment dan item. Setiap item dapat memiliki durasi dan, bila diperlukan, lagu dari Song Bank beserta arrangement.

### 8.2 Menjalankan live event

1. Buka **Live Event**.
2. Pilih event yang memiliki rundown.
3. Tekan **Start** untuk memulai dari segment dan item pertama.
4. Tekan **Next** untuk berpindah ke item berikutnya.
5. Tekan **Finish** setelah seluruh rundown selesai.

Timer berjalan berdasarkan waktu item aktif. Jika item melewati durasinya, timer menampilkan overtime. User/jemaat dapat melihat item aktif melalui **Event Saya** atau halaman live rundown event; halaman tersebut diperbarui otomatis.

### 8.3 Song Bank

1. Buka **Song Bank**.
2. Tambahkan judul dan artis lagu.
3. Tambahkan arrangement.
4. Isi durasi, BPM, key, birama, song flow, lirik, video referensi, atau PDF bila diperlukan.
5. Pilih lagu tersebut saat mengisi item rundown.

Song Bank hanya tersedia untuk admin dan superadmin.

## 9. Peserta Kelas dan Data Anggota

### 9.1 Peserta kelas

Pada event bertipe **Class Participant**, admin dapat menambahkan peserta, mengubah status peserta, dan menghapus peserta. Status peserta dapat digunakan untuk membedakan pendaftar aktif, lulus, atau mengundurkan diri.

### 9.2 Member List

1. Buka **Member List**.
2. Cari berdasarkan ID anggota, nomor kartu/NIK, nama, atau email.
3. Pilih anggota untuk membuka detail.
4. Atur **status anggota** dan **departemen**.
5. Simpan.

Data identitas utama anggota berasal dari sumber eksternal dan bersifat read-only. Perubahan lokal dilakukan pada detail status dan departemen, bukan dengan mengedit data identitas eksternal.

## 10. Artikel dan Media

### Membaca artikel

Semua pengguna login dapat membuka **Artikel & Media**, memilih artikel, lalu membaca isi lengkapnya. Gunakan pagination jika daftar artikel lebih dari satu halaman.

### Membuat artikel

Admin atau superadmin dapat:

1. Buka **Artikel & Media**.
2. Pilih **Buat artikel**.
3. Isi judul, ringkasan, isi, dan gambar jika diperlukan.
4. Tentukan status publikasi.
5. Simpan.

Artikel yang belum dipublikasikan tidak muncul sebagai artikel publik. Ukuran gambar perlu mengikuti validasi aplikasi, yaitu maksimal sekitar 4 MB.

## 11. Pengaturan Akun

### Profile

Buka **Settings > Profile** untuk mengubah nama dan alamat email. Perubahan email dapat memerlukan verifikasi ulang.

### Security

Buka **Settings > Security** untuk mengubah password dan mengatur autentikasi dua faktor jika fitur tersebut tersedia pada akun.

### Appearance

Buka **Settings > Appearance** untuk mengatur tampilan aplikasi.

### Kelola Hak Akses

Hanya superadmin yang dapat membuka **Kelola Hak Akses**. Gunakan halaman ini untuk mengubah role pengguna dengan hati-hati karena role menentukan menu dan tindakan yang tersedia.

## 12. Troubleshooting

| Masalah | Pemeriksaan dan solusi |
|---|---|
| Tidak dapat login | Pastikan email/nomor HP dan password benar. Gunakan reset password atau periksa konfigurasi autentikasi eksternal. |
| Tidak dapat membuka dashboard | Pastikan email sudah diverifikasi dan session database tersedia. |
| Akun tidak dapat absensi mandiri | Pastikan `users.member_id` sudah terisi dan cocok dengan ID anggota eksternal. |
| Kamera ditolak | Izinkan kamera pada browser, gunakan HTTPS atau `localhost`, dan tutup aplikasi lain yang sedang memakai kamera. |
| QR dianggap tidak valid | Pastikan QR berasal dari tombol QR event pada aplikasi dan event yang dipindai memang event yang dimaksud. |
| Anggota tidak ditemukan saat scan kartu | Periksa format scan, koneksi layanan anggota, API key, dan status `MYESC_MEMBER_API_ENABLED`. |
| Event tidak muncul untuk user | Pastikan user memiliki penugasan volunteer dengan `member_id` yang benar. Event mendatang di dashboard hanya menampilkan jadwal yang ditugaskan. |
| Kategori tidak dapat dibuat | Buat group terlebih dahulu, lalu pilih departemen yang valid untuk template role. |
| Gambar tidak tampil | Jalankan `php artisan storage:link` dan pastikan disk public dapat dibaca. |
| Email tidak masuk | Periksa konfigurasi mail. Pada lokal, cek `storage/logs/laravel.log` karena mail dapat diarahkan ke log. |
| Timer live tidak berubah | Pastikan live session sudah di-Start, browser tidak membekukan tab, dan koneksi ke server tetap aktif. |

## 13. Peta Struktur Aplikasi

Attendance Pro adalah monolith Laravel + React dengan Inertia.js. Browser membuka route Laravel, backend mengambil data, lalu halaman React merender data tersebut.

```text
app/
  Http/Controllers/       Controller halaman dan aksi pengguna
  Models/                 Model database Eloquent
  Services/               Integrasi, termasuk data anggota eksternal
  Actions/Fortify/        Proses autentikasi
  Exports/                Export laporan PDF dan Excel
  Notifications/          Notifikasi jadwal dan event

database/
  migrations/             Struktur tabel dan perubahan skema
  seeders/                Data awal seperti role, status, dan departemen
  factories/              Data untuk pengujian

resources/js/
  pages/                  Halaman React yang dipanggil oleh Inertia
  components/             Sidebar, navigasi, dan komponen UI
  layouts/                Layout aplikasi, auth, dan settings
  hooks/                  Hook frontend
  lib/                    Utility frontend
  app.tsx                 Entry point React/Inertia

routes/
  web.php                 Route utama, halaman, dan mutasi web
  settings.php            Route profil, password, dan appearance
  api.php                 Route API yang tersedia

public/
  images/                 Asset publik
  storage                 Link ke file upload public
  build/                  Hasil build Vite, jangan diedit manual

tests/
  Feature/                Pengujian alur HTTP dan fitur
  Unit/                   Pengujian unit
```

File rujukan utama untuk pengelola teknis:

- [routes/web.php](../routes/web.php) untuk daftar route dan pembatasan role;
- [resources/js/components/app-sidebar.tsx](../resources/js/components/app-sidebar.tsx) untuk menu berdasarkan role;
- [app/Http/Controllers/EventController.php](../app/Http/Controllers/EventController.php) untuk event;
- [app/Http/Controllers/AttendanceController.php](../app/Http/Controllers/AttendanceController.php) untuk absensi;
- [app/Services/MemberApiService.php](../app/Services/MemberApiService.php) untuk integrasi anggota;
- [resources/js/pages](../resources/js/pages) untuk halaman antarmuka;
- [docs/mobile-api.md](mobile-api.md) untuk status API mobile.

## 14. Checklist Operasional Event

Sebelum acara:

- [ ] Departemen dan kategori sudah tersedia.
- [ ] Event memiliki tanggal, waktu, lokasi, kategori, dan waktu mulai absensi.
- [ ] Volunteer dan peserta sudah ditugaskan.
- [ ] Rundown dan lagu sudah diperiksa jika acara memakai live event.
- [ ] QR event sudah dibuat dan ditampilkan.
- [ ] Halaman Scan QR Admin dan Monitor Absensi sudah dibuka.
- [ ] Kamera atau scanner USB sudah diuji.

Saat acara:

- [ ] Operator memilih event dan sesi yang benar.
- [ ] Check-in dan check-out dipilih sesuai tindakan.
- [ ] Hasil scan diperiksa secara berkala.
- [ ] Volunteer memeriksa jadwal dan merespons penugasannya.
- [ ] Operator menekan Next pada live rundown sesuai jalannya acara.

Setelah acara:

- [ ] Check-out anggota sudah diproses bila digunakan.
- [ ] Live event sudah di-Finish.
- [ ] Monitor dan scanner ditutup setelah data terakhir masuk.
- [ ] Riwayat absensi diperiksa.
- [ ] Laporan PDF atau Excel diunduh bila diperlukan.
