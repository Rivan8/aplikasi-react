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
        // 1. Create song_arrangements table
        Schema::create('song_arrangements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained()->onDelete('cascade');
            $table->string('name')->default('Default Arrangement');
            $table->string('duration')->nullable(); // length: 4:21
            $table->string('bpm')->nullable();
            $table->string('time_signature')->nullable(); // meter: 4/4
            $table->text('song_flow')->nullable(); // sequence
            $table->string('keys')->nullable();
            $table->text('lyrics')->nullable();
            $table->text('chords')->nullable();
            $table->string('video_url')->nullable();
            $table->string('pdf_path')->nullable();
            $table->boolean('has_lyrics')->default(false);
            $table->boolean('has_chords')->default(false);
            $table->boolean('has_pdf')->default(false);
            $table->boolean('has_audio')->default(false);
            $table->timestamps();
        });

        // 2. Add artist column to songs
        Schema::table('songs', function (Blueprint $table) {
            $table->string('artist')->nullable()->after('title');
        });

        // 3. Move existing data
        $songs = DB::table('songs')->get();
        foreach ($songs as $song) {
            DB::table('song_arrangements')->insert([
                'song_id' => $song->id,
                'name' => 'Default Arrangement',
                'bpm' => $song->bpm,
                'time_signature' => $song->time_signature,
                'song_flow' => $song->song_flow,
                'keys' => $song->keys,
                'lyrics' => $song->lyrics,
                'chords' => $song->chords,
                'video_url' => $song->video_url,
                'pdf_path' => $song->pdf_path,
                'has_lyrics' => $song->has_lyrics,
                'has_chords' => $song->has_chords,
                'has_pdf' => $song->has_pdf,
                'has_audio' => $song->has_audio,
                'created_at' => $song->created_at,
                'updated_at' => $song->updated_at,
            ]);

            // Update song artist from arrangement_name (which was previously used as artist)
            DB::table('songs')->where('id', $song->id)->update([
                'artist' => $song->arrangement_name
            ]);
        }

        // 4. Clean up songs table
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn([
                'arrangement_name', 'bpm', 'song_flow', 'time_signature', 
                'keys', 'has_lyrics', 'has_chords', 'has_pdf', 'has_audio',
                'lyrics', 'chords', 'video_url', 'pdf_path'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add columns to songs
        Schema::table('songs', function (Blueprint $table) {
            $table->string('arrangement_name')->nullable();
            $table->string('bpm')->nullable();
            $table->text('song_flow')->nullable();
            $table->string('time_signature')->nullable();
            $table->string('keys')->nullable();
            $table->boolean('has_lyrics')->default(false);
            $table->boolean('has_chords')->default(false);
            $table->boolean('has_pdf')->default(false);
            $table->boolean('has_audio')->default(false);
            $table->text('lyrics')->nullable();
            $table->text('chords')->nullable();
            $table->string('video_url')->nullable();
            $table->string('pdf_path')->nullable();
        });

        // Restore data from FIRST arrangement of each song
        $arrangements = DB::table('song_arrangements')->orderBy('id')->get()->groupBy('song_id');
        foreach ($arrangements as $songId => $songArrangements) {
            $first = $songArrangements->first();
            $song = DB::table('songs')->where('id', $songId)->first();
            
            DB::table('songs')->where('id', $songId)->update([
                'arrangement_name' => $song->artist, // In reverse, artist goes back to arrangement_name
                'bpm' => $first->bpm,
                'song_flow' => $first->song_flow,
                'time_signature' => $first->time_signature,
                'keys' => $first->keys,
                'has_lyrics' => $first->has_lyrics,
                'has_chords' => $first->has_chords,
                'has_pdf' => $first->has_pdf,
                'has_audio' => $first->has_audio,
                'lyrics' => $first->lyrics,
                'chords' => $first->chords,
                'video_url' => $first->video_url,
                'pdf_path' => $first->pdf_path,
            ]);
        }

        Schema::dropIfExists('song_arrangements');
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('artist');
        });
    }
};
