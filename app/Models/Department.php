<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name'];

    public function memberDetails()
    {
        return $this->hasMany(MemberDetail::class, 'department_id');
    }
}
