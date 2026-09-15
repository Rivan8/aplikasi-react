<?php

use App\Models\User;
use Illuminate\Support\Str;

it('stores an FCM push token for the authenticated mobile user', function () {
    $plainToken = Str::random(60);
    $user = User::factory()->create([
        'role' => 'user',
        'api_token' => hash('sha256', $plainToken),
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainToken)
        ->postJson('/api/mobile/v1/me/push-token', [
            'token' => 'fcm-device-token-123',
            'token_type' => 'fcm',
        ])
        ->assertOk()
        ->assertJsonPath('data.token_type', 'fcm')
        ->assertJsonPath('data.registered', true);

    expect($user->fresh()->fcm_token)->toBe('fcm-device-token-123');
});

it('keeps Expo token registration compatible without token_type', function () {
    $plainToken = Str::random(60);
    $user = User::factory()->create([
        'role' => 'user',
        'api_token' => hash('sha256', $plainToken),
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainToken)
        ->postJson('/api/mobile/v1/me/push-token', [
            'token' => 'ExponentPushToken[expo-token-123]',
        ])
        ->assertOk()
        ->assertJsonPath('data.token_type', 'expo');

    expect($user->fresh()->expo_push_token)->toBe('ExponentPushToken[expo-token-123]');
});

it('accepts an Expo token payload using the named token field', function () {
    $plainToken = Str::random(60);
    $user = User::factory()->create([
        'role' => 'user',
        'api_token' => hash('sha256', $plainToken),
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainToken)
        ->postJson('/api/mobile/v1/me/push-token', [
            'expo_push_token' => 'ExponentPushToken[expo-token-456]',
            'device_push_token' => 'device-token-456',
            'fcm_token' => 'fcm-token-456',
            'platform' => 'expo',
        ])
        ->assertOk()
        ->assertJsonPath('data.token_type', 'expo')
        ->assertJsonPath('data.registered', true);

    expect($user->fresh()->expo_push_token)->toBe('ExponentPushToken[expo-token-456]');
});

it('accepts an FCM token payload using the named token field', function () {
    $plainToken = Str::random(60);
    $user = User::factory()->create([
        'role' => 'user',
        'api_token' => hash('sha256', $plainToken),
    ]);

    $this->withHeader('Authorization', 'Bearer '.$plainToken)
        ->postJson('/api/mobile/v1/me/push-token', [
            'fcm_token' => 'fcm-token-789',
        ])
        ->assertOk()
        ->assertJsonPath('data.token_type', 'fcm')
        ->assertJsonPath('data.registered', true);

    expect($user->fresh()->fcm_token)->toBe('fcm-token-789');
});
