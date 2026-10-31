import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const SHOW_DELAY = 150;
const MIN_VISIBLE = 450;

export default function PageLoader() {
    const [visible, setVisible] = useState(false);
    const showTimer = useRef<number | null>(null);
    const hideTimer = useRef<number | null>(null);
    const visibleSince = useRef(0);

    useEffect(() => {
        const clearShowTimer = () => {
            if (showTimer.current !== null) {
                window.clearTimeout(showTimer.current);
                showTimer.current = null;
            }
        };

        const hide = () => {
            clearShowTimer();

            if (hideTimer.current !== null) {
                window.clearTimeout(hideTimer.current);
            }

            const elapsed = Date.now() - visibleSince.current;

            hideTimer.current = window.setTimeout(() => {
                setVisible(false);
                hideTimer.current = null;
            }, Math.max(0, MIN_VISIBLE - elapsed));
        };

        const unsubscribeStart = router.on('start', (event) => {
            const visit = event.detail.visit;

            // Lewati prefetch dan partial reload (pencarian/filter) agar tidak berkedip
            if (visit.prefetch || visit.showProgress === false || visit.only.length > 0) {
                return;
            }

            if (hideTimer.current !== null) {
                window.clearTimeout(hideTimer.current);
                hideTimer.current = null;
            }

            clearShowTimer();

            showTimer.current = window.setTimeout(() => {
                visibleSince.current = Date.now();
                setVisible(true);
                showTimer.current = null;
            }, SHOW_DELAY);
        });

        const unsubscribeFinish = router.on('finish', hide);
        const unsubscribeError = router.on('error', hide);
        const unsubscribeCancel = router.on('cancel', hide);

        return () => {
            clearShowTimer();

            if (hideTimer.current !== null) {
                window.clearTimeout(hideTimer.current);
            }

            unsubscribeStart();
            unsubscribeFinish();
            unsubscribeError();
            unsubscribeCancel();
        };
    }, []);

    return (
        <div
            role="status"
            aria-live="polite"
            aria-hidden={!visible}
            className={cn(
                'fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-300 ease-out',
                visible ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
        >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

            <div
                className={cn(
                    'relative flex flex-col items-center gap-6 transition-all duration-300 ease-out',
                    visible ? 'translate-y-0 scale-100' : 'translate-y-1 scale-95',
                )}
            >
                <span className="absolute -top-16 size-64 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative flex size-28 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-primary/15" />
                    <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary border-r-primary/40 [animation-duration:1.1s] motion-reduce:animate-none" />
                    <span className="absolute inset-1.5 rounded-full bg-primary/5" />
                    <span className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-white shadow-lg shadow-orange-950/10 dark:border-border dark:bg-card dark:shadow-black/50">
                        <img
                            src="/images/myesc plan.png"
                            alt="MYESC Plan"
                            draggable={false}
                            className="size-14 object-contain"
                        />
                    </span>
                </div>

                <div className="flex flex-col items-center gap-2.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Memuat halaman
                    </span>
                    <span className="h-1 w-40 overflow-hidden rounded-full bg-primary/15">
                        <span className="page-loader-sweep block h-full w-1/2 rounded-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
                    </span>
                </div>
            </div>
        </div>
    );
}
