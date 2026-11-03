<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('event_volunteers')) {
            return;
        }

        if (! Schema::hasColumn('event_volunteers', 'attendance_confirmed')) {
            Schema::table('event_volunteers', function (Blueprint $table) {
                $table->boolean('attendance_confirmed')->default(false)->after('responded_at');
            });
        }

        if (! Schema::hasColumn('event_volunteers', 'attendance_confirmed_at')) {
            Schema::table('event_volunteers', function (Blueprint $table) {
                $table->timestamp('attendance_confirmed_at')->nullable()->after('attendance_confirmed');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('event_volunteers')) {
            return;
        }

        if (Schema::hasColumn('event_volunteers', 'attendance_confirmed_at')) {
            Schema::table('event_volunteers', function (Blueprint $table) {
                $table->dropColumn('attendance_confirmed_at');
            });
        }

        if (Schema::hasColumn('event_volunteers', 'attendance_confirmed')) {
            Schema::table('event_volunteers', function (Blueprint $table) {
                $table->dropColumn('attendance_confirmed');
            });
        }
    }
};
