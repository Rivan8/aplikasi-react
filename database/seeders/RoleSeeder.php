<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryRole;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Kategori sistem manajemen
        $systemCategory = Category::firstOrCreate([
            'name' => 'system_management',
            'description' => 'Kategori untuk manajemen sistem dan hak akses',
        ]);

        // Kategori events (jika belum ada)
        $eventsCategory = Category::firstOrCreate([
            'name' => 'events',
            'description' => 'Kategori untuk manajemen acara dan jadwal',
        ]);

        // Role untuk kategori system_management
        CategoryRole::firstOrCreate([
            'category_id' => $systemCategory->id,
            'department_id' => null,
            'role_name' => 'superadmin',
        ]);

        CategoryRole::firstOrCreate([
            'category_id' => $systemCategory->id,
            'department_id' => null,
            'role_name' => 'admin',
        ]);

        // Role untuk kategori events
        CategoryRole::firstOrCreate([
            'category_id' => $eventsCategory->id,
            'department_id' => null,
            'role_name' => 'event_creator',
        ]);

        CategoryRole::firstOrCreate([
            'category_id' => $eventsCategory->id,
            'department_id' => null,
            'role_name' => 'event_scheduler',
        ]);
    }
}