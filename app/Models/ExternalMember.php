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
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'idjemaat';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The data type of the primary key.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Disable insert/update timestamps if the external table doesn't have them
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     * (Empty because this is read-only)
     */
    protected $guarded = ['*'];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['id', 'name', 'joined'];

    /**
     * Map 'idjemaat' to 'id' for the frontend.
     */
    public function getIdAttribute()
    {
        return $this->idjemaat;
    }

    /**
     * Map 'namalengkap' to 'name' for the frontend.
     */
    public function getNameAttribute()
    {
        return $this->namalengkap;
    }

    /**
     * Map 'tanggalinsert' to 'joined' for the frontend.
     */
    public function getJoinedAttribute()
    {
        return $this->tanggalinsert;
    }

    public function member_detail()
    {
        return $this->hasOne(MemberDetail::class, 'member_id', 'idjemaat');
    }
}
