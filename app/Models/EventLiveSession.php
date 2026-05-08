<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventLiveSession extends Model
{
    protected $fillable = [
        'event_id',
        'status',
        'current_segment_index',
        'current_item_index',
        'started_at',
        'segment_started_at',
        'item_started_at',
        'finished_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'segment_started_at' => 'datetime',
        'item_started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function runs()
    {
        return $this->hasMany(EventRundownSegmentRun::class)->orderBy('segment_index');
    }

    public function itemRuns()
    {
        return $this->hasMany(EventRundownItemRun::class)->orderBy('segment_index')->orderBy('item_index');
    }
}
