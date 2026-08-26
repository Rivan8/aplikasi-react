<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_message_reads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->unique(['event_message_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_message_reads');
    }
};
