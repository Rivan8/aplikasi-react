<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SongArrangement extends Model
{
    protected $fillable = [
        'song_id',
        'name',
        'duration',
        'bpm',
        'time_signature',
        'song_flow',
        'keys',
        'lyrics',
        'chords',
        'video_url',
        'pdf_path',
        'has_lyrics',
        'has_chords',
        'has_pdf',
        'has_audio',
    ];

    protected $casts = [
        'has_lyrics' => 'boolean',
        'has_chords' => 'boolean',
        'has_pdf' => 'boolean',
        'has_audio' => 'boolean',
    ];

    /**
     * Get the song that owns the arrangement.
     */
    public function song(): BelongsTo
    {
        return $this->belongsTo(Song::class);
    }
}
