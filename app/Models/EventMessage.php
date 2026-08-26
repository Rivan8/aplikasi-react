<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventMessage extends Model
{
    protected $fillable = [
        'event_id',
        'title',
        'body',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function reads()
    {
        return $this->hasMany(EventMessageRead::class);
    }
}
