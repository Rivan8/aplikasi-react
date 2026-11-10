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
  /** Topik/percakapan. Pesan dengan title sama digabung dalam satu thread. */
  title: string;
  body: string;
  /** Nama pengirim pesan, fallback "Admin" untuk pesan lama. */
  sender_name: string;
  attachment: MobileMessageAttachment | null;
  is_read: boolean;
  /** Waktu pengiriman pesan (ISO 8601). */
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
