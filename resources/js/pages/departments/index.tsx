import { Head, useForm } from '@inertiajs/react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

interface Department {
    id: number;
    name: string;
}

export default function Departments({ departments }: { departments: Department[] }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        post('/departments', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingDepartment) {
            return;
        }

        put(`/departments/${editingDepartment.id}`, {
            onSuccess: () => {
                setEditingDepartment(null);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus departemen ini?')) {
            destroy(`/departments/${id}`);
        }
    };

    return (
        <>
            <Head title="Kelola Departemen" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Departemen Pelayanan</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola daftar departemen yang tersedia untuk jemaat.
                        </p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Departemen
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari departemen..."
                                className="pl-10 bg-muted/30 border-border"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-muted-foreground bg-muted/30 border-b uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nama Departemen</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                                            Belum ada departemen yang ditambahkan.
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept) => (
                                        <tr key={dept.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">
                                                {dept.name}
                                            </td>
                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingDepartment(dept);
                                                        setData('name', dept.name);
                                                    }}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(dept.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Departemen</DialogTitle>
                        <DialogDescription>Masukkan nama departemen pelayanan baru.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Departemen</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Contoh: Kids, Media, Usher..."
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Tambah</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Departemen</DialogTitle>
                        <DialogDescription>Ubah nama departemen pelayanan.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nama Departemen</Label>
                            <Input
                                id="edit-name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                autoFocus
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingDepartment(null)}>Batal</Button>
                            <Button type="submit" disabled={processing}>Simpan Perubahan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
