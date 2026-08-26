<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventMessageRead extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'event_message_id',
        'user_id',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];
}
