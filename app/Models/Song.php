<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Song extends Model
{
    protected $fillable = [
        'title',
        'arrangement_name',
        'bpm',
        'keys',
        'last_scheduled_at',
        'has_lyrics',
        'has_chords',
        'has_pdf',
        'has_audio',
    ];

    protected $casts = [
        'last_scheduled_at' => 'datetime',
        'has_lyrics' => 'boolean',
        'has_chords' => 'boolean',
        'has_pdf' => 'boolean',
        'has_audio' => 'boolean',
    ];
}
