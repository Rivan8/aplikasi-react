<?php

namespace Database\Seeders;

use App\Models\MemberStatus;
use App\Models\Department;
use Illuminate\Database\Seeder;

class MemberManagementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statuses = ['Jemaat', 'Volunteer'];
        foreach ($statuses as $status) {
            MemberStatus::firstOrCreate(['name' => $status]);
        }

        $departments = ['Visual', 'Worship', 'Frontline', 'Security', 'Usher'];
        foreach ($departments as $dept) {
            Department::firstOrCreate(['name' => $dept]);
        }
    }
}
