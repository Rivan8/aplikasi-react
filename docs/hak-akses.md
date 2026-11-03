# Hak Akses — Halaman Kelola Hak Akses

Dokumen ini menjelaskan seluruh jenis hak akses yang dapat diterapkan dari halaman **Kelola Hak Akses** (`/settings/roles`), efek nyatanya di aplikasi, serta batasan dan pengamanannya.

- **Halaman:** `resources/js/pages/settings/RoleManagement.tsx`
- **Controller:** `app/Http/Controllers/SettingsController.php`
- **Route:** `routes/web.php` (baris 612–634)
- **Model terkait:** `User`, `Role`, `Category`, `CategoryRole`, `Department`

---

## 1. Siapa yang Bisa Membuka Halaman

| Kemampuan | Super Admin | Admin | User | Jemaat |
| --- | --- | --- | --- | --- |
| Membuka menu & halaman Kelola Hak Akses | ✅ | ✅ | ❌ | ❌ |
| Membuat role baru (Katalog Role) | ✅ | ✅ | ❌ | ❌ |
| Mengubah role global pengguna | ✅ | ❌ (UI disembunyikan + route ditolak) | ❌ | ❌ |
| Menugaskan role kategori | ✅ | ❌ (UI disembunyikan + route ditolak) | ❌ | ❌ |
| Memberi/mencabut akses penjadwalan departemen | ✅ | ❌ (UI disembunyikan + route ditolak) | ❌ | ❌ |

Catatan:

- Route halaman dan pembuatan role memakai middleware `role:admin,superadmin`.
- Route penetapan hak akses memakai middleware `role:superadmin`.
- Di UI, bagian **Hak Akses Global** dan **Pengaturan Akses Lanjutan** hanya dirender bila prop `can_manage_user_roles` bernilai `true`. Prop ini dihitung dari `request()->user()->isSuperAdmin()`.
- Admin tetap melihat **Katalog Role**, tetapi daftar pengguna dan kategori dikirim kosong sehingga formulir penetapan tidak tersedia.

---

## 2. Empat Jenis Hak Akses di Halaman Ini

Halaman ini sebenarnya mengelola **empat mekanisme berbeda**, bukan satu jenis izin tunggal:

1. **Katalog Role** — daftar role yang bisa diberikan ke pengguna.
2. **Hak Akses Global** — satu role utama per akun (`users.role` + `users.role_id`).
3. **Penugasan Role Kategori** — role pelayanan per kategori event (`user_category_roles`).
4. **Hak Penjadwalan Departemen** — akses mengelola jadwal event untuk departemen tertentu (`user_department_accesses`).

---

## 3. Katalog Role

### Fungsi

Membuat dan meninjau role yang nantinya dapat dipilih pada **Hak Akses Global**.

### Aksi yang tersedia

- **Tambah role**: nama role (wajib, maks. 100 karakter, unik) dan departemen (opsional).
- Melihat daftar role beserta departemen dan tipenya.

### Tipe role

| Tipe | Penanda | Arti |
| --- | --- | --- |
| **Bawaan** | `system_key` terisi | Role sistem yang terhubung ke `users.role`. Saat ini: `superadmin`, `admin`, `user`. |
| **Kustom** | `system_key` kosong | Role buatan administrator, tidak mengubah `users.role` secara langsung. |

### Efek role kustom

Role kustom **tidak** menambah halaman atau menu apa pun dengan sendirinya. Efeknya baru muncul saat diberikan melalui **Hak Akses Global**:

- `users.role` tetap diset `user`.
- `users.role_id` diisi ID role kustom.
- Hak penjadwalan departemen pengguna **disinkronkan hanya ke departemen role tersebut** (akses departemen lain diganti, bukan ditambah).
- Bila role kustom belum dikaitkan ke departemen, role tersebut **tidak bisa diberikan** ke pengguna.

### Batasan

- Nama role unik; tidak boleh sama dengan role lain.
- Role yang sudah dibuat dari halaman ini tidak bisa dihapus atau diubah dari halaman ini (tidak ada UI edit/hapus).
- Daftar role **kategori** (mis. "WL 1", "Drummer") tidak dibuat di sini, melainkan dari halaman **Kategori Event**.

---

## 4. Hak Akses Global

### Fungsi

Menetapkan **satu role utama** untuk akun pengguna yang dipilih.

### Aksi yang tersedia

- Cari pengguna (nama/email).
- Pilih role dari katalog.
- Simpan melalui `PATCH /settings/users/{user}/role`.

### Efek penetapan

| Role yang dipilih | `users.role` | `users.role_id` | Akses departemen |
| --- | --- | --- | --- |
| Super Admin (`superadmin`) | `superadmin` | ID role | Dikosongkan |
| Admin (`admin`) | `admin` | ID role | Dikosongkan |
| User (`user`) | `user` | ID role | Dikosongkan |
| Role kustom | `user` | ID role kustom | **Diganti** menjadi hanya departemen role kustom tersebut |

Karena role kustom memetakan `users.role` ke `user`, pengguna tersebut tetap bisa diberi akses departemen tambahan lewat bagian **Hak Penjadwalan Departemen**.

### Pengamanan

- **Tidak bisa menurunkan role akun sendiri**, kecuali tetap sebagai Super Admin.
- **Minimal harus ada satu Super Admin** di sistem; pencabutan Super Admin terakhir ditolak.
- Role kustom tanpa departemen ditolak.
- Penetapan berjalan dalam transaksi database agar `role`, `role_id`, dan akses departemen konsisten.

---

## 5. Penugasan Role Kategori

### Fungsi

Memberi peran pelayanan spesifik pada seorang pengguna untuk kategori event tertentu, misalnya:

- Kategori **Ibadah Raya** → role **WL 1**, **Drummer**, **Soundman**.
- Kategori **Kids** → role **Guru Kelas**, **PIC Kids**.

### Aksi yang tersedia

- Pilih pengguna.
- Pilih kategori.
- Pilih role yang tersedia pada kategori tersebut.
- Simpan melalui `POST /settings/roles/assign`.

### Efek

- Menambahkan baris ke tabel pivot `user_category_roles`.
- Data tampil sebagai badge **Daftar Peran yang Sudah Ditugaskan** (format `nama role (nama kategori)`).
- Role ini dipakai oleh pengecekan `User::hasCategoryRole($categoryName, $roles)`.
- Pengecekan tersebut tersedia melalui middleware `category.role:<kategori>,<role>`.

### Batasan penting

- Penugasan ini **tidak memberi akses halaman/menu** apa pun secara langsung.
- Middleware `category.role` sudah terdaftar di `app/Http/Kernel.php`, tetapi saat ini **belum dipakai oleh route mana pun**. Jadi role kategori berfungsi sebagai data kesiapan (dan dipakai oleh pemanggilan `hasCategoryRole` di kode lain), bukan pembatas route aktif.
- Penugasan ganda dicek di controller; tidak ada UI untuk mencabut role kategori dari halaman ini.
- Admin dan Super Admin selalu lolos pengecekan `hasCategoryRole` (bypass), apa pun role kategorinya.

---

## 6. Hak Penjadwalan Departemen

### Fungsi

Memberi pengguna biasa kemampuan mengelola **penjadwalan volunteer** pada event, terbatas pada departemen yang diberikan.

### Aksi yang tersedia

- Pilih departemen.
- Pilih pengguna (hanya akun dengan `users.role = 'user'` yang muncul dan lolos validasi).
- Simpan melalui `POST /settings/department-access`.
- Daftar akses yang sudah ada ditampilkan; tombol **Cabut Hak** memanggil `DELETE /settings/users/{user}/departments/{department}`.

### Efek nyata

1. **Menu dan akses halaman**
   - Prop global `can_manage_event_scheduling` menjadi `true` bila pengguna adalah admin **atau** memiliki minimal satu akses departemen.
   - Menu **Management Event** (`/events`) dan **Penjadwalan Event** (`/event-scheduling`) muncul.
   - Logo aplikasi mengarah ke `/events` (bukan `/my/scan`).

2. **Otorisasi controller**
   - `EventController@index`, `scheduling`, `rundownReport`, `rundownReportPdf`, dan `updateVolunteers` memakai aturan:
     `abort_unless($user->isAdmin() || $user->schedulingDepartments()->exists(), 403)`.

3. **Pembatasan posisi saat menjadwalkan**
   - Pada `updateVolunteers`, pengguna non-admin hanya boleh mengisi posisi dari departemen yang ia miliki.
   - Role kategori di luar departemen tersebut ditolak dengan pesan:
     *"Anda tidak memiliki hak untuk menjadwalkan posisi departemen ini."*
   - Jumlah penempatan juga dibatasi jumlah posisi yang tersedia per role.

### Batasan

- Hanya akun ber-role `user` yang bisa menerima akses ini. Admin/Super Admin tidak perlu karena sudah punya akses penuh.
- Akses berlaku per departemen; beberapa departemen bisa diberikan sekaligus.
- Mencabut akses departemen **tidak mengubah** `users.role` atau `role_id`.
- Menetapkan role kustom lewat **Hak Akses Global** akan **mengganti** seluruh akses departemen yang ada dengan departemen role kustom tersebut.
- Penetapan role sistem (Super Admin/Admin/User) lewat **Hak Akses Global** akan **mengosongkan** seluruh akses departemen pengguna.

---

## 7. Matriks Hak Akses Berdasarkan Role Sistem

| Area aplikasi | Super Admin | Admin | User + akses departemen | User tanpa akses departemen | Jemaat |
| --- | --- | --- | --- | --- | --- |
| Kelola Hak Akses | Penuh | Hanya Katalog Role | ❌ | ❌ | ❌ |
| Kelola anggota, departemen, kategori, song bank | ✅ | ✅ | ❌ | ❌ | ❌ |
| Scan QR admin, monitor & laporan absensi, absensi manual | ✅ | ✅ | ❌ | ❌ | ❌ |
| Live Event (timer real-time) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Management Event (`/events`) | ✅ | ✅ | ✅ (terbatas departemen) | ❌ | ❌ |
| Penjadwalan Event (`/event-scheduling`) | ✅ | ✅ | ✅ (terbatas departemen) | ❌ | ❌ |
| Absensi mandiri (`/my/scan`) & Event Saya | ✅ | ✅ | ✅ | ✅ | ✅ |
| Riwayat Saya | ✅ (via URL) | ✅ (via URL) | ✅ | ✅ | ✅ |
| Penugasan role kategori | ✅ | ❌ | ❌ | ❌ | ❌ |

Catatan:

- Tabel di atas menggambarkan **akses route**. Beberapa menu memang disembunyikan dari sidebar untuk role tertentu, misalnya **Riwayat Saya** hanya tampil untuk `user`/`jemaat`, tetapi route `my/*` tidak memasang middleware role sehingga tetap bisa dibuka langsung lewat URL oleh pengguna yang sudah login & terverifikasi.
- `jemaat` adalah nilai lama yang dimigrasikan menjadi `user` (`database/migrations/2026_08_25_000001_update_user_role_defaults.php`). Nilai role saat ini yang dikenal model: `superadmin`, `admin`, `user`.

---

## 8. Alur Singkat di UI

```
/settings/roles
├── Katalog Role
│   ├── Tambah role (nama + departemen opsional)
│   └── Tabel role: nama | departemen | Bawaan/Kustom
├── Hak Akses Global            (superadmin)
│   ├── Cari pengguna
│   ├── Pilih role
│   └── Simpan → PATCH /settings/users/{user}/role
└── Pengaturan Akses Lanjutan   (superadmin)
    ├── Penugasan Role Kategori
    │   ├── Pilih pengguna + kategori + role
    │   └── Simpan → POST /settings/roles/assign
    ├── Hak Penjadwalan Departemen
    │   ├── Pilih departemen + pengguna (role user)
    │   ├── Simpan → POST /settings/department-access
    │   └── Cabut Hak → DELETE /settings/users/{user}/departments/{department}
    └── Daftar Peran yang Sudah Ditugaskan
```

---

## 9. Contoh Penerapan

### Koordinator Visual

1. Buat role kustom **Koordinator Visual**, hubungkan ke departemen **Visual**.
2. Berikan role tersebut lewat **Hak Akses Global**.
3. Hasil:
   - `users.role = user`, `role_id = Koordinator Visual`.
   - Akses departemen otomatis hanya **Visual**.
   - Menu Management Event dan Penjadwalan Event muncul.
   - Hanya bisa mengisi posisi dari departemen Visual.

### Volunteer Multi-Departemen

1. Pastikan pengguna ber-role `user`.
2. Tambahkan akses **Visual** dan **Multimedia** lewat **Hak Penjadwalan Departemen**.
3. Hasil: pengguna bisa mengelola posisi pada kedua departemen tersebut.

### PIC Ibadah Raya

1. Berikan **Role Kategori** pada kategori Ibadah Raya, mis. role **PIC**.
2. Hasil: role tercatat dan tampil di daftar peran, tetapi belum membuka halaman tambahan sampai ada route yang memakai middleware `category.role` atau logika `hasCategoryRole` terkait.

---

## 10. File Referensi

| Kebutuhan | File |
| --- | --- |
| Halaman UI | `resources/js/pages/settings/RoleManagement.tsx` |
| Controller | `app/Http/Controllers/SettingsController.php` |
| Route | `routes/web.php` (612–634) |
| Middleware role | `app/Http/Middleware/CheckRole.php` |
| Middleware role kategori | `app/Http/Middleware/CheckCategoryRole.php` |
| Menu & akses penjadwalan | `resources/js/components/app-sidebar.tsx`, `app/Http/Middleware/HandleInertiaRequests.php` |
| Pembatasan penjadwalan | `app/Http/Controllers/EventController.php` (`index`, `scheduling`, `updateVolunteers`) |
| Model pengguna | `app/Models/User.php` (`isSuperAdmin`, `isAdmin`, `hasCategoryRole`, `schedulingDepartments`) |
| Tabel role | `database/migrations/2026_10_09_000002_create_roles_table.php`, `..._000003_add_user_role_to_roles_table.php` |
| Tabel role kategori | `database/migrations/2026_04_30_231822_create_category_roles_table.php`, `2026_05_08_094510_create_user_category_roles_table.php` |
| Tabel akses departemen | `database/migrations/2026_10_09_000001_create_user_department_accesses_table.php` |
