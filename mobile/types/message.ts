export interface MobileMessageAttachment {
  url: string;
  name: string | null;
  mime: string | null;
  size: number | null;
}

export interface MobileMessage {
  id: number;
  event_id: number;
  event_title: string | null;
  title: string;
  body: string;
  attachment: MobileMessageAttachment | null;
  is_read: boolean;
  created_at: string | null;
}

export interface MobileMessagePage {
  data: MobileMessage[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
