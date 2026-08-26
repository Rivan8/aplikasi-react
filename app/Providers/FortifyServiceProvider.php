<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use App\Services\MemberApiService;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        Fortify::authenticateUsing(function (Request $request) {
            $login = trim((string) $request->input('login'));
            $phone = preg_replace('/\D+/', '', $login);
            $user = \App\Models\User::where('email', $login)
                ->orWhere('phone', $phone)
                ->first();

            if ($user && Hash::check($request->password, $user->password)) {
                return $user;
            }

            $member = app(MemberApiService::class)->authenticate($login, (string) $request->password);

            if (! $member) {
                return null;
            }

            $normalizedPhone = preg_replace('/\D+/', '', (string) ($member['phone'] ?? $phone));
            $localUser = \App\Models\User::where('member_id', $member['idjemaat'])
                ->orWhere(fn ($query) => $query
                    ->whereNotNull('phone')
                    ->where('phone', $normalizedPhone))
                ->first();

            if (! $localUser && ! empty($member['email'])) {
                $localUser = \App\Models\User::where('email', $member['email'])->first();
            }

            $localUser ??= new \App\Models\User;
            $localUser->fill([
                'name' => $member['name'] ?: 'Member '.$member['idjemaat'],
                'email' => $localUser->email ?: ($member['email'] ?: $member['idjemaat'].'@member.local'),
                'phone' => $normalizedPhone ?: null,
                'member_id' => $member['idjemaat'],
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ]);
            $localUser->save();

            return $localUser;

            return null;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register'));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
