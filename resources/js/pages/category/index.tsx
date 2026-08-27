import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, useForm } from '@inertiajs/react';
import { Copy, Edit2, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CategoryRole {
    id: number;
    category_id: number;
    department_id: number;
    role_name: string;
    department?: {
        id: number;
        name: string;
    };
}

interface Category {
    id: number;
    name: string;
    group_name: string;
    description: string;
    roles: CategoryRole[];
}

interface EventGroup {
    id: number;
    name: string;
}

interface Department {
    id: number;
    name: string;
}

export default function CategoryIndex({ categories, departments, groups }: { categories: Category[], departments: Department[], groups: EventGroup[] }) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupName, setGroupName] = useState('');

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        group_name: '',
        description: '',
        roles: [{ department_id: '', role_name: '' }]
    });
    const groupForm = useForm({ name: '' });

    const openCreateModal = () => {
        reset();
        setEditingCategory(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            group_name: category.group_name || '',
            description: category.description || '',
            roles: category.roles.map(r => ({
                department_id: String(r.department_id),
                role_name: r.role_name
            }))
        });
        setIsCreateModalOpen(true);
    };

    const addRoleField = () => {
        setData('roles', [...data.roles, { department_id: '', role_name: '' }]);
    };

    const removeRoleField = (index: number) => {
        const newRoles = [...data.roles];
        newRoles.splice(index, 1);
        setData('roles', newRoles);
    };

    const handleRoleChange = (index: number, field: string, value: string) => {
        const newRoles = [...data.roles];
        newRoles[index] = { ...newRoles[index], [field]: value };
        setData('roles', newRoles);
    };

    // Helper to group roles by department for display
    const groupedRoles = (roles: CategoryRole[]) => {
        const groups: { [key: string]: CategoryRole[] } = {};
        roles.forEach(role => {
            const deptName = role.department?.name || 'Unknown';
            if (!groups[deptName]) groups[deptName] = [];
            groups[deptName].push(role);
        });
        return groups;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting category data:', data);

        if (editingCategory) {
            put(`/categories/${editingCategory.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('Kategori berhasil diperbarui');
                    reset();
                },
                onError: (err) => {
                    console.error('Update category error:', err);
                    toast.error('Gagal memperbarui kategori. Periksa kembali inputan Anda.');
                }
            });
        } else {
            post('/categories', {
                preserveScroll: true,
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    toast.success('Kategori berhasil dibuat');
                    reset();
                },
                onError: (err) => {
                    console.error('Create category error:', err);
                    toast.error('Gagal membuat kategori. Periksa kembali inputan Anda.');
                }
            });
        }
    };

    const deleteCategory = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
            destroy(`/categories/${id}`, {
                onSuccess: () => toast.success('Kategori berhasil dihapus')
            });
        }
    };

    const duplicateCategory = (category: Category) => {
        if (confirm(`Salin kategori ${category.name} beserta template volunteernya?`)) {
            post(`/categories/${category.id}/duplicate`, {
                preserveScroll: true,
                onSuccess: () => toast.success('Kategori berhasil disalin'),
            });
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <Head title="Kategori Event & Volunteer" />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Kategori Event</h1>
                    <p className="text-muted-foreground">Kelola kategori event dan template penugasan volunteer.</p>
                </div>
                <Button onClick={openCreateModal} className="gap-2">
                    <Plus className="w-4 h-4" /> Tambah Kategori
                </Button>
                <Button variant="outline" onClick={() => setIsGroupModalOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Kelola Group
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <Card key={category.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle>{category.name}</CardTitle>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">{category.group_name || 'Umum'}</p>
                                    <CardDescription>{category.description || 'Tidak ada deskripsi'}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" title="Salin kategori" onClick={() => duplicateCategory(category)}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory(category.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    Template Volunteer ({category.roles.length})
                                </div>
                                <div className="space-y-3">
                                    {Object.entries(groupedRoles(category.roles)).map(([deptName, roles], idx) => (
                                        <div key={idx} className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase text-primary/70">{deptName}</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {roles.map((role, rIdx) => (
                                                    <div key={rIdx} className="bg-muted/50 px-2 py-0.5 rounded text-[11px] border border-border/50">
                                                        {role.role_name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Event'}</DialogTitle>
                        <DialogDescription>
                            Tentukan nama kategori dan daftar penugasan volunteer yang akan otomatis muncul saat membuat event.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Kategori</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Contoh: Ibadah, Seminar, Kelas"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Keterangan singkat kategori"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="group_name">Group Kategori</Label>
                                <Select value={data.group_name} onValueChange={value => setData('group_name', value)}>
                                    <SelectTrigger id="group_name"><SelectValue placeholder="Pilih group yang sudah dibuat" /></SelectTrigger>
                                    <SelectContent>{groups.map(group => <SelectItem key={group.id} value={group.name}>{group.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {errors.group_name && <p className="text-xs text-destructive">{errors.group_name}</p>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-base font-bold">Template Penugasan Volunteer</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addRoleField} className="gap-2">
                                    <Plus className="w-4 h-4" /> Tambah Peran
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {data.roles.map((role, index) => (
                                    <div key={index} className="flex gap-3 items-end bg-muted/30 p-3 rounded-lg border group relative">
                                        <div className="grid flex-[2] gap-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Departemen</Label>
                                            <Select
                                                value={role.department_id}
                                                onValueChange={val => handleRoleChange(index, 'department_id', val)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Pilih Departemen" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {departments.map(dept => (
                                                        <SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid flex-[3] gap-1.5">
                                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Nama Peran / Posisi</Label>
                                            <Input
                                                value={role.role_name}
                                                onChange={e => handleRoleChange(index, 'role_name', e.target.value)}
                                                placeholder="Contoh: WL 1, Drummer, Resolume"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-muted-foreground hover:text-primary"
                                                onClick={() => {
                                                    const newRoles = [...data.roles];
                                                    newRoles.splice(index + 1, 0, { ...role });
                                                    setData('roles', newRoles);
                                                }}
                                                title="Duplikat"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-destructive"
                                                onClick={() => removeRoleField(index)}
                                                disabled={data.roles.length === 1}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>{editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Kelola Group Event</DialogTitle>
                        <DialogDescription>Buat group terlebih dahulu, lalu pilih group saat membuat kategori.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={event => { event.preventDefault(); groupForm.post('/event-groups', { onSuccess: () => { groupForm.reset(); setIsGroupModalOpen(false); } }); }} className="space-y-4">
                        <div className="space-y-2"><Label htmlFor="new-group-name">Nama Group</Label><Input id="new-group-name" value={groupForm.data.name} onChange={event => groupForm.setData('name', event.target.value)} placeholder="Contoh: Ibadah Mingguan" required />{groupForm.errors.name && <p className="text-xs text-destructive">{groupForm.errors.name}</p>}</div>
                        <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Group tersedia</p>{groups.length > 0 ? groups.map(group => <div key={group.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"><span>{group.name}</span><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(`Hapus group ${group.name}?`)) destroy(`/event-groups/${group.id}`); }}><Trash2 className="h-3.5 w-3.5" /></Button></div>) : <p className="text-sm text-muted-foreground">Belum ada group.</p>}</div>
                        <DialogFooter><Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(false)}>Tutup</Button><Button type="submit" disabled={groupForm.processing}>Buat Group</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
