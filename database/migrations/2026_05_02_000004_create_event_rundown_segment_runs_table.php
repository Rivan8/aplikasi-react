<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_rundown_segment_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_live_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_rundown_segment_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('segment_index')->default(0);
            $table->string('title');
            $table->unsignedInteger('planned_seconds')->default(0);
            $table->unsignedInteger('actual_seconds')->default(0);
            $table->integer('overrun_seconds')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rundown_segment_runs');
    }
};
