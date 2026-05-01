<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventVolunteer extends Model
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql';

    protected $fillable = [
        'event_id',
        'role_category',
        'role_name',
        'member_id',
        'response_status',
        'response_reason',
        'responded_at',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function member()
    {
        return $this->belongsTo(ExternalMember::class, 'member_id', 'idjemaat');
    }
}
