<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MemberApiService
{
    /**
     * Penanda cache untuk kode yang gagal diverifikasi dalam waktu singkat.
     */
    private const MISSING_MARKER = '__member-api-missing__';

    private const LIST_CACHE_KEY = 'member-api:list-all';

    private const LIST_BACKUP_KEY = 'member-api:list-all-backup';

    public function authenticate(string $identity, string $password): ?array
    {
        if (! config('services.myesc.enabled', true)) {
            return null;
        }

        try {
            $apiPassword = config('services.myesc.auth_password_format', 'plain') === 'md5'
                ? md5($password)
                : $password;

            $response = $this->authClient()->post('/login', [
                'identity' => trim($identity),
                'password' => $apiPassword,
            ]);

            if (! $response->successful() || ! $this->authenticationSucceeded($response->json('status'))) {
                Log::warning('Member API authentication rejected', [
                    'http_status' => $response->status(),
                    'api_status' => $response->json('status'),
                ]);

                return null;
            }

            $member = $response->json('data');

            return is_array($member) && ! empty($member['idjemaat'])
                ? $this->normalizeMember($member)
                : null;
        } catch (\Throwable $exception) {
            Log::error('Member API authentication request failed', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    public function findByScan(string $scan): ?array
    {
        foreach ($this->scanCandidates($scan) as $candidate) {
            $member = $this->resolveScanCandidate($candidate);

            if ($member !== null) {
                return $member;
            }
        }

        return null;
    }

    /**
     * Mengubah hasil scan (kartu fisik, QR digital, URL, atau JSON) menjadi
     * daftar kandidat kode jemaat yang bisa diverifikasi ke layanan anggota.
     *
     * @return array<int, string>
     */
    private function scanCandidates(string $scan): array
    {
        $scan = trim($scan);

        if ($scan === '') {
            return [];
        }

        $candidates = [];
        $isJson = str_starts_with($scan, '{');
        $isUrl = preg_match('~^[a-z][a-z0-9+.-]*://~i', $scan) === 1;

        if (! $isJson && ! $isUrl) {
            $candidates[] = $scan;
        }

        // QR bisa berupa JSON (mis. { "member_id": "...", "noaj": "..." }).
        if ($isJson) {
            $payload = json_decode($scan, true);

            if (is_array($payload)) {
                foreach (['code', 'member_id', 'idjemaat', 'noaj'] as $key) {
                    if (isset($payload[$key]) && is_scalar($payload[$key])) {
                        $candidates[] = (string) $payload[$key];
                    }
                }
            }
        }

        // QR bisa berupa URL (halaman absensi/kartu digital); ambil kode dari path/query.
        if ($isUrl) {
            $query = [];
            parse_str((string) parse_url($scan, PHP_URL_QUERY), $query);

            foreach (['code', 'member_id', 'idjemaat', 'id'] as $key) {
                if (isset($query[$key]) && is_scalar($query[$key])) {
                    $candidates[] = (string) $query[$key];
                }
            }

            $segments = array_values(array_filter(
                explode('/', (string) parse_url($scan, PHP_URL_PATH)),
                fn (string $segment) => $segment !== '',
            ));

            if ($segments !== []) {
                $candidates[] = rawurldecode((string) end($segments));
            }
        }

        // Kartu/QR fisik sering memakai pemisah, mis. "2205290001-0000010".
        $digits = preg_replace('/[^0-9]/', '', $scan) ?? '';

        if ($digits !== '') {
            $candidates[] = $digits;
        }

        $candidates = array_map(fn ($candidate) => trim((string) $candidate), $candidates);

        return array_values(array_unique(array_filter(
            $candidates,
            fn (string $candidate) => $candidate !== '' && preg_match('/[0-9]/', $candidate) === 1,
        )));
    }

    private function resolveScanCandidate(string $code): ?array
    {
        if ($code === '') {
            return null;
        }

        $idLength = (int) config('services.myesc.idjemaat_length', 10);
        $noajLength = (int) config('services.myesc.noaj_length', 7);
        $digits = preg_replace('/[^0-9]/', '', $code) ?? '';
        $expectedLength = $idLength + $noajLength;

        // Format gabungan idjemaat + noaj (dengan atau tanpa pemisah).
        if ($digits !== '' && strlen($digits) === $expectedLength) {
            $member = $this->findById(substr($digits, 0, $idLength));

            if ($member !== null && (string) $member['noaj'] === substr($digits, $idLength)) {
                return $member;
            }
        }

        $member = $this->findById($code);

        if ($member !== null) {
            return $member;
        }

        // NIK (16 digit) tidak dilayani endpoint scan; cari lewat indeks jemaat.
        if (strlen($digits) === (int) config('services.myesc.nik_length', 16)) {
            return $this->findByNik($digits);
        }

        return null;
    }

    public function findById(string|int $idjemaat): ?array
    {
        $idjemaat = trim((string) $idjemaat);

        if ($idjemaat === '') {
            return null;
        }

        $cacheKey = 'member-api:'.$idjemaat;
        $cached = Cache::get($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        if ($cached === self::MISSING_MARKER) {
            return null;
        }

        if (! config('services.myesc.enabled', true)) {
            return null;
        }

        $member = $this->request($idjemaat);

        if ($member !== null) {
            Cache::put(
                $cacheKey,
                $member,
                now()->addMinutes((int) config('services.myesc.cache_minutes', 10)),
            );

            return $member;
        }

        // Kegagalan hanya disimpan sebentar: sebelumnya null ikut ter-cache 10 menit
        // sehingga gangguan sesaat membuat semua scan ditolak "tidak dikenali".
        Cache::put($cacheKey, self::MISSING_MARKER, now()->addSeconds(30));

        // Pakai indeks lokal (jika sudah tersedia) agar absensi tetap jalan saat API bermasalah.
        $fallback = $this->cachedMemberIndex()['by_id'][$idjemaat] ?? null;

        return is_array($fallback) ? $fallback : null;
    }

    private function findByNik(string $nik): ?array
    {
        $nik = trim($nik);

        if ($nik === '') {
            return null;
        }

        $idjemaat = $this->memberIndex()['by_nik'][$nik] ?? null;

        return is_string($idjemaat) && $idjemaat !== '' ? $this->findById($idjemaat) : null;
    }

    /**
     * @return array{by_nik: array<string, string>, by_id: array<string, array>}
     */
    private function memberIndex(): array
    {
        $cached = $this->cachedMemberIndex();

        if ($cached['by_id'] !== []) {
            return $cached;
        }

        $index = ['by_nik' => [], 'by_id' => []];

        foreach ($this->listAll() as $member) {
            $idjemaat = (string) ($member['idjemaat'] ?? '');

            if ($idjemaat === '') {
                continue;
            }

            $index['by_id'][$idjemaat] = $member;
            $nik = preg_replace('/[^0-9]/', '', (string) ($member['nik'] ?? '')) ?? '';

            if ($nik !== '') {
                $index['by_nik'][$nik] = $idjemaat;
            }
        }

        if ($index['by_id'] !== []) {
            Cache::put('member-api:member-index', $index, now()->addMinutes(60));
        }

        return $index;
    }

    /**
     * @return array{by_nik: array<string, string>, by_id: array<string, array>}
     */
    private function cachedMemberIndex(): array
    {
        $cached = Cache::get('member-api:member-index');

        return is_array($cached) && isset($cached['by_nik'], $cached['by_id'])
            ? $cached
            : ['by_nik' => [], 'by_id' => []];
    }

    /**
     * Ambil banyak member sekaligus (dipakai laporan absensi). Indeks jemaat
     * dipakai lebih dulu agar tidak memicu puluhan permintaan HTTP berurutan
     * yang membuat halaman laporan lambat atau timeout.
     */
    public function findMany(iterable $ids): array
    {
        $ids = collect($ids)
            ->map(fn ($id) => trim((string) $id))
            ->filter()
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        $members = [];
        $pending = [];

        foreach ($ids as $id) {
            $cached = Cache::get('member-api:'.$id);

            if (is_array($cached)) {
                $members[(string) $cached['idjemaat']] = $cached;

                continue;
            }

            $pending[] = $id;
        }

        if ($pending === []) {
            return $members;
        }

        $indexed = $this->memberIndex()['by_id'];

        foreach ($pending as $id) {
            $member = $indexed[$id] ?? $this->findById($id);

            if ($member !== null) {
                $members[(string) $member['idjemaat']] = $member;
            }
        }

        return $members;
    }

    public function list(int $page = 1, int $perPage = 10): array
    {
        $page = max(1, $page);
        $perPage = min(1000, max(1, $perPage));

        try {
            $response = $this->listClient()->get('/', [
                'page' => $page,
                'limit' => $perPage,
            ]);

            if (! $response->successful() || (int) $response->json('status') !== 1) {
                return ['data' => [], 'pagination' => []];
            }

            return [
                'data' => collect($response->json('data', []))
                    ->filter(fn ($member) => is_array($member) && ! empty($member['idjemaat']))
                    ->map(fn (array $member): array => $this->normalizeMember($member))
                    ->values()
                    ->all(),
                'pagination' => $response->json('pagination', []),
            ];
        } catch (\Throwable) {
            return ['data' => [], 'pagination' => []];
        }
    }

    public function listAll(): array
    {
        if (! config('services.myesc.enabled', true)) {
            return [];
        }

        $cached = Cache::get(self::LIST_CACHE_KEY);

        if (is_array($cached) && $cached !== []) {
            if (! Cache::has(self::LIST_BACKUP_KEY)) {
                Cache::put(self::LIST_BACKUP_KEY, $cached, now()->addDays(7));
            }

            return $cached;
        }

        $members = [];
        $page = 1;
        $perPage = 1000;

        do {
            $result = $this->list($page, $perPage);

            foreach ($result['data'] as $member) {
                $members[(string) $member['idjemaat']] = $member;
            }

            $page = (int) ($result['pagination']['next_page'] ?? 0);
        } while ($page > 0);

        if ($members === []) {
            // Jangan simpan daftar kosong: sebelumnya kegagalan sesaat membuat
            // daftar jemaat kosong selama 10 menit, sehingga nama jemaat hilang
            // dari laporan dan pilihan member pada absensi manual.
            return $this->lastKnownMemberList();
        }

        $members = array_values($members);

        Cache::put(
            self::LIST_CACHE_KEY,
            $members,
            now()->addMinutes((int) config('services.myesc.cache_minutes', 10)),
        );
        Cache::put(self::LIST_BACKUP_KEY, $members, now()->addDays(7));

        return $members;
    }

    /**
     * Daftar jemaat terakhir yang pernah berhasil diambil, dipakai saat API
     * sedang tidak bisa dihubungi.
     */
    private function lastKnownMemberList(): array
    {
        $backup = Cache::get(self::LIST_BACKUP_KEY);

        return is_array($backup) ? $backup : [];
    }

    private function request(string $scan): ?array
    {
        try {
            $response = $this->client()->get('/'.rawurlencode($scan));

            if (! $response->successful() || $response->json('success') !== true) {
                return null;
            }

            $member = $response->json('data');

            if (! is_array($member) || empty($member['idjemaat'])) {
                return null;
            }

            return $this->normalizeMember($member);
        } catch (\Throwable) {
            return null;
        }
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.myesc.scan_url'), '/'))
            ->acceptJson()
            ->withHeaders([
                'X-API-KEY' => (string) config('services.myesc.api_key'),
            ])
            ->connectTimeout((int) config('services.myesc.connect_timeout', 5))
            ->timeout((int) config('services.myesc.timeout', 10));
    }

    private function authClient(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.myesc.auth_url'), '/'))
            ->acceptJson()
            ->withHeaders([
                'X-API-KEY' => (string) config('services.myesc.api_key'),
            ])
            ->connectTimeout((int) config('services.myesc.connect_timeout', 5))
            ->timeout((int) config('services.myesc.timeout', 10));
    }

    private function listClient(): PendingRequest
    {
        return Http::baseUrl(rtrim((string) config('services.myesc.list_url'), '/'))
            ->acceptJson()
            ->withHeaders([
                'X-API-KEY' => (string) config('services.myesc.api_key'),
            ])
            ->connectTimeout((int) config('services.myesc.connect_timeout', 5))
            ->timeout((int) config('services.myesc.timeout', 10));
    }

    private function normalizeMember(array $member): array
    {
        return [
            'idjemaat' => (string) $member['idjemaat'],
            'id' => (string) $member['idjemaat'],
            'name' => $member['namalengkap'] ?? null,
            'namalengkap' => $member['namalengkap'] ?? null,
            'noaj' => $member['noaj'] ?? null,
            'nik' => $member['NIK'] ?? $member['nik'] ?? null,
            'foto_url' => $this->photoUrl($member['foto_url'] ?? $member['foto'] ?? null),
            'statusjemaat' => $member['statusjemaat'] ?? null,
            'jeniskelamin' => $member['jeniskelamin'] ?? null,
            'email' => $member['email'] ?? null,
            'phone' => $member['nohp'] ?? $member['phone'] ?? null,
        ];
    }

    private function authenticationSucceeded(mixed $status): bool
    {
        return in_array($status, [true, 1, '1', 'true', 'success'], true);
    }

    private function photoUrl(?string $photo): ?string
    {
        if ($photo === null || trim($photo) === '') {
            return null;
        }

        $photo = trim($photo);

        if (filter_var($photo, FILTER_VALIDATE_URL)) {
            $photoPath = parse_url($photo, PHP_URL_PATH);
            $photo = is_string($photoPath) ? basename($photoPath) : $photo;
        } else {
            $photo = basename($photo);
        }

        return 'https://admin.myesc.id/uploads/jemaat/'.rawurlencode($photo);
    }
}
