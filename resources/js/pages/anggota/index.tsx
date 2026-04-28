import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head, Link, router } from '@inertiajs/react';
import { Edit2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    departments = [],
    filters = { search: '' }
}: {
    members: MembersData;
    statuses: Option[];
    departments: Option[];
    filters?: { search: string };
}) {
    const users = members?.data || [];
    const [search, setSearch] = useState(filters?.search || '');

    // Handle search logic
    useEffect(() => {
        const timeout = setTimeout(() => {
            // Jika search kosong dan sebelumnya ada filter, atau jika search berubah
            if (search !== (filters?.search || '')) {
                router.get(
                    '/anggota',
                    { search },
                    {
                        preserveState: true,
                        replace: true,
                        only: ['members', 'filters'] // Hanya update data members dan filters
                    }
                );
            }
        }, 300); // Kurangi debounce ke 300ms agar lebih responsif

        return () => clearTimeout(timeout);
    }, [search]);

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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                                        const statusId = user.member_detail?.status_id;
                                        const departmentId = user.member_detail?.department_id;
                                        const statusName =
                                            user.member_detail?.status?.name ||
                                            (statusId != null
                                                ? statuses.find((s) => String(s.id) === String(statusId))?.name
                                                : null) ||
                                            user.status ||
                                            '-';
                                        const deptName =
                                            user.member_detail?.department?.name ||
                                            (departmentId != null
                                                ? departments.find((d) => String(d.id) === String(departmentId))?.name
                                                : null) ||
                                            'Belum';
                                        const dateJoined = user.created_at || user.joined || null;

                                        return (
                                            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-full ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white font-bold text-xs`}>
                                                            {displayName?.charAt(0).toUpperCase() || '?'}
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
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                        deptName === 'Belum'
                                                            ? 'bg-muted text-muted-foreground'
                                                            : 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                                                    }`}>
                                                        {deptName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground font-medium">
                                                    {dateJoined && !isNaN(Date.parse(dateJoined)) ? new Date(dateJoined).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Link
                                                        href={`/anggota/${user.id}/edit`}
                                                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Edit
                                                    </Link>
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

        </>
    );
}
