<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'excerpt',
        'content',
        'image_path',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];
}
