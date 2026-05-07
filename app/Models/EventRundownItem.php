<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRundownItem extends Model
{
    protected $fillable = [
        'event_rundown_segment_id',
        'song_id',
        'song_arrangement_id',
        'title',
        'duration_seconds',
        'sort_order',
    ];

    public function song()
    {
        return $this->belongsTo(Song::class);
    }

    public function arrangement()
    {
        return $this->belongsTo(SongArrangement::class, 'song_arrangement_id');
    }

    public function segment()
    {
        return $this->belongsTo(EventRundownSegment::class, 'event_rundown_segment_id');
    }
}
