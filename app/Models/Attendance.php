<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql';

    protected $fillable = [
        'event_id',
        'event_session_id',
        'member_id',
        'scan_time',
        'check_out_time',
        'status',
    ];

    protected $casts = [
        'scan_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function session()
    {
        return $this->belongsTo(EventSession::class, 'event_session_id');
    }
}
