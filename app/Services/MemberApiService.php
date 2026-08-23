<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class MemberApiService
{
    public function findByScan(string $scan): ?array
    {
        $scan = trim($scan);

        if ($scan === '') {
            return null;
        }

        $idLength = (int) config('services.myesc.idjemaat_length', 10);
        $noajLength = (int) config('services.myesc.noaj_length', 7);

        if (ctype_digit($scan) && strlen($scan) === $idLength + $noajLength) {
            $idjemaat = substr($scan, 0, $idLength);
            $noaj = substr($scan, $idLength, $noajLength);
            $member = $this->findById($idjemaat);

            return $member !== null && (string) $member['noaj'] === $noaj
                ? $member
                : null;
        }

        return $this->findById($scan);
    }

    public function findById(string|int $idjemaat): ?array
    {
        $idjemaat = trim((string) $idjemaat);

        if ($idjemaat === '') {
            return null;
        }

        $cacheKey = 'member-api:'.$idjemaat;

        if (! config('services.myesc.enabled', true)) {
            return Cache::get($cacheKey);
        }

        return Cache::remember(
            $cacheKey,
            now()->addMinutes((int) config('services.myesc.cache_minutes', 10)),
            fn (): ?array => $this->request($idjemaat),
        );
    }

    public function findMany(iterable $ids): array
    {
        $members = [];

        foreach (collect($ids)->map(fn ($id) => (string) $id)->filter()->unique() as $id) {
            $member = $this->findById($id);

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

        return Cache::remember(
            'member-api:list-all',
            now()->addMinutes((int) config('services.myesc.cache_minutes', 10)),
            function (): array {
                $members = [];
                $page = 1;
                $perPage = 1000;

                do {
                    $result = $this->list($page, $perPage);

                    foreach ($result['data'] as $member) {
                        $members[(string) $member['idjemaat']] = $member;
                    }

                    $pagination = $result['pagination'];
                    $nextPage = (int) ($pagination['next_page'] ?? 0);
                    $page = $nextPage;
                } while ($page > 0);

                return array_values($members);
            },
        );
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
        ];
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
