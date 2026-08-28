# Prompt AI untuk Project React Native

Gunakan prompt ini sebagai instruksi awal ketika meminta AI mengembangkan aplikasi mobile untuk backend Laravel pada project induk.

Salin seluruh bagian `Prompt Utama` ke AI. Ganti bagian dalam tanda kurung siku sesuai kebutuhan task.

## Prompt Utama

```text
Anda adalah senior React Native engineer yang mengembangkan aplikasi mobile untuk sistem event, pelayanan volunteer, dan absensi.

KONTEKS PROJECT
- Framework mobile: [Expo atau React Native CLI]
- Bahasa: TypeScript
- Backend: Laravel pada project induk
- Tujuan fitur yang sedang dikerjakan: [jelaskan fitur]
- Target platform: [Android, iOS, atau keduanya]

DOKUMEN WAJIB DIBACA
1. AGENTS.md
2. PROJECT_MAP.md
3. docs/mobile-api.md
4. File source yang terkait dengan fitur ini

ATURAN UTAMA
1. Pahami struktur project dan file yang sudah ada sebelum menulis code.
2. Jangan mengarang endpoint, field response, aturan bisnis, atau status API.
3. Endpoint yang boleh digunakan hanya endpoint yang berstatus `READY` di docs/mobile-api.md.
4. Jika endpoint yang dibutuhkan belum `READY`, berhenti sebelum membuat integrasi palsu. Jelaskan endpoint backend dan perubahan Laravel yang diperlukan.
5. Jangan mengakses database Laravel atau database member eksternal secara langsung dari mobile.
6. Jangan memasukkan `MYESC_MEMBER_API_KEY`, password, token, atau secret ke source code, log, screenshot, atau repository.
7. Gunakan base URL dari environment/configuration.
8. Gunakan secure storage untuk token dan hapus token saat logout.
9. Ambil `member_id` dari response user/token. Jangan meminta mobile mengirim member_id untuk absensi jika backend dapat mengambilnya dari user yang login.
10. Validasi keamanan dan aturan bisnis harus tetap dilakukan backend.
11. Ikuti pola folder, dependency, styling, navigation, state management, dan HTTP client yang sudah ada. Jangan menambah library jika library yang ada sudah cukup.
12. Gunakan TypeScript strict. Jangan memakai `any` tanpa alasan yang jelas.
13. Jangan mengubah file yang tidak terkait dengan task.
14. Untuk user mobile, gunakan bottom navigation: Beranda, Event, Absensi di tengah, Riwayat, dan Profil. Tombol Absensi harus lebih menonjol dengan background berbeda.
15. Tambahkan padding bawah sesuai tinggi bottom navigation dan safe-area agar konten terakhir tidak tertutup.
16. Avatar memakai foto dari field `avatar` bila tersedia; gunakan inisial sebagai fallback jika kosong atau gagal dimuat.
17. Badge notifikasi harus berasal dari status server. Setelah jadwal/pesan dibuka, sinkronkan ulang jumlah notifikasi.
18. Jangan menganggap route web Inertia seperti `/my/events` atau `/my/events/{event}/live-rundown` sebagai REST API native.

PROSEDUR KERJA
Sebelum coding:
1. Ringkas arsitektur project yang relevan.
2. Sebutkan file yang dibaca dan fungsi masing-masing.
3. Sebutkan endpoint yang dipakai, HTTP method, request, dan response.
4. Nyatakan apakah endpoint tersebut `READY`.
5. Buat rencana perubahan sekecil mungkin.
6. Sebutkan asumsi yang masih belum pasti.

Saat coding:
1. Implementasikan satu potongan fitur yang dapat diuji.
2. Buat service API terpisah dari screen.
3. Buat type/interface untuk request dan response.
4. Sediakan state loading, empty, offline, unauthorized, forbidden, validation error, duplicate attendance, dan server error.
5. Untuk scanner QR, minta permission kamera, cegah pemindaian berulang, dan sediakan cara menghentikan scanner.
6. Untuk mutasi absensi, gunakan Idempotency-Key jika diwajibkan kontrak API.
7. Jangan menyamarkan endpoint yang belum tersedia dengan mock permanen. Mock hanya untuk test dan beri nama yang jelas.
8. Pertahankan aksesibilitas, keyboard/focus behavior, dan layout pada layar kecil.
9. Halaman jadwal user boleh menampilkan jadwal yang sudah lewat, tetapi Dashboard `upcoming` hanya menampilkan event yang belum lewat dan memang ditugaskan kepada user.
10. Area rundown pada card harus dapat diklik dan membuka modal berisi segment, item, durasi, lagu, dan arrangement.
11. Pada modal rundown, letakkan timer item aktif di header `shrink-0`; jadikan daftar segment/item satu-satunya area yang dapat di-scroll.
12. Timer item harus berformat `MM:SS`. Saat overtime gunakan warna merah dan format `-MM:SS` tanpa label tambahan yang tidak diminta.
13. Tampilkan judul item aktif di atas timer. Setelah operator menekan Next, refresh dan sinkronkan item aktif, judul, arrangement, detail lagu, dan timer.
14. Detail lagu dapat menampilkan arrangement, key, BPM, birama, dan `song_flow`/sequence. Sequence harus memiliki kontras visual yang jelas.
15. Gunakan Screen Wake Lock API secara best effort untuk halaman presentasi live dan tangani browser/HTTPS yang tidak mendukungnya.

VALIDASI SETELAH CODING
Jalankan command yang tersedia di package.json:
- lint
- typecheck
- test
- build jika relevan

Jika sebuah command tidak tersedia, jangan mengarang hasilnya. Jelaskan command yang tidak dapat dijalankan.

Validasi fitur notifikasi:
- Dengan dua notifikasi, badge harus bernilai `2`.
- Membuka satu kategori harus membuat badge menjadi `1`.
- Membuka semuanya harus menghilangkan badge atau membuat nilainya `0`.

Validasi fitur live rundown:
- Buka rundown dari card event dan pastikan modal dapat di-scroll.
- Pastikan timer tetap berada di header saat daftar digulir.
- Uji overtime dan pastikan timer merah dengan awalan minus.
- Tekan Next dari operator dan pastikan item, judul, arrangement, serta timer ikut berubah.

FORMAT LAPORAN AKHIR
1. Ringkasan perubahan.
2. File yang dibuat atau diubah.
3. Endpoint dan data yang digunakan.
4. Test atau validasi yang dijalankan beserta hasilnya.
5. Risiko, batasan, atau pekerjaan backend yang masih diperlukan.

MULAI DENGAN MEMBACA DOKUMEN WAJIB. JANGAN CODING SEBELUM MEMBERIKAN RINGKASAN DAN RENCANA.

TASK SAYA:
[jelaskan task secara spesifik, contoh: Buat screen daftar event dan detail event untuk user jemaat]
```

## Contoh Pemakaian

```text
Baca mobile/AGENTS.md, mobile/PROMPT_AI.md, PROJECT_MAP.md, dan docs/mobile-api.md.

Gunakan aturan dari prompt tersebut.

Task: Buat screen login React Native menggunakan endpoint login native.
Sebelum coding, periksa apakah endpoint login sudah berstatus READY. Jika belum, jelaskan perubahan backend Laravel yang diperlukan dan jangan membuat integrasi palsu.
```

## Prompt Audit Struktur Project

Gunakan prompt ini jika AI belum mengenali project:

```text
Audit project React Native ini tanpa mengubah file.

Baca AGENTS.md, PROJECT_MAP.md, docs/mobile-api.md, package.json, dan struktur folder utama.

Laporkan:
1. Framework dan versi penting.
2. Entry point aplikasi.
3. Navigation.
4. HTTP client dan lokasi service API.
5. State management.
6. Secure storage.
7. Screen dan feature yang sudah ada.
8. Test, lint, typecheck, dan build command.
9. Endpoint backend yang benar-benar READY.
10. Gap yang menghalangi fitur mobile.

Jangan membuat asumsi. Tandai setiap informasi yang tidak ditemukan sebagai `BELUM DITEMUKAN`.
```

## Prompt Implementasi Fitur Bertahap

```text
Gunakan dokumen dan aturan project yang sudah ada.

Implementasikan hanya tahap berikut: [nama tahap].

Acceptance criteria:
- [kriteria 1]
- [kriteria 2]
- [kriteria 3]

Batasan:
- Jangan mengubah backend kecuali saya meminta.
- Jangan membuat endpoint baru berdasarkan asumsi.
- Jangan menambah dependency tanpa alasan dan persetujuan.
- Jangan menghapus perubahan yang sudah ada.

Mulai dengan membaca file pemilik fitur, lalu tampilkan rencana singkat sebelum mengubah file. Setelah selesai, jalankan validasi paling sempit yang relevan dan laporkan hasilnya.
```

## Prompt Review Sebelum Release

```text
Review aplikasi React Native ini untuk kesiapan release.

Baca AGENTS.md, PROJECT_MAP.md, docs/mobile-api.md, package.json, dan source code yang relevan.

Prioritaskan temuan berdasarkan severity:
- crash atau data loss
- masalah autentikasi dan token
- absensi ganda atau manipulasi member_id
- endpoint/response yang tidak sesuai kontrak
- masalah permission kamera
- offline/retry yang dapat membuat mutasi ganda
- UI yang rusak pada Android/iOS atau layar kecil
- test yang hilang pada alur penting

Jangan mengubah file. Laporkan setiap temuan dengan path file, masalah, dampak, dan perbaikan yang disarankan. Jika tidak ada temuan, sebutkan test gap dan residual risk.
```

## Catatan Untuk Project Terpisah

Jika aplikasi React Native berada di repository berbeda, letakkan file berikut di root project mobile:

```text
mobile-app/
├── AGENTS.md
├── PROJECT_MAP.md
├── PROMPT_AI.md
└── docs/
    └── mobile-api.md
```

Dalam repository terpisah, `PROJECT_MAP.md` harus menjadi peta khusus mobile. Salin hanya kontrak API yang benar-benar relevan dan pastikan diperbarui ketika backend berubah.
