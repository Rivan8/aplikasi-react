import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-orange-200 bg-white p-0.5 shadow-sm shadow-orange-900/10">
                <AppLogoIcon className="size-6 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-bold tracking-tight">
                    ESC Planning Center
                </span>
                <span className="truncate text-[10px] font-medium leading-tight text-sidebar-foreground/50">
                    Operational Center
                </span>
            </div>
        </>
    );
}
