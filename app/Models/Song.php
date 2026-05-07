<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Song extends Model
{
    protected $fillable = [
        'title',
        'artist',
    ];

    /**
     * Get the arrangements for the song.
     */
    public function arrangements(): HasMany
    {
        return $this->hasMany(SongArrangement::class);
    }
}
