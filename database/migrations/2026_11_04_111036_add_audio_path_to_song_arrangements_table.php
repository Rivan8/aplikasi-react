<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('song_arrangements', function (Blueprint $table) {
            $table->string('audio_path')->nullable()->after('pdf_path');
        });
    }

    public function down(): void
    {
        Schema::table('song_arrangements', function (Blueprint $table) {
            $table->dropColumn('audio_path');
        });
    }
};
