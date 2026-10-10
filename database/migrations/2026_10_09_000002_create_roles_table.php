<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('system_key')->nullable()->unique();
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        $now = now();
        DB::table('roles')->insert([
            [
                'name' => 'Super Admin',
                'system_key' => 'superadmin',
                'department_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Admin',
                'system_key' => 'admin',
                'department_id' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
