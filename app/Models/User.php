<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'phone', 'password', 'member_id', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    public const ROLE_SUPER_ADMIN = 'superadmin';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_USER = 'user';

    public const ROLES = [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN, self::ROLE_USER];

    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The database connection that should be used by the model.
     *
     * @var string
     */
    protected $connection = 'mysql';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the member detail relationship.
     */
    public function member_detail()
    {
        return $this->hasOne(MemberDetail::class, 'member_id', 'member_id');
    }

    public function categoryRoles()
    {
        return $this->belongsToMany(CategoryRole::class, 'user_category_roles');
    }

    /**
     * Check if user is superadmin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    /**
     * Check if user is at least admin
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN], true);
    }

    /**
     * Check if user has specific role in a category
     *
     * @param string $categoryName
     * @param array|string $allowedRoles
     * @return bool
     */
    public function hasCategoryRole(string $categoryName, array|string $allowedRoles): bool
    {
        // Superadmin memiliki semua akses
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Admin memiliki akses penuh
        if ($this->role === 'admin') {
            return true;
        }

        // Periksa role berbasis kategori
        $categoryId = \App\Models\Category::where('name', $categoryName)->value('id');
        if (!$categoryId) return false;

        // Cek apakah user memiliki relasi dengan member_detail
        if (!$this->member_detail) {
            return false;
        }

        // Cek apakah user memiliki role yang diizinkan di kategori tersebut
        return $this->categoryRoles()
            ->where('category_id', $categoryId)
            ->whereIn('role_name', (array) $allowedRoles)
            ->exists();
    }
}
