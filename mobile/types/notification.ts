export type MobileNotificationCategory = 'schedule_pending' | 'event_message';

export interface MobileNotification {
    id: number;
    title: string;
    description: string;
    body?: string;
    event_id?: number;
    category: MobileNotificationCategory;
    is_read: boolean;
    created_at: string;
}

export interface MobileNotificationList {
    data: MobileNotification[];
}
