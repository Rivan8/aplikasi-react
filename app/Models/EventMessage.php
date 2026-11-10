<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventMessage extends Model
{
    protected $fillable = [
        'event_id',
        'sender_id',
        'title',
        'body',
        'attachment_path',
        'attachment_name',
        'attachment_mime',
        'attachment_size',
    ];

    protected $appends = [
        'sender_name',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function getSenderNameAttribute(): string
    {
        return $this->sender?->name ?: 'Admin';
    }

    public function reads()
    {
        return $this->hasMany(EventMessageRead::class);
    }
}
