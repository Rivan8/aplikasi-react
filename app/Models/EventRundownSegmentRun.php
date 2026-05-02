<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRundownSegmentRun extends Model
{
    protected $fillable = [
        'event_live_session_id',
        'event_rundown_segment_id',
        'segment_index',
        'title',
        'planned_seconds',
        'actual_seconds',
        'overrun_seconds',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function liveSession()
    {
        return $this->belongsTo(EventLiveSession::class, 'event_live_session_id');
    }

    public function segment()
    {
        return $this->belongsTo(EventRundownSegment::class, 'event_rundown_segment_id');
    }
}
