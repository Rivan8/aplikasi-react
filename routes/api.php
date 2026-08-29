<?php

use App\Http\Controllers\Api\MobileAuthController;
use App\Http\Controllers\Api\MobileEventController;
use App\Http\Controllers\Api\MobileNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('mobile/v1')->group(function (): void {
    Route::post('/auth/login', [MobileAuthController::class, 'login']);

    Route::middleware(['auth.mobile'])->group(function (): void {
        Route::post('/auth/logout', [MobileAuthController::class, 'logout']);
        Route::get('/me', [MobileAuthController::class, 'me']);

        Route::get('/events', [MobileEventController::class, 'index']);
        Route::get('/events/{event}', [MobileEventController::class, 'show']);
        Route::post('/events/{event}/attendance', [MobileEventController::class, 'postAttendance']);
        Route::get('/events/{event}/rundown', [MobileEventController::class, 'rundown']);
        Route::get('/events/{event}/live-rundown', [MobileEventController::class, 'liveRundown']);

        Route::get('/me/schedules', [MobileEventController::class, 'mySchedules']);
        Route::post('/me/schedules/{eventVolunteer}/accept', [MobileEventController::class, 'acceptSchedule']);
        Route::post('/me/schedules/{eventVolunteer}/decline', [MobileEventController::class, 'declineSchedule']);
        Route::get('/me/attendances', [MobileEventController::class, 'myAttendances']);

        Route::get('/me/notifications', [MobileNotificationController::class, 'index']);
        Route::post('/me/notifications/{notification}/read', [MobileNotificationController::class, 'markRead']);
        Route::post('/me/notifications/read-all', [MobileNotificationController::class, 'readAll']);
    });
});
