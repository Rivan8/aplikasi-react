<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventRundownSegment extends Model
{
    protected $fillable = [
        'event_id',
        'title',
        'duration_seconds',
        'sort_order',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function items()
    {
        return $this->hasMany(EventRundownItem::class)->orderBy('sort_order');
    }

    public function runs()
    {
        return $this->hasMany(EventRundownSegmentRun::class);
    }
}
