<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')
                ->nullable()
                ->after('role')
                ->constrained('roles')
                ->nullOnDelete();
        });

        $roles = Role::query()->whereNotNull('system_key')->pluck('id', 'system_key');

        foreach (User::query()->select(['id', 'role'])->cursor() as $user) {
            if ($roles->has($user->role)) {
                User::query()->whereKey($user->id)->update([
                    'role_id' => $roles->get($user->role),
                ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
        });
    }
};
