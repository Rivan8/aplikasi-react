<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
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
        $this->configureDefaults();
        $this->extendPhpIniScanDir();
    }

    /**
     * Make `php artisan serve` read .php-ini/upload.ini. Laravel only forwards
     * allowlisted env vars to the PHP child, and Herd already sets this one.
     */
    protected function extendPhpIniScanDir(): void
    {
        $scanDir = base_path('.php-ini');

        if (! app()->runningInConsole() || ! app()->environment('local') || ! is_dir($scanDir)) {
            return;
        }

        $current = $_ENV['HERD_PHP_83_INI_SCAN_DIR'] ?? getenv('HERD_PHP_83_INI_SCAN_DIR');
        $current = is_string($current) && $current !== '' ? $current : '';

        $_ENV['HERD_PHP_83_INI_SCAN_DIR'] = $current === ''
            ? $scanDir
            : $current.PATH_SEPARATOR.$scanDir;
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
