import { Head, Link, useForm } from '@inertiajs/react';
import { MoreHorizontal, Plus, Search, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { anggota } from '@/routes';

const avatarColors = ['bg-primary', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];

interface Member {
    id: number | string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
    status?: string;
    created_at?: string;
    joined?: string;
    member_detail?: {
        status_id?: number;
        department_id?: number;
        status?: { name: string };
        department?: { name: string };
    };
    [key: string]: any;
}

interface MembersData {
    data: Member[];
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
    prev_page_url?: string;
    next_page_url?: string;
}

interface Option {
    id: number;
    name: string;
}

export default function Anggota({ 
    members, 
    statuses = [], 
    departments = [] 
}: { 
    members: MembersData;
    statuses: Option[];
    departments: Option[];
}) {
    const users = members?.data || [];
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        status_id: '',
        department_id: '',
    });

    const handleEditClick = (member: Member) => {
        setSelectedMember(member);
        setData({
            status_id: member.member_detail?.status_id?.toString() || '',
            department_id: member.member_detail?.department_id?.toString() || '',
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        post(route('anggota.update-details', selectedMember.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
            },
        });
    };

    return (
        <>
            <Head title="Member List" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[1.75rem] font-bold tracking-tight text-foreground">Member List</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola status dan departemen pelayanan jemaat.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl border bg-card shadow-sm">
                    {/* Search Header */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Cari nama atau email..."
                                className="pl-10 bg-muted/30 border-border"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-muted-foreground bg-muted/30 border-b uppercase tracking-widest font-bold">
                                <tr>
                                    <th className="px-6 py-4">Nama Anggota</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Departemen</th>
                                    <th className="px-6 py-4">Tgl Bergabung</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            Tidak ada data atau koneksi ke database gagal.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => {
                                        const displayName = user.name || user.username || 'User ' + user.id;
                                        const displayEmail = user.email || 'No Email';
                                        const statusName = user.member_detail?.status?.name || '-';
                                        const deptName = user.member_detail?.department?.name || 'Belum';
                                        const dateJoined = user.created_at || user.joined || null;
                                        
                                        return (
                                            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs`}>
                                                            {displayName.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-foreground">{displayName}</div>
                                                            <div className="text-muted-foreground text-xs">{displayEmail}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        statusName === 'Volunteer' 
                                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                            : statusName === 'Jemaat'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {statusName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-foreground/80 font-medium">{deptName}</span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground font-medium">
                                                    {dateJoined ? new Date(dateJoined).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleEditClick(user)}
                                                    >
                                                        <Edit2 className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {members?.total > 0 && (
                        <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                            <div>Menampilkan {members.from} hingga {members.to} dari {members.total} entri</div>
                            <div className="flex gap-1">
                                {members.prev_page_url ? (
                                    <Link href={members.prev_page_url} className="px-3 py-1 border rounded-md hover:bg-muted/50">Sebelumnya</Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Sebelumnya</Button>
                                )}
                                {members.next_page_url ? (
                                    <Link href={members.next_page_url} className="px-3 py-1 border rounded-md hover:bg-muted/50">Selanjutnya</Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>Selanjutnya</Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Status & Departemen</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi pelayanan untuk {selectedMember?.name || selectedMember?.username}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status Anggota</Label>
                            <Select 
                                value={data.status_id} 
                                onValueChange={(value) => setData('status_id', value)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Pilih status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Belum Set</SelectItem>
                                    {statuses.map((s) => (
                                        <SelectItem key={s.id} value={s.id.toString()}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dept">Departemen Pelayanan</Label>
                            <Select 
                                value={data.department_id} 
                                onValueChange={(value) => setData('department_id', value)}
                            >
                                <SelectTrigger id="dept">
                                    <SelectValue placeholder="Pilih departemen..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Belum</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>
                                            {d.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

Anggota.layout = {
    breadcrumbs: [
        {
            title: 'Member List',
            href: anggota ? anggota() : '/anggota',
        },
    ],
};
