<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('db:migrate-sqlite-to-mysql', function () {
    $this->info('Starting migration from SQLite to MySQL...');

    $tables = [
        'users' => \App\Models\User::class,
        'events' => \App\Models\Event::class,
        'attendances' => \App\Models\Attendance::class,
        'member_statuses' => \App\Models\MemberStatus::class,
        'departments' => \App\Models\Department::class,
        'member_details' => \App\Models\MemberDetail::class,
        'event_volunteers' => \App\Models\EventVolunteer::class,
    ];

    foreach ($tables as $tableName => $modelClass) {
        $this->info("Migrating table: {$tableName}...");
        
        try {
            // Get data from SQLite
            $data = \DB::connection('sqlite')->table($tableName)->get();
            
            if ($data->isEmpty()) {
                $this->warn("No data found in SQLite table: {$tableName}");
                continue;
            }

            // Insert into MySQL
            \DB::connection('mysql')->table($tableName)->truncate();
            
            foreach ($data as $row) {
                $arrayData = (array) $row;
                \DB::connection('mysql')->table($tableName)->insert($arrayData);
            }
            
            $this->info("Successfully migrated " . $data->count() . " rows for {$tableName}.");
        } catch (\Exception $e) {
            $this->error("Failed to migrate {$tableName}: " . $e->getMessage());
        }
    }

    $this->info('Migration completed successfully!');
})->purpose('Migrate data from SQLite to MySQL');

Artisan::command('db:migrate-sqlite-to-mysql', function () {
    $this->info('Starting migration from SQLite to MySQL...');

    $tables = [
        'users' => \App\Models\User::class,
        'events' => \App\Models\Event::class,
        'attendances' => \App\Models\Attendance::class,
        'member_statuses' => \App\Models\MemberStatus::class,
        'departments' => \App\Models\Department::class,
        'member_details' => \App\Models\MemberDetail::class,
        'event_volunteers' => \App\Models\EventVolunteer::class,
    ];

    foreach ($tables as $tableName => $modelClass) {
        $this->info("Migrating table: {$tableName}...");
        
        try {
            // Get data from SQLite
            $data = \DB::connection('sqlite')->table($tableName)->get();
            
            if ($data->isEmpty()) {
                $this->warn("No data found in SQLite table: {$tableName}");
                continue;
            }

            // Insert into MySQL
            \DB::connection('mysql')->table($tableName)->truncate();
            
            foreach ($data as $row) {
                $arrayData = (array) $row;
                \DB::connection('mysql')->table($tableName)->insert($arrayData);
            }
            
            $this->info("Successfully migrated " . $data->count() . " rows for {$tableName}.");
        } catch (\Exception $e) {
            $this->error("Failed to migrate {$tableName}: " . $e->getMessage());
        }
    }

    $this->info('Migration completed successfully!');
})->purpose('Migrate data from SQLite to MySQL');
