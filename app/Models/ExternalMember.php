<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Foundation\Auth\User as Authenticatable;

class ExternalMember extends Authenticatable
{
    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'myesc_db';

    /**
     * The table associated with the model.
     * User can change this to 'anggota', 'tbl_member' or whatever the real table name is.
     */
    protected $table = 'jemaat';

    /**
     * Disable insert/update timestamps if the external table doesn't have them
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     * (Empty because this is read-only)
     */
    protected $guarded = ['*'];

    public function member_detail()
    {
        return $this->hasOne(MemberDetail::class, 'member_id', 'id');
    }
}
