<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('roles')->insertOrIgnore([
            'name' => 'User',
            'system_key' => 'user',
            'department_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('roles')->where('system_key', 'user')->delete();
    }
};
