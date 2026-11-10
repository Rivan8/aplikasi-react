<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('event_messages', 'sender_id')) {
            return;
        }

        Schema::table('event_messages', function (Blueprint $table) {
            $table->foreignId('sender_id')
                ->nullable()
                ->after('event_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('event_messages', 'sender_id')) {
            return;
        }

        Schema::table('event_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('sender_id');
        });
    }
};
