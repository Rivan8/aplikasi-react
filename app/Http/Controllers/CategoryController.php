<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('category/index', [
            'categories' => Category::with('roles.department')->get(),
            'departments' => Department::all(),
            'breadcrumbs' => [
                ['title' => 'Kategori Event', 'href' => '/categories'],
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories,name',
            'description' => 'nullable|string',
            'roles' => 'required|array|min:1',
            'roles.*.department_id' => 'required|exists:departments,id',
            'roles.*.role_name' => 'required|string',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        foreach ($validated['roles'] as $role) {
            CategoryRole::create([
                'category_id' => $category->id,
                'department_id' => $role['department_id'],
                'role_name' => $role['role_name'],
            ]);
        }

        return back()->with('success', 'Kategori dan template volunteer berhasil dibuat.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'roles' => 'required|array|min:1',
            'roles.*.department_id' => 'required|exists:departments,id',
            'roles.*.role_name' => 'required|string',
        ]);

        $category->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
        ]);

        // Sederhananya, hapus peran lama dan buat yang baru
        $category->roles()->delete();

        foreach ($validated['roles'] as $role) {
            CategoryRole::create([
                'category_id' => $category->id,
                'department_id' => $role['department_id'],
                'role_name' => $role['role_name'],
            ]);
        }

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return back()->with('success', 'Kategori berhasil dihapus.');
    }
}
