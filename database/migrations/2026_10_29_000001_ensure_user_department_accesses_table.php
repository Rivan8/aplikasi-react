<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mengamankan tabel pivot akses departemen. Di sebagian server, migrasi
     * pembuatnya sudah tercatat di tabel migrations sehingga `migrate` tidak
     * menjalankan apa pun, padahal tabelnya belum ada.
     */
    public function up(): void
    {
        if (Schema::hasTable('user_department_accesses')) {
            return;
        }

        Schema::create('user_department_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'department_id']);
        });
    }

    public function down(): void
    {
        // Sengaja tidak menghapus tabel: migrasi ini hanya memastikan tabel ada
        // dan bisa saja tabel tersebut sudah dibuat oleh migrasi sebelumnya.
    }
};
