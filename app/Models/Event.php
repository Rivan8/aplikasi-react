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

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
