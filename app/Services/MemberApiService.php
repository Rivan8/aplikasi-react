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

            return [
                'idjemaat' => (string) $member['idjemaat'],
                'name' => $member['namalengkap'] ?? null,
                'namalengkap' => $member['namalengkap'] ?? null,
                'noaj' => $member['noaj'] ?? null,
                'nik' => $member['NIK'] ?? $member['nik'] ?? null,
                'foto_url' => $member['foto_url'] ?? null,
                'statusjemaat' => $member['statusjemaat'] ?? null,
                'jeniskelamin' => $member['jeniskelamin'] ?? null,
                'volunteer' => $member['volunteer'] ?? [],
            ];
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
}
