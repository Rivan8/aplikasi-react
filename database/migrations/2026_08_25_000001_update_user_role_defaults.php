<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->change();
        });

        DB::table('users')->where('role', 'jemaat')->update(['role' => 'user']);
    }

    public function down(): void
    {
        DB::table('users')->where('role', 'user')->update(['role' => 'jemaat']);

        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('jemaat')->change();
        });
    }
};
