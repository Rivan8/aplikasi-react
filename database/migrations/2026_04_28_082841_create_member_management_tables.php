<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('member_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Jemaat, Volunteer, dll
            $table->timestamps();
        });

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Visual, Worship, Frontline, dll
            $table->timestamps();
        });

        Schema::create('member_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->unique(); // ID dari database eksternal
            $table->foreignId('status_id')->nullable()->constrained('member_statuses')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_details');
        Schema::dropIfExists('departments');
        Schema::dropIfExists('member_statuses');
    }
};
