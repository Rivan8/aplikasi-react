# Implementasi Absensi QR Code Dua Arah

Sistem absensi dengan QR Code dua arah telah berhasil diimplementasikan:

1. **Mode 1: Self Check-in (Jemaat Scan QR Event)**
2. **Mode 2: Admin Scan (Petugas Scan Kartu NIK Jemaat)**

Berikut adalah ringkasan perubahan yang telah dilakukan:

## 1. Persiapan & Database

- **Libraries**: Menginstal `react-qr-code` untuk menampilkan QR code dan `html5-qrcode` untuk membaca QR Code dari kamera.
- **Migration**: Menambahkan kolom `member_id` ke dalam tabel `users` untuk menghubungkan akun login jemaat dengan data aslinya di tabel `jemaat` eksternal.
- **Model `User`**: Menambahkan `member_id` ke dalam array `$fillable`.
- **Model `ExternalMember`**: Menambahkan *accessor* `nik` dan *scope* `scopeByNik` untuk memudahkan pencarian NIK dari database eksternal `jemaat`.

## 2. Backend Logic (AttendanceController)

Tiga route baru ditambahkan untuk memproses absensi:
- `GET /my/scan` -> Merender halaman scanner untuk user.
- `POST /attendance/{event}/scan-event` -> Dipanggil saat jemaat men-scan QR Event. Backend memverifikasi `member_id` dari user login, mengecek apakah mereka sudah absen, dan menyimpan kehadiran di tabel `attendances`.
- `POST /attendance/scan-member` -> Dipanggil saat admin/petugas men-scan kartu fisik jemaat (mengandung NIK). Backend mencari member berdasarkan NIK, memverifikasi, dan mencatat absensinya.

## 3. Frontend: Event Dashboard (Mode 1 - Menampilkan QR)

Di halaman `/events`, saya memodifikasi tombol "QR Code" pada setiap kartu event.
- Ketika diklik, modal baru akan muncul menampilkan QR Code asli (bukan lagi *placeholder*).
- QR Code ini di-generate dari *URL endpoint* absensi khusus untuk event tersebut: `https://[domain-anda]/attendance/{id_event}/scan-event`.

## 4. Frontend: Mobile Scanner (Mode 1 - User Membaca QR)

Halaman baru `/my/scan` telah dibuat.
- Menggunakan layout minimalis ala mobile app (tanpa sidebar admin).
- Akan mengecek apakah akun login jemaat sudah memiliki `member_id`. Jika belum, akan muncul peringatan.
- Jika sudah terhubung, jemaat bisa menekan tombol "Buka Kamera", dan UI akan berubah menjadi scanner kamera *live*.
- Saat jemaat menyorot QR Code dari layar presentasi/admin, aplikasi otomatis mengekstrak URL dan mengirimkan request `POST` untuk absensi.
- Hasil (Berhasil / Sudah Absen / Error) ditampilkan dengan animasi UI yang rapi.

## 5. Frontend: Admin Scanner (Mode 2 - Admin Membaca Kartu NIK)

Halaman `/scan-qr` yang sebelumnya statis telah disulap menjadi scanner fungsional.
- Ditambahkan sebuah **Dropdown** di atas agar petugas dapat memilih event mana yang sedang aktif diselenggarakan.
- Tombol "Mulai Scan Kartu" akan menghidupkan kamera.
- Saat kartu ID (mengandung string NIK) diarahkan ke kamera, aplikasi langsung mengirim request absensi ke server secara asinkron.
- Setelah sukses, scanner akan berhenti sesaat (2 detik) lalu menyala kembali untuk anggota berikutnya, sembari menampilkan riwayat "Recent Scans" anggota yang baru saja berhasil di-scan.

---

> [!NOTE]
> **Tugas Anda Selanjutnya:**
> Untuk *Mode 1 (Self Scan)*, pastikan Anda menambahkan UI/Form di menu Profil/Pengaturan agar *User* (yang mendaftar/login secara umum) dapat menautkan akun mereka dengan data jemaat (mengisi field `users.member_id`), atau hal ini bisa dilakukan manual oleh Admin di menu Users.
