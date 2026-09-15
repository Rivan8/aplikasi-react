export type MobileNotificationCategory = 'schedule_pending' | 'event_message';

export interface MobileNotification {
    id: number;
    title: string;
    description: string;
    body?: string;
    assignment_id?: number;
    event_id?: number;
    response_status?: 'pending' | 'read' | 'accepted' | 'declined' | 'rejected' | string;
    category: MobileNotificationCategory;
    is_read: boolean;
    created_at: string;
}

export interface MobileNotificationList {
    data: MobileNotification[];
}
