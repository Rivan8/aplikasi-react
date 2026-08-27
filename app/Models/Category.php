<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'description', 'group_name'];

    public function roles(): HasMany
    {
        return $this->hasMany(CategoryRole::class);
    }

    public function group()
    {
        return $this->belongsTo(EventGroup::class, 'group_name', 'name');
    }
}
