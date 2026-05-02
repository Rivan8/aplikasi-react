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
        'location',
        'address',
        'category',
        'expected',
        'image_path',
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
}
