import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft, Save, User } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
    id: string | number;
    name: string;
    email: string;
    member_detail?: {
        status_id: number | null;
        department_id: number | null;
    } | null;
}

interface Option {
    id: number;
    name: string;
}

export default function Edit({
    member,
    statuses = [],
    departments = []
}: {
    member: Member;
    statuses: Option[];
    departments: Option[];
}) {
    // Safety check for member
    if (!member) {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="text-center">
                    <h2 className="text-xl font-semibold">Data anggota tidak ditemukan</h2>
                    <Link href="/anggota" className="mt-4 text-primary hover:underline">
                        Kembali ke daftar anggota
                    </Link>
                </div>
            </div>
        );
    }

    const { data, setData, post, processing, errors } = useForm({
        status_id: member.member_detail?.status_id?.toString() || 'none',
        department_id: member.member_detail?.department_id?.toString() || 'none',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Use manual URL to avoid any Wayfinder issues for now
        post(`/anggota/${member.id}/update-details`, {
            onSuccess: () => toast.success('Data anggota berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui data anggota'),
        });
    };

    return (
        <>
            <Head title={`Edit Member - ${member.name || 'Unknown'}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href="/anggota">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Edit Member</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Perbarui status dan departemen pelayanan untuk {member.name || 'anggota'}.
                        </p>
                    </div>
                </div>

                <div className="max-w-2xl">
                    <form onSubmit={handleSubmit}>
                        <Card className="border bg-card shadow-sm">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle>{member.name || 'Unknown Member'}</CardTitle>
                                        <CardDescription>{member.email || 'Tidak ada email'}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status Keanggotaan</Label>
                                    <Select 
                                        value={data.status_id} 
                                        onValueChange={(value) => setData('status_id', value)}
                                    >
                                        <SelectTrigger id="status" className="bg-muted/30">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Belum ditentukan</SelectItem>
                                            {statuses.map((status) => (
                                                <SelectItem key={status.id} value={status.id.toString()}>
                                                    {status.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.status_id && <p className="text-xs text-destructive">{errors.status_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="department">Departemen Pelayanan</Label>
                                    <Select 
                                        value={data.department_id} 
                                        onValueChange={(value) => setData('department_id', value)}
                                    >
                                        <SelectTrigger id="department" className="bg-muted/30">
                                            <SelectValue placeholder="Pilih departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Belum ada departemen</SelectItem>
                                            {departments.map((dept) => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && <p className="text-xs text-destructive">{errors.department_id}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                                    <Link href="/anggota">
                                        <Button variant="ghost" type="button">Batal</Button>
                                    </Link>
                                    <Button type="submit" disabled={processing} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Simpan Perubahan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </>
    );
}
