<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql';

    protected $fillable = [
        'title',
        'date',
        'time',
        'attendance_start_time',
        'location',
        'address',
        'category',
        'attendance_type',
        'total_sessions',
        'expected',
        'image_path',
        'training_schedules',
        'other_schedules',
    ];

    protected $casts = [
        'training_schedules' => 'array',
        'other_schedules' => 'array',
    ];

    public function volunteers()
    {
        return $this->hasMany(EventVolunteer::class);
    }

    public function rundownSegments()
    {
        return $this->hasMany(EventRundownSegment::class)->orderBy('sort_order');
    }

    public function liveSession()
    {
        return $this->hasOne(EventLiveSession::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function sessions()
    {
        return $this->hasMany(EventSession::class)->orderBy('session_number');
    }

    public function participants()
    {
        return $this->hasMany(EventParticipant::class);
    }

    public function messages()
    {
        return $this->hasMany(EventMessage::class)->latest();
    }
}
