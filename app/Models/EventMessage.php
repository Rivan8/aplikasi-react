<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventMessage extends Model
{
    protected $fillable = [
        'event_id',
        'title',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
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
