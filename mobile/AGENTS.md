---
name: aplikasi-mobile-agents
description: 'Use when developing the native mobile client for the Aplikasi React Laravel backend.'
---

# Aplikasi Mobile Agent Guide

## Tujuan

Aplikasi mobile adalah client untuk sistem event, pelayanan volunteer, dan absensi. Backend utama tetap berada di Laravel pada folder induk. Jangan memindahkan aturan bisnis ke mobile jika aturan tersebut seharusnya dijaga backend.

## Wajib Dibaca Sebelum Coding

1. `../AGENTS.md`
2. `../PROJECT_MAP.md`
3. `../docs/mobile-api.md`
4. Route dan controller backend yang terkait fitur yang sedang dikerjakan

Jangan menganggap semua route pada `../routes/web.php` sebagai REST API. Route web saat ini memakai Inertia dan session cookie. Client native hanya boleh memakai endpoint yang ditandai `Mobile API: READY` di dokumentasi API.

## Aturan Integrasi

- Gunakan base URL dari environment, bukan URL yang ditulis permanen di source code.
- Simpan access token secara aman menggunakan secure storage platform.
- Jangan menyimpan API key `MYESC_MEMBER_API_KEY` di aplikasi mobile. Key tersebut hanya untuk server Laravel.
- Jangan mengakses database utama atau database eksternal langsung dari mobile.
- Semua data member harus diperoleh melalui backend Laravel.
- Perlakukan `member_id` sebagai identifier string; jangan mengandalkan integer karena berasal dari sistem eksternal.
- Tangani status `401`, `403`, `404`, `409`, `422`, `429`, dan `5xx` secara terpisah.
- Jangan menganggap request absensi aman hanya karena tombol di mobile dinonaktifkan. Backend harus memvalidasi user, event, sesi, dan duplikasi.
- Untuk retry jaringan, hanya ulangi request yang idempotent atau memiliki idempotency key.

## Modul Mobile

Urutan implementasi yang disarankan:

1. Login dan pemulihan sesi.
2. Profil user dan status hubungan ke member.
3. Daftar event dan detail event.
4. Scan QR event untuk check-in dan check-out.
5. Riwayat absensi milik user.
6. Jadwal volunteer, pesan event, dan notifikasi.

Admin scanner kartu, pengelolaan event, rundown, dan master data tetap dianggap fitur admin. Jangan memasukkannya ke aplikasi jemaat tanpa requirement dan authorization yang jelas.

## Struktur Client yang Disarankan

```text
mobile/
  app/                 # Screen dan navigation
  components/          # Komponen UI yang dapat digunakan ulang
  features/            # Modul auth, events, attendance, volunteer
  services/            # HTTP client dan API service
  storage/             # Secure token/session storage
  types/               # Tipe response API
  config/              # Environment dan runtime config
  tests/
```

Nama folder dapat mengikuti framework mobile yang dipilih, tetapi batas modul dan kontrak API harus dipertahankan.

## Prosedur AI Saat Mengerjakan Task

Sebelum mengubah file:

1. Baca dokumen wajib dan kontrak endpoint terkait.
2. Nyatakan data yang dibutuhkan screen dan endpoint sumbernya.
3. Pastikan endpoint berstatus `READY`; bila belum, kerjakan backend API terlebih dahulu.
4. Buat perubahan kecil pada satu modul.
5. Tambahkan atau perbarui test.
6. Jalankan lint, typecheck, dan test mobile yang relevan.

Jangan membuat mock permanen yang menyamarkan endpoint backend belum tersedia. Mock hanya boleh dipakai dalam test dan harus diberi nama yang jelas.

## Definition of Done

- Loading, empty, offline, unauthorized, forbidden, validation error, dan server error memiliki state UI.
- QR scanner meminta permission kamera dan dapat dihentikan dengan aman.
- Check-in ganda menampilkan hasil backend, bukan asumsi client.
- Token tidak muncul di log atau error message.
- Request dan response memiliki tipe.
- Test untuk alur sukses dan kegagalan utama tersedia.
- Dokumentasi API diperbarui bila kontrak berubah.
