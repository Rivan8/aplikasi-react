<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRundownItem extends Model
{
    protected $fillable = [
        'event_rundown_segment_id',
        'title',
        'duration_seconds',
        'sort_order',
    ];

    public function segment()
    {
        return $this->belongsTo(EventRundownSegment::class, 'event_rundown_segment_id');
    }
}
