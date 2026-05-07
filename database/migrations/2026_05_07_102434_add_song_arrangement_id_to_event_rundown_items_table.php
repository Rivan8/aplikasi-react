<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('event_rundown_items', function (Blueprint $table) {
            $table->foreignId('song_arrangement_id')->nullable()->after('song_id')->constrained()->onDelete('set null');
        });

        // Backfill existing items if they have a song_id
        $items = DB::table('event_rundown_items')->whereNotNull('song_id')->get();
        foreach ($items as $item) {
            $firstArrangement = DB::table('song_arrangements')
                ->where('song_id', $item->song_id)
                ->first();
            
            if ($firstArrangement) {
                DB::table('event_rundown_items')
                    ->where('id', $item->id)
                    ->update(['song_arrangement_id' => $firstArrangement->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_rundown_items', function (Blueprint $table) {
            $table->dropForeign(['song_arrangement_id']);
            $table->dropColumn('song_arrangement_id');
        });
    }
};
