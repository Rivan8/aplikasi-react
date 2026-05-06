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
        Schema::create('songs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('arrangement_name')->nullable();
            $table->string('bpm')->nullable();
            $table->string('keys')->nullable();
            $table->timestamp('last_scheduled_at')->nullable();
            $table->boolean('has_lyrics')->default(false);
            $table->boolean('has_chords')->default(false);
            $table->boolean('has_pdf')->default(false);
            $table->boolean('has_audio')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('songs');
    }
};
