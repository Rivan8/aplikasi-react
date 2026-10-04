<?php

namespace App\Models;

use Carbon\Carbon;
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

    /**
     * Waktu selesai event: akhir sesi terakhir, atau date + time event jika tidak ada sesi.
     */
    public function latestEndDateTime(): ?Carbon
    {
        $latestSessionEnd = $this->sessions
            ->filter(fn (EventSession $session) => ($session->date ?? $this->date) && ($session->end_time || $session->start_time))
            ->map(fn (EventSession $session) => Carbon::parse(($session->date ?? $this->date).' '.($session->end_time ?? $session->start_time)))
            ->sort()
            ->last();

        if ($latestSessionEnd) {
            return $latestSessionEnd;
        }

        if ($this->date && $this->time) {
            return Carbon::parse($this->date.' '.$this->time);
        }

        return null;
    }

    /**
     * Event masih boleh dipilih untuk scan/monitor jika belum lewat grace period (default 3 jam) setelah selesai.
     * Event tanpa waktu terjadwal dianggap masih aktif.
     */
    public function isAttendanceWindowOpen(int $graceHours = 3): bool
    {
        $end = $this->latestEndDateTime();

        return $end === null || $end->copy()->addHours($graceHours)->isFuture();
    }
}
