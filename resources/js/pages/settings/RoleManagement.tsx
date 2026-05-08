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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Head } from '@inertiajs/react';

interface Category {
    id: number;
    name: string;
    roles: CategoryRole[];
}

interface CategoryRole {
    id: number;
    role_name: string;
    department: {
        id: number;
        name: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    member_detail: {
        id: number;
        status_id: number;
        department_id: number;
    } | null;
}

export default function RoleManagement({
    categories = [],
    users = [],
}: {
    categories: Category[];
    users: User[];
}) {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchUser, setSearchUser] = useState('');

    const { data, setData, post, reset, processing, errors } = useForm({
        user_id: '',
        category_role_id: '',
    });

    const filteredUsers = useMemo(() => {
        return users.filter((user) =>
            (user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchUser.toLowerCase()))
        ).slice(0, 50);
    }, [searchUser, users]);

    const availableRoles = useMemo(() => {
        if (!selectedCategory) return [];
        const category = categories.find(c => c.id === selectedCategory);
        return category ? category.roles : [];
    }, [selectedCategory, categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.roles.assign'));
    };

    return (
        <div className="container mx-auto p-6">
            <Head title="Manajemen Peran" />
            <Card className="border-none shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        Manajemen Peran Kategori
                    </CardTitle>
                    <CardDescription>
                        Atur peran pengguna untuk berbagai kategori sistem
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="user">Pengguna</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="user"
                                        placeholder="Cari nama/email..."
                                        value={searchUser}
                                        onChange={(e) => setSearchUser(e.target.value)}
                                        className="pl-9 h-10"
                                    />
                                </div>
                                <Select
                                    value={data.user_id}
                                    onValueChange={(val) => setData('user_id', val)}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Pilih pengguna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && (
                                    <p className="text-destructive text-xs mt-1">
                                        {errors.user_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select
                                    onValueChange={(val) => setSelectedCategory(parseInt(val))}
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
                                    onValueChange={(val) => setData('category_role_id', val)}
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
                                                        {role.department.name}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_role_id && (
                                    <p className="text-destructive text-xs mt-1">
                                        {errors.category_role_id}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={processing || !data.user_id || !data.category_role_id}
                                className="h-10 px-6"
                            >
                                {processing ? 'Menyimpan...' : 'Tambahkan Peran'}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">
                            Daftar Peran yang Sudah Ditugaskan
                        </h3>
                        <div className="space-y-4">
                            {users
                                .filter(user => user.member_detail?.categoryRoles?.length > 0)
                                .map((user) => (
                                    <div
                                        key={user.id}
                                        className="border rounded-lg p-4 bg-muted/30"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{user.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {user.member_detail?.categoryRoles?.map((role) => (
                                                    <Badge
                                                        key={role.id}
                                                        variant="secondary"
                                                        className="text-xs px-2 py-1"
                                                    >
                                                        {role.role_name} ({role.category?.name})
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-muted-foreground">
                        Hanya superadmin dan admin yang dapat mengakses halaman ini
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}