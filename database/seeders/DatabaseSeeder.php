<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // \App\Models\User::factory()->count(10)->create();

        // $this->call([
        //     MemberManagementSeeder::class,
        //     SongSeeder::class,
        // ]);

        $this->call([
            MemberManagementSeeder::class,
            SongSeeder::class,
            RoleSeeder::class,
        ]);
    }
}