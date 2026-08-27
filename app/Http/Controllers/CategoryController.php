<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryRole;
use App\Models\Department;
use App\Models\EventGroup;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('category/index', [
            'categories' => Category::with('roles.department')->get(),
            'groups' => EventGroup::orderBy('name')->get(),
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
            'group_name' => 'required|string|exists:event_groups,name',
            'roles' => 'required|array|min:1',
            'roles.*.department_id' => 'required|exists:departments,id',
            'roles.*.role_name' => 'required|string',
        ]);

        $category = Category::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'group_name' => $validated['group_name'],
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
            'group_name' => 'required|string|exists:event_groups,name',
            'roles' => 'required|array|min:1',
            'roles.*.department_id' => 'required|exists:departments,id',
            'roles.*.role_name' => 'required|string',
        ]);

        $category->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'group_name' => $validated['group_name'],
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

    public function duplicate(Category $category)
    {
        $baseName = $category->name . ' (Copy)';
        $copyName = $baseName;
        $copyNumber = 2;

        while (Category::where('name', $copyName)->exists()) {
            $copyName = $category->name . ' (Copy ' . $copyNumber . ')';
            $copyNumber++;
        }

        $copy = Category::create([
            'name' => $copyName,
            'group_name' => $category->group_name,
            'description' => $category->description,
        ]);

        foreach ($category->roles as $role) {
            $copy->roles()->create([
                'department_id' => $role->department_id,
                'role_name' => $role->role_name,
            ]);
        }

        return back()->with('success', 'Kategori berhasil disalin.');
    }

    public function storeGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:event_groups,name',
        ]);

        EventGroup::create($validated);

        return back()->with('success', 'Group berhasil dibuat.');
    }

    public function destroyGroup(EventGroup $eventGroup)
    {
        if (Category::where('group_name', $eventGroup->name)->exists()) {
            return back()->with('error', 'Group masih digunakan oleh kategori.');
        }

        $eventGroup->delete();

        return back()->with('success', 'Group berhasil dihapus.');
    }
}
