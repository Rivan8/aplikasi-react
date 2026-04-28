<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MemberStatus extends Model
{
    protected $fillable = ['name'];

    public function memberDetails()
    {
        return $this->hasMany(MemberDetail::class, 'status_id');
    }
}
