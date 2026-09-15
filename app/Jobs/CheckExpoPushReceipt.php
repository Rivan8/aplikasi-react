<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CheckExpoPushReceipt implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private readonly string $ticketId,
        private readonly int $userId,
        private readonly string $token,
    ) {}

    public function handle(): void
    {
        $response = Http::acceptJson()
            ->asJson()
            ->post('https://exp.host/--/api/v2/push/getReceipts', [
                'ids' => [$this->ticketId],
            ]);

        if ($response->failed()) {
            Log::error('Expo receipt request failed.', [
                'ticket_id' => $this->ticketId,
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
            ]);
            $response->throw();
        }

        $receipt = $response->json("data.{$this->ticketId}");
        if (! is_array($receipt) || ($receipt['status'] ?? null) !== 'ok') {
            $this->handleReceiptError($receipt);

            return;
        }

        Log::info('Expo push receipt confirmed.', [
            'ticket_id' => $this->ticketId,
            'user_id' => $this->userId,
        ]);
    }

    private function handleReceiptError(?array $receipt): void
    {
        $details = $receipt['details'] ?? [];
        $error = is_array($details) ? ($details['error'] ?? null) : null;

        Log::error('Expo push receipt reported an error.', [
            'ticket_id' => $this->ticketId,
            'error' => $error,
            'message' => $receipt['message'] ?? null,
            'user_id' => $this->userId,
        ]);

        if ($error === 'DeviceNotRegistered') {
            User::query()
                ->whereKey($this->userId)
                ->where('expo_push_token', $this->token)
                ->update(['expo_push_token' => null]);
        }
    }
}
