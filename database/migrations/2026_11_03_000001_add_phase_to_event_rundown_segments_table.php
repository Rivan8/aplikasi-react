<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('event_rundown_segments', 'phase')) {
            return;
        }

        Schema::table('event_rundown_segments', function (Blueprint $table) {
            $table->string('phase', 20)->default('during')->after('title');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('event_rundown_segments', 'phase')) {
            return;
        }

        Schema::table('event_rundown_segments', function (Blueprint $table) {
            $table->dropColumn('phase');
        });
    }
};
