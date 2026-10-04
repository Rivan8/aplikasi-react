import { Link } from '@inertiajs/react';
import { ClipboardList, TableProperties } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReportTabs({ active }: { active: 'proses' | 'detail' }) {
    const baseClass =
        'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors';
    const activeClass = 'bg-primary text-primary-foreground shadow-sm';
    const inactiveClass = 'text-muted-foreground hover:bg-muted hover:text-foreground';

    return (
        <div className="flex w-fit gap-1 rounded-lg border bg-muted/30 p-1">
            <Link
                href="/attendance-history"
                className={cn(baseClass, active === 'proses' ? activeClass : inactiveClass)}
            >
                <ClipboardList className="h-4 w-4" />
                Laporan Proses
            </Link>
            <Link
                href="/attendance-history/detail"
                className={cn(baseClass, active === 'detail' ? activeClass : inactiveClass)}
            >
                <TableProperties className="h-4 w-4" />
                Laporan Detail
            </Link>
        </div>
    );
}
