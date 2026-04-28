<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}
