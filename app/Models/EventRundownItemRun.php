<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventRundownItemRun extends Model
{
    protected $table = 'event_rundown_item_runs';

    protected $fillable = [
        'event_live_session_id',
        'event_rundown_item_id',
        'segment_index',
        'item_index',
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

    public function liveSession(): BelongsTo
    {
        return $this->belongsTo(EventLiveSession::class, 'event_live_session_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(EventRundownItem::class, 'event_rundown_item_id');
    }
}
