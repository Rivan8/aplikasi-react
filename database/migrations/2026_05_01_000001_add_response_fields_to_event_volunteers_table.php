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
        Schema::table('event_volunteers', function (Blueprint $table) {
            $table->string('response_status')->default('pending')->after('member_id');
            $table->text('response_reason')->nullable()->after('response_status');
            $table->timestamp('responded_at')->nullable()->after('response_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_volunteers', function (Blueprint $table) {
            $table->dropColumn(['response_status', 'response_reason', 'responded_at']);
        });
    }
};
