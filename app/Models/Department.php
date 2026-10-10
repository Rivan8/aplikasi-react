<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql';

    protected $fillable = ['name'];

    public function memberDetails()
    {
        return $this->hasMany(MemberDetail::class, 'department_id');
    }

    public function schedulingUsers()
    {
        return $this->belongsToMany(User::class, 'user_department_accesses');
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }
}
