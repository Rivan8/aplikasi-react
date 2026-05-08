<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('event_live_sessions', function (Blueprint $table) {
            $table->unsignedInteger('current_item_index')->default(0)->after('current_segment_index');
            $table->timestamp('item_started_at')->nullable()->after('segment_started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_live_sessions', function (Blueprint $table) {
            $table->dropColumn(['current_item_index', 'item_started_at']);
        });
    }
};
