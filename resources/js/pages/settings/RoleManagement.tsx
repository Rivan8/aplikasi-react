import { router, useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import {
    Building2,
    KeyRound,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Category {
    id: number;
    name: string;
    roles: CategoryRole[];
}

interface CategoryRole {
    id: number;
    role_name: string;
    department?: {
        id: number;
        name: string;
    };
    category?: {
        name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    access_role_id: number | null;
    categoryRoles?: CategoryRole[];
    scheduling_departments?: Department[];
}

interface Department {
    id: number;
    name: string;
}

interface RoleCatalogItem {
    id: number;
    name: string;
    system_key: string | null;
    department?: Department | null;
}

export default function RoleManagement({
    categories = [],
    departments = [],
    users = [],
    role_catalog = [],
    can_manage_user_roles = false,
}: {
    categories: Category[];
    departments: Department[];
    users: User[];
    role_catalog: RoleCatalogItem[];
    can_manage_user_roles: boolean;
}) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [searchUser, setSearchUser] = useState('');
    const [globalRoleSearch, setGlobalRoleSearch] = useState('');
    const [departmentAccessSearch, setDepartmentAccessSearch] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        category_role_id: '',
    });
    const {
        data: departmentAccessData,
        setData: setDepartmentAccessData,
        post: postDepartmentAccess,
        processing: departmentAccessProcessing,
        errors: departmentAccessErrors,
    } = useForm({
        user_id: '',
        department_id: '',
    });
    const {
        data: roleData,
        setData: setRoleData,
        post: postRole,
        processing: roleProcessing,
        errors: roleErrors,
        reset: resetRole,
    } = useForm({
        name: '',
        department_id: '',
    });
    const {
        data: globalRoleData,
        setData: setGlobalRoleData,
        processing: globalRoleProcessing,
        errors: globalRoleErrors,
    } = useForm({
        user_id: '',
        role_id: '',
    });

    const filteredUsers = useMemo(() => {
        const query = searchUser.trim().toLowerCase();

        return users
            .filter(
                (user) =>
                    !query ||
                    user.name?.toLowerCase().includes(query) ||
                    user.email?.toLowerCase().includes(query),
            )
            .sort((first, second) => first.name.localeCompare(second.name));
    }, [searchUser, users]);

    const eligibleDepartmentUsers = useMemo(() => {
        const query = departmentAccessSearch.trim().toLowerCase();

        return users
            .filter(
                (user) =>
                    user.role === 'user' &&
                    (!query ||
                        user.name.toLowerCase().includes(query) ||
                        user.email.toLowerCase().includes(query)),
            )
            .sort((first, second) => first.name.localeCompare(second.name));
    }, [departmentAccessSearch, users]);

    const globalRoleUsers = useMemo(() => {
        const query = globalRoleSearch.trim().toLowerCase();

        return users
            .filter(
                (user) =>
                    !query ||
                    user.name.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query),
            )
            .sort((first, second) => first.name.localeCompare(second.name));
    }, [globalRoleSearch, users]);

    const availableRoles = useMemo(() => {
        if (!selectedCategory) {
            return [];
        }

        const category = categories.find((c) => c.id === selectedCategory);

        return category ? category.roles : [];
    }, [selectedCategory, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/roles/assign');
    };

    const handleDepartmentAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postDepartmentAccess('/settings/department-access', {
            onSuccess: () =>
                setDepartmentAccessData({ user_id: '', department_id: '' }),
        });
    };

    const handleRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postRole('/settings/roles', {
            preserveScroll: true,
            onSuccess: () => {
                resetRole();
                toast.success('Role berhasil ditambahkan.');
            },
            onError: (formErrors) => {
                const message = Object.values(formErrors)[0];
                toast.error(
                    typeof message === 'string'
                        ? message
                        : 'Role gagal ditambahkan.',
                );
            },
        });
    };

    const handleGlobalRoleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!globalRoleData.user_id || !globalRoleData.role_id) {
            toast.error('Pilih pengguna dan role terlebih dahulu.');

            return;
        }

        router.patch(
            `/settings/users/${globalRoleData.user_id}/role`,
            {
                role_id: globalRoleData.role_id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setGlobalRoleData({ user_id: '', role_id: '' });
                    toast.success('Role pengguna berhasil diperbarui.');
                },
                onError: (formErrors) => {
                    const message = Object.values(formErrors)[0];
                    toast.error(
                        typeof message === 'string'
                            ? message
                            : 'Role gagal diperbarui.',
                    );
                },
            },
        );
    };

    return (
        <div className="w-full min-w-0 space-y-7 px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
            <Head title="Manajemen Peran" />
            <header className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.12] via-card to-card p-5 shadow-sm sm:p-7 lg:p-9">
                <div className="absolute -top-24 -right-10 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-36 left-1/3 -z-10 size-80 rounded-full bg-primary/[0.06] blur-3xl" />
                <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                            <ShieldCheck className="size-7" />
                        </div>
                        <div>
                            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                                Pusat Administrasi
                            </p>
                            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                                Kelola Hak Akses
                            </h1>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                Atur role dan izin pengguna dalam satu tempat.
                                Cari akun dengan cepat, lalu tentukan akses
                                global, kategori, atau penjadwalan departemen.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 xl:min-w-[22rem]">
                        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <KeyRound className="size-4" />
                            </div>
                            <p className="mt-4 text-3xl font-black tracking-tight">
                                {role_catalog.length}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                Role tersedia
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/70 bg-background/80 p-4 backdrop-blur-sm">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Building2 className="size-4" />
                            </div>
                            <p className="mt-4 text-3xl font-black tracking-tight">
                                {departments.length}
                            </p>
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                Departemen
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="w-full space-y-7">
                <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.07] via-muted/20 to-transparent px-5 py-5 sm:px-7">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <KeyRound className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">
                                    Katalog Role
                                </CardTitle>
                                <CardDescription>
                                    Buat dan tinjau role yang dapat diberikan
                                    kepada pengguna.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 p-4 sm:p-7">
                        <form
                            onSubmit={handleRoleSubmit}
                            className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2 sm:items-end xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="new-role-name">
                                    Nama role baru
                                </Label>
                                <Input
                                    id="new-role-name"
                                    value={roleData.name}
                                    onChange={(event) =>
                                        setRoleData('name', event.target.value)
                                    }
                                    placeholder="Contoh: Koordinator Visual"
                                    maxLength={100}
                                    className="h-11 bg-background"
                                />
                                {roleErrors.name && (
                                    <p className="text-xs text-destructive">
                                        {roleErrors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-role-department">
                                    Hubungkan ke departemen
                                </Label>
                                <Select
                                    value={roleData.department_id || 'none'}
                                    onValueChange={(value) =>
                                        setRoleData(
                                            'department_id',
                                            value === 'none' ? '' : value,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="new-role-department"
                                        className="h-11 bg-background"
                                    >
                                        <SelectValue placeholder="Pilih departemen (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Tidak dikaitkan dulu
                                        </SelectItem>
                                        {departments.map((department) => (
                                            <SelectItem
                                                key={department.id}
                                                value={department.id.toString()}
                                            >
                                                {department.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {roleErrors.department_id && (
                                    <p className="text-xs text-destructive">
                                        {roleErrors.department_id}
                                    </p>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={
                                    roleProcessing || !roleData.name.trim()
                                }
                                className="h-11 gap-2 px-5 sm:col-span-2 sm:justify-self-end xl:col-span-1"
                            >
                                <Plus className="size-4" />
                                {roleProcessing
                                    ? 'Menyimpan...'
                                    : 'Tambah role'}
                            </Button>
                        </form>

                        <div className="overflow-hidden rounded-2xl border">
                            <div className="hidden grid-cols-[1.2fr_1fr_120px] gap-4 bg-muted/50 px-5 py-3 text-xs font-bold tracking-wider text-muted-foreground uppercase sm:grid">
                                <span>Nama role</span>
                                <span>Departemen</span>
                                <span className="text-right">Tipe</span>
                            </div>
                            <div className="divide-y">
                                {role_catalog.map((role) => (
                                    <div
                                        key={role.id}
                                        className="grid gap-2 px-5 py-4 transition-colors hover:bg-muted/20 sm:grid-cols-[1.2fr_1fr_120px] sm:items-center sm:gap-4"
                                    >
                                        <span className="font-semibold">
                                            {role.name}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {role.department?.name ??
                                                'Belum dikaitkan'}
                                        </span>
                                        <span className="sm:text-right">
                                            {role.system_key ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="rounded-full px-3"
                                                >
                                                    Bawaan
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-full px-3"
                                                >
                                                    Kustom
                                                </Badge>
                                            )}
                                        </span>
                                    </div>
                                ))}
                                {role_catalog.length === 0 && (
                                    <div className="px-5 py-12 text-center">
                                        <KeyRound className="mx-auto size-8 text-muted-foreground/40" />
                                        <p className="mt-3 font-semibold">
                                            Belum ada role
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Tambahkan role pertama melalui
                                            formulir di atas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {can_manage_user_roles && (
                    <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
                        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-blue-500/[0.07] via-muted/20 to-transparent px-5 py-5 sm:px-7">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <Users className="size-5" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-bold">
                                        Hak Akses Global
                                    </CardTitle>
                                    <CardDescription>
                                        Tetapkan satu role utama untuk akun
                                        pengguna yang dipilih.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-7">
                            <form
                                onSubmit={handleGlobalRoleSubmit}
                                className="grid gap-5 rounded-2xl border bg-muted/10 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-end"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="global-role-user-search">
                                        Pengguna
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="global-role-user-search"
                                            type="search"
                                            autoComplete="off"
                                            aria-label="Cari pengguna berdasarkan nama atau email"
                                            placeholder="Ketik nama atau email pengguna..."
                                            value={globalRoleSearch}
                                            onChange={(event) =>
                                                setGlobalRoleSearch(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 bg-background pl-9"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {globalRoleUsers.length} dari{' '}
                                        {users.length} pengguna ditemukan
                                    </p>
                                    <Select
                                        value={globalRoleData.user_id}
                                        onValueChange={(userId) => {
                                            setGlobalRoleData(
                                                'user_id',
                                                userId,
                                            );
                                            setGlobalRoleSearch('');
                                        }}
                                    >
                                        <SelectTrigger className="h-11 bg-background">
                                            <SelectValue placeholder="Pilih pengguna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {globalRoleUsers.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {globalRoleUsers.length === 0 && (
                                                <SelectItem
                                                    value="no-matching-global-role-users"
                                                    disabled
                                                >
                                                    Tidak ada pengguna yang
                                                    cocok.
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {globalRoleErrors.user_id && (
                                        <p className="text-xs text-destructive">
                                            {globalRoleErrors.user_id}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="global-role-select">
                                        Role yang diberikan
                                    </Label>
                                    <Select
                                        value={globalRoleData.role_id}
                                        onValueChange={(roleId) =>
                                            setGlobalRoleData('role_id', roleId)
                                        }
                                    >
                                        <SelectTrigger
                                            id="global-role-select"
                                            className="h-11 bg-background"
                                        >
                                            <SelectValue placeholder="Pilih role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {role_catalog.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.id.toString()}
                                                >
                                                    {role.name}
                                                    {role.department
                                                        ? ` — ${role.department.name}`
                                                        : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {globalRoleErrors.role_id && (
                                        <p className="text-xs text-destructive">
                                            {globalRoleErrors.role_id}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={
                                        globalRoleProcessing ||
                                        !globalRoleData.user_id ||
                                        !globalRoleData.role_id
                                    }
                                    className="h-11 gap-2 px-5 lg:w-auto"
                                >
                                    <ShieldCheck className="size-4" />
                                    {globalRoleProcessing
                                        ? 'Menyimpan...'
                                        : 'Tetapkan'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>

            {can_manage_user_roles && (
                <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-gradient-to-r from-emerald-500/[0.07] via-muted/20 to-transparent px-5 py-5 sm:px-7">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold">
                                    Pengaturan Akses Lanjutan
                                </CardTitle>
                                <CardDescription>
                                    Kelola peran pelayanan dan izin penjadwalan
                                    sesuai kebutuhan pengguna.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 p-4 sm:p-7">
                        <section className="space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">
                                        Penugasan role kategori
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Pilih pengguna, kategori, dan peran
                                        pelayanan yang sesuai.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 rounded-2xl border bg-muted/10 p-4 sm:p-5"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="category-user-search">
                                        Pengguna
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="category-user-search"
                                            type="search"
                                            autoComplete="off"
                                            aria-label="Cari pengguna berdasarkan nama atau email"
                                            placeholder="Ketik nama atau email pengguna..."
                                            value={searchUser}
                                            onChange={(e) =>
                                                setSearchUser(e.target.value)
                                            }
                                            className="h-11 bg-background pl-9"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {filteredUsers.length} dari{' '}
                                        {users.length} pengguna ditemukan
                                    </p>
                                    <Select
                                        value={data.user_id}
                                        onValueChange={(val) => {
                                            setData('user_id', val);
                                            setSearchUser('');
                                        }}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih pengguna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredUsers.map((user) => (
                                                <SelectItem
                                                    key={user.id}
                                                    value={user.id.toString()}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {user.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <SelectItem
                                                    value="no-matching-category-users"
                                                    disabled
                                                >
                                                    Tidak ada pengguna yang
                                                    cocok.
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.user_id && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {errors.user_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Kategori</Label>
                                    <Select
                                        onValueChange={(val) =>
                                            setSelectedCategory(parseInt(val))
                                        }
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">Peran</Label>
                                    <Select
                                        value={data.category_role_id}
                                        onValueChange={(val) =>
                                            setData('category_role_id', val)
                                        }
                                        disabled={!selectedCategory}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Pilih peran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableRoles.map((role) => (
                                                <SelectItem
                                                    key={role.id}
                                                    value={role.id.toString()}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {role.role_name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {role.department
                                                                ?.name ??
                                                                'Semua departemen'}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category_role_id && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {errors.category_role_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        !data.user_id ||
                                        !data.category_role_id
                                    }
                                    className="h-10 px-6"
                                >
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Tambahkan Peran'}
                                </Button>
                            </div>
                        </form>

                        <section className="space-y-5 border-t pt-7">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Hak Penjadwalan Departemen
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Pilih satu departemen dan satu orang.
                                        Hak hanya diberikan kepada akun yang
                                        dipilih; pengguna lain tidak otomatis
                                        mendapat akses.
                                    </p>
                                </div>
                            </div>
                            <form
                                onSubmit={handleDepartmentAccessSubmit}
                                className="grid gap-4 rounded-2xl border bg-muted/10 p-4 sm:grid-cols-2 sm:items-end sm:p-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="department-access-department">
                                        Departemen
                                    </Label>
                                    <Select
                                        value={
                                            departmentAccessData.department_id
                                        }
                                        onValueChange={(value) =>
                                            setDepartmentAccessData(
                                                'department_id',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger id="department-access-department">
                                            <SelectValue placeholder="Pilih departemen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((department) => (
                                                <SelectItem
                                                    key={department.id}
                                                    value={department.id.toString()}
                                                >
                                                    {department.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {departmentAccessErrors.department_id && (
                                        <p className="text-xs text-destructive">
                                            {
                                                departmentAccessErrors.department_id
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department-access-user">
                                        Nama Pengguna
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="department-access-user-search"
                                            type="search"
                                            autoComplete="off"
                                            aria-label="Cari pengguna berdasarkan nama atau email"
                                            placeholder="Ketik nama atau email pengguna..."
                                            value={departmentAccessSearch}
                                            onChange={(event) =>
                                                setDepartmentAccessSearch(
                                                    event.target.value,
                                                )
                                            }
                                            className="h-11 bg-background pl-9"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {eligibleDepartmentUsers.length} dari{' '}
                                        {
                                            users.filter(
                                                (user) => user.role === 'user',
                                            ).length
                                        }{' '}
                                        pengguna yang dapat diberi akses
                                    </p>
                                    <Select
                                        value={departmentAccessData.user_id}
                                        onValueChange={(value) => {
                                            setDepartmentAccessData(
                                                'user_id',
                                                value,
                                            );
                                            setDepartmentAccessSearch('');
                                        }}
                                    >
                                        <SelectTrigger id="department-access-user">
                                            <SelectValue placeholder="Pilih nama pengguna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {eligibleDepartmentUsers.map(
                                                (user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={user.id.toString()}
                                                    >
                                                        {user.name} (
                                                        {user.email})
                                                    </SelectItem>
                                                ),
                                            )}
                                            {eligibleDepartmentUsers.length ===
                                                0 && (
                                                <SelectItem
                                                    value="no-matching-users"
                                                    disabled
                                                >
                                                    Tidak ada pengguna yang
                                                    cocok.
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {departmentAccessErrors.user_id && (
                                        <p className="text-xs text-destructive">
                                            {departmentAccessErrors.user_id}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-end sm:col-span-2 xl:col-span-1">
                                    <Button
                                        type="submit"
                                        className="h-11 w-full xl:w-auto"
                                        disabled={
                                            departmentAccessProcessing ||
                                            !departmentAccessData.user_id ||
                                            !departmentAccessData.department_id
                                        }
                                    >
                                        {departmentAccessProcessing
                                            ? 'Menyimpan...'
                                            : 'Berikan Hak'}
                                    </Button>
                                </div>
                            </form>

                            <div className="overflow-hidden rounded-lg border">
                                <div className="hidden grid-cols-[1fr_1fr_auto] gap-4 bg-muted/50 px-4 py-3 text-sm font-semibold md:grid">
                                    <span>Departemen</span>
                                    <span>Nama Pengguna</span>
                                    <span className="text-right">Aksi</span>
                                </div>
                                {users.flatMap((user) =>
                                    (user.scheduling_departments ?? []).map(
                                        (department) => (
                                            <div
                                                key={`${user.id}-${department.id}`}
                                                className="grid gap-2 border-t px-4 py-3 first:border-t-0 md:grid-cols-[1fr_1fr_auto] md:items-center md:gap-4"
                                            >
                                                <span className="font-medium">
                                                    {department.name}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {user.name} ({user.email})
                                                </span>
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        aria-label={`Cabut hak ${department.name} dari ${user.name}`}
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            router.delete(
                                                                `/settings/users/${user.id}/departments/${department.id}`,
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Cabut Hak
                                                    </Button>
                                                </div>
                                            </div>
                                        ),
                                    ),
                                )}
                                {users.every(
                                    (user) =>
                                        (user.scheduling_departments?.length ??
                                            0) === 0,
                                ) && (
                                    <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Belum ada pengguna dengan akses
                                        penjadwalan departemen.
                                    </p>
                                )}
                            </div>
                        </section>

                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-semibold">
                                Daftar Peran yang Sudah Ditugaskan
                            </h3>
                            <div className="space-y-4">
                                {users
                                    .filter(
                                        (user) =>
                                            (user.categoryRoles?.length ?? 0) >
                                            0,
                                    )
                                    .map((user) => (
                                        <div
                                            key={user.id}
                                            className="rounded-lg border bg-muted/30 p-4"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-medium">
                                                        {user.name}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {user.categoryRoles?.map(
                                                        (role) => (
                                                            <Badge
                                                                key={role.id}
                                                                variant="secondary"
                                                                className="px-2 py-1 text-xs"
                                                            >
                                                                {role.role_name}{' '}
                                                                (
                                                                {
                                                                    role
                                                                        .category
                                                                        ?.name
                                                                }
                                                                )
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <p className="text-sm text-muted-foreground">
                            Admin dapat mengelola daftar role. Pengaturan role
                            akun tetap hanya untuk superadmin.
                        </p>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
