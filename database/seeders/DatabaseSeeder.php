<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@attendance.com'],
            [
                'name' => 'Admin Attendance',
                'password' => bcrypt('password'),
            ]
        );

        $this->call([
            MemberManagementSeeder::class,
        ]);
    }
}
