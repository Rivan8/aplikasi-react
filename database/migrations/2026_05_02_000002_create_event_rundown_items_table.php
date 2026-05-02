<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_rundown_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_rundown_segment_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rundown_items');
    }
};
