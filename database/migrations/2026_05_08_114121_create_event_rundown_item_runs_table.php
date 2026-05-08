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
        Schema::create('event_rundown_item_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_live_session_id')->constrained('event_live_sessions')->cascadeOnDelete();
            $table->foreignId('event_rundown_item_id')->constrained('event_rundown_items')->cascadeOnDelete();
            $table->unsignedInteger('segment_index');
            $table->unsignedInteger('item_index');
            $table->string('title');
            $table->unsignedInteger('planned_seconds');
            $table->unsignedInteger('actual_seconds')->default(0);
            $table->integer('overrun_seconds')->default(0);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_rundown_item_runs');
    }
};
